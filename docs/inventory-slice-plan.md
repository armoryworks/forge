# Inventory module: first build slice

The first module to ship under the modular-onboarding plan
(see modular-onboarding.md). Goal: a customer can turn on Inventory by itself and
use it day one, with no jobs, purchase orders, sales, invoicing, or accounting,
and grow later without re-entering anything.

Most of this is assembly over capabilities and endpoints that already exist. The
genuinely new code is marked NEW.

## What the customer touches

- A home screen that is forgiving for someone who is not deep in software.
- Manage stock: receive, use, move, count, find a part.
- Manage parts, with import for the initial load.
- Locations are optional. Off to start (single-location mode), on when they need
  to track where things are kept.

## Design points carried in from the spec

- Single-location mode is the default. With Locations off, stock is tracked per
  part at one default location the system creates, and no location or bin field
  appears in any transaction.
- Manual inventory always works on its own. Receive, Use, Move, and Count never
  require a purchase order or a shipment, even when those modules are on later.
- The standalone home is three tabs: Kiosk (default), Tasks, Dashboard.

## The items

### 1. Foundation: capability bundle and single-location mode (NEW)

- Define the Inventory bundle as data: core capabilities plus the optional
  sub-toggles (Locations and bins, Lots, Cycle counts, Hazmat), with pull-ins
  read from the existing dependency graph.
- Single-location mode: on enable, ensure one default location and bin exist
  (seed-ensure, the same idempotent pattern used elsewhere). When the Locations
  sub-capability is off, the stock endpoints default to that location, and the UI
  hides the location and bin field.
- Everything else sits on this, so it is first.

### 2. Friendly stock verbs

- Receive (stock in), Use (stock out), and Count (set on-hand) over the endpoints
  that already exist: AdjustStock, SetOnHandQuantity. Move appears only when
  Locations is on (TransferStock).
- Each is a simple form: find the part by search or scan, enter a quantity and a
  reason, confirm. Audited and reversible. Mostly relabeling and layout over
  working endpoints.

### 3. Inventory home, three tabs

- Kiosk tab (default): reuse the shop-floor kiosk surface, pointed at the stock
  verbs and the scanner.
- Tasks tab: the action buttons, the on-hand list with search, low stock up top.
- Dashboard tab: inventory widgets from the existing widget grid.
- Route an inventory-only install to this home.

### 4. Setup essentials

- Parts: create, plus CSV import for the initial catalog. Confirm whether a parts
  import already exists; build it if not (NEW if missing).
- Opening balances: a load-starting-stock flow over SetOnHandQuantity.
- Reorder points: min and max per part (safety stock).
- A short guided first run ties these together.

### 5. Quick-start entry

- The module picker with the Inventory toggle and its sub-features, and a start
  button. For this slice it can be the Inventory path applying the bundle through
  the existing capability admin API, then grow into the full multi-module picker.

### 6. Verify and ship dark

- Tests for the manual stock ops, single-location mode, and the bundle.
- Deploy behind the capability so it stays dark until enabled, then switch it on
  for a test install for Jesco to try.

## Build order

1, then 2, then 4, then 3, then 5. Item 1 unlocks a working stock model; 2 and 4
make it usable and loadable; 3 makes it pleasant; 5 is the front door. 6 runs
alongside.

## Honest new code

- Single-location mode (default location, hide the location field). Contained.
- The three-tab home, mainly the Tasks tab and the tab shell; the kiosk and the
  widgets already exist.
- Parts CSV import, only if one is not already present.

The stock engine, the manual adjust and set-on-hand and transfer endpoints, the
kiosk, the scanner, the widget grid, and the capability gating are all already
built.
