# EDI (Electronic Data Interchange) — Functional Reference

## 1. Overview

Forge includes an EDI subsystem for exchanging structured business documents (purchase orders, invoices, advance ship notices) with trading partners using X12 and EDIFACT standards. The system supports multiple transport methods (AS2, SFTP, VAN, Email, API, Manual), transaction lifecycle tracking with retry support, per-partner field mappings, and inbound polling.

**Key entities:** `EdiTradingPartner`, `EdiTransaction`, `EdiMapping`

**Key interfaces:** `IEdiService` (document processing lifecycle), `IEdiTransportService` (transport-level send/poll/test)

**Access:** Admin and Manager roles only. The EDI panel is located within the Admin feature area.

---

## 2. Routes

EDI management is embedded within the Admin section as a tab/panel, not a standalone route. The panel component is `EdiPanelComponent` at `admin/components/edi-panel/`.

| Location | Component | Description |
|----------|-----------|-------------|
| `/admin/edi` | `EdiPanelComponent` | Trading partners + transactions management |

The panel uses an internal signal-based sub-tab system (not URL-routed) with two tabs: "Trading Partners" and "Transactions".

---

## 3. Trading Partners

### 3.1 Entity

```csharp
public class EdiTradingPartner : BaseAuditableEntity
{
    public string Name { get; set; }
    public int? CustomerId { get; set; }              // Link to Customer entity
    public int? VendorId { get; set; }                // Link to Vendor entity

    // EDI identifiers
    public string QualifierId { get; set; }           // e.g., "ZZ", "01", "08"
    public string QualifierValue { get; set; }        // Partner's EDI ID value
    public string? InterchangeSenderId { get; set; }
    public string? InterchangeReceiverId { get; set; }
    public string? ApplicationSenderId { get; set; }
    public string? ApplicationReceiverId { get; set; }

    // Format & transport
    public EdiFormat DefaultFormat { get; set; }      // X12 or Edifact
    public EdiTransportMethod TransportMethod { get; set; }
    public string? TransportConfigJson { get; set; }  // Connection config (host, credentials, etc.)

    // Processing rules
    public bool AutoProcess { get; set; }             // Auto-process inbound documents
    public bool RequireAcknowledgment { get; set; }   // Require 997/CONTRL acknowledgment
    public string? DefaultMappingProfileId { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public int? TestModePartnerId { get; set; }       // Partner ID for test mode routing
}
```

### 3.2 Trading Partners DataTable

The Partners sub-tab displays a `DataTableComponent` with `tableId="edi-partners"`.

**Columns:**

| Column | Field | Width | Notes |
|--------|-------|-------|-------|
| Name | `name` | auto | Sortable |
| Customer | `customerName` | 150px | Sortable. Shows `--` if null |
| Vendor | `vendorName` | 150px | Sortable. Shows `--` if null |
| Format | `defaultFormat` | 90px | Sortable. Raw enum value (X12/Edifact) |
| Transport | `transportMethod` | 100px | Sortable |
| Txns | `transactionCount` | 70px | Sortable, right-aligned |
| Errors | `errorCount` | 70px | Sortable, right-aligned. Red chip if > 0 |
| Active | `isActive` | 70px | Center-aligned. Green check or gray cancel icon |
| Actions | -- | 100px | Test / Edit / Delete buttons |

**Row actions:**
- **Test connection** (wifi_tethering icon): Calls `POST /trading-partners/{id}/test`. Shows success/failure snackbar.
- **Edit** (edit icon): Opens partner dialog pre-filled with current values.
- **Delete** (delete icon, danger style): Calls `DELETE /trading-partners/{id}`. Soft-delete.

### 3.3 Partner Dialog

Opened for both create and edit operations. Width: 520px.

**Form fields:**

| Field | Control | Validation | Default | Notes |
|-------|---------|------------|---------|-------|
| Name | `<app-input>` | Required, max 200 chars | `''` | Partner display name |
| Qualifier ID | `<app-input>` | Required, max 10 chars | `'ZZ'` | EDI qualifier code (e.g., ZZ=mutually defined, 01=DUNS, 08=UCC) |
| Qualifier Value | `<app-input>` | Required, max 100 chars | `''` | Partner's EDI identification value |
| Format | `<app-select>` | -- | `X12` | Options: X12, EDIFACT |
| Transport | `<app-select>` | -- | `Manual` | Options: AS2, SFTP, VAN, Email, API, Manual |
| Auto Process | `<app-toggle>` | -- | `true` | Automatically process inbound documents |
| Require Ack | `<app-toggle>` | -- | `true` | Require functional acknowledgment (997/CONTRL) |
| Notes | `<app-textarea>` | -- | `''` | Free-text notes |

**Layout:** Name is full-width. Qualifier ID and Qualifier Value are side-by-side (`.dialog-row`). Format and Transport are side-by-side. Auto Process and Require Ack are side-by-side toggles. Notes is full-width.

**Validation popover:** Configured for Name, Qualifier ID, and Qualifier Value fields.

**Footer buttons:** Cancel (secondary) | Create/Save (primary, disabled when invalid or saving).

---

## 4. Transaction Lifecycle

### 4.1 Entity

```csharp
public class EdiTransaction : BaseAuditableEntity
{
    public int TradingPartnerId { get; set; }
    public EdiDirection Direction { get; set; }           // Inbound or Outbound
    public string TransactionSet { get; set; }            // e.g., "850", "810", "856"
    public string? ControlNumber { get; set; }            // ISA control number
    public string? GroupControlNumber { get; set; }       // GS control number
    public string? TransactionControlNumber { get; set; } // ST control number

    // Content
    public string RawPayload { get; set; }                // Raw EDI document
    public string? ParsedDataJson { get; set; }           // Parsed structured data
    public int? PayloadSizeBytes { get; set; }

    // Processing
    public EdiTransactionStatus Status { get; set; }
    public string? RelatedEntityType { get; set; }        // e.g., "PurchaseOrder", "Invoice"
    public int? RelatedEntityId { get; set; }             // FK to related entity
    public DateTimeOffset? ReceivedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorDetailJson { get; set; }
    public int RetryCount { get; set; }
    public DateTimeOffset? LastRetryAt { get; set; }

    // Acknowledgment
    public int? AcknowledgmentTransactionId { get; set; } // Self-FK to 997/CONTRL
    public bool IsAcknowledged { get; set; }
}
```

### 4.2 Transaction Statuses

```csharp
public enum EdiTransactionStatus
{
    Received,       // Document received, not yet parsed
    Parsing,        // Parsing in progress
    Parsed,         // Successfully parsed
    Validating,     // Validation in progress
    Validated,      // Passed validation
    Processing,     // Business logic processing
    Applied,        // Successfully applied to system (created PO, SO, etc.)
    Error,          // Failed at any stage
    Acknowledged,   // Functional acknowledgment sent/received
    Rejected        // Rejected by validation or business rules
}
```

**Status chip colors in UI:**
- `Applied`: green (success)
- `Error`, `Rejected`: red (error)
- `Received`: blue (info)
- `Parsing`, `Processing`, `Validating`: yellow (warning)
- `Acknowledged`: gray (muted)

### 4.3 Direction

```csharp
public enum EdiDirection
{
    Inbound,    // Received from trading partner
    Outbound    // Sent to trading partner
}
```

**Direction chip colors:** Inbound = blue (info), Outbound = primary.

### 4.4 Inbound Processing Flow

1. **Receive:** `POST /api/v1/edi/receive` with `{ rawPayload, tradingPartnerId }` -- calls `IEdiService.ReceiveDocumentAsync()`, creates transaction with `Received` status
2. **Parse:** `IEdiService.ParseTransactionAsync()` -- extracts envelope/header/detail segments into `ParsedDataJson`
3. **Process:** `IEdiService.ProcessTransactionAsync()` -- applies business logic (e.g., creates PO from 850, sets `RelatedEntityType`/`RelatedEntityId`)
4. **Acknowledge:** If partner requires acknowledgment, `IEdiService.Generate997Async()` generates a functional acknowledgment

### 4.5 Outbound Generation

`POST /api/v1/edi/send/{entityType}/{entityId}` with `{ tradingPartnerId }`:

| Entity Type | IEdiService Method | Transaction Set | Description |
|-------------|-------------------|-----------------|-------------|
| `shipment` | `GenerateAsnAsync()` | 856 (ASN) | Advance Ship Notice |
| `invoice` | `GenerateInvoiceEdiAsync()` | 810 | Invoice |
| `sales-order` | `GeneratePoAckAsync()` | 855 | Purchase Order Acknowledgment |

After generation, `IEdiService.SendTransactionAsync()` transmits via the configured transport method.

### 4.6 Transactions DataTable

The Transactions sub-tab displays a `DataTableComponent` with `tableId="edi-transactions"`.

**Filter bar:**
- Direction: `<app-select>` with All / Inbound / Outbound
- Status: `<app-select>` with All / Received / Parsing / Parsed / Processing / Applied / Error / Acknowledged / Rejected

Changing either filter triggers `loadTransactions()`.

**Columns:**

| Column | Field | Width | Notes |
|--------|-------|-------|-------|
| Partner | `tradingPartnerName` | 150px | Sortable |
| Dir | `direction` | 90px | Sortable, filterable (enum). Direction chip |
| Set | `transactionSet` | 60px | Sortable, center-aligned |
| Control # | `controlNumber` | 120px | Sortable |
| Status | `status` | 110px | Sortable, filterable (enum). Status chip |
| Entity | `relatedEntityType` | 100px | Sortable. Shows `--` if null |
| Received | `receivedAt` | 110px | Sortable, date type. Format: `MM/dd/yyyy HH:mm` |
| Retries | `retryCount` | 70px | Sortable, right-aligned |
| Actions | -- | 80px | Retry button (error status only) |

**Row click:** Opens transaction detail dialog.

**Retry action:** Only shown for `Error` status rows. Calls `POST /transactions/{id}/retry`.

### 4.7 Transaction Detail Dialog

Width: 800px. Opened when clicking a transaction row.

**Header fields (4-column grid):**
- Partner name
- Direction (chip)
- Transaction Set
- Status (chip)

**Error section:** Displayed only when `errorMessage` is present. Red error block with error icon.

**Raw Payload section:** Full EDI document displayed in a `<pre>` block.

**Parsed Data section:** Displayed only when `parsedDataJson` is present. JSON displayed in a `<pre>` block.

**Footer:** Single "Close" button (primary).

**Detail model extends base transaction with:**
- `groupControlNumber`, `transactionControlNumber` -- X12 envelope identifiers
- `errorDetailJson` -- structured error details
- `lastRetryAt` -- timestamp of most recent retry
- `acknowledgmentTransactionId` -- FK to the 997/CONTRL transaction
- `rawPayload` -- full EDI document text
- `parsedDataJson` -- parsed structured data

---

## 5. Field Mappings

### 5.1 Entity

```csharp
public class EdiMapping : BaseAuditableEntity
{
    public int TradingPartnerId { get; set; }
    public string TransactionSet { get; set; }     // e.g., "850", "810"
    public string Name { get; set; }               // Mapping profile name
    public string FieldMappingsJson { get; set; }  // JSON array of field mapping rules
    public string ValueTranslationsJson { get; set; }  // JSON array of value translation rules
    public bool IsDefault { get; set; }            // Default mapping for this transaction set
    public string? Notes { get; set; }
}
```

### 5.2 API Endpoints

Mappings are scoped to a trading partner:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/edi/trading-partners/{id}/mappings` | List mappings for a partner |
| POST | `/api/v1/edi/trading-partners/{id}/mappings` | Create mapping |
| PUT | `/api/v1/edi/mappings/{id}` | Update mapping |
| DELETE | `/api/v1/edi/mappings/{id}` | Delete mapping |

### 5.3 Mapping Configuration

Mappings are stored as JSON arrays:

**`FieldMappingsJson`** -- maps EDI segment/element positions to system entity fields:
```json
[
  { "ediSegment": "BEG03", "entityField": "PurchaseOrder.PoNumber" },
  { "ediSegment": "DTM02", "entityField": "PurchaseOrder.DueDate" }
]
```

**`ValueTranslationsJson`** -- translates EDI code values to system values:
```json
[
  { "ediValue": "EA", "systemValue": "Each", "context": "UnitOfMeasure" },
  { "ediValue": "BX", "systemValue": "Box", "context": "UnitOfMeasure" }
]
```

### 5.4 UI Status

Mapping management is available via the API but does not currently have a dedicated UI panel in the frontend. The `EdiService` frontend service includes `getMappings()`, `createMapping()`, `updateMapping()`, and `deleteMapping()` methods, but the `EdiPanelComponent` does not render a mappings sub-tab.

---

## 6. Inbound Polling

The `IEdiService.PollInboundAsync(tradingPartnerId)` method checks a trading partner's configured transport endpoint for new documents. This is designed for automated background processing:

1. `IEdiTransportService.PollAsync()` connects to the configured transport (SFTP directory, AS2 inbox, etc.) and retrieves raw EDI payloads
2. Each retrieved document is processed through the inbound flow (Receive -> Parse -> Process -> Acknowledge)
3. Results are returned as a list of `EdiTransaction` entities

**Transport configuration** is stored in `TransportConfigJson` on the trading partner. The format varies by transport method (SFTP host/path/credentials, AS2 endpoint URL, etc.).

**Scheduling:** Inbound polling is intended to be triggered by Hangfire scheduled jobs. The specific polling schedule is configured per trading partner.

---

## 7. Retry Support

Failed transactions (status `Error`) can be retried via `POST /api/v1/edi/transactions/{id}/retry`.

**Retry logic (`RetryEdiTransactionHandler`):**
1. Validates the transaction exists and is in `Error` status (otherwise throws `InvalidOperationException`)
2. Increments `RetryCount`
3. Sets `LastRetryAt` to current UTC time
4. Resets status to `Received`
5. Clears `ErrorMessage` and `ErrorDetailJson`
6. Saves changes
7. Calls `IEdiService.RetryTransactionAsync()` to re-process

**UI:** The retry button (refresh icon) appears in the transactions table actions column only for rows with `Error` status. Success shows a "Retry queued" snackbar.

---

## 8. Connection Testing

`POST /api/v1/edi/trading-partners/{id}/test` tests connectivity to the trading partner's configured transport endpoint.

**Handler (`TestEdiConnectionHandler`):**
1. Loads the trading partner's `TransportConfigJson`
2. Calls `IEdiTransportService.TestConnectionAsync()` with the config
3. Returns `{ success: boolean, message: string }`

**UI:** The test button (wifi_tethering icon) in the partners table triggers the test. Results shown as success/error snackbar.

---

## 9. Enums Reference

### EdiFormat
| Value | Description |
|-------|-------------|
| `X12` | ANSI X12 (North American standard) |
| `Edifact` | UN/EDIFACT (international standard) |

### EdiTransportMethod
| Value | Description |
|-------|-------------|
| `As2` | AS2 (Applicability Statement 2) -- HTTP-based |
| `Sftp` | SFTP file transfer |
| `Van` | Value-Added Network |
| `Email` | Email-based exchange |
| `Api` | REST/SOAP API |
| `Manual` | Manual upload/download |

### EdiDirection
| Value | Description |
|-------|-------------|
| `Inbound` | Received from trading partner |
| `Outbound` | Sent to trading partner |

### EdiTransactionStatus
| Value | Description |
|-------|-------------|
| `Received` | Document received, awaiting processing |
| `Parsing` | Parsing in progress |
| `Parsed` | Successfully parsed |
| `Validating` | Validation in progress |
| `Validated` | Passed validation checks |
| `Processing` | Business logic application in progress |
| `Applied` | Successfully applied to the system |
| `Error` | Failed at any processing stage |
| `Acknowledged` | Functional acknowledgment sent/received |
| `Rejected` | Rejected by validation or business rules |

---

## 10. API Endpoints

### Trading Partners

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/edi/trading-partners` | Admin, Manager | List partners. Query: `isActive` (boolean) |
| GET | `/api/v1/edi/trading-partners/{id}` | Admin, Manager | Get partner by ID |
| POST | `/api/v1/edi/trading-partners` | Admin, Manager | Create partner |
| PUT | `/api/v1/edi/trading-partners/{id}` | Admin, Manager | Update partner |
| DELETE | `/api/v1/edi/trading-partners/{id}` | Admin, Manager | Soft-delete partner |
| POST | `/api/v1/edi/trading-partners/{id}/test` | Admin, Manager | Test transport connection |

### Transactions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/edi/transactions` | Admin, Manager | List transactions (paginated). Query: `direction`, `transactionSet`, `status`, `tradingPartnerId`, `dateFrom`, `dateTo`, `page`, `pageSize` |
| GET | `/api/v1/edi/transactions/{id}` | Admin, Manager | Get transaction detail (includes raw payload + parsed data) |
| POST | `/api/v1/edi/receive` | Admin, Manager | Receive inbound document. Body: `{ rawPayload, tradingPartnerId }` |
| POST | `/api/v1/edi/send/{entityType}/{entityId}` | Admin, Manager | Generate and send outbound document. Body: `{ tradingPartnerId }`. Entity types: `shipment`, `invoice`, `sales-order` |
| POST | `/api/v1/edi/transactions/{id}/retry` | Admin, Manager | Retry a failed transaction |

### Mappings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/edi/trading-partners/{id}/mappings` | Admin, Manager | List mappings for a partner |
| POST | `/api/v1/edi/trading-partners/{id}/mappings` | Admin, Manager | Create mapping for a partner |
| PUT | `/api/v1/edi/mappings/{id}` | Admin, Manager | Update mapping |
| DELETE | `/api/v1/edi/mappings/{id}` | Admin, Manager | Delete mapping |

---

## 11. Known Limitations

1. **No mapping UI:** Field mappings and value translations are available via API but have no frontend management interface. Mappings must be created and maintained via API calls or direct database access.

2. **No inbound polling schedule UI:** Polling must be configured via Hangfire jobs or direct API calls. There is no admin interface for setting up polling intervals per trading partner.

3. **Transport configuration is raw JSON:** The `TransportConfigJson` field stores connection details (SFTP host, credentials, AS2 endpoint, etc.) as unstructured JSON. The partner dialog does not expose transport-specific configuration fields -- these must be set via direct API calls.

4. **No interchange/application ID fields in UI:** The partner entity has `InterchangeSenderId`, `InterchangeReceiverId`, `ApplicationSenderId`, and `ApplicationReceiverId` fields, but the partner dialog only exposes `QualifierId` and `QualifierValue`. The interchange/application IDs must be set via API.

5. **No EDI document preview/editor:** There is no visual EDI segment editor or document builder. Raw EDI payloads are displayed as plain text in `<pre>` blocks.

6. **No acknowledgment tracking UI:** The `AcknowledgmentTransactionId` and `IsAcknowledged` fields exist on transactions but are not surfaced in the transaction detail dialog.

7. **Sub-tab state is not URL-routed:** The Partners/Transactions sub-tab toggle uses a signal (`subTab`), not URL routing. Refreshing the page always returns to the Partners tab.

8. **No delete confirmation:** Deleting a trading partner does not show a `ConfirmDialogComponent` -- it calls the API directly. This could result in accidental deletions.

9. **No customer/vendor linking in UI:** The `CustomerId` and `VendorId` fields on trading partners are in the entity but not exposed in the partner dialog form. Partners must be linked to customers/vendors via API.

10. **Mock implementations only:** The `IEdiService` and `IEdiTransportService` interfaces have mock implementations. Real EDI parsing (X12/EDIFACT segment parsing), transport integration (AS2 handshake, SFTP sessions), and document generation are not yet implemented.

11. **No transaction set validation:** There is no validation that the `transactionSet` value matches a known X12/EDIFACT standard (e.g., 850, 810, 856). Any string is accepted.

12. **No batch processing UI:** While `PollInboundAsync` can return multiple documents, there is no UI for viewing or managing batch processing runs.
