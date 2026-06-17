# Forge release notes

What shipped and why, newest first. Each entry covers a release across the apps:
the API, the web app, and the database schema (forge-db). This file is the short
version. The full, detailed notes for a week are in the releases/ folder, one
file per week.

The three apps version on their own, so each entry is dated and lists the
version of each app that went out. Older entries get folded into a short
"between version X and version Y" line once they are no longer current. Entries
marked pinned are kept word for word and are never folded.


## June 17, 2026 (API 0.1.2)

The database schema moved out of the API and into the forge-db project. The API
no longer carries Entity Framework migrations. At startup it applies one schema
file, built from forge-db, but only when the database is empty. An existing
database is left alone.

The reason is to have one place that owns the schema, including the parts the old
setup could not describe on its own: the vector search extension used for
document search, and the database triggers that stop posted accounting entries
from being changed. No data changed on any server in this release.


## June 17, 2026 (API 0.1.0, Web 0.1.0)

First 0.1 release. The version moved off the 0.0.x line to mark two things: the
database moving to the forge-db project, and the accounting suite reaching
feature complete. The accounting features stay turned off until go-live.

Order and quoting fixes:

- Part search on the job edit screen returns results again. It had been failing
  with no visible error because the screen was not reading the newer paged
  response from the parts list.
- Picking a part on a quote or sales order line now fills in that customer's
  price automatically, from their price list.
- Draft sales orders made from a quote can now have their PO number, credit
  terms, and requested delivery date edited. Before, there was no way to set
  those after the quote was turned into an order.
- Turning an estimate into a quote now carries the line items across. If the
  estimate was only a single total, that total comes across as one lump sum line
  you can break out later.
- A sales order created from an accepted quote now appears in the Sales Orders
  list as a draft, so it is no longer missing until someone confirms it.
- A new job can be linked to an open sales order line as you create it. By
  default the picker shows only lines that do not already have an open job, with
  a checkbox to show the rest.

This release went out to all three installs: the two armoryworks servers and the
Armory Plastics server.
