# Third-Party Libraries

## Frontend (Angular 21)

| Category | Library | Package | Purpose |
|---|---|---|---|
| UI Framework | Angular Material | `@angular/material` | Component library, theming, form controls |
| Drag & Drop | Angular CDK | `@angular/cdk/drag-drop` | Kanban board card movement, backlog reordering |
| Virtual Scroll | Angular CDK | `@angular/cdk/scrolling` | Large task lists, search results |
| Dashboard Grid | gridstack | `gridstack` | Widget layout — drag, resize, rearrange, serialize to JSON |
| 3D Viewer | Three.js (direct) | `three` + `@types/three` | STL inline rendering, wrapped in Angular service |
| Charts | ng2-charts | `ng2-charts` | Chart.js wrapper for reporting views |
| Guided Tours | driver.js | `driver.js` | Zero-dependency, MIT licensed walkthrough overlays |
| i18n | ngx-translate | `@ngx-translate/core` | Lazy-loaded locale JSON files, terminology pipe |
| File Upload | ngx-dropzone | `@ngx-dropzone/cdk` + `@ngx-dropzone/material` | Drag-and-drop file zone with Material integration |
| PDF Viewer | ngx-extended-pdf-viewer | `ngx-extended-pdf-viewer` | Inline PDF viewing for drawings, specs, customer docs |
| Rich Text Editor | ngx-quill | `ngx-quill` | Quill v2 for job descriptions, notes |
| QR Code | angularx-qrcode | `angularx-qrcode` | Lot tracking labels, asset tags |
| Barcode | bwip-js | `bwip-js` | 100+ barcode types for asset/inventory labels |
| CSV Export | PapaParse | `papaparse` | `Papa.unparse()` + Blob download for report export |
| Keyboard Shortcuts | @ngneat/hotkeys | `@ngneat/hotkeys` | Ctrl+K global search, keyboard navigation |
| Date Utilities | date-fns | `date-fns` + `@angular/material-date-fns-adapter` | Tree-shakeable, official Material date adapter |
| Image Lightbox | @ngx-gallery/lightbox | `@ngx-gallery/lightbox` | Photo viewing for receipts, defects, parts |
| Markdown | ngx-markdown | `ngx-markdown` | Render markdown in notes and descriptions |
| Unit Testing | Vitest | `vitest` | Angular 21 default test runner (replaces Karma/Jest) |
| E2E Testing | Cypress | `cypress` | End-to-end tests covering 95% common use cases |

## Backend (.NET 9)

| Category | Library | Package | Purpose |
|---|---|---|---|
| ORM | EF Core | `Microsoft.EntityFrameworkCore.Npgsql` | PostgreSQL data access, migrations |
| Auth | ASP.NET Identity | built-in | JWT bearer tokens, role management |
| Real-time | SignalR | built-in | WebSocket pub-sub for board sync, notifications |
| Validation | FluentValidation | `FluentValidation.AspNetCore` | Request validation, field-level errors |
| CQRS | MediatR | `MediatR` | Command/query separation, thin controllers |
| Logging | Serilog | `Serilog.AspNetCore` | Structured logging with contextual enrichment |
| Logging Sinks | Serilog Sinks | `Serilog.Sinks.Console` + `Serilog.Sinks.File` + `Serilog.Sinks.Postgresql.Alternative` | Console, rolling file, Postgres |
| Object Mapping | Mapperly | `Riok.Mapperly` | Source-generated DTO mapping (AutoMapper is now commercial) |
| HTTP Resilience | MS Http Resilience | `Microsoft.Extensions.Http.Resilience` | Retry, circuit breaker, timeout for QB API (built on Polly v8) |
| MinIO SDK | Minio | `Minio` | Official .NET SDK for S3-compatible file storage |
| API Docs | OpenAPI + Scalar | `Microsoft.AspNetCore.OpenApi` + `Scalar.AspNetCore` | API documentation (Swashbuckle dropped from .NET 9) |
| Background Jobs | Hangfire | `Hangfire.AspNetCore` + `Hangfire.PostgreSql` | QB sync queue, maintenance checks, backups, notifications, orphan detection |
| Email | MailKit | `MailKit` | SMTP with .ics calendar attachment support |
| CSV Export | CsvHelper | `CsvHelper` | Server-side CSV generation for report downloads |
| PDF Generation | QuestPDF | `QuestPDF` | Fluent C# API for report PDFs (free < $1M revenue) |
| Image Processing | ImageSharp | `SixLabors.ImageSharp` | Thumbnails for uploaded photos (free for open source) |
| Health Checks | Xabaril | `AspNetCore.HealthChecks.NpgSql` + custom checks | Postgres, MinIO, QB connection health |
| Encryption | Data Protection API | `Microsoft.AspNetCore.DataProtection.EntityFrameworkCore` | AES-256 encryption for QB OAuth tokens, keys in Postgres |
| Rate Limiting | Built-in middleware | `Microsoft.AspNetCore.RateLimiting` (in-box) | Fixed window, sliding window, token bucket |
| Bulk Operations | EF Core 9 native + MIT fork | `EFCore.BulkExtensions.MIT` | `ExecuteUpdateAsync`/`ExecuteDeleteAsync` + bulk inserts |
| Test Data | Bogus | `Bogus` | Fake data generation for dev/test seeding |
| Data Seeding | EF Core 9 UseSeeding | built-in | Dynamic seed data (preferred over HasData) |

## Self-Hosted AI (Optional Module)

All AI runs locally — no cloud calls, no data leaves the network.

### Infrastructure

| Component | Tool | Deployment |
|---|---|---|
| LLM Runtime | Ollama | Docker container (`forge-ai`) |
| Vector Storage | pgvector | Postgres extension (same `forge`) |
| Embedding Model | nomic-embed-text | Via Ollama |
| LLM Models | Llama 3.3 / Mistral / Qwen3 | Via Ollama, user's choice based on hardware |
| Web UI (optional) | Open WebUI | Docker container for direct model interaction |

### Models by Hardware

| Hardware | Model | Speed |
|---|---|---|
| CPU only, 16GB RAM | Mistral 7B / Phi-3 | ~5 tokens/sec (usable but slow) |
| GPU, 16GB+ VRAM | Llama 3.3 8B / Mistral 7B | ~30-50 tokens/sec |
| GPU, 48GB+ VRAM | Llama 3.3 70B / Qwen3 | Full capability |

### Use Cases

| Feature | How It Works | Value |
|---|---|---|
| Smart Search | Natural language → structured query: "overdue jobs for Acme" | Users skip filter syntax |
| Job Description Draft | From part + customer + specs, generate card description | Saves repetitive typing |
| QC Anomaly Detection | Analyze production run data for reject rate patterns | Catch quality drift early |
| Maintenance Prediction | Analyze machine hours + downtime history → suggest scheduling | Condition-based vs calendar-based |
| Document Q&A (RAG) | Index specs, SOPs, drawings → ask: "wall thickness for Part #12345?" | Instant answers from your docs |
| Notification Summary | Summarize a day's notifications into morning brief | Quick daily overview |
| Expense Categorization | Auto-suggest category from description | Reduce manual classification |

### Manufacturing-Specific Training (RAG Approach)

1. **Base model**: Open-source manufacturing-tuned model or general model (Llama 3.3)
2. **Local knowledge base**: Index into pgvector:
   - Part specs, BOM structures, material data
   - QC checklists and historical results
   - Maintenance logs and failure patterns
   - SOPs and process documents
   - Production run data and parameters
3. **RAG pipeline**: User question → retrieve relevant local docs → feed as context to LLM → answer grounded in your data
4. **Refresh cycle**: Re-index periodically as new data is added. Model knowledge stays current with production reality.
5. **Open source training data**: Start with publicly available manufacturing knowledge (ISO standards, GD&T references, material databases), fine-tune or augment with local data

### Integration Architecture

- .NET `IAiService` interface with `OllamaAiService` + `MockAiService` implementations
- Same mock pattern as QB: `MOCK_INTEGRATIONS=true` returns canned AI responses
- AI features degrade gracefully — if AI container is down, features fall back to manual workflows
- OpenAI-compatible REST API from Ollama — standard HTTP client in .NET
- Embedding generation runs as a Hangfire background job on data changes

### Docker Compose Addition

```yaml
forge-ai:          # Ollama LLM runtime
  image: ollama/ollama
  volumes:
    - ollama-models:/root/.ollama
  ports:
    - "11434:11434"
  deploy:
    resources:
      reservations:
        devices:
          - capabilities: [gpu]  # optional
```

Total containers: 7 (was 6) — AI container is optional.

## Key 2026 Library Changes (vs Earlier Assumptions)

| Was | Now | Reason |
|---|---|---|
| Angular 19 | **Angular 21** | Current stable as of Feb 2026 |
| Karma/Jest | **Vitest** | Angular 21 default test runner |
| Shepherd.js / Intro.js | **driver.js** | Shepherd requires commercial license |
| AutoMapper | **Mapperly** | AutoMapper went commercial April 2025 |
| Swashbuckle | **OpenAPI + Scalar** | Swashbuckle dropped from .NET 9 templates |
| No background job framework | **Hangfire** | Needed for sync queue, maintenance, backups |
| No dashboard grid library | **gridstack** | Widget layout with drag/resize/serialize |
| No AI | **Ollama + pgvector** | Self-hosted, optional, manufacturing RAG |
