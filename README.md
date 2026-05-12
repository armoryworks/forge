# forge

Open-source manufacturing operations platform. QuickBooks-integrated
engineering and production management for small-to-mid shops.

> **This is the umbrella repo.** The actual code lives in sibling repos:
>
> - **[forge-ui](https://github.com/danielhokanson/forge-ui)** — Angular 21 frontend
> - **[forge-api](https://github.com/danielhokanson/forge-api)** — .NET 9 API + EF migrations
> - **[forge-deploy](https://github.com/danielhokanson/forge-deploy)** — docker-compose + ops scripts (start here to install)
> - **[forge-test](https://github.com/danielhokanson/forge-test)** — manual test plans for human testers

This repo holds project-level documentation, governance, and the
release manifest pinning which sibling versions ship together.

---

## What is this?

A manufacturing-shop operations platform covering the full quote-to-cash
lifecycle: leads, quotes, sales orders, jobs, kanban shop floor, time
tracking, inventory, purchasing, shipping, invoicing, payments, returns.
Designed for shops that use QuickBooks Online as their accounting system
of record but want richer operational tooling on top.

Runs as a self-hosted docker-compose stack. Single-node by default;
designed to scale to small-team use without a Kubernetes commitment.

---

## Get started (for users)

```bash
# Clone the deploy repo
git clone https://github.com/danielhokanson/forge-deploy.git
cd forge-deploy

# Run the setup wizard (Linux/macOS)
./setup.sh

# Or on Windows
.\setup.ps1
```

The setup script handles prerequisite checks, env file generation, JWT
key creation, and starts the stack via `docker compose up -d`. See
[forge-deploy](https://github.com/danielhokanson/forge-deploy) for
full installation docs.

---

## Get started (for contributors)

Clone this umbrella repo and run the bootstrap script — it clones all
five sibling repos into sibling directories so you have the full project
laid out for cross-cutting work:

```bash
git clone https://github.com/danielhokanson/forge.git
cd forge
./bootstrap.sh        # Linux/macOS
.\bootstrap.ps1       # Windows
```

After bootstrap, your directory layout looks like:

```
.../wherever/
├── forge/          ← this repo (docs, governance)
├── forge-ui/       ← Angular code
├── forge-api/   ← .NET code
├── forge-deploy/   ← docker-compose + scripts
└── forge-test/     ← manual test plans
```

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR.

---

## Project documentation

Specs and architecture decisions live in [`docs/`](./docs/):

- [`architecture.md`](./docs/architecture.md) — tech stack, auth model, integrations
- [`functional-decisions.md`](./docs/functional-decisions.md) — kanban, order management, financials
- [`coding-standards.md`](./docs/coding-standards.md) — code conventions across UI + server
- [`qb-integration.md`](./docs/qb-integration.md) — QuickBooks integration boundary
- [`roles-auth.md`](./docs/roles-auth.md) — tiered authentication and role definitions
- [`implementation-status.md`](./docs/implementation-status.md) — feature status tracker

Visual flow specs live in [`specs/`](./specs/) (SVG files).

---

## Release coordination

Each sibling repo versions independently. The
[`release-manifest.md`](./release-manifest.md) records which versions
were tested together as a release of the platform. When you install,
pull the sibling versions named in the manifest entry that matches the
master tag you're targeting.

---

## License

[GPL](./LICENSE) — see the LICENSE file for full terms.

---

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
By participating, you agree to abide by its terms.
