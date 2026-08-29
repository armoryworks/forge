---
type: delivery
status: in-progress
---

# Self-Service Upgrade — upgrading every tier from inside Forge

Implementation specification. Written for a shop that has no operator on staff
and must still stay current, backed up, and recoverable.

---

## 0. Scope and principles

**In scope**

1. `forge-agent` — the existing `panel/server.mjs` reworked into a headless,
   privileged, disk-backed job runner over `scripts/forge-deploy`.
2. An admin surface in `forge-api` that authorizes, audits, and dispatches
   upgrade jobs to the agent.
3. An `admin/updates` screen in `forge-ui`: what is running, what is available,
   what an upgrade will do, what it did.
4. Multi-box coordination for the split roles (`ui`, `api`, `db`, `ui+api`,
   `api+db`).
5. The destructive-schema disposition, presented in a browser rather than a TTY.
6. A role × failure-mode test matrix that is actually run.

**Out of scope**

- Reimplementing any deploy logic in C#. Every action is a fixed argv against
  `scripts/forge-deploy`.
- First install, `--recover`, `--fresh-start`, `--self-update`, `--wizard`.
  These stay CLI-only (§9).
- Unattended/automatic upgrades. A human presses the button. Scheduling is a
  later effort and must not be assumed by this design.
- Upgrading the mobile app. Store-distributed, separate lifecycle.

**Principles**

- The website decides; the agent executes. Trust flows API → agent, never back.
- The agent is the only component with docker access. `forge-api` never gets the
  socket, in any topology, for any reason.
- A job outlives the connection that started it, and outlives the containers it
  replaces. Job state lives on the agent's disk.
- Every argv the agent can run is a compile-time constant. Nothing from an HTTP
  request ever reaches a command line.
- The terminal path never regresses. If the website can do it, the CLI could
  already do it.
- Degrade honestly. When the API is mid-swap the screen says so; it does not
  invent progress.

---

## 1. Topology and trust

```
   browser (owner, authenticated to Forge)
      │  Forge session JWT, Admin role + capability
      ▼
   forge-ui ──► forge-api            [containers — replaced by the upgrade]
                   │
                   │ POST /jobs, shared secret, loopback or host-gateway
                   ▼
              forge-agent            [systemd on the host — NOT replaced]
                   │  fixed argv
                   ▼
          scripts/forge-deploy ──► docker compose ──► GHCR
```

The agent binds `127.0.0.1` by default. On a single-box install `forge-api`
reaches it via `host.docker.internal` / `host-gateway`. On split boxes the
coordinating agent reaches peer agents over the LAN (§6), and only then does the
agent bind a LAN address.

**Secrets.** `/etc/forge/agent.token` (mode 0640, root:forge) replaces
`/etc/forge/panel.token`. `forge-api` receives it as `Deploy__AgentToken` via
compose env, sourced from `.env` like every other secret. The browser never sees
it — this is the substantive difference from the panel, where the token was
pasted into a text box and kept in `localStorage`.

**Authorization** is Forge's, not the agent's. The agent trusts the shared
secret and nothing else; it has no concept of users. The decision about *who*
may upgrade is made in `forge-api` — `[Authorize(Roles = "Admin")]` plus a new
non-bootstrap capability (§3), matching how `AdminDatabaseController` gates
dump/import today.

---

## 2. forge-agent

Derived from `panel/server.mjs`. Same file, same zero-dependency posture, same
systemd install path; the HTML constant and the browser-facing token dialog come
out, a job model goes in.

### 2.1 Action registry

The panel's six actions become the full set the website needs. Each is a fixed
argv; the request supplies at most an enum selector, never a string that reaches
the shell.

| action | argv | notes |
|---|---|---|
| `status` | `--status` | synchronous |
| `components` | `--components` | synchronous; box scope |
| `list` | `--list` | synchronous; releases × build tags |
| `check` | `--update --check` | synchronous; **exit 10 = behind** |
| `update` | `--update` | job |
| `updateApprove` | `--update --allow-destructive` | job; requires `confirm: "APPLY"` |
| `deployService` | `<tag> --service <svc>` | job; `svc` ∈ `api\|ui\|test\|demo`, `tag` validated against the CLI's own `TAG_RE_SEMVER` / `main-<7hex>` before use |
| `rollback` | `--rollback [svc]` | job |
| `logs` | `--logs` | synchronous |

`deployService` is the only action taking caller input. Both parameters are
validated against a whitelist derived from `SERVICES` and the tag regex, and
rejected — not sanitized — on mismatch.

### 2.2 Job model

```
POST /jobs {action, svc?, tag?, confirm?}  -> 202 {jobId}
GET  /jobs/{id}                            -> {state, exitCode, startedAt, endedAt, needsApproval, log}
GET  /jobs/{id}/log?offset=N               -> incremental text
GET  /jobs/current                         -> the running job, or null
```

- `state` ∈ `running | succeeded | failed | halted-destructive`.
- One job at a time per box. A second `POST` while one runs returns `409` with
  the running job's id — the panel's current single-flight rule, kept.
- Job records live in `/var/lib/forge-agent/jobs/<id>/` (`meta.json` + `log`),
  survive an agent restart, and are pruned to the last 20.
- The child is spawned detached with its own process group and `stdio` to the
  log file, so an agent restart mid-deploy does not kill the deploy. On startup
  the agent reconciles: a job whose pid is gone and whose `meta.json` has no
  exit code is marked `failed` with `reason: agent-restarted`.
- `halted-destructive` is set when the child exits non-zero **and** the log
  matches the CLI's halt banner (`DESTRUCTIVE schema changes detected — deploy
  HALTED`). The agent additionally parses the numbered dispositions emitted by
  `enumerate_destructive()` into `needsApproval.statements[]` so the browser can
  render them as a list rather than as scraped text.

### 2.3 What the agent must not do

- No shell string interpolation. `spawn('bash', [CLI, ...argv])`, as today.
- No action that is not in the registry, including "run arbitrary CLI args".
- No binding to `0.0.0.0` unless `--peer` mode is explicitly configured (§6).
- No serving of HTML. The agent has no UI. The panel's page is retired; the
  break-glass path is the CLI, not a second web app.

---

## 3. forge-api surface

`AdminUpdatesController`, sibling of `AdminDatabaseController`, same shape:

```csharp
[Authorize(Roles = "Admin")]
[CapabilityBootstrap]
public class AdminUpdatesController(IMediator mediator, IDeployAgentClient agent) : ControllerBase
```

**Bootstrap-exempt, not a new capability** — reversed during implementation. The
first draft called for a `SYSTEM-UPGRADE` capability, default-off and
owner-grantable. Three things argued it down:

- Upgrading is a *recovery* surface, and the closest precedent in the codebase
  says so: `AdminDatabaseController` is bootstrap-exempt because it is "the
  recovery tool an admin reaches for when an install is in a bad state, so it
  must never itself be gated off." A capability misconfiguration is one of the
  states an upgrade fixes; gating the fix behind the broken subsystem is
  backwards.
- The control it was supposed to buy already exists, and is stronger. A shop
  that wants upgrades to remain its integrator's job does not install the agent
  — which removes the mechanism, rather than hiding a button in front of a
  mechanism that still works. `Deploy:AgentUrl` unset is a supported, first-class
  state, not a degraded one.
- A new catalog entry is not free: `CapabilityCatalog` is ratcheted against
  CLAUDE.md's stated count, and `TrainingCoverageRatchetTests` fails the build
  for any capability shipped without a training module. That cost is worth
  paying for a feature; it is not worth paying to express "Admin, but not
  upgrades," which the role already expresses.

Access is therefore the `Admin` role plus the agent having been deliberately
installed and wired.

| endpoint | maps to |
|---|---|
| `GET  /api/v1/admin/updates/state` | agent `status` + `components` + container inventory |
| `GET  /api/v1/admin/updates/available` | agent `check`, exit 10 → `behind: true` |
| `POST /api/v1/admin/updates/jobs` | agent `POST /jobs` |
| `GET  /api/v1/admin/updates/jobs/{id}` | agent `GET /jobs/{id}` |
| `GET  /api/v1/admin/updates/jobs/{id}/log` | agent log, incremental |

Every `POST` broadcasts `upgradeStateChanged` on `NotificationHub`
(`Clients.All`, generic envelope only) and writes a Forge audit entry, both
before dispatching to the agent — while the API is still alive to do either.
An `IHostedService` re-broadcasts terminal state on the next API startup, which
is how consoles learn the upgrade finished.

The audit entry records: actor, action, target
tag, and for `updateApprove` the full list of destructive statements the owner
accepted. The CLI's `/var/log/forge-deploy.log` records *what the box did*;
Forge's audit log must record *who told it to*.

`IDeployAgentClient` is a thin typed `HttpClient` over the agent, registered
unconditionally; `IsConfigured` is false when `Deploy__AgentUrl` is unset. Every
method then degrades to a value rather than an exception, because "no agent on
this box" is a supported deployment (cohosted, or Tuyere-managed) and not a
fault. `GET state` returns `200` with `agentAvailable: false` so the screen can
render the real situation; the action endpoints return `503` naming the terminal
path. Returning a value rather than throwing also keeps the controller free of
the try/catch the standards ratchet forbids.

---

## 4. forge-ui surface

`features/admin/updates`, next to the existing `features/admin/database`.

**Resting state.** A table of tiers — API, Web UI, Database schema, and any
optional profiles present — each with its running tag, its configured `.env`
pin, and whether those differ (the CLI already surfaces the running-vs-recorded
divergence; d929e97). Plus one line: "Up to date on 1.0.0-beta.24" or "Newest
release is 1.0.0-beta.25."

**Starting an upgrade.** One primary button, "Upgrade all components." Per-tier
deploy and rollback live behind an "Advanced" disclosure, because deploying one
tier alone is how a shop ends up with a new UI talking to an old API (§4.1).

**During.** Poll `jobs/{id}` on a 2s interval and append the log. When the poll
fails — which it *will*, because `forge-api` is one of the things being
recreated — show "Forge is restarting as part of the upgrade. Reconnecting…"
and keep polling. Do not show an error, do not navigate away, do not clear the
log. When the API returns, resume from the log offset. The job id is held in
`sessionStorage` so a reload during the swap recovers the same job.

**Destructive halt.** When the job ends `halted-destructive`, render
`needsApproval.statements[]` as a numbered list with the CLI's own three
dispositions ("ok to delete" / "cannot until x,y,z" / "cannot delete") and the
warning that a pre-reconcile backup was taken and the schema may have already
moved ahead of the running app if pre-migrate scripts committed. Continuing
requires typing `APPLY`, exactly as the panel does. Nothing about this gate gets
softened for the browser.

**After.** Outcome, duration, from→to per tier, and a link to the deploy log.

### 4.1 Ordering across tiers

An "upgrade all" job is one CLI invocation (`--update`), and the CLI already
does the right thing: it computes the newest semver tag published for *every*
component this box runs (intersection, so a half-published release is never
offered), pins `SCHEMA_IMAGE_TAG` in lockstep, and reconciles the schema inside
the `api` deploy *before* the app swap. The UI must not decompose this into
per-tier calls. The tier table is a view; the job is atomic at the CLI level.

### 4.2 The upgrade lock

While a job runs, **every** console is locked — not just the one that started
it. A shop floor of tablets should not discover the upgrade by getting errors.

**Transport: pub-sub, over the hub that already exists.** `NotificationHub`
(`/hubs/notifications`) is broadcast to with `Clients.All.SendAsync(...)` today
by `ToggleCapability`; the upgrade uses the same house pattern. On the UI side
`SignalrService` already has `withAutomaticReconnect`, a manual retry after
retries are exhausted, and a global connection state — the machinery the lock
needs is in place and does not have to be invented.

`AdminUpdatesController` broadcasts `upgradeStateChanged` **before** dispatching
the job to the agent, while the API is still alive to broadcast. Every console
locks at that moment.

**The API's disconnect is part of the signal, not a failure.** Seconds later the
API container is recreated and every hub connection drops. That is expected and
already modeled by `SignalrService`'s reconnect states — the console holds the
lock through the disconnect rather than falling back to a generic error screen.

**Survival channel while the publisher is dead.** Pub-sub cannot cover the
window where the publisher is the thing being replaced, so `/upgrade-status.json`
(§ below) is read in exactly two cases: a page loaded *fresh* mid-upgrade (there
was no broadcast to receive), and while the hub is disconnected. When the hub
reconnects, pub-sub resumes and the file is ignored. This is not a polling
architecture with a push optimization; it is push, with a file covering the
minutes when nothing can push.

**Completion** arrives as a broadcast on the far side: an `IHostedService` on
API startup asks the agent for `jobs/current`, and if the last job ended it
broadcasts terminal state. Consoles then force one hard reload — required
regardless, because the SPA bundle they are running has just been replaced.

#### Two audiences, two payloads

| audience | sees |
|---|---|
| every console | "Forge is being updated. This screen will come back on its own." No versions, no tiers, no logs. |
| the `Admin` role | per-tier progress, the live deploy log, destructive statements, from -> to tags |

This split is a **security boundary, not a copywriting choice.** The broadcast
goes to `Clients.All`, so its payload carries the generic envelope only —
`{state, startedAt, expiresAt}`. Putting tags, tier names, or schema DDL in it
would push the shop's upgrade internals, including proposed `DROP COLUMN`
statements, to every logged-in tablet. Operator detail travels the authenticated
`admin/updates/jobs/{id}` path instead, which is already capability-gated.

The same rule governs the marker file, which nginx serves unauthenticated to the
login screen and any browser that asks: generic envelope only. No job id, no
action name, no tag, no log text.

#### The marker file

- The agent writes `/var/lib/forge-agent/upgrade.json` on job start and settles
  it on completion.
- `forge-ui` mounts that directory read-only; nginx serves it at
  `/upgrade-status.json`. No API involvement, so it is available exactly when
  the API is not.
- It carries `expiresAt`, derived from `HEALTHCHECK_TIMEOUT_SECS` x the tier
  count plus a margin. **A lock nobody can clear is worse than no lock**: if the
  agent dies holding the marker, every console releases itself at `expiresAt`
  rather than leaving a shop unable to use Forge.

| hub | marker | console behavior |
|---|---|---|
| broadcast received | — | lock, generic or detailed by capability |
| disconnected | running | hold the lock, "Forge is restarting" |
| connected | succeeded / absent | one hard reload, then normal |
| disconnected | absent or expired | real outage, existing error path |

Unauthenticated sessions have no hub connection (`NotificationHub` is
`[Authorize]`), so the login screen is marker-only — which is the right amount:
it needs the generic notice and nothing else.

Blue/green on the UI tier (§5) is what keeps nginx alive to serve both the SPA
and the marker while the API is away.

---

## 5. Cutover strategy, tier by tier

The instinct is dual-bank, the way router firmware does it: bring the new
version up beside the old, verify it, flip, retire the old. That is correct for
the stateless tiers and impossible for the stateful one, and the asymmetry
decides the design. Dual-bank works on a router because the inactive bank is
*inert*. Here the second copy would share the live database — it is not inert,
and that is the whole problem.

**Web UI — blue/green, genuinely.** `forge-ui` is nginx serving static assets
with no state. Bring `forge-ui-next` up on a second internal port, health check
it, flip the edge upstream, retire the old container. Zero downtime, and
rollback is flipping back. This is a clear win over the current
`up -d --force-recreate`, and it is what keeps the upgrade-lock modal (§4.2) on
screen while the API is away.

**API — in-place swap with the health gate, not blue/green.** Two API copies
share one Postgres. `forge-api` runs EF Core migrations on boot and gates
`/api/v1/health` on Postgres, Hangfire, MinIO and SignalR — so the moment the
"verification" copy boots, it has already migrated the schema out from under the
still-serving old copy. That is precisely the hazard `reconcile_schema()`
already names when pre-migrate scripts commit before a halt: a halt there is not
a safe resting place. A parallel copy is also not passive — it picks up Hangfire
work and does real things to real data. Blue/green would only be sound for
strictly additive releases, and the release train does not promise that. Keep
`deploy_service()`'s swap -> health gate -> auto-rollback-to-`prior`, which
already works and is already tested.

**Database — not parallelizable at all.** One volume, one truth. The schema tier
gets forward-only apply with a pre-reconcile backup, as today.

**What replaces "verify before cutover": rehearsal on a clone.** The valuable
half of the idea survives, and the harness for it already exists. Before
touching production: restore the pre-reconcile backup into a scratch database,
run `forge-db apply` against the clone, boot the target API image against it,
health check, tear it down. A pass means the real deploy is very likely to pass;
a fail costs production nothing and reports the real error before any change.
This catches the failure the current health gate can only catch *after* it has
already migrated production.

Rehearsal is resource-gated. `forge-api` carries a 2G compose limit and the
Armory Plastics box is a Pi — a clone plus a second API will not fit. The agent
measures available memory and disk, skips rehearsal when it will not fit, and
**says so on the screen**. Silently skipping the safety step is worse than not
having it.

---

## 6. Split-box coordination

`role_scoped_out()` defines six shapes: `all`, `ui+api`, `api+db`, `ui`, `api`,
`db`. Only `all` and `api+db` are self-contained; the rest need a peer.

**Coordinator = the box that runs the API.** The API box owns the schema
reconcile (or, with a remote DB, is the box that must reach it — `reconcile_
schema()` already skips locally and defers to the DB box, and `deploy_service()`
already aborts on `check_remote_reachable` failure before touching anything).
It is also the only box whose agent `forge-api` can reach from inside a
container without new network surface.

**Peer registration.** `.env` on the coordinator gains
`FORGE_PEER_AGENTS="ui=http://192.168.1.92:8484"`. Peers bind their LAN address
and accept the same shared secret. A peer agent runs exactly the same fixed-argv
registry — there is no separate "peer protocol" to get wrong.

**Order.** Schema (DB box, or in-line on the API box) → API → UI. The
coordinator runs its own tiers to completion and only then dispatches the UI
box's job. A failure at any step stops the sequence and reports which tiers
moved; the CLI's per-service auto-rollback has already restored the failed tier,
but a *partial* upgrade across boxes is a state the screen must name explicitly
rather than round off to "failed."

**Version skew.** Between the API deploy finishing and the UI deploy finishing,
the shop is running new API + old UI. That window is unavoidable in a split
topology and is the argument for keeping it short and sequential, not parallel.

---

## 7. Failure modes the screen must name

| condition | what the owner sees |
|---|---|
| API container mid-swap | "Forge is restarting as part of the upgrade. Reconnecting…" |
| Health gate failed, rolled back | "Version X did not start correctly. Rolled back to Y. Nothing was lost." + log |
| Destructive schema halt | Numbered statements, backup confirmation, `APPLY` gate |
| Pre-migrate already committed | The CLI's warning, verbatim: the DB has moved ahead; roll forward or restore |
| Pre-reconcile backup failed | "Upgrade stopped before any change. Backups are not working — fix that first." |
| Tag missing in GHCR | "Release X is not fully published yet." |
| Registry unreachable | "Could not reach the update server." Not "you are up to date." |
| Remote DB unreachable (split) | "Cannot reach the database box. Nothing was changed." |
| Agent unreachable | "Upgrades are unavailable from here — run `./forge-upgrade.sh` on the server." |
| Partial cross-box upgrade | Per-tier from→to, and which box did not complete |

The registry-unreachable row is the one most likely to be got wrong. `cmd_update`
dies rather than reporting "current" when it cannot list tags; the UI must
preserve that distinction, because silently reporting an unreachable registry as
"up to date" is how an install sits three releases behind for a year.

---

## 8. Backups and maintenance, same surface

Upgrading is the sharp end, but the screen this effort creates is the natural
home for the rest of "keeping Forge healthy," and the pieces already exist:
`forge-backup` sidecar with `backup.sh`, `doctor.sh`, `scripts/forge-preflight`,
`--status`, `--logs`. Adding read-only agent actions for backup recency and a
`doctor` run is cheap once the agent and the controller exist, and it turns
`admin/updates` into `admin/system`. Deliberately staged after the upgrade path
works — noted here so the route and screen are not named too narrowly.

---

## 9. What stays CLI-only, permanently

`forge-upgrade.sh`, `--setup`, `--wizard`, `--recover`, `--fresh-start`,
`--self-update`, `--edge`, `--remote-db`, `--remote-api`, `--components`.

Rationale: the agent cannot upgrade itself while running (`--self-update`
replaces the agent's own source tree), the website cannot exist before the first
install, and every recovery path exists precisely for the case where the API is
the broken component. `docs/DEPLOY.md` and `TROUBLESHOOTING.md` remain the
operator's documentation; the website is additive.

The install flow gains one line at the end of `install-forge-deploy.sh`:
offer to install the agent, and say that upgrades will then be available under
Admin → Updates in Forge itself.

---

## 10. Build order

1. ~~**Agent.**~~ DONE. `panel/server.mjs` → `agent/server.mjs`: strip HTML, add the job
   model, disk-backed job records, detached child, restart reconciliation, the
   full action registry, destructive-statement parsing.
   `install-forge-panel.sh` → `install-forge-agent.sh`, `/etc/forge/agent.token`.
2. ~~**Peer mode.**~~ DONE. `FORGE_PEER_AGENTS`, coordinator sequencing. A job
   became a sequence of steps (local box, then each peer) whose outcomes are
   recovered from disk, so an agent restart mid-upgrade resumes rather than
   guesses. Partial cross-box upgrades are reported as a named state.
3. ~~**API.**~~ DONE. `IDeployAgentClient`, `AdminUpdatesController` (bootstrap-exempt),
   `StartDeployJob` with audit + broadcast, `UpgradeCompletionBroadcaster`.
4. ~~**Blue/green UI cutover.**~~ DONE. `forge-ui-next` on a second internal port, edge
   upstream flip, retire-old — in `scripts/forge-deploy` first, exposed second.
5. ~~**Upgrade lock transport.**~~ DONE. `upgradeStateChanged` on `NotificationHub`
   (generic envelope), startup re-broadcast hosted service, agent marker
   written to `upgrade.json`, `forge-ui` mounting and serving it at
   `/upgrade-status.json`.
6. ~~**UI.**~~ DONE. `features/admin/updates`, the global upgrade lock (§4.2) with its two
   payload levels, destructive-disposition dialog, per-tier advanced actions.
7. **Rehearsal on a clone.** Restore-to-scratch, `forge-db apply`, boot target
   API, health check, tear down — resource-gated with a visible skip.
8. **Test matrix.** §11.
9. **Docs.** `DEPLOY.md` section, `TROUBLESHOOTING.md` entry for "the Updates
   screen says the agent is unreachable."

**Status 2026-08-29: steps 1-6 are built and committed** across `forge-deploy`,
`forge-api` and `forge-ui` (branch `self-service-upgrade` in each, unpushed).
Remaining: step 7 (rehearsal on a clone), step 8 (the test matrix), step 9
(docs). Nothing in 1-6 has been exercised against real containers yet — that is
what step 8 is for, and it is the gate before any of this reaches a client box.

One deliberate omission: `panel/` is still on disk. It stays as the break-glass
until the matrix passes.

---

## 11. Test matrix

Six roles x the failure modes that can occur in each. Run against real
containers on a box with docker (the laptop, under `sg docker -c`; never with
`FORGE_TEST_PG` set).

Per role (`all`, `ui+api`, `api+db`, `ui`, `api`, `db`):

1. Clean upgrade, one release forward, every tier lands, health gate passes.
2. Already current — reports current, starts no job.
3. Registry unreachable — reports unreachable, **not** current.
4. Destructive schema present — halts, statements render, `APPLY` completes it.
5. Health gate fails on the new API — auto-rollback to `prior`, screen says so.
6. Agent killed mid-job — deploy completes anyway; agent reconciles on restart.
7. API container recreated mid-job — the hub drops and reconnects, the console
   holds the lock throughout, the log resumes, no false error is shown.
8. Second job while one runs — `409`, no double deploy.
9. Non-Admin — `403`, no dispatch.
10. Agent not installed — `503`, screen offers the terminal path.
11. Upgrade lock, pub-sub path: a second console already open receives the
    broadcast and locks without polling; a console opened fresh mid-upgrade
    locks from the marker; both release together; completion forces exactly one
    hard reload.
12. Upgrade lock, payload split: a non-Admin session sees only the generic
    message — assert the broadcast frame itself carries no tag, tier,
    or DDL, and that `/upgrade-status.json` carries no job id or action name.
13. Stale marker: agent killed with the marker present — every console releases
    at `expiresAt` rather than locking the shop out.
14. Login screen during an upgrade: shows the generic notice with no hub
    connection at all.
15. Blue/green UI: old container serves throughout, the upstream flips once, the
    old one is retired; a failed `forge-ui-next` health check leaves the old
    container serving and changes nothing.
16. Rehearsal: passes on an additive release; fails loudly and changes nothing
    on a broken one; skipped-with-notice on a box too small to run it.

Cross-box only (`ui` + `api+db`): coordinator sequencing, and a UI-box failure
after a successful API deploy reported as a named partial state.

The `forge-deploy` repo's CI is shellcheck-only and was red for 37 runs before
94b1cf1 — the agent is Node, so add it to the same workflow with `node --check`
plus a job-model unit test that does not need docker.

---

## 12. Things not to do

- Do not mount the docker socket into any application container.
- Do not reimplement backup, reconcile, health-gate, or rollback logic in C#.
  If the website needs a behavior, add it to `scripts/forge-deploy` first.
- Do not let the browser hold the agent token, or reach the agent directly.
- Do not expose the agent port through the public edge vhost.
- Do not soften the `APPLY` gate, shorten `HEALTHCHECK_TIMEOUT_SECS` to make the
  UI feel faster, or auto-approve destructive changes because a backup exists.
- Do not report an unreachable registry as "up to date."
- Do not run a second API container against the production database to
  "verify" a release. Rehearse against a clone, or do not rehearse.
- Do not let the upgrade lock outlive the agent that set it — `expiresAt` is
  not optional.
- Do not put a version tag, a tier name, or schema DDL in the `Clients.All`
  broadcast or in `/upgrade-status.json`. Both reach every tablet in the shop.
- Do not gate the upgrade surface behind a capability. It is a recovery tool,
  and a broken capability snapshot is one of the things it recovers from.
- Do not offer per-tier upgrades as the primary action.
- Do not remove the CLI path, or let it fall behind the website's capabilities.
