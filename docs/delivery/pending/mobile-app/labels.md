---
title: Forge label and QR formats
type: delivery
status: in-progress
id: mobile-labels
updated: 2026-08-25
depends_on: mobile-app-plan
---

# Label and QR formats

Derived from the server's single source of truth, `forge-api/forge.api/Services/BarcodeService.cs`
(`Prefixes` table) and the `barcodes` table. This documents what already ships; nothing here is new
encoding. The mobile app and the kiosk share one parser (`forge-ui/shared/utils/scan-code.ts`).

## Internal codes

`{PREFIX}-{naturalIdentifier}`; on a collision the entity id is appended: `{PREFIX}-{natural}-{id}`.
Natural identifiers are the human-readable numbers from the business-identifier registry
(`JOB-1042`, `PRT-AX-200`, `LOC-A-01-3`, `LOT-20260825-003`). Prefix match is case-insensitive;
the value after the prefix is matched exactly against the `barcodes.value` column.

| Entity | Prefix | Example | Mobile action sheet |
|---|---|---|---|
| Employee badge | `EMP` | `EMP-0042` | identify (shared device), clock |
| Part | `PRT` | `PRT-AX-200` | details, move stock |
| Job traveler | `JOB` | `JOB-1042` | start / complete / advance / details |
| Sales order | `SO` | `SO-10077` | open in web |
| Purchase order | `PO` | `PO-3311` | open in web |
| Asset | `AST` | `AST-CNC-3` | open in web |
| Bin / storage location | `LOC` | `LOC-A-01-3` | move stock (from / to) |
| Lot | `LOT` | `LOT-20260825-003` | lot picker in move stock |

## GS1 parts

When a part carries a licensed GTIN (`parts.gtin`, `CAP-MD-GS1`), its system barcode is the raw
GTIN (8/12/13/14 digits, no prefix) with `identity_type = Gs1`. A scanned all-digit value of those
lengths is looked up as a GTIN before anything else.

## Manual (alternate) barcodes

Users may attach vendor SKUs or manufacturer UPCs as `barcode_source = Manual` rows. They resolve
through the same `barcodes.value` lookup; the app never parses their structure.

## Device-enrollment QR

JSON, not a barcode: `{ "server", "token", "name", "certSha256", "shared" }`. See
`mobile-enrollment.md`. The scanner recognizes it by the JSON shape, never by prefix.

## Resolution order on the phone

1. JSON with `server` + `token` → enrollment.
2. Exact `barcodes.value` lookup via `POST /api/v1/mobile/scan/resolve` (server-side; covers
   internal, GS1, and manual codes, and the collision suffix).
3. Local prefix parse only for offline hints (which action sheet to show while the lookup runs).

## Unknown codes

Distinct double-buzz haptic + "Not a Forge code" — never silent, never a navigation.
