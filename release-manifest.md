# Release Manifest

Each row is a tested combination of sibling repo versions that ship
together as a release of the forge platform.

When installing, pull the sibling versions named in the row matching the
master tag you're targeting. The `forge-deploy` repo's
`docker-compose.yml` references the `forge-ui` and
`forge-api` image tags by version, so checking out the right
deploy tag automatically pulls the right images.

## Releases

| Master tag | UI | Server | Deploy | Test | Notes |
|---|---|---|---|---|---|
| `v0.0.1` | `v0.0.1` | `v0.0.1` | `v0.0.1` | `v0.0.1` | Initial extraction from monorepo. Same code as `forge-wrapper@7820bdd` (the last commit before the split). |

## How to release

1. Pick the sibling versions to bundle. They are already tagged
   automatically — image repos (`forge-api`, `forge-ui`,
   `forge-test`) auto-bump patch on every main push and publish
   `<X.Y.Z>` tags to GHCR. See
   [docs/cicd-design.md §Phase 8 addendum](./docs/cicd-design.md) and
   [forge-deploy/CONTRIBUTING.md](https://github.com/danielhokanson/forge-deploy/blob/main/CONTRIBUTING.md)
   for the auto-bump model.
2. Update `forge-deploy/docker-compose.yml` to reference the
   chosen image tags. Tag and release `forge-deploy` (manual,
   no auto-bump — deploy repo publishes no image).
3. Add a row to this manifest with the master tag + sibling versions.
4. Tag this repo (`git tag -a vX.Y.Z -m "..."`) and push.
5. Create a GitHub release on this repo summarizing what's in the bundle
   (link the sibling release pages for full changelogs).

## Versioning policy

- **Independent semver per repo.** A bug fix in the UI doesn't bump the
  server's version.
- **Image repo patch bumps are automatic.** `forge-api`,
  `forge-ui`, and `forge-test` derive patch from
  `BASE + (commits since VERSION was last touched)` in CI. Operators
  bump minor/major by editing the `VERSION` file at the repo root and
  pushing; the next CI build picks up the new base and resets distance
  to 0.
- **Deploy repo + this umbrella repo stay manual.** Neither publishes
  a Docker image; their releases are git tags created on demand.
- **Master version is set by the maintainer**, not auto-derived. Use it
  to signal "this is a recommended bundle" — typically minor or patch
  for refreshes, major when the platform behavior changes meaningfully.
- **Breaking API changes** (server major bump) MUST coincide with a UI
  major bump that consumes the new contract. The master tag MAY (but
  doesn't have to) bump major to flag the discontinuity to users.
