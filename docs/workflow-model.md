# Workflow Narrative Model (WNM)

> **Status:** design / foundational. Not yet built — this doc holds the thread.
> **Origin:** spun out of the component-inventory + gap-analysis effort (the
> md-agent inventory journey). The realization: the inventory is producing more
> than a gap register — it's a *verified, evidence-backed model of every
> achievable workflow*, and that model is reusable far beyond finding gaps.

---

## 1. The insight (why this exists)

As the analysis traverses the app looking for gaps, **a traversal that hits a
dead end is a gap; a traversal that completes is a narrative.** Both fall out of
the *same walk* — we don't build the narrative separately.

Because the model is built by **actually driving the running app** (live
navigation, 700+ screenshots, source `file:line` refs, role/capability gates),
every claim is **evidence-backed, not aspirational**. That evidentiary quality
is the moat: it's what lets the *same* corpus be trusted for training,
compliance, *and* sales simultaneously — none of which you can fake.

**The leverage move:** capture the result as **structured data, not prose**, so
training modules, compliance dossiers, sales sheets, guided tours, and test
specs are all *renderings* of one source. **Build the model once; project many
audiences.** Retrofitting structure from prose later is far harder — so the
analysis phases must emit the structured graph from the start.

---

## 2. The model (structured graph)

```
Persona / Role
  └─ Capability set (which CAP-* are on)
      └─ Workflow (an achievable end-to-end task)
          └─ Step (one user-meaningful action)
              ├─ Screen / Component (route + file:line)
              ├─ State (empty | loading | populated | error)
              └─ Evidence (screenshot, observed-at, build/commit)
```

Edges matter as much as nodes: steps link to **next/alternate/error steps** and
**cross-workflow** (e.g. "Convert Lead → Customer" hands off to the customer
workflows). The whole thing is a **directed graph**, not a flat list.

---

## 3. Per-step fields

### Core (every step has these)

| Field | What it captures |
|-------|------------------|
| `id` | Stable key — referenceable, diffable across versions. |
| **`purpose`** | *Why* the step exists — the user/business intent. |
| **`function`** | *What* it technically does — the mechanics/behavior. |
| **`ontology`** | The domain concepts/entities it touches, by canonical term (see §6). |
| **`featureClassification`** | The capability code(s) (`CAP-*`) that gate it + default on/off + **behavior when disabled** (hidden / disabled-with-reason / degraded). |
| `actor` | Which role(s)/persona performs it (or external, e.g. portal customer). |
| `trigger` | The action that advances it (click, scan, submit, timer, SignalR event). |
| `outcome` | Post-state: data mutated, navigation, side effects (notification/email/job). |
| `location` | Route + component + `file:line`. |
| `evidence` | Screenshot id(s), state observed, observed-at, build/commit sha. |
| `status` | `verified` \| `partial` \| `broken` (links to gap) \| `stale` (code changed since last verify). |

### Extended (present where relevant — these are what unlock the projections)

| Field | Feeds |
|-------|-------|
| `preconditions` / `entryState` | Test gen, training prerequisites, agent planning. |
| `acceptanceCriteria` | "What correct looks like" → test generation + validation. |
| `dataTouched` (entities, CRUD) | Data-flow map, impact analysis. |
| `dataSensitivity` (PII / export-controlled / financial-⚡) | Compliance, privacy mapping, redaction policy. |
| `integrations` (QB, shipping, email, SignalR…) | Side-effect map, integration test scope. |
| `automationHooks` (`data-testid`, API endpoint) | E2E generation + agentic task automation. |
| `i18nKeys` | Localization scope (ties to the en/es parity rule). |
| `a11y` (keyboard path, ARIA, focus) | Accessibility projection + WCAG evidence. |
| `terminologyKeys` | Reference admin-configurable labels via `TerminologyService`, **never hardcoded text**, so per-install relabeling flows through. |
| `dependencies` (upstream/downstream/cross-workflow) | The graph edges; impact analysis. |
| `media` (screenshot, optional clip, diagram) | Training, sales, help, tours. |
| `criticality` / `frequency` | Prioritization for tests, tours, maintenance. |

> **Narrative tone is a *render* concern, not a field.** Keep ONE canonical
> step record; audience voice (trainee vs sales vs compliance vs end-user help)
> is applied at projection time from `purpose`/`function`/`media`.

### Per-workflow fields
`id`, `name`, `persona(s)`, `capabilityPrereqs`, `triggerEntryPoints`,
`businessValue` / end-goal, `scope` (medium / large / macro), `successState`,
`status` (achievable / partial / blocked), `criticality`, `frequency`.

### Model-level fields
`appVersion` / commit stamp, `coverage` metrics, `provenance` (which analysis run
produced it), `ontologyVersion`.

---

## 4. Projections (what the one model becomes)

| Projection | Primary fields used | Notes / Forge hooks |
|------------|--------------------|---------------------|
| **AI-assistant grounding** ⭐ | purpose, function, location, status | Ground the Ollama RAG assistant on *verified* flows — answers "how do I…" without hallucinating. Near-free rider. |
| **E2E + visual-regression baseline** ⭐ | automationHooks, acceptanceCriteria, evidence | Golden workflows = test matrix; screenshots = visual baselines. |
| **Packaging / pricing matrix** ⭐ | featureClassification, workflow→capability | Maps which workflows each `CAP-*`/preset unlocks → tiers, comparison tables, discovery-wizard recs. |
| **Compliance OQ/validation dossier** $$ | evidence, actor, dataSensitivity, acceptanceCriteria | AS9100 / ISO 13485 / FDA operational-qualification evidence. |
| **RFP / security-questionnaire auto-answer** $$ | purpose, status, featureClassification | Answer "does it do X?" with evidence; honestly flag gaps. |
| **Training framework (LMS)** | purpose, function, media, actor | Auto-generate modules/paths per role + learning style. |
| **Guided tours / demo seeds** | trigger, location, media | driver.js tours; seed the week-simulation framework. |
| **Help center / in-app help** | purpose, function, media | Feeds slideout help sidecars; regenerated on drift. |
| **Access-control / SoD evidence** | actor, featureClassification | Who-can-do-what for SOC 2 / SOX. |
| **Data-flow / privacy map** | dataTouched, dataSensitivity, integrations | GDPR RoPA, ITAR/export-control evidence (PII protector). |
| **Impact / blast-radius analysis** | location, dependencies | "Changing this component affects workflows X,Y for roles A,B." |
| **Release notes (plain-language)** | diff of model between versions | "What changed for users." |
| **Sales pamphlets** | purpose, businessValue, media | Persona-targeted, real screenshots. |
| **Localization scope** | i18nKeys | Translation planning per workflow. |

⭐ = cheapest high-leverage (mostly a rendering problem once the graph exists).
$$ = highest dollar value for a manufacturing-ERP buyer.

---

## 5. Validation & maintenance mechanism

**The model is only valuable if it stays true as the app matures.** It must be
versioned with the code and continuously re-verified — never allowed to drift
into stale prose.

### Principles
- **Versioned with the app.** Every step carries `lastVerifiedCommit` +
  `lastVerifiedAt`. The model is a build-stamped artifact, not a wiki page.
- **Bidirectional link to the gap register.** A `broken` step *is* a gap entry;
  closing the gap re-verifies the step. The two never disagree.

### Triggers for re-validation
1. **On PR / merge (incremental, cheap):** map changed files → affected
   components (via `location`) → affected steps/workflows (via `dependencies`) →
   mark them **`stale`**. This is impact analysis driving re-verification — only
   the touched slice is re-walked, not the whole app.
2. **Scheduled full re-traversal:** periodically re-drive achievable workflows
   (same md-agent inventory machinery) and diff against the model.
3. **Manual:** re-verify a feature area on demand.

### Drift detection (the diff)
A re-run produces a fresh traversal; diff vs the model classifies each delta:
- **New** step/screen with no model entry → undocumented addition.
- **Removed** → workflow broke, or feature intentionally removed.
- **Changed** → behavior/state/screenshot differs.
- **Status flip** → was broken→now works, or works→now broken (regression).

### Reconciliation
Drift items land in a **review queue**. Each is judged **intended change** (→
update the model, re-bless evidence, bump `lastVerifiedCommit`) vs **regression**
(→ it's a bug; open/link a gap-register entry). Can be agent-assisted, human-confirmed.

### Discipline (keep it from rotting)
- **"Feature PRs update the model" definition-of-done** — same shape as the
  existing en/es parity rule and the activity-log rule. A PR that changes a UI
  component without updating/flagging affected steps **warns or fails** a CI gate.
- **Evidence freshness policy** — screenshots/states have a TTL; affected steps
  re-capture evidence each cycle; stale evidence is flagged in coverage metrics.
- **Ownership** — per-area owners (or the area's feature owner) own keeping their
  slice green.

---

## 6. Ontology / vocabulary registry

`ontology` and `terminologyKeys` only work against a **canonical registry** of
domain concepts. Build one and reconcile it with what already exists:
- Forge **entities** (Job, Customer, Quote, VendorPart, …) — the structural nouns.
- **`reference_data`** groups — the admin-configurable lookups.
- **`TerminologyService`** keys — the admin-relabelable display terms.

Steps reference registry terms, not free text — so renaming a concept (or an
install relabeling "Job" → "Work Order") propagates everywhere automatically.

---

## 7. Format / storage / tooling (to decide)

- **Format:** structured (JSON or YAML) with a committed **JSON Schema**; prose
  is generated *from* it, not the source of truth. (Recommendation: JSON graph +
  schema, stored in-repo.)
- **Storage:** in the forge repo (versioned with code). Screenshots in object
  storage / `analysis/` with stable ids.
- **Rendering:** small projection scripts/templates per audience (§4).
- **Privacy:** screenshots may contain PII / export-controlled data → **redaction
  policy** + treat the corpus itself as potentially sensitive.

---

## 8. Non-goals
- Not a replacement for code or for `docs/` specs — it's the *behavioral* model.
- Not aspirational marketing — only **verified** workflows enter; gaps stay gaps.
- Not hand-maintained prose — if it can't be regenerated/validated, it's wrong.

---

## 9. Open questions
- One canonical narrative + audience templates, or audience-specific variants? (Lean: one + templates.)
- How granular is a "step"? (Per user-meaningful action; avoid per-field.)
- Incremental re-traversal scoping — file→component→step map accuracy.
- Does the model live in `forge` repo or its own? (Lean: `forge`, versioned with code.)
- Build vs buy for the rendering layer.

---

## 10. TODO (don't lose the thread)

- [ ] **Decide format + commit a JSON Schema** for workflow / step / evidence (§7).
- [ ] **Add "emit a structured workflow graph (not just prose)"** to the analysis
      journey's flow + consolidate phases, so the graph is produced from the start.
- [ ] **Finalize the per-step field set** (§3 core + extended) and a step template.
- [ ] **Stand up the ontology/vocabulary registry** and reconcile with entities +
      `reference_data` + `TerminologyService` (§6).
- [ ] **Map every `CAP-*` capability → the workflows/steps it gates** + behavior-
      when-disabled (feeds packaging matrix + gating-UX analysis).
- [ ] **Design + build the validation pipeline** (§5): PR-triggered impact→stale
      marking, scheduled re-traversal, drift diff, reconciliation queue, CI gate.
- [ ] **Establish ownership + the "feature PRs update the model" DoD.**
- [ ] **Evidence policy:** screenshot redaction (PII/export-control), freshness TTL, storage.
- [ ] **Coverage metrics / KPIs** (% workflows verified, % steps with fresh evidence,
      open gaps) + a small dashboard.
- [ ] **Build the first projection** to prove the model — recommend one of the ⭐:
      AI-assistant grounding, E2E/visual baseline, or packaging matrix.

---

## 11. Example step (illustrative — final shape TBD)

```yaml
id: lead.convert-to-customer
purpose: Turn a qualified lead into a customer without re-keying its data.
function: >
  Opens LeadConvertDialogComponent (embeds AddressFormComponent), copies lead
  identity/address into a new Customer, marks the lead Converted, navigates to
  the customer detail.
ontology: [Lead, Customer, Contact, Address]
featureClassification:
  capabilities: [CAP-MD-LEADS, CAP-MD-CUSTOMERS]
  defaultState: on
  whenDisabled: action hidden when CAP-MD-CUSTOMERS off
actor: [PM, Manager, OfficeManager]
trigger: Click "Convert to Customer" on lead detail (convertLead() :287)
outcome: New Customer created; lead.status = Converted; nav → /customers/:id/overview
location:
  route: /leads (detail panel)
  component: lead-detail-panel.component.ts:287
state: [populated]
evidence: [leads-convert-dialog.png @ commit a8cdc7f, 2026-05-22]
dataTouched: { Lead: read+update, Customer: create, Address: create }
dataSensitivity: PII (contact name, address, email)
acceptanceCriteria:
  - Customer record carries the lead's identity + address
  - Lead is marked Converted and excluded from active lead lists
automationHooks: { testId: lead-convert-btn, api: POST /api/v1/customers }
status: verified
dependencies: { downstream: [customer.overview, customer.add-contact] }
```
