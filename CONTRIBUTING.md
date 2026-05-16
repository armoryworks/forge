# Contributing to forge

Thanks for your interest. This is the project-wide contributor guide.
For per-repo specifics (build instructions, test commands), see the
`CONTRIBUTING.md` in each sibling repo.

## The repos

| Repo | What it owns |
|---|---|
| [forge](https://github.com/armoryworks/forge) | Project docs, architecture, governance, release manifest |
| [forge-ui](https://github.com/armoryworks/forge-ui) | Angular frontend |
| [forge-api](https://github.com/armoryworks/forge-api) | .NET backend + EF migrations |
| [forge-deploy](https://github.com/armoryworks/forge-deploy) | docker-compose, ops scripts |
| [forge-test](https://github.com/armoryworks/forge-test) | Manual test plans |

Open issues, PRs, and discussions in the repo that owns the affected
code. Cross-cutting design discussions go in this umbrella repo.

## Getting set up

```bash
git clone https://github.com/armoryworks/forge.git
cd forge
./bootstrap.sh        # clones all four sibling repos as ../forge-*
```

For dev environment setup (running the app locally), follow the README
in [forge-deploy](https://github.com/armoryworks/forge-deploy).

## Branch model

Each sibling repo uses the same flow:

- `main` = released, tagged code
- `develop` = integration branch
- `feature/*` = your work-in-progress branches

PRs target **`develop`**, not `main`. Releases happen via PRs from
`develop` to `main`, which trigger image build + tag.

## Pull requests

- Branch off the latest `develop`.
- One logical change per PR. Smaller is easier to review.
- Commit messages: imperative mood, < 72 characters for the subject.
  Example: `fix(invoices): preserve customer PO when invoice is regenerated`.
- The PR description should explain the *why*, not the *what* (the diff
  shows the what).
- All PRs must pass CI (build + unit + integration tests).
- For UI changes, attach a screenshot or short clip.
- For server changes touching the database, include the EF migration in
  the same PR.

## Coding standards

See [`docs/coding-standards.md`](./docs/coding-standards.md) for the
canonical version. Highlights:

- One class/component/service per file. No barrel files.
- C# methods are PascalCase; TS variables are camelCase; signals have no
  `$` suffix; observables do.
- Models are `*ResponseModel` / `*RequestModel` — never "DTO".
- No `try/catch` in controllers; let middleware handle it.
- Forms use the shared `<app-input>`, `<app-select>`, etc. wrappers —
  never raw `<input>` in feature templates.

## Testing expectations

- **Unit tests** for new logic in services, handlers, pipes.
- **Integration tests** for new API endpoints.
- **Manual test plans** in `forge-test/` for new user-facing
  features that benefit from human verification.
- E2E (Playwright/Cypress) is not required on every PR — runs nightly
  and on `release/*` branches.

## Reporting bugs

File issues in the repo that owns the affected code. Include:

- What you did
- What you expected to happen
- What actually happened (logs, screenshots, version numbers)
- The version of the platform you're on (master tag from
  [release-manifest.md](./release-manifest.md))

Security issues: do **not** file a public issue. Email the maintainer
listed in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Questions

Open a GitHub Discussion on the umbrella repo for project-wide
questions; per-repo Discussions for code-specific ones.
