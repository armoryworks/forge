# CI/CD Design

How source code becomes a running deployment. Optimized for the actual constraints of this project: solo operator, single Raspberry Pi production host, open-source GitHub repos, no users currently impatient for fixes.

## Goal

A repeatable, auditable pipeline from `git push` on a sibling repo to a running container on the Pi, with deploy authority retained on the Pi itself.

## Constraints that shaped the design

- **Single-host Pi (ARM64)** -- no orchestration, no horizontal scaling. `docker compose up -d` is the deployment surface.
- **Solo operator** -- no review gates, no approval workflows. But: deliberate "verify before pushing the button" friction is a feature, not a tax.
- **Open-source repos** -- public on GitHub, free unlimited Actions minutes, free GHCR bandwidth. But: workflow code triggered by PRs cannot run on hardware we own.
- **Pi behind NAT** -- no inbound network from GitHub. All Pi-side flows must originate from the Pi.
- **No live users** -- the cost of a deferred deploy is zero. The cost of an unverified deploy is non-zero.

## Architecture overview

```
qb-engineer-server  ─┐
                     │   GH Actions (ubuntu-24.04-arm)
qb-engineer-ui      ─┼─▶ test → buildx → push to GHCR
                     │   tags: sha-<short>, latest
qb-engineer-deploy  ─┘
                            │
                            ▼
              ghcr.io/danielhokanson/qb-engineer-{server,ui}
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │ Raspberry Pi (production host)        │
         │  qb-deploy CLI (operator-initiated)   │
         │   ▶ docker compose pull               │
         │   ▶ docker compose up -d              │
         │   ▶ poll /api/v1/health               │
         │   ▶ rollback on failure               │
         └──────────────────────────────────────┘
```

Two clean halves:
- **GitHub Actions builds and publishes images.** No deploy step.
- **The Pi pulls and deploys when the operator runs `qb-deploy`.** No GH Actions runner on the Pi.

## Image registry: GHCR

`ghcr.io/danielhokanson/qb-engineer-server` and `ghcr.io/danielhokanson/qb-engineer-ui`. Image name matches repo name -- the convention `${{ github.repository }}` already encodes in the existing `release.yml` workflows.

Why GHCR:
- Free, unlimited bandwidth for public images
- Lives on the same GitHub orgs as the source repos -- no third-party account
- Native multi-arch manifest support (same tag transparently serves AMD64 to dev laptops and ARM64 to the Pi)
- Pi pulls with no auth (public images); CI pushes with `${{ secrets.GITHUB_TOKEN }}`

`qb-engineer-deploy` does **not** publish a Docker image. It ships compose files, scripts, and the `qb-deploy` CLI -- consumed by `git clone` at a tag, not `docker pull`.

## Image tagging strategy

Multiple tags from one push, each with a different purpose. The existing `release.yml` workflows already encode this via `docker/metadata-action`:

| Tag pattern | When pushed | What it's for |
|---|---|---|
| `main-<git-short-sha>` | every push to `main` | Immutable, reproducible. The Pi always pulls one of these, never `latest`. |
| `latest` | every push to `main` (floats) | Convenience for `docker pull` exploration on dev machines. **Never used by the Pi.** |
| `<X.Y.Z>` | when a git tag matching `v*.*.*` is pushed | Pinned semver release. Used by customer deploys via the release manifest (see below). |
| `<X.Y>` | same | Floating minor. Customer deploys can pin to a minor stream and get patches automatically. |
| `<X>` | same | Floating major. Used rarely; bigger drift surface. |

**The encoded best practice:** deployments reference immutable tags, humans reference floating tags. Floating tags drift; binding production to one is the most common foot-gun in CI/CD. The Pi's `qb-deploy` always resolves to either a `main-<sha>` or a fully-pinned `<X.Y.Z>` -- never `latest`.

## Two release tracks

This project has two parallel release models that should not be conflated:

- **Head-of-main deploys** -- what `qb-deploy` handles. Operator deploys the latest CI-built image (`main-<sha>`) when ready. No formal release; just "what's currently shipping on the Pi." This is the everyday flow for the solo operator.
- **Customer releases** -- governed by [release-manifest.md](../release-manifest.md). Each row pairs tested versions across `qb-engineer-server`, `qb-engineer-ui`, `qb-engineer-deploy`, and `qb-engineer-test`. Cohosted customers pin to a master tag and get a vetted bundle. `qb-deploy` can also deploy these when given a `<X.Y.Z>` tag instead of a `main-<sha>`, but the act of *creating* the release is manual (tagging each sibling, updating the manifest).

The `qb-engineer-deploy` repo's `release.yml` reflects this split: it triggers only on `v*.*.*` tag pushes and creates a GitHub release with auto-generated notes. It does **not** build an image.

## CI: GitHub Actions per source repo

Both `qb-engineer-server` and `qb-engineer-ui` already ship `release.yml` workflows that handle GHCR publishing. The Phase 2 work *adapts* those, doesn't replace them. Two real gaps to close:

1. **Multi-arch builds.** Existing workflows build `linux/amd64` only (default for `ubuntu-latest`). The Pi needs `linux/arm64`.
2. **Test gating.** Existing workflows push images regardless of test status -- the `ci.yml` workflow runs in parallel and a failure there doesn't stop the image push.

Adapted shape:

- **Runner:** `ubuntu-24.04-arm` (native ARM64; free for public repos)
- **QEMU emulation** for `linux/amd64` via `docker/setup-qemu-action`. Slower than native amd64 (~25 min vs ~10 min), but keeps the workflow simple. If amd64 build time becomes painful, refactor to a matrix (one job per arch) and merge manifests in a final job.
- **Test gate:** an inline `dotnet test` step (server) or `npm test` step (ui) before the build. Adds a few minutes to release runs but ensures broken commits never produce an image.
- **Triggers:** unchanged (`push` to main + `v*.*.*` tags).
- **Tags:** unchanged (handled by `docker/metadata-action` -- see the strategy table above).

`qb-engineer-deploy` keeps its existing release-on-tag workflow and gains no Docker image build (it has none).

## CD: the `qb-deploy` CLI on the Pi

A single bash script (~150 lines), versioned in `qb-engineer-deploy/scripts/qb-deploy`, installed on the Pi at `/usr/local/bin/qb-deploy`.

### Commands

```
qb-deploy                       # interactive: shows last 5 builds, asks which to deploy
qb-deploy --service api         # deploy only api (or --service ui, --service all)
qb-deploy sha-abc1234           # deploy a specific SHA (any service or with --service)
qb-deploy --list                # list last N tags available in GHCR
qb-deploy --status              # current deployed SHA per service + container health
qb-deploy --rollback            # re-pin to the previously deployed SHA
qb-deploy --logs                # tail the deploy history log
qb-deploy --self-update         # git pull qb-engineer-deploy and re-install
```

### Tag discovery

Source of truth: GHCR API. `qb-deploy --list` queries the GHCR REST endpoint for available tags on `qb-engineer-server` and `qb-engineer-ui`, filters to `main-*` tags by default (and shows `<X.Y.Z>` tags when invoked with `--releases`), sorts by image push timestamp.

This is more accurate than querying GitHub for recent commits, because a build can fail tests and never produce an image -- listing commits would surface SHAs that have no deployable artifact. It also means `qb-deploy` works even if the source repos are temporarily unreachable.

### State management

`/etc/qb-engineer/deploy-state.json` -- created on first run with `0600` permissions, owned by the deploy user.

```json
{
  "qb-engineer-server": {
    "current": "main-abc1234",
    "prior":   "main-9f8e7d6",
    "deployedAt": "2026-04-26T22:14:33Z"
  },
  "qb-engineer-ui": { ... }
}
```

Used by `--rollback` (re-pin to `prior`), `--status` (current snapshot), and the deploy flow itself (saving prior on success).

### Deploy flow (per service)

1. Resolve target tag (from CLI arg or interactive prompt).
2. Verify the tag exists in GHCR (HEAD against the manifest URL).
3. Update the operative `.env` to set `SERVER_IMAGE_TAG=<tag>` (or `UI_IMAGE_TAG`).
4. `docker compose -f docker-compose.yml -f docker-compose.prod.yml pull <service>`
5. `docker compose ... up -d <service>`
6. Poll `/api/v1/health` (or container healthcheck for ui) for up to 60s.
7. **On healthy:** update state file (`prior` <- old `current`, `current` <- new tag), append to log, exit 0.
8. **On unhealthy:** revert `.env` to prior tag, `docker compose up -d <service>`, append failure to log, exit 1.

Logs append to `/var/log/qb-engineer-deploy.log`. Format: `<iso8601> <service> <from-tag> -> <to-tag> <outcome>`.

### Self-update

`qb-deploy --self-update`:
1. `git -C /opt/qb-engineer-deploy pull --ff-only`
2. Re-run `scripts/install-qb-deploy.sh` to copy the latest script to `/usr/local/bin/`.
3. Refuses to run if the deploy repo has uncommitted changes (would be ignoring local work).

### Installation

`qb-engineer-deploy/scripts/install-qb-deploy.sh`:
1. Install `qb-deploy` to `/usr/local/bin/qb-deploy` (mode `0755`).
2. Create `/etc/qb-engineer/` (mode `0750`, owned by deploy user).
3. Create `/etc/qb-engineer/deploy-state.json` if missing.
4. Touch `/var/log/qb-engineer-deploy.log` (mode `0644`).
5. Verify `docker`, `docker compose`, `curl`, `jq` are available on the Pi.

## Compose split for prod

Local dev keeps the existing `build:` directives. Prod adds an overlay that swaps `build:` for `image:`.

`docker-compose.prod.yml` (lives in `qb-engineer-deploy`):

```yaml
services:
  qb-engineer-api:
    image: ghcr.io/danielhokanson/qb-engineer-server:${SERVER_IMAGE_TAG:-latest}
    build: !reset null
  qb-engineer-ui:
    image: ghcr.io/danielhokanson/qb-engineer-ui:${UI_IMAGE_TAG:-latest}
    build: !reset null
```

The compose service is still `qb-engineer-api` (matches the existing service name and container_name); only the underlying image source changes.

Pi invocation: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.

Local dev invocation (unchanged): `docker compose up -d --build`.

## Security model

- **No inbound network to the Pi.** Pi only makes outbound HTTPS to `ghcr.io` and `github.com`.
- **No GH Actions runner on the Pi.** Eliminates the public-OSS-repo workflow-code threat surface.
- **GHCR images are public**, pulled anonymously. No registry credentials stored on the Pi.
- **CI pushes use `${{ secrets.GITHUB_TOKEN }}`**, scoped to the source repo and the matching package.
- **Deploy user on the Pi is unprivileged**, with a tightly-scoped `sudoers` rule for `docker compose` against the qb-engineer compose project only.
- **Deploy state and log files are owned by the deploy user**, mode `0640` for state, `0644` for log.

## Rollback

`qb-deploy --rollback` reads `prior` from `/etc/qb-engineer/deploy-state.json` and runs the deploy flow against that SHA. The `prior` field is updated only on successful deploys, so two consecutive bad deploys cannot lose the last-known-good SHA.

If `prior` is null (first deploy), `--rollback` errors out with a clear message.

## Out of scope for v1

These are deferred deliberately. Each is easy to add later when there's a real motivation.

- **Auto-deploy.** Same `qb-deploy` is cron-callable. Add `qb-deploy --latest --auto-confirm` and a cron entry when there are users impatient for fixes.
- **Deploy history endpoint.** A `/api/v1/admin/build` endpoint returning current SHA and deployedAt is straightforward, but no user-facing surface needs it today.
- **Slack/email notifications on deploy failure.** Log file is sufficient for solo operation.
- **Blue-green or canary deploys.** Single-host Pi makes this overkill.
- **Database migration gating.** Migrations run on API container start; if a migration fails, the API container is unhealthy and `qb-deploy` rolls back automatically. A dedicated migration job is unnecessary at current scale.

## Implementation order

| Phase | Deliverable | Repo |
|---|---|---|
| 1 | This design doc | `qb-engineer` (meta) |
| 2 | Adapt existing `release.yml` -- ARM64 runner + multi-arch + test gate | `qb-engineer-server` |
| 3 | `qb-deploy` CLI + install script | `qb-engineer-deploy` |
| 4 | `docker-compose.prod.yml` overlay | `qb-engineer-deploy` |
| 5 | Pi bring-up: install `qb-deploy`, do a real deploy | (operational) |
| 6 | Same `release.yml` adaptation for ui | `qb-engineer-ui` |
| 7 | Add Pi-side guard to `refresh.ps1`/`refresh.sh`; document setup vs. refresh vs. qb-deploy roles | `qb-engineer-deploy` |

Phase 7 specifically: `setup.ps1`/`setup.sh` keep their first-time-bootstrap role on the dev side. `refresh.ps1`/`refresh.sh` -- the proxy CICD scripts -- get retired entirely on the Pi (replaced by `qb-deploy`) but keep their dev-loop role on workstations. Naming may need to drift to make the distinction clearer (e.g., `dev-refresh.ps1`).

## Open questions

- **Versioning the meta repo and the deploy repo.** Right now they're on `main` only. If we ever cohost a customer who pins to a specific qb-engineer release, both repos likely want semver tags too. Out of scope until that customer exists.
- **Pi disk pressure.** Each deploy leaves a previous image on disk. `docker image prune --filter "until=720h"` (30 days) on a weekly cron handles this without manual intervention. Worth adding to the install script.
- **Migrating off the Pi.** If the production host ever moves from a Pi to a VM/cloud host, only the build runner choice changes (drop the explicit ARM64 target if no longer needed). The CD half is host-agnostic.

## Phase 3+4 addendum (2026-04-28)

Decisions made while implementing the CLI and prod overlay that the
original design didn't pin down. None of these change the architecture;
they're just the small calls that needed making.

- **Test image (`qb-engineer-test`) is wired in the CLI from day one.** The
  design doc predates the test-site decision and only mentions
  `server` and `ui`. The CLI lists/deploys/rolls-back the third image
  identically; the prod compose overlay carries it as a commented-out
  block (uncommented when Phase 6's test-site `release.yml` lands and the
  base compose grows a `qb-engineer-test` service). This avoids a churn
  pass through the CLI later.
- **Healthcheck mapping per service:**
  - `api` -- HTTP probe to `http://127.0.0.1:${API_PORT}/api/v1/health`
    (port read from the operative `.env`, default 5000). This is the
    documented health endpoint and is reachable from the Pi without any
    container shell hop.
  - `ui` -- container's own `HEALTHCHECK` (nginx wget `:80/`). Already
    defined in `qb-engineer-ui/Dockerfile`; `qb-deploy` reads the
    container's `State.Health.Status` via `docker inspect`.
  - `test` -- same approach as ui (container `HEALTHCHECK`). The
    test-site Dockerfile owns the specific probe; the CLI is agnostic.
- **Tag-format regexes (committed):**
  - `^main-[a-f0-9]{7}$` for SHA tags (matches `docker/metadata-action`
    `format=short` output exactly).
  - `^[0-9]+\.[0-9]+\.[0-9]+$` for semver release tags.
  - Anything else (including `latest`, `<X.Y>`, `<X>`) is rejected with
    a clear error pointing the operator at `qb-deploy --list`.
- **GHCR auth path:** anonymous bearer token via
  `https://ghcr.io/token?service=ghcr.io&scope=repository:<owner>/<repo>:pull`,
  then `Authorization: Bearer ...` against `/v2/.../tags/list` and
  `HEAD /v2/.../manifests/<tag>`. Public-image-friendly; no Pi-side
  credentials.
- **State file lives at `/etc/qb-engineer/deploy-state.json`** (0640,
  owned by deploy user). Three image entries (server, ui, test) are
  pre-created so jq updates don't have to handle a missing key.
- **Dev defaults for image tags are `latest`.** `qb-deploy` refuses to
  *deploy* `latest`, but the prod compose still needs a default value
  so `docker compose config` validates cleanly even when no `.env` is
  present. Belt-and-suspenders: production never reaches that default
  because qb-deploy pins an immutable tag before invoking compose.

## Phase 7 addendum (2026-04-28)

Phase 7 was the closing cleanup: now that GHCR-built images flow to the
Pi via `qb-deploy`, the legacy `refresh.{sh,ps1}` proxy scripts have no
role on the Pi. The original design tentatively suggested a rename
(`dev-refresh.ps1`); the actual delivery is a runtime guard, which is
less disruptive and keeps muscle memory on dev workstations.

- **Runtime guard, not a rename.** `refresh.sh` and `refresh.ps1` now
  test for `/etc/qb-engineer/deploy-state.json` near the top. If it
  exists, the script aborts with a clear pointer at `qb-deploy`. The
  state file is created by `scripts/install-qb-deploy.sh`, so it's
  present exactly when (and only when) `qb-deploy` is the canonical
  answer for that host.
- **Why the state file as the sentinel:** it's the most stable indicator
  available. `/usr/local/bin/qb-deploy` exists is a viable alternate,
  but the state file is the explicit "this host is in production-deploy
  mode" marker. Both are created by the installer; either would work.
  The state-file check was chosen because it survives accidental binary
  removals and matches the abstraction qb-deploy itself uses.
- **No-op on dev workstations.** The path doesn't exist on Windows, on
  fresh Linux installs, or on any host that hasn't run
  `install-qb-deploy.sh`. The dev-loop semantics of `refresh.{sh,ps1}`
  are unchanged for those hosts.
- **`setup.{sh,ps1}` keeps its first-time-bootstrap role unchanged on
  every host** (dev workstation, Pi, or anywhere else). It's the only
  one of the three surfaces (`setup` / `refresh` / `qb-deploy`) that's
  cross-cutting; the other two are role-specific.
- **Three roles, three scripts:** `setup.*` for first-time bootstrap,
  `refresh.*` for dev-side dev-loop, `qb-deploy` for prod CD. See
  `qb-engineer-deploy/CONTRIBUTING.md` for the operator-facing version
  of this distinction.

## Phase 8 addendum (2026-05-02) — semver auto-bump, matrix split, Node 24

Three operator-facing changes that the original design left open: the
ambiguity of `main-<sha>` tags as a deploy surface, the build-time
collapse of QEMU-emulated multi-arch on the server image, and the
runner Node 20 deprecation deadline.

### Auto-bumped semver replaces hash tags as the primary deploy surface

The original design treated `main-<sha>` as the everyday deploy tag and
`<X.Y.Z>` as a manual release tag. In practice this was opaque: the Pi
operator looking at GHCR couldn't tell `main-23d6af4` from `main-9f8e7d6`
without cross-referencing commit dates. The new model auto-derives a
real semver on every main push.

- **Per-repo `VERSION` file** holds `MAJOR.MINOR.BASE` (e.g. `0.0.0`,
  `0.1.0`, `1.0.0`). Lives at the repo root in `qb-engineer-server`,
  `qb-engineer-ui`, and `qb-engineer-test`. Edited manually for minor
  and major bumps.
- **Patch is computed in CI** as `BASE + (commits since VERSION was last
  touched)`. The release workflow runs `git log -1 --format=%H -- VERSION`
  to find the anchor, then `git rev-list --count <anchor>..HEAD`. This
  resets to 0 when `VERSION` is edited and committed, so a `0.0.0` →
  `0.1.0` bump produces `0.1.0` on the next CI build (not `0.1.5` or
  whatever hash count happened to be in flight).
- **Tag set on every main push:** `<X.Y.Z>` (immutable patch),
  `<X.Y>` (floating minor), `latest` (floating, dev-only), and
  `main-<sha>` (legacy, kept for compatibility with old qb-deploy
  invocations). The `qb-deploy` CLI accepts both `<X.Y.Z>` and
  `main-<sha>`, refuses `latest`.
- **Tag set on `v*.*.*` git-tag push** (manual milestone): adds `<X>`
  (floating major). Bypasses the VERSION-file computation entirely, so
  the operator can cut `v2.0.0` without first editing VERSION.
- **No git-tag pushing happens from inside CI.** The auto-bump is a
  read of repo state, not a write. This avoids the recursive-build trap
  (a tag-push would re-trigger the workflow).
- **Operator workflow:** edit `VERSION` to bump minor/major, push to
  main, CI publishes `0.1.0` (or whatever). Patch bumps are automatic
  on every subsequent main commit. The operator never tags a release
  manually unless they want a milestone semver (`vX.Y.Z`).

### Matrix split: native amd64 + native arm64, no QEMU

The original design used a single ARM64 runner with QEMU emulation for
the amd64 leg. This hit the 30-minute timeout on the server image
(chromium + ffmpeg + playwright add ~520MB of installs that QEMU runs
5–10x slower than native). Rather than hide the symptom by extending the
timeout, the release workflow now uses a build matrix:

```yaml
strategy:
  matrix:
    include:
      - platform: linux/amd64
        runner: ubuntu-latest
        arch: amd64
      - platform: linux/arm64
        runner: ubuntu-24.04-arm
        arch: arm64
```

Each matrix leg builds natively, pushes by-digest only, then a
`merge-manifests` job downloads both digest artifacts and runs
`docker buildx imagetools create` to publish the named tags as a single
multi-arch manifest list. Per-arch GHA cache scopes (`scope=${matrix.arch}`)
keep amd64 and arm64 caches isolated.

The UI image stays single-job (it's small enough that QEMU on the
amd64 leg doesn't time out). If it ever does, copy the matrix shape
from the server workflow.

### Why amd64 isn't dropped

The Pi production target is arm64. Dropping amd64 was tempting but
rejected: testers and contributors run on x86_64 server hardware, and
some standalone customers may eventually deploy to amd64 VMs. The cost
of a parallel amd64 leg (~10 min on its own native runner) is small.

### Node 24 runtime forcing

GitHub deprecated Node 20 on hosted runners (forced default June 2026,
removed September 2026). Most action publishers haven't retagged their
JS-based actions yet. Setting:

```yaml
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
```

at the top of every workflow forces actions/checkout, docker/login,
docker/build-push, etc. to run on the runner's Node 24 binary at
runtime — no per-action upgrade dance, no failures when individual
actions retag.

Applied to all 9 workflows across the three image-publishing repos
(server, ui, test) as a top-level `env` block. Once all upstream
actions retag for Node 24 native, this flag becomes a no-op and can
be removed.

### Concurrency to prevent stacking

Each release workflow declares `concurrency: { group: release-${{ github.ref }} }`
to prevent overlapping runs of the same ref. New pushes queue rather
than stack; the previous run finishes (or is cancelled per
`cancel-in-progress: false` on release, which we leave false to avoid
half-published manifests).

### Test gating across both workflows

`ci.yml` runs on PR-to-develop/main and push-to-develop/main. `release.yml`
on the image repos runs the same test suite as a `test` job that the
`build-and-push` matrix `needs:`, so a failing test on a main push
prevents image publication. The duplication is intentional — `ci.yml`
provides the PR gate, the release `test` job provides the publish gate.

### Branch protection

Branch protection on `main` requires the `test` job from each repo's
release workflow to pass before merge. Status check names are pinned to
the canonical job names (`test`, `build-and-push (amd64)`,
`build-and-push (arm64)`, `merge-manifests`).

### What this means for `qb-deploy`

The CLI is unchanged — it already accepted both `main-<sha>` and
`<X.Y.Z>` tags, validated against regexes pinned in Phase 3+4. Operators
should now reach for `qb-deploy --list --releases` (semver) by default
and `qb-deploy --list` (sha) only when chasing a specific commit. The
state file format is unchanged; `current` and `prior` accept either tag
form transparently.

### What this means for the deploy repo

`qb-engineer-deploy` itself remains tag-on-demand (`v*.*.*` git tag, no
auto-bump). It publishes no image — its release is just the compose
files at that tag. The release-manifest.md model continues to work
unchanged: each row pairs sibling versions, but those versions are now
real semver instead of opaque hashes.
