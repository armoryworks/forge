---
type: delivery
status: in-progress
---

# Context — why the website fronts the upgrade, and why it never performs it

Source: design conversation, 2026-08-28. Companion to [SPEC.md](./SPEC.md).
This file is the *why*; the spec is the *what*.

## The goal

A shop owner with no operator on staff must be able to keep Forge current and
healthy without a terminal. Today the honest answer to "how do I upgrade?" is
`ssh` to the box and run `./forge-upgrade.sh`, or open a second web app on
`:8484` with a token pasted out of `/etc/forge/panel.token`. Both work. Neither
is something a molding shop's owner does on a Tuesday afternoon.

## The design that was rejected

The obvious reading of "make upgrading an admin function of the website" is:
mount `/var/run/docker.sock` into `forge-api`, add an `AdminUpgradeController`
that shells out to `docker compose`, done. That was rejected for three reasons,
each independently fatal.

**Self-replacement.** `forge-api` and `forge-ui` are precisely the containers an
upgrade destroys. `deploy_service()` does `compose up -d --force-recreate` and
then waits up to `HEALTHCHECK_TIMEOUT_SECS` (default 300) for health, and rolls
back to `prior_tag` if the gate fails. A request handler living inside the
container being recreated cannot supervise that, and cannot perform the
rollback — it dies at the swap, before the part that matters.

**Privilege.** No service in `docker-compose.yml` mounts the docker socket. That
is not an oversight. The socket is root-equivalent on the host, and `forge-api`
is the process sitting behind a public edge with SSO, file upload, and a
164-capability authorization surface. Trading that boundary for a convenience
button is the worst trade available.

**Bootstrap.** The first install has no website. Recovery when the API is the
broken thing has no website. `--recover` and `--fresh-start` exist for exactly
the moments when the in-app path is gone by definition.

## The design that follows from those constraints

Separate *who decides* from *who executes*.

The website decides: it authenticates the owner against Forge's own roles and
capabilities, shows what is running versus what is available, presents the
destructive-schema disposition, records the decision in Forge's audit log, and
hands a job to the executor.

A small privileged host agent executes: it holds the docker access, it runs the
same `scripts/forge-deploy` an operator would, it survives the API and UI
containers being destroyed and recreated underneath it, and it keeps the job's
state on disk so the browser can find out what happened after reconnecting.

That agent already exists in all but name. `panel/server.mjs` (shipped
2026-08-26, commit bd2941e) is a systemd service running as the invoking user,
token-authed, that maps each button to a **fixed argv** against the CLI so the
panel cannot bypass an invariant the CLI enforces. The work is not to build an
executor. It is to take the UI off the executor, put it inside Forge where the
authorization model already lives, and teach it the actions it is missing.

## The constraint that shapes everything else

`scripts/forge-deploy` is 2,700 lines of accumulated correctness: GHCR tag
verification before `.env` is touched, `.env` pin reverted on every failure
path, a pre-reconcile backup that aborts the deploy if it fails, the
`pre-migrate script(s) were already applied` case where a halt is *not* a safe
resting place, remote-DB reachability checked before anything is swapped,
health-gated auto-rollback to `state.prior`.

None of that gets reimplemented in C#. Every path the website offers is a fixed
argv against that script. If a behavior is wanted in the website, it is added to
the CLI first and exposed second. The CLI stays the ground truth; the website is
a face on it, and the terminal path must remain fully functional forever.

Related: [[forge-db-harness]] (the schema tier and its gates), [[forge-platform]]
(deploy chain, box roles).
