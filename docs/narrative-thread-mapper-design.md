# Narrative-Thread Feature Mapper — Design

> Phase 1n. **Status: design-first; no implementation in this artifact.**
> Companion / alternative path to the eight stereotyped capability presets (`Two-Person Shop`, `Growing Job Shop`, `Distribution`, `Production Manufacturer`, `Regulated Manufacturer`, `Multi-Site Operation`, `Enterprise`, `Custom`) defined in `phase-4-output/4B-preset-design`.

---

## Problem the existing presets solve, and the gap

The capability presets answer **"what kind of company are you?"** with a single vertical-shape choice. They sort along size + regulation + vertical axes simultaneously and bundle ~30-90 capabilities each. They work well when the buyer recognizes themselves in one of the eight profiles.

They struggle in three cases:

1. **Hybrid businesses.** A 10-person shop that does its own production AND resells imported parts is half Job Shop, half Distribution. Pick one preset and the other half is wrong by default.
2. **Discovering buyers.** A buyer evaluating the platform may not know whether they're a "Production Manufacturer" or a "Regulated Manufacturer" — those terms aren't how they describe their work to a customer. They describe what they *do*: "we take orders, we make stuff, we ship it, we invoice." Asking them to map that to an industry archetype is a translation step they shouldn't have to do.
3. **Activity-driven onboarding.** When a salesperson talks to a prospect, the conversation is "do you take phone orders? do you generate quotes? do you ship pallets or parcels?" — narrative threads, not vertical archetypes. The platform's setup flow should mirror the conversation.

The narrative-thread mapper is the alternative entry point: pick the business **activities** you do, get a capability set tailored to those activities — independent of which preset archetype you'd otherwise fit.

---

## What a "thread" is

A **thread** is one coherent end-to-end business activity, expressed in plain language a non-expert can answer yes/no to. Each thread enumerates the capabilities the platform must have enabled for that activity to work end-to-end.

Threads are **orthogonal**: a business runs many in parallel. Picking three threads enables the union of their capability sets.

Threads are **discriminator-driven**, same as the preset design. The yes/no question must be one a non-expert buyer can answer truthfully without internal vocabulary. "Do you batch-issue components or backflush at completion?" fails — that's an internal lean-manufacturing detail. "Do you ship to customers via UPS / FedEx / etc.?" passes.

### Candidate thread inventory (initial)

The threads below are a starting point, not a fixed taxonomy. They were derived by walking the existing capability catalog from `phase-4-output/4A-capability-catalog` and asking, per capability, "what plain-language activity drives the need for this?" — then clustering capabilities whose answers correlate.

#### Order-side threads
- **Phone / email order intake** — taking orders by direct customer contact. Drives `CAP-MD-CUSTOMERS`, `CAP-MD-CUSTOMER-CONTACTS`, `CAP-O2C-SALES-ORDER`.
- **Quote → order workflow** — generate a price commitment before the order. Drives `CAP-O2C-QUOTE`, `CAP-O2C-ESTIMATE`, plus an "estimates → quotes → SOs" pipeline.
- **Repeat / standing customer relationships** — the same customers come back. Drives `CAP-O2C-RECURRING-ORDERS`, `CAP-MD-PRICE-LISTS`, customer credit policy.
- **E-commerce inbound** — orders arrive from a webstore, not a phone. Drives `CAP-EXT-ECOMMERCE`, `CAP-O2C-DROPSHIP`.
- **EDI inbound** — large customers send you 850s. Drives `CAP-EXT-EDI`, the EDI trading-partner stack.

#### Make-side threads
- **You build / assemble parts in-house** — a yes flips on the entire production stack. Drives `CAP-MD-PARTS`, `CAP-MD-BOM`, `CAP-MD-ROUTING`, `CAP-MFG-WORK-ORDER`, shop-floor time capture, work centers.
- **You resell parts you don't make** — pure distribution. Drives stocking + receiving but no `CAP-MD-BOM` / `CAP-MFG-*`.
- **You handle hazardous materials** — drives hazmat-flag handling, MSDS storage.
- **You serial-track / lot-track items** — drives `CAP-INV-LOTS`, `CAP-INV-SERIAL`, traceability queries.
- **You operate multiple plants / warehouses** — drives `CAP-INV-MULTI-LOC`, inter-site transfers.

#### Quality-side threads
- **You inspect what you receive / produce** — basic QC. Drives `CAP-QC-INSPECTION`, NCR, CAPA.
- **You're regulated (FDA / aerospace / medical / automotive)** — full QC stack. Drives ECO, FMEA, PPAP, SPC, gage R&R, recall, COA.
- **You log compliance forms (W-4, I-9, training records)** — drives `CAP-EXT-COMPLIANCE-FORMS`.
- **You track training + certifications** — drives `CAP-EXT-TRAINING-LMS`.

#### Cash-side threads
- **You invoice + collect payment in Forge** — drives `CAP-ACCT-BUILTIN` family (Invoices, Payments, AR Aging, Statements).
- **You hand invoicing off to QuickBooks / Xero / etc.** — drives `CAP-ACCT-EXTERNAL`. Mutex with the above.
- **You charge by the hour (project accounting)** — drives `CAP-EXT-PROJECT-ACCT`.
- **You sell internationally** — drives `CAP-EXT-MULTI-CURRENCY`, `CAP-EXT-FX-REVAL`.
- **You collect sales tax** — drives `CAP-O2C-SALES-TAX`.
- **You extend customer credit** — drives `CAP-O2C-CREDIT-LIMITS`, credit hold workflow.

#### Ship-side threads
- **You ship via parcel carriers** — drives `CAP-EXT-SHIPPING-CARRIERS`.
- **You print shipping labels in-app** — drives `CAP-EXT-LABEL-PRINT`.
- **You manage drop-ships from a vendor** — drives `CAP-O2C-DROPSHIP`.
- **You handle returns** — drives `CAP-O2C-RMA`.

#### Workforce-side threads
- **You track employee time on the shop floor** — drives `CAP-EXT-TIMECLOCK`.
- **You run payroll in-app** — drives `CAP-EXT-PAYROLL`.
- **You log incidents + safety reviews** — drives `CAP-EXT-EHS`.

#### Comm-side threads (Wave 8 native)
- **You email customers / leads from a personal mailbox** — drives `CAP-EXT-EMAIL-SYNC`.
- **You take customer calls** — drives `CAP-EXT-VOIP-SYNC`.

The full inventory is closer to 40-50 threads. Each yes contributes a delta of ~3-15 capabilities; the union over a typical user's threads lands at 50-120 capabilities — comparable to a preset but composed differently.

---

## How threads map to capabilities

Each thread declares a `Requires` list of capability codes:

```csharp
new ThreadDescriptor(
    Key: "make-parts-in-house",
    DisplayName: "We build / assemble parts in-house",
    Description: "Choose this if you machine, assemble, weld, finish, or otherwise produce parts yourself.",
    Question: "Do you make parts in-house?",
    Category: "make",
    Requires: [
        "CAP-MD-PARTS",
        "CAP-MD-BOM",
        "CAP-MD-ROUTING",
        "CAP-MFG-WORK-ORDER",
        "CAP-MFG-SHOP-FLOOR",
        "CAP-EXT-TIMECLOCK",
        // ...
    ],
    SubQuestions: [
        new("multi-op-routing", "Are your jobs multi-step (multi-operation routing)?",
            EnableOnYes: ["CAP-MFG-ROUTING-MULTIOP"]),
        new("traceability", "Do you need lot or serial traceability on what you make?",
            EnableOnYes: ["CAP-INV-LOTS", "CAP-INV-SERIAL"]),
    ])
```

A thread can declare:
- `Requires` — enabled on yes (the core capability set)
- `Excludes` — disabled on yes (e.g. "we resell only" excludes `CAP-MFG-*`)
- `SubQuestions` — yes/no follow-ups that toggle additional capabilities (the regulated-manufacturer thread expands into ECO + PPAP + SPC + FMEA via sub-questions)
- `MutexWith` — declares which other threads conflict (resell-only vs. make-in-house). Picking both surfaces a clarifier ("do you do both?" → enables both with sensible defaults).

The discovery output is a capability set — not a preset. It can be applied directly to the install (same `PUT /api/v1/capabilities/{code}/enabled` path the preset apply uses) or saved as a custom preset for later re-use.

---

## How this is different from / complementary to presets

| | Presets | Narrative threads |
|---|---|---|
| **Mental model** | "What kind of company are you?" | "What activities do you do?" |
| **Granularity** | One choice → ~30-90 caps | Many yes/no answers → composed cap set |
| **Discoverability for unfamiliar buyers** | Requires translating activity → archetype | Direct, plain-language |
| **Hybrid businesses** | Pick the closest preset, customize | Composes naturally |
| **Output** | Preset selection (recoverable label) | Capability set (typically saved as Custom preset for label) |

The two paths are **complementary**, not competing. The discovery wizard at `/admin/discovery` could offer both:

1. **Quick path** ("I know who I am"): pick one of the 7 named presets.
2. **Activity path** ("Walk me through it"): answer ~10-20 thread questions; system composes the capability set + offers to save it as a Custom preset.

A user can also enter via thread mode and exit by saying "this is closest to Production Manufacturer; switch to that preset and let me toggle from there" — switching modes mid-discovery is a feature.

---

## Architecture sketch (when implementation begins)

### Data model

```csharp
namespace Forge.Core.Discovery;

public sealed record ThreadDescriptor(
    string Key,
    string DisplayName,
    string Question,             // the yes/no prompt
    string Category,             // "order" / "make" / "quality" / "cash" / "ship" / "workforce" / "comm"
    string? Description,
    IReadOnlyList<string> Requires,
    IReadOnlyList<string>? Excludes = null,
    IReadOnlyList<ThreadSubQuestion>? SubQuestions = null,
    IReadOnlyList<string>? MutexWith = null,
    int SortOrder = 0);

public sealed record ThreadSubQuestion(
    string Key,
    string Question,
    IReadOnlyList<string>? EnableOnYes = null,
    IReadOnlyList<string>? DisableOnYes = null);

public static class ThreadDescriptorCatalog
{
    public static IReadOnlyList<ThreadDescriptor> All { get; } = /* ~40-50 entries */;
}
```

### Server endpoints

- `GET  /api/v1/discovery/threads` — descriptor catalog (the questions to ask).
- `POST /api/v1/discovery/threads/preview` — body: `{ answeredYes: ["thread-key", ...], subAnswers: { "thread-key.sub-key": true, ... } }` → returns the composed capability set + the diff against the current install state.
- `POST /api/v1/discovery/threads/apply` — same body shape; persists the capability set + optionally saves as a custom preset with a user-supplied label.

### UI

`/setup/threads` — a wizard sibling of `/setup/integrations` (already shipped in phase 1m.7). Same shape: card list, per-card yes/no, follow-up cards on yes. At the end: a preview ("we'll enable 84 capabilities — review changes") + apply/cancel.

### Mutex / dependency handling

Threads can produce capability sets that violate mutex pairs (the only declared one today is `CAP-ACCT-EXTERNAL ⊥ CAP-ACCT-BUILTIN`). The preview step runs the same `CapabilityValidator` the preset apply path uses — surfaces conflicts, prompts the user to resolve, then proceeds.

Capability dependencies (e.g. `CAP-MFG-MRP` requires `CAP-MFG-WORK-ORDER`) are auto-pulled in by the existing `CapabilityCatalogRelations` resolver, same as preset apply. No separate dependency logic in the thread mapper.

---

## Open design questions

1. **Should threads be admin-customizable?** The preset catalog is hard-coded; threads should likely follow suit for v1, with a future "thread editor" admin page if installs want to localize the wording or add internal threads.

2. **How granular should sub-questions go?** Too granular → user fatigue. Too coarse → the thread enables capabilities they don't actually need. Heuristic: a sub-question is justified if its yes/no answer changes the capability set by ≥3 capabilities, OR by a specifically-marked "user-visible" capability (one that adds a menu item).

3. **Should the wizard remember partial state?** Probably yes — same sessionStorage pattern the integration setup wizard (1m.7) uses. Refresh-safe is the goal.

4. **How does this interact with the existing `/admin/discovery`?** The existing discovery is a 22-question preset-recommendation flow. Two options: (a) replace it with the thread mapper; (b) keep both, label them "Quick Discovery" (preset) and "Activity Discovery" (threads). Option (b) is safer for existing users.

5. **Pricing-tier alignment.** If the platform ever ships tiered pricing, threads need to know which capabilities are gated by tier. Out of scope for v1; document but defer.

6. **Onboarding integration.** The first-admin flow could route through `/setup/integrations` (1m.7) → `/setup/threads` (1n) → dashboard, with both skippable. That's a future first-run-experience design pass.

---

## Build phasing (when ready)

1. **Phase 1n.1** — `ThreadDescriptor` + catalog entry for ~5 high-leverage threads (make-vs-resell, charge-by-hour, ship-via-carriers, regulated, accounting-internal-vs-external). Smoke-test the data model against real preset definitions to confirm the cap-set composition is sane.
2. **Phase 1n.2** — server endpoints (`GET threads`, `POST preview`, `POST apply`). Reuse `CapabilityValidator` + `CapabilityCatalogRelations` from existing capability infrastructure.
3. **Phase 1n.3** — `/setup/threads` wizard UI. Card pattern from 1m.7 wizard + preview-and-apply screen.
4. **Phase 1n.4** — fill out the rest of the thread catalog (40-50 threads) iteratively, with thread coverage checks against each preset's capability set (every preset's enabled capabilities should be reachable through some combination of threads).
5. **Phase 1n.5** — discovery integration — wire alongside existing preset flow at `/admin/discovery`, tracking which path the user came in through for analytics + reverting if they pick the other.
6. **Phase 1n.6** — admin can save a thread-driven session as a Custom Preset for later re-use; no schema change since `CAP-CUSTOM-PRESET` already supports arbitrary capability sets.

Total estimate: **2-4 days** for a fully working v1, depending on how much thread-catalog research we do first vs. iterate after launch.

---

## Why this is queued, not built

The settings + integrations system shipped in phases 1m.1-1m.7 is the foundational platform piece for "config moves out of appsettings into the admin." The narrative thread mapper is one consumer of that foundation (it'll write to capabilities + system_settings the same way preset apply does).

But the thread catalog is **content-heavy** — designing the right ~40-50 questions and mapping each to capability sets is a full design pass on its own, with research effort similar to the original preset design (which was a 1500-word artifact in phase 4B). It deserves its own session, not a tail-end sprint after the settings work.

Recommended trigger to build: when (a) the settings system has been in production-use for a few sessions and the descriptor pattern is settled, AND (b) we have time for a proper thread-catalog design pass. v1 doesn't have to ship complete — start with the high-leverage threads + iterate.
