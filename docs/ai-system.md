# AI System — Architecture & Interaction Reference

Forge's AI layer is powered by a self-hosted **Ollama** instance running inside Docker. All AI interactions are optional — the application degrades gracefully when the AI container is unavailable. No external AI APIs are used.

---

## Infrastructure

| Component | Details |
|-----------|---------|
| Container | `forge-ai` (Ollama) |
| Generation model | `gemma3:4b` (instruction following, help chat, search suggestions, RAG answers) |
| Embedding model | `all-minilm:l6-v2` (384-dimension vectors for semantic search) |
| Vector store | PostgreSQL + pgvector extension (`document_embeddings` table) |
| Config | `appsettings.json` → `Ollama` section (`BaseUrl`, `Model`, `EmbeddingModel`, `TimeoutSeconds`) |
| Mock | `MockAiService` — used when `MockIntegrations=true`, returns canned responses |
| Interface | `IAiService` in `forge.core/Interfaces/IAiService.cs` |

Models are pulled automatically by the `forge-ai-init` container on first start.

---

## API Endpoints (`/api/v1/ai`)

All endpoints require a valid JWT (`[Authorize]`).

### `GET /api/v1/ai/status`
Check whether the Ollama service is reachable.

**Response:** `{ "available": true }`

**Handler:** `CheckAiAvailabilityHandler` → `IAiService.IsAvailableAsync()`

---

### `POST /api/v1/ai/generate`
Raw text generation. Used internally by other features (job description drafting, etc.).

**Request:**
```json
{ "prompt": "string (max 4000)", "systemPrompt": "string (optional)" }
```

**Response:** `{ "text": "..." }`

**Handler:** `GenerateTextHandler` → `IAiService.GenerateTextAsync()`

---

### `POST /api/v1/ai/summarize`
Summarize a block of text (e.g., job notes, activity log).

**Request:**
```json
{ "text": "string (max 10000)" }
```

**Response:** `{ "summary": "..." }`

**Handler:** `SummarizeTextHandler` → `IAiService.SummarizeAsync()`

---

### `POST /api/v1/ai/help`
Role-aware conversational help chat. The primary endpoint for the AI help panel.

**Request:**
```json
{
  "question": "string (max 2000)",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```
`history` is optional. When provided, the last 6 messages are included as conversation context.

**Response:** `{ "answer": "..." }`

**Role resolution:** The controller reads the user's JWT claims and selects their highest-privilege role using the priority order: `Admin > Manager > OfficeManager > PM > Engineer > ProductionWorker`. The role is passed to the handler as `UserRole`.

**Handler:** `AiHelpChatHandler`

**Pipeline:**
1. Resolve role → select role-specific system context string
2. Prepend `PersonalityContext` (universal behavior rules)
3. Embed the question with `all-minilm:l6-v2`
4. Vector-search `document_embeddings` for top-K similar chunks, filtered to entity types the role can see
5. Assemble full prompt: system context + RAG context + history + question
6. Call `IAiService.GenerateTextAsync()`
7. Run `SanitizeAnswer()` — strips hallucinated email addresses and support contact references
8. Return `{ answer }`

**RAG entity type access by role:**

| Role | Visible entity types |
|------|----------------------|
| Admin | All (no filter) |
| Manager | All (no filter) |
| OfficeManager | Customer, Invoice, Payment, SalesOrder, Shipment, Vendor, Expense, Documentation |
| PM | Job, Customer, Lead, Quote, SalesOrder, Documentation |
| Engineer | Job, Part, Asset, Customer, Documentation |
| ProductionWorker | Job, Part, Documentation |
| General (fallback) | Job, Part, Customer, Documentation |

Admins and Managers retrieve 7 top-K chunks; filtered roles retrieve 5.

**Post-processing (`SanitizeAnswer`):**
Applied to every help response before returning to the client. Strips:
- Hallucinated support contact phrases ("contact our support team at...")
- Any email address pattern (the model generates these from training data regardless of prompt instructions)
- Resulting double spaces and orphaned periods

---

### `POST /api/v1/ai/search-suggest`
AI-powered search suggestions for the global search bar (`Ctrl+K`). Given a natural-language query, returns 2–4 suggested pages to navigate to, with optional `?search=` query params pre-filled.

**Request:**
```json
{ "query": "string (max 200)" }
```

**Response:**
```json
[
  { "label": "Search Parts for 'widget'", "description": "...", "url": "/parts?search=widget", "icon": "inventory_2" }
]
```

The model is prompted to return a JSON array. If the response cannot be parsed, a hardcoded fallback returns backlog/parts/customers suggestions pre-filled with the search term.

**Handler:** `AiSearchSuggestHandler`

---

### `POST /api/v1/ai/search`
Direct RAG search — returns matching document chunks from the vector index, with an optional generated answer synthesized from the top 5 results.

**Request:**
```json
{
  "query": "string (max 2000)",
  "entityTypeFilter": "Job | Part | Customer | ... (optional)",
  "includeAnswer": true
}
```

**Response:**
```json
{
  "results": [
    { "entityType": "Job", "entityId": 42, "chunkText": "...", "sourceField": "Description", "score": 0.95 }
  ],
  "generatedAnswer": "..." // null if includeAnswer=false
}
```

Returns up to 10 chunks. Score is approximate (position-based from cosine distance ordering; ranges 0–1).

**Handler:** `RagSearchHandler`

---

### `POST /api/v1/ai/index`
Index a single entity into the vector store. Called automatically after entity saves (Jobs, Parts, Customers, Assets) to keep the index current.

**Request:**
```json
{ "entityType": "Job", "entityId": 42 }
```

**Response:** `{ "chunksIndexed": 3 }`

**Handler:** `IndexDocumentHandler`

**Indexed fields by entity type:**

| Entity | Fields indexed |
|--------|---------------|
| Job | Title, Description, IterationNotes |
| Part | PartNumber, Description, Material, ProcessSteps (concatenated) |
| FileAttachment | FileName (content extraction is future work) |
| Customer | Name, CompanyName |
| Asset | Name, Notes |
| Documentation | Markdown files from `/app/docs/` (see below) |

**Chunking strategy:** Paragraphs preferred (`\n\n` split). Falls back to character-based chunking at 500 chars with 50-char overlap. Each chunk gets its own embedding vector and row in `document_embeddings`.

---

### `POST /api/v1/ai/bulk-index`
Re-index all entities of a type (or all supported types). Used for initial setup and by the Hangfire scheduled job.

**Request:**
```json
{ "entityType": "Documentation" }  // omit entityType to re-index everything
```

Supported entity types: `Job`, `Part`, `FileAttachment`, `Customer`, `Asset`, `Documentation`.

`Documentation` is special — it reads markdown files from the `/app/docs/` filesystem path rather than the database. This is how the help chat gets knowledge about application features.

**Response:** `{ "totalChunksIndexed": 847 }`

**Scheduled execution:** Hangfire runs `IndexDocumentationCommand` daily at 3 AM to pick up any doc changes.

---

### `POST /api/v1/ai/assistants/{assistantId}/chat`
Chat with a configurable domain assistant (HR, Procurement, Sales, etc.). These are admin-created personas distinct from the built-in role help contexts.

**Request:**
```json
{ "question": "string", "history": [...] }
```

**Response:** same shape as `/help`

**Management:** see `AiAssistantsController` below.

---

## Configurable AI Assistants (`/api/v1/ai-assistants`)

Admins can create domain-specific assistant personas via the Admin > AI Assistants panel. These are stored as `AiAssistant` entities and surfaced in the AI panel as selectable assistants.

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/v1/ai-assistants` | Any | List active assistants |
| `GET /api/v1/ai-assistants/all` | Admin | List all (including inactive) |
| `GET /api/v1/ai-assistants/{id}` | Any | Get single assistant |
| `POST /api/v1/ai-assistants` | Admin | Create assistant |
| `PUT /api/v1/ai-assistants/{id}` | Admin | Update assistant |
| `DELETE /api/v1/ai-assistants/{id}` | Admin | Delete assistant |

Each `AiAssistant` has: `Name`, `SystemPrompt`, `AllowedEntityTypes[]`, `StarterQuestions[]`, `Temperature`, `IsActive`.

---

## Help Chat System Context

The help chat uses role-specific system context strings defined as `private const string` values in `AiHelpChatHandler`. All contexts share a common `PersonalityContext` prepended at runtime.

### PersonalityContext (universal rules)

Applied to every help request regardless of role:

1. **No invented contact info** — no support emails, no helpdesk, no external contacts. If asked how to get help beyond this assistant, direct them to their manager.
2. **No sycophantic openers** — responses must start with the answer, not with "Great question", "Absolutely", "Certainly", etc.
3. **No apologies for software** — acknowledge frustration briefly if warranted, then give a solution.
4. **Wit's-end response** — if a user expresses "I give up / nothing works / I hate this", acknowledge honestly and tell them they may blame Daniel (the developer).
5. **Honesty** — say "I'm not sure" rather than guessing.
6. **Tone matching** — short casual question → short direct answer; technical question → precise answer.

### Role Contexts

| Role | Focus |
|------|-------|
| `General` | Broad feature overview, all workflows |
| `Engineer` | Kanban, time tracking, parts, inventory, quality, files, barcode scanning |
| `ProductionWorker` | Clock in/out, job movement, QC, account/pay stubs (short answers) |
| `PM` | Backlog, planning cycles, reports, leads, quotes |
| `Manager` | Everything PM + expense approval, invoices, team management, admin panel basics |
| `OfficeManager` | Customers, vendors, invoicing, payments, POs, shipments, AR aging |
| `Admin` | Admin panel tabs, Docker infrastructure, Hangfire, auth tiers, compliance setup |

Each context explicitly states: "The user is already logged in. Never suggest creating an account." No context uses conditional phrasing ("if you are a manager...") — the role is known and the context speaks directly to that person.

---

## RAG Knowledge Base

### What Gets Indexed

**Documentation** (primary source for how-to answers):
- All `.md` files in `/app/docs/` are read at startup and re-indexed daily at 3 AM
- Covers: architecture, functional decisions, roles/auth, UI components, coding standards, new-user guide
- Chunked by paragraph, 500-char max per chunk

**Entity data** (secondary source for "find X" type questions):
- Jobs: title, description, iteration notes
- Parts: part number, description, material, process steps
- Customers: name, company name
- Assets: name, notes
- File attachments: file name only (content extraction future work)
- Re-indexed automatically after creates/updates

### How RAG Works in Help Chat

1. User question is embedded using `all-minilm:l6-v2`
2. pgvector cosine similarity search returns top 5–7 most relevant chunks
3. Chunks are filtered to entity types the user's role is allowed to see
4. Matching chunks are prepended to the LLM prompt as labeled context blocks:
   ```
   [Job #42 — Description]: This job involves machining aluminum...
   [Documentation — new-user-guide.md]: The Kanban board is your primary workspace...
   ```
5. LLM synthesizes an answer from context + conversation history + question

If no similar chunks are found (e.g., AI container down, question too abstract), the LLM answers from its training data alone — which is fine for generic "how do I..." questions.

---

## Frontend Integration

### AI Help Panel (`shared/components/ai-help-panel/`)

The help panel is a fixed right-side drawer triggered by the robot icon in the app header.

- Calls `POST /api/v1/ai/help` on every message send
- Sends full message history (all prior turns) on each request — server takes last 6
- Renders assistant responses via `ngx-markdown` (`<markdown [data]="msg.content" />`)
- Welcome screen shows 4 starter questions (translated via i18n keys)
- "New conversation" button clears history
- Loading state shows 3-dot animated pulse indicator

### AI Feature Page (`features/ai/`)
Full-page AI search and Q&A interface. Uses `POST /api/v1/ai/search` with `includeAnswer: true`.

### Global Search Suggestions (`Ctrl+K`)
When search input is not empty and user pauses, calls `POST /api/v1/ai/search-suggest` to populate AI-powered navigation shortcuts alongside standard entity results.

---

## Improving AI Responses

The base install improves the AI **without touching model weights** — RAG is the mandatory floor, available on any hardware:

**1. Update docs in `/docs/`**
Edit or add markdown files. The next daily index (3 AM) or a manual `POST /api/v1/ai/bulk-index {"entityType":"Documentation"}` will update the RAG index. The AI's next answer about that topic will incorporate the new content. Per-client overrides can shadow shipped docs — see `ai.client-docs-path` (ai-fleet-orchestration D-2).

**2. Update system contexts in `AiHelpChat.cs`**
Add or correct specific how-to information in the role context strings. These are compiled into the handler — requires an API restart after changes.

**Model weights (opt-in, hardware-gated).** RAG + prompt engineering is the floor (`gemma3:4b` unmodified). Beyond it, the ai-fleet plan defines **opt-in customization tiers** chosen by the client's hardware/budget: Tier 0 = RAG scaffold only; Tier 1 = RAG + per-client LoRA adapters over a shared base; Tier 2 = RAG + fuller fine-tune / larger base models. Self-training is therefore an upgrade, not disallowed — see `delivery/in-progress/ai-fleet-orchestration/README.md`. The tier pipeline itself is not yet built (infra-deferred).

---

## Hangfire Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `DocumentIndexJob` | Every 30 minutes | Re-index recently modified entities |
| `IndexDocumentationCommand` | Daily 3 AM | Re-index all docs from `/app/docs/` |

Trigger manually via `POST /api/v1/ai/bulk-index` or through the Hangfire dashboard at `/hangfire`.
