# qb-deploy — Operator Guide

The `qb-deploy` CLI is the production deploy surface on the Pi. It pulls
prebuilt images from GHCR, pins them in `.env`, runs the standard compose
flow, and gates the result on a healthcheck (rolling back on failure).

This is the document you'll re-read in six months on a Pi at 11pm.

> **Authoritative design:** `docs/cicd-design.md`. This file is the
> short, hands-on companion.

## What it does (and doesn't)

- **Does:** discover available image tags via the GHCR REST API, validate the
  chosen tag exists, update `SERVER_IMAGE_TAG` / `UI_IMAGE_TAG` /
  `TEST_IMAGE_TAG` in `.env`, run `docker compose pull` + `up -d`, poll
  the healthcheck for up to 60s, roll back on failure, append every
  outcome to `/var/log/qb-engineer-deploy.log`.
- **Doesn't:** build images, run tests, talk to GitHub Actions, expose any
  inbound network surface, accept the floating tag `latest`.

## Install

On the Pi, with the deploy repo cloned at `/opt/qb-engineer-deploy`:

```bash
sudo /opt/qb-engineer-deploy/scripts/install-qb-deploy.sh
```

The installer:

1. Copies `qb-deploy` to `/usr/local/bin/qb-deploy` (mode 0755).
2. Creates `/etc/qb-engineer/` (mode 0750, owned by the deploy user).
3. Creates `/etc/qb-engineer/deploy-state.json` (mode 0640) if missing.
4. Touches `/var/log/qb-engineer-deploy.log` (mode 0644).
5. Verifies `docker`, `docker compose`, `curl`, `jq` are all present.

It's idempotent — re-run any time. An existing state file is preserved
unless it's malformed JSON, in which case it's backed up and reset.

If the deploy user isn't the user running the install (for example you're
running it as root in a fresh setup), set `QB_DEPLOY_USER=qbedeploy`:

```bash
sudo QB_DEPLOY_USER=qbedeploy /opt/qb-engineer-deploy/scripts/install-qb-deploy.sh
```

## Daily flow

```bash
# What's deployed and is it healthy?
qb-deploy --status

# What images are out there?
qb-deploy --list --releases      # X.Y.Z semver releases (preferred)
qb-deploy --list                 # last 10 main-<sha> builds per image (legacy)

# Deploy a specific semver to all services
qb-deploy 1.2.3

# Deploy interactively — picks last 5 main-<sha> per service
qb-deploy

# Deploy a specific SHA tag to all services
qb-deploy main-abc1234

# Deploy that tag only to the api
qb-deploy main-abc1234 --service api

# Deploy the ui only, picking the tag interactively
qb-deploy --service ui

# Roll back the last deploy
qb-deploy --rollback                 # all services
qb-deploy --rollback --service api   # just api

# Tail the deploy log
qb-deploy --logs

# Pull the latest qb-engineer-deploy code + reinstall the CLI
qb-deploy --self-update
```

## Tag validation

`qb-deploy` only accepts:

- `<X.Y.Z>` (e.g. `1.2.3`) — auto-bumped by CI on every push to `main`
  in the source image repos. **The preferred deploy surface.** See
  [docs/cicd-design.md §Phase 8 addendum](./cicd-design.md) for the
  auto-bump model.
- `main-<7-hex>` (e.g. `main-abc1234`) — also produced on every main
  push, kept for compatibility. Use when chasing a specific commit.

It refuses `latest` outright. If you find yourself wanting to deploy
`latest`, you really want `qb-deploy --list --releases` and one of the
semver tags that prints.

## Healthcheck behavior

| Service | How it's checked |
|---|---|
| `qb-engineer-api` | HTTP `GET http://127.0.0.1:${API_PORT}/api/v1/health` (port read from `.env`) |
| `qb-engineer-ui` | Container `HEALTHCHECK` (nginx wget on `:80/`) |
| `qb-engineer-test` | Container `HEALTHCHECK` (defined when the test image lands) |

Polling runs for 60 s with a 2 s interval. On failure, the operative
`.env` is reverted to the previous tag and the container is restarted
on the previous image.

## State and log

```
/etc/qb-engineer/deploy-state.json   # current/prior/deployedAt per image
/var/log/qb-engineer-deploy.log      # every deploy event, append-only
/opt/qb-engineer-deploy/.env         # operative env file (image tags pinned here)
```

Sample log line:

```
2026-05-02T22:14:33Z api 0.1.4 -> 0.1.5 ok
```

## Self-update

`qb-deploy --self-update` runs:

1. `git -C /opt/qb-engineer-deploy pull --ff-only`
2. `/opt/qb-engineer-deploy/scripts/install-qb-deploy.sh`

It refuses to pull when the working tree has uncommitted changes —
otherwise it would silently move local edits aside.

## Troubleshooting

**`Missing required command: jq`**
Install via `apt install jq` (or your distro's equivalent). The CLI uses
`jq` for the state file and GHCR API parsing.

**`Tag not found in GHCR`**
The tag you asked for hasn't been published. Possibilities:
- The CI run that should have produced it failed (check Actions on the
  source repo).
- You typed a SHA that's a commit but not an image (a failed test gates
  the image push — listing commits would lie to you, but `qb-deploy --list`
  asks GHCR directly and won't surface it).
- It's an `<X.Y.Z>` tag that never made it to GHCR (rare).

**`Service did not become healthy — rolling back`**
The new image started but its healthcheck never went green. Common
causes: a failed migration on the api, an env var the new image needs
that's missing, a port collision. Check `docker compose logs <service>`
and `qb-deploy --status`. The previous image is back online by the time
you see this.

**`State file not writable`**
The deploy user changed or you're running as a different user than the
one that owns `/etc/qb-engineer/`. Re-run the installer with the right
`QB_DEPLOY_USER`.

**`Refusing to deploy 'latest'`**
Working as intended. Use `qb-deploy --list` to see what's available and
pass an explicit tag.

## What this replaces

On the Pi, `refresh.sh` and `refresh.ps1` are the legacy proxy CICD
scripts (`git pull` + `docker compose build` + `up -d`). `qb-deploy`
replaces them on the Pi side: prod runs from prebuilt images, never
builds locally.

As of Phase 7, **`refresh.{sh,ps1}` actively refuse to run on the Pi**.
They check for `/etc/qb-engineer/deploy-state.json` (created by
`install-qb-deploy.sh`) and abort with a pointer at `qb-deploy` if
present. On dev workstations the file is absent, so the local-build
dev loop is unaffected.

`refresh.sh`/`refresh.ps1` keep their dev-loop role on workstations
(the same script that's been doing `git pull` + local rebuild).

`setup.sh` / `setup.ps1` keep their first-time bootstrap role
everywhere (they create `.env`, generate JWT keys, prompt for seed
passwords).

## Compose file layering

```
docker-compose.yml             # base (always loaded)
docker-compose.cohost.yml      # if QBE_HOSTING_MODE=cohost
docker-compose.prod.yml        # qb-deploy adds this on prod
```

The prod overlay only swaps `build:` for `image:` on the api / ui (and
test, when its image lands). Everything else — ports, volumes, env
wiring — comes from the base file unchanged.

## When to bypass qb-deploy

You should never need to. If you do:

- Local hotfix on the Pi: `docker compose pull && docker compose up -d`
  works, but the state file and log won't reflect it. Run `qb-deploy
  --status` afterward to see the actual container state.
- Re-running an old SHA: pass it explicitly: `qb-deploy main-abc1234`.
- Total reset: `docker compose down`, edit `.env` manually, then
  `qb-deploy --status` again.
