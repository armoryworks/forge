# TODO — forge-commerce

> **Status:** Planning draft, not yet started. Future stage / implementation.
> **Created:** 2026-05-16
> **Owner:** Dan Hokanson
> **Tracking issue:** TBD (will be opened against the umbrella repo when work begins)

A future sibling repo in the Forge family (`github.com/armoryworks/forge-commerce`) that gives Forge a pluggable interface to third-party online retail systems. The objective is flexibility, not commitment to any single platform — shops should be able to swap their storefront without re-implementing their operational integration, and Forge should be the source of truth for products, inventory, pricing, and customer data regardless of which storefront fronts the catalog.

---

## Why this exists

Small-to-mid manufacturers running direct-to-consumer storefronts are stuck on aging or constraining e-commerce platforms more often than not. Common situations observed:

- Magento 1 shops still operating on an Adobe-EOL platform (since 2020) with no obvious migration path.
- Shopify shops outgrowing the platform's pricing or feature ceiling.
- WooCommerce shops hitting SKU-volume or performance limits.
- Etsy / eBay / Amazon Seller Central sellers whose marketplace presence is separate from any real operational system.
- Bespoke storefronts built years ago by someone who is no longer reachable.

Forge already wants to own products, inventory, pricing, and customer data as a system of record. The natural composition is: **Forge as the operational backend; storefronts as thin presentation layers.** A pluggable adapter framework lets shops swap their storefront without losing their operational data — and lets Forge serve shops on platforms AWT has never integrated with before, provided someone (AWT, the shop, or a contributor) writes the adapter.

This is the same pattern enterprise composable-commerce platforms (Commercetools, Elastic Path, etc.) sell at six-figure starting prices. There is no obvious equivalent at the small-manufacturer tier.

---

## Strategic context

- First adapter (Magento 1) is co-funded by an early customer engagement (SLP, planned 2026). Phase 3 of that engagement becomes the bootstrap of `forge-commerce` as an Upstream Contribution.
- Apache 2.0 licensed alongside core Forge. Adapters can be community-contributed.
- Lives in its own repo (`forge-commerce`) for clean separation from core Forge verticals. Loads alongside Forge.Api at deployment time, communicates with Forge over the documented public surface (MediatR notifications + Forge.Contracts events), never reaches into vertical internals.
- Becomes the technical asset that supports a sub-vertical marketing message: "Forge for D2C manufacturers escaping Magento 1 EOL." See Marketing Plan, Y2.

---

## Proposed architecture (port-and-adapter / hexagonal)

```
forge-commerce/
├── Forge.Commerce.Core/                # The abstract interface
│   ├── IChannelAdapter.cs             # Main interface adapters implement
│   ├── ICommerceClient.cs             # Outbound calls Forge makes (push inventory, push status)
│   ├── Events/                         # Common event types
│   │   ├── ChannelOrderReceived.cs
│   │   ├── ChannelOrderUpdated.cs
│   │   ├── ChannelOrderCancelled.cs
│   │   ├── ChannelRefundIssued.cs
│   │   ├── ChannelInventorySynced.cs
│   │   ├── ChannelProductPublished.cs
│   │   └── ChannelCatalogUpdated.cs
│   ├── Models/                         # Common DTOs (channel-agnostic)
│   │   ├── ChannelOrder.cs
│   │   ├── ChannelLineItem.cs
│   │   ├── ChannelProduct.cs
│   │   ├── ChannelVariant.cs
│   │   ├── ChannelCustomer.cs
│   │   ├── ChannelAddress.cs
│   │   ├── ChannelInventoryLevel.cs
│   │   └── ChannelFulfillment.cs
│   ├── Configuration/
│   │   ├── ChannelConfiguration.cs    # Per-channel config (credentials, mapping rules, sync cadence)
│   │   └── FieldMapping.cs            # How channel fields map to Forge fields
│   └── README.md
│
├── Forge.Commerce.Adapters/            # Platform-specific implementations
│   ├── Magento1/
│   │   ├── Magento1Adapter.cs
│   │   ├── Magento1Client.cs          # REST/SOAP API client
│   │   ├── Magento1Webhooks.cs        # Incoming webhook handlers
│   │   ├── Translators/               # Translate Magento concepts ↔ Forge concepts
│   │   └── README.md
│   ├── Magento2/
│   ├── Shopify/
│   ├── WooCommerce/
│   ├── BigCommerce/
│   ├── Squarespace/
│   ├── Etsy/                          # Marketplace, different shape (see open questions)
│   ├── Generic/                       # Bespoke / custom adapters (REST/GraphQL template)
│   └── ...
│
├── Forge.Commerce.Dispatch/            # Orchestration layer (loads in Forge.Api)
│   ├── ChannelDispatcher.cs           # Routes Forge events to enabled adapters
│   ├── ChannelWebhookReceiver.cs      # Receives platform webhooks, normalizes, publishes to MediatR
│   ├── ChannelSyncScheduler.cs        # Hangfire jobs for periodic full syncs
│   └── README.md
│
├── Forge.Commerce.Migration/           # One-time ETL helpers for legacy platforms
│   ├── Magento1Extractor/             # Pull catalog/customer/order history from Magento 1
│   ├── Magento2Extractor/
│   └── README.md
│
├── Forge.Commerce.Tests/               # Adapter contract tests
│   └── ChannelAdapterContractTests.cs # Every adapter must pass these
│
└── docs/
    ├── adapter-author-guide.md         # How to write a new adapter
    ├── channel-config-reference.md     # Configuration schema
    ├── event-catalog.md                # All emitted/consumed event types
    └── deployment.md                   # How to enable in a Forge install
```

### Key abstraction boundaries

1. **`IChannelAdapter` is the seam.** Every adapter implements one interface with a fixed set of operations: `IngestOrder`, `UpdateOrderStatus`, `PushInventoryLevel`, `PublishProduct`, `IngestCustomer`, etc. Forge.Commerce.Dispatch fans these out by channel without knowing platform-specific details.

2. **Adapter authors translate their world to Forge's world.** Magento's "configurable product" maps to a Forge product with variants. Etsy's "listing" maps similarly. Shopify's "fulfillment" maps to Forge's shipment. The adapter holds the translation logic; Forge.Commerce.Core defines what the destination concepts look like.

3. **Adapters depend only on Forge.Contracts and Forge.Commerce.Core.** Never on vertical internals (Forge.Sales, Forge.MasterData, etc.). This is the same dependency rule that governs Forge's internal verticals — see Forge Architecture doc in 40 — Product / Roadmap & Planning.

4. **Channel configuration is per-tenant, per-channel.** A single Forge install can have Magento 1 + Shopify + Etsy enabled simultaneously, each with its own credentials, sync cadence, and field-mapping rules. The configuration is admin-editable at runtime.

5. **No platform locks Forge in or out.** A shop on Magento 1 today can switch to Shopify next year. The adapter changes; Forge keeps its data. The shop's customer history, inventory, and order patterns are not held hostage by the storefront vendor.

---

## Target platforms (initial prioritization)

### Tier 1 — Build during 2026–2027

| Adapter      | Driver                                              | Effort estimate | Phase  |
|--------------|-----------------------------------------------------|-----------------|--------|
| Magento 1    | SLP engagement Phase 3 (EOL platform, real customer) | 100–150 hrs     | First  |
| Magento 2    | Migration target from Magento 1                     | 80–120 hrs      | Second |
| Shopify      | Largest SMB market share                            | 80–120 hrs      | Third  |
| WooCommerce  | Long tail of WordPress shops                        | 80–120 hrs      | Fourth |

### Tier 2 — Build when first customer demands it

- BigCommerce
- Squarespace Commerce
- Wix Commerce
- Custom REST/GraphQL template (for bespoke storefronts) — possibly the second build to validate that the abstraction works for non-canonical platforms

### Tier 3 — Marketplace platforms (different shape; see open questions)

- Etsy
- Amazon Seller Central
- eBay
- Walmart Marketplace

Marketplaces have additional complexity (FBA-style fulfillment, marketplace-owned customers, listing approval workflows, marketplace fees as separate accounting concerns) that probably warrants a `IMarketplaceAdapter` subtype or extension of `IChannelAdapter`. Worth a separate design pass before building.

### Tier 4 — Forge-native storefront (far future, optional)

If demand surfaces for shops that want to leave their commercial platform entirely and have Forge serve the storefront directly, a `Forge.Commerce.Storefront` reference implementation could ship. Real engineering scope (cart, checkout, payments, SEO, performance, accessibility). Not in the v1 plan; documented as a possible future direction.

---

## Phasing

### Phase A — Architectural foundation (~120–160 hours)

- [ ] Define `IChannelAdapter` interface
- [ ] Define `ICommerceClient` interface
- [ ] Common event types in Forge.Commerce.Core
- [ ] Common DTOs / models
- [ ] ChannelConfiguration + persistence schema
- [ ] ChannelDispatcher with MediatR integration
- [ ] ChannelWebhookReceiver with security validation
- [ ] Adapter contract test framework
- [ ] One stub adapter ("EchoChannel") for integration testing
- [ ] Documentation: adapter-author-guide.md, event-catalog.md
- [ ] CI: NetArchTest rules enforcing adapter dependency boundaries

### Phase B — Magento 1 adapter (~100–150 hours, SLP-funded)

- [ ] Magento 1 REST/SOAP client
- [ ] Authentication flow (admin OAuth or REST token)
- [ ] Order ingestion (webhook + polling fallback)
- [ ] Order status update back to Magento
- [ ] Inventory level sync (Forge → Magento)
- [ ] Product publication (Forge → Magento, one-direction)
- [ ] Customer ingestion
- [ ] One-time historical ETL helper
- [ ] Magento-specific translators (configurable products, attribute sets, tax classes)
- [ ] Adapter contract tests pass
- [ ] Integration test against a Magento 1 demo instance
- [ ] Documentation: Magento1/README.md with config schema, gotchas

### Phase C — Magento 2 or Shopify (~80–120 hours, second-customer-driven)

Second adapter validates the abstraction. Choose Magento 2 if Magento-1-migration customers are the early market; choose Shopify if non-Magento customers are appearing faster.

- [ ] Same scope as Magento 1, different platform
- [ ] Refactor abstraction where the second adapter reveals weaknesses
- [ ] Documentation: adapter README

### Phase D — Long-tail expansion

Build adapters as customer demand justifies. Each new adapter further validates (or stresses) the abstraction. Adapters that strain the abstraction may signal that `IChannelAdapter` needs an extension point or a new event type. Expect refinements through adapter 4–5.

### Phase E — Optional future work

- [ ] Marketplace-adapter subtype (`IMarketplaceAdapter`) for Etsy, Amazon, eBay
- [ ] `Forge.Commerce.Storefront` reference storefront
- [ ] Multi-channel SKU mapping (one Forge product → different SKU IDs per channel)
- [ ] Channel-specific pricing rules (different price on Etsy vs. own storefront)
- [ ] Tax integration delegation (Avalara, TaxJar) at the dispatcher level
- [ ] Payment status mirroring (Stripe, PayPal, channel-internal)

---

## Open design questions

1. **Single repo for all adapters, or one repo per adapter?** Single repo makes versioning and shared-abstraction changes easier. Per-adapter repos make contribution easier for community contributors who only care about one platform. Recommendation: single repo (`forge-commerce`) with adapters as subprojects, until contribution volume warrants splitting.

2. **How do marketplaces (Etsy, Amazon, eBay) fit the abstraction?** Marketplaces own the customer relationship, handle fulfillment differently, and add marketplace-fee accounting concerns. Probably needs an `IMarketplaceAdapter` subtype. Design pass required before building first marketplace adapter.

3. **Currency and multi-currency.** If a shop sells in multiple currencies on a single channel (Shopify Markets, for example), how does Forge model that? Single-currency-per-order, with conversion at order time? Multi-currency native? Worth a decision before adapter 1 ships.

4. **Tax handling.** Delegate tax calculation to platform-side (Magento/Shopify handle it, Forge accepts the result), delegate to a tax service (Avalara, TaxJar) at the dispatcher level, or compute in Forge? Recommendation: accept platform-computed tax in v1, expose the breakdown as DTO fields, defer tax-service integration to a later phase.

5. **Fulfillment ownership.** When an order is placed via Shopify, does Shopify trigger fulfillment (Forge records) or does Forge trigger fulfillment (Shopify is notified)? Probably configurable per-channel; default depends on customer's existing operation.

6. **Payment status mirroring.** Forge doesn't process payments. Adapters need to surface payment status from the platform (paid / pending / refunded / chargeback). What's the canonical state model? Recommendation: simple enum (Pending, Paid, PartiallyRefunded, Refunded, ChargedBack) with platform-specific raw payload preserved in JSONB for advanced cases.

7. **Inventory reservation timing.** Commit Forge inventory on order received (risk: oversell if order doesn't complete) or on order paid (risk: cart abandonment after Forge committed)? Recommendation: configurable per-channel; document the trade-off; default to commit-on-received.

8. **Sync cadence.** Webhook-driven for events, polling fallback for resilience. What's the polling cadence default (5 min? 15 min?), and is it tunable? Recommendation: 5 min default, admin-tunable per channel.

9. **Conflict resolution.** If Forge and the channel disagree about a record (different price, different inventory level), which wins? Recommendation: Forge wins for inventory and pricing; channel wins for order details that originated there.

10. **API versioning.** Magento 1's API differs from Magento 2's. Shopify versions its API quarterly. Adapters need to handle platform API drift. Recommendation: per-adapter version pinning in configuration, with adapter authors responsible for testing against specific API versions.

---

## Acceptance criteria for v1 (Phase A + Phase B)

- [ ] `Forge.Commerce.Core` interface package published.
- [ ] Adapter contract test suite exists and passes.
- [ ] Magento 1 adapter passes the contract test suite.
- [ ] Magento 1 adapter handles: incoming order webhook → Forge sales order created; Forge inventory change → Magento product inventory updated; Forge order status change → Magento order status updated.
- [ ] One real customer (SLP) running on the Magento 1 adapter in production for at least 30 days without manual intervention.
- [ ] Adapter-author guide is complete enough that a non-Armory-Works developer could write a new adapter from it.
- [ ] Apache 2.0 LICENSE, NOTICE, README, CONTRIBUTING in place.
- [ ] CI green (unit tests + contract tests + NetArchTest dependency rules).

---

## Sequencing with other Forge work

- **Blocks on:** Apache 2.0 relicense of core Forge complete (so the `forge-commerce` repo can ship under Apache 2.0 from day one, not under any inherited GPL).
- **Blocks on:** Forge Architecture doc's modular monolith refactor stable enough that Forge.Contracts events are reliable (the dispatch layer subscribes to these).
- **Should not block:** Core Forge feature work. `forge-commerce` is additive; core Forge runs fine without it.
- **Related to:** PRESET-08 Professional Services work (different track; no direct dependency).
- **Related to:** Vertical-pack concept (see AWT three-year plan §5.2). `forge-commerce` is the first productized OSS asset that's not a vertical pack itself, but a substrate for D2C-manufacturer vertical packs.

---

## Customer-engagement implications

The first paid engagement that exercises `forge-commerce` will be SLP Phase 3 (Magento 1 adapter, planned 2026–2027). SLP's funding bootstraps the framework as an Upstream Contribution. See `30 — Clients / Starting Line Products / 01-Discovery / SLP — Pre-Engagement Analysis & Sizing` for the engagement structure.

Subsequent adapter work should target customers whose storefront-platform pain is real and current. Marketing message: "Forge replaces the operational layer; keep your storefront or migrate when ready, on your terms."

---

## Not in scope

- A SaaS managed-hosting offering for `forge-commerce` (AWT does not host).
- Storefront design / frontend work beyond the optional far-future `Forge.Commerce.Storefront`.
- Marketplace-fee accounting beyond pass-through reporting.
- Order routing across multiple fulfillment locations (this is core Forge's job, not the adapter's).
- B2B EDI integration with retail customers' procurement systems (different problem, separate future repo if pursued).

---

## Owner notes for future implementer

When Phase A starts, the first hour of work should be reading:

1. Forge Architecture doc — `40 — Product / Roadmap & Planning / Forge Architecture — Modular Monolith with Vertical Bounded Contexts` in AWT Google Drive. Understand the bounded-context rules and the MediatR notification pattern.
2. SLP engagement analysis — `30 — Clients / Starting Line Products / 01-Discovery / SLP — Pre-Engagement Analysis & Sizing`. Understand what customer 1 actually needs.
3. Magento 1 REST API documentation (archived; not Adobe-hosted anymore). Document any quirks discovered.

The temptation will be to start by writing the Magento 1 adapter and back-deriving the abstraction. Resist. Build Phase A first; the abstraction surfaces honestly only when designed without a specific platform's shape in mind. The "EchoChannel" stub adapter is there specifically to keep Phase A honest.
