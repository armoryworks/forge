# Forge

**Free, open-source ERP and MES for job shops: job cards on the floor, books in the office, one database.** Self-hosted, QuickBooks-integrated, covering the full quote-to-cash lifecycle.

<p>
  🌐 <strong>Live site:</strong> <a href="https://forge.armoryworks.com">forge.armoryworks.com</a>
  &nbsp;·&nbsp;
  🏭 <strong>Built by:</strong> <a href="https://armoryworks.com">Armory Works</a>
</p>

> **This is the umbrella repo.** It holds project documentation, governance, and the release manifest. The code lives in sibling repos:
>
> | Repo | What it is |
> |------|-----------|
> | **[forge-deploy](https://github.com/armoryworks/forge-deploy)** | docker-compose + `setup.sh` + the `forge-deploy` CLI — **start here to install** |
> | **[forge-ui](https://github.com/armoryworks/forge-ui)** | Angular 21 frontend (SPA) |
> | **[forge-api](https://github.com/armoryworks/forge-api)** | .NET 10 API (MediatR/CQRS, EF Core as the query-mapping layer) |
> | **[forge-db](https://github.com/armoryworks/forge-db)** | The database project — desired-state SQL + the reconcile harness that owns the schema |
> | **[forge-test](https://github.com/armoryworks/forge-test)** | Public test/demo SPA + manual test plans |
> | **[forge-voice](https://github.com/armoryworks/forge-voice)** | Asterisk-based voice / telephony integration |

---

## What is Forge?

A manufacturing-shop operations platform covering the full **quote-to-cash** lifecycle: leads, quotes, sales orders, jobs, a kanban shop floor, time tracking, inventory, purchasing, shipping, invoicing, payments, and returns — plus parts/BOM management, quality control, an employee training LMS, document signing, and a configurable AI assistant.

It is designed for shops that use **QuickBooks Online** (or Xero, FreshBooks, Sage, NetSuite, Wave, Zoho) as their accounting system of record but want richer operational tooling on top. Forge also runs fully **standalone** — with no accounting provider connected, its built-in GL/invoicing/payments/AR features activate; connect one and those defer to the provider.

Forge runs as a **self-hosted Docker Compose stack**. Single-node by default, with a deploy toolchain (`forge-deploy`) that also supports splitting the UI, API, and database across separate machines — without a Kubernetes commitment.

### The stack at a glance

| Layer | Technology | Container |
|-------|-----------|-----------|
| Frontend | Angular 21 + Material, served by nginx | `forge-ui` |
| Backend | .NET 10 API (MediatR/CQRS, EF Core) | `forge-api` |
| Database | PostgreSQL 18 + pgvector; schema owned by [forge-db](https://github.com/armoryworks/forge-db) | `forge` |
| Object storage | MinIO (S3-compatible) | `forge-storage` |
| Backups | Scheduled `pg_dump` sidecar (daily at 02:00 UTC by default) | `forge-backup` |
| Optional | Ollama (AI), Coqui (TTS), DocuSeal (signing), Seq (logs), GlitchTip (crash reports) | profile-gated |

**No EF Core migrations.** The desired-state schema is a tree of one-object-per-file SQL scripts in [forge-db](https://github.com/armoryworks/forge-db), reconciled onto a live database by [stripe/pg-schema-diff](https://github.com/stripe/pg-schema-diff). The API's `SchemaBootstrapper` provisions a *fresh* database from the assembled schema and is a no-op on an existing one; upgrades of a populated install go through the `forge-deploy` schema reconcile step (see [Updating](#updating)).

---

## Installing Forge

Everything below runs on the machine that will host Forge.

> **Quickest path.** On a Linux or macOS box that already has Docker and a `docker login ghcr.io` (see Step 0):
>
> ```bash
> sudo mkdir -p /opt/forge-deploy && sudo chown "$USER:$(id -gn)" /opt/forge-deploy
> npx @armoryworks/forge-deploy /opt/forge-deploy
> ```
>
> That downloads the current deploy tree from GitHub into `/opt/forge-deploy` and runs interactive setup. The npm package is a thin bootstrapper (it needs Node.js 18+) — the deploy tree itself is always fetched fresh, so there is no stale-package problem. The steps below spell the same thing out and cover source builds, split UI/API/DB topologies, and version pinning/rollback.

### Step 0 — OS prerequisites (start here on a bare machine)

Every host needs the same four things: **Docker Engine + the Compose v2 plugin**, **git**, **curl**, and **jq** (the `forge-deploy` CLI hard-requires docker/curl/jq). Also: **~4 GB RAM** minimum (8 GB+ recommended; setup applies tighter container limits automatically on low-RAM hosts) and outbound access to **ghcr.io** to pull prebuilt images (unless you build from source). ARM (Raspberry Pi 4/5, Apple Silicon) is fully supported — all images are multi-arch. The commands below assume **nothing** is pre-installed.

> **GHCR authentication:** the `ghcr.io/armoryworks/*` packages are not anonymously pullable. Create a GitHub personal access token with only the **`read:packages`** scope and run `docker login ghcr.io -u <github-username>` (paste the PAT at the password prompt). To let the `forge-deploy` CLI use the same credentials for version lookups, install it with `sudo GHCR_USER=<user> GHCR_TOKEN=<pat> bash scripts/install-forge-deploy.sh` (Step 4).

<details open>
<summary><strong>Linux</strong> — Debian/Ubuntu · Fedora/RHEL · Arch</summary>

Any 64-bit distro works (x86_64 or arm64). Commands for the three biggest families:

**Debian / Ubuntu / Raspberry Pi OS (apt)**

```bash
sudo apt update
sudo apt install -y git curl jq
curl -fsSL https://get.docker.com | sudo sh      # Docker Engine + Compose v2 plugin
sudo usermod -aG docker "$USER"                  # run docker without sudo
```

On Ubuntu 24.04+ you can use the distro packages instead of the convenience script — note the compose plugin is named `docker-compose-v2` there, not `docker-compose-plugin`:

```bash
sudo apt install -y docker.io docker-compose-v2 docker-buildx
```

(`docker-buildx` is optional — without it the one locally-built sidecar falls back to the classic builder and compose prints a harmless "Bake, but buildx isn't installed" warning.)

**Fedora / RHEL / CentOS Stream (dnf)**

```bash
sudo dnf install -y git curl jq
curl -fsSL https://get.docker.com | sudo sh      # sets up the docker-ce repo and installs Engine + Compose
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

**Arch / Manjaro (pacman)**

```bash
sudo pacman -Syu --needed git curl jq docker docker-compose
sudo systemctl enable --now docker.service
sudo usermod -aG docker "$USER"
```

On all three: **log out and back in** (group membership takes effect at login), then verify:

```bash
docker version && docker compose version && git --version && jq --version
```

</details>

<details>
<summary><strong>macOS</strong> — Homebrew + Docker Desktop</summary>

```bash
# 1. Homebrew (skip if installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. CLI prerequisites (curl ships with macOS)
brew install git jq

# 3. Docker Desktop
brew install --cask docker
```

**UI step (required):** launch **Docker Desktop** from Applications, accept the service agreement, and wait until the menu-bar whale reports "Docker Desktop is running" — the `docker` CLI and Compose v2 only work after the app is running. Enable *Start Docker Desktop when you sign in* in Settings → General so the stack survives reboots. Apple Silicon is fine (arm64 images are published).

Verify: `docker version && docker compose version`.

macOS notes: `setup.sh` and the `forge-deploy` CLI both run on macOS; the host network watchdog is Linux-only and is silently skipped.

</details>

<details>
<summary><strong>Windows 10/11</strong> — WSL2 (recommended) or native PowerShell</summary>

**Path A — WSL2 (recommended; full `forge-deploy` toolchain, production-capable)**

```powershell
# PowerShell as Administrator
wsl --install -d Ubuntu                          # installs WSL2 + Ubuntu; reboot when prompted
winget install -e --id Docker.DockerDesktop
```

**UI steps (required):** launch **Docker Desktop** → accept the agreement → Settings → *General* → check **Use the WSL 2 based engine** → *Resources → WSL integration* → enable your **Ubuntu** distro → **Apply & restart**.

Then open the **Ubuntu** terminal, install the remaining CLI tools (`sudo apt update && sudo apt install -y git curl jq` — do **not** install Docker Engine inside WSL; Docker Desktop provides `docker` and `docker compose` there), and follow **all remaining steps below exactly as written for Linux**, inside the WSL shell.

**Path B — native PowerShell (developer / source-build only)**

`setup.ps1` builds images from local source (there is no GHCR-pull mode on native Windows), so it needs the source repos cloned as **siblings** of `forge-deploy`:

```powershell
winget install -e --id Git.Git
winget install -e --id Docker.DockerDesktop      # UI step: launch it, wait for "running"
winget install -e --id Microsoft.PowerShell      # pwsh 7 (the scripts target pwsh)

git clone https://github.com/armoryworks/forge-ui.git     C:\dev\forge-ui
git clone https://github.com/armoryworks/forge-api.git    C:\dev\forge-api
git clone https://github.com/armoryworks/forge-test.git   C:\dev\forge-test
git clone https://github.com/armoryworks/forge-deploy.git C:\dev\forge-deploy
cd C:\dev\forge-deploy
.\setup.ps1 -Seeded          # flags mirror setup.sh: -Fresh, -IncludeAi, -IncludeAll, -Public, ...
```

The `forge-deploy` CLI (Step 4) is bash and uses Linux paths (`/etc/forge`, `/var/log`) — it does not run natively on Windows. For version-pinned installs, upgrades, and rollback on Windows, use Path A.

</details>

### Step 1 — Get the deploy tree

```bash
sudo mkdir -p /opt/forge-deploy && sudo chown "$USER:$(id -gn)" /opt/forge-deploy
git clone https://github.com/armoryworks/forge-deploy.git /opt/forge-deploy
cd /opt/forge-deploy
```

(`npx @armoryworks/forge-deploy /opt/forge-deploy --fetch-only` downloads the same tree without git.)

`/opt/forge-deploy` is the conventional location — it's the default the CLI and the docs assume — but any path works; on macOS or WSL a home-directory path is fine. **What this gives you:** the compose files, the `setup.sh` bootstrapper, and the `forge-deploy` / `forge-preflight` scripts under `scripts/`.

### Step 2 — Run `setup.sh`

```bash
./setup.sh                # GHCR-pull (production / evaluation)
./setup.sh --seeded       # ...plus demo users, jobs, and customers
./setup.sh --source       # developer mode: build images from sibling source repos
```

**Each thing the first run does:**

1. **System + prerequisite checks** — platform, architecture, RAM, Docker running, Compose plugin present. It stops with clear guidance if anything's missing.
2. **Environment file** — creates `.env` from `.env.example` and generates a random `JWT_KEY` (the secret the API signs login tokens with). `.env` holds every tunable: image tags, port bindings, database credentials, integration keys. It is **never committed**.
3. **Deployment target** — `--local` (this machine only), `--lan` (serve the UI to your network over HTTP at this host's LAN IP), or `--public` (standalone nginx + self-signed TLS + a system preflight that frees ports 80/443 and opens UFW rules). Interactive runs are prompted; the answer is saved to `.env`. `--cohost` instead keeps the UI on `127.0.0.1:4200` behind an existing host reverse proxy or tunnel.
4. **Demo data** — only with `--seeded`. It prompts (hidden input) for a password for the nine demo users, e.g. `admin@forge.local`. Without `--seeded` the first visit opens the in-app setup wizard, which creates your first admin account.
5. **Overrides** — writes `docker-compose.override.yml` when SSL or low-RAM memory tuning applies.
6. **Images and bring-up** — pulls the multi-arch images from `ghcr.io/armoryworks/*` (or builds from source with `--source`), starts the stack, and waits for the API to report healthy.
7. **Host network watchdog** — installed by default on Linux (`--skip-host-watchdog` opts out); it restarts networking on persistent failure and reboots a wedged box. No-op on macOS.

The full flag list is documented at the top of [`setup.sh`](https://github.com/armoryworks/forge-deploy/blob/main/setup.sh).

### Step 3 — Open Forge

When setup finishes it prints your access URLs. By default:

| Service | URL |
|---------|-----|
| **Web app** | http://localhost:4200 |
| API | http://localhost:5000 |
| API health | http://localhost:5000/api/v1/health |
| MinIO console | http://localhost:9001 (`minioadmin` / `minioadmin` — change these) |

On a **seeded** install, log in with `admin@forge.local` and the password you set during setup. On a **clean** install, the first visit opens the in-app setup wizard. On a **cohost** box, point your reverse proxy / tunnel at `http://127.0.0.1:4200`.

### Step 4 — Install the `forge-deploy` CLI

`setup.sh` installs Forge; `forge-deploy` is what you use from then on — version pinning, upgrades, rollback, split topologies, and recovery.

```bash
sudo bash scripts/install-forge-deploy.sh
```

**What this does:** copies `forge-deploy` to `/usr/local/bin` (so you can run it from anywhere), creates `/etc/forge/deploy-state.json` (records what's deployed), and a log at `/var/log/forge-deploy.log`. Re-running it is safe and preserves your state. Verify with `forge-deploy --version`.

The CLI runs on Linux, macOS, and Windows/WSL. (Native Windows is the source-build developer path — use `.\setup.ps1` and `.\refresh.ps1` there instead; see Step 0, Path B.)

### Step 5 — Manage Forge with `forge-deploy`

On a configured box, `forge-deploy` with **no arguments** opens a **version picker**: for each component it lists the published versions, marks the one you're running with `»  …  « current`, and defaults to it — press **Enter** to keep it and move to the next component, or pick a number to upgrade/downgrade. Press **`r`** to re-run setup, **`q`** to quit.

Other commands: `forge-deploy --status` (what's deployed + container health), `forge-deploy --list` (available versions), `forge-deploy --update` (catch up to the newest release), `forge-deploy --rollback` (revert to the previous version), `forge-deploy --recover` (fix a broken box in place), `forge-deploy --fresh-start` (wipe and reinstall), `forge-deploy --logs` (deploy history), `forge-deploy --self-update` (update the CLI itself). Run `forge-deploy --help` for everything.

**If anything goes wrong — or a previous attempt died halfway** — run `forge-deploy --recover`. It deliberately skips the usual preflight, because broken states are the point: it detects the common failure modes (Docker not running, broken snap packaging, half-written config, unpulled images, crash-looping containers, port conflicts) and offers **resume** (fix in place, keep your data) or **fresh start** (`forge-deploy --fresh-start`: wipe everything after typed confirmation). If it hits something it can't fix, it explains the situation in plain language and offers to file a GitHub issue for you when you're logged into `gh` — steps to reproduce first, diagnostics after, credential-shaped values redacted and your `.env` secrets never included.

`scripts/forge-preflight` is the read-only alternative: it checks the things that actually break deployments (floating image tags, file ownership, CRLF line endings, overlay drift, wrong remote) and prints the exact fix for each without changing anything. It is not copied onto `PATH` — run it from the deploy tree.

### Deployment topologies (separate hardware)

Forge runs on one box or splits across several. Multi-box deployments are Linux-host territory (each box runs the Step 0 Linux prerequisites, the deploy tree, and the `forge-deploy` CLI). **Hardware guidance:** any 64-bit box with 4 GB+ RAM works; the reference small-shop target is a Raspberry Pi 5 (16 GB, NVMe root — never run Postgres on an SD card). Full hardware/OS provisioning, GHCR auth, and ingress (Cloudflare tunnel) runbook: [`forge-deploy/docs/DEPLOY.md`](https://github.com/armoryworks/forge-deploy/blob/main/docs/DEPLOY.md).

The topology wizard (`forge-deploy --wizard`, or `forge-deploy --setup --role <r>` unattended) configures any of these — picking the right containers per box and wiring the connections automatically:

| Topology | Boxes & roles | One-line setup (per box) |
|----------|---------------|--------------------------|
| **All-in-one** | everything on one box | `forge-deploy --setup --role all --host forge.example.com` |
| **UI + API / DB** | app box + database box | `--role ui+api --db-host DB` · `--role db` |
| **UI / API + DB** | web box + backend box | `--role ui --api-url http://API:5000` · `--role api+db` |
| **UI / API / DB** | three separate boxes | `--role ui …` · `--role api --db-host DB …` · `--role db` |

For a split deployment the wizard handles the cross-box plumbing: pointing the web tier at a remote API, pointing the API at a remote Postgres/MinIO, exposing the database box on the LAN, and generating the host reverse-proxy vhost (TLS, WebSocket, SPA + API routing). You don't hand-edit nginx or connection strings.

---

## Updating

### Linux, macOS, Windows/WSL — the `forge-deploy` CLI

```bash
forge-deploy                          # interactive version picker per component
forge-deploy --update                 # catch up to the newest release
forge-deploy --update --check         # report only: exit 0 = current, 10 = behind
forge-deploy <version>                # deploy that release to this box's components
forge-deploy <version> --service api  # just the API
forge-deploy --rollback               # revert to the previously deployed version
forge-deploy --self-update            # update the forge-deploy CLI itself
```

Tags are `X.Y.Z` (optionally with a pre-release suffix) or `main-<7-hex>`; `forge-deploy --list` shows what's published. Deploys are **health-gated**: forge-deploy waits for the new container to report healthy and **automatically rolls back the pin** if it doesn't. It refuses to deploy the floating `latest` tag — production always runs an immutable, pinned version.

To refresh the deploy tree itself (compose files, scripts) while preserving `.env`, overrides, and volumes: `npx @armoryworks/forge-deploy /opt/forge-deploy`, or `npx @armoryworks/forge-deploy upgrade` to refresh the tree and run the gated upgrade in one shot.

> **Schema changes.** A release deploy runs the whole gated sequence — verify the tag in GHCR → pin `.env` (including `SCHEMA_IMAGE_TAG`, kept in lockstep) → fresh backup → **schema reconcile** → container swap → health gate → automatic rollback of the pin on failure. The reconcile runs the `forge-db` image, which applies the desired-state schema with pg-schema-diff; the API's `SchemaBootstrapper` only provisions fresh databases, so on a populated install the reconcile is the *only* thing that brings the schema forward. Installs created before schema reconcile existed need `ENABLE_SCHEMA_RECONCILE=true` in `.env` once. If a release carries **destructive** schema changes the reconcile halts and enumerates them; review, then re-run with `--allow-destructive` to approve.
>
> **Rollback caveat:** schema changes are forward-only, so the database is always at or ahead of the last image that ran successfully. `--rollback` across a release that shipped a schema change also requires restoring the pre-upgrade database dump (the `forge-backup` sidecar takes them on schedule) — see [`forge-deploy/docs/DEPLOY.md` §12](https://github.com/armoryworks/forge-deploy/blob/main/docs/DEPLOY.md) for the step-by-step procedure. Releases that require this say so in their CHANGELOG entry.

### Native Windows / source-build installs — `refresh`

Installs created with `setup.ps1` (or `./setup.sh --source`) are rebuilt from source rather than version-pinned:

```powershell
.\refresh.ps1          # native Windows: git pull, rebuild images, restart
```

```bash
./refresh.sh           # Linux/macOS source-build workstations
```

Both pull the latest `main` in the source repos, rebuild with `--no-cache --force-recreate`, and restart the stack. On a host managed by the `forge-deploy` CLI these scripts refuse to run (they detect `/etc/forge/deploy-state.json`) — use `forge-deploy` there instead.

---

## Configuration reference

All configuration lives in `/opt/forge-deploy/.env` (created by `setup.sh`). Common keys:

| Key | Purpose | Default |
|-----|---------|---------|
| `SERVER_IMAGE_TAG` / `UI_IMAGE_TAG` | Pinned image versions | managed by `forge-deploy` |
| `SCHEMA_IMAGE_TAG` / `ENABLE_SCHEMA_RECONCILE` | `forge-db` reconcile image + switch | pinned in lockstep / `false` |
| `UI_PORT` / `API_PORT` | Host ports for the web app / API | `4200` / `5000` |
| `UI_BIND` / `API_BIND` | Interface to bind (`127.0.0.1` = local only, `0.0.0.0` = LAN) | `127.0.0.1` |
| `POSTGRES_*` / `MINIO_*` | Database / object-storage credentials + ports | see `.env.example` |
| `QBE_HOSTING_MODE` | `standalone` or `cohost` | `standalone` |
| `SEED_DEMO_DATA` | Load demo data on first start | set by `setup.sh --seeded` |
| `BACKUP_SCHEDULE` | Backup cron expression (UTC) | `0 2 * * *` |

Edit `.env`, then re-apply with `forge-deploy --up` (which brings up only this box's components and never recreates the ones you've split off).

---

## Troubleshooting

Run **`forge-deploy --recover`** first — it detects and fixes most of these automatically (and files an issue with diagnostics when it can't). **`scripts/forge-preflight`** is the read-only alternative: it diagnoses without changing anything. If you're still stuck, work through the relevant section.

### 1. `docker compose up` fails: "port is already allocated"

Another process (often a stray `docker-proxy` from a previous stack) holds the port.

```bash
sudo ss -tlnp 'sport = :4200'        # find what's listening (swap in the port from the error)
docker ps --format '{{.Names}}\t{{.Ports}}'   # is it one of yours?
```

If it's a Forge container, `docker compose down` and retry. If it belongs to another app, change `UI_PORT`/`API_PORT` in `.env` instead. **Never blindly `kill` a `docker-proxy`** — it may be serving another site on the same host.

### 2. `git pull` fails: "dubious ownership" or "Permission denied"

The repo files are owned by `root` (common after a `sudo` operation). Reclaim them:

```bash
sudo chown -R "$(id -un):$(id -gn)" /opt/forge-deploy
cd /opt/forge-deploy && git fetch origin && git reset --hard origin/main
```

### 3. The API container keeps restarting / crash-loops

Often a bad or floating image tag. Check the logs and pin a known-good version:

```bash
docker logs forge-api --tail 50                    # read the startup error
/opt/forge-deploy/scripts/forge-preflight          # flags SERVER_IMAGE_TAG=latest as a FAIL
forge-deploy --list --releases                     # see available versions
forge-deploy <version> --service api               # pin an immutable tag
```

If `.env` has `SERVER_IMAGE_TAG=latest`, pin it — `latest` can move under you and ship a broken build.

### 4. `forge-deploy: Unknown option` after a `git pull`

The installed CLI in `/usr/local/bin` is a stale copy. The installer copies the script, so a `git pull` alone doesn't update the command:

```bash
cd /opt/forge-deploy && git fetch origin && git reset --hard origin/main
sudo bash scripts/install-forge-deploy.sh
forge-deploy --version                   # confirm it matches the repo
```

### 5. The site shows a 502 / "Bad Gateway" (behind a reverse proxy or tunnel)

The chain is `browser → proxy/tunnel → host reverse proxy → forge-ui`. Test each hop from the host, bypassing the outer layers:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4200/                 # forge-ui itself (expect 200)
curl -sk -o /dev/null -w '%{http_code}\n' https://127.0.0.1:443/ -H 'Host: forge.example.com'  # host proxy
```

- **forge-ui returns 200 but the host proxy 502s** → the host proxy's forge vhost points at the wrong upstream (e.g. an old IP/port). Re-run `forge-deploy --edge --host forge.example.com` to regenerate a correct vhost.
- **forge-ui shows a friendly "under maintenance" dragon page** → that's intentional: the UI is up but can't reach the API. Fix the API path (next section).

### 6. Split deployment: the web box can't reach the API box

The API binds to `127.0.0.1` by default (local-only), so another machine can't reach it. On the **API box**:

```bash
# in .env: API_BIND=0.0.0.0   (or the LAN IP), then redeploy:
forge-deploy <version> --service api
ss -tlnp | grep ':5000'                  # should show 0.0.0.0:5000, not 127.0.0.1:5000
```

From the **web box**, confirm reachability, then (re-)wire it:

```bash
curl -sS http://<API-BOX-IP>:5000/api/v1/health     # must return Healthy JSON
forge-deploy --setup --role ui --api-url http://<API-BOX-IP>:5000 --host forge.example.com
```

(If a host firewall is in the way: `sudo ufw allow from <WEB-BOX-IP> to any port 5000` on the API box.)

### 7. The stack starts but the app won't load / health check fails

```bash
docker compose ps                        # which containers are unhealthy?
docker logs forge-api --tail 100         # API errors (schema, DB connection)
docker logs forge --tail 50              # Postgres
curl -s http://localhost:5000/api/v1/health   # composite health (db, storage, hangfire, signalr)
```

On a fresh database the API applies the whole declarative schema on first start, and it waits for Postgres + MinIO to be healthy first — so the first boot can take a couple of minutes on a low-RAM host.

### Still stuck?

Open an issue on the relevant repo ([forge-deploy](https://github.com/armoryworks/forge-deploy/issues) for install/ops, [forge-api](https://github.com/armoryworks/forge-api/issues) / [forge-ui](https://github.com/armoryworks/forge-ui/issues) for bugs) and include `scripts/forge-preflight` output, `docker compose ps`, and the relevant `docker logs`.

---

## For contributors

Clone this umbrella repo and run the bootstrap script — it clones the sibling repos as children of the wrapper so you have the full project laid out for cross-cutting work:

```bash
git clone https://github.com/armoryworks/forge.git
cd forge
./bootstrap.sh        # Linux/macOS
.\bootstrap.ps1       # Windows
```

After bootstrap your layout is:

```
forge/                 ← this repo (docs, governance)
├── forge-ui/          ← Angular code
├── forge-api/         ← .NET code
├── forge-deploy/      ← docker-compose + scripts
├── forge-test/        ← public test SPA + manual test plans
└── forge-voice/       ← Asterisk voice / telephony integration
```

[forge-db](https://github.com/armoryworks/forge-db) is deliberately *not* cloned by bootstrap — clone it separately if you're changing the database schema, and read its README first.

The bootstrap script hard-links the overlay compose files (`docker-compose.{dev,demo,cohost,export}.yml`) from `forge-deploy/` and junctions `tools/` so edits propagate locally. These overlays are tracked in **both** repos; CI verifies they stay byte-identical. If a `git checkout` ever breaks the inode share, run `bash scripts/relink.sh` (verify with `bash scripts/check-overlay-parity.sh`).

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR.

---

## Project documentation

Specs and architecture decisions live in [`docs/`](./docs/):

- [`architecture.md`](./docs/architecture.md) — tech stack, auth model, integrations
- [`functional-decisions.md`](./docs/functional-decisions.md) — kanban, order management, financials
- [`coding-standards.md`](./docs/coding-standards.md) — code conventions across UI + server
- [`roles-auth.md`](./docs/roles-auth.md) — tiered authentication and role definitions
- [`implementation-status.md`](./docs/implementation-status.md) — feature status tracker
- [`[ARCHIVE]qb-integration.md`](./docs/%5BARCHIVE%5Dqb-integration.md) — QuickBooks integration boundary (archived; superseded by the pluggable accounting-provider model)

Visual flow specs live in [`specs/`](./specs/) (SVG files).

---

## Release coordination

Each sibling repo versions independently. [`release-manifest.md`](./release-manifest.md) records which versions were tested together as a platform release; `forge-deploy --list` shows what is currently published per component.

---

## License

[Apache 2.0](./LICENSE) — see the LICENSE file for full terms.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.
