# Forge — 1.0.0 Readiness Audit

> **Team-wide defect ledger (single source of truth).** Originally two Claude agents — `[PM]` (audit lead) and `[T]` (tester). As of **2026-05-20** this file is adopted as the **single defect ledger for the whole market-readiness engagement** (QA + BA + Eng + Domain + Orchestrator). New authorship tags below. Legacy `[PM]`/`[T]` entries (F-001–F-006) are preserved verbatim under the original protocol.
>
> Goal: every issue, gap, friction point, broken flow, unfinished feature, or polish item that stands between today's app and a customer-shippable 1.0.0 release.
>
> **Companion artifacts:** `DISCOVERY.md` (living system-model / knowledge base — what we *learn*) · `docs/gap-inventory.md` (BA's missing-feature parity list — Type=GAP, P-tiered). This file is what's *broken or missing and tracked to closure*.

---

## 0. Coordination protocol — READ BEFORE EDITING

**Append-only.** Findings (`F-###`) and Handoffs (`H-###`) are immutable once written. To update one, add a new entry that references the original (e.g., a status comment) — do not rewrite.

**Authorship tag.** Every entry starts with `[PM]` or `[T]`. Don't write under the other agent's tag.

**ID assignment.** Before adding a finding or handoff, scan the file for the highest existing ID in that namespace and use the next number. (Pad to 3 digits: `F-001`, `F-042`, `H-007`.) If you suspect a race (e.g., the file was just edited), re-read it first and use the next free number even if it skips one — gaps are fine, collisions are not.

**Update flow.** Read → choose next ID → append → save. Never edit someone else's entry; instead append a new finding referencing it (e.g., `F-042 [PM] re F-017: confirmed root cause is...`).

**Mutable sections.** Only §1 (Active work) and §2 (Handoff queue) are mutable. Treat them like a whiteboard — claim/release/erase as work moves. Findings (§4) are append-only forever.

**Status tags inside findings.** When the state of a finding changes, append a new dated note inside that finding's "Status log" subsection — don't rewrite the body. Statuses: `open`, `confirmed`, `in-fix`, `resolved`, `wont-fix`, `dup-of-Fxxx`, `cant-repro`, `needs-info`.

**Severity scale (be honest, not generous):**
- `BLOCKER` — ships broken; data loss, security, auth, paywall-of-death, totally non-functional core flow.
- `MAJOR` — core feature behaves wrong but app is usable; serious UX failure; missing functionality customers will demand on day one.
- `MINOR` — works but rough; visible polish issue; second-order UX friction.
- `POLISH` — cosmetic; nice-to-have refinement.
- `GAP` — feature/flow/state that should exist but doesn't (use this for missing-functionality findings, not just bugs).

**Lens tags (multi-select OK):** `func` (functional/correctness) · `ux` (usability/IA/copy) · `visual` (design/layout/spacing/density) · `a11y` (accessibility) · `perf` (performance/perceived perf) · `gap` (missing) · `data` (data integrity / DB / API).

**Evidence.** Reference exact paths/URLs/IDs. When useful, drop a screenshot path (e.g., `evidence/F-014-kanban-overflow.png`) — both agents can read those.

---

## 0.5 Unified taxonomy & team protocol (added 2026-05-20 by `[QA]` — **proposed v0, pending `[BA]`+`[ORCH]` sign-off**)

> Why: the BA's `docs/gap-inventory.md` uses **priority tiers (P0 SHOWSTOPPER → P4 NICE-TO-HAVE)**; this file uses **severity (BLOCKER/MAJOR/MINOR/POLISH/GAP)**. One taxonomy across the team. Reconciliation below keeps **severity** and **priority** as separate axes and demotes "GAP" from a severity to a *type*.

**Authorship tags (extended):** `[QA]` (QA Lead — continues `[T]`'s functional/exploratory work + owns the ledger & triage) · `[BA]` (business analyst — gap analysis) · `[DOM]` (domain specialist — defines correct behavior) · `[ENG]` (engineering — fixes/root-cause) · `[DEVOPS]` (deploy/seed) · `[ORCH]` (orchestrator — priority & ship calls) · `[UX]`. Legacy `[PM]`/`[T]` retained on existing entries.

**Three orthogonal fields on every finding:**

1. **Type** — `BUG` (behaves wrong vs. intended) · `GAP` (functionality missing vs. market parity/spec). *(Replaces "GAP" as a severity — a gap can be any severity.)*
2. **Severity** — *how bad if a user hits it* (QA-owned):
   - `BLOCKER` — data loss, security/auth hole, financial/QBO corruption, or a PRIMARY-spine flow that is non-functional.
   - `MAJOR` — core feature wrong but app usable; serious UX failure; day-one-demanded capability absent.
   - `MINOR` — works but rough; second-order friction.
   - `POLISH` — cosmetic.
3. **Priority** — *when we must fix it relative to ship* (`[ORCH]`-owned; mirrors BA scale): `P0` SHOWSTOPPER · `P1` CRITICAL · `P2` IMPORTANT · `P3` STANDARD · `P4` NICE-TO-HAVE.

**Scope tag (north-star weighting — LOCKED by `[ORCH]` 2026-05-20):**
- `PRIMARY` (harden to bar): quote-to-cash spine (Customer/Lead→Quote→SO→Job/Production→Shop-floor→Inventory→Shipment→Invoice→Payment + QBO sync) + Auth + **the lot/serial backbone that touches shipped product** + spine inventory math (on-hand/issue/ship/allocation/UOM, INV-INV1–4).
- `SECONDARY` (blocker-sweep depth only): Procurement/PO, admin/users/roles.
- `RECORD-ONLY` (≡ DEFER behavior — log a one-liner, do **not** pursue; backend-built but UI-thin, zero data): quality suite (NCR/CAPA/SPC/FMEA/PPAP), MRP, scheduling, deep inventory (ABC/replenishment/inter-plant/consignment/cycle-count), payroll/HR, maintenance, EDI/IoT, AI, voice, non-QBO adapters.

**Default severity↔priority bridge** (a finding entered on one axis gets a sane default on the other; `[ORCH]` overrides):

| Severity | Default Priority (BUG) | | BA P-tier (GAP) | Default Severity |
|----------|------------------------|---|-----------------|------------------|
| BLOCKER | P0 | | P0 SHOWSTOPPER | BLOCKER |
| MAJOR | P1 *(P0 if PRIMARY)* | | P1 CRITICAL | MAJOR |
| MINOR | P3 | | P2 IMPORTANT | MAJOR / MINOR |
| POLISH | P4 | | P3 STANDARD | MINOR |
| | | | P4 NICE-TO-HAVE | POLISH |

**Scope rule:** PRIMARY-spine BLOCKERs are always P0. `DEFER`-scope findings are logged at natural severity but **capped at P3** and never block ship.

**New finding format adds the fields** (extends §4 format): `### F-### [Author] [Type] [Severity] [Pn] [Scope] [Lens(es)] · [Feature area] · Short title`.

**Finding-ID reconciliation (authoritative):** §4 currently contains only **F-001–F-006** (all `[PM]`, Dashboard). Handoffs H-001/H-002 *reference* F-007–F-015 (tester nav/role/notification findings) that were **never written into §4** — they are phantom IDs. To prevent collisions: **F-007–F-019 are reserved/abandoned (do not reuse). Next free finding ID is `F-020`.**

---

## 1. Active work (mutable — claim/release here)

| Agent | Currently auditing | Started |
|-------|--------------------|---------|
| [PM]  | Phase 0 setup → Phase 1 auth/login | 2026-05-05 |
| [T]   | Phase 2 nav discovery + Phase 19 Admin/Users (creating role-based test users; mapping every sidebar route by direct nav). Will work outward toward master-data CRUD next. | 2026-05-05 |
| [QA]  | **GT Pass A+B complete 2026-05-21.** C0–C4 fully walked; C5–C10 API+DB-probed. 8 new findings F-040–F-047 (note: SEC agent filed F-034–F-039 first, shifting QA GT numbers — see H-010 + H-011). F-050 appended (payment-status promotion root cause). Status updates applied to F-001/F-002/F-003/F-022/F-035[BA]. | 2026-05-21 |

**PRIMARY-spine exploratory coverage tracker** (mutable — `[QA]` updates as charters run). Status: `▫ not started` / `◐ in progress` / `✓ swept` / `⚠ broken`.

| # | Charter | Spine stage | Invariants to probe | Status | Findings |
|---|---------|-------------|---------------------|--------|----------|
| C0 | Auth & session | Login / token / roles / capability gating / MFA | (gateway — no DoC invariant) | ✓ | **F-051** (lockout — no `AccessFailedAsync`), **F-053** (JWT fallback key), **F-054** (MFA full-auth bypass — BLOCKER/P0, no-password JWT) |
| C1 | Customer / Lead | create + Lead→Customer conversion | (feeds INV-AR1) | ✓ | **F-040** (lead cap disabled — `CAP-O2C-LEAD`); customer create ✓ |
| C2 | Quote / estimate | build, line items, pricing, BOM pull, approve | INV-Q1, Q2, Q3, Q4 | ✓ | **F-041** (list total = pre-tax; detail is tax-inclusive — inconsistent `total` semantics); INV-Q1 math ✓ on seeded data; INV-Q2/Q3/Q4 need BOM (see F-028) |
| C3 | Quote → Sales Order | conversion, data carry-over, price lock | INV-SO1, SO2 | ✓ | **INV-SO1 PASS**; **F-042** (convert ignores optional fields); state machine Draft→Sent→Accepted→SO confirmed working |
| C4 | SO → Job / Production | BOM explosion, routing, job create | INV-J1, J2 | ⚠ | **F-043** (57 seed jobs null SO/part/BOM — INV-J1/J2 untestable on seed); new job J-2402 created with part link ✓ but no SO-line link |
| C5 | Shop-floor | kanban stage moves, clock/time, op completion | INV-SF1, SF2, SF3 | ⚠ | `CAP-EXT-KANBAN-REPLENISHMENT` disabled (replenishment kanban); production job board via stages works; INV-SF1/SF2/SF3 untestable (no BOM/ops) |
| C6 | Inventory | material consumption, lot/serial, movements, FG receipt | INV-INV1, INV2, INV3, INV4 | ⚠ | **INV-INV1 PASS** (on_hand = receipts − issues on 12 bin_contents/32 movements); F-030 (shipment relief absent); **F-047** (lot/serial backbone absent — INV-SH3 fails) |
| C7 | Shipment | pick/pack/ship vs SO, partials | INV-SH1, SH2, SH3 | ⚠ | **F-020** code fix LIVE + DoD-pending (auto-eng-2 regression test); residual: seed `shipped_quantity=0` backfill (`[BA]` assessing migration need — see §1 triage); **F-044** (shipment lines null part); **F-047** (0 lot/serial on shipped); INV-IN2 PASS (UNIQUE shipment_id) |
| C8 | Invoice | generate from shipment/SO | INV-IN1, IN2, IN3, IN4 | ⚠ | **INV-IN1 PASS** (qty match at invoice/shipment level); **INV-IN2 PASS** (UNIQUE constraint); **F-045** (3 invoices Paid with underpayment $497/84/148 — status machine wrong); **F-050** (5 invoices Paid on any receipt — root cause confirmed); INV-IN4 deferred (no tax linkage to QBO) |
| C9 | Payment | apply payment | INV-AR1 | ⚠ | F-035[BA] (8 overpaid invoices in seed); **F-045/F-050** (invoice status machine: Paid on any receipt — 5 affected); credit-memo MVP includes minimal FE create/apply surface (per `[ORCH]` scope call); F-026 race |
| C10 | QBO sync | customer/invoice/payment push, sync status, errors | INV-QBO1, QBO2, ~~QBO3~~ | ⚠ | **F-046** (CAP-ACCT-EXTERNAL disabled — entire seam gated off); F-021 structural seam defects; all external_id=NULL |

> **Invariant catalog + assertion layer (UI / API / DB / QBO) lives in `DISCOVERY.md §2A`** — the Definition-of-Correct backbone. DB-only invariants (INV-INV1, AR1, SF1, SF3, SH2, INV3) get reusable SQL probes.
>
> **QBO scope (LOCKED by `[ORCH]` 2026-05-20):** first pass is **mock-seam-only** — cover INV-QBO1(seam mechanics)/QBO2 against the mock; **INV-IN4 + INV-QBO3 (cent-parity) + INV-QBO1(retry-idempotency) DEFERRED** to a scheduled real-QB-sandbox hardening milestone (mock can't prove them — see F-021 + §6 Known Coverage Holes). Not a gap in diligence, a sequenced one.
>
> **GT (Golden Thread):** before edge-probing any charter, run one realistic order **end-to-end C1→C10** to find where the spine breaks first, then re-walk it asserting each stage's invariants. That single run is the highest-value first hour and sets fix sequencing.

**Suggested division of labor** (refine as we go):
- `[T]` — drive the browser end-to-end; functional QA; reproduce; capture network/console errors; file `func` findings with raw repro.
- `[PM]` — UX/design/gap-analysis lens on top of `[T]`'s functional findings; root-cause via source code & DB when needed; write final findings; flag missing functionality (gaps).
- Either side may file any kind of finding — split is a default, not a wall.

---

**Triage registry** (mutable — `[QA]` carries Type/Severity; `[ORCH]` owns Priority + ship-gate column). Source: GT Pass A+B 2026-05-21 + post-GT triage sync. BLOCKERs/P0–P1 only; MINOR/POLISH/closed findings omitted.

| ID | Author | Type | Sev | Priority | Ship-gate? | Fix-status | Notes |
|----|--------|------|-----|----------|-----------|------------|-------|
| **F-020** | [ENG] | BUG | BLOCKER | P0 | **DoD-pending** (not ship-blocking) | Code PASS ✓ | Regression test → auto-eng-2; seed backfill → [BA] assessing |
| **F-021** | [QA] | GAP | BLOCKER | P0 | **YES** | open | Real Invoice/Payment never sync; $0 placeholder |
| **F-026** | [ENG] | BUG | MAJOR | P1 | TBD | open | Payment over-application race; live |
| **F-028** | [BA] | GAP | BLOCKER | P0 | **YES** | open | No estimating engine; INV-Q1–Q4 untestable; largest single build in wave; bounded by §A1 MVP scope |
| **F-029** | [BA] | BUG | MAJOR | P1 | TBD | open | Job estimated costs never populated |
| **F-030** | [BA] | GAP | BLOCKER | P0 | **YES** | open | Shipment relieves no inventory/COGS |
| **F-031** | [BA] | BUG | BLOCKER | P0 | **YES** | open | Flat tax diverges from QBO AST; latent under mock |
| **F-033** | [ENG] | BUG | MAJOR | P1 | TBD | open | State-machine blacklists; partial-ship cancel unguarded |
| **F-035[BA]** | [BA] | BUG+GAP | MAJOR | P1 | TBD | open | Credit-memo model absent; FE create/apply in MVP scope |
| **F-037** | [SEC] | BUG | MAJOR | P1 | TBD | not started | Margin summary → ProductionWorker; live |
| **F-038** | [SEC] | BUG | MAJOR | P1 | TBD | not started | Job cost summary → ProductionWorker; live |
| **F-041** | [QA] | BUG | MAJOR | P1 | TBD | open | Quote list `total` = pre-tax; detail = tax-inclusive |
| **F-043** | [QA] | GAP | BLOCKER | P0 | **YES** | open | SO→Job linkage never wired; C4 hard break |
| **F-044** | [QA] | BUG | MAJOR | P1 | TBD | open | Shipment lines null part; packing lists unusable |
| **F-046** | [QA] | GAP | MAJOR | P1 | TBD | open | CAP-ACCT-EXTERNAL disabled; C10 dark |
| **F-047** | [QA] | GAP | BLOCKER | P0 | **YES** | open | Lot/serial backbone absent; INV-SH3 fails |
| **F-048** | [DISC] | BUG | MAJOR | P1 | TBD | open | Double QB invoice per job when cap enabled |
| **F-049** | [ENG] | BUG | MAJOR | P1 | TBD | open | Production runs accept over-complete; INV-SF2 |
| **F-051** | [SEC] | BUG | BLOCKER | P0 | **YES** | impl → review | No account lockout; `AccessFailedAsync` never called; live |
| **F-053** | [SEC] | BUG | MAJOR | P1 | TBD | impl → review | Hardcoded JWT fallback key |
| **F-054** | [SEC] | BUG | BLOCKER | P0 | **YES** | STR · not started | MFA full-auth bypass; structural; live when MFA enrolled |
| **F-055** | [QA] | BUG/GAP | MAJOR | P1 | TBD | open | Price-lock invariant — SO.unit_price vs accepted Quote |
| **F-056** | [ENG] | GAP | MINOR | P3 | NO | open | ETag If-Match not injected on Kanban job sub-path PATCHes (`/stage`, `/subtasks/{id}`, etc.) — URL-key mismatch in interceptor |

> Priority ratifications (source: `[ORCH]` 2026-05-21): F-021/F-030/F-031/F-043/F-047 = BLOCKER/ship-gate; F-051 = BLOCKER/P0 live-security; F-020 = code-PASS/DoD-pending (not ship-blocking). F-054 = BLOCKER/P0 per [SEC] H-015. Remaining P1 TBDs await `[ORCH]` priority call.

**De-dupe rule.** Before filing, ctrl-F the feature name in §4. If you find a likely match, file a new finding tagged `dup-of-Fxxx` linking to the original instead of rewriting.

---

## 2. Handoff queue (mutable — short messages between agents)

> Use this for "please verify X" / "I saw Y, can you root-cause" / "blocked, need Z." Append new `H-###` entries; mark answered ones with a strikethrough and date.

### H-001 [T] 2026-05-05 — Hello from the tester; eight findings filed, work in progress

[PM] heads-up — I just landed and have done a discovery sweep. I've filed F-001 through F-008 in §4. They cluster around three themes you may want to lens-pass:

1. **Sidebar nav gaps** (F-001, F-002, F-003): three full modules — Quality, Chat, full-page Notifications — are reachable by URL but absent from the sidebar. If they're capability-gated by default, the spec doesn't reflect that, and admin-as-superuser can still reach them silently. Worth deciding: hide silently, hard-403, or expose in nav.
2. **Notification spam** (F-004): 4 identical "Uninvoiced Jobs" rows at the *exact same timestamp* on 2026-05-02 — strongly suggests a Hangfire cron is double/quadruple-firing or the dedup check is missing.
3. **Role-label drift** (F-006, F-007): the role dropdown in Add User mixes "Office**Manager**" + "ProductionWorker" with "Production Manager" + "IT Admin". Pick one capitalization rule.

I also noted the role catalogue has 11 entries (Admin, Controller, Engineer, IT Admin, Manager, OfficeManager, PM, Procurement, Production Manager, Production Planner, ProductionWorker) but CLAUDE.md spec lists 6. Filing as F-009 — possibly intentional (capability presets bring in extra roles) but the spec docs need to catch up either way.

Side note on protocol: my locally-staged scratch for tests lives in `Generated Tests/` (gitignored) — that's where my reusable test-case `.md` scenarios go. AUDIT.md is the canonical findings record per your protocol; I won't fork findings into BUGS.md going forward.

I'm in the middle of creating two more role-based test users (currently have `qa-engineer@qbtest.local` Engineer and `qa-prodworker@qbtest.local` Production Worker; setup codes captured locally). If you take auth/onboarding deep, please don't burn those — flag for me in H-### and I'll switch test accounts.

### H-002 [T] 2026-05-05 — ID collision: my findings start at F-007 (not F-001)

[PM] my apologies — I drafted H-001 before re-reading §4 and assumed my findings would land at F-001. You filed F-001..F-006 first; I'm appending starting at F-007. Mapping for cross-reference:

| H-001 said | Actually filed as |
|------------|--------------------|
| F-001 (Quality nav gap) | **F-007** |
| F-002 (Chat nav gap) | **F-008** |
| F-003 (Notifications full-page nav gap) | **F-009** |
| F-004 (Notification dup storm) | **F-010** |
| F-005 (Page-header capitalization /chat) | **F-011** |
| F-006 (Role labels OfficeManager/ProductionWorker) | **F-012** |
| F-007 (Role chip uppercase consequence) | **F-013** |
| F-008 (a11y aria-label on icon buttons) | **F-014** |
| F-009 (role catalogue 11 vs 6) | **F-015** |

Also, your **F-002** (AI status 403 even though descriptor says CAP-EXT-AI-ASSISTANT is disabled) probably explains my **F-007 / F-008** — Quality and Chat may be similarly capability-disabled in this install. Admin still reaches the routes server-side, which is the actual bug. I've added a status-log note on F-007 referencing your F-002. If you confirm in source that those capabilities are off by default for this preset, my framing tightens from "missing nav entry" to "capability-disabled module is silently reachable to admin without a 403."

Re-reading protocol now to avoid future races. Going forward I'll re-read §4 immediately before each append.

### H-005 [QA] 2026-05-20 — `[BA]` one-glance sign-off on the severity↔priority bridge

`[BA]` — `[ORCH]` asked you to sign off on the bridge in §0.5. Three things to confirm/amend (reply with ✓ or a redline):

1. **Severity and Priority are separate axes** — severity = "how bad if hit" (QA-owned), priority = "when vs. ship" (`[ORCH]`-owned); "GAP" is a **Type**, not a severity.
2. **The default bridge** (BUG severity → default Pn; GAP P-tier → default severity) per the §0.5 table.
3. **Source-of-truth rule:** for findings sourced from your `gap-inventory.md`, the **P-tier you assigned is authoritative priority**; severity is derived (and `[ORCH]` can override either). I link your P0/P1 gaps into this ledger as they intersect the spine — I don't duplicate all 38.

If you concur I drop the "proposed v0" label and it's the team standard.

### H-004 [QA] 2026-05-20 — QA Lead online; ledger adopted team-wide, taxonomy reconciled, IDs re-baselined

`[ORCH]` `[BA]` `[PM]` `[T]` — I'm the QA Lead for the market-readiness engagement and I'm continuing `[T]`'s functional/exploratory line. Three things landed:

1. **This file is now the single team defect ledger.** New authorship tags in §0.5. Existing F-001–F-006 untouched.
2. **Unified taxonomy (§0.5, proposed v0).** Severity (this file) and Priority (BA's P0–P4) are now **separate axes**; "GAP" is demoted from a severity to a **Type** (`BUG`/`GAP`). Bridge table maps one to the other with `[ORCH]` override. `[BA]` — please sanity-check the P-tier↔severity mapping against `gap-inventory.md`; if you concur I'll drop the "proposed" label. The gap-inventory stays the authoritative *parity* list; I'll link its P0/P1 GAPs into this ledger as they intersect the spine rather than duplicate all 38.
3. **ID re-baseline:** F-007–F-019 reserved/abandoned (the H-001/H-002 phantom IDs were never filed into §4). **Next free ID is F-020.**

Plan: exploratory-first on the PRIMARY quote-to-cash spine (charters C0–C10 in §1), starting with a single end-to-end Golden Thread run the moment `[DEVOPS]` publishes the demo-seeded instance + role creds. Regression/automation deferred until the first pass shows where the spine actually breaks. `[ORCH]` owns triage with me — proposing a short triage sync after the GT run.

### H-003 [PM] 2026-05-05 — Acknowledged; reserving F-016+ for me; refining role split

[T] no problem, the protocol's been stress-tested and survived. A few things back at you:

1. **ID accounting.** I see your H-002 mapping but at the moment I'm reading §4 only contains F-001..F-006 (mine). Your F-007..F-015 must be queued to write — I'll **start my next finding at F-016** to leave a clean buffer for whatever you're appending. If you end up needing more than 9 slots, just push past F-015 and I'll re-baseline above the highest you wrote.

2. **Capability hypothesis.** Strong agree. F-002 (AI 403) likely shares a root cause with your F-007 (Quality) and F-008 (Chat). I'll add it to my source-code investigation pass: I want to look at `CapabilitySnapshotProvider`, the route-guard / `*appCap` usage on those module routes, and the controller `[RequiresCapability]` attributes in one sweep. If I confirm Quality/Chat are gated by a capability that's `disabled` in the default preset (which docs say exists for accounting via `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN` mutex but doesn't list quality/chat as default-off), I'll file a meta-finding on the doc gap and add status-log notes referencing your F-007/F-008. Don't wait on me — keep going.

3. **Test users.** I will not burn your `qa-engineer@` and `qa-prodworker@` accounts. If I need a non-admin perspective I'll create `audit-pm@qbtest.local` (or whatever's free) and document the credentials in §1 so you can use it too if helpful. If you make any more, please leave them in §1 (or a new "test creds" subsection) so we deduplicate.

4. **Side-channel files.** Your `Generated Tests/` folder is fine; my equivalent is the local outputs scratch which the user can't see. I'll reference any non-AUDIT.md artifact by full path in the relevant finding so you can read it too. If we end up needing screenshots beyond the trivial number, let's create `audit-evidence/` at repo root and both write there with `F-###-*.png` naming.

5. **Role catalogue spec drift (your F-015).** That's a real one. CLAUDE.md's role table lists 6 roles but the codebase clearly has more (the catalog presets pull in roles like Controller, Procurement, Production Planner). Likely the spec was written against the original 6 and the capability presets work introduced new role seeds without updating the roles table in CLAUDE.md. When you file F-015 I'll lens-pass with a docs-update finding (separate F-###) so we can split "code is wrong" from "spec is stale" cleanly — whichever turns out to be the case.

Continuing my Phase 0 — header chrome (search/notifications/user menu/theme toggle), then peeling off Phase 3 dashboard deep-dive.

### H-006 [ENG] 2026-05-20 — (back-end → eng-lead) converged on BE-2; claiming Wave-0 LIVE money fixes

[ENG-lead] — converging, not running parallel. Your binding canonical-queue decision (consolidate on `IntegrationOutbox`, retire `SyncQueue`) and the BE-2 **2a/2b/2c** decomposition match the audit's recommendation exactly; the QBO findings (now consolidated in `[QA]`'s **F-021**) map onto it: double-post + silent-stranding → **2a** (tax-independent foundation: idempotency key + QBO `requestid`, `FOR UPDATE SKIP LOCKED`, lease/visibility-timeout, set-once `ExternalId` atomic with `Sent`); $0/stage-triggered placeholder + payments-never-sync → **2b** (sync the **real** Invoice/Payment entity, per-entity `ExternalId`, trigger off lifecycle not stage-name); tax double-compute → **2c** (gated on `[DOM]` ruling). No re-slice — single `AppDbContext` stays the UoW boundary, per your posture.

**Claiming Wave-0 now (held — no merge — pending DevOps rollback + QA gates):**
1. **F-020 ShippedQuantity** per your **approved direction** — keep the inline `+=` in `CreateShipment` (atomic with the shipment insert in one `SaveChanges`), **remove** the duplicate `+=` in `OnShipmentCreated_UpdateSalesOrder` (handler updates SO **status** only); reliable eventing deferred to the outbox in Wave-1/2a. (Note: F-020's filed recommendation reads "or vice-versa" — flagging that your binding call resolves it to keep-inline so the implementer doesn't pick the other branch.) DoD = QA probes **P5 (INV-SH1) + P6 (INV-SH2)** green on a **real-mediator** regression test (the existing unit test mocks the mediator and hides the bug).
2. **F-026 payment over-application race** — money-side analog of the BE-1 inventory check-then-set race; guard under row lock / `409`. DoD = **INV-AR1**.
3. **F-027 divergent balance formula** — collapse `CreatePayment` onto `invoice.BalanceDue`; sequence before any line-discount feature.

Per your sequencing note, 2b depends on F-020 landing first for correct invoice amounts. Conservation-law probes attached as DoD on each, per your regression-trade position. Confirm priority order or reshuffle.

### H-007 [ENG] 2026-05-20 — (back-end → BA) two money-model items beyond the QBO seam

[BA] — flagging for `gap-inventory.md` / DoC, independent of the QBO seam: (1) **F-027** — `CreatePayment` re-derives invoice balance with its own formula instead of `Invoice.BalanceDue`; equal today only because `LineTotal == Qty×UnitPrice`, but it silently diverges the instant a line-level discount/adjustment lands → a "fix-before-discounts-ship" dependency if discounts are on your roadmap. (2) The **$0, stage-triggered invoice** captured in `[QA]`'s **F-021** — flagging whether "invoice **from shipment** at the SO-locked price" (DoC §A6→A7) should also be tracked as a **parity GAP** in the gap inventory, not only as the engineering BUG under F-021.

### H-009 [ENG] 2026-05-20 — Wave-1 queue noted; not starting yet

Two Wave-1 items received from the eng-lead, queued behind ShippedQuantity fix + BE-2 design (both now complete):

1. **Source-state whitelist guards (F-033)** — `CancelSalesOrder`, `VoidInvoice`, `CancelPurchaseOrder`, `ReceiveItems` all use blacklists; inventory above. Four handlers, 1–2 line fix each, one PR. DoD = INV-SO2 + QA probes against cancel-on-partially-shipped, void-on-draft, receive-on-draft.

2. **INV-Q2 quote-pricing monotonicity validator** — FluentValidation on `SaveQuote`, returns 422 when manual `unitPrice` violates tier monotonicity. Spine pre-condition correctness, Wave-1. No dependency on F-033.

Both held — no merge — pending DevOps rollback gate + QA verification. Will pick up when `[ORCH]` gives the start signal post BE-2 design decision.

### H-010 [QA] 2026-05-21 — GT first pass complete; post-GT triage requested; ID-collision flag

`[ORCH]` — GT Pass A + B complete. New findings F-037–F-044 appended in §4. Coverage tracker updated in §1.

**ID collision to resolve:** `[SEC]` filed findings using IDs **F-034** and **F-035** which `[BA]` had already used. Result: both F-034 and F-035 have two different entries. I've re-numbered my new GT findings starting at F-037 (safe, above all collisions). `[ORCH]` please assign `[SEC]`'s account-lockout finding a new ID (suggest F-045) and `[SEC]`'s invitation-tokens finding (F-046) so the ledger is non-ambiguous. I cannot rewrite `[SEC]`'s entries per protocol.

**Post-GT triage asks** — bring me provisional P-tiers for these blockers now:
- **F-037** (lead capability off — GAP/MINOR, P3)
- **F-038** (quote list total wrong — BUG/MAJOR)
- **F-039** (SO convert ignores fields — BUG/MINOR)
- **F-040** (seed jobs no SO/BOM link — data-quality P0 action)
- **F-041** (shipment lines null part — BUG/MAJOR)
- **F-042** (3 invoices wrong "Paid" status — BUG/MAJOR)
- **F-043** (lot/serial-on-shipped absent — GAP/BLOCKER)
- **F-044** (CAP-ACCT-EXTERNAL disabled — coverage hole)

### H-016 [SEC] 2026-05-21 — REDACTION LIST for DevOps (PATH-a scrub-then-commit, re #9 gate)

`[DEVOPS]` — `[ORCH]` approved PATH (a): scrub-then-commit. Two live secrets are embedded in finding bodies. Redact each to a placeholder (global, so any stray copy elsewhere is caught), keep the surrounding sentence so finding semantics stay intact, then commit.

1. **Seed password (live — works for `admin@forge.local` + all 24 users).** Location: **F-039** body — 3 spots: Observed, Impact, and the Evidence line (where it also appears in the `SEED_USER_PASSWORD=<value>` form). Action: replace the password value (read it in-place) with `<SEED_PASSWORD redacted — see secrets note>`. Leave the `.env:20` path reference; redact only the value.
2. **JWT signing key (live HS256 key for the running instance).** Location: **F-036[SEC]** body, Observed section — the base64 value after `JWT_KEY=`. Action: replace with `<JWT_KEY redacted — see secrets note>`. ⚠ Do NOT touch the `dev-secret-key-change-in-production-min-32-chars!!` fallback literal — it is the public hardcoded default and quoting it IS the finding (F-053).

Leave as-is (not sensitive): bare usernames (`admin@forge.local`, `bkelly@forge.local`) and the public fallback key above. The **credential-mint recipe is NOT in this file** (no pbkdf2/hashlib/security_stamp/password_hash-write content) — nothing to scrub there; it lives only in an untracked SEC note outside the repo.

Durability: suggest the two real values go into a gitignored secrets note (e.g. `AUDIT.secrets.local.md`) keyed by finding ID, so the scrubbed register is committable and the live values stay recoverable. Before `git add`, re-read F-039 + F-036[SEC] and confirm both placeholders are in place and no other copies remain.

### H-013 [QA] 2026-05-21 — F-034/F-035/F-036 collision → canonical map; next free ID = F-054

`[ORCH]` `[SEC]` `[BA]` — Collision resolution applied per ruling: first-filer keeps the ID; less-referenced [SEC] entries (filed 2026-05-21, after [BA]'s 2026-05-20 entries) move into F-051+.

No [SEC] entry body was edited — redirect notes appended to each [SEC] status log only. Canonical stub entries at F-051/F-052/F-053 point back to the [SEC] body text.

**Canonical map:**

| Colliding ID | First-filer (keeps) | Body at | Second-filer (moves) | Body at | Canonical ID |
|---|---|---|---|---|---|
| F-034 | `[BA]` 2026-05-20 | F-034 | `[SEC]` 2026-05-21 | F-034[SEC] status log | **F-051** |
| F-035 | `[BA]` 2026-05-20 | F-035 | `[SEC]` 2026-05-21 | F-035[SEC] status log | **F-052** |
| F-036 | `[BA]` 2026-05-20 | F-036 | `[SEC]` 2026-05-21 | F-036[SEC] status log | **F-053** |

No collision at F-037/F-038/F-039 — those are exclusively [SEC] entries; [BA] never filed at those IDs.

**Next free ID: F-054.**

Coverage tracker C0 updated: `F-034[SEC]` → `F-051`; `F-036[SEC]` → `F-053`.

`[SEC]` — please confirm the map is correct and add your ruling to F-051/052/053 stubs.

### H-014 [SEC] 2026-05-21 — re H-013: collision map CONFIRMED; rulings added to F-051/052/053 stubs; MFA filed at F-054

`[QA]` `[ORCH]` `[BA]` — confirming H-013. Map correct: `[BA]` filed F-034/F-035/F-036 on 2026-05-20 (first); `[SEC]` filed same-numbered on 2026-05-21 (moves). Canonical: F-034[SEC]→**F-051**, F-035[SEC]→**F-052**, F-036[SEC]→**F-053**. F-037/F-038/F-039 uncontested — `[SEC]` keeps. `[SEC]` ruling appended to each F-051/052/053 stub status log (severity unchanged; fix status noted). New first-class finding **F-054** (MFA full-auth bypass, BLOCKER/P0) filed in §4 — promoted from the implicit C0 note per `[ORCH]`; C0 tracker updated. Next free finding ID: **F-055**. Thanks for the clean stubs.

### H-015 [SEC] 2026-05-21 — Auth fix wave: prioritized queue + DoD (for eng-lead / backend-engineer)

`[ENG-lead]` `[ENG]` — auth findings ranked by **severity × exploitability** for the Phase-2 fix wave. Standing rules (`[ORCH]`): backend-engineer reviews before any auth merge; every auth fix lands with its regression test green + a rollback DB snapshot. **QW**=quick win (small/localized); **STR**=structural (needs design). Canonical IDs reflect the H-013 collision resolution.

1. **F-054 — MFA full-auth bypass.** BLOCKER/P0. Severity max (no-password full-auth path). Exploitability: structural — zero today (no enrolled MFA devices), live the instant MFA is enabled. **STR · NOT STARTED.** DoD: Login issues short-lived MFA-pending pre-auth token after password check; `/mfa/challenge`+`/mfa/validate` require/validate it (drop `[AllowAnonymous]` raw userId); full JWT only when both factors proven; co-filed device-lock DoS closed by same gate; regression asserts 401 without pre-auth token + no JWT when password skipped; backend design+review; rollback snapshot.

2. **F-051 — No account lockout** (was F-034[SEC]). BLOCKER/P0. High severity × HIGH live exploitability (rate limiter off in Dev; 4-digit PIN exhaustible in seconds). **QW · IMPLEMENTED.** `SignInManager.CheckPasswordSignInAsync(lockoutOnFailure:true)` + kiosk PIN counter. DoD: LoginHandler lockout tests GREEN (9/9) ✓; REMAINING: KioskLoginHandlerTests cases, live 6-attempt regression (`access_failed_count=5`+`lockout_end` on #6, reset on success), backend review. Snapshot `forge-pre-auth-hardening-20260521T015304Z.dump` ✓.

3. **F-037 / F-038 — Margin & job-cost exposure to ProductionWorker.** MAJOR/P1. Med-high severity × HIGH live exploitability (worker JWT → 200 real margin; F-038 live `actualMargin=-849991.5` across all 57 jobs). **QW · NOT STARTED.** DoD: F-037 add `[Authorize(Roles="Admin,Manager,Controller,OfficeManager,PM")]` to `GetMarginSummary` (`DashboardController.cs:30`); F-038 add `[Authorize(Roles="Admin,Manager,Engineer,PM,Controller,OfficeManager")]` to `GetCostSummary` (`JobsController.cs:379`); audit sibling sub-endpoints (`material-issues` also 200s for workers); regression: worker JWT→403, manager JWT→200; backend review.

4. **F-053 — Hardcoded JWT fallback key** (was F-036[SEC]). MAJOR/P1. High-but-conditional severity (forge any JWT IF `.env` absent) × low exploitability (current instance safe — key set). **QW · IMPLEMENTED.** `Program.cs` fallback → fail-fast `throw`. DoD: build green ✓; add startup key-length≥32 assertion; backend review.

5. **F-052 — Setup tokens plaintext** (was F-035[SEC]). MAJOR/P1 (SECONDARY). Med severity × low exploitability (needs DB read; 7-day TTL). **QW · IMPLEMENTED.** SHA-256 on write + hash-compare on read; shared `HashSetupToken`. DoD: create→validate→complete round-trip test; backend review.

6. **F-039 — Shared static seed credential / weak password policy.** MINOR/P2. Low severity (demo-intended) × trivial-but-intended exploitability. **DOC + POLICY — not a code merge gate.** DoD: runbook "rotate credentials before customer handoff"; optionally `RequireNonAlphanumeric=true` + `RequiredLength=12`.

**Tally:** 2 BLOCKER/P0 (F-054 STR not-started; F-051 done→review), 3 MAJOR/P1 QW (F-037/F-038 todo; F-053/F-052 done→review), 1 MINOR/P2 doc. **Recommended merge order:** F-051 (closes live brute-force) → F-037/F-038 (1-liners, live exposure) → F-054 (highest severity, structural) → F-053/F-052 (done→review) → F-039 (doc). The four implemented fixes are compiled, uncommitted, awaiting backend review per the `[ORCH]` gate.

### H-012 [QA] 2026-05-21 — Authoritative A/R anomaly reconciliation (3-vs-8 count resolved); live handler verified correct

`[ORCH]` `[DEVOPS]` `[BA]` `[ENG]` — Reconciliation complete. The "3 vs 8" discrepancy between BA and automation-engineer-1 probes is resolved.

**Authoritative A/R anomaly list (8 total, all seed corruption):**

**Group A — Underpaid: status=Paid with positive outstanding balance (5 invoices)**
Confirmed via correlated-subquery probe 2026-05-21:

| Invoice | ID | Customer | Total | Paid | Balance | Action |
|---------|-----|----------|-------|------|---------|--------|
| INV-2341AP | 15 | 3 | $26,116.02 | $25,618.80 | **$497.22** | Reopen → PartiallyPaid |
| INV-2221AP | 14 | 3 | $7,871.85 | $7,723.60 | **$148.25** | Reopen → PartiallyPaid |
| INV-2321A | 13 | 1 | $6,568.32 | $6,484.18 | **$84.14** | Reopen → PartiallyPaid |
| INV-2211A | 12 | 1 | $7,941.12 | $7,938.88 | **$2.24** | Write-off (BE-4 mechanism) |
| INV-2261 | 10 | 8 | $7,437.25 | $7,436.75 | **$0.50** | Write-off (BE-4 mechanism) |

**Group B — Overpaid: Σ payments > invoice total (3 invoices)**

| Invoice | ID | Customer | Total | Paid | Overpayment | Action |
|---------|-----|----------|-------|------|-------------|--------|
| INV-2251 | 8 | 7 | $8,526.38 | $8,629.50 | **$103.13** | Credit to customer account |
| INV-2331 | 9 | 7 | $30,351.75 | $30,443.25 | **$91.50** | Credit to customer account |
| INV-2421B | 11 | 8 | $5,656.50 | $5,657.40 | **$0.90** | Write-off |

**Why counts differed:** BA's F-036[BA] probe found Group B only (3, negative A/R visible). Automation-engineer-1 found all 8 (Group A + B). My F-045 found 3 of Group A (missed the 2 sub-dollar). Full list now pinned.

**Live handler verified clean (2026-05-21):** `POST /api/v1/payments` — $100 partial against INV-2401 (Overdue, $5,480) → `PartiallyPaid` confirmed. The 8 anomalies are seeder direct-inserts, not a code defect. F-050 reclassified as seed-corruption (dup-of-F-045 data track).

**`[DEVOPS]` action:** These 8 rows are the BE-4 regression fixtures. Freeze them exactly as listed above before running BE-4 regression. Group A (3 non-trivial) → `UPDATE invoices SET status = 2 WHERE id IN (13,14,15)`. Write-offs (id=10,12) and credits (id=8,9,11) require the BE-4 write-off/credit-memo mechanism to be in place before repair.

### H-011 [QA] 2026-05-21 — Coverage tracker ID corrections; F-050 filed; tax-float duplicate redirect; credit-memo scope recorded

`[ORCH]` `[TEAM]` — Four ledger actions this turn:

1. **Coverage tracker corrected (§1):** The tracker was written with pre-SEC numbering (expected QA GT findings at F-037–F-044). After `[SEC]` claimed F-034–F-039, actual QA GT findings landed at **F-040–F-047**. Tracker rows C1–C10 now reference correct IDs. No finding content changed — display labels only.

2. **F-050 filed:** Invoice payment-status promotion defect — BE marks invoice `Paid` on ANY payment receipt regardless of full settlement. 5 live invoices affected (see §4). Supersedes the partial observation in **F-045** (which identified 3 invoices and attributed them to seed; F-050 confirms the root cause is in `CreatePayment` logic). **F-003 closed** as resolved-as-misdiagnosed (dashboard zeros were 30-day-window-correct per `[ORCH]` ruling; F-050 is the real defect).

3. **Tax-rate float (orchestrator's "Finding 2") is a duplicate of F-022.** No new ID assigned; F-022 status updated to `in-deploy`. Informing `[ORCH]` for ledger alignment.

4. **Credit-memo FE scope recorded** in F-035[BA] status log per `[ORCH]` scope call.

### H-008 [BA] 2026-05-20 — Taxonomy sign-off (re H-005/H-004); BA spine deliverables landed; answers to H-007

`[QA]` `[ORCH]` `[ENG]` — BA online. Four things:

**1. ✓ Sign-off on §0.5 (re H-005/H-004) — drop "proposed v0".** Concur on all three: (a) severity and priority are separate axes, GAP is a Type not a severity; (b) the default severity↔priority bridge; (c) source-of-truth: my `gap-inventory.md` P-tiers are authoritative for **parity** items and you link spine-intersecting ones rather than duplicating all 38. One amendment: **`gap-inventory.md` is the parity list; my new `docs/ba/spine-gap-analysis.md` is the authoritative *spine* priority list** (re-derived against the north star — gap-inventory's P0 is MRP/scheduling = our DEFER, so its tiers must not drive spine sequencing). Pull spine priorities from the spine doc.

**2. BA deliverables landed** (validated against `[DOM]`'s Definition-of-Correct, verified against live code — not docs):
- `docs/ba/spine-requirements-and-dod.md` — authored REQ-* + DoD for the whole spine, each mapped to your `DISCOVERY.md §2A` invariant IDs.
- `docs/ba/spine-gap-analysis.md` — prioritized, code-cited gap list tied to the REQs and to this ledger.
Filed the 3 spine blockers not yet ledgered: **F-028** (no estimating engine), **F-029** (estimated cost never populated → margin reports garbage; likely the root of **F-003**), **F-030** (shipment relieves no inventory / no COGS — DISCOVERY §3.7 noted it, now a finding). Remaining BA gaps stay in the spine doc for you to link as charters run.

**3. Answers to H-007 (`[ENG]`):** (1) **F-027** accepted as a DoC/gap item — it is a **hard predecessor to any discount/adjustment feature** (the estimating engine, F-028, will introduce per-piece adders/margin/likely discounts), so collapse `CreatePayment` onto `Invoice.BalanceDue` before then. (2) **Yes** — track the $0 invoice on **both** axes: the BUG is F-021 (broken automation), the **GAP** is "invoice from shipment at SO-locked price, invoiced≤shipped" (INV-IN1; REQ-INVOICE-01 / GAP-INVOICE-01). Distinct, both tracked.

**4. One correction + one catalog proposal.** (a) **Correction to an earlier read of the QBO seam:** the idempotent `IntegrationOutbox` dispatches **Email only** (`IntegrationOutboxDispatcherJob` throws `NotImplementedException` for QuickBooks); the live QBO path `SyncQueue` has no idempotency — so "idempotent QBO transport" is **not** a current strength (folds into F-021 / ENG BE-2a). (b) **Propose a new invariant `INV-J3`** for `DISCOVERY.md §2A`: WIP-closure (`WIP = Σmaterial+Σlabor+Σburden+ΣOSP − Σrelieved → ~0 at job close`) — §2A has no job-cost-ledger invariant; it's the DoD for REQ-JOB-04 / GAP-JOB-02.

`[DOM]` — flagging for you: F-028 severity is a table-stakes call (you own "correct"); I filed MAJOR, candidate-BLOCKER as the #1 trust feature.

---

## 3. Audit scope & methodology

**Target**: localhost:4200 (Angular UI) backed by .NET API. Admin user `admin@forge.local`.

**Coverage** (work top-down):
1. Auth + onboarding (login, setup wizard, MFA, account/security)
2. Core navigation (sidebar, header, theme, breadcrumbs, search)
3. Dashboard + global widgets
4. Kanban / shop floor / production flow
5. Backlog + planning cycles
6. Parts catalog (incl. BOM, vendor sources, pricing tiers)
7. Inventory (storage locations, bins, movements, lots)
8. Customers (incl. all 9 detail tabs)
9. Vendors + purchase orders + receiving
10. Quotes / estimates / sales orders / shipments / invoices / payments
11. Quality (templates, inspections, lots, production runs)
12. Time tracking + clock + corrections + payroll + tax forms / compliance
13. Assets + tooling
14. Leads + expenses
15. Chat + AI assistants + notifications + search
16. Reports (dynamic builder)
17. Training LMS + Events
18. EDI + scheduled tasks
19. Admin (users, roles, capabilities, presets, discovery, terminology, integrations, MFA policy, locations, reference data)
20. Cross-cutting: print/PDF, accessibility full pass, mobile/responsive, offline, error pages, 404s

**Lenses** (apply each per area, weighted as user requested): functional · UX/usability · visual/design · gap analysis.

**Method per area**:
1. Land on the route, observe initial state (loading, empty, populated).
2. Exercise primary flows (create/read/update/delete, search/filter/sort, export, navigate).
3. Probe edge cases (empty values, max-length, invalid input, network failure simulated via offline, large data).
4. Test responsive behavior at 1080p and a narrow viewport.
5. Test keyboard-only navigation through one core flow.
6. Capture obvious UX/visual issues alongside functional ones.
7. Note gaps — what would a customer expect that's missing?

---

## 4. Findings (append-only, immutable)

> Format:
> ```
> ### F-### [Author] [Severity] [Lens(es)] · [Feature area] · Short title
> **Where**: route / file / API endpoint / DB table
> **Observed**: what's actually happening, with repro
> **Expected**: what should happen / what a customer would expect
> **Impact**: who hits this and how badly
> **Recommendation**: concrete fix or design direction
> **Evidence**: screenshot path / code ref / network log / quote
> **Status log**:
>   - `YYYY-MM-DD` `[Author]` opened
> ```

### F-001 [PM] [MAJOR] [perf · ux] · Dashboard · Multiple duplicate API calls fired on every dashboard load
**Where**: route `/dashboard` — observed in DevTools network panel
**Observed**: On a single navigation to `/dashboard`, the following endpoints are each fetched **twice**: `/api/v1/notifications`, `/api/v1/admin/accounting-mode`, `/api/v1/employee-profile`, `/api/v1/employee-profile/completeness`, `/api/v1/system/currency-base`, `/api/v1/user-preferences`, `/api/v1/capabilities/descriptor`. That's 14 calls when 7 would suffice.
**Expected**: One call per endpoint per page load. Bootstrap calls (capabilities, currency, user prefs, employee profile, accounting mode) should fire once at app-init and be cached in a service signal that the rest of the app reads.
**Impact**: Perf cost is small per call but compounds — users feel a longer "blank" period before the dashboard hydrates, and the API takes 2× the load. On slow networks/installs (the target 1080p shop-floor kiosk on plant Wi-Fi) it's user-visible.
**Recommendation**: Audit `AppComponent.ngOnInit()` and any global service constructors — likely the same service is being injected & subscribed-to in two places (e.g., once in `AppComponent`, once in a route component or guard). Move bootstrap fetches into singleton service `init()` calls protected by a "loaded" guard signal. Consider a `BootstrapService` that fans out one call set on login.
**Evidence**: see network log captured 2026-05-05 1:27a — entries 7–16 in the captured run.
**Status log**:
  - `2026-05-05` `[PM]` opened
  - `2026-05-21` `[QA]` **in-fix** — frontend-engineer confirmed in-progress as low-risk warmup alongside F-002; FE pipeline active per `[ORCH]` 2026-05-21.
  - `2026-05-21` `[ENG]` **resolved** — Added `private _inFlight: Observable<void> | null = null` dedup guard to `CapabilityService.load()`. Returns shared in-flight observable when a fetch is already in progress; `finalize()` resets `_inFlight` on completion; `share()` multicasts to concurrent subscribers. `clear()` also resets `_inFlight` on logout. `capability.service.ts`. TypeScript clean.

### F-002 [PM] [MINOR] [func · ux] · Dashboard · `/api/v1/ai/status` returns 403 even though AI capability is disabled (descriptor already says so)
**Where**: route `/dashboard`, endpoint `GET /api/v1/ai/status`
**Observed**: After the capability descriptor returns and clearly indicates `CAP-EXT-AI-ASSISTANT: disabled`, the dashboard (or a global service) still calls `/api/v1/ai/status` and gets a 403. Console DEBUG line: `[capability-disabled] CAP-EXT-AI-ASSISTANT: This capability is disabled for this installation.`
**Expected**: If the descriptor says the capability is off, no client-side code should call AI endpoints. The `*appCap="'CAP-EXT-AI-ASSISTANT'"` directive on whatever AI status indicator/widget exists should prevent the network call from being scheduled at all.
**Impact**: Wasted round trip + 403 noise in audit logs. For an admin reviewing security logs, 403s are signal — burying real auth violations under benign capability-gate noise erodes that signal.
**Recommendation**: Wherever `AiService.getStatus()` (or equivalent) is being called, gate the call on `capabilityService.isEnabled('CAP-EXT-AI-ASSISTANT')`. If it's a global indicator, hide the indicator with `*appCap` instead of letting it call and fail.
**Evidence**: console log + network entry 6 (`/api/v1/ai/status` 403) on dashboard load 2026-05-05 1:26a.
**Status log**:
  - `2026-05-05` `[PM]` opened
  - `2026-05-21` `[QA]` **in-fix** — frontend-engineer confirmed in-progress alongside F-001; FE pipeline active per `[ORCH]` 2026-05-21.
  - `2026-05-21` `[ENG]` **resolved** — `AiService.checkAvailability()` now gates on `capability.descriptor() !== null` before firing the HTTP check. When the descriptor is not yet loaded it chains on `capability.load()` (which also benefits from the F-001 dedup guard) and defers the check to the subscription callback (`_fireAvailabilityCheck()`). Existing layer-3 pre-flight (`isKnown` / `isEnabled`) then short-circuits before the `/ai/status` GET if the capability is confirmed disabled — no 403 emitted. `ai.service.ts`. TypeScript clean.

### F-003 [PM] [MINOR] [data · ux] · Dashboard · "Margin Summary" widget shows 0% margin alongside −$26,417.79 margin in dollars
**Where**: route `/dashboard`, "Margin Summary" widget (right column, second row)
**Observed**: Widget shows: `0% AVG MARGIN`, `Revenue $0.00`, `Cost $26,417.79`, `Margin -$26,417.79`, `Jobs (30d) 169`. The headline percent says "0%" but the dollar margin is strongly negative. Numerically, with $0 revenue and $26K cost, the margin percent is undefined (or −∞), not 0%.
**Expected**: Three options, in order of preference: (1) When revenue = 0, show `—` or `n/a` for the percent and surface "Margin requires revenue" hint. (2) Compute margin against cost when revenue is zero (gross-loss percent). (3) At minimum, do not display "0%" when the dollar value is non-zero — that is a math contradiction users will notice and lose trust over.
**Impact**: This is a credibility issue. Customers reviewing financial tiles will spot the contradiction immediately. Also signals an underlying data problem — 169 jobs in 30 days with $0 revenue suggests either seeded jobs lack invoices/payments wired up, or the revenue pipeline isn't computing.
**Recommendation**: Fix the formula in the margin-summary handler to handle revenue=0. Separately investigate why revenue is zero with 169 jobs — that's likely a real data integrity gap if real orders/invoices exist (related: see if F-### filing on customer→order→invoice flow uncovers it).
**Evidence**: dashboard screenshot 2026-05-05 1:27a, top-right widget.
**Status log**:
  - `2026-05-05` `[PM]` opened
  - `2026-05-21` `[ORCH]` **resolved-as-misdiagnosed** — the $0 revenue / −$26K margin display was 30-day-window-correct (no completed invoices/revenue in the seeded 30-day window); not a product math error. The real defect under this investigation is the invoice payment-status promotion bug (see **F-050**). F-003 closed.

### F-004 [PM] [MINOR] [ux · visual] · Dashboard · KPI tiles show a mystery "0" subtitle under each headline number
**Where**: route `/dashboard`, top KPI row (`125 ACTIVE / 0`, `58 OVERDUE / 0`, `0m HOURS / neutral`)
**Observed**: Each of the three KPI tiles has the headline metric (`125`, `58`, `0m`) and immediately below it a smaller `0` (or `neutral` on the third). There is no label on this secondary value — it just sits under the headline. A user has to guess what `0` means (delta? trend? related count?).
**Expected**: Either (a) label the secondary value (`▲ 0 vs prev period`, `+0 today`, `0 due today`), or (b) remove it when there's nothing to convey. The third tile uses `neutral` which is a label of sorts, but `neutral` what?
**Impact**: Low individually but symbolic — the dashboard is the first impression. Unlabeled numbers make a customer doubt the rest of the data. Dashboards must defend every number with a label.
**Recommendation**: Decide what the secondary value is supposed to communicate (most likely: delta vs. previous period, given the "neutral" label on the hours tile). Then wire a consistent `delta + arrow + period-label` micro-component (e.g., `▲ 12 vs last week`, `▼ 3 vs yesterday`, `— no change`). The `neutral` text suggests the indicator is meant to be a sentiment indicator — pick one pattern and use it on all three.
**Evidence**: dashboard screenshot 2026-05-05 1:27a.
**Status log**:
  - `2026-05-05` `[PM]` opened

### F-005 [PM] [POLISH] [ux] · Dashboard · "End of Day" widget surface assumes any user typing in it is finishing their day
**Where**: route `/dashboard`, "End of Day" widget (bottom-right) prompts: "What are your top 3 priorities for tomorrow?"
**Observed**: The widget is unconditional — it appears for the admin user reviewing a dashboard at 1:27 AM with the same "top 3 for tomorrow" prompt as it would for an engineer logging off at 5 PM. There's no time-of-day awareness, no role-awareness, and an admin auditing the system has no reason to fill this in.
**Expected**: The widget should be either (a) opt-in / configurable per role (engineer + worker yes; admin/PM no by default), (b) time-gated (e.g., visible only after some hour configured per user, like 4 PM), or (c) at minimum the prompt should adapt to the time ("What did you accomplish today?" pre-EOD vs "Top 3 priorities for tomorrow?" near EOD).
**Impact**: Minor on its own but indicative of a broader pattern: dashboards that ship one-size-fits-all widgets feel less professional than dashboards that adapt to who is using them. This is a 1.0 polish item.
**Recommendation**: Make the End-of-Day widget part of the dashboard customizer's available widgets, default-on for Engineer/Production Worker, default-off for Admin/Office Manager. Add a time-aware prompt swap. Keep the SAVE behavior — it's a good cue; just contextualize what's being saved.
**Evidence**: dashboard screenshot 2026-05-05 1:27a, bottom-right.
**Status log**:
  - `2026-05-05` `[PM]` opened

### F-006 [PM] [MINOR] [visual · ux] · Dashboard · Today's Tasks rows have inconsistent action chips (NEXT vs LATE) but no legend
**Where**: route `/dashboard`, "Today's Tasks" widget
**Observed**: Each row in Today's Tasks has a colored chip at the right — most rows say `NEXT` (teal), one says `LATE` (red). There's no legend, no tooltip, no header explaining what these chips mean or what clicking them does. From a fresh user's perspective: is `NEXT` an action button (advance the job to next stage)? Is it a status (this is what's next to do)? `LATE` similarly — is that a state or an action?
**Expected**: Either treat them as pure status chips (then disable click and add a tooltip explaining the rule that drives the label) OR treat them as actions (then visually distinguish them as buttons and confirm the action on click). Today they look like buttons but aren't labeled clearly enough to know what they do.
**Impact**: A first-time user will click `NEXT` to find out. If it's an action, that's a destructive path (advancing a job by mistake). If it's a status, the click is a no-op which feels broken. Either way the lack of clarity costs trust.
**Recommendation**: Decide intent. If status: rename to a noun-based label ("Up next", "Overdue") with a `cursor: default` and a tooltip. If action: rename to a verb ("Advance", "Mark late") and gate behind a confirm. Add a short row-header legend or a `?` help affordance.
**Evidence**: dashboard screenshot 2026-05-05 1:27a, "Today's Tasks" rows.
**Status log**:
  - `2026-05-05` `[PM]` opened

---

### F-020 [QA] [BUG] [BLOCKER] [P0] [PRIMARY] [func · data] · Shipment / Sales Order · `ShippedQuantity` double-counted per shipment
**Where**: `forge.api/Features/Shipments/CreateShipment.cs:78` **and** `forge.api/Features/DomainEvents/Handlers/OnShipmentCreated_UpdateSalesOrder.cs:38`
**Observed**: Both sites run `orderLine.ShippedQuantity += line.Quantity` against the **same request-scoped `AppDbContext`**. `CreateShipment` increments inline, then publishes `ShipmentCreatedEvent`; the handler increments the same tracked entity again → **shipped qty persists at 2× per shipment**. Existing `CreateShipmentHandlerTests.cs:235` passes only because it mocks the mediator, so the notification path is never exercised. Verified present in tree **2026-05-20** (`[QA]` grep); independently flagged confirmed by `[ORCH]` and prior back-end audit.
**Expected**: Shipped qty increments exactly once per shipment line.
**Impact**: Corrupts the `ordered = shipped + remaining` conservation law. **Breaks INV-SH1** (over-ship guard sees 2× → `shipped ≤ ordered` violated legitimately), **distorts INV-IN1** (`invoiced ≤ shipped` baseline doubled), drives **premature SO "Shipped" status**, and skews ATP allocation. Spine-critical, financial-adjacent.
**Recommendation**: Single source of truth — remove the inline `+=` in `CreateShipment` and let the event handler own the increment (or vice-versa, not both). Add a regression test that exercises the **real** notification path (not a mocked mediator). My DB probes **P5 (INV-SH1)** and **P6 (INV-SH2)** in `GT-CHARTER.md §4` detect this directly — first validation of those probes.
**Evidence**: grep 2026-05-20 (both `+=` lines); back-end audit; `[ORCH]` ruling this turn.
**Status log**:
  - `2026-05-20` `[QA]` opened — **confirmed** (code verified present in tree). Provisional BLOCKER/P0; Priority to be ratified at post-GT triage. **Baseline caveat:** until fixed, treat all seeded/GT `shipped_quantity` values as suspect (possible 2×).
  - `2026-05-20` `[ENG]` **resolved** — removed duplicate `+= shipmentLine.Quantity` from `OnShipmentCreated_UpdateSalesOrder.cs:38`; handler now updates SO **status only** (no ShippedQuantity mutation). Inline increment in `CreateShipment.cs:78` retained (atomic with shipment insert + single `SaveChanges`). DoD INV-SH1 validated: `CreateShipmentMediatorIntegrationTests.CreateShipment_ShippedQuantityIncrementedExactlyOnce_NotDoubled` — **red before fix, green after** (10/10 shipment tests pass). **Held — no merge — pending DevOps rollback gate + QA probe confirmation.**
  - `2026-05-21` `[QA]` **DoD signed off — LIVE HANDLER VERIFIED.** Code fix confirmed in source: `OnShipmentCreated_UpdateSalesOrder.cs:31` comment confirms no ShippedQuantity mutation; `CreateShipment.cs:78` retains single increment. Live API proof (GT C7 re-run 2026-05-21): `POST /api/v1/shipments` — 5 units against SO-00001 SOL-22 (ordered=10) → `shipped_quantity=5.0000` after one call, exactly once. INV-SH1 probe: **0 violations** across all SO lines. Seed caveat: 21 legacy seed SO lines still show `shipped_quantity=0` (seeder used direct-insert, not the handler — backfill is a `[DEVOPS]` action independent of the fix). Real-mediator integration test (`CreateShipmentMediatorIntegrationTests`) is the automation DoD gate; QA sign-off on DB probe granted. **F-020 CLOSED pending seed backfill.**
  - `2026-05-21` `[ENG]` **UI-read verified — PASS.** Playwright smoke against live `:4200` (nginx, post-861b82d). SOL 5 (SO-2401, P-1006, ordered=8): API returns `shippedQuantity=3.0`; LINE ITEMS tab displays `3 / 5` (shipped / remaining). SOL 22 (SO-00001, P-1001, ordered=10): API returns `shippedQuantity=5.0`; LINE ITEMS tab displays `5 / 5`. No client-side doubling or inflation. Noted: SH-2401 seed shipment carries `quantity=8` in its line record (pre-fix historical seed, direct-insert bypass) while the SO line shows 3 — this is a data-quality artifact already scoped to the `[BA]`/`[DEVOPS]` backfill item below, not a UI bug. UI reads canonical `ShippedQuantity` from the SO line correctly. F-020 UI DoD: **CLOSED**.
  - `2026-05-21` `[BA]` **Backfill assessment — MIGRATION REQUIRED (not cosmetic).** Full read-site sweep confirms `shipped_quantity` drives four live downstream systems: (1) **`AtpService.cs:32-33,126-128`** — ATP/open-demand computation (`Quantity − ShippedQuantity`); zeroed values overstate open demand by cumulative shipped qty → ATP and demand-pegging are corrupted. (2) **`AutoPurchaseOrderJob.cs:70,122`** — auto-PO trigger + PO quantity (`remainingQty = Quantity − ShippedQuantity`); zeroed values re-trigger PO generation for already-shipped quantities — financial integrity hazard. (3) **`MrpService.cs:86,91`** — MRP gross demand netting; same over-demand error, affects material planning. (4) **`SalesOrderLine.RemainingQuantity` / `IsFullyShipped` (entity:20-21)** — computed properties consumed throughout the UI (SO detail, shipment create guard); with zeroed values all 20 shipped SO lines display as fully open/unshipped in both UI and reports. **Production customer data risk: confirmed real.** The gap arises from `SeedData.Historical.cs` bypassing `CreateShipment.Handle()` — identical risk exists for any customer that migrates historical data via direct DB insert or script, which is the standard on-boarding pattern. **Derivation path is clean and idempotent:** `SUM(shipment_lines.quantity) WHERE sales_order_line_id = sol.id` — always authoritative from existing FKs. **Acceptance spec for `[ENG]`/`[DEVOPS]` backfill script:** `UPDATE sales_order_lines sol SET shipped_quantity = (SELECT COALESCE(SUM(sl.quantity), 0) FROM shipment_lines sl WHERE sl.sales_order_line_id = sol.id) WHERE EXISTS (SELECT 1 FROM shipment_lines sl WHERE sl.sales_order_line_id = sol.id);` — idempotent (overwrites with derivation), safe to re-run, no schema change (EF migration not needed). **Post-backfill DoD:** QA re-run INV-SH1 probe (0 violations expected); verify SO statuses update to `PartiallyShipped`/`Shipped` where appropriate; ATP and MRP open-demand counts should drop to reflect actual remaining quantities. **Routing:** `[DEVOPS]` F-036 repair list; run before GT re-probe of C7/C8 to unblock INV-SH1/SH2 and SO-status assertions.

### F-021 [QA] [GAP] [BLOCKER] [P1] [PRIMARY] [func · data] · QBO sync seam · Real Invoice/Payment never sync; blocker-class defects latent under `MOCK_INTEGRATIONS`
**Where**: live QBO path = `SyncQueueEntry`/`SyncQueueRepository`/`SyncQueueProcessorJob` → `forge.integrations/QuickBooksAccountingService.cs`. Sync **enqueue sites (all of them, verified 2026-05-20)**: `CreatePart`, `UpdatePart`, `MoveJobStage`, `UpdateExpenseStatus`, `StopTimer`.
**Observed**:
  - **(mock-VISIBLE — GT catches regardless of mock)** Neither `CreateInvoice` nor `CreatePayment` enqueues a sync → the **real Invoice/Payment entities never sync**; `invoices.external_id`/`payments.external_id` stay NULL. The only invoice-ish sync is `MoveJobStage` building a **$0 placeholder doc** (`Amount:0m`, one `Qty:1,UnitPrice:0m` line). `IntegrationOutboxDispatcherJob` (the newer outbox w/ idempotency key + backoff) `throw new NotImplementedException` for `QuickBooks` — handles **email only**.
  - **(mock-LATENT — fire only against real QBO)** Double-post on retry (no QBO `requestid`/idempotency token; `MarkFailed`→`Pending`→duplicate create); silent stranding (`Processing`-stuck entries never retried/surfaced; `GetFailedCountAsync`/`GetQueueDepthAsync` exist but are **wired nowhere** — no health panel); single `job.ExternalRef` overwritten across Estimate→Invoice→PO; tax double-compute (app sends none, QBO computes independently).
**Expected**: Each posted invoice/payment ↔ exactly one QBO doc, idempotent on retry, amount parity to the cent, failures surfaced & retryable (INV-QBO1/QBO2/QBO3, INV-IN3/IN4).
**Impact**: Highest-risk integration; app A/R diverges from the QBO book of record. **Reframes the mock-seam-only first pass:** mock coverage will FALSE-PASS INV-QBO1(retry-idempotency)/IN4/QBO3 because those manifest only against real QBO — see Known Coverage Holes (§6).
**Recommendation**: Treat as the QBO hardening epic. First-pass GT (C10) validates the **mock-visible structural defects** via failure-injection + static + queue-state DB probes (probe P10). Defer idempotency-on-retry + cent-parity to the scheduled **real-QB-sandbox milestone** (`[ORCH]` ruling).
**Evidence**: enqueue-site grep + `IntegrationOutboxDispatcherJob` `NotImplementedException` verified 2026-05-20; prior back-end QBO seam audit (5 blocker-class defects, latent under mock).
**Status log**:
  - `2026-05-20` `[QA]` opened — **partially confirmed** (enqueue gap + NotImplemented branch verified in tree); mock-latent items `needs-verify-on-GT` / real-sandbox milestone. Provisional BLOCKER/P1; Priority at triage.
  - `2026-05-20` `[BA]` **business classification: confirmed BLOCKER — all four `[DOM]` guardrails fail simultaneously.** (1) **Qty basis = $0 placeholder** (`Qty:1, UnitPrice:0m`), not `shippedQty−alreadyInvoiced` — REQ-INVOICE-01/INV-IN1 violated; the real local `Invoice` entity with actual amounts never reaches QBO (`invoices.external_id` stays NULL). (2) **No shipment gates the trigger stage** — `TryEnqueueAccountingDocumentAsync` has no shipment-existence check; pre-ship revenue triggers are structurally possible. (3) **Non-idempotent** — no unique constraint on `sync_queue_entries (EntityType, EntityId, Operation)`; re-entering the trigger stage emits a duplicate enqueue. (4) **No automated partial-ship invoicing path** — the invoicing path is fully manual or placeholder-based; no "invoice from shipment at SO-locked price" handler exists (GAP-INVOICE-01, tracked separately per H-008). Two disconnected invoice concepts confirmed: the stage-triggered $0 QBO doc and the real local Invoice that never syncs. **Recommend elevating to P0** — mock-visible structural defect (real Invoice never syncs) is LIVE regardless of `MOCK_INTEGRATIONS`; `[ORCH]` owns priority override.

### F-022 [ENG] [BUG] [MINOR] [P3] [PRIMARY] [func · visual] · Quote & Invoice detail · Tax-rate % renders raw float (`2.900000000000004%`) — FIXED
**Where**: `forge-ui` `src/app/features/quotes/components/quote-detail-panel/quote-detail-panel.component.html:100` and `src/app/features/invoices/components/invoice-detail-panel/invoice-detail-panel.component.html:102`
**Observed**: Both templates rendered the tax-rate label as `{{ x.taxRate * 100 }}%`. `taxRate` is stored as a fraction (e.g. `0.029`, `0.056`, `0.0725`), and `0.029 * 100` evaluates to `2.9000000000000004` in JS floating point, so the UI literally showed `TAX (2.900000000000004%)`. Confirmed by rendering the seeded instance: Quote `Q-2341AP` → `2.900000000000004%`; Invoice `INV-2321A` (0.056) → `5.6000000000000005%`; `INV-2331` (0.0725) → `7.249999999999999%`. (Sales-order/SO with 0% tax masked it — see F-023.)
**Expected**: A clean tax percent: `2.9%`, `5.6%`, `7.25%`.
**Impact**: Credibility on a financial spine surface — customers reading a quote/invoice see 13-digit float garbage in the tax line. Same root cause on two PRIMARY-spine screens.
**Recommendation / fix applied**: Piped through Angular `DecimalPipe` — `{{ x.taxRate * 100 | number:'1.0-2' }}%` (the idiom already used in `oee-work-center-card`). `DecimalPipe` already imported in both components; no other change.
**Evidence**: before — `evidence/spine-census/quotes-detail.png`, `invoices-detail.png`; after — `evidence/spine-census/FIXED-quote-tax.png`, `FIXED-invoice-2321A-tax.png`, `FIXED-invoice-2331-tax.png`. Rendered-text validation on a local dev build (port 4300, prod env so proxy is used; shared `:4200` untouched): `Q-2341AP → "2.9%"`, `INV-2321A → "5.6%"`, `INV-2331 → "7.25%"`.
**Status log**:
  - `2026-05-20` `[ENG]` opened + **resolved in working tree** (2-line template fix, validated against rendered behavior). Not yet deployed to shared `:4200` — needs the eng-lead's UI redeploy/queue. `taxAmount` (the $ figure) was always correct; only the displayed *rate* was affected.
  - `2026-05-21` `[QA]` **in-deploy** — frontend-engineer deploying fix to shared `:4200` now per `[ORCH]` 2026-05-21. Note: orchestrator reported this as a new finding 2026-05-21; confirmed duplicate of this entry — **no new ID assigned**; redirected to this status update.
  - `2026-05-21` `[ENG]` **resolved** — 4-file template fix in working tree (quote-detail-panel, quote-dialog, invoice-detail-panel, invoice-dialog); all four `{{ x.taxRate * 100 }}%` expressions piped through `| number:'1.0-2'`. Staged for forge-ui commit alongside F-001/F-002/Wave-1 groundwork.

### F-023 [ENG] [BUG] [MINOR] [P3] [PRIMARY] [func · data] · Sales Order detail · Tax rate rendered without `×100` — latent unit inconsistency vs quote/invoice
**Where**: `forge-ui` `src/app/features/sales-orders/components/sales-order-detail-panel/sales-order-detail-panel.component.html:181` (`{{ so.taxRate }}%`) vs quote/invoice which use `{{ taxRate * 100 }}%` (F-022).
**Observed**: SO detail renders `taxRate` directly as a percent (no `×100`); quote and invoice multiply by 100. Could not be observed live because every seeded SO has `taxRate = 0` (renders `0%` either way). So exactly one of two contracts is wrong: either (a) the SO list/detail API returns `taxRate` already as a percent (e.g. `2.9`) while quote/invoice return a fraction (`0.029`) — a back-end DTO-unit inconsistency the UI is (correctly) adapted to; or (b) all three return fractions and the SO screen will render `0.029%` for a real 2.9% order — a client bug.
**Expected**: One unit convention for `taxRate` across the spine DTOs, rendered identically on all three screens.
**Impact**: Latent — invisible at 0% tax, wrong the moment a taxed sales order exists.
**Recommendation**: `needs-info` — confirm the `taxRate` unit on the SO detail/list DTO (back-end) before touching the template. If fractions, change SO to `{{ so.taxRate * 100 | number:'1.0-2' }}%` to match F-022; if percents, normalize the DTOs so all three agree. Do not blind-fix the template. Related: F-022.
**Status log**:
  - `2026-05-20` `[ENG]` opened — `needs-info` (API-contract question; no seeded non-zero-tax SO to reproduce).

### F-024 [ENG] [BUG] [MINOR] [P3] [PRIMARY] [ux · visual] · Shipment detail · "Linked Invoice" shows raw DB id (`#4`) instead of invoice number (`INV-2401`)
**Where**: `forge-ui` `src/app/features/shipments/components/shipment-detail-panel/shipment-detail-panel.component.html:77` — `<app-entity-link type="invoice" [entityId]="shipment.invoiceId!">{{ '#' + shipment.invoiceId }}</app-entity-link>`. Model `shipment-detail.model.ts:18` carries only `invoiceId: number | null` (no `invoiceNumber`).
**Observed**: On `SH-2401` the linked invoice renders as `#4` (the raw PK), while the same dialog shows the sales order as `SO-2401` and the invoice's own detail shows `SH-2401`/`SO-2401` (friendly numbers). The link target is correct; only the label is the raw id.
**Expected**: `INV-2401` (the friendly invoice number), consistent with every other cross-entity link on the spine.
**Impact**: Minor cosmetic/UX inconsistency on a PRIMARY screen; users see an internal id where every neighbor shows a business number.
**Recommendation**: **Not a pure client-side fix** — the shipment-detail DTO must expose `invoiceNumber` (back-end), then the template renders that. Flagging for the eng-lead's queue, not fixing client-side-only.
**Status log**:
  - `2026-05-20` `[ENG]` opened — needs back-end DTO field; out of scoped client-side lane.

### F-025 [ENG] re F-001/F-002 [BUG] [MINOR] [P2] [PRIMARY] [perf · func] · App shell · F-001 (dup bootstrap calls) & F-002 (AI-status 403) re-verified STILL-LIVE and **app-wide**, not dashboard-only
**Where**: every authenticated route (verified by rendering all 5 spine list screens 2026-05-20), not just `/dashboard` as F-001/F-002 scoped it.
**Observed**: On each of `/quotes`, `/sales-orders`, `/shipments`, `/invoices`, `/payments` the same console/network noise fires on load: `GET /api/v1/ai/status` → **403** (F-002, AI capability disabled but client still calls — directive asked to re-verify staleness: it is **not** stale, it is live and broader); `GET /api/v1/admin/accounting-mode` → **403, fired twice** (the duplicate matches F-001's pattern, and the 403 is a second forbidden bootstrap call beyond ai/status); plus one URL-less `404` per page. No spine-route-specific errors and no uncaught page errors — the spine screens themselves are clean; the noise is the global app-shell/bootstrap.
**Expected**: Bootstrap calls fire once at app-init, cached in a signal (F-001); capability-/role-gated endpoints (`ai/status`, `admin/accounting-mode`) are not called when the descriptor says off (F-002).
**Impact**: Perf (2× bootstrap on every navigation) + audit-log noise (benign 403s burying real auth violations) across the whole app, not one page.
**Recommendation**: Belongs to the **global app-shell / bootstrap** work (F-001/F-002 root fix), not a scoped per-screen client fix — gating these touches singleton bootstrap services and is best done once in the eng-lead's queue. Did **not** fix here (out of spine-screen scope + shared-`:4200` risk). Logging as re-verification + scope-expansion of F-001/F-002.
**Status log**:
  - `2026-05-20` `[ENG]` opened — re-verifies F-001 + F-002 as live and app-wide. Deferred to global-bootstrap fix.

### F-026 [ENG] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Payment · Invoice over-application possible under concurrent payments (unguarded read-modify-write)
**Where**: `forge.api/Features/Payments/CreatePayment.cs:68-92`
**Observed**: The handler reads `balanceDue`, checks `app.Amount > balanceDue`, then applies and *sometimes* updates `invoice.Status` — a read-modify-write with no row lock and no balance re-check at commit. Two concurrent payments to the same invoice both read the same balance before either commits → both pass the guard → over-application (A/R negative). The WU-11 optimistic `Version` on `Invoice` only protects the path where `invoice.Status` is reassigned (which bumps the row); a **partial payment against an already-`PartiallyPaid` invoice changes no Invoice field → no version bump → no guard.** Even when it does fire, it surfaces as an unhandled `DbUpdateConcurrencyException` (500), not a graceful retry. (Money-side analog of the inventory check-then-set race in the eng-lead's BE-1 note.)
**Expected**: `applied ≤ open balance` always; `A/R = Σ invoices − Σ payments − Σ credits` holds under concurrency (DoC §A8/§C).
**Impact**: **LIVE (concurrency-triggered), independent of `MOCK_INTEGRATIONS`.** Lower frequency than F-020 (needs concurrent posts to one invoice) but corrupts A/R — the financial spine. Not covered by F-020/F-021.
**Recommendation**: Guard the apply in a transaction that re-reads balance under a row lock (`SELECT … FOR UPDATE` on the invoice), or always touch the invoice so `Version` fires, and translate the concurrency failure into a clean `409` + client retry. Consume `invoice.BalanceDue` rather than re-deriving (see F-027). **Acceptance (QA INV-AR1):** concurrent-payment probe cannot drive `BalanceDue < 0`; Σ applications per invoice ≤ its total. Sits with BE-1 (single-`AppDbContext`-as-UoW; no re-slice).
**Evidence**: code ref above; prior back-end transactional-integrity audit.
**Status log**:
  - `2026-05-20` `[ENG]` (back-end) opened — LIVE; fix-ready; **held — no merge — pending DevOps rollback + QA verification gates.**

### F-027 [ENG] [BUG] [MINOR] [P2] [PRIMARY] [func · data] · Invoice / Payment · Two parallel formulas for invoice balance (duplicated money logic; equal today, diverges on first line discount)
**Where**: `forge.core/Entities/Invoice.cs:35-39` (`Total = Σ LineTotal × (1+TaxRate)`) vs `forge.api/Features/Payments/CreatePayment.cs:71` (`Σ(Quantity×UnitPrice) × (1+TaxRate) − applied`)
**Observed**: `CreatePayment` re-derives invoice balance with its own formula instead of the entity's `BalanceDue`/`Total` computed properties. They are numerically equal **today** only because `InvoiceLine.LineTotal => Quantity * UnitPrice` (`InvoiceLine.cs`). The instant a line-level discount/adjustment or any other `LineTotal` rule lands, the two silently diverge — payments validated against a different number than the invoice reports.
**Expected**: One canonical money computation (DoC §C "deterministic, stable recompute"); callers consume `invoice.BalanceDue`.
**Impact**: Latent correctness landmine on the money spine — **not producing wrong numbers today (hence MINOR)**, but a parallel source of truth one schema change away from MAJOR. **Flagged to `[BA]`** (H-007) as it intersects the pricing/discount model in the gap inventory.
**Recommendation**: Replace the inline computation in `CreatePayment` with `invoice.BalanceDue`; add a unit test asserting the handler's balance == `invoice.BalanceDue` so they can't drift. Sequence **before** any line-discount feature.
**Evidence**: code refs above; `InvoiceLine.LineTotal` definition verified 2026-05-20.
**Status log**:
  - `2026-05-20` `[ENG]` (back-end) opened.
  - `2026-05-21` `[ENG]` (back-end) **resolved (code-complete, Wave-0 ship loop)** — `CreatePayment.cs:71` inline re-derivation replaced with canonical `invoice.BalanceDue`. No behavioral change today (numerically identical while `LineTotal == Quantity*UnitPrice`); collapses the parallel formula before F-026's concurrency guard reads the same balance. DoD: anti-drift lock-in test `CreatePaymentHandlerTests.Handle_BalanceGuard_AcceptsExactlyInvoiceBalanceDue_AndRejectsOneCentMore` (non-trivial balance = tax + prior partial payment) — **6/6 green**. Commit `1512cc7` on `fix/f-027-canonical-balancedue` (stacked on F-020 `861b82d`). No migration. **Held — snapshot/build via DevOps; merges after F-020 ships, before F-026.**

### F-028 [BA] [GAP] [MAJOR] [P1] [PRIMARY] [func] · Quote / Estimate · No estimating/pricing engine — quotes are manual dollar containers
**Where**: `forge.api/Features/Quotes/CreateQuote.cs:82` (`total = Σ Quantity×UnitPrice`); `forge.api/Features/Estimates/CreateEstimate.cs:38-48` (single manual `EstimatedAmount`); `forge.core/Entities/Operation.cs:17-38` (`SetupMinutes`/`RunMinutesEach`/`RunMinutesLot`/`BurdenRate` exist but are never assembled into a price).
**Observed**: `UnitPrice`/`EstimatedAmount` are entered manually; nothing computes `unit_price(Q) = markup(setup/Q + run×rate + material/pc + OSP/pc)`. No setup amortization, no material scrap/drop factor, no UOM in cost, no qty-break monotonicity guard, no rounding policy. The routing carries the cost inputs; no engine consumes them.
**Expected**: A deterministic estimating engine per DoC §3 — INV-Q1 (deterministic recompute), INV-Q2 (qty-break monotonicity), INV-Q3 (setup once, not per-unit), INV-Q4 (setup-vs-run separation).
**Impact**: DoC calls quote-math the #1 trust signal for a job shop ("a real shop would consider the software wrong/unusable without it"). Today there is no math to be correct. **Root cause of F-029** (estimated cost has no source). `[DOM]` candidate-elevate to **BLOCKER**; `[ORCH]` owns final priority.
**Recommendation**: Build the cost-buildup engine (DoC §3); feed `Job.Estimated*Cost` on release (F-029). See `docs/ba/spine-requirements-and-dod.md` REQ-QUOTE-01 + `spine-gap-analysis.md` GAP-QUOTE-01.
**Evidence**: code refs above; BA spine audit 2026-05-20.
**Status log**:
  - `2026-05-20` `[BA]` opened.
  - `2026-05-21` `[DOM]` **severity upgraded to BLOCKER** — §A1 spine entry and customer trust anchor; by cascade, leaves quoted-vs-actual margin uncomputable (the number a job shop runs on). Largest single build in the wave; bounded by §A1 MVP scope. Ratified in triage registry by `[ORCH]` 2026-05-21.
  - `2026-05-21` `[BA]` **MVP REQ authored — DOM gate cleared, eng-lead may build.** Full acceptance spec: `docs/ba/spine-requirements-and-dod.md §2` — REQ-QUOTE-01 through REQ-QUOTE-07 with testable DoD checklists (numeric input→expected-cost cases per requirement). End-to-end chained acceptance test `F-028-E2E` added: Q=25 part with two-op routing, BOM (scrap+UOM), OSP minimums, 35% margin → unit price $28.71, line total $717.75 (all intermediate values pinned). **MVP scope boundary (explicit):** REQ-QUOTE-01–06 cost engine + REQ-QUOTE-07-B estimated cost baseline to Job. Productivity/efficiency layer (worker efficiency %, machine uptime factors, learning-curve), templated estimating, what-if scenarios, analytics deferred to fast-follow. REQ-QUOTE-07-A price lock → SO is a downstream guard tracked separately (F-055); it does not gate F-028 closure. Tax REQ (BE-2c) excluded — DOM build spec is the canonical contract. `[DOM]` §A1 validation required before any REQ-QUOTE DoD is marked closed.

### F-029 [BA] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Job costing · `Job.Estimated*Cost` never populated in production → estimated-vs-actual margin reports garbage
**Where**: `forge.core/Entities/Job.cs:49-56` (`Estimated{Material,Labor,Burden}Cost`, `EstimatedMarginPercent`). Only assignments in the repo: `forge.api/Features/Dev/SeedReportTestData.cs:313-314` and `forge.tests/Handlers/Jobs/JobCostHandlerTests.cs:22-23`.
**Observed**: No production code path (SO→Job auto-create, CreateJob, quote conversion) writes the estimated-cost fields. On real jobs they default to 0, so `EstimatedMarginPercent` and all est-vs-actual variance in `JobCostSummaryModel` are meaningless. The *actual*-cost side (`JobCostService`) works; the *estimated* side has no source.
**Expected**: On job release, estimated costs derive from the routing/BOM/quote so margin is real (DoC §2 Production: "estimated vs actual is core, not reporting fluff").
**Impact**: The #1 job-shop trust feature silently reports false margins. Also a **seed trap**: `SeedReportTestData.cs` populates these, so a demo will look healthy while production is broken (→ data-quality checklist REQ-DATA-01 #3). Likely the same thread as **F-003** ($0 revenue / 169 jobs / −$26K margin).
**Recommendation**: Populate estimates on release (depends on F-028). Until then, treat margin tiles as not-trustworthy. See REQ-JOB-02 / GAP-JOB-01.
**Evidence**: repo-wide grep for `EstimatedMaterialCost =` assignments; BA spine audit 2026-05-20.
**Status log**:
  - `2026-05-20` `[BA]` opened.

### F-030 [BA] [GAP] [BLOCKER] [P0] [PRIMARY] [func · data] · Shipment / Inventory · Shipment relieves no inventory and recognizes no COGS (on-hand has no −Σshipments term)
**Where**: `forge.api/Services/AtpService.cs:20`, `forge.data/Repositories/InventoryRepository.cs:226` (`on_hand = Σ BinContents.Quantity`, no shipment term); `forge.api/Features/Shipments/ShipShipment.cs` + `Features/Shipping/*` (ship/pick-confirm/pick-complete never decrement bins). Corroborates DISCOVERY §3.6/§3.7.
**Observed**: Confirming a shipment does not decrement on-hand, recognizes no COGS, and captures no lot/serial on shipped product. The only outbound stock consumption is `MaterialIssue` to a job, not shipment.
**Expected**: Ship-confirm relieves inventory **exactly once** (INV-SH2, idempotent) and recognizes COGS; `on_hand` includes `−Σshipments` (INV-INV1). DoC §1 Pick/Pack/Ship row: "COGS recognized; inventory relieved."
**Impact**: The inventory ledger is structurally incomplete — on-hand overstates by everything ever shipped; INV-INV1 cannot hold; no COGS at ownership transfer. LIVE (not mock-gated). Day-one spine gap; pairs with F-020 (the ship handler is also where the ShippedQuantity double-count lives).
**Recommendation**: Relieve inventory + recognize COGS on ship-confirm, idempotently (coordinate with F-020 fix in the same handler). See REQ-SHIP-02 / GAP-SHIP-02.
**Evidence**: code refs above; DISCOVERY §3.7; BA spine audit 2026-05-20.
**Status log**:
  - `2026-05-20` `[BA]` opened.

### F-031 [BA] [BUG] [BLOCKER] [P0] [PRIMARY] [func · data] · Invoice / Tax · App carries flat per-invoice tax that guarantees divergence from QBO AST in integrated mode
**Where**: `forge.core/Entities/Invoice.cs:36` (`TaxAmount => Subtotal * TaxRate`); `forge.integrations/QuickBooksAccountingService.cs:550-571` (QBO payload omits `TaxAmount` — sends line items only; no `SalesTaxLineDetail`); `forge.api/Features/SalesTax/GetTaxRateForCustomer.cs` (flat state-level lookup, not jurisdiction-aware).
**Observed**: The app computes and stores flat `Subtotal × TaxRate` on quotes, sales orders, and invoices (`TaxRate` stored as `decimal(8,6)` at order/invoice level). The QBO sync payload carries line items only — no tax fields (`AccountingDocument` model + `BuildDocumentPayload()` confirmed). QBO applies Automated Sales Tax (AST) independently. In integrated mode: (a) app's local invoice carries flat-rate tax used for `BalanceDue` and payment validation; (b) QBO invoice carries AST-computed tax — two conflicting authoritative numbers, guaranteed arithmetic drift. Domain specialist ruling 2026-05-20: **QBO AST is the sole tax authority; app must stop authoring tax.**
**Expected**: App defers all tax-amount computation to QBO AST. Local records capture only the tax inputs QBO AST needs (ship-to address, per-line taxability code, customer exemption status). The AST-returned amount becomes the authoritative figure carried back and used for `BalanceDue`.
**Impact**: In integrated mode, every taxable invoice produces two conflicting totals — one the customer sees in Forge (app-computed flat tax), one in QBO (AST-computed). Payment amounts applied in Forge cannot clear the QBO invoice. A/R balance in Forge diverges from QBO book of record on every taxable transaction. Not currently observable under `MOCK_INTEGRATIONS`; becomes the dominant QBO reconciliation failure on go-live. Correlates with F-021 (QBO seam completeness).
**Recommendation**: (1) Remove independent tax computation from local invoice `BalanceDue`; treat tax as a QBO-returned value synced back on invoice post. (2) Ensure QBO payload carries the correct AST inputs: ship-to address (exists — see F-032), per-line taxability code (missing — see F-032), customer exemption cert (partial — see F-032). (3) Recalibrate `BalanceDue` formula after AST round-trip. Sequence: F-032 schema changes first, then F-031 logic change, then F-021 sync wire-up.
**Evidence**: `forge.core/Entities/Invoice.cs:35-39`; `forge.integrations/QuickBooksAccountingService.cs:550-571`; `forge.api/Features/SalesTax/GetTaxRateForCustomer.cs`; domain specialist ruling 2026-05-20.
**Status log**:
  - `2026-05-20` `[BA]` opened — code state confirmed (flat rate × subtotal computed and stored; QBO payload sends no tax fields). Domain specialist ruling: defect, not a design choice. Depends on F-032 (schema prerequisites).

### F-032 [BA] [GAP] [MAJOR] [P1] [PRIMARY] [data] · Tax schema · Missing per-line taxability code and exemption-cert expiry required as QBO AST inputs
**Where**: `forge.core/Entities/InvoiceLine.cs` (no `TaxCode`/`IsTaxable` flag); `forge.core/Entities/SalesOrderLine.cs` (same); `forge.core/Entities/Customer.cs` (`TaxExemptionId` varchar(50) + `IsTaxExempt` bool exist; no `ExemptionExpiryDate`). Migration `20260425161741_Add_TaxExempt_And_InvoiceCustomerPO.cs` confirms what was added.
**Observed** (schema inventory against F-031 fix prerequisites):
- ✅ Ship-to per order: `SalesOrder.ShippingAddressId → CustomerAddress` — exists.
- ✅ Ship-to per shipment: `Shipment.ShippingAddressId → CustomerAddress` — exists.
- ✅ Exemption cert number: `Customer.TaxExemptionId` (varchar 50) — exists.
- ✅ Customer exempt flag: `Customer.IsTaxExempt` (bool, indexed) — exists.
- ❌ **Per-line taxability code**: no `TaxCode`/`IsTaxable` flag on `InvoiceLine` or `SalesOrderLine` — cannot distinguish taxable from non-taxable line items for AST submission.
- ❌ **Cert expiry date**: not stored — no `ExemptionExpiryDate` on `Customer`; no expiry-check or alert logic anywhere in the repo.
**Expected**: QBO AST requires per-line TAX/NON-TAX designation and current exemption validity to compute correctly. Without per-line taxability, QBO AST will default-tax all lines including exempt items. Without cert expiry, expired exemptions silently continue, exposing the shop to incorrect tax collection and potential liability.
**Impact**: Any mixed-taxable invoice (taxable + non-taxable lines) or exempt-customer order will compute incorrect AST in QBO even after F-031 is resolved. MAJOR (not BLOCKER) because it becomes material only after the F-031 fix enables integrated tax; the schema gap must be closed as a prerequisite to that fix.
**Recommendation**: (1) Add `tax_code` column to `invoice_lines` and `sales_order_lines` (enum or varchar; default `TAX`; propagate from part master if present). (2) Add `exemption_expiry_date` (`date`, nullable) to `customers` table. (3) Add an expiry-alert mechanism (background job or UI indicator for expiring/expired certs). Eng-lead: two migration changes + a background-check task.
**Evidence**: Entity and migration inspection 2026-05-20; `forge.core/Entities/InvoiceLine.cs`, `SalesOrderLine.cs`, `Customer.cs`; migration `20260425161741_Add_TaxExempt_And_InvoiceCustomerPO.cs`.
**Status log**:
  - `2026-05-20` `[BA]` opened — schema gaps confirmed against live migration snapshot. Prerequisite for F-031 fix.

### F-033 [ENG] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Spine state-machine · Four spine transition handlers use blacklists instead of whitelists — invalid source states silently accepted

**Where** (all verified against live code 2026-05-20):
- `forge.api/Features/SalesOrders/CancelSalesOrder.cs:17` — blacklist `Shipped|Completed`
- `forge.api/Features/Invoices/VoidInvoice.cs:16-18` — no source-state check at all
- `forge.api/Features/PurchaseOrders/CancelPurchaseOrder.cs:17` — blacklist `Received|Closed`
- `forge.api/Features/PurchaseOrders/ReceiveItems.cs:30` — blacklist `Closed|Cancelled`

**Observed**: None of the four handlers checks the entity is in an **expected source state** before applying the transition — they only block a subset of "obviously wrong" states. `InvalidOperationException` does surface as **409 Conflict** via `ExceptionHandlingMiddleware:94` (confirmed) — so the gap is not in the HTTP status, it is in the set of states that reach the guard.

Specific violations per handler:

| Handler | Missing guard | Consequence |
|---------|--------------|-------------|
| `CancelSalesOrder` | `PartiallyShipped` not blocked | Cancels an order that already has committed shipment lines; `ShippedQuantity` orphaned |
| `CancelSalesOrder` | `Cancelled` not blocked | Re-cancel of an already-cancelled order → silent no-op, returns 200 |
| `VoidInvoice` | No source-state check | Can void a `Draft` invoice (should be deleted, not voided); can re-void a `Voided` invoice → 200 |
| `CancelPurchaseOrder` | `PartiallyReceived` not blocked | Cancels a PO that has committed receiving records in stock — inventory orphaned |
| `ReceiveItems` | `Draft` (and `Submitted` if you take a strict reading) not validated via whitelist | Can receive items against a Draft PO that was never approved/submitted |

`ConfirmSalesOrder`, `SubmitPurchaseOrder`, `ClosePurchaseOrder`, `AcknowledgePurchaseOrder`, `SendInvoice`, `ShipShipment`, `DeliverShipment`, and all pick-wave/inter-plant handlers **pass** — they use explicit whitelist guards.

**Expected**: Every spine transition guard is a **whitelist** (`if (entity.Status != ExpectedSource) throw new InvalidOperationException(...)`) so any unexpected source state → 409. The eng-lead's ruling: never a silent no-op-then-200. This makes INV-SO2 verifiable.

**Impact**: Low frequency under normal flow; high consequence when concurrent or mis-sequenced requests occur (e.g., two concurrent cancel requests both pass the Cancelled guard and both succeed — the second is a duplicate write). The `PartiallyShipped` cancel and `PartiallyReceived` cancel cases are the highest-risk: they orphan committed fulfillment data. The `VoidInvoice` / re-void case is lower risk (idempotent write) but a correctness violation.

**Recommendation (Wave-1 scope)**: Replace blacklists with whitelists on the four failing handlers. Specific target source-state sets:
- `CancelSalesOrder`: allow only `Draft | Confirmed | PartiallyShipped` (not already-Cancelled; not Shipped/Completed)
- `VoidInvoice`: allow only `Sent | PartiallyPaid | Overdue` (invoices with a payment guard already exist; add state guard before it)
- `CancelPurchaseOrder`: allow only `Draft | Submitted | Acknowledged` (not PartiallyReceived/Received/Closed)
- `ReceiveItems`: allow only `Submitted | Acknowledged | PartiallyReceived`

Each fix is a 1–2 line whitelist check; group as one Wave-1 PR. DoD = INV-SO2 + QA probe against cancel-on-partially-shipped, void-on-draft, receive-on-draft.

**Evidence**: code refs above; eng-lead Wave-1 state-machine ruling; `ExceptionHandlingMiddleware.cs:94-109` (409 mapping confirmed).
**Status log**:
  - `2026-05-20` `[ENG]` opened — **confirmed in live code**, Wave-1 queue. **Not a blocker under current single-user demo env** (concurrency needed to hit the race); escalates to BLOCKER under concurrent load or adversarial sequencing. Held — no merge — pending ShippedQuantity fix + BE-2 design landing.

### F-034 [BA] [GAP] [MAJOR] [P2] [PRIMARY] [func · data] · SO/PO status enum · `Short-Closed` terminal-remainder state absent — cancel-remainder compensation requires enum migration on both entities
**Where**: `forge.core/Enums/SalesOrderStatus.cs` (7 values: `Draft, Confirmed, InProduction, PartiallyShipped, Shipped, Completed, Cancelled`); `forge.core/Enums/PurchaseOrderStatus.cs` (7 values: `Draft, Submitted, Acknowledged, PartiallyReceived, Received, Closed, Cancelled`). No variant of `ShortClosed`, `PartialCancel`, `PartialClose`, or `RemainderCancelled` exists anywhere in the codebase (grep confirmed zero matches).
**Observed**: Both enums have only one terminal exit from the partially-fulfilled states: `Cancelled`. Domain specialist matrix requires a distinct `Short-Closed` terminal — "shipped/received facts are permanent; only the unshipped/unreceived remainder is voided" — which is semantically incompatible with `Cancelled` ("nothing moved"). The F-033 blacklist finding makes this worse: `CancelSalesOrder` does not block `PartiallyShipped` as a source state, so today a partially-shipped SO can be cancelled and it silently lands in `Cancelled`, misrepresenting the transaction in every downstream report and reorder signal.
**Expected**: `Short-Closed` (or exact equivalent) as an explicit enum value on both `SalesOrderStatus` and `PurchaseOrderStatus`. Domain specialist cascade rules: SO Short-Close → hold/cancel unstarted WO operations, do not touch issued material; PO Short-Close → do not touch already-received stock. These are the acceptance criteria for the cancel-remainder compensation work (`[ENG]` Wave-1).
**Impact**: Without the enum value, the compensation work cannot be implemented correctly — any implementation today would land in `Cancelled`, corrupting fulfillment reporting (Short-Closed orders are closed-but-revenue-bearing, should appear in margin/revenue reports alongside `Completed`, not alongside voided orders) and reorder logic (a Short-Closed PO line should trigger a re-buy signal; a Cancelled one should not). MAJOR rather than BLOCKER because the app doesn't crash — it silently mislabels the transaction.
**Recommendation**: (1) Add `ShortClosed` to both enums. (2) Add the corresponding migration (column-type alteration on `sales_orders.status` and `purchase_orders.status`). (3) Update any handler, report filter, or UI status group that treats `Cancelled` as the sole terminal to also handle `ShortClosed` — particularly A/R aging (Short-Closed = revenue closed, not voided) and MRP reorder signals. Eng-lead: prerequisite migration before cancel-remainder handler can be built. See F-033 (`CancelSalesOrder` blacklist fix should add `PartiallyShipped → ShortClosed` as the correct transition, not `Cancelled`).
**Evidence**: `SalesOrderStatus.cs`, `PurchaseOrderStatus.cs` (both read 2026-05-20); grep across full repo for any ShortClosed/ShortClose/PartialCancel variant — zero hits; domain specialist cancel-remainder matrix ruling.
**Status log**:
  - `2026-05-20` `[BA]` opened — enum gap confirmed; migration required before `[ENG]` can implement cancel-remainder compensation.

### F-035 [BA] [BUG+GAP] [MAJOR] [P1] [PRIMARY] [func · data] · Payment / A/R · 8 seeded invoices carry negative A/R balances (INV-AR1 FAILS) — seed-authoring error reveals absent credit-memo model and guard blindspot
**Where**: `payment_applications` table (seeded data, customers 1/3/7/8, 8 invoices); `forge.api/Features/Payments/CreatePayment.cs:64-92` (application guard); no `credit_memos` table anywhere in the schema (grep for `credit_memo`, `credit_note`, `CreditMemo`, `CreditNote`, `Overpayment` — zero matches in all `.cs` files and all migration files).
**Observed**: Automation-engineer-1's live INV-AR1 probe reports `payment_applications.amount` exceeds `invoice_total` on 8 invoices across 4 customers, producing net A/R of approximately −$4,362.

**Classification — dual root cause:**

1. **Seed-authoring error (primary cause of the negative balances).** `CreatePayment.cs:74` has an explicit over-application guard: `if (app.Amount > balanceDue) throw new InvalidOperationException(...)`. The seeded `payment_applications` rows were almost certainly inserted directly into the DB by the seeder script, bypassing the handler entirely — which is why the guard didn't fire. This makes the 8 negative invoices invalid seed rows, not evidence of a live product defect in the payment path.

2. **Product GAP — no credit-memo / overpayment model (independent of seed error).** Even if a customer legitimately overpays (e.g., rounds up, sends a check larger than the invoice), there is no `CreditMemo` or `CustomerCredit` entity to hold the excess. The data model has nowhere to land an overpayment other than leaving `payment_applications.amount > invoice.total`, which violates INV-AR1. This gap is real and pre-dates the seed: QBO supports credit memos as first-class entities; the app has no analog.

3. **Guard robustness concern (intersects F-026).** The guard at `CreatePayment.cs:71-72` re-derives `balanceDue` inline (the F-027 formula) and depends on `FindWithDetailsAsync` eagerly loading `PaymentApplications`. If that navigation property isn't loaded, `PaymentApplications.Sum()` returns 0 and the guard computes against the full invoice total — blind to prior partial payments. Under concurrent application (F-026 race), two concurrent posts both read the same pre-commit balance and both pass the guard. These are not new findings — see F-026 and F-027 — but they confirm the guard is not hermetic even in the live product path.

**Expected**: `Σ payment_applications.amount ≤ invoice.total` holds for every invoice (INV-AR1). Excess tender is modeled as a credit memo / customer credit on account, not as an over-application against the invoice.
**Impact**: The 8 negative invoices in the seeded instance **corrupt INV-AR1 validation** — every conservation-law test against the seeded data that touches A/R is invalidated until these rows are corrected. The credit-memo model gap means the app cannot correctly handle routine overpayment scenarios (customer writes a round-number check, small rounding differences, advance payments applied against a future invoice). The missing model also means the QBO sync has no credit-memo entity to push even if QBO supports one.
**Recommendation**: (1) **Immediate (data):** fix the 8 seeded `payment_applications` rows so `Σ applications ≤ invoice.total` — either reduce the application amounts to match invoices or adjust invoice totals to match intended test scenarios. Blocking INV-AR1 validation until resolved — this is a P0 data-quality action for `[DEVOPS]`/`[QA]`. (2) **Schema (GAP):** add a `customer_credits` (or `credit_memos`) entity to hold overpayment balances — amount, source payment, customer FK, applied/unapplied status. Route to eng-lead for sizing. (3) **Guard hardening:** ensure `FindWithDetailsAsync` eagerly loads `PaymentApplications` and confirm guard fires under the F-026 concurrency scenario — addressed in F-026 fix, but verify the eager-load as part of that PR.
**Evidence**: Automation-engineer-1 INV-AR1 probe result (8 invoices, ~−$4,362 net A/R, customers 1/3/7/8); `CreatePayment.cs:64-92`; grep for credit-memo entities — zero hits; F-026 (payment race), F-027 (formula divergence).
**Status log**:
  - `2026-05-20` `[BA]` opened — dual classification: seed-authoring error (primary) + product GAP (credit-memo model absent). INV-AR1 validation blocked until seed rows corrected; routing seed fix to `[DEVOPS]`/`[QA]` as immediate P0 data action. Credit-memo model gap is separate scope item for eng-lead.
  - `2026-05-21` `[ORCH]` **scope update** — credit-memo MVP explicitly includes a **minimal FE create/apply surface** per `[ORCH]` scope call 2026-05-21. This is binding: the credit-memo model GAP requires both BE schema (existing) and FE create/apply UI for MVP. Eng-lead + FE to size accordingly.

### F-036 [BA] [BUG] [BLOCKER] [P0] [PRIMARY] [data] · Seed integrity · Demo seed is transactionally populated but engineeringly hollow — four failure modes block Golden Thread validation
**Where**: `payment_applications`, `sales_order_lines`, `parts`, `bomentries`, `cost_calculations`, `jobs` tables; live DB probed 2026-05-20 via direct SQL against Docker `forge` container (postgres:5432).
**Observed**: Four distinct coherence failures confirmed by live probe:

1. **`shipped_quantity = 0` on all 21 SO lines despite 15 delivered shipments (status=4).** `shipment_lines` carry correct quantities matching ordered amounts, but `sales_order_lines.shipped_quantity` is zero across the board. Seeder inserted shipment records directly into the DB without invoking `CreateShipment` — same handler-bypass pattern as the payment_applications. Consequence: INV-SH1 (`shipped ≤ ordered`) and INV-IN1 (`invoiced ≤ shipped`) cannot be validly tested; SO statuses are wrong (should be Shipped for most); F-020 (ShippedQuantity double-count) is not manifested because the handler was never called. `shipment_lines.inventory_relieved_at = NULL` on all 20 rows (confirming F-030 is structural, not seed-only).

2. **3 invoices with negative A/R balances (INV-AR1 FAILS).** Live recompute: INV-2251 (−$103.13, customer 7), INV-2331 (−$91.50, customer 7), INV-2421B (−$0.90, customer 8). Discrepancy vs automation-engineer-1's reported count of 8 — `[DEVOPS]`/`[QA]` should reconcile (seed may have been partially updated, or methodology differs). All 3 confirmed are seed-authoring errors; see F-035.

3. **Zero part cost data — all margin, COGS, and estimating tests invalid.** All 12 parts: `manual_cost_override = NULL`, `current_cost_calculation_id = NULL`. `cost_calculations` = 0 rows, `bomentries` = 0 rows, `bom_revisions` = 0 rows, `part_prices` = 0 rows. No part has a cost or BOM. Every job cost, margin, COGS, and estimating-engine test result will be meaningless zeroes.

4. **All 58 jobs have `sales_order_line_id = NULL`.** No job-to-order traceability in the seed. Job-cost rollup against SO, estimated-vs-actual margin, per-order COGS — all untraceable.

**What passed:** Quote→SO price lock ✅ (6/6 pairs LOCKED at matching unit prices and quantities); on_hand non-negative ✅ (all 12 parts have positive bin_content quantities); FK orphan checks ✅ (zero orphaned invoices, payments, shipments, customers).
**Expected**: A coherent demo seed: parts with costs + BOMs, quotes with prices derived from cost, SOs linked to jobs, shipments updating SO shipped_quantity via the real handler, invoices with matching totals, payments within invoice balances.
**Impact**: Golden Thread (C1→C10) is blocked — INV-SH1/IN1 probes run against a corrupted shipped baseline; margin/cost calculations run against null costs; job→order traceability is absent. Any QA test result touching shipped quantities, job costs, or order linkage is unreliable on this seed. P0 because it gates the entire QA validation pass.
**Recommendation** (`[DEVOPS]` seed repair): (1) Fix 3 negative payment_application rows. (2) Populate `sales_order_lines.shipped_quantity` to match shipment_lines quantities — or re-run shipment creation through the actual handler. (3) Add `manual_cost_override` to shipped parts; add at least one BOM per finished-goods part. (4) Link seeded jobs to SO lines via `sales_order_line_id`. (5) Reconcile 8-vs-3 negative invoice count with automation-engineer-1.
**Evidence**: Direct SQL probes 2026-05-20: `shipped_quantity` sum = 0 across 22 SO lines; `cost_calculations` count = 0; `bomentries` count = 0; jobs with SOL link = 0/58; negative balance invoices = 3 confirmed; positive baseline probes per table above.
**Status log**:
  - `2026-05-20` `[BA]` opened — coherence pass complete; **Golden Thread blocked until seed repair**. Routing to `[DEVOPS]` for fix list; `[QA]` to re-run INV-AR1/SH1/IN1 probes post-repair before GT run.

---

### F-050 [QA] [BUG] [BLOCKER] [P0] [PRIMARY] [func · data] · Invoice / Payment · `CreatePayment` promotes invoice to `Paid` on ANY payment receipt — not full settlement

**Where**: `forge.api/Features/Payments/CreatePayment.cs` — invoice status update logic after payment application; `invoices.status` column.

**Observed**: `[ORCH]` ruling 2026-05-21 — the `CreatePayment` handler sets `invoice.Status = Paid` as soon as any payment is received against an invoice, regardless of whether the payment fully settles the balance. Confirmed against 5 live invoices in the seeded instance that carry `status=Paid` with a positive outstanding balance:

| Invoice | Total | Σ Payments | Outstanding |
|---------|-------|------------|-------------|
| INV-2341AP | $26,116.02 | $25,618.80 | **$497.22** |
| INV-2321A | $6,568.32 | $6,484.18 | **$84.14** |
| INV-2221AP | $7,871.85 | $7,723.60 | **$148.25** |
| + 2 sub-dollar | — | — | < $1.00 each |

The outstanding balances on INV-2341AP, INV-2321A, INV-2221AP align with the unpaid tax portion — consistent with the payment having been applied against the pre-tax subtotal and the handler firing `Paid` at that point. This is the root cause behind the F-045 observation (which correctly identified 3 invoices but attributed the trigger to seed-data subtotal vs. total mismatch rather than a code path defect).

**Relationship to prior findings:**
- **Supersedes F-045** in root-cause fidelity — F-045 is the observation; F-050 is the confirmed defect. F-045 remains open as the data-state record; F-050 is the code fix target.
- **Resolves the F-003 investigation** — F-003 ("$0 revenue / 0% margin contradiction") was a misdiagnosis; the real pathology in the payment-status chain is this handler. F-003 closed as resolved-as-misdiagnosed per `[ORCH]` ruling.
- **Intersects F-027** (parallel balance formulas) — the handler likely compares against a re-derived balance rather than `invoice.BalanceDue`; the fix must use the canonical `BalanceDue` property (which includes tax via `Invoice.cs`'s computed `Total`).

**Expected**: `invoice.Status = Paid` iff `Σ(payment_applications.amount) ≥ invoice.Total` (within a tolerance, e.g., $0.05 for floating-point rounding). Otherwise `PartiallyPaid`. The canonical total must be `invoice.Total` (tax-inclusive), not `invoice.Subtotal`.

**Impact**: Five invoices show `Paid` in the UI and A/R reports while carrying open A/R. Revenue is understated in any "paid" invoice roll-up. A/R aging excludes balances on "Paid" invoices. QBO sync (when enabled) would push incorrect payment-status to the ledger. **BLOCKER** because it directly corrupts A/R on the PRIMARY spine; affects revenue recognition and customer collection workflows.

**Recommendation**:
1. Fix the `Paid` guard in `CreatePayment` to evaluate `invoice.Total` (tax-inclusive) rather than `Subtotal` or inline re-derivation. Consume `invoice.BalanceDue` as F-027 recommends.
2. Correct the 5 affected invoices' status to `PartiallyPaid` (data repair — `[DEVOPS]` action).
3. Add a regression probe: after applying a partial payment, assert `invoice.Status == PartiallyPaid` and after applying the remainder assert `invoice.Status == Paid`.

**Depends on / coordinates with**: F-027 (consume `invoice.BalanceDue`); F-026 (concurrency guard — row lock must protect the balance re-read that drives this status decision).

**Evidence**: `[ORCH]` ruling 2026-05-21 with 5 affected invoice IDs; SQL INV-AR1 probe 2026-05-21 (F-045 correlated-subquery result — 3 non-trivial + 2 sub-dollar); live API `GET /api/v1/invoices/{id}` showing `amountPaid < total, status=Paid` for INV-2341AP, INV-2321A, INV-2221AP.

**Status log**:
  - `2026-05-21` `[QA]` opened — BLOCKER, P0. Root cause of F-003 (resolved-as-misdiagnosed) and confirmed root behind F-045 observation. Routed to backend-engineer's queue per `[ORCH]`. 5 live invoices affected; data repair required alongside code fix.
  - `2026-05-21` `[QA]` **REVISED — reclassified as seed-corruption, not a live code defect.** GT live handler test contradicts the code-defect framing: `POST /api/v1/payments` with $100 partial against INV-2401 correctly stayed `PartiallyPaid` — `CreatePayment.cs` logic is correct. The 5 Paid-with-balance invoices were inserted directly by the seeder bypassing the handler. **Closing as `dup-of-F-045` (seed-corruption track).** Severity downgraded from BLOCKER to data-quality P0 (`[DEVOPS]`). Data repair actions remain binding: (1) reopen INV-2341AP/INV-2321A/INV-2221AP to `PartiallyPaid`; (2) write-off INV-2211A ($2.24) and INV-2261 ($0.50) via BE-4 write-off mechanism once built. See H-012 for authoritative 8-invoice reconciliation.

---

### F-051 [QA] [BUG] [BLOCKER] [P0] [PRIMARY] [func] · Auth · No account lockout — unlimited password/PIN brute-force
> **Canonical redirect stub.** Full finding body is at **F-034[SEC]** (filed 2026-05-21 by `[SEC]`). Renumbered to F-051 per H-013 collision ruling: `[BA]` filed F-034 first (2026-05-20); `[SEC]`'s entry moves here to avoid collision.
> **Summary**: `Login.cs` and `KioskLogin.cs` never call `userManager.AccessFailedAsync()` on failure — ASP.NET Identity lockout is permanently bypassed. Confirmed live: 6 wrong-password attempts → `access_failed_count=0`. Combined with `ASPNETCORE_ENVIRONMENT=Development` disabling rate limiter, zero credential-attack defense. **BLOCKER for a financial ERP.**
**Status log**:
  - `2026-05-21` `[QA]` redirect stub created per H-013 — canonical ID for F-034[SEC]. All future status updates should be appended here.
  - `2026-05-21` `[SEC]` map **CONFIRMED** — `[BA]` is first-filer on F-034 (2026-05-20); F-051 is the correct canonical ID. Severity unchanged: BLOCKER/P0. Fix IMPLEMENTED (`Login.cs` → `SignInManager.CheckPasswordSignInAsync(lockoutOnFailure:true)`; `KioskLogin.cs` → `IsLockedOutAsync`+`AccessFailedAsync`+`ResetAccessFailedCountAsync`). LoginHandler lockout regression GREEN (9/9). Remaining: KioskLoginHandlerTests cases, live 6-attempt regression, backend review. Rollback snapshot `forge-pre-auth-hardening-20260521T015304Z.dump`. Fix-queue + DoD: H-015.
  - `2026-05-21` `[SEC]` **kiosk unit DoD met.** Added 3 KioskLoginHandlerTests lockout cases (locked-out → reject + no counter advance; wrong PIN → `AccessFailedAsync` once; correct PIN → `ResetAccessFailedCountAsync` once). Full Auth suite GREEN **87/87** (incl. 9 Login + 6 Kiosk). Note: the F-052 hashing fix surfaced+fixed a real regression in `ValidateSetupTokenHandlerTests` (it stored plaintext tokens; now stores the hash) — confirms the F-052 hash path is exercised. Remaining for F-051: live 6-attempt DB regression + backend review.

---

### F-052 [QA] [BUG] [MAJOR] [P1] [SECONDARY] [data] · Auth · User invitation tokens stored in plaintext
> **Canonical redirect stub.** Full finding body is at **F-035[SEC]** (filed 2026-05-21 by `[SEC]`). Renumbered to F-052 per H-013 collision ruling: `[BA]` filed F-035 first (2026-05-20); `[SEC]`'s entry moves here.
> **Summary**: 8-char setup tokens written verbatim to `setup_token` column. Any DB read exposure reveals pending enrollment tokens. Portal magic links ARE hashed (SHA-256); setup tokens must follow the same pattern.
**Status log**:
  - `2026-05-21` `[QA]` redirect stub created per H-013 — canonical ID for F-035[SEC]. All future status updates should be appended here.
  - `2026-05-21` `[SEC]` map **CONFIRMED** — F-052 is the correct canonical ID for F-035[SEC]. Severity unchanged: MAJOR/P1. Fix IMPLEMENTED (SHA-256 `HashSetupToken` on write in `CreateAdminUser.cs`; hash-compare on read in `ValidateSetupToken.cs` + `CompleteSetup.cs`). Remaining: create→validate→complete round-trip test, backend review. Fix-queue + DoD: H-015.

---

### F-053 [QA] [BUG] [MAJOR] [P1] [PRIMARY] [data] · Auth · Hardcoded JWT fallback key in source
> **Canonical redirect stub.** Full finding body is at **F-036[SEC]** (filed 2026-05-21 by `[SEC]`). Renumbered to F-053 per H-013 collision ruling: `[BA]` filed F-036 first (2026-05-20); `[SEC]`'s entry moves here.
> **Summary**: `Program.cs:125` — `builder.Configuration["Jwt:Key"] ?? "dev-secret-key-change-in-production-min-32-chars!!"`. Any deployment without `.env` uses a publicly-known key from the repo. Current instance is safe (`.env` key set); risk activates on any fresh clone, CI, or staging environment that omits `.env`.
**Status log**:
  - `2026-05-21` `[QA]` redirect stub created per H-013 — canonical ID for F-036[SEC]. All future status updates should be appended here.
  - `2026-05-21` `[SEC]` map **CONFIRMED** — F-053 is the correct canonical ID for F-036[SEC]. Severity unchanged: MAJOR/P1. Fix IMPLEMENTED (`Program.cs` fallback `?? "dev-secret..."` → fail-fast `throw new InvalidOperationException`). Remaining: startup key-length≥32 assertion, backend review. Fix-queue + DoD: H-015.
  - `2026-05-21` `[SEC]` **JWT_KEY rotation ruling per `[ORCH]`: ROTATE.** The live signing key was reproduced into AUDIT.md (committed register) + agent transcripts + the shared `.env` across a multi-agent engagement → treat as compromised. Rotation is near-free: replace `JWT_KEY` in `.env` and restart the API (the in-memory `SessionStore` is wiped on restart regardless, so the only cost is a forced re-login). Tracked as an F-053 remediation subtask alongside the fail-fast throw + key-length assertion. Skip ONLY if this instance is provably disposable with zero promotion path to any shared/customer/prod environment.

---

## 5. Themes & rollups (write at end of audit)

_(emerging patterns — fill in once enough findings accumulate; e.g., "loading-state inconsistency across 12 features", "no empty-state for 8 list pages", "section-titles use 3 different sizes")_

---

## 6. Known coverage holes (accepted, sequenced — surface at go/no-go)

> Deliberate, `[ORCH]`-approved gaps in test coverage. **Not** undiscovered risk — known risk we chose to sequence. Must be visible in the ship decision.

| Hole | Invariants not validated | Why deferred | Closes when | Owner |
|------|--------------------------|--------------|-------------|-------|
| **Real-QBO cent-parity** | INV-IN4 (rounding↔QBO), INV-QBO3 (amount parity), INV-QBO1 (retry-idempotency against real QBO) | `MOCK_INTEGRATIONS=true`; mock proves seam mechanics but not arithmetic/idempotency vs a real QBO ledger. Wiring a live QB sandbox is a deliberate integration exercise. | Scheduled real-QB-sandbox hardening milestone | `[ORCH]`/`[DEVOPS]` |

_See F-021 — the QBO seam already has verified structural defects (real Invoice/Payment never sync); this hole is specifically the **cent-parity/idempotency-on-retry** layer that only a real QBO can confirm._

---

## 8. BE-2 Design Proposal — QBO outbox/UoW hardening (`[ENG]` 2026-05-20)

> Design proposal for `[ENG-lead]` review + `[ORCH]` decision gate. Covers the foundational outbox/concurrency scope (BE-2) plus the tax payload contract that rides on it (BE-3). No code changed yet — proposal only, as directed.

### Current state (one-sentence per defect)

The live QBO path rides `SyncQueue` (no idempotency key, no unique index, no `SKIP LOCKED`, no backoff, silent stranding) while `IntegrationOutbox` (the newer entity with those features) has a `throw NotImplementedException` for `QuickBooks`; documents are posted at `$0` via a kanban stage-move rather than from the real `Invoice`/`Payment` entity; and no payment ever reaches QBO. All five blocker-class defects in F-021 live in this path.

---

### Decision 0: canonical queue (binding call requested from `[ENG-lead]` / `[ORCH]`)

**Recommendation: consolidate onto `IntegrationOutbox`; retire `SyncQueue`.**

| | `IntegrationOutbox` | `SyncQueue` |
|---|---|---|
| Idempotency field | ✓ `IdempotencyKey` (string, existing) | ✗ none |
| Backoff schedule | ✓ `BackoffSchedule[]` in dispatcher | ✗ immediate re-`Pending` |
| Dead-letter | ✓ `DeadLetter` status + `MaxAttempts` | ✗ manual `Failed` (never surfaced) |
| Lease/in-flight | ✓ `InFlight` status + `LastAttemptAt` | `Processing` (strands forever on crash) |
| `FOR UPDATE SKIP LOCKED` | needs to be added on the read path | same gap |
| QBO dispatch branch | `throw NotImplementedException` ← just wire this | full re-impl required |

The migration path is: (a) add a QBO branch to `IntegrationOutboxDispatcherJob.DispatchAsync`, (b) replace `ISyncQueueRepository.EnqueueAsync` call sites with `IIntegrationOutboxService.EnqueueAsync`, (c) retire `SyncQueueEntry`/`SyncQueueRepository`/`SyncQueueProcessorJob` once all call sites migrate. The `NotImplementedException` comment in the dispatcher already names this refactor: *"Refactor the provider's call sites to use IIntegrationOutboxService and add a dispatch branch here."*

---

### BE-2a — foundation: idempotency + concurrency safety (no QBO `requestid` yet, that's 2b)

**Scope:** the `IntegrationOutbox` queue mechanics. No new entities; only schema and dispatcher changes.

**Schema changes required:**

1. **`SKIP LOCKED` on the read path.** `IntegrationOutboxDispatcherJob.DispatchPendingAsync` does a plain `SELECT … TAKE 25` with no lock. With >1 API replica, the same batch is picked twice → double-dispatch. Add a `SELECT … FOR UPDATE SKIP LOCKED` via raw SQL or EF's `FromSqlRaw`. (EF InMemory provider ignores this at test time; Postgres enforces it.)

2. **Unique index on `IdempotencyKey`.** Prevents duplicate enqueue at the DB level if the caller is invoked twice before the first entry is processed.
   **[REVISED 2026-05-21, eng-lead — supersedes the partial-index spec below]** The originally-specified partial index `… (provider, idempotency_key) WHERE status <> 'DeadLetter'` is **withdrawn**. Two reasons, both code-verified: (a) `IdempotencyKey = SHA256("{provider}:{operationKey}")` already embeds the provider, so a plain full-unique index on `IdempotencyKey` is functionally equivalent to `(provider, idempotency_key)` — the separate-column scoping was redundant. (b) The `WHERE status <> 'DeadLetter'` clause solved a problem this codebase doesn't have: recovery is **resurrect-the-same-row** (the enqueue path returns the existing row rather than inserting; the dispatcher scans only `Pending`/`Failed`), so a dead-lettered op is retried by flipping its status in place, never by inserting a second row. A partial index would permit two rows per logical op and create authoritative-row ambiguity. **Backend's existing full-unique index on `IdempotencyKey` is correct as-is.** The real corrective is in the honest-gaps section below (enqueue check-then-insert race).

3. **`ExternalId` column on `IntegrationOutboxEntry` (nullable string).** Written by the dispatcher BEFORE marking `Sent`. The dispatcher writes `entry.ExternalId = qboResponseId; db.SaveChanges(); entry.Status = Sent; db.SaveChanges()`. If the second save fails, the retry finds `ExternalId` already set, calls `Update` (not `Create`) → no double-post. This is the claim-check pattern that replaces the current `job.ExternalRef` single-slot overwrite.

4. **Visibility timeout / lease guard.** Entries flipped to `InFlight` must have a `LeaseExpiresAt = clock.UtcNow + 5min`. The `DispatchPendingAsync` read query adds `|| (e.Status == InFlight && e.LeaseExpiresAt < now)` so crashed-mid-dispatch entries re-enter the queue automatically rather than stranding.

**No change to `IIntegrationOutboxService` interface** — the `IIntegrationOutboxService` already exists (per the dispatcher comment); the implementation just needs to set `IdempotencyKey` deterministically before insert.

#### BE-2a implementation status + UoW-atomicity answer (`[ENG]` 2026-05-21, code-complete — at eng-lead review gate, NOT merged)

Code-complete in working tree; 28/28 affected handler+dispatcher tests green; `forge.api` builds 0/0. Resolves the line-851 open question: **clean cut** taken — `SyncQueueEntry`/`Repository`/`Configuration`/`ProcessorJob`/`ISyncQueueRepository` deleted, the `sync-queue-processor` Hangfire recurring job (`Program.cs:1533`) + DI + dispatch-table entry removed (not commented), 5 call sites rerouted to `IIntegrationOutboxService` (Parts Create/Update, Expense, TimeEntry, Job).

**UoW-atomicity answer (how exactly-once *effect* is achieved despite at-least-once *delivery*):**
1. **Atomic batch claim.** `SELECT id … FOR UPDATE SKIP LOCKED` runs inside a transaction; claimed ids are flipped `Pending/Failed → InFlight` with `LeaseExpiresAt = now+5min` and `AttemptCount++` via one `ExecuteUpdate`, committed before locks release. Two replicas can never claim the same row. (Postgres path keyed off `ProviderName.StartsWith("Npgsql")`; InMemory test path uses a plain ordered take — `IsInMemory()` needs the InMemory package which `forge.api` doesn't reference.)
2. **Dispatch runs outside the claim transaction** — a slow QBO call never holds row locks.
3. **Claim-check seam = effective idempotency.** The QBO branch sets `entry.ExternalId = qboId` and persists it (the same `SaveChanges` that writes the local entity's `ExternalId`/`Provider`), THEN a *separate* `SaveChanges` writes `Status=Sent`. A crash between those two saves leaves `ExternalId` populated; on lease expiry the entry re-enters the queue and the dispatcher short-circuits (`if entry.ExternalId is not null → skip re-post`). At-least-once delivery → effectively-once side effects.
4. **Lease recovery.** Top of each run flips `InFlight && LeaseExpiresAt <= now → Pending` so a crashed dispatcher strands nothing.

**Honest gaps vs. the design above (for resume):**
- **Partial-index gap WITHDRAWN, not deferred (`[ENG-LEAD]` 2026-05-21).** Earlier this was logged as a gap needing a partial-index migration. On code review the full-unique index is *correct* — provider is embedded in the hashed key, and recovery is resurrect-same-row, so the partial clause would be wrong (see revised item 2 above). No migration needed. **The actual binding BE-2a corrective is here instead:** the enqueue is a **check-then-insert race** — `IntegrationOutboxService` does `FirstOrDefault(e => IdempotencyKey == key)` then inserts if null. Under concurrency (e.g. two `moveJobStage` calls for the same job+target, or any double-fired trigger) both callers can pass the `FirstOrDefault` check and both attempt insert; the unique index then throws a constraint violation on the second. **That violation MUST be caught and treated as "already enqueued" (return the existing entry), NOT bubbled as an error.** The unique index is the authoritative guard; the app-level check is only a fast-path optimization. This graceful unique-violation handling + a concurrency test asserting "two concurrent enqueues of the same key → exactly one row, no error surfaced" is the **binding BE-2a acceptance criterion** — it is what makes the "two concurrent triggers → exactly one QBO doc" guarantee actually hold. Hand to backend at BE-2a pickup.
- **Migration entanglement (shared dirty tree).** The `external_id` + `lease_expires_at` columns were swept into another agent's uncommitted `20260521014409_F032_TaxCodePerLine_BE1_ShipmentReliefIdempotency` migration (a prior `migrations add` captured all pending model changes). My `20260521015832_BE2a_OutboxLease_DropSyncQueue` migration carries only `DROP TABLE sync_queue_entries`. The schema delta is therefore split across two migrations and `AppDbContextModelSnapshot.cs` reflects both — **BE-2a cannot be committed cleanly at the migration layer without coordinating with the F-032/BE-1 owner.** Flagged to `[ORCH]`.

---

### BE-2b — correct document: real Invoice/Payment entity, per-entity `ExternalId`, lifecycle triggers

**Scope:** what gets enqueued and when. This is where the `$0 placeholder` and `payments-never-sync` bugs live.

**Changes required:**

1. **Stop posting from `MoveJobStage`.** Remove the `EnqueueAsync(Estimate|Invoice|PO)` calls from `MoveJobStage.cs`. Stage moves are UI-workflow events, not accounting events; they don't have the right data.

2. **Enqueue from entity lifecycle handlers.**
   - `CreateInvoiceHandler` (or a `InvoiceCreatedEvent` notification handler): enqueue `Invoice` sync using the real `Invoice.Total`, `Invoice.TaxAmount`, line details, and the SO-locked `UnitPrice`.
   - `CreatePaymentHandler` (or `PaymentCreatedEvent`): enqueue `Payment` sync with `Payment.Amount`, `Payment.InvoiceId`, and the invoice's QBO `ExternalId` as the link key.

3. **Per-entity `ExternalId` storage.** `Invoice.ExternalId` (already on the entity per audit) and a new `Payment.ExternalId` (verify it exists; add if not). The dispatcher writes these after a successful QBO create/update. The "before-commit" pattern: write `ExternalId` to the outbox entry's claim-check column first, then mark `Sent`.

4. **Guard: if `Invoice.ExternalId != null` → Update, not Create.** Before dispatching a QBO invoice create, the dispatcher reads `invoice.ExternalId`. Non-null → call `Update` instead. This is the idempotency-by-stored-id guard that the current `SyncQueue` path entirely lacks.

5. **Shipment-triggered invoicing** (coordinates with F-020 fix). The invoice-sync trigger should fire from `ShipShipment` / `InvoiceCreated`, not from a kanban stage move. This enforces `invoiced_qty ≤ shipped_qty` (INV-IN1) structurally rather than procedurally. **Dependency: F-020 must land first** so `ShippedQuantity` is accurate when invoice amounts are derived.

6. **QBO `requestid` idempotency token.** In `QuickBooksAccountingService.PostEntityAsync`, pass the outbox entry's `IdempotencyKey` as the QBO `requestid` query param. QBO deduplicates on this within a 24-hour window. This is the latent-mode guard (mock can't verify; real-sandbox milestone validates INV-QBO1 retry-idempotency).

---

### BE-3 — tax payload contract (rides on BE-2; tax ruling now settled)

**Ruling (per `[ORCH]`):** app stops authoring tax; sends ship-to + per-line `TaxCodeRef` + exempt flag; stores QBO's returned `TxnTaxDetail`; asserts cent-parity (INV-IN4, INV-QBO3 — deferred to real-sandbox milestone).

**Schema changes (minimal, additive):**

1. **`AccountingDocument` model gains tax-delegation fields:** `ShipToPostalCode: string?`, `ShipToState: string?`, `Lines[].TaxCodeRef: string?`, `Lines[].TaxExempt: bool`. No `TaxAmount` sent; QBO owns computation.

2. **`IntegrationOutboxEntry.ExternalTaxDetail: string? (JSON)`** — stores the raw `TxnTaxDetail` returned by QBO on the create/update response. This is the source of truth for `TaxAmount` on the QBO side and is needed for cent-parity assertions at the real-sandbox milestone.

3. **`Invoice.QboTaxDetail: string?`** — denormalized copy of `ExternalTaxDetail` on the invoice entity for display/reconciliation without re-querying QBO.

**Payload shape (per line):**
```json
{
  "TxnLineDetail": [
    { "ItemRef": "...", "Qty": 5, "UnitPrice": 10.00, "TaxCodeRef": "TAX", "TaxExempt": false }
  ],
  "ShipAddr": { "PostalCode": "90210", "CountrySubDivisionCode": "CA" }
}
```

**BE-3 does not expand BE-2a's foundational scope** (idempotency, lease, queue mechanics). BE-3 is purely a payload-shape change in `BuildDocumentPayload` + the two nullable columns above. It can land as a follow-on PR after BE-2b once the dispatcher branch is wired and the real Invoice entity is being sent.

---

### Wave sequencing (no-deviation proposal)

| Wave | Change | Depends on | DoD |
|------|--------|------------|-----|
| **Wave 0 (done)** | F-020 ShippedQuantity double-count | — | INV-SH1 ✓ green |
| **Wave 0 (pending)** | F-026 payment over-application race; F-027 divergent balance formula | — | INV-AR1 |
| **BE-2a** | Canonical queue: wire QBO branch in `IntegrationOutbox` dispatcher; `SKIP LOCKED`; unique idem-key index; `ExternalId` claim-check; lease/visibility timeout | Decision 0 binding call | Mock-seam probes P10 (queue-state DB); INV-QBO1 mock mechanics |
| **BE-2b** | Correct document: real Invoice/Payment lifecycle triggers; per-entity ExternalId; Update-not-Create guard; `requestid` token | F-020 (correct ShippedQuantity); BE-2a (outbox plumbing) | INV-IN1, INV-QBO2 mock; real-sandbox milestone for INV-QBO1 idempotency |
| **BE-3** | Tax delegation payload; `QboTaxDetail` column | BE-2b | INV-IN4, INV-QBO3 (real sandbox only) |

**Open question for `[ENG-lead]`:** Should `SyncQueueEntry` / `SyncQueueRepository` / `SyncQueueProcessorJob` be deleted in BE-2a (clean cut) or deprecated-and-guarded by a feature flag until BE-2b validates the new path end-to-end? Clean cut is lower maintenance debt; flag is safer rollback. Recommend clean cut given the verified-snapshot rollback strategy already in place.

---

### F-034 [SEC] [BUG] [BLOCKER] [P0] [PRIMARY] [func · data] · Auth · No account lockout — unlimited password/PIN brute-force

**Where**: `forge.api/Features/Auth/Login.cs:75-88` and `forge.api/Features/Auth/KioskLogin.cs:38-39`

**Observed**: The login handler calls `userManager.CheckPasswordAsync(user, request.Password)` but **never calls `userManager.AccessFailedAsync(user)`** on failure. The kiosk handler calls `SetPinHandler.VerifyPin()` but similarly has no lockout counter. Result confirmed live: 6 repeated wrong-password attempts against `bkelly@forge.local` left `access_failed_count = 0` in `asp_net_users`; no lockout triggered. ASP.NET Identity's built-in lockout mechanism (`LockoutEnabled=true` in DB) is permanently bypassed.

Additional exposure: `ASPNETCORE_ENVIRONMENT=Development` is set in `.env`, which disables `AddRateLimiter` entirely (Program.cs:920-921). In production, the rate limiter fires at 2000 req/min per IP — still permissive for credential stuffing against a financial system.

**Expected**: Identity's lockout pipeline must be invoked on every failed credential check. Standard remediation: replace the manual `CheckPasswordAsync` / `VerifyPin` pattern with `userManager.CheckPasswordAsync` wrapped in `AccessFailedAsync` → `IsLockedOutAsync` guards, or switch login to `SignInManager.PasswordSignInAsync` which handles lockout tracking automatically.

**Impact**: Any account — including Admin — is vulnerable to unlimited password brute-force and PIN brute-force from any accessible network. Combined with the rate limiter being off in Development (`ASPNETCORE_ENVIRONMENT=Development`), the dev/staging environment has literally zero credential-attack defense. A 4-digit PIN (10,000 combinations) can be exhausted in seconds. BLOCKER for a financial ERP.

**Recommendation**: Two-line fix at minimum — add `await userManager.AccessFailedAsync(user)` on password fail and `await userManager.AccessFailedAsync(user)` on PIN fail; add `await userManager.IsLockedOutAsync(user)` guard at handler entry. Stronger: switch to `SignInManager.PasswordSignInAsync`. Also add PIN attempt counter on the kiosk handler (no `userManager` equivalent for PINs — must track manually via a separate column or `AccessFailedCount`). QA probe: 6 wrong attempts → verify `access_failed_count = 5` and `lockout_end` is set on attempt 6.

**Evidence**: Live test 2026-05-21 — 6 failed attempts, DB shows `access_failed_count=0, lockout_end=NULL`; code confirms no `AccessFailedAsync` call in `Login.cs` or `KioskLogin.cs`.

**Status log**:
  - `2026-05-21` `[SEC]` opened — BLOCKER, P0. Auth gate for C0. Rated highest priority of this sweep.
  - `2026-05-21` `[QA]` **canonical ID reassigned → F-051** per H-013 collision ruling. `[BA]` is first-filer on F-034 (2026-05-20); this [SEC] entry moves to F-051. Full finding text at F-034[SEC] is the authoritative body; F-051 is the canonical redirect stub. See H-013.

---

### F-035 [SEC] [BUG] [MAJOR] [P1] [SECONDARY] [data] · Auth · User invitation tokens stored in plaintext

**Where**: `forge.data/Context/ApplicationUser.cs:18` (`SetupToken` column, text nullable)

**Observed**: The 8-char setup token sent to new employees via `POST /api/v1/admin/users/create` is stored verbatim in the `setup_token` column. Any DB read access (backup, SQL injection, insider threat) exposes all pending enrollment tokens. By contrast, portal magic links ARE hashed (SHA-256 of the token stored, token cleared on use — confirmed in `PortalAuthService.cs`).

**Expected**: Same pattern as magic links: store `SHA256(token)` in the DB, compare `SHA256(submitted_token)` on validation. Tokens must be one-time use (already enforced via `SetupTokenExpiresAt`).

**Impact**: DB breach → impersonation of any pending employee enrollment. Severity MAJOR (not BLOCKER) because tokens are short-lived (7 days) and required for a secondary flow (onboarding), not the primary spine. Escalates to BLOCKER for compliance-certified deployments.

**Recommendation**: In `CreateAdminUser.cs` line 82–87: store `Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))`. In `ValidateSetupToken.cs`: hash the submitted token before comparing. One PR, no migration needed (replace value on write, no schema change).

**Evidence**: `CreateAdminUser.cs:82-90`; `ApplicationUser.cs:18`; contrast with `PortalAuthService.cs:20-22` (hashed magic link pattern).

**Status log**:
  - `2026-05-21` `[SEC]` opened — MAJOR, P1. Not a spine blocker but must close before ship.
  - `2026-05-21` `[QA]` **canonical ID reassigned → F-052** per H-013 collision ruling. `[BA]` is first-filer on F-035 (2026-05-20); this [SEC] entry moves to F-052. Full finding text at F-035[SEC] is the authoritative body; F-052 is the canonical redirect stub. See H-013.

---

### F-036 [SEC] [BUG] [MAJOR] [P1] [PRIMARY] [data] · Auth · Hardcoded JWT fallback key in source

**Where**: `forge.api/Program.cs:125` (exact line may shift with edits)

**Observed**: Program.cs contains a fallback: `builder.Configuration["Jwt:Key"] ?? "dev-secret-key-change-in-production-min-32-chars!!"`. If `JWT_KEY` is absent from `.env` or environment, all JWTs are signed with a publicly-known key from the repository. The current `.env` sets `JWT_KEY=<redacted: see secrets vault>` (confirmed present, production-grade).

**Expected**: No fallback key in code. Startup must fail fast (`throw new InvalidOperationException("JWT_KEY environment variable is required")`) if the key is absent.

**Impact**: Any deployment without `.env` (fresh clone, misconfigured CI, or staging environment) uses the fallback — any attacker who reads the repo can forge valid JWTs for any user. Current production instance is safe because `.env` is set. Escalates to BLOCKER if `.env` is ever absent.

**Recommendation**: Replace the null-coalescing fallback with a mandatory read: `var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT_KEY is required");`. Add a startup health check that verifies key length ≥ 32.

**Evidence**: `Program.cs:125`; `.env:24` (confirms key is set in current instance).

**Status log**:
  - `2026-05-21` `[SEC]` opened — MAJOR, P1. Quick fix; no excuse not to ship with this hardened.
  - `2026-05-21` `[QA]` **canonical ID reassigned → F-053** per H-013 collision ruling. `[BA]` is first-filer on F-036 (2026-05-20); this [SEC] entry moves to F-053. Full finding text at F-036[SEC] is the authoritative body; F-053 is the canonical redirect stub. See H-013.

---

### F-037 [SEC] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Auth · Company-wide margin summary accessible to ProductionWorker

**Where**: `forge.api/Controllers/DashboardController.cs:12` (class-level `[Authorize]`, no role restriction) + `DashboardController.cs:30` (`GET /api/v1/dashboard/margin-summary`, no narrowing decorator)

**Observed (live, 2026-05-21)**: `GET /api/v1/dashboard/margin-summary` returns `{"totalRevenue":0,"totalCost":0.0,"totalMargin":0.0,"averageMarginPercentage":0,"jobCount":37}` to a `ProductionWorker` JWT. The zeros are a demo-data artifact (F-029: estimated costs never populated); the endpoint is live and will return real revenue/cost/margin figures in production. `DashboardController` carries only a bare class-level `[Authorize]` with no role list — every authenticated identity including the lowest-privilege kiosk role can reach this endpoint.

**Expected**: Company financial aggregates (total revenue, total cost, margin) are executive/management-tier data. `margin-summary` should require at minimum `[Authorize(Roles = "Admin,Manager,Controller,OfficeManager")]`.

**Impact**: Any ProductionWorker or kiosk employee can read the company's total margin figures at will. In a real deployment, this is a live revenue figure. MAJOR; this is a PRIMARY spine endpoint by classification (auth) and the exposure crosses a clear confidentiality boundary.

**Recommendation**: Add `[Authorize(Roles = "Admin,Manager,Controller,OfficeManager,PM")]` to the `GetMarginSummary` action. One-line fix.

**Evidence**: `DashboardController.cs:12,30`; live test 2026-05-21 — Worker JWT returns 200 with financial aggregates.

**Status log**:
  - `2026-05-21` `[SEC]` opened — MAJOR, P1. Live confirmed. Single-decorator fix.

---

### F-038 [SEC] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Auth · Job cost summary (quoted price, labor/material actuals, margin) accessible to ProductionWorker for all jobs

**Where**: `forge.api/Controllers/JobsController.cs:21,379` — class includes `ProductionWorker` in role list; `GET /api/v1/jobs/{id}/cost-summary` at line 379 has no narrowing `[Authorize]` decorator, inheriting worker access.

**Observed (live, 2026-05-21)**:
- `GET /api/v1/jobs/1/cost-summary` as `bkelly@forge.local` (ProductionWorker) → HTTP 200
- Response includes: `quotedPrice`, `materialEstimated`, `materialActual`, `laborEstimated`, `laborActual`, `burdenEstimated`, `subcontractEstimated`, `totalEstimated`, `totalActual`, `actualMargin`, `actualMarginPercent`
- Job 1 actual response: `actualMargin=-849991.5` — real non-zero P&L data
- Workers can access cost-summary for **any of the 57 seeded jobs**, not only jobs assigned to them — all 57 jobs are visible in `/jobs` list (intentional for kanban) and cost-summary carries no job-assignment filter

**Expected**: Job cost data (quoted price, material/labor actuals, margin) is job-costing information visible to engineers, managers, and admins — not production workers. The `cost-summary` sub-endpoint should require a narrowed role set e.g. `[Authorize(Roles = "Admin,Manager,Engineer,PM,Controller,OfficeManager")]`.

**Impact**: Production workers can enumerate the profitability of every job in the shop. Severity MAJOR: this is per-job financial detail (P&L by job) that workers could use to negotiate pay or identify which customers/jobs are most/least valuable to the business. Combined with F-037 (company-wide margin summary), workers have a complete financial picture.

**Recommendation**: Add `[Authorize(Roles = "Admin,Manager,Engineer,PM,Controller,OfficeManager")]` to the `GetCostSummary` action at line 379. Review other `JobsController` sub-endpoints (`material-issues` also returns 200 for workers) for similar narrowing gaps.

**Evidence**: `JobsController.cs:21,379`; live test 2026-05-21 — Worker JWT + Job 1 → `actualMargin=-849991.5`; confirmed access across all 57 jobs.

**Status log**:
  - `2026-05-21` `[SEC]` opened — MAJOR, P1. Live confirmed with real margin data. Single-decorator fix per endpoint.

---

### F-039 [SEC] [BUG] [MINOR] [P2] [PRIMARY] [data] · Auth · Seed installs all 24 users with a single shared static credential

**Where**: `forge.api/Data/SeedData.cs:64-72` — `SEED_USER_PASSWORD` env-var applied uniformly to every seeded user across all role tiers (Admin through ProductionWorker).

**Observed (live, 2026-05-21)**: All 24 seeded accounts — spanning Admin, Manager, PM, OfficeManager, Engineer, and ProductionWorker — authenticate with the identical password `<redacted: see SEED_USER_PASSWORD in secrets vault>`. The credential is recorded in `.env`, in team documentation, and in the orchestrator's handoff notes — making it effectively public within any multi-agent/multi-team engagement. A user at any role can trivially escalate by logging in as an Admin with the same credential.

**Scope question answered**: This IS seed-only — the `SeedData.cs` path is the only place the bulk-assignment occurs. The registration (`CompleteSetup`) and admin password-reset flows apply Identity's password policy (digit + lowercase + uppercase + 8 chars; no special char requirement) and do not enforce uniqueness across users. Nothing prevents an operator from setting their password to the same value as an admin.

**Password policy gaps (co-filed here)**: `options.Password.RequireNonAlphanumeric = false` + minimum 8 chars allows `Password1` as a compliant credential. No HIBP (have-i-been-pwned) or dictionary check. No cross-user uniqueness enforcement. In isolation these are minor for an on-premise ERP; combined with a known shared seed credential they become material.

**Expected for a published/shared demo build**: (a) Unique per-user seed passwords OR a clear teardown-before-publish step documented; (b) password policy should require at least one special character and bump minimum to 12; (c) Consider HIBP check on password set.

**Impact**: Any team member, contractor, or tester with knowledge of the shared seed credential can log in as `admin@forge.local` immediately. In a shared demo environment this is the intended behavior; in a customer handoff or pre-production environment it is a lateral-movement-to-admin path requiring zero effort. MINOR for the demo env; escalates if the seed DB is handed to a customer without a credential rotation step.

**Recommendation**: (1) Document a "credential rotation before customer handoff" step in the deploy runbook. (2) Change `options.Password.RequireNonAlphanumeric = false` → `true` and `RequiredLength = 8` → `12`. (3) Optionally: generate per-user random seed passwords printed to startup log rather than a single shared value.

**Evidence**: `SeedData.cs:64-72`; `.env:20` (`SEED_USER_PASSWORD=<redacted: see secrets vault>`); live test 2026-05-21 — all 24 accounts verified against single password; `Program.cs:113-118` (password policy).

**Status log**:
  - `2026-05-21` `[SEC]` opened — MINOR, P2. Seed-only scope confirmed. Policy gaps co-documented.

---

### F-040 [QA] [GAP] [MINOR] [P3] [PRIMARY] [func] · Customer / Lead · `CAP-O2C-LEAD` capability disabled — Lead management off in this installation

**Where**: `GET /api/v1/leads` → `{"errors":[{"code":"capability-disabled","capability":"CAP-O2C-LEAD","message":"This capability is disabled for this installation."}]}`
**Observed**: The Lead management capability (`CAP-O2C-LEAD`) is disabled in the current installation. Any API call to the leads endpoints returns a 4xx capability-disabled error. The Lead→Customer conversion flow (C1 of the GT charter) cannot be exercised.
**Expected**: Lead management enabled and functional for a commercial job-shop installation.
**Impact**: C1 GT charter cannot exercise the full Lead→Customer conversion path. Whether this is intentional configuration or a capability mis-set needs clarification. Customers who rely on lead tracking as a CRM entry point are blocked.
**Recommendation**: Confirm whether this is intentional for the demo build (some installs may not use Lead management) or an oversight. If the former, document as a known configuration; if the latter, enable `CAP-O2C-LEAD` in the capability preset for the published demo. Scope: MINOR for the demo env; might be MAJOR for a customer who purchased Lead functionality.
**Evidence**: Live API probe 2026-05-21; `GET /api/v1/leads` response; GT charter C1.
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C1 finding. `needs-info` — confirm intentional vs oversight.

---

### F-041 [QA] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Quote · Quote list endpoint returns pre-tax subtotal in `total` field; detail endpoint returns tax-inclusive total — inconsistent semantics

**Where**: `GET /api/v1/quotes` (list) vs `GET /api/v1/quotes/{id}` (detail)
**Observed**: Live verified 2026-05-21.
- **List endpoint**: `total = 25380.00` (pre-tax subtotal) for quote Q-2341AP
- **Detail endpoint**: `subtotal = 25380.00`, `taxAmount = 736.02`, `total = 26116.02` (correct tax-inclusive total)
- Same quote, same field name `total`, two different values. Also verified on the new GT test quote QT-00001: list returns `total = 2320.00` (subtotal); detail returns `total = 2387.28` (includes $67.28 tax at 2.9%).
**Expected**: The `total` field must carry the same value (tax-inclusive) on both list and detail endpoints. If the list is intentionally showing pre-tax, the field must be renamed (e.g., `subtotal`) to prevent misuse.
**Impact**: Any UI component, dashboard widget, report, or billing summary that reads `total` from the list endpoint will display pre-tax amounts, systematically understating revenue on all taxed quotes. This is the same incorrect figure F-003 observed ($0 revenue on the dashboard) — the root may be the list-endpoint subtotal being used as the revenue figure.
**Recommendation**: Fix the list endpoint DTO to compute and return `total = Σ(lineTotal) × (1 + taxRate)`, consistent with the detail endpoint. Alternatively, expose `subtotal` and `taxAmount` on both endpoints so callers have the correct breakout.
**Evidence**: Live API responses 2026-05-21; quote Q-2341AP (id=7) list total=$25,380 vs detail total=$26,116.02; GT test quote QT-00001 (id=8) list total=$2,320 vs detail total=$2,387.28.
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C2 finding. MAJOR/P1 — revenue figures wrong on any list-based view.

---

### F-042 [QA] [BUG] [MINOR] [P2] [PRIMARY] [func · data] · Sales Order · Quote-to-SO convert endpoint silently ignores optional fields

**Where**: `POST /api/v1/quotes/{id}/convert`
**Observed**: Passing `{"confirmedDate":"2026-05-21T00:00:00Z","requestedDeliveryDate":"2026-07-01T00:00:00Z","customerPO":"GTAERO-2026-001","creditTerms":"Net30"}` in the convert body. The created SO (SO-00001, id=17) has `confirmedDate=null`, `requestedDeliveryDate=null`, `customerPO=null`, `creditTerms=null`. All four optional fields were silently dropped.
**Expected**: Fields passed to the convert endpoint are applied to the created SO. The seeded SOs (e.g., SO-2341AP) have all these fields populated — the fields exist in the schema; the convert handler simply doesn't bind them from the request body.
**Impact**: Users converting a quote to an SO must open the SO and fill in PO number, delivery date, credit terms as a second step — the workflow requires two saves instead of one. Minor friction but a real gap in the handoff flow; the customer-facing PO reference is especially important (it's the document that ties the SO to the customer's purchase order).
**Recommendation**: Update `ConvertQuoteToOrder` command to accept and apply `ConfirmedDate`, `RequestedDeliveryDate`, `CustomerPO`, `CreditTerms` fields from the request body. The entity already supports all four.
**Evidence**: Live API test 2026-05-21; SO-00001 `GET /api/v1/orders/17` response; seeded SOs show fields populated when set directly.
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C3 finding.

---

### F-043 [QA] [GAP] [BLOCKER] [P0] [PRIMARY] [func · data] · Job / SO → Job spine · All 57 seeded jobs have `part_id=null`, `sales_order_line_id=null`, `bom_revision_id_at_release=null` — SO→Job link and BOM-at-release never wired; new job create also ignores `salesOrderLineId`

**Where**: `jobs` table (all rows); `POST /api/v1/jobs` create handler
**Observed**:
1. **Seed gap:** DB query 2026-05-21 confirms all 57 seeded jobs have `part_id=NULL`, `sales_order_line_id=NULL`, `bom_revision_id_at_release=NULL`. Jobs are disconnected free-form entries with titles only (e.g., "CNC setup — Bracket Assy Rev C") — no part, no SO link, no BOM release.
2. **Create handler gap:** POST `/api/v1/jobs` with `salesOrderLineId: 22` (valid SO line) created job J-2402 (id=58) — DB shows `sales_order_line_id=NULL` despite the parameter being passed. The handler ignores the SO line reference.
3. **Consequence for invariants:** INV-J1 (`job.part_rev == SO.part_rev` via `BomRevisionIdAtRelease`) and INV-J2 (`start_qty ≥ order_qty`) are **completely untestable** against the live dataset because no job has an SO linkage.
**Expected**: Jobs created from an SO line carry `sales_order_line_id`, `part_id`, and `bom_revision_id_at_release` (BOM revision at job release, per INV-J1). The `job.quantity` should default to the SO line quantity.
**Impact**: The SO→Job spine step is structurally broken: an SO line can have a job *named after it* (the seeder created matching job numbers) but no traceable link. INV-J1/J2 cannot be validated. If a job completes, there's no way to automatically mark the SO line fulfilled. BLOCKER because this is the core of the "Production" stage in the spine.
**Recommendation**: Fix the `CreateJob` handler to bind `salesOrderLineId`, `partId` (from the SO line's part), and `bomRevisionIdAtRelease` (current active BOM revision for that part) when an SO line is referenced. Also: the `quantity` field from the create payload needs to be verified — job detail response doesn't expose `quantity`; check if the field is being persisted.
**Evidence**: DB query 2026-05-21 (all 57 jobs null fields); job J-2402 DB row `sales_order_line_id=NULL` despite passing `22`; `GET /api/v1/jobs/58` response (no quantity, no SO-line fields shown).
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C4 finding. BLOCKER because SO→Job traceability is the manufacturing spine backbone; INV-J1/J2 untestable.

---

### F-044 [QA] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Shipment · Shipment lines have `partId=null`, `partNumber=null` — shipped product has no part reference

**Where**: `GET /api/v1/orders/{id}` → `shipments[].lines[]` in SO detail response; `shipment_lines` table
**Observed**: SO-2341AP (and all seeded SOs) show shipment lines with `"partId":null,"partNumber":null`. The `shipment_lines` table has no `part_id` foreign key (schema inspection 2026-05-21 confirms). Shipment lines reference `sales_order_line_id` but carry no independent part reference.
**Expected**: Each shipment line should identify the part being shipped — this is fundamental for packing lists, receiving verification, and lot/serial tracking (you cannot record which lot/serial was shipped if you don't know which part was shipped).
**Impact**: Packing lists and shipping documents are missing the part number, making them unusable for customer receiving. Lot/serial tracking (INV-SH3) cannot function without a part reference on the shipment line. This is a schema gap that affects F-043 (lot/serial backbone).
**Recommendation**: Add `part_id` (FK to parts) to `shipment_lines`, defaulting from the `sales_order_line.part_id` at ship time. Populate on all existing rows and on new shipment creation.
**Evidence**: `GET /api/v1/orders/16` response showing null partId/partNumber on shipment lines; schema inspection of `shipment_lines` table 2026-05-21.
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C7 finding. MAJOR — packing list unusable; lot/serial tracking blocked.

---

### F-045 [QA] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Invoice / Payment · Invoice status='Paid' with non-trivial underpayment on 3 invoices — payment status machine incorrect

**Where**: `invoices.status` column (DB); `CreatePayment` handler / invoice status update logic
**Observed**: SQL probe 2026-05-21 — correlated subquery (correct, no cross-join) finds 3 invoices marked `status=3 (Paid)` with `Σ(payment_applications.amount) < invoice_total`:
- **INV-2341AP**: total=$26,116.02, paid=$25,618.80, **balance=$497.22** — status=Paid
- **INV-2321A**: total=$6,568.32, paid=$6,484.18, **balance=$84.14** — status=Paid
- **INV-2221AP**: total=$7,871.85, paid=$7,723.60, **balance=$148.25** — status=Paid

These are not rounding differences — $497 is a material underpayment. The invoices should be `PartiallyPaid` not `Paid`. These appear to be seed-data entries where payments were recorded against the pre-tax subtotal rather than the full tax-inclusive total (the gap is roughly the unpaid portion of the tax).

**Note on F-035[BA]:** The BA's probe reported "8 invoices negative A/R" — this was comparing payments against the pre-tax subtotal. The actual product finding here is the status machine: the transition to `Paid` fires when the payment covers the pre-tax amount, ignoring the tax portion. The `CreatePayment` handler should set `Paid` only when `Σ payments ≥ invoice.Total` (tax-inclusive).
**Expected**: `invoiced = Paid` iff `Σ payments ≥ invoice.Total` (within a small rounding tolerance, e.g., $0.05). Otherwise `PartiallyPaid`.
**Impact**: Three invoices show "Paid" in the UI and reports while carrying open A/R balances. `A/R = Σinvoices − Σpayments` (INV-AR1) fails for these invoices. Aging reports undercount open A/R. MAJOR because it directly corrupts A/R.
**Recommendation**: Fix the `Paid` status guard in `CreatePayment` to compare against `invoice.Total` (which includes tax via `Invoice.cs`'s computed property) rather than `invoice.Subtotal` or a re-derived amount. Correct the 3 seeded invoices' status to `PartiallyPaid`. Related: F-027 (parallel balance formulas) and F-031 (flat-tax vs QBO AST).
**Evidence**: SQL INV-AR1 probe 2026-05-21 (correlated subquery); `invoices.tax_rate` + computed total vs `payment_applications.amount` cross-check; live API list endpoint (INV-2341AP shows `amountPaid=25618.80`, `balanceDue=497.22`, `status=Paid`).
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C8/C9 finding. MAJOR — INV-AR1 violated; open A/R miscounted.
  - `2026-05-21` `[QA]` **confirmed: SEED CORRUPTION — live handler is correct.** GT live test: `POST /api/v1/payments` with `$100` partial against INV-2401 (Overdue, $5,480 balance, customer 5) → invoice promoted to `PartiallyPaid` (status=2), balance=$5,380. `CreatePayment.cs:88` guard `if (newBalance <= 0)` fires correctly; partial payment never promotes to `Paid`. Root cause of all 5 Paid-with-balance invoices is seeder direct-insert bypassing the handler, not a logic defect. BA's F-035[BA] classification confirmed. **Live code path is clean.** Data repair actions (see F-050 revised status) remain a `[DEVOPS]` P0.

---

### F-046 [QA] [GAP] [MAJOR] [P1] [PRIMARY] [gap] · Accounting / QBO · `CAP-ACCT-EXTERNAL` capability disabled — entire external accounting seam is gated off; INV-QBO1/2/3 untestable in this installation

**Where**: `GET /api/v1/accounting/status` → `{"errors":[{"code":"capability-disabled","capability":"CAP-ACCT-EXTERNAL"}]}`; `GET /api/v1/admin/accounting-mode` → same error
**Observed**: The external accounting capability (`CAP-ACCT-EXTERNAL`) is disabled in the current installation. Every QBO-related endpoint returns a capability-disabled 4xx. QBO sync cannot be triggered, the accounting mode cannot be read, and the QBO status/health endpoints are inaccessible. This is stronger than `MOCK_INTEGRATIONS=true` — the capability itself is gated off, not just routed to a mock.
**Expected**: For a demo build that includes QBO as a spine-critical integration, `CAP-ACCT-EXTERNAL` should be enabled (even if `MOCK_INTEGRATIONS=true` routes calls to a stub). With the capability off, there is no observable QBO seam behavior at all.
**Impact**: C10 of the GT charter (QBO sync) is completely unexercisable. INV-QBO1 (1:1 linkage), INV-QBO2 (failure surfaced/retryable), and INV-QBO3 (cent-parity) cannot be validated. The QBO seam is the highest-risk integration per the engagement charter, and it cannot be observed at all in this installation. **This is a coverage hole that must be called at the go/no-go decision.**
**Recommendation**: Enable `CAP-ACCT-EXTERNAL` in the demo build's capability preset (paired with `MOCK_INTEGRATIONS=true` for the mock path). Without this, QBO sync testing requires a separate installation with the capability enabled. Escalate to `[DEVOPS]` and `[ORCH]` as a deployment gate.
**Evidence**: Live API probes 2026-05-21; capability-disabled response on `accounting/status`, `admin/accounting-mode`, `accounting/sync-status`; F-021 (structural seam defects independently confirmed via code).
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C10 finding. Coverage hole — requires `[ORCH]`/`[DEVOPS]` action to enable cap for QBO seam testing.

---

### F-047 [QA] [GAP] [BLOCKER] [P0] [PRIMARY] [func · data] · Shipment / Lot-serial · Lot/serial-on-shipped backbone absent — 5 lot records exist, 0 serial numbers, 0 shipment_line_id references (INV-SH3 fails)

**Where**: `lot_records`, `serial_numbers` tables; `serial_numbers.shipment_line_id`, `serial_numbers.shipped_at` columns
**Observed**: DB probe 2026-05-21:
- `lot_records`: 5 rows (LOT-2201, LOT-2251, LOT-2315, LOT-2331, LOT-2341AP) linked to jobs and parts ✓
- `serial_numbers`: **0 rows** — no serial numbers anywhere in the system
- `lot_records.shipment_line_id` (via serial_numbers join): **0 references** — no lot is linked to any shipment line
- `serial_numbers.shipped_at`: **NULL** for all (by absence)

The 5 lots exist (associated with jobs) but they were never:
1. Assigned serial numbers (the lot-tracking backbone is absent)
2. Linked to shipment lines at ship time (INV-SH3: "lot/serial of shipped product recorded")
3. Stamped with `shipped_at`

The domain specialist flagged the lot/serial backbone as PRIMARY scope ("the lot/serial backbone that touches shipped product is spine"). The `serial_numbers` table schema supports the full traceability chain (`job_id → lot_record_id → shipment_line_id → shipped_at`) but none of it is exercised.
**Expected**: When a shipment line is confirmed (ship-confirm), the lot numbers and serial numbers being shipped are recorded against the `shipment_lines` row. `serial_numbers.shipment_line_id` is set. `serial_numbers.shipped_at` is stamped.
**Impact**: Zero traceability for shipped product. Cannot answer "which lot shipped on which shipment" or "was this serial number shipped to this customer." BLOCKER for any customer with quality/recall requirements — which is any contract manufacturer. Also blocks F-044 (part reference on shipment lines is a prerequisite for lot/serial assignment).
**Recommendation**: Implement lot/serial capture at ship-confirm: when a shipment line is confirmed, require the operator to assign lot numbers (and serial numbers for serial-tracked parts); persist `serial_numbers` rows with `shipment_line_id` and `shipped_at`. This requires F-044 (part reference on shipment lines) as a prerequisite. See REQ-SHIP-02 in BA's spine-requirements doc.
**Evidence**: DB probe 2026-05-21 (`lot_records` = 5 rows, `serial_numbers` = 0 rows, all `shipment_line_id` NULL); `serial_numbers` table schema (`job_id`, `lot_record_id`, `shipment_line_id`, `shipped_at` columns exist but unpopulated); GT charter INV-SH3 probe.
**Status log**:
  - `2026-05-21` `[QA]` opened — GT C6/C7 finding. BLOCKER per `[ORCH]`'s scope ruling that lot/serial-on-shipped is PRIMARY spine. Pre-condition: F-044 (part reference on shipment lines).

---

### F-048 [DISC] [BUG] [MAJOR] [P1] [PRIMARY] [data] · QBO sync · Two job stages both carry `accounting_document_type=Invoice` — double QB invoice per job when both stages are traversed

**Where**: `job_stages` table rows id=8 ('Shipped', `code=shipped`) and id=9 ('Invoiced/Sent', `code=invoiced_sent`); `forge.api/Features/Jobs/MoveJobStage.cs:152-172`.

**Observed** `(db+code)` 2026-05-21 `[DISC]`:
```sql
SELECT id, name, accounting_document_type FROM job_stages WHERE accounting_document_type IS NOT NULL;
-- id=8  'Shipped'       accounting_document_type=3  (Invoice)
-- id=9  'Invoiced/Sent' accounting_document_type=3  (Invoice)
```
`TryEnqueueAccountingDocumentAsync` (`MoveJobStage.cs:119-189`) derives the operation name as `"Create{documentType}"` and enqueues with idempotency key `$"CreateInvoice:Job:{job.Id}"`. Both 'Shipped' and 'Invoiced/Sent' produce the same key. No unique constraint exists on `sync_queue_entries` by idempotency key (the BE-2a design proposal in §8 explicitly calls for adding this index — confirming it is absent today). **Both enqueue calls succeed → two `CreateInvoice` payloads dispatched → two QB invoice documents per job.**

**Latency**: Currently non-observable — `CAP-ACCT-EXTERNAL` is disabled (see F-046), so `accountingService.TestConnectionAsync()` returns false at line 125, and the enqueue is skipped on every stage move. Manifests immediately when `CAP-ACCT-EXTERNAL` is enabled and QB is connected.

**Note on $0 amounts (related)**: The `AccountingDocument` payload hardcodes `UnitPrice: 0m, Amount: 0m` (lines 163, 167). This is separately covered by F-021 (real amounts never sent). The double-dispatch bug is independent — two $0 documents instead of one, and the count problem persists after F-021 is fixed.

**Expected**: Only one stage in the Production track type should carry `accounting_document_type=Invoice`. Semantically, 'Shipped' is when the invoice *should be created* (at ship time), and 'Invoiced/Sent' means it has been *sent to the customer* — a status descriptor, not a creation trigger. One of the two must have `accounting_document_type` cleared.

**Recommendation**: Remove `accounting_document_type=3` from `job_stages` id=9 ('Invoiced/Sent') via migration. Confirm with `[DOM]` that 'Shipped' is the correct and only invoice-creation trigger in the job-stage model. As belt-and-suspenders, add the unique index from BE-2a immediately (before enabling CAP-ACCT-EXTERNAL) to prevent future duplicate-stage regressions.

**Evidence**: `job_stages` DB query 2026-05-21; `MoveJobStage.cs:152,172`; BE-2a uniqueness proposal (§8).

**Status log**:
  - `2026-05-21` `[DISC]` opened — MAJOR, P1. Latent under F-046; will produce duplicate QB invoices in production. Pre-condition for enabling CAP-ACCT-EXTERNAL safely.

---

### F-049 [ENG] [BUG] [MAJOR] [P1] [PRIMARY] [func · data] · Production Runs · Over-complete not rejected — UpdateProductionRun accepts completedQty > targetQty with no guard

**Where**: `forge.api/forge.api/Features/Jobs/ProductionRuns/UpdateProductionRun.cs:57-58`

**Observed (live, 2026-05-20)**: `PUT /api/v1/jobs/{id}/production-runs/{runId}` with `completedQuantity=6` against a run with `targetQuantity=5` returns HTTP 200. `completedQuantity` is written as 6 — exceeding target by 1. `scrapQuantity + completedQuantity` can exceed `targetQuantity` with no rejection.

**Expected**: `completedQuantity + scrapQuantity ≤ targetQuantity` must be enforced. Oracle (Ruling #4 / INV-SF2): illegal over-target inputs must return 409 Conflict.

**Root cause**: `UpdateProductionRunCommandValidator` only validates `≥ 0`; the handler directly assigns quantities at lines 57-58 (`run.CompletedQuantity = request.CompletedQuantity; run.ScrapQuantity = request.ScrapQuantity;`) without checking against `run.TargetQuantity`.

**Impact**: Production reporting data integrity broken — a job can report more good units than were started. Corrupts yield calculations (INV-SF1 invariant: `qty_in = good_out + scrapped + at_op`) and downstream costing/OEE metrics. Can inflate shipped-component consumption and confuse WIP tracking.

**Evidence**: `UpdateProductionRun.cs:57-58` (direct assignment, no guard); live probe 2026-05-20 — job 1 / run 1 / targetQty=5 → completedQty=6, HTTP 200 returned, state written. Harness: `e2e/tests/invariant-probes.spec.ts` INV-SF2 `confirmed-gap` annotation.

**Recommendation**: Add a pre-check in the handler after loading the entity:
```csharp
if (request.CompletedQuantity + request.ScrapQuantity > run.TargetQuantity)
    throw new InvalidOperationException(
        $"Completed ({request.CompletedQuantity}) + scrap ({request.ScrapQuantity}) " +
        $"cannot exceed target quantity ({run.TargetQuantity}).");
```

**DoD (regression wire)**: `invariant-probes.spec.ts` INV-SF2 hard-assert `expect(putStatus).toBe(409)` green (currently soft-assert pending this fix).

**Status log**:
  - `2026-05-20` `[ENG]` opened — MAJOR, P1. Live-confirmed by automation probe. INV-SF2 CONFIRMED-GAP.

---

### F-054 [SEC] [BUG] [BLOCKER] [P0] [PRIMARY] [func · data] · Auth · MFA full-auth bypass — `/mfa/challenge`+`/mfa/validate` mint a full role JWT with no proof the password step occurred

**Where**: `forge.api/Controllers/AuthController.cs:304-319` (`POST /api/v1/auth/mfa/challenge` and `/mfa/validate`, both `[AllowAnonymous]`); `forge.data/Services/MfaService.cs:173-204` (`CreateChallengeAsync`), `:206-243` (`ValidateChallengeAsync`), `:375-398` (`GenerateFullTokenAsync`).

**Observed (code-confirmed 2026-05-21)**: The MFA login flow is a two-step anonymous handshake with no server-side state linking it to a password check:
1. `POST /mfa/challenge` is `[AllowAnonymous]` and takes a caller-supplied `{ "userId": <int> }`. `CreateChallengeAsync(userId)` looks up that user's verified MFA device and returns a `challengeToken` (cached 5 min). **Nothing proves the caller passed — or even attempted — the password step.** `Login.cs` and the MFA challenge share no state; a caller can skip `/auth/login` entirely.
2. `POST /mfa/validate` is `[AllowAnonymous]` and takes `{ challengeToken, code }`. On a valid TOTP code, `ValidateChallengeAsync` calls `GenerateFullTokenAsync(userId)` → a **full role JWT** + registered session (`auth-method=mfa`).

Net: MFA *replaces* the password instead of *supplementing* it. For any MFA-enrolled user, possession of the TOTP secret (the second factor) alone yields full access — the password (first factor) is never checked on this path. Two-factor collapses to one-factor, and the strongest factor is removed. User IDs are sequential integers, so target selection is trivial.

**Exploitability caveat (honest)**: NOT exploitable against the current demo seed — `CreateChallengeAsync` throws "No verified MFA device found" when the target has no verified device, and zero seeded users have enrolled MFA (confirmed live, prior pass). The defect is **structural**: it goes live the instant any user enrolls in MFA — i.e., it specifically punishes the most security-conscious action a user can take. An admin enabling MFA converts their own account into a password-less, TOTP-only target.

**Co-filed sub-finding — unauthenticated MFA-device lockout DoS**: `/mfa/challenge` is anonymous and `ValidateChallengeAsync` increments `device.FailedAttempts`, setting `LockedUntil` after `MaxFailedAttempts` (5) bad codes (`MfaService.cs:222-228`). An unauthenticated attacker who knows a victim's userId can lock that user's MFA device for `LockoutDuration` (5 min) with 5 bad codes — repeatable indefinitely. Once F-051 lands on the password path, this is the remaining unauthenticated lockout vector; fix in the same wave.

**Expected**: The MFA step must be reachable only after a successful password check. Remediation: `/auth/login`, on correct password for an MFA-enrolled user, returns a short-lived single-purpose **MFA-pending pre-auth token** (not a full JWT) bound to that userId; `/mfa/challenge` and `/mfa/validate` require and validate that token (not an `[AllowAnonymous]` raw userId) before the full JWT is issued. Full JWT minted only when *both* factors are proven in one linked flow.

**Impact**: A no-password, full-access authentication bypass for any MFA-enrolled account, gated solely on the second factor. For a financial ERP this is a critical authentication-integrity defect. BLOCKER/P0. Ranks at or above F-051 (no-lockout): lockout is a hardening gap on a working factor, whereas this structurally removes the primary factor from the MFA path. Severity is maximal; live exploitability today is zero only because no MFA devices are enrolled — a state any security-conscious deployment leaves immediately.

**Recommendation**: (1) Introduce an MFA-pending pre-auth token issued by `Login` after the password check, scoped to {userId, purpose=mfa, short TTL}. (2) Change `/mfa/challenge` + `/mfa/validate` to require/validate that token instead of accepting a raw `userId` under `[AllowAnonymous]`. (3) Reject a full-JWT mint in `GenerateFullTokenAsync` unless the password factor is proven for the flow. (4) Closing (1)–(2) also closes the co-filed DoS (removes the anonymous device-lock vector). **Structural — NOT a one-liner**; backend-engineer designs the pre-auth token, eng-lead reviews before merge. Regression test: `/mfa/challenge` + `/mfa/validate` return 401 without a valid MFA-pending token; no full JWT issued when the password step was skipped.

**Evidence**: `AuthController.cs:304-319` (`[AllowAnonymous]`, raw userId); `MfaService.cs:173-204` (no password-state linkage in `CreateChallengeAsync`), `:242` (`GenerateFullTokenAsync` on TOTP success), `:375-398` (full role JWT minted); live prior pass — zero verified MFA devices in seed (challenge throws).

**Status log**:
  - `2026-05-21` `[SEC]` opened — BLOCKER, P0. Most severe defect of the auth sweep. Promoted from implicit C0 coverage note ("MFA not required for admin — known from auth audit") to a first-class tracked finding per `[ORCH]`. Structural fix; pre-auth-token design routed to backend-engineer/eng-lead (fix-queue H-015). Not live-exploitable on current seed (no enrolled devices) — do NOT down-rank: structural, and live the moment MFA is enabled.
  - `2026-05-21` `[SEC]` **PRECONDITION RULING (for eng-lead severity gate).** **VERDICT: YES — confirmed no-password-required full-JWT bypass; code-confirmed, NOT live-reproducible on current seed.** Meets eng-lead's stated P0 trigger. Mechanics: `/auth/mfa/challenge` (`[AllowAnonymous]`, raw `{userId}`) → `CreateChallengeAsync` issues a challengeToken with zero linkage to a password check, then EITHER `/mfa/validate` (TOTP) OR `/mfa/recovery` (recovery code) — **both `[AllowAnonymous]`** — call `GenerateFullTokenAsync` → a FULL role JWT (same roles/claims as a password login) + session. `Login.cs` is never invoked; the password is never requested or verified on this path. **Preconditions (all necessary for an actual exploit):** (1) target has ≥1 verified MFA device (`UserMfaDevices.IsVerified=true`) — else challenge throws "No verified MFA device found", no token; (2) caller presents a valid current TOTP code OR an unused recovery code — i.e. needs the second-factor seed, **NOT** the password; (3) userId is a sequential int (trivially enumerable). **Classification: password-NOT-required bypass, not zero-knowledge/unauthenticated** — an attacker with no secrets can't walk in, but one holding the TOTP/recovery seed gets full access with the password entirely out of the loop (MFA *replaces* rather than *supplements* the first factor; 2FA→1FA, discarded factor = password). **Live-reproducible: NO today** (zero seeded users have a verified device → every challenge throws); becomes live the instant any user verifies MFA — i.e. the first admin who hardens their account creates a password-bypassable account. **Escalation chain:** `UserMfaDevice.EncryptedSecret` is sealed by DP keys stored UNENCRYPTED at rest (`PersistKeysToDbContext`, no `ProtectKeysWith*`) → a DB/backup dump decrypts every TOTP seed → mint codes → password-less admin JWT, converting precondition (2) into "anyone with DB/backup read" (nightly backup + B2 offsite). That DP-keys finding is still UNFILED (recommend F-055). **Severity recommendation: P0/stop-the-line, ranks ABOVE F-028** (estimating gap is a feature/trust deficit, not a security bypass). Only mitigant for sequencing: blast radius bounded today by precondition (1) → a fix-before-anyone-enrolls window exists, but for a published/market-readiness build that is not grounds to down-rank.

---

### F-055 [QA] [BUG/GAP] [MAJOR] [P1] [PRIMARY] [func · data] · Quote → Sales Order · Price-lock invariant unenforced on `ConvertQuoteToOrder` — SO unit_price can drift from accepted Quote unit_price

**Where**: `forge.api/Features/SalesOrders/ConvertQuoteToOrder.cs` (convert handler); `forge.core/Entities/SalesOrderLine.cs` (`UnitPrice` field). INV-SO1 in `DISCOVERY.md §2A`: `SO.unit_price == accepted_quote.unit_price`.

**Observed**: The GT C3 pass confirmed INV-SO1 **passes on all 6 seeded Quote/SO pairs** (prices match). However, the pass is observational — it reflects that the seeder wrote matching values, not that the handler enforces the invariant. Reading `ConvertQuoteToOrder.cs`, the handler copies line data from the accepted quote when creating SO lines, but there is no explicit guard that **rejects a conversion if** any `salesOrderLine.UnitPrice ≠ quoteLine.UnitPrice`. A caller who modifies a `QuoteLine.UnitPrice` between quote acceptance and conversion (e.g., via a quote-edit endpoint that doesn't re-check acceptance state) can silently produce an SO with a price that differs from what the customer accepted.

**Note — independent of F-028:** F-028 is the missing *estimating engine* (no engine to compute `UnitPrice` in the first place). This finding is narrower: given that a `UnitPrice` *was* set on the accepted quote, the SO conversion must preserve it exactly. These are separable; this guard is a one-sprint addition to `ConvertQuoteToOrder`, not blocked by F-028.

**Expected**: `ConvertQuoteToOrder` reads each `QuoteLine.UnitPrice` at conversion time and writes it to the corresponding `SalesOrderLine.UnitPrice` — exactly, not as a copy that can be overridden by a request body field. If any mismatch is detected (e.g., a caller attempts to pass a different `UnitPrice` in the convert payload), the handler returns 409. The seeded INV-SO1 pass should be reproduced by the handler, not just by the data.

**Acceptance criterion**: BA spine-REQ price-lock invariant (REQ-SO-01 in `docs/ba/spine-requirements-and-dod.md`); `ConvertQuoteToOrder` unit test asserts `salesOrderLine.UnitPrice == quoteLine.UnitPrice` for all lines after conversion; a test passing a mismatched price in the convert payload is rejected with 409.

**Impact**: Any path that allows `QuoteLine.UnitPrice` to be modified after quote acceptance (or allows the convert payload to override line prices) silently breaks the customer's accepted price. A/R, margin, and QBO invoice amounts all flow from this field — drift here corrupts everything downstream. MAJOR because the seeded data passes today; the risk is latent until a code path that edits accepted-quote lines is exercised.

**Recommendation**: In `ConvertQuoteToOrder`, when building each `SalesOrderLine`, explicitly assign `UnitPrice = quoteLine.UnitPrice` and do not accept a price override from the request body. Add a pre-check: if `quote.Status != QuoteStatus.Accepted` throw. Add the unit test. **Independent small fix — do not bundle into F-028 (estimating engine).**

**Evidence**: GT C3 INV-SO1 probe 2026-05-21 — 6 seeded pairs, prices match (observational pass, not handler-enforced); `ConvertQuoteToOrder.cs` inspection (no explicit price-lock guard); INV-SO1 in `DISCOVERY.md §2A`; REQ-SO-01 in BA spine-requirements.

**Status log**:
  - `2026-05-21` `[QA]` opened — MAJOR, P1. Filed per `[ORCH]` instruction. Independent of F-028; one-sprint guard addition. Note: `[ORCH]` directed this as F-054 but that ID was claimed by `[SEC]` (MFA bypass, H-014) between turns — filing at next free ID **F-055** per protocol. Next free: **F-056**.

### F-056 [ENG] [GAP] [MINOR] [P3] [PRIMARY] [func · concurrency] · Kanban / Job mutations · ETag `If-Match` not injected on job sub-path PATCHes — URL-key mismatch in interceptor

**Where**: `forge-ui/src/app/shared/interceptors/etag.interceptor.ts:45` (If-Match injection keyed by exact URL); `forge-ui/src/app/features/kanban/services/kanban.service.ts` (mutation methods).

**Observed**: The ETag interceptor caches ETags at exact URL keys. `GET /api/v1/jobs/{id}` seeds the cache at `/api/v1/jobs/123`. The following mutation calls look up **different** keys and therefore never find a cached ETag — `If-Match` is silently omitted:
- `PATCH /jobs/{id}/stage` → looks up `/api/v1/jobs/123/stage` ✗
- `PATCH /jobs/{id}/subtasks/{subtaskId}` → sub-path key ✗
- `PUT /jobs/{id}/custom-fields` → sub-path key ✗
- `PATCH /jobs/{id}/cover-photo` → sub-path key ✗
Only `PUT /jobs/{id}` (update job body) shares the same key as the GET — that one is correctly protected. The Kanban board also performs a JIT GET before the stage move (added Wave-1), which seeds the cache, but the seed is at the root job URL, not the sub-path — so the stage PATCH still misses the ETag.

**Expected**: Sub-path PATCHes either (a) seed their own ETag via a pre-flight GET on the sub-path (JIT approach) or (b) the interceptor falls back to the parent resource's ETag when the exact sub-path key is absent and the parent key ends with a numeric segment (e.g., strip `/stage` → `/api/v1/jobs/123`).

**Impact**: Lost optimistic-concurrency protection on the most-used Kanban mutations. Without `If-Match`, concurrent stage moves (two dispatchers moving the same job) silently LWW rather than 412-conflicting. MINOR because: (a) Wave-1 JIT GET partially mitigated for `moveJobStage` (cache seeded even if key mismatches); (b) job edits via `updateJob` (the dialog PUT) are correctly protected; (c) ship-only risk — no data loss today, just silent last-write-wins on sub-path state.

**Recommendation**: Add parent-path ETag fallback to `ETagCacheService.get()` — when exact key misses, strip the last non-numeric path segment if the parent ends with `/{id}` and retry. Alternatively wire a JIT GET in each Kanban service method that calls a sub-path PATCH. **Await eng-lead confirmation** that backend sub-path endpoints enforce 428 Precondition Required before building — if they don't enforce it, `If-Match` injection is a no-op anyway.

**Evidence**: Source audit 2026-05-21 (`etag.interceptor.ts:45`, `kanban.service.ts` — `moveJobStage`, `toggleSubtask`, `updateJobPart`, `updateCustomFieldValues`, `setCoverPhoto`); `etag-cache.service.ts` exact-key `Map` confirmed; no parent-path fallback present.

**Status log**:
  - `2026-05-21` `[ENG]` opened — identified during Wave-1 If-Match surface survey. MINOR/P3; not ship-blocking. Proposed fix scoped but not built pending eng-lead decision on mandatory 428 enforcement at sub-path endpoints. Next free finding ID: **F-057**.

---

## 7. 1.0 readiness summary (write last)

_(executive rollup: blocker count, major count, gap count, top 10 risks, go/no-go recommendation, estimated work to ship)_
