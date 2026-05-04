# Workflow Pattern — Expansion Plan

Companion to [`workflow-pattern.md`](workflow-pattern.md). That doc defines the pattern; this one captures **how we extend it from Part (the canonical implementation) to the rest of the application**, what design questions we still need to answer per entity, and the sequencing that gates the rollout.

> **Status (2026-05-04):** planning only. Part is being polished as the reference implementation. No other entity gets the workflow treatment until Part is "nearly flawless."

## Why Part stays the canonical model

Part hits every facet of the pattern in one entity:

- 14 distinct combos (procurement × inventory_class) with different required-step lists.
- Two presentation modes (express + guided) with mid-flow switching.
- A real Draft → Active promotion gate backed by per-combo readiness validators.
- Both deferred materialization (Express on `/parts/new`) and resume-on-existing (`/parts/{id}?workflow=…`).
- Server-side gate checks scoped to the in-flight run's definition (`CompleteWorkflowRun`, `PromotePartStatus`).

If the pattern survives Part, it'll survive everything else. Cloning it before Part is solid bakes in mistakes across N entities.

## The two status concepts (decided)

Every entity that adopts the workflow gets two **independent** status fields:

### 1. Domain status — the business lifecycle

The state the rest of the application cares about. `Inactive | Active | Deleted` minimum; entities can extend (Part has `Draft | Prototype | Active | Obsolete`; Customer might have `Lead | Active | Inactive | Closed`).

Rules:

- This is what filters lists, drives badges, and gets surfaced in dashboards.
- The workflow's "Promote" action transitions this on success.
- Visible to all users.

### 2. Record completeness — the workflow lens

A derived view on the record's data — "given the capabilities this customer/part/etc. needs, are the essential fields filled in?" Computed live from the readiness validators against the record's profile.

Rules:

- Not stored as an enum on the row. Computed: `missing-validators count == 0` ⇒ complete.
- Drives the workflow shell's step rail (✅ vs. ⚠️ vs. 🔒) and the "Mark complete" button.
- Independent of domain status — a record can be domain-Active but record-incomplete (e.g., legacy customer imported from CSV with no billing address).
- Can change retroactively when an admin enables a new capability that adds a validator (e.g., turning on "international shipping" makes `hasHTSCode` matter on existing parts).

Naming convention: when the UI needs a label, "Setup complete" / "Setup incomplete" beats anything that sounds like the domain status.

## Customer — the second adopter

Customer is the natural second entity because it has the highest variability (B2B vs. B2C, prospect vs. account, custom-build vs. catalog) and surfaces every place the pattern needs to bend.

### Open design questions (from the 2026-05-04 game-out)

#### Q1 — Combo / fork dialog: yes, no, or different shape?

Part forks on a procurement × inventory_class matrix because those two axes drive entirely different downstream step lists. Customer doesn't have an analogous orthogonal pair — every customer needs a name, an address, a contact. So the part-style "pick the combo, then commit" doesn't translate cleanly.

**Working hypothesis:** instead of a mutually-exclusive combo at start, Customer uses **non-mutually-exclusive profile flags** that the user toggles during the basics step (or revisits any time on the customer detail page). Each flag light up additional steps and additional readiness validators. Examples we brainstormed:

- `requiresEngineeringAttention` — RFQs/parts often need eng review before quoting. Adds an Engineering Contact step + `hasEngineeringContact` validator.
- `customSchedulingRequirements` — special delivery windows, blocked dates, dock appointment rules. Adds a Scheduling step + `hasSchedulingPolicy` validator.
- `requiresPrototyping` — one-off / R&D work. Adds a Prototyping POC step + `hasPrototypingPocContact` validator.
- `internationalShipping` — incoterms, tax docs, currency. Adds an International step + `hasIncoterms` + `hasTaxId` validators.
- `consignmentInventory` — we hold their inventory. Adds Consignment Terms step + `hasConsignmentAgreementOnFile` validator.
- `regulatedIndustry` — adds compliance step (ITAR / EAR / FDA / FAA / etc.).

These mirror the **capability flags** we already have in the catalog (`CAP-MD-CONTRACTS-CONSIGNMENT`, etc.), so the validators can hook into the existing capability gate — turn on `CAP-INT-SHIPPING` install-wide, and `hasIncoterms` becomes a real gate on every customer that has `internationalShipping` flagged on.

**Why this isn't shoe-horning:** Part's combos are mutually exclusive because a part is *either* a buy-component *or* a make-subassembly. Customer profile flags are additive because a customer can be both a regulated-industry buyer AND a consignment partner AND need engineering attention. The data models that.

**Still open:** does the basics step show all flags as a long checklist, or do we batch them into 3–4 themed groups (commercial, technical, regulatory, logistics)? Long checklist is easier to implement; grouped is easier to scan. Vote: grouped, with collapse-by-default.

#### Q2 — Per-profile readiness sets

Validators no longer have a single global "is this customer ready?" answer. Readiness depends on profile flags. Two customers with completely different profiles complete at different gate sets.

Server-side mechanics:

- Validators stay registered globally (one `EntityReadinessValidator` per gate).
- Each validator's predicate gets an **applicability check** — a JSON predicate that tests whether this validator should fire for this record. Example: `hasIncoterms` predicate is `fieldPresent(incoterms)`; its applicability is `fieldEquals(internationalShipping, true)`.
- `EntityReadinessService.GetMissingValidatorsAsync` filters out non-applicable validators before evaluating.
- Workflow definition's `completionGates` still scopes to a subset; validators outside the scope are ignored at completion time but can still fire on the entity-detail readiness panel.

This is a **new mechanic** the Part implementation doesn't have. Part validators are unconditional. Adding applicability is the first real abstraction lift the pattern needs.

**Decision flagged for Part-side prework:** before we clone to Customer, retrofit applicability checks into the Part validator infrastructure. Part doesn't strictly need them today but will eventually (e.g., `hasHTSCode` should only fire when `internationalShipping=true` on the company-wide profile). Doing this on Part first keeps Part the canonical reference.

#### Q3 — Coexistence with quick-create dialog

[customers.component.html:56](../qb-engineer-ui/src/app/features/customers/customers.component.html#L56) has an `<app-dialog>` create form today. Two paths after Customer adopts the workflow:

- **"+ New customer"** opens the workflow page (`/customers/new?workflow=customer-v1&mode=express`). The express form is the same five fields the dialog has today; nothing slower.
- **Existing dialog gets retired** — the workflow's express mode IS the quick-add, just behind a route + scrim instead of a MatDialog.

Part already proved this — `parts.component.html` no longer ships a quick-create dialog; it routes to `/parts/new`. Same playbook for Customer.

#### Q4 — Domain status surface

Customer has no `Status` enum today. Adding one is its own migration. Sequencing options:

- **Option A:** ship customer workflow with `status=Active` always (no Draft state), and Mark Complete becomes "save and return" — no promotion gate. Easier to ship, but loses the "draft customer that won't show up in dropdowns until ready" benefit.
- **Option B:** add `CustomerStatus { Lead, Active, Inactive, Closed }`, default new workflow rows to `Lead`, promote to `Active` on Mark Complete. Full parity with Part, but it's a real schema migration with cascading filter changes (the global query filter for `Lead` customers needs to be added to all customer-list queries that today assume "if it exists, show it").

**Recommendation:** Option B, but as a separate effort that lands BEFORE the customer workflow effort. Otherwise we ship a half-shape and have to retrofit later.

## Workflow runs admin — the (b) extension

Dan also wants the same guided UX applied to the existing Workflow runs admin pages. Today the Workflow admin is functional but not friendly — listing rows, opening details, manually completing or abandoning runs.

Scope of "(b)":

- The admin **list page** stays as-is (it's a table, not a wizard surface).
- The admin **single-run detail page** gets the workflow shell treatment. Reuse `WorkflowComponent` to render the run's step rail + current step content **read-only**, with admin actions in the footer (Force complete, Abandon with reason, Reassign user, Reseed validators). The user gets a one-glance picture of "where is this run stuck" instead of having to read a JSON blob.
- Bulk admin tools (bulk abandon, bulk complete) stay outside the shell.

**Implementation note:** the `WorkflowComponent` shell currently assumes the viewer IS the user filling the run. Adding a `[readonly]` mode (rail still navigates, step body shows current state without form controls) is a small input. This is also useful for a future "show me this customer's onboarding history" surface.

## Sequencing — what's blocking before we can clone

Order of operations, before any new-entity effort starts:

1. **Polish Part to "nearly flawless."** Ongoing. Driven by UX audits like the one that turned up the cost-required and validation-button bugs.
2. **Add applicability checks to validators** (Part-side prework). Enables per-profile readiness for Customer; also retroactively enables capability-driven gates on Part itself.
3. **Add a `[readonly]` input to `WorkflowComponent`.** Unblocks the workflow-runs admin (b) as well as future history-view surfaces.
4. **Promote `WorkflowComponent` step-rail polish back to Part.** Whatever lessons we learn in Part-shell refinement need to be in the shared component before any new entity copies it.
5. **Add `CustomerStatus` enum + migration + global filter retrofit.** Blocks the Customer workflow.
6. **Author Customer workflow definitions, validators, step components.** This is the actual cloning work.

Step 1 is unbounded and intentional. Steps 2–4 are abstraction lifts — we should do them on Part anyway to keep the canonical reference current. Steps 5–6 are the real Customer effort.

## Open questions still TBD

- **Profile-flag UX:** long checklist vs. grouped expandable? (Working: grouped.)
- **Profile flags vs. capability flags:** are these two names for the same thing, or two layers (capability = install-wide policy, profile = per-record opt-in within an enabled capability)? Probably the latter, but we should make the distinction explicit before we ship.
- **Applicability predicate language:** the existing `PredicateEvaluator` covers `fieldPresent`/`relationExists`/`any`/`all`. Does `fieldEquals` need to land before applicability ships? (Yes — almost every applicability check is "if flag X is set.")
- **What happens when an admin disables a capability that a customer's workflow run currently requires?** The run silently passes the now-irrelevant gate? Stays blocked? Surfaces a "this gate no longer applies, skip" affordance? Same question applies to Part if we adopt applicability there first.
- **Workflow runs admin (b) — readonly enforcement:** does the shell trust a `[readonly]` input, or do we wrap step components in a separate "render mode" that disables every form control? (Trust input + per-step opt-in via a context provider.)
- **Beyond Customer + Workflow admin** — the eventual roster (Vendor, Quote, Sales Order, Work Order, Employee, Asset, Compliance Form) inherits whatever shape Customer ends up with. If Customer's profile-flag pattern works, every other entity gets the same option. If it doesn't, we revisit.

---

*Maintain this doc as the source of truth for "how we plan to extend the workflow." Update it when a question gets answered or a new one surfaces. When the Customer effort actually starts, this becomes the spec for that effort's PR description.*
