---
title: Nightly + manual rolling "edge" image publish (GHCR)
type: delivery
status: pending
id: nightly-edge-image-publish
owner:
updated: 2026-05-28
---

# Nightly + manual rolling "edge" image publish (GHCR)

> **Status: PENDING — decision documented to enact later.** Captures the agreed change; no
> workflow edits made yet. Raised from Dan's notes (2026-05-28).

## Decision

Stop publishing a container image on **every push to main**. Instead publish a single rolling
**`edge`** image to **GHCR**:
- on a **nightly schedule**, and
- on **manual trigger** (`workflow_dispatch`).

A day's worth of commits then rolls up into **one** nightly `edge` package instead of one image
per push. Versioned releases (git tag `vX.Y.Z`) are unchanged and still publish on the tag.

## Why

The `release-*` workflows currently build + push a full multi-arch image on **every push to
main** — "mass quantities of builds." Most of those intermediate images are never pulled. A
nightly rolling build gives a current `edge` image without the per-commit churn, and manual
dispatch covers "I need an edge build now."

## Current state (what exists today)

Per repo — **`forge-api`** and **`forge-ui`** (the wrapper `forge` has only
`wrapper-invariants.yml`, no image build, so it's unaffected):

| Workflow | Trigger today | Role | Change? |
|---|---|---|---|
| `ci.yml` | PR + **push** to `develop`/`main` | build + unit/integration tests | **Keep as-is** — cheap per-push feedback, no image |
| `release-amd64.yml` | **push `main`** + tag `v*.*.*` + `workflow_dispatch` | build+push `linux/amd64` → GHCR `-amd64` | **Change trigger** |
| `release-arm64.yml` | same | build+push `linux/arm64` → GHCR `-arm64` | **Change trigger** |
| `release-manifest.yml` | same | combine arches → `latest`, `X.Y.Z` | **Change trigger + add `edge`** |
| `forge-ui/nightly.yml` | schedule 03:00 UTC + dispatch + push `release/*` | nightly Playwright E2E (not images) | reuse its cron / gate off it |

Registry is already **`ghcr.io`** (`IMAGE_NAME = github.repository`). Tagging today (amd64 leg)
fires only on `main`: `latest-amd64`, `<version>-amd64`, `main-<sha>-amd64`, plus semver tags on
`v*` releases. `release-manifest.yml` fuses the arch legs into `latest` / `X.Y.Z`.

## The change (per `release-*` workflow, both repos)

1. **Drop `push: branches: [main]`** from the three `release-*` triggers. Keep `tags: ['v*.*.*']`
   (versioned releases still publish) and `workflow_dispatch` (manual). **Add a nightly schedule:**
   ```yaml
   on:
     schedule:
       - cron: '0 4 * * *'   # 04:00 UTC nightly (after the 03:00 E2E)
     workflow_dispatch:
     push:
       tags: ['v*.*.*']
   ```
2. **Introduce an `edge` tag** for schedule/dispatch-from-main builds, separate from semver. In the
   `docker/metadata-action` tag list, gate the rolling tags on *not* being a version tag:
   ```yaml
   tags: |
     type=raw,value=edge-amd64,enable=${{ github.ref == 'refs/heads/main' }}
     type=sha,prefix=edge-,suffix=-amd64,format=short,enable=${{ github.ref == 'refs/heads/main' }}
     # semver tags unchanged (fire on v*.*.* refs):
     type=semver,pattern={{version}},suffix=-amd64
     type=semver,pattern={{major}}.{{minor}},suffix=-amd64
   ```
   `release-manifest.yml` then fuses `edge-amd64` + `edge-arm64` → **`edge`** (rolling), and keeps
   fusing the semver legs → `X.Y.Z` / `latest` on tag releases.
3. **Gate the nightly publish on green tests.** The `release-*.yml` files already run a `test` job
   before `build-and-push`, so the nightly build self-gates. Optionally chain off the existing
   nightly E2E (`workflow_run` after `Nightly E2E` succeeds) instead of a fixed 04:00 cron, so
   `edge` only publishes when E2E is green.
4. **Skip the scheduled run when `main` hasn't moved.** A nightly with no new commits should no-op
   — don't rebuild/republish an identical `edge`. Applies to the **`schedule`** trigger only:
   `workflow_dispatch` always builds (manual = "I want one now") and tag releases always build. A
   guard step at the top of the job short-circuits via `if`/early-exit. Two ways to detect "no
   change":
   - *Idempotent (recommended):* read the commit the current `edge` image was built from (the
     `edge-<sha>` tag, or the image's `org.opencontainers.image.revision` OCI label) and skip if it
     equals `main`'s HEAD sha. Self-healing — a failed or missing prior build leaves HEAD ≠
     edge-sha so it retries; a quiet night leaves them equal so it skips.
   - *Simple (time-window):* skip if there are no commits in the last 24 h —
     `test -z "$(git rev-list --since='24 hours ago' origin/main)"`. Fewer moving parts, but
     fragile around failed builds and cron/commit-timing boundaries.

## Semantic shift to flag (consumers must know)

Today `latest` = newest main push. After this change:
- **`edge`** = rolling pointer to last night's main (bleeding edge).
- **`latest`** = newest **tagged release** only (moves on `vX.Y.Z`), i.e. it becomes *stable*.

Anything pulling `latest` for bleeding-main behavior must switch to `edge`. Audit:
- `docker-compose.yml` / `docker-compose.override.yml` image refs.
- `setup.ps1` / `setup.sh` / `refresh.ps1` / `refresh.sh` (they rebuild locally, but check any
  pull-by-tag).
- Any deploy target (e.g. `ap.armoryworks.com`) pinned to `latest`.

## Scope / sequencing to enact

- Edit `release-amd64.yml`, `release-arm64.yml`, `release-manifest.yml` in **both** `forge-api`
  and `forge-ui` (6 files): trigger swap + `edge` tagging.
- Decide cron time (suggest 04:00 UTC, after forge-ui's 03:00 E2E) and whether to gate via
  `workflow_run`.
- Update consumer tags (`latest` → `edge` where bleeding-edge is wanted).
- Verify once with a manual `workflow_dispatch` run on each repo (confirms `edge` publishes + the
  manifest fuses) before relying on the nightly.

## Open decisions

1. **Cron time** — 04:00 UTC (post-E2E) vs. another slot.
2. **Gate** — fixed nightly cron, or `workflow_run` chained off the green Nightly E2E so a red
   build never publishes `edge`.
3. **Keep a short-lived `edge-<sha>`** alongside `edge` for traceability/rollback, or `edge` only.
4. **`latest` redefinition** — confirm `latest` should become *stable* (tag-only); update any
   consumer pinned to it.
5. **No-change skip mechanism** — idempotent `edge`-sha compare (recommended) vs. 24 h commit
   window; and whether `workflow_dispatch` gets an optional `force` input to rebuild anyway.

## Not in scope

Changing `ci.yml` (stays on every push — fast feedback), the wrapper invariants workflow, CodeQL,
or the versioned-release flow (git-tag `v*.*.*` → `X.Y.Z`/`latest` is unchanged).
