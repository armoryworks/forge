---
title: Delivery Pipeline
type: delivery
status: stable
id: delivery-index
updated: 2026-05-22
---

# Delivery — work items, by status

Operational docs we code/modify *against* — specs, plans, DoDs, ops changes —
organized by **status**, not type. An effort is a **folder** (`<effort-slug>/`)
bundling its spec + DoD + notes + evidence; it moves through the stages with
`git mv`, preserving history.

```
pending/       "going to"  — planned, not started
in-progress/   "are"       — actively being worked
complete/      "have been" — shipped AND verified (archive; truth graduates to reference)
abandoned/     dropped (one-line why + superseded-by)
```

- Start a new effort with **`/new-effort <slug>`** (scaffolds `in-progress/<slug>/`).
- Transition with `git mv delivery/<from>/<slug> delivery/<to>/<slug>` and update
  the effort's `status:` frontmatter to match the new folder.
- On `complete`: graduate durable facts into the reference layers (`business/`,
  `product/`, `technical/`). `complete/` is the record of the *work*, not the
  source of truth. See [../README.md](../README.md) §3.
