# Integrations Reference

> Complete reference for all pluggable external integrations in Forge. Each integration follows the interface/real/mock pattern and is toggled via configuration.

---

## Architecture Overview

Forge uses a **pluggable integration architecture** where every external dependency is abstracted behind an interface in `forge.core/Interfaces/`. Each interface has:

- **Real implementation** -- connects to the actual external service
- **Mock implementation** -- returns canned data, logs operations via `ILogger`

The `MOCK_INTEGRATIONS` flag (environment variable or `MockIntegrations` in appsettings.json) controls which implementations are registered at startup. When `true`, all integrations use mocks. When `false`, real implementations are registered with conditional fallbacks for unconfigured services.

### Registration Flow (Program.cs)

```
MockIntegrations = true  --> All mock services registered as singletons
MockIntegrations = false --> Real services registered (some conditional on config keys)
```

### Docker Environment Variable

```yaml
# docker-compose.yml
environment:
  - MockIntegrations=${MOCK_INTEGRATIONS:-false}
```

Default is `false` in production. Set to `true` in development or when external services are unavailable.

---

## Accounting

### Interface

**`IAccountingService`** (`forge.core/Interfaces/IAccountingService.cs`)

```csharp
public interface IAccountingService
{
    // Customer sync
    Task<List<AccountingCustomer>> GetCustomersAsync(CancellationToken ct);
    Task<AccountingCustomer?> GetCustomerAsync(string externalId, CancellationToken ct);
    Task<string> CreateCustomerAsync(AccountingCustomer customer, CancellationToken ct);

    // Document creation
    Task<string> CreateEstimateAsync(AccountingDocument document, CancellationToken ct);
    Task<string> CreateInvoiceAsync(AccountingDocument document, CancellationToken ct);
    Task<string> CreatePurchaseOrderAsync(AccountingDocument document, CancellationToken ct);

    // Payment
    Task<AccountingPayment?> GetPaymentAsync(string externalId, CancellationToken ct);
    Task<string> CreateTimeActivityAsync(AccountingTimeActivity activity, CancellationToken ct);

    // Item (Part) sync
    Task<List<AccountingItem>> GetItemsAsync(CancellationToken ct);
    Task<AccountingItem?> GetItemAsync(string externalId, CancellationToken ct);
    Task<string> CreateItemAsync(AccountingItem item, CancellationToken ct);
    Task UpdateItemAsync(string externalId, AccountingItem item, CancellationToken ct);

    // Expense (Purchase) sync
    Task<string> CreateExpenseAsync(AccountingExpense expense, CancellationToken ct);

    // Employee sync
    Task<List<AccountingEmployee>> GetEmployeesAsync(CancellationToken ct);
    Task<AccountingEmployee?> GetEmployeeAsync(string externalId, CancellationToken ct);

    // Inventory quantity sync
    Task UpdateInventoryQuantityAsync(string externalItemId, decimal quantityOnHand, CancellationToken ct);

    // Payroll visibility
    Task<List<AccountingPayStub>> GetPayStubsAsync(string employeeExternalId, DateTimeOffset? fromDate, DateTimeOffset? toDate, CancellationToken ct);
    Task<byte[]?> GetPayStubPdfAsync(string payStubExternalId, CancellationToken ct);
    Task<List<AccountingTaxDocument>> GetTaxDocumentsAsync(string employeeExternalId, int? taxYear, CancellationToken ct);
    Task<byte[]?> GetTaxDocumentPdfAsync(string taxDocumentExternalId, CancellationToken ct);

    // Health
    Task<bool> TestConnectionAsync(CancellationToken ct);
    Task<AccountingSyncStatus> GetSyncStatusAsync(CancellationToken ct);

    string ProviderId { get; }
    string ProviderName { get; }
}
```

### Provider Factory

**`IAccountingProviderFactory`** / **`AccountingProviderFactory`** manages multiple registered providers. The active provider is stored in the `system_settings` table under key `accounting_provider`. The factory resolves it at runtime.

Available providers:

| Provider ID | Implementation | Status |
|---|---|---|
| `local` | `LocalAccountingService` | Implemented -- standalone mode, all data in app DB |
| `quickbooks` | `QuickBooksAccountingService` | Implemented -- full OAuth 2.0, sync queue, bi-directional |
| `xero` | `XeroAccountingService` | Stub -- interface + factory ready |
| `freshbooks` | `FreshBooksAccountingService` | Stub -- interface + factory ready |
| `sage` | `SageAccountingService` | Stub -- interface + factory ready |
| `netsuite` | `NetSuiteAccountingService` | Stub -- interface + factory ready |
| `wave` | `WaveAccountingService` | Stub -- interface + factory ready |
| `zoho` | `ZohoAccountingService` | Stub -- interface + factory ready |
| `mock` | `MockAccountingService` | Dev/test only -- canned customer data |

### QuickBooks Online (Primary Provider)

**Implementation:** `QuickBooksAccountingService` (`forge.integrations/`)

**OAuth 2.0 Flow:**
1. Admin initiates connect from Admin > Integrations
2. Backend generates authorization URL with `com.intuit.quickbooks.accounting` scope
3. User authenticates on Intuit, redirected back with authorization code
4. Backend exchanges code for access + refresh tokens
5. Tokens encrypted via ASP.NET Data Protection API, stored in database
6. `IQuickBooksTokenService` handles automatic token refresh before expiry

**What Syncs:**
- **Customers** -- bidirectional sync, 4-hour cycle via `CustomerSyncJob`
- **Items (Parts)** -- bidirectional sync, 4-hour cycle via `ItemSyncJob`
- **Invoices** -- push to QB on creation
- **Estimates** -- push to QB on creation
- **Purchase Orders** -- push to QB on creation
- **Payments** -- pull from QB for reconciliation
- **Time Activities** -- push to QB from time tracking entries
- **Expenses** -- push to QB as purchases
- **Inventory Quantities** -- push on-hand quantities to QB

**Sync Queue:** `SyncQueueEntry` entity queues changes. `SyncQueueProcessorJob` drains every 2 minutes. Retry with exponential backoff.

**Cache:** `AccountingCacheSyncJob` refreshes cached QB data every 6 hours.

**Orphan Detection:** `OrphanDetectionJob` runs daily at 3 AM to find records in QB without matching local records.

**Configuration:**

```yaml
# appsettings.json
QuickBooks:
  ClientId: ""
  ClientSecret: ""
  Environment: "sandbox"  # or "production"
  RedirectUri: ""
  SandboxCompanyId: ""

# docker-compose.yml environment
- QuickBooks__ClientId=${QB_CLIENT_ID:-}
- QuickBooks__ClientSecret=${QB_CLIENT_SECRET:-}
```

**Token Encryption:** OAuth tokens (access + refresh) are encrypted at rest using ASP.NET Data Protection API with keys stored in PostgreSQL. The `ITokenEncryptionService` interface handles encrypt/decrypt operations.

### Accounting Boundary

Features marked with **`ACCOUNTING BOUNDARY`** only activate in standalone mode (no accounting provider connected or `local` provider selected). When an external provider is active, these features become read-only or hidden:

- Invoices (local CRUD, PDF generation)
- Payments (local recording, application to invoices)
- AR Aging (computed from local invoices/payments)
- Customer Statements
- Sales Tax tracking
- Financial Reports (P&L, revenue, payment history)
- Vendor management (full local CRUD)
- Credit terms management

The app works fully without any accounting provider -- financial features degrade gracefully to local-only mode.

**Frontend check:** `AccountingService.isStandalone` signal
**Backend check:** `IAccountingProviderFactory.GetActiveProviderAsync()` returns `null` or `LocalAccountingService`

### Mock Implementation

**`MockAccountingService`** -- returns 4 canned customers (Acme Corp, Quantum Dynamics, Apex Manufacturing, Meridian Systems). All create operations return `MOCK-*` prefixed IDs. Every operation logged via `ILogger`.

### Hangfire Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `SyncQueueProcessorJob` | Every 2 minutes | Drain sync queue to accounting provider |
| `CustomerSyncJob` | Every 4 hours | Bidirectional customer sync |
| `ItemSyncJob` | Every 4 hours | Bidirectional item/part sync |
| `AccountingCacheSyncJob` | Every 6 hours | Refresh cached accounting data |
| `OrphanDetectionJob` | Daily 3 AM | Detect unmatched records between systems |

---

## Shipping

### Interface

**`IShippingService`** (`forge.core/Interfaces/IShippingService.cs`)

```csharp
public interface IShippingService
{
    Task<List<ShippingRate>> GetRatesAsync(ShipmentRequest request, CancellationToken ct);
    Task<ShippingLabel> CreateLabelAsync(ShipmentRequest request, string carrierId, CancellationToken ct);
    Task<ShipmentTracking?> GetTrackingAsync(string trackingNumber, CancellationToken ct);
    Task<bool> TestConnectionAsync(CancellationToken ct);
}
```

### Carrier Interface

**`IShippingCarrierService`** extends `IShippingService` with carrier identity:

```csharp
public interface IShippingCarrierService : IShippingService
{
    string CarrierId { get; }
    string CarrierName { get; }
    bool IsConfigured { get; }
}
```

### Multi-Carrier Aggregation

**`MultiCarrierShippingService`** implements `IShippingService` by aggregating all registered `IShippingCarrierService` implementations:

- **`GetRatesAsync`** -- fans out to all configured carriers in parallel, returns combined rates sorted by price
- **`CreateLabelAsync`** -- routes to specific carrier by `carrierId` prefix
- **`GetTrackingAsync`** -- detects carrier from tracking number format (1Z = UPS, 12/15/20 digits = FedEx, starts with 9 = USPS), falls back to trying all carriers

### Carrier Implementations

| Carrier | Implementation | Options Class | Status |
|---|---|---|---|
| UPS | `UpsShippingService` | `UpsOptions` | Stub -- `ClientId`, `ClientSecret`, `AccountNumber`, sandbox/production URLs |
| FedEx | `FedExShippingService` | `FedExOptions` | Stub -- `ClientId`, `ClientSecret`, `AccountNumber`, sandbox/production URLs |
| USPS | `UspsShippingService` | (uses `StampsOptions`) | Stub -- via Stamps.com API |
| DHL | `DhlShippingService` | `DhlOptions` | Stub -- `ApiKey`, `ApiSecret`, `AccountNumber` |

Each carrier service checks `IsConfigured` based on whether required API credentials are present. Unconfigured carriers are silently skipped by `MultiCarrierShippingService`.

### Configuration

```yaml
# Carrier API credentials (docker-compose.yml)
- Ups__ClientId=${UPS_CLIENT_ID:-}
- Ups__ClientSecret=${UPS_CLIENT_SECRET:-}
- Ups__AccountNumber=${UPS_ACCOUNT_NUMBER:-}
- FedEx__ClientId=${FEDEX_CLIENT_ID:-}
- FedEx__ClientSecret=${FEDEX_CLIENT_SECRET:-}
- FedEx__AccountNumber=${FEDEX_ACCOUNT_NUMBER:-}
- Dhl__ApiKey=${DHL_API_KEY:-}
- Stamps__ApiKey=${STAMPS_API_KEY:-}
- Stamps__AccountId=${STAMPS_ACCOUNT_ID:-}
```

### Manual Mode

When no carrier APIs are configured, shipments still function in manual mode. Users enter tracking numbers directly without API-generated labels. `MultiCarrierShippingService.GetRatesAsync` returns an empty list when no carriers are configured.

### Mock Implementation

**`MockShippingService`** -- returns 3 hardcoded rates (UPS Ground $12.50, FedEx Home $15.75, USPS Priority $8.90). Label creation generates `MOCK-*` tracking numbers. Tracking always returns "In Transit" status.

---

## Address Validation (USPS)

### Interface

**`IAddressValidationService`** (`forge.core/Interfaces/IAddressValidationService.cs`)

```csharp
public interface IAddressValidationService
{
    Task<AddressValidationResponseModel> ValidateAsync(ValidateAddressRequestModel request, CancellationToken ct);
    Task<bool> TestConnectionAsync(CancellationToken ct);
}
```

### Real Implementation

**`UspsAddressValidationService`** -- uses USPS Addresses API v3 (OAuth 2.0):

- **Endpoint:** `https://apis.usps.com/addresses/v3/address`
- **Auth:** OAuth 2.0 token via `https://apis.usps.com/oauth2/v3/token` using consumer key/secret
- **Features:** DPV (Delivery Point Validation) confirmation, standardized address formatting, ZIP+4 correction
- **Token caching:** Access token cached in memory, refreshed on expiry

**Registration logic (Program.cs):** USPS service registered via `AddHttpClient` when `Usps:ConsumerKey` is configured. Falls back to `MockAddressValidationService` when not configured.

### Configuration

```yaml
# appsettings.json
Usps:
  ConsumerKey: ""
  ConsumerSecret: ""

# docker-compose.yml
- Usps__ConsumerKey=${USPS_CONSUMER_KEY:-}
- Usps__ConsumerSecret=${USPS_CONSUMER_SECRET:-}
```

Register for free at https://www.usps.com/business/web-tools-apis/.

**Note:** Address validation is decoupled from shipping. It uses USPS Web Tools directly and is not part of `IShippingService`.

### Mock Implementation

**`MockAddressValidationService`** -- format-only validation:
- Checks required fields (street, city, state, ZIP)
- Validates US state codes against a hardcoded set
- Validates ZIP code format (XXXXX or XXXXX-XXXX via regex)
- Title-cases street and city for standardization
- Returns advisory message: "Format check only -- connect USPS or a shipping provider for full address verification"

### Frontend Integration

`AddressFormComponent` --> `AddressService.validate()` --> `POST /api/v1/addresses/validate` --> `IAddressValidationService.ValidateAsync()`

---

## AI (Ollama)

### Interface

**`IAiService`** (`forge.core/Interfaces/IAiService.cs`)

```csharp
public interface IAiService
{
    Task<string> GenerateTextAsync(string prompt, CancellationToken ct);
    Task<string> GenerateTextAsync(string prompt, string? systemPrompt, double? temperature, CancellationToken ct);
    Task<string> SummarizeAsync(string text, CancellationToken ct);
    Task<List<AiSearchResult>> SmartSearchAsync(string naturalLanguageQuery, CancellationToken ct);
    Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct);
    Task<bool> IsAvailableAsync(CancellationToken ct);
    Task<string> GenerateWithImageAsync(string prompt, byte[] imageBytes, string? systemPrompt, CancellationToken ct);
    IAsyncEnumerable<string> GenerateTextStreamAsync(string prompt, CancellationToken ct);
}
```

### Real Implementation

**`OllamaAiService`** -- self-hosted Ollama with three models:

| Model | Purpose | Config Key |
|---|---|---|
| `gemma3:4b` | Text generation, summarization, smart search | `Ai:Model` |
| `all-minilm:l6-v2` | Embedding generation (384 dimensions) | `Ai:EmbeddingModel` |
| `llava:7b` | Vision/multimodal (image + text) | `Ai:VisionModel` |

**RAG Pipeline:**
- `DocumentEmbedding` entity stores pgvector `vector(384)` embeddings
- `DocumentIndexJob` (Hangfire, every 30 minutes) indexes recently updated entities
- Documentation indexing runs daily at 3 AM and once on startup
- Smart search: query embedding --> cosine similarity against stored embeddings --> LLM-augmented ranking
- Supports 6 entity types for full-text + RAG hybrid search

**Use Cases:**
- Header AI search with RAG results
- Job description drafting
- QC anomaly detection
- Document Q&A
- Configurable AI assistants (HR, Procurement, Sales domains)

**Graceful Degradation:** All AI features check `IsAvailableAsync()` before use. When the Ollama container is down, AI features are silently disabled -- no errors shown to users.

### Configuration

```yaml
# AiOptions (appsettings.json)
Ai:
  BaseUrl: "http://forge-ai:11434"
  Model: "gemma3:4b"
  EmbeddingModel: "all-minilm:l6-v2"
  VisionModel: "llava:7b"
  TimeoutSeconds: 120
  VisionTimeoutSeconds: 600
  DocsPath: "/app/docs"

# docker-compose.yml
- Ai__BaseUrl=${AI_BASE_URL:-http://forge-ai:11434}
- Ai__Model=${AI_MODEL:-gemma3:4b}
- Ai__EmbeddingModel=${AI_EMBEDDING_MODEL:-all-minilm:l6-v2}
```

### Docker Service

```yaml
forge-ai:
  image: ollama/ollama
  container_name: forge-ai
  ports:
    - "${AI_PORT:-11434}:11434"
  volumes:
    - ollamadata:/root/.ollama
  profiles:
    - ai              # Optional -- only started with `--profile ai`
  deploy:
    resources:
      limits:
        memory: 6G

forge-ai-init:  # One-shot model pull on first start
  image: ollama/ollama
  entrypoint: ["/bin/sh", "-c"]
  command: >
    "ollama pull gemma3:4b && ollama pull all-minilm:l6-v2 && echo 'AI model init complete'"
  profiles:
    - ai
```

### Mock Implementation

**`MockAiService`** -- returns `[Mock AI] Generated response for: ...` for text generation. Summarization truncates to 200 chars. Smart search returns empty results. Embedding returns zero vector (384 dimensions). Vision generates a canned JSON verification response.

### Hangfire Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `DocumentIndexJob` (document-index) | Every 30 minutes | Index recently updated entities for RAG |
| `DocumentIndexJob` (documentation-index) | Daily 3 AM + startup | Index project documentation files |

---

## Storage (MinIO)

### Interface

**`IStorageService`** (`forge.core/Interfaces/IStorageService.cs`)

```csharp
public interface IStorageService
{
    Task UploadAsync(string bucketName, string objectKey, Stream stream, string contentType, CancellationToken ct);
    Task<Stream> DownloadAsync(string bucketName, string objectKey, CancellationToken ct);
    Task<string> GetPresignedUrlAsync(string bucketName, string objectKey, int expirySeconds, CancellationToken ct);
    Task DeleteAsync(string bucketName, string objectKey, CancellationToken ct);
    Task EnsureBucketExistsAsync(string bucketName, CancellationToken ct);
    Task<bool> TestConnectionAsync(CancellationToken ct);
}
```

### Real Implementations

**`MinioStorageService`** (default) -- S3-compatible object storage via Minio SDK v7.0.0:

- Uses two `IMinioClient` instances: one for internal operations (Docker hostname), one for presigned URL generation (public endpoint)
- Presigned URLs embed the host in their HMAC signature, so the presign client must target the browser-accessible address

**`LocalFileStorageService`** (alternative) -- filesystem-based storage for environments without MinIO. Selected via `Storage:Provider=local`.

### Buckets

| Bucket | Purpose |
|---|---|
| `forge-job-files` | Job attachments (drawings, specs, photos) |
| `forge-receipts` | Expense receipt images |
| `forge-employee-docs` | Employee documents (resumes, certifications) |
| `forge-pii-docs` | PII documents (tax forms, identity documents) |

Buckets are auto-created on startup when `MockIntegrations=false`.

### Configuration

```yaml
# MinioOptions (appsettings.json)
Minio:
  Endpoint: "forge-storage:9000"
  PublicEndpoint: "localhost:9000"
  AccessKey: "minioadmin"
  SecretKey: "minioadmin"
  UseSsl: false
  JobFilesBucket: "forge-job-files"
  ReceiptsBucket: "forge-receipts"
  EmployeeDocsBucket: "forge-employee-docs"
  PiiDocsBucket: "forge-pii-docs"

# LocalStorageOptions (alternative)
LocalStorage:
  RootPath: "/app/storage"
  PublicBaseUrl: "http://localhost:5000"
  PresignedUrlExpirySeconds: 3600
```

### Docker Service

```yaml
forge-storage:
  image: minio/minio
  container_name: forge-storage
  ports:
    - "${MINIO_API_PORT:-9000}:9000"       # S3 API
    - "${MINIO_CONSOLE_PORT:-9001}:9001"   # Web console
  environment:
    - MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
    - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-minioadmin}
  volumes:
    - miniodata:/data
  command: server /data --console-address ":9001"
```

Part of the 5 core services (always started).

### Mock Implementation

**`MockStorageService`** -- in-memory `ConcurrentDictionary<string, byte[]>`. Upload stores bytes, download retrieves them, presigned URLs return `mock:///` prefixed strings. All operations logged. Data lost on restart.

### Frontend Integration

`FileUploadZoneComponent` --> `POST /api/v1/{entityType}/{entityId}/files` (multipart) --> `FilesController` --> `IStorageService.UploadAsync()`. Downloads via `GET /api/v1/files/{id}` which generates a presigned URL redirect.

`FileAttachment` entity stores metadata (polymorphic via `EntityType`/`EntityId`). Soft-delete only -- MinIO objects retained.

---

## PDF Extraction

### Interfaces

**`IPdfJsExtractorService`** -- raw text + form field extraction from PDFs:

```csharp
public interface IPdfJsExtractorService
{
    Task<PdfExtractionResult> ExtractRawAsync(byte[] pdfBytes, CancellationToken ct);
    Task<byte[]> RenderPageAsImageAsync(byte[] pdfBytes, int pageNumber, double scale, CancellationToken ct);
}
```

**`IFormDefinitionParser`** -- converts raw extraction data to `ComplianceFormDefinition` JSON.

**`IFormDefinitionVerifier`** -- structural checks + AI refinement loop (max 3 iterations).

### Real Implementation

**`PdfJsExtractorService`** -- uses PuppeteerSharp (headless Chromium) with a bundled pdf.js extraction page:

- **Singleton browser instance** -- lazily initialized, reused across extractions via `SemaphoreSlim` lock
- **Extraction page:** `forge.api/wwwroot/pdf-extract.html` -- bundled pdf.js called via `EvaluateFunctionAsync`
- **Page rendering:** Renders PDF pages as PNG images for visual verification against AI-generated form definitions

**`FormDefinitionParser`** -- smart parser that infers `ComplianceFormDefinition` layout from structural cues:
- Step sections, amount lines, filing status fields, signature blocks, form headers
- Pattern detection without per-form hardcoding

**`FormDefinitionVerifier`** -- uses AI vision model to compare rendered form screenshots against source PDF, iterating up to 3 times to refine the definition.

### Supporting Services

| Service | Interface | Real | Mock |
|---|---|---|---|
| Form rendering | `IFormRendererService` | `PuppeteerFormRendererService` | `MockFormRendererService` |
| Image comparison | `IImageComparisonService` | `SkiaImageComparisonService` | `MockImageComparisonService` |
| PDF form filling | `IPdfFormFillService` | `PdfSharpFormFillService` | `MockPdfFormFillService` |

### Docker Notes

The API container uses a **Debian base** (not Alpine) with Chromium installed. Environment variable `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` points PuppeteerSharp to the system Chromium binary.

### Mock Implementation

**`MockPdfJsExtractorService`** -- returns canned extraction data (text items + annotations) without launching a browser.

---

## Document Signing (DocuSeal)

### Interface

**`IDocumentSigningService`** (`forge.core/Interfaces/IDocumentSigningService.cs`)

```csharp
public interface IDocumentSigningService
{
    Task<bool> IsAvailableAsync(CancellationToken ct);
    Task<int> CreateTemplateFromPdfAsync(string name, byte[] pdfBytes, CancellationToken ct);
    Task<DocumentSigningSubmission> CreateSubmissionAsync(int templateId, string signerEmail, string signerName, CancellationToken ct);
    Task<DocumentSigningMultiSubmission> CreateSubmissionFromPdfAsync(
        string templateName, byte[] pdfBytes,
        IReadOnlyList<SequentialSubmitter> submitters, CancellationToken ct);
    Task<byte[]> GetSignedPdfAsync(int submissionId, CancellationToken ct);
    Task<DocumentSigningSubmissionStatus> GetSubmissionStatusAsync(int submissionId, CancellationToken ct);
    Task DeleteTemplateAsync(int templateId, CancellationToken ct);
}
```

### Real Implementation

**`DocuSealSigningService`** -- self-hosted DocuSeal instance for document signing:

- **Authentication:** `X-Auth-Token` header with API key
- **URL rewriting:** Embed URLs are rewritten from internal Docker hostname (`forge-signing:3000`) to browser-accessible proxy URL via `PublicBaseUrl` (e.g., `http://localhost:4200/docuseal/s/abc`)
- **Multi-submitter support:** `CreateSubmissionFromPdfAsync` supports ordered sequential signing (employee signs first, then employer/verifier)
- **Zero-byte PDF handling:** Falls back to blank HTML template when PDF bytes are empty

**Primary use case:** Employee compliance form signing (W-4, I-9, state withholding forms). Pre-filled PDFs are submitted for e-signature, bypassing DocuSeal's template management.

### Configuration

```yaml
# DocuSealOptions (appsettings.json)
DocuSeal:
  BaseUrl: "http://forge-signing:3000"
  PublicBaseUrl: "http://localhost:4200/docuseal"
  ApiKey: ""
  TimeoutSeconds: 30
  WebhookSecret: ""

# docker-compose.yml
- DocuSeal__BaseUrl=${DOCUSEAL_BASE_URL:-http://forge-signing:3000}
- DocuSeal__PublicBaseUrl=${DOCUSEAL_PUBLIC_BASE_URL:-...}
- DocuSeal__ApiKey=${DOCUSEAL_API_KEY:-}
- DocuSeal__WebhookSecret=${DOCUSEAL_WEBHOOK_SECRET:-}
```

### Docker Service

```yaml
forge-signing:
  image: docuseal/docuseal:latest
  container_name: forge-signing
  ports:
    - "${DOCUSEAL_PORT:-3000}:3000"
  volumes:
    - docusealdata:/data
  environment:
    - SECRET_KEY_BASE=${DOCUSEAL_SECRET_KEY:-change-me-in-production}
  profiles:
    - signing         # Optional -- only started with `--profile signing`
```

nginx proxies `/docuseal/` to the DocuSeal container for browser-accessible embed URLs.

### Mock Implementation

**`MockDocumentSigningService`** -- auto-incrementing template/submission IDs. `IsAvailableAsync` always returns `true`. `GetSubmissionStatusAsync` always returns `"completed"`. No actual signing occurs.

---

## Email (SMTP)

### Interface

**`IEmailService`** (`forge.core/Interfaces/IEmailService.cs`)

```csharp
public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
    Task<bool> TestConnectionAsync(CancellationToken ct);
}
```

### Real Implementation

**`SmtpEmailService`** -- sends email via MailKit:

- Constructs `MimeMessage` with HTML body, optional plain text, and attachments
- Connects to SMTP server with optional SSL and authentication
- Logs sent emails with recipient and subject

**Use Cases:**
- Notification emails (critical alerts, mentions, assignments)
- Daily digest summaries (`DailyDigestJob`, 7 AM UTC)
- Invoice emails (PDF attachment)
- Setup token delivery
- I-9 Section 2 overdue reminders
- Event reminders (15 minutes before)

### Configuration

```yaml
# SmtpOptions (appsettings.json)
Smtp:
  Host: "localhost"
  Port: 587
  Username: ""
  Password: ""
  UseSsl: true
  FromAddress: "noreply@forge.local"
  FromName: "Forge"
```

### Mock Implementation

**`MockEmailService`** -- logs email details (To, Subject, attachment count) via `ILogger`. No email sent. `TestConnectionAsync` always returns `true`.

### Hangfire Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `DailyDigestJob` | Daily 7 AM | Send daily notification digest email |
| `EventReminderJob` | Every 15 minutes | Send event reminders 15 min before start |

---

## Calendar Integration

### Interface

**`ICalendarIntegrationService`** (`forge.core/Interfaces/ICalendarIntegrationService.cs`)

```csharp
public interface ICalendarIntegrationService
{
    string ProviderId { get; }
    Task<string> PushEventAsync(int userId, int integrationId, CalendarEvent calendarEvent, CancellationToken ct);
    Task UpdateEventAsync(int userId, int integrationId, string externalEventId, CalendarEvent calendarEvent, CancellationToken ct);
    Task DeleteEventAsync(int userId, int integrationId, string externalEventId, CancellationToken ct);
    Task<List<CalendarFreeBusy>> GetFreeBusyAsync(int userId, int integrationId, DateTimeOffset start, DateTimeOffset end, CancellationToken ct);
    Task<CalendarSyncResult> SyncEventsAsync(int userId, int integrationId, CancellationToken ct);
    Task<bool> TestConnectionAsync(int userId, int integrationId, CancellationToken ct);
}
```

### Implementations

| Provider | Implementation | Status |
|---|---|---|
| Google Calendar | `GoogleCalendarService` | Stub |
| Outlook/Microsoft | `OutlookCalendarService` | Stub |
| ICS Feed | `IcsCalendarFeedService` | Stub |
| Mock | `MockCalendarIntegrationService` | Dev/test |

Per-user integration -- each user connects their own calendar account via Admin > Integrations.

---

## Messaging Integration

### Interface

**`IMessagingIntegrationService`** (`forge.core/Interfaces/IMessagingIntegrationService.cs`)

```csharp
public interface IMessagingIntegrationService
{
    string ProviderId { get; }
    Task SendNotificationAsync(int userId, int integrationId, NotificationMessage message, CancellationToken ct);
    Task<bool> TestConnectionAsync(int userId, int integrationId, CancellationToken ct);
}
```

### Implementations

| Provider | Implementation | Status |
|---|---|---|
| Slack | `SlackMessagingService` | Stub -- webhook-based |
| Microsoft Teams | `TeamsMessagingService` | Stub -- webhook-based |
| Discord | `DiscordMessagingService` | Stub -- webhook-based |
| Google Chat | `GoogleChatMessagingService` | Stub -- webhook-based |
| Mock | `MockMessagingIntegrationService` | Dev/test |

Per-user integration -- users configure webhook URLs in their account settings.

---

## EDI (Electronic Data Interchange)

### Interface

**`IEdiService`** (`forge.core/Interfaces/IEdiService.cs`)

```csharp
public interface IEdiService
{
    // Inbound processing
    Task<EdiTransaction> ReceiveDocumentAsync(string rawPayload, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> ParseTransactionAsync(int transactionId, CancellationToken ct);
    Task<EdiTransaction> ProcessTransactionAsync(int transactionId, CancellationToken ct);
    Task RetryTransactionAsync(int transactionId, CancellationToken ct);

    // Outbound generation
    Task<EdiTransaction> GenerateAsnAsync(int shipmentId, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> GenerateInvoiceEdiAsync(int invoiceId, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> GeneratePoAckAsync(int salesOrderId, int tradingPartnerId, CancellationToken ct);
    Task<EdiTransaction> Generate997Async(int inboundTransactionId, CancellationToken ct);

    // Transport
    Task SendTransactionAsync(int transactionId, CancellationToken ct);
    Task<IReadOnlyList<EdiTransaction>> PollInboundAsync(int tradingPartnerId, CancellationToken ct);
}
```

### Implementation

**`MockEdiService`** / **`MockEdiTransportService`** -- mock only in both development and production modes. Real AS2/SFTP transport providers can be added per trading partner.

**Entities:** `EdiTradingPartner`, `EdiTransaction`, `EdiMapping`
**Document types:** X12 (850 PO, 856 ASN, 810 Invoice, 855 PO Ack, 997 FA) and EDIFACT

### Hangfire Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `PollEdiInboundJob` | Every 30 minutes | Poll all trading partners for inbound transactions |

---

## MFA (Multi-Factor Authentication)

### Interface

**`IMfaService`** (`forge.core/Interfaces/IMfaService.cs`)

```csharp
public interface IMfaService
{
    // Setup
    Task<MfaSetupResponseModel> BeginTotpSetupAsync(int userId, string? deviceName, CancellationToken ct);
    Task<bool> VerifyTotpSetupAsync(int userId, int deviceId, string code, CancellationToken ct);
    Task DisableMfaAsync(int userId, CancellationToken ct);
    Task RemoveDeviceAsync(int userId, int deviceId, CancellationToken ct);

    // Challenge/Validate (login flow)
    Task<MfaChallengeResponseModel> CreateChallengeAsync(int userId, CancellationToken ct);
    Task<MfaValidateResponseModel?> ValidateChallengeAsync(string challengeToken, string code, bool rememberDevice, CancellationToken ct);

    // Recovery
    Task<MfaRecoveryCodesResponseModel> GenerateRecoveryCodesAsync(int userId, CancellationToken ct);
    Task<MfaValidateResponseModel?> ValidateRecoveryCodeAsync(string challengeToken, string recoveryCode, CancellationToken ct);

    // TOTP
    bool ValidateTotpCode(string secret, string code, int toleranceSteps = 1);
    string GenerateTotpSecret();
    string GenerateQrCodeUri(string secret, string email, string issuer);

    // Status
    Task<MfaStatusResponseModel> GetMfaStatusAsync(int userId, CancellationToken ct);
    Task<bool> IsMfaRequiredAsync(int userId, CancellationToken ct);
}
```

MFA is implemented directly in the API (not an external integration). TOTP-based with QR code + manual key setup, challenge/validate login flow, and recovery codes. Admin can enforce MFA by role.

**Entities:** `UserMfaDevice`, `MfaRecoveryCode`

---

## Background Jobs (Hangfire)

Hangfire is configured with PostgreSQL storage and runs as an embedded server within the API container.

### Configuration

```csharp
// Program.cs
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options =>
        options.UseNpgsqlConnection(connectionString)));

builder.Services.AddHangfireServer(options =>
{
    options.Queues = ["default"];
    options.WorkerCount = Math.Max(Environment.ProcessorCount, 4);
});
```

### Dashboard

Accessible at `/hangfire` (requires authentication).

### Complete Job Schedule

| Job ID | Class | Schedule | Purpose |
|---|---|---|---|
| `mark-overdue-invoices` | `OverdueInvoiceJob` | Daily 1 AM | Mark past-due invoices as overdue |
| `check-overdue-maintenance` | `OverdueMaintenanceJob` | Daily 2 AM | Check overdue asset maintenance |
| `reorder-analysis` | `ReorderAnalysisJob` | Daily 2 AM | Analyze inventory reorder points |
| `database-backup` | `DatabaseBackupJob` | Daily 3 AM | PostgreSQL pg_dump backup |
| `orphan-detection` | `OrphanDetectionJob` | Daily 3 AM | Detect unmatched accounting records |
| `mrp-nightly-run` | `MrpRunJob` | Daily 3 AM | Material Requirements Planning calculation |
| `generate-recurring-expenses` | `RecurringExpenseJob` | Daily 5 AM | Generate expenses from recurring templates |
| `generate-recurring-orders` | `RecurringOrderJob` | Daily 6 AM | Generate orders from recurring templates |
| `check-credit-reviews-due` | `CheckCreditReviewsDueJob` | Daily 6 AM | Flag customers due for credit review |
| `send-daily-digest` | `DailyDigestJob` | Daily 7 AM | Email daily notification digest |
| `nudge-uninvoiced-jobs` | `UninvoicedJobNudgeJob` | Daily 8 AM | Notify about completed but uninvoiced jobs |
| `check-i9-section2-overdue` | `CheckI9OverdueJob` | Daily 9 AM | Flag overdue I-9 Section 2 completions |
| `check-mismatched-clock-events` | `CheckMismatchedClockEventsJob` | Daily 10 PM | Detect unpaired clock-in/out events |
| `sync-queue-processor` | `SyncQueueProcessorJob` | Every 2 min | Drain accounting sync queue |
| `run-scheduled-tasks` | `ScheduledTaskJob` | Every 15 min | Execute admin-defined scheduled tasks |
| `event-reminders` | `EventReminderJob` | Every 15 min | Send event reminders |
| `edi-inbound-poll` | `PollEdiInboundJob` | Every 30 min | Poll EDI trading partners |
| `document-index` | `DocumentIndexJob` | Every 30 min | Index entities for RAG search |
| `approval-escalations` | `CheckApprovalEscalationsJob` | Hourly | Escalate stale approval requests |
| `customer-sync` | `CustomerSyncJob` | Every 4 hours | Bidirectional customer sync |
| `item-sync` | `ItemSyncJob` | Every 4 hours | Bidirectional item/part sync |
| `accounting-cache-sync` | `AccountingCacheSyncJob` | Every 6 hours | Refresh cached accounting data |
| `compliance-form-sync` | `ComplianceFormSyncJob` | Weekly (Sun 4 AM) | Sync federal compliance form templates |
| `check-i9-reverification` | `CheckI9ReverificationJob` | Weekly (Mon 9 AM) | Flag I-9s due for reverification |
| `recalculate-vendor-scorecards` | `RecalculateVendorScorecardsJob` | Monthly (1st, 4 AM) | Recalculate vendor performance scores |
| `documentation-index` | `DocumentIndexJob` | Daily 3 AM + startup | Index project documentation for AI |

---

## Mock vs Real Summary

### When `MOCK_INTEGRATIONS=true`

All integrations use mock implementations. No external services are contacted. All operations are logged via `ILogger` for development visibility. Mock services are registered as **singletons**.

### When `MOCK_INTEGRATIONS=false`

| Integration | Real Implementation | Conditional Fallback |
|---|---|---|
| Storage | `MinioStorageService` or `LocalFileStorageService` | Based on `Storage:Provider` config |
| Accounting | All 8 providers registered, factory resolves active one | `LocalAccountingService` when no provider selected |
| Shipping | `MultiCarrierShippingService` aggregating 4 carriers | Returns empty rates when no carriers configured |
| Address Validation | `UspsAddressValidationService` | Falls back to `MockAddressValidationService` when `Usps:ConsumerKey` empty |
| AI | `OllamaAiService` | Graceful degradation when Ollama container down |
| Email | `SmtpEmailService` | No fallback -- requires SMTP config |
| Document Signing | `DocuSealSigningService` | `IsAvailableAsync` returns false when DocuSeal down |
| PDF Extraction | `PdfJsExtractorService` | Fails with clear error if Chromium not found |
| Form Rendering | `PuppeteerFormRendererService` | No fallback |
| EDI | `MockEdiService` | Mock used even in production (real AS2/SFTP not yet built) |
| Calendar | Google, Outlook, ICS providers | All stubs |
| Messaging | Slack, Teams, Discord, Google Chat | All stubs |

### What Each Mock Does

| Mock | Behavior |
|---|---|
| `MockAccountingService` | Returns 4 canned customers, generates `MOCK-CUST-*` IDs |
| `MockShippingService` | Returns 3 fixed rates (UPS/FedEx/USPS), generates `MOCK-*` tracking numbers |
| `MockAddressValidationService` | Format-only validation (state codes, ZIP regex, required fields) |
| `MockAiService` | Echoes truncated prompt, returns zero embeddings, empty search results |
| `MockStorageService` | In-memory `ConcurrentDictionary` -- data lost on restart |
| `MockEmailService` | Logs email details, sends nothing |
| `MockDocumentSigningService` | Auto-incrementing IDs, always reports "completed" status |
| `MockPdfJsExtractorService` | Returns canned extraction data without launching browser |
| `MockFormRendererService` | Returns empty/placeholder image bytes |
| `MockEdiService` | Returns canned EDI transactions |
| `MockCalendarIntegrationService` | No-op, logs calls |
| `MockMessagingIntegrationService` | No-op, logs calls |

---

## Additional Internal Services

These are not external integrations but are registered alongside them in the same conditional block:

| Interface | Real | Mock | Purpose |
|---|---|---|---|
| `IImageComparisonService` | `SkiaImageComparisonService` | `MockImageComparisonService` | Compare rendered form images for verification |
| `IWalkthroughGeneratorService` | `PuppeteerWalkthroughGeneratorService` | `MockWalkthroughGeneratorService` | Generate step-by-step walkthrough screenshots |
| `IPdfFormFillService` | `PdfSharpFormFillService` | `MockPdfFormFillService` | Fill PDF form fields programmatically |
| `ICpqService` | -- | `MockCpqService` | Configure-Price-Quote engine |
| `ICurrencyService` | -- | `MockCurrencyService` | Multi-currency conversion |
| `ILocalizationService` | -- | `MockLocalizationService` | Localization/i18n |
| `IPlantContextService` | -- | `MockPlantContextService` | Multi-plant context resolution |
| `IMachineDataService` | -- | `MockMachineDataService` | Machine/IoT data collection |
| `IECommerceService` | -- | `MockECommerceService` | E-commerce order import |
| `IBiService` | -- | `MockBiService` | Business intelligence data warehouse |
| `IOeeService` | -- | `MockOeeService` | Overall Equipment Effectiveness |
| `IApprovalService` | -- | `MockApprovalService` | Approval workflow engine |
| `IUomService` | -- | `MockUomService` | Unit of measure conversion |
| `ICreditManagementService` | -- | `MockCreditManagementService` | Customer credit limit management |
