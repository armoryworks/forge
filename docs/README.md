---
title: Documentation Index & Conventions
type: technical
status: stable
id: docs-index
updated: 2026-05-22
---

# Forge Documentation — Index & Conventions

> This file is the map and the rulebook for `docs/`. New docs follow it; tooling
> enforces it (see [§6 Enforcement](#6-enforcement)). If you're an agent or a
> human about to create a doc, read [§5 Placement rules](#5-placement-rules) first.

## 1. Two kinds of docs, two organizing principles

| | **Reference / knowledge** | **Delivery / work** |
|---|---|---|
| Question it answers | "What's *true* about Forge" | "What we're *doing* to Forge" |
| Organized by | **type** (stable folder) | **status** (moves through a pipeline) |
| Lifespan | lives forever, cross-linked | transient; archived when done |
| Folders | `domain/ product/ technical/ business/ training/` | `delivery/{pending,in-progress,complete,abandoned}/` |

The reference layers are organized by *type* because a doc rarely changes type.
Delivery work is organized by *status* because that's what changes — and moving a
folder between stages (`git mv`) is a clean, visible signal.

## 2. Reference layers (by type)

| Folder | Holds | Rule of thumb |
|--------|-------|---------------|
| **`domain/`** | Vendor-neutral industry knowledge — how the manufacturing / quote-to-cash world works, independent of Forge. | "True even if Forge didn't exist." |
| **`product/`** | How Forge works, mapped to the domain — per-feature reference, UI flows, the Workflow Narrative Model. | "How a user accomplishes X in Forge." |
| **`technical/`** | How Forge is built — architecture, API, schema, coding standards, integrations, UI patterns, CI/CD, testing. | "How an engineer changes it." |
| **`business/`** | Cross-cutting rules, decisions, invariants, correctness/DoD specs. | "The *why*/policy behind behavior." |
| **`training/`** | Learning material (feeds the in-app LMS). | "Material to teach someone." |

## 3. Delivery layer (by status)

```
delivery/
  pending/       "going to"  — planned, not started
  in-progress/   "are"       — actively coding/modifying against
  complete/      "have been" — shipped AND verified (archive of the effort)
  abandoned/     dropped (keep a one-line why + superseded-by)
```

- **An effort is a folder, not a file:** `delivery/in-progress/<effort-slug>/`
  bundling spec + DoD + notes + evidence. Transition = one atomic
  `git mv delivery/in-progress/<slug> delivery/complete/<slug>`.
- **`complete/` is an archive of the *work*, not the source of truth.** When an
  effort finishes, its durable facts **graduate** into the reference layers
  (rules → `business/`, feature behavior → `product/`). Current truth always
  lives in reference; `complete/` is the historical record.
- **Transitions:** `pending → in-progress` when work starts; `→ complete` only
  when shipped *and* gate-green; `→ abandoned` with a one-line reason.

## 4. Frontmatter convention (every doc)

```yaml
---
title: Human Readable Title
type: domain | product | technical | business | training | delivery
status: stable | pending | in-progress | complete | abandoned
id: kebab-slug          # stable identity — survives folder moves; reference docs by id, not path
updated: YYYY-MM-DD
# optional:
owner: name
superseded-by: other-id
---
```

- Reference docs use `status: stable`.
- Delivery docs use a pipeline status that **must match the stage folder**
  (`delivery/in-progress/…` → `status: in-progress`).

## 5. Placement rules

1. **No new `.md` at `docs/` root** (except this index). Every doc lives in a
   category folder or under `delivery/<stage>/`.
2. **Every doc carries frontmatter** with at least `type` and `status` (§4).
3. **When unsure, default to `delivery/in-progress/`** — never `docs/` root. A
   triage default keeps ambiguity in a known place; it can be reclassified later.
4. **Root-level `.md` that stay at repo root:** `README.md`, `CLAUDE.md`,
   `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (convention). Everything else migrates.

## 6. Enforcement

| Layer | Mechanism |
|-------|-----------|
| Authoring (interactive **and** md-agent agents) | `PreToolUse` hook (`scripts/check-doc-placement.mjs`) blocks a *new* misplaced/frontmatter-less `docs/*.md`. |
| Project rule | `CLAUDE.md` → "Documentation Placement" section (read every session). |
| Backstop | `scripts/check-docs.mjs` audit (report now; CI hard-gate after the legacy migration stamps frontmatter). |
| Easy path | `/new-effort <slug>` scaffolds `delivery/in-progress/<slug>/` with frontmatter. |
| Drift | periodic re-classification audit (catches wrong-category, stale `in-progress`, `complete`-not-graduated). |

## 7. Current classification & migration map

> **Status: planned.** Files have NOT moved yet — the analysis journey references
> current paths. Physical migration (`git mv` + reference fixups) happens as one
> pass once the journey is done. This table is the decision record.

### Existing subdirectories

| Current | → Target | Notes |
|---------|----------|-------|
| `functional-reference/` (50 files) | **`product/`** | keep dir name; the per-feature "how Forge works" |
| `ui-flows/` | **`product/`** | per-feature UX flows |
| `ux/` | **`technical/`** (design) | design-system / UX specs *(judgment call)* |
| `domain/` | **split** → `business/` + `delivery/` | mislabeled today: `definition-of-correct*`, `cogs-ownership`, `qbo-tax-spec` → `business/`; the `f0xx-*-dod` specs → `delivery/` (per-effort). Frees the `domain/` name for true industry docs. |
| `ba/` | **`delivery/`** | business-analysis for efforts |
| `pro-services-rollout/` | **`delivery/`** | rollout effort |
| `training-videos/` | **`training/`** | |

### Loose `docs/*.md` (the grab-bag) → target

| → `technical/` | → `business/` | → `product/` | → `domain/` | → `training/` | → `delivery/` |
|---|---|---|---|---|---|
| architecture, coding-standards, libraries, ai-system, api-key-integrations, cicd-design, cohosting, qb-deploy, qb-integration, oauth-publisher-pattern, pdf-extraction-pipeline, compliance-forms-signing, entity-detail-pattern, ui-components, roles-auth, testing-strategy, workflow-pattern, workflow-pattern-expansion, brand-lockups | functional-decisions, estimating-engine-contract, bought-parts-cost-and-calendar-design | workflow-model (WNM), new-user-guide | industry-comparison, legacy-comparison | training-content-guide | gap-inventory, implementation-status, proposal, kickoff-prompt, claude-md-slim-proposal, vertical-restructure-plan (likely **abandoned**), narrative-thread-mapper-design, part-ux-review-2026-05-04, part-vendor-sources-restructure-2026-05-04, vendor-tier-pricing-history-2026-05-04 |

Root docs that should migrate to `delivery/`: `AUDIT.md`, `DISCOVERY.md`,
`TODO.md`, `TODO-forge-commerce.md`, `release-manifest.md`, `HANDOFF-FORGE-RENAME.md`.
(Move post-journey — `CLAUDE.md`/the journey reference `AUDIT.md`.)
