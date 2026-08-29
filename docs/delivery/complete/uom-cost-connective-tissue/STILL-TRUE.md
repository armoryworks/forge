# Still true at archive time (2026-08-29)

Receiving converts purchase unit → base UoM into the bin
(`ReceivePurchaseOrder.cs`), but **auto-replenishment does not**.
`AutoPurchaseOrderJob` has no awareness of `PartPurchaseUnit` /
`ContentQuantity`; it still rounds to the legacy `VendorPart.PackSize`
and never stamps `PurchaseUnitId` on the line it generates.

That is the deferral this effort recorded ("auto-PO whole-option
rounding — risky, its base-unit suggestions remain valid + buyer-
reviewed"), not an unfinished item. It is written down here because the
deferral list is the only thing standing between a reader's reasonable
assumption and a wrong purchase order.
