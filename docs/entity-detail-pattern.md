# Entity Detail Pattern — Tabbed Detail Driven by Axis-Discriminated Layout

> Reusable spec for the Pillar-4 entity-detail surface. Codifies the resolver +
> cluster + shell pattern shipped on `Part` so it can be applied to any other
> entity whose relevant fields differ meaningfully by some categorical axis.
>
> Status: **AUTHORITATIVE**. Worked examples: `Part` (Pillar 4), `Customer`
> (Pillar 5).

---

## § 1. Overview

The "tabbed detail driven by axis-discriminated layout" pattern is the standard
way to render a domain entity whose field universe is too large to fit on a
single dialog or page **and** whose field-relevance varies meaningfully by some
categorical axis.

**When to apply:** any entity where a single all-fields dialog would either:

1. Overflow the viewport (>20 form rows), OR
2. Show fields that are inert / N-A for some sub-types (e.g. a `Phantom` part
   has no inventory threshold; a `Distributor` customer has no direct sales
   pipeline; a `Subcontract` vendor has no on-hand stock).

In both cases, the detail surface should be **tabbed**, with tab content
**clustered by domain concept**, and the tab list **resolved per-entity** from
one or two discriminating axes.

The pattern has three pieces, each in its own file:

| Piece                     | Role                                            | File suffix                                     |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| **Layout resolver**       | Pure function `axes → ordered TabLayoutEntry[]` | `*-detail-layout-resolver.service.ts`           |
| **Cluster components**    | One per domain cluster; read + edit modes       | `*-clusters/*-{cluster-name}-cluster.component` |
| **Tabbed-detail shell**   | Mounts the resolver and a cluster per tab       | `*-detail-{dialog,panel,page}.component`        |

The shell is dumb; the resolver is the only thing that knows the axis-to-layout
mapping; clusters are interchangeable building blocks.

---

## § 2. The Layout Resolver

A pure-function injectable service that maps the entity's discriminating axes
to an ordered array of tab descriptors.

### § 2.1 The `TabLayoutEntry` interface

Generic shape lives per-feature (each entity types its own `*TabId` union).
Recommended structure:

```ts
/** A single tab descriptor returned by the resolver. */
export interface TabLayoutEntry {
  /** Stable id used for keying templates and the `?tab=` query param. */
  id: string;
  /** ngx-translate key for the tab label. */
  labelKey: string;
  /** Material Icons Outlined glyph name. */
  iconName: string;
}
```

Each feature defines its own narrowed union:

```ts
export type CustomerDetailTabId =
  | 'identity' | 'contacts' | 'pricing' | 'orders' | 'invoices' | 'activity';
```

### § 2.2 Implementation shape

```ts
@Injectable({ providedIn: 'root' })
export class CustomerDetailLayoutResolverService {
  resolve(axisValue: CustomerType): TabLayoutEntry[] {
    const middle = this.middleTabs(axisValue);
    return [IDENTITY, ...middle, ACTIVITY];   // identity-first / activity-last
  }

  private middleTabs(axisValue: CustomerType): TabLayoutEntry[] {
    if (axisValue === 'Direct')      return [CONTACTS, PRICING, ORDERS, INVOICES];
    if (axisValue === 'Distributor') return [CONTACTS, PRICING, ORDERS];
    if (axisValue === 'Internal')    return [CONTACTS];
    // Default — most permissive layout
    return [CONTACTS, ORDERS, INVOICES];
  }
}
```

### § 2.3 Invariants

Every resolver MUST guarantee:

1. **Identity is always first.** No matter what the axis says, the first tab is
   the entity's identity / classification fields. Consistency lets users always
   land on the same starting context.
2. **Activity is always last** (or second-to-last if you also surface a Files
   tab). Activity / audit timeline is read-only and a natural "back of the
   binder" location.
3. **A default branch handles unknown axis combos.** Fallback to the most
   permissive layout — never throw. Future axis values added to the source enum
   should not break the resolver.
4. **Never returns an empty array.** Even for a phantom / archived / minimal
   entity, you always get at least `[IDENTITY, ACTIVITY]`.

### § 2.4 Two-axis variant

If one axis isn't enough, switch keying on a `(axisA, axisB)` tuple. The
`PartDetailLayoutResolverService` does this for `(procurementSource, inventoryClass)` —
14 viable combos drive 14 tab orderings. Keep the resolver pure and avoid more
than 2 axes; beyond that the matrix becomes ungovernable.

---

## § 3. Cluster Components

A **cluster** is one Angular component that renders a single domain-grouped
region of the entity in **both read and edit modes**. Examples: Identity,
Inventory, Cost, Contacts, Pricing, Activity, Files.

### § 3.1 Standard input/output shape

```ts
@Component({
  selector: 'app-customer-identity-cluster',
  standalone: true,
  imports: [
    ReactiveFormsModule, TranslatePipe,
    InputComponent, SelectComponent, TextareaComponent, ValidationButtonComponent,
  ],
  templateUrl: './customer-identity-cluster.component.html',
  styleUrl: '../customer-clusters.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerIdentityClusterComponent {
  readonly entity = input.required<CustomerDetail>();
  readonly editing = input(false);
  readonly saving = input(false);

  readonly save = output<Partial<CustomerDetail>>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    /* ... */
  });

  protected readonly violations = FormValidationService.getViolations(this.form, {
    name: 'Name',
  });

  constructor() {
    effect(() => {
      const e = this.entity();
      this.form.reset({ name: e.name, /* ... */ });
      if (this.editing()) this.form.enable(); else this.form.disable();
    });
  }

  protected onSave(): void {
    if (this.form.invalid) return;
    this.save.emit(this.form.getRawValue());
  }

  protected onCancel(): void { this.cancelled.emit(); }
}
```

### § 3.2 Conventions

- **Read mode** — two-column `cluster__grid` of label/value pairs.
- **Edit mode** — same labels surfaced as form fields. Reuse the shared form
  wrappers (`<app-input>`, `<app-select>`, `<app-textarea>`, `<app-toggle>`).
- **Validation** — wrap the cluster's Save button with `<app-validation-button>`
  per CLAUDE.md. **Do not** use `mat-error` / inline validation.
- **Save emission** — emit a `Partial<EntityDetail>` patch, not a full entity.
  The shell merges patches across clusters and calls the service.
- **Disabled when not editing** — toggle `form.enable()` / `form.disable()` in
  an `effect` so a cluster can't accept user input while the parent shell
  is in read mode.
- **Read fields are tolerant of nulls** — show `'---'` for empty values; never
  render a `null` directly.
- **One cluster, one file** — never co-locate multiple clusters in a single
  component file (CLAUDE.md "ONE OBJECT PER FILE").

### § 3.3 Shared SCSS

Each feature's clusters share a single `*-clusters.shared.scss` for the
`.cluster`, `.cluster__title`, `.cluster__grid`, `.cluster__form-row`,
`.cluster__actions`, `.cluster__placeholder` classes. Do not duplicate those
across cluster files. Reference `parts/components/part-clusters/part-clusters.shared.scss`
for the canonical shape.

### § 3.4 Activity cluster — special case

Most entities don't need a custom Activity component — wrap the existing
`<app-entity-activity-section>` shared component:

```ts
@Component({
  selector: 'app-customer-activity-cluster',
  standalone: true,
  imports: [EntityActivitySectionComponent],
  template: `
    <div class="cluster">
      <app-entity-activity-section entityType="Customer" [entityId]="customerId()" />
    </div>
  `,
  styleUrl: '../customer-clusters.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerActivityClusterComponent {
  readonly customerId = input.required<number>();
}
```

### § 3.5 Placeholder clusters

When a cluster's fields haven't been extracted yet (or the existing tab is
already a separate component you don't want to refactor in this dispatch),
render a placeholder rather than blocking the resolver work:

```html
<div class="cluster">
  <h3 class="cluster__title">{{ tabLabelKey | translate }}</h3>
  <div class="cluster__placeholder">
    <span class="material-icons-outlined cluster__placeholder-icon">construction</span>
    <span>{{ 'customers.detail.tabs.placeholderHelp' | translate }}</span>
  </div>
</div>
```

This keeps the tab resolver / shell consistent across entities even when only
a subset of clusters has been authored.

### § 3.6 Reusable cluster references (Part)

Pillar 4 Phase 2 ships 12 cluster components on Part that can be referenced
when extracting clusters on other entities:

| Cluster                                | Pattern surfaced                            | Path                                                                                |
|----------------------------------------|---------------------------------------------|-------------------------------------------------------------------------------------|
| `PartIdentityClusterComponent`         | Required fields, two-column form, status    | `parts/components/part-clusters/part-identity-cluster.component.ts`                 |
| `PartInventoryClusterComponent`        | Numeric thresholds, traceability + ABC      | `parts/components/part-clusters/part-inventory-cluster.component.ts`                |
| `PartCostClusterComponent`             | Single-field cluster + `<app-currency-input>` | `parts/components/part-clusters/part-cost-cluster.component.ts`                    |
| `PartFilesClusterComponent`            | Read-only attachment list                   | `parts/components/part-clusters/part-files-cluster.component.ts`                    |
| `PartActivityClusterComponent`         | Activity timeline wrapper                   | `parts/components/part-clusters/part-activity-cluster.component.ts`                 |
| `PartMaterialClusterComponent`         | Reference-data dropdown + canonical-SI conversion (weight/dims/volume) | `parts/components/part-clusters/part-material-cluster/`         |
| `PartUomClusterComponent`              | API-loaded select with fixed-list fallback  | `parts/components/part-clusters/part-uom-cluster/`                                  |
| `PartMrpClusterComponent`              | Conditional reveal (`@if` driven by form value signals) | `parts/components/part-clusters/part-mrp-cluster/`                       |
| `PartQualityClusterComponent`          | Toggle + multiple enums + numeric           | `parts/components/part-clusters/part-quality-cluster/`                              |
| `PartRoutingClusterComponent`          | Thin wrapper around `<app-routing>`         | `parts/components/part-clusters/part-routing-cluster/`                              |
| `PartAlternatesClusterComponent`       | Thin wrapper around `<app-part-alternates-tab>` | `parts/components/part-clusters/part-alternates-cluster/`                       |

Material's canonical-SI conversion pattern is reusable wherever the user wants
to type a value in a chosen unit but the entity stores it canonically (grams,
mm, mL). Keep `*DisplayUnit` columns alongside the canonical column so the
edit form round-trips the user's typed unit.

---

## § 4. Tabbed-Detail Shell

The shell is the only smart component in the trio. It fetches the entity,
resolves the layout, renders a tab strip, and mounts the right cluster
per tab.

### § 4.1 Required behaviors

1. **Inject the resolver** and call `resolve(...)` whenever the bound entity
   changes (in a `computed` signal).
2. **Active tab is bound to the URL** via `?tab=<id>` (CLAUDE.md "URL as
   Source of Truth"). Refreshing must keep the same tab visible.
3. **Tab strip iterates the resolver's output** — never hardcode tab names in
   the template.
4. **Tab content mounts the right cluster** via `@switch` / `@if` (or
   `*ngComponentOutlet` if you have a component map). Only one cluster
   instantiated at a time.
5. **Edit mode is global to the shell.** A single `editing` signal toggles
   every cluster simultaneously. Each cluster decides whether it has editable
   fields.
6. **Save patches are merged.** When a cluster emits `save`, the shell forwards
   the merged patch to the service `update(...)` call, then refreshes the
   entity signal.
7. **First tab fallback.** When the resolved layout no longer contains the
   currently-active tab id (e.g. after a save that changed the axis), the shell
   resets to the first tab.

### § 4.2 Skeleton

```ts
@Component({ /* ... */ })
export class CustomerDetailDialogComponent {
  private readonly layoutResolver = inject(CustomerDetailLayoutResolverService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });

  readonly customerId = input.required<number>();

  protected readonly customer = signal<CustomerDetail | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly activeTabId = signal<CustomerDetailTabId>('identity');

  protected readonly tabLayout = computed<TabLayoutEntry[]>(() => {
    const c = this.customer();
    if (!c) return [];
    return this.layoutResolver.resolve(this.axisOf(c));
  });

  // ... loadCustomer, selectTab, saveClusterPatch, etc.
}
```

### § 4.3 Template skeleton

```html
<nav class="detail-tabs" role="tablist">
  @for (tab of tabLayout(); track tab.id) {
    <button class="detail-tab" [class.detail-tab--active]="activeTabId() === tab.id"
      role="tab" [attr.aria-selected]="activeTabId() === tab.id"
      (click)="selectTab(tab.id)">
      <span class="material-icons-outlined">{{ tab.iconName }}</span>
      {{ tab.labelKey | translate }}
    </button>
  }
</nav>

<div class="detail-content">
  @switch (activeTabId()) {
    @case ('identity') {
      <app-customer-identity-cluster
        [entity]="customer()!" [editing]="editing()" [saving]="saving()"
        (save)="saveClusterPatch($event)" (cancelled)="cancelEdit()" />
    }
    @case ('activity') {
      <app-customer-activity-cluster [customerId]="customer()!.id" />
    }
    /* ... other clusters ... */
  }
</div>
```

### § 4.4 Wiring `?tab=` to the URL

```ts
constructor() {
  // Hydrate from URL on init.
  if (this.route) {
    const tabFromUrl = this.route.snapshot.queryParamMap.get('tab') as CustomerDetailTabId | null;
    if (tabFromUrl) this.activeTabId.set(tabFromUrl);
  }

  // Reset the active tab if the resolver no longer lists it.
  effect(() => {
    const layout = this.tabLayout();
    if (layout.length === 0) return;
    if (!layout.some(t => t.id === this.activeTabId())) {
      this.activeTabId.set(layout[0].id);
    }
  });
}

protected selectTab(id: CustomerDetailTabId): void {
  this.activeTabId.set(id);
  if (this.router && this.route) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
```

For full-page detail surfaces (like `customers/:id/:tab`) the active tab lives
in a route param instead of a query param — the principle is identical, only
the navigation call changes.

### § 4.5 Per-step conditional fields

Within a single step component, branch the form rendering on form
control values via `@if (formControlValueSignal() === 'X') { ... }`.
Use `toSignal(form.controls.foo.valueChanges, { initialValue: ... })`
to bridge ReactiveForms into a Signal so `@if` can react.

For cross-step conditionality (a later step's fields depend on an
earlier step's saved values), bind the entity into the step via the
`entity` input — earlier-step values are persisted on the entity and
propagate down on workflow run state changes. No engine work needed.

---

## § 5. Worked Example: Part

**Spec source of truth:** `phase-4-output/part-type-field-relevance.md`.

### § 5.1 Files

| File                                                                       | Role                                                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------- |
| `parts/services/part-detail-layout-resolver.service.ts`                    | Resolver — 14 viable axis combos                      |
| `parts/components/part-clusters/part-identity-cluster.component.{ts,html}` | Identity cluster                                      |
| `parts/components/part-clusters/part-inventory-cluster.component.{ts,html}`| Inventory cluster                                     |
| `parts/components/part-clusters/part-cost-cluster.component.{ts,html}`     | Cost cluster                                          |
| `parts/components/part-clusters/part-activity-cluster.component.ts`        | Activity cluster (wraps shared activity section)      |
| `parts/components/part-clusters/part-files-cluster.component.{ts,html}`    | Files cluster                                         |
| `parts/components/part-clusters/part-clusters.shared.scss`                 | Shared cluster SCSS                                   |
| `parts/components/part-detail-panel/part-detail-panel.component.{ts,html}` | Tabbed shell                                          |

### § 5.2 Axis-to-tabs matrix

Two-axis: `procurementSource × inventoryClass`. 14 viable combos. Identity
and Activity → Files frame the layout on every combo.

| ProcurementSource | InventoryClass            | Middle tabs                                                                |
| ----------------- | ------------------------- | -------------------------------------------------------------------------- |
| Buy               | Raw                       | Sourcing, Inventory, Quality, Cost                                         |
| Buy               | Component / Subassembly / FinishedGood | Sourcing, Inventory, Quality, Cost, Alternates                |
| Buy               | Consumable                | Sourcing, Inventory, Cost (no Quality / Alternates)                        |
| Buy               | Tool                      | Sourcing, Inventory, Quality, Cost, Alternates                             |
| Make              | Component                 | Material, Inventory, MRP, Routing, Cost, Quality, Alternates               |
| Make              | Subassembly / FinishedGood | Material, BOM, Routing, Inventory, MRP, Cost, Quality, Alternates         |
| Make              | Tool                      | Material, BOM, Routing (no inventory — lives as Asset)                     |
| Subcontract       | Component                 | Sourcing, Inventory, Quality, Cost, Alternates                             |
| Subcontract       | Subassembly               | Sourcing, BOM, Inventory, Quality, Cost, Alternates                        |
| Phantom           | Subassembly / FinishedGood | BOM (only — never stocked, never QC'd)                                    |
| **default**       | **default**               | Sourcing, Inventory, Quality, Cost, Alternates (Buy + Component fallback)  |

The resolver returns Identity first, the matrix's middle next, then Activity
and Files last.

### § 5.3 Cluster patch flow

`saveClusterPatch(patch: Partial<PartDetail>)` in the panel translates the
patch into the `UpdatePartRequest` server contract and calls
`PartsService.updatePart`. Each cluster owns the subset of fields it knows
about; the shell simply merges and forwards. See
`part-detail-panel.component.ts` lines 286-321 for the canonical reference.

---

## § 6. Worked Example: Customer

### § 6.1 Axis choice

The `Customer` entity does not yet carry a `customerType` / `tier` /
`relationshipType` discriminator field. The single behavioral axis available
today is **lifecycle status** derived from the existing `IsActive` flag and
the `OpenInvoiceCount` summary metric. Pillar 5 picks this as the discriminator
and groups customers into three lifecycle states:

- **`Active`** — `IsActive = true` and at least one open document
  (estimate / quote / order / job / invoice). Full layout: every business
  cluster is relevant.
- **`Prospect`** — `IsActive = true` but zero open documents. No reason to
  show Orders / Invoices yet — the user is mid-onboarding.
- **`Archived`** — `IsActive = false`. Read-only layout — Pricing and
  procurement clusters disappear, only Identity / Activity / read-only history
  remain.

Rationale for the choice:

- Uses **existing data** on `Customer` (`IsActive`) plus the existing
  `CustomerSummary` aggregate fields. No schema migration.
- The lifecycle states are mutually exclusive and total — easy default
  branch (`Active` is the permissive fallback).
- Pragmatic: matches how customer service teams already think about a
  customer ("are we onboarding them, doing business, or have they wrapped?").
- Forward-compatible: when a real `CustomerType` discriminator (Direct /
  Distributor / Reseller / Internal) lands, the resolver can switch to a
  two-axis tuple with no shell-side change.

A `CustomerLifecycle` type is defined in
`features/customers/models/customer-lifecycle.type.ts`; the resolver consumes
it; the shell derives it from `(IsActive, summary metrics)` via a pure helper
on the resolver service (`deriveLifecycle()`).

### § 6.2 Per-axis tab layouts

Identity is always first; Activity is always last. Tabs marked **(placeholder)**
are not yet extracted into clusters and render the
`customers.detail.tabs.placeholderHelp` placeholder; they're listed by the
resolver so the existing Customer detail tabs (`Contacts`, `Addresses`,
`Estimates`, `Quotes`, `Orders`, `Jobs`, `Invoices`, `Interactions`)
continue to surface through the same UI.

| Lifecycle  | Middle tabs                                                                                |
| ---------- | ------------------------------------------------------------------------------------------ |
| `Active`   | Contacts, Addresses, Estimates, Quotes, Orders, Jobs, Invoices, Interactions               |
| `Prospect` | Contacts, Addresses, Estimates, Quotes, Interactions                                       |
| `Archived` | Contacts, Addresses, Invoices, Interactions                                                |
| **default** | Contacts, Addresses, Estimates, Quotes, Orders, Jobs, Invoices, Interactions              |

### § 6.3 Files

| File                                                                                  | Role                                              |
| ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `customers/services/customer-detail-layout-resolver.service.ts`                       | Resolver + `deriveLifecycle()` helper             |
| `customers/models/customer-lifecycle.type.ts`                                         | `CustomerLifecycle = 'Active' \| 'Prospect' \| 'Archived'` |
| `customers/components/customer-clusters/customer-clusters.shared.scss`                | Shared SCSS                                       |
| `customers/components/customer-clusters/customer-identity-cluster.component.{ts,html}`| Identity cluster (Name, Company, Email, Phone, Status, IsTaxExempt) |
| `customers/components/customer-clusters/customer-activity-cluster.component.ts`       | Activity cluster (wraps `<app-entity-activity-section>`) |
| `customers/pages/customer-detail/customer-detail.component.{ts,html}`                 | Refactored shell — uses resolver + clusters       |

The remaining customer tabs (`Contacts`, `Addresses`, `Estimates`, `Quotes`,
`Orders`, `Jobs`, `Invoices`, `Interactions`) keep their existing
`customer-{tab}-tab.component.ts` implementations for now — the shell just
mounts them through the resolver instead of hardcoding the tab list. Extracting
those into proper clusters is follow-up work.

### § 6.4 Save patch

`Customer` save uses `CustomerService.updateCustomer(id, request)` with the
existing `UpdateCustomerRequest` shape. The Identity cluster emits a
`Partial<CustomerDetail>` patch; the shell maps it onto `UpdateCustomerRequest`
fields (`name`, `companyName`, `email`, `phone`, `isActive`).

---

## § 7. Extending the Pattern to N Entities

To apply the pattern to a third entity (e.g. `Vendor`, `Job`, `Asset`):

1. **Pick the discriminating axis (or 2).** Read the entity. What single field
   most changes which other fields are relevant? Examples:
   - `Vendor` — `vendorKind` (`Manufacturer` / `Distributor` / `Subcontractor`).
   - `Job` — `jobType` (`Production` / `R&D` / `Maintenance`).
   - `Asset` — `assetType` (`Tooling` / `Machine` / `Vehicle` / `IT`).
2. **Enumerate viable values.** 3-6 is the sweet spot. Beyond 6, prefer two
   binary axes over one wide axis.
3. **Define the cluster groupings.** Walk every field on the entity. Group by
   domain concept until you've covered every field. Use the smell tests in §8.
   Identity and Activity are universal; the rest is per-entity.
4. **Decide which clusters to author now.** Identity + Activity are minimums.
   Other clusters can ship as placeholders (§3.5) and be authored in
   follow-ups. **Don't block Pillar work waiting for every cluster.**
5. **Write the resolver.** Pure function, default branch, identity-first /
   activity-last invariants enforced by tests (see § 8).
6. **Mount in the existing detail surface.** Most entities already have a
   detail dialog or page — refactor it to use the resolver instead of a
   hardcoded tab list. Don't create a new detail surface unless one doesn't
   exist.
7. **i18n keys.** Add `{entity}.detail.tabs.{tabId}` for every tab plus
   `placeholderHelp` for the placeholder body.
8. **Tests.** At minimum (a) resolver: each axis value's tab list + invariants;
   (b) one cluster smoke test per authored cluster.

### § 7.1.0 Pre-beta architectural debt (intentionally not paid down)

The codebase is at 0.0.x. Several "rollback safety" affordances were added
during the Pillar 1+3 refactor and explicitly **don't** carry forward:

- ~~**`Part.PartType` legacy column, `Part.IsSerialTracked` boolean,
  `Part.Material` free-text string, `Part.MoldToolRef`**~~ — **DONE**:
  dropped in migration `PreBeta_DropLegacyPartColumns`. The two-axis
  decomposition (`ProcurementSource` × `InventoryClass` × `ItemKindId`)
  replaces `PartType`; `TraceabilityType` replaces `IsSerialTracked`;
  `MaterialSpecId` (FK to ref_data) replaces `Material` string;
  `ToolingAssetId` replaces `MoldToolRef`.
- **MaterialSpec migration tool** — converting existing free-text
  `Material` strings to ref_data FK ids was scoped as future admin
  tooling. **NOT NEEDED**: any existing freeform Material strings reset
  to null on the next env refresh; users re-enter via the new dropdown.
  No migration code, no admin tool.
- ~~**Two transitional workflow definition aliases** (`part-assembly-guided-v1`,
  `part-raw-material-express-v1`)~~ — **DONE**: seed authors only the 14
  canonical combos, and `WorkflowSubstrateSeeder` soft-deletes any orphaned
  alias rows on next boot.
- ~~**`inferAxesFromLegacyPartType` heuristic** in the fork dialog~~ —
  **DONE**: replaced by the axis-based picker (`NewPartForkDialogComponent`
  rewrite). Each of the 11 viable (procurement × inventory) combos maps
  directly to its canonical workflow definition via
  `workflowDefinitionForCombo` in `parts.component.ts`.
- **In-flight workflow run migration shim** — runs started under the
  legacy 2-definition seed don't auto-upgrade to the 14-combo seeds.
  **NOT NEEDED**: pre-beta means no real in-flight runs to preserve.

**Pattern for future debt of this shape**: when a refactor moves data
between columns/entities, inline-comment the old path with a "remove in
v0.x.y after axis-based picker ships" note rather than carrying both
shapes forward indefinitely.

### § 7.1 Future-state hook — admin-overrideable layouts (Pillar 5 Phase 2, DEFERRED)

A future `entity_relevance_map` admin table would let ops override resolver
output without code changes (one row per `(entity_type, axis_value, tab_id)`).
Treat that as Phase 2 — the static resolver is sufficient for the first
several entities. When the table lands, the resolver becomes a fallback for
unconfigured combos.

**Why deferred** (vs. shipping with Pillar 5 Phase 1):

1. **Cost / value mismatch.** Real shops rarely override layouts per-tenant —
   the audit's per-combo defaults match well enough for ~95% of installs. The
   admin UI (CRUD over a JSONB tree) is non-trivial to build well; a lazy
   half-implementation would do more harm than good.
2. **Pattern stability concern.** With only two worked examples (Part +
   Customer), the resolver/cluster shape might still need to evolve. Locking
   it into a JSONB schema before a third extrapolation (Vendor / Job / Asset)
   risks codifying premature decisions.
3. **Capability gating already covers the most common need.** "Some fields
   shouldn't show on this install" is mostly handled by feature capabilities
   (`CAP-MD-PART-COMPLIANCE`, `CAP-ACCT-BUILTIN`, etc.) — the resolver can
   read capability state when ranking tabs. That's incremental work with
   higher leverage than full layout overrides.

**Sketch when it does land:**

```sql
CREATE TABLE entity_relevance_map (
  id              SERIAL PRIMARY KEY,
  entity_type     VARCHAR(64) NOT NULL,         -- 'part' / 'customer' / 'vendor'
  axis_signature  VARCHAR(255) NOT NULL,         -- e.g. 'Buy:Raw' for Part, 'Active' for Customer
  tab_layout      JSONB NOT NULL,                -- ordered TabLayoutEntry[]
  is_default      BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL,
  UNIQUE (entity_type, axis_signature)
);
```

The resolver service would `SELECT FROM entity_relevance_map WHERE entity_type=? AND axis_signature=?`. On hit, return the JSONB layout. On miss, fall through to the hardcoded resolver. Admin UI: a per-entity layout editor that lets ops add/remove/reorder tabs. Cache invalidation: on row update, broadcast a `LayoutChangedEvent` over SignalR so already-mounted detail dialogs can refresh.

Until ops actually *ask* for tenant-specific layouts, the static resolver wins on simplicity.

---

## § 8. Smell Tests

### § 8.1 "Should this be a cluster?"

A region of the entity should be its own cluster when **all** of the following
hold:

- It represents a coherent domain concept that a user thinks about as a unit
  ("inventory thresholds", "credit & terms", "pricing", "addresses").
- It has ≥3 fields **OR** a non-trivial sub-grid (table of contacts, list of
  addresses).
- It can be edited atomically — saving Identity should not require a Cost
  patch and vice versa.
- It's reused (or reusable) across ≥2 axis combos.

Don't make a cluster for a single field — surface it on Identity. Don't make
a cluster for a region that's only relevant to one rare combo — leave it on a
lower-priority tab.

### § 8.2 "Should this be its own tab?"

Promote a cluster to its own tab when:

- It's relevant to ≥2 viable axis values, AND
- It has ≥3 fields OR contains a sub-grid (table / timeline), OR
- It contains a long form (signature pad, file uploader, etc.) that doesn't
  share screen real estate well with other clusters.

When a cluster is relevant only to a single combo and has <3 fields, fold it
into Identity or co-locate with another cluster in the same tab. Avoid
single-field tabs.

### § 8.3 Cardinality bounds

- **Lower bound — 2 tabs minimum** (Identity + Activity). Anything less and
  the resolver isn't doing useful work.
- **Upper bound — 7-8 tabs per combo.** Beyond that, cognitive load tanks tab
  scanning. The Part audit tops out at 11 tabs for `Make + Subassembly` /
  `Make + FinishedGood`, which is on the edge — accepted because Make-with-BOM
  is genuinely complex.
- **Resolver branches — bound at the matrix size.** A 2-axis resolver with
  4×6 = 24 cells but only 14 viable combos is fine. A resolver with >20
  branches probably has too many axes — collapse one.

### § 8.4 Resolver invariants (test these)

Every resolver spec MUST include:

```ts
it('Identity always first; Activity always last across every combo', () => {
  for (const axis of ALL_AXIS_VALUES) {
    const layout = service.resolve(axis);
    expect(layout[0].id).toBe('identity');
    expect(layout[layout.length - 1].id).toBe('activity'); // or 'files' if you surface one
  }
});

it('unknown axis defaults to permissive layout', () => {
  expect(() => service.resolve('not-a-valid-value' as never)).not.toThrow();
});
```

### § 8.5 Cluster invariants (test these)

- Cluster reads required fields off `entity` input.
- Form is `disabled` when `editing()` is false; `enabled` when true.
- `save` emits a `Partial<EntityDetail>` patch when `onSave()` fires with a
  valid form.

---

## § 9. Anti-patterns

- **Hardcoding the tab list in the shell template.** Defeats the resolver.
  Iterate `tabLayout()` with `@for`.
- **Multi-cluster files.** One cluster per file (CLAUDE.md "ONE OBJECT PER
  FILE"). Tempting in early-stage extraction; pay the file cost.
- **Mutating the entity in a cluster.** Clusters emit patches, never call
  the service directly.
- **Skipping Identity-first / Activity-last.** Even tiny cluster sets should
  preserve the frame — users learn it once and it's worth the consistency.
- **Resolver throwing on unknown axis.** Defaults are mandatory. New axis
  values shipped after the resolver was authored should degrade gracefully.
- **Big-bang cluster extraction.** Authoring 8 clusters in a single dispatch
  is more refactoring risk than necessary. Ship Identity + Activity first;
  add clusters as their behavior becomes load-bearing.

---

## § 10. Checklist for a new entity

When applying the pattern to a third entity, every PR should check off:

- [ ] Axis chosen + documented in this file's § 6 (or in a sibling
      `phase-N-output/{entity}-detail-pattern.md`).
- [ ] `*-detail-layout-resolver.service.ts` created with `resolve(...)` pure
      function and identity-first / activity-last invariants.
- [ ] Resolver spec covers every axis value + the default branch + the
      identity-first / activity-last invariants.
- [ ] At least 2 cluster components authored: Identity + Activity. Others can
      be placeholders.
- [ ] One cluster smoke test per authored cluster.
- [ ] Existing detail surface refactored to drive tabs from the resolver
      (or new shell created if none existed).
- [ ] `?tab=<id>` (or `:tab` route param) wired to the URL.
- [ ] i18n keys added in `en.json` + `es.json`: `{entity}.detail.tabs.{tabId}`
      for each tab + `placeholderHelp` if any tab is a placeholder.
- [ ] `tsc --noEmit` passes for both `tsconfig.app.json` and
      `tsconfig.spec.json`.
- [ ] `vitest run` passes (test count delta documented).
- [ ] `ng lint` reports 0 errors.

---

*Pattern authoritatively scoped to the Pillar-4 Part decomposition. Pillar 5
ships the doc + Customer extrapolation. Future pillars apply to additional
entities under the §10 checklist.*
