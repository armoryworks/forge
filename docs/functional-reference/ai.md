# AI Assistant

## Overview

The AI Assistant feature provides self-hosted, privacy-first AI capabilities powered by Ollama (local LLM inference) and pgvector (PostgreSQL vector similarity search). It includes configurable domain-specific assistants, a RAG (Retrieval-Augmented Generation) pipeline for document Q&A, smart search suggestions, text generation, and text summarization.

The system is fully optional -- all AI features degrade gracefully when the Ollama container is unavailable. No data leaves the network; all inference runs on the local Docker host.

### Models

| Model | Purpose | Size |
|-------|---------|------|
| `gemma3:4b` | Text generation, chat, summarization | ~2.7 GB |
| `all-minilm:l6-v2` | Embedding generation for vector search | ~23 MB |

Models are auto-pulled by the `forge-ai-init` container on first startup.

---

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/ai` | Redirects to `/ai/general` | Default redirect |
| `/ai/:assistantId` | `AiComponent` | Chat interface with selected assistant |

The `:assistantId` parameter is either `general` (resolves to the first assistant with `category === 'General'`) or a numeric assistant ID. When `general` resolves to an actual assistant, the route is replaced with the numeric ID via `replaceUrl: true`.

### Admin Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/admin/ai-assistants` | `AiAssistantsPanelComponent` | Admin tab for assistant CRUD |

---

## Chat Interface

### Layout

The AI chat page uses a two-panel layout:

1. **Left sidebar** (260px, `ai-sidebar`) -- list of available assistants.
2. **Right panel** (flex: 1, `ai-chat`) -- chat area for the selected assistant.

On mobile (`$breakpoint-mobile`), the sidebar becomes a horizontal scrollable strip (max-height 140px) above the chat area, and the layout switches to `flex-direction: column`.

### Assistant Sidebar

Each assistant is rendered as a card (`assistant-card`) with:

| Element | Source | Notes |
|---------|--------|-------|
| Icon | `icon` field | Material Icons Outlined, colored by `color` |
| Name | `name` | Primary text |
| Description | `description` | Muted text, truncated |

The active assistant has a primary-colored border and a subtle primary-tinted background (`color-mix(in srgb, var(--primary) 8%, var(--surface))`).

Clicking an assistant navigates to `/ai/{assistantId}`.

If no assistants are loaded, an `EmptyStateComponent` is shown with the `smart_toy` icon.

### Chat Header

When an assistant is selected, the header displays:

- Assistant icon (colored)
- Assistant name and description
- Category chip (`chip--primary`)
- Clear chat button (`delete_sweep` icon) -- visible only when there are messages

### Welcome Screen (No Messages)

When the conversation is empty, a centered welcome screen shows:

- Large assistant icon
- Assistant name (h2)
- Assistant description (paragraph, max-width 400px)
- Starter questions -- clickable buttons that auto-send the question

### Message Display

Messages are rendered in a scrollable area (`role="log"`, `aria-live="polite"`) with two visual styles:

| Role | Alignment | Background | Avatar |
|------|-----------|------------|--------|
| `user` | Right | `var(--primary)` with `--primary-btn-text` color | None |
| `assistant` | Left | `var(--surface)` with border | Colored square with assistant icon |

Messages have a maximum width of 80% (90% on mobile). Text preserves whitespace (`white-space: pre-wrap`) and breaks long words.

### Typing Indicator

While waiting for an AI response (`sending()` is true), a typing indicator is shown as an assistant-styled bubble with three bouncing dots (6px circles, `typing-bounce` keyframe animation with staggered delays).

### Message Input

| Field | Type | Notes |
|-------|------|-------|
| Message input | Text input | Placeholder: "Ask {assistant.name}..." (i18n: `ai.askPlaceholder`). Full width minus send button. |
| Send button | Action button (primary) | `send` icon. Disabled when input is empty or `sending()` is true. |

**Keyboard:** Enter sends the message; Shift+Enter inserts a newline.

### Conversation Management

- Conversations are stored in memory per assistant (a `Map<number, ChatMessage[]>` keyed by assistant ID).
- Switching assistants preserves conversation history for each assistant within the session.
- Clearing chat (`clearChat()`) empties the conversation for the active assistant.
- Conversations are not persisted -- they are lost on page refresh or navigation away.
- The last 10 messages are sent as conversation history with each request (the API uses the last 6).

---

## Smart Search (AI Search Suggestions)

The AI search suggest feature is consumed by the global search bar in the header. When the user types a search query and the AI service is available, the system generates context-aware navigation suggestions.

### Pipeline

1. User types a search query in the header search bar.
2. After a 600ms debounce, the frontend calls `AiService.searchSuggest(query)`.
3. The server (`AiSearchSuggestHandler`) builds a prompt listing all application pages with their URL paths.
4. The Ollama model generates 2-4 JSON suggestions, each with a label, description, URL (with `?search=` param), and Material icon name.
5. The response JSON is parsed. If parsing fails, fallback suggestions (Search Jobs, Search Parts, Search Customers) are returned.

### Fallback Behavior

If the AI service is unavailable or the model returns unparseable output, three hardcoded fallback suggestions are returned:

| Label | URL | Icon |
|-------|-----|------|
| Search Jobs | `/backlog?search={query}` | `work` |
| Search Parts | `/parts?search={query}` | `inventory_2` |
| Search Customers | `/customers?search={query}` | `people` |

---

## RAG Pipeline (Vector Search)

### How It Works

1. **Indexing** -- Entity text fields are split into chunks (~500 chars with 50-char overlap), embedded via `all-minilm:l6-v2`, and stored in the `document_embeddings` table with pgvector `vector(384)` columns.
2. **Querying** -- A user's question is embedded, then cosine similarity is used to find the top-K most relevant chunks from the embeddings table.
3. **Generation** -- The retrieved chunks are injected as context into a prompt, and `gemma3:4b` generates a natural-language answer.

### Indexed Entity Types

| Entity Type | Fields Indexed | Notes |
|-------------|---------------|-------|
| `Job` | Title, Description, IterationNotes | |
| `Part` | PartNumber, Description, Material, Operations (all steps concatenated) | |
| `Customer` | Name, CompanyName | |
| `Asset` | Name, Notes | |
| `FileAttachment` | FileName only | Full file content extraction is future work |
| `Documentation` | Markdown files from `/app/docs` | Split by heading sections |

### Chunking Strategy

**Entity text** (500-char chunks):

1. Split text by paragraph boundaries (`\n\n`).
2. Accumulate paragraphs until chunk exceeds 500 characters.
3. Save chunk, carry 50-character overlap into the next chunk.
4. If no paragraphs, fall back to character-based sliding window (500 chars, 50 overlap).

**Documentation** (450-char chunks):

1. Split markdown by heading boundaries (`# `, `## `, `### `).
2. Accumulate sections until chunk exceeds 450 characters.
3. Each chunk is prefixed with `[Source: {fileName}]`.
4. Secondary pass splits any chunks still exceeding 450 chars.

### Embedding Storage

Embeddings are stored in the `document_embeddings` table:

| Column | Type | Notes |
|--------|------|-------|
| `entity_type` | `text` | e.g., "Job", "Part", "Documentation" |
| `entity_id` | `int` | Entity primary key (for Documentation, a hash-based deterministic ID) |
| `chunk_text` | `text` | The text chunk |
| `chunk_index` | `int` | Sequential index within the entity |
| `source_field` | `text?` | Which field the chunk came from (e.g., "Title", "Description") |
| `embedding` | `vector(384)` | pgvector embedding from `all-minilm:l6-v2` |
| `model_name` | `text` | The embedding model used |

Embeddings are upserted -- re-indexing an entity replaces all its existing embeddings.

---

## Help Chat (Role-Based)

The help chat feature (consumed by the header AI help button) provides a conversational assistant with role-aware context. It supports both synchronous and streaming (SSE) responses.

### Role-Based Context

The user's highest-privilege role determines:

1. **System prompt** -- role-specific instructions covering the user's typical workflow, accessible features, and common tasks.
2. **RAG entity type filter** -- limits which entity types appear in RAG context.

| Role | RAG Entity Filter | System Prompt Focus |
|------|------------------|-------------------|
| Admin | All (no filter) | Full system config, Hangfire, Docker, compliance |
| Manager | All (no filter) | Operations, team management, financials, purchasing |
| OfficeManager | Customer, Invoice, Payment, SalesOrder, Shipment, Vendor, Expense, Documentation | Customer/vendor management, invoicing, AR, expenses |
| PM | Job, Customer, Lead, Quote, SalesOrder, Documentation | Planning, scheduling, reports, capacity |
| Engineer | Job, Part, Asset, Customer, Documentation | Kanban, parts, inventory, time tracking, QC |
| ProductionWorker | Job, Part, Documentation | Clock in/out, kanban, QC checklists |
| General (fallback) | Job, Part, Customer, Documentation | Full feature overview |

### Personality Rules

All role contexts share a common personality preamble that enforces:

1. No external support team references -- the assistant says "use this assistant or speak to your manager."
2. No filler phrases -- responses start with the answer directly.
3. No apologies for the software -- acknowledge frustration briefly, then solve.
4. Humor when the user is frustrated -- they are "welcome to blame Daniel, the person who built this."
5. Honesty -- "I'm not sure" when uncertain.
6. Tone matching -- short question = short answer, technical question = precise answer.

### Answer Sanitization

Server-side, the help chat handler sanitizes generated answers by:

- Removing hallucinated support contact info and email addresses (regex-based).
- Replacing "contact support" phrasing with "use this assistant or speak to your manager."
- Collapsing multiple spaces and consecutive periods.

### Streaming (SSE)

The `/api/v1/ai/help/stream` endpoint returns a `text/event-stream` response:

- Each token is sent as a `data: {escaped_token}\n\n` line.
- Newlines within tokens are escaped as `\\n` / `\\r` on the server and unescaped on the client.
- The stream terminates with `data: [DONE]\n\n`.
- Client uses the Fetch API with `ReadableStream` (not EventSource) for POST body support.
- The `AiService.streamHelpChat()` method returns an `Observable<string>` that emits individual tokens.

---

## Configurable Assistants

### Overview

Administrators can create custom AI assistants with domain-specific system prompts, RAG entity filters, and starter questions. Four built-in assistants are seeded on first startup.

### Built-In Assistants (Seeded)

| Name | Category | Icon | Color | Temperature | Max Chunks | Starter Questions |
|------|----------|------|-------|-------------|------------|-------------------|
| General Assistant | General | `smart_toy` | `#0d9488` | 0.7 | 5 | How to create a job, quote-to-order workflow, inventory tracking, keyboard shortcuts |
| HR Assistant | HR | `badge` | `#7c3aed` | 0.5 | 5 | Compliance items, onboarding status, new hire setup, time tracking |
| Procurement Assistant | Procurement | `local_shipping` | `#c2410c` | 0.5 | 7 | Vendor lookup, PO tracking, low stock, receiving process |
| Sales & Marketing Assistant | Sales | `campaign` | `#15803d` | 0.7 | 7 | Lead conversion, quote-to-order, price lists, revenue by customer |

Built-in assistants have `isBuiltIn: true` and cannot be deleted (only edited).

### Assistant Chat Flow

1. User sends a message to a specific assistant via `POST /api/v1/ai/assistants/{assistantId}/chat`.
2. Server checks AI availability (5-second timeout). If unavailable, returns a canned "unavailable" message.
3. Server loads the assistant's config (system prompt, allowed entity types, temperature, max context chunks).
4. RAG context is built using the assistant's `AllowedEntityTypes` filter and `MaxContextChunks` limit.
5. The last 6 messages of conversation history are included in the prompt.
6. The model generates a response using the assistant's `SystemPrompt` as the system message and configured `Temperature`.

### Entity Type Filters

Each assistant can restrict which RAG entity types are included in its context. An empty list (`[]`) means all entity types are included. Available entity types for filtering:

`Job`, `Part`, `Customer`, `Vendor`, `Lead`, `Quote`, `SalesOrder`, `PurchaseOrder`, `Invoice`, `Expense`, `Asset`, `EmployeeProfile`, `TimeEntry`, `ClockEvent`, `FileAttachment`, `BOMEntry`, `StorageLocation`, `BinContent`, `PriceList`, `Shipment`

---

## Admin Panel (AI Assistants CRUD)

### Location

The AI Assistants panel is a tab within the Admin page at `/admin/ai-assistants`.

### Assistant List (DataTable)

| Column | Field | Sortable | Filterable | Notes |
|--------|-------|----------|------------|-------|
| Icon | `icon` | No | No | Colored Material icon, 40px width |
| Name | `name` | Yes | No | Name + "Built-in" chip for seeded assistants |
| Category | `category` | Yes | Yes (enum) | Chip with options: General, HR, Procurement, Sales, Custom |
| Entity Filters | `allowedEntityTypes` | No | No | Shows count (e.g., "5 types") or "All" |
| Status | `isActive` | Yes | No | Green/gray dot + Active/Inactive label |
| Actions | -- | No | No | Edit button (always), Delete button (non-built-in only) |

Clicking a row opens the edit dialog. The panel header shows the count and a "New Assistant" button.

### Assistant Dialog (Create/Edit)

Width: 720px. Uses `<app-dialog>` with draft support.

#### Form Fields

| Field | Control | Validation | Required | Default | Notes |
|-------|---------|-----------|----------|---------|-------|
| Name | `<app-input>` | Max 100 chars | Yes | -- | |
| Category | `<app-select>` | -- | Yes | "Custom" | Options: General, HR, Procurement, Sales, Custom |
| Description | `<app-textarea>` | Max 500 chars | No | -- | 2 rows |
| Icon | `<app-input>` | Max 50 chars | Yes | "smart_toy" | Material Icons name. Live preview shown next to input. |
| Color | `<input type="color">` | -- | Yes | "#0d9488" | Native color picker. Preview icon uses selected color. |
| System Prompt | `<app-textarea>` | Max 50,000 chars | Yes | -- | 10 rows. The full system prompt sent to the model. |
| Entity Type Filters | `<app-select>` | -- | No | [] (all) | Multi-select. 20 entity type options. Empty = no filter. |
| Starter Questions | Custom list | -- | No | [] | Add/remove interface (text input + Add button). |
| Active | `<app-toggle>` | -- | No | true | |
| Sort Order | `<app-input>` (number) | >= 0 | Yes | 0 | Controls display order in sidebar |

#### Advanced Settings (Collapsible)

Hidden behind an "Advanced Settings" toggle button (`expand_more`/`expand_less`):

| Field | Control | Validation | Default | Notes |
|-------|---------|-----------|---------|-------|
| Temperature | `<app-input>` (number) | 0.0 -- 1.0 | 0.7 | Controls randomness. Lower = more deterministic. |
| Max Context Chunks | `<app-input>` (number) | 1 -- 20 | 5 | Number of RAG chunks included in the prompt |

#### Starter Questions Management

- Each question is displayed as a text row with a delete (close) icon button.
- New questions are added via a text input and "Add" button below the list.
- Empty state shows "No starter questions" in muted text.

#### Delete Confirmation

Deleting a non-built-in assistant shows a `ConfirmDialogComponent` with severity `danger`. Built-in assistants cannot be deleted (the delete button is hidden).

---

## Document Indexing

### Hangfire Jobs

| Job | Schedule | Entity Types | Notes |
|-----|----------|-------------|-------|
| `document-index` | Every 30 minutes | Job, Part, FileAttachment, Customer, Asset | Indexes all entities of each type |
| `documentation-index` | Daily at 3:00 AM | Documentation (markdown files) | Reads from `/app/docs` directory |

### Manual Indexing

Administrators can trigger indexing via the API:

- **Single entity:** `POST /api/v1/ai/index` with `{ entityType, entityId }` -- returns `{ chunksIndexed }`.
- **Bulk index:** `POST /api/v1/ai/bulk-index` with optional `{ entityType }` -- indexes all entities of the specified type (or all supported types if omitted). Returns `{ totalChunksIndexed }`.

### Bulk Index Handler

The `BulkIndexDocumentsHandler` iterates over six entity types (`Job`, `Part`, `FileAttachment`, `Customer`, `Asset`, `Documentation`). For each type, it queries all entity IDs from the database and indexes them one at a time via the `IndexDocumentCommand`. Documentation uses a separate `IndexDocumentationCommand` that reads markdown files from the filesystem.

Failures for individual entities are caught and logged (the bulk job continues).

---

## Model Configuration

### Ollama Options (`AiOptions`)

Configured via `appsettings.json` under the `Ollama` section:

| Setting | Default | Notes |
|---------|---------|-------|
| `BaseUrl` | `http://forge-ai:11434` | Ollama API endpoint |
| `Model` | `gemma3:4b` | Text generation model |
| `EmbeddingModel` | `all-minilm:l6-v2` | Embedding model (384 dimensions) |
| `VisionModel` | (optional) | Vision-capable model for PDF verification |
| `DocsPath` | `/app/docs` | Path to markdown documentation for indexing |

### Docker Container

The `forge-ai` service runs Ollama with GPU support (when available). The `forge-ai-init` sidecar container pulls the required models on first startup and exits.

---

## API Endpoints

All endpoints require `[Authorize]`. Base path: `/api/v1/ai` (core AI) and `/api/v1/ai-assistants` (assistant CRUD).

### Core AI Endpoints

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| GET | `/ai/status` | -- | `{ available: bool }` | Checks if Ollama is reachable |
| POST | `/ai/generate` | `{ prompt, systemPrompt? }` | `{ text }` | Raw text generation. Prompt max 4000 chars. |
| POST | `/ai/summarize` | `{ text }` | `{ summary }` | Summarize text. Max 10,000 chars. |
| POST | `/ai/search-suggest` | `{ query }` | `AiSearchSuggestion[]` | AI-powered search suggestions. Query max 200 chars. |
| POST | `/ai/help` | `{ question, history? }` | `{ answer }` | Role-aware help chat. Question max 2000 chars. |
| POST | `/ai/help/stream` | `{ question, history? }` | SSE `text/event-stream` | Streaming version of help chat |
| POST | `/ai/search` | `{ query, entityTypeFilter?, includeAnswer? }` | `{ results, generatedAnswer? }` | RAG vector search. Query max 2000 chars. |
| POST | `/ai/index` | `{ entityType, entityId }` | `{ chunksIndexed }` | Index a single entity |
| POST | `/ai/bulk-index` | `{ entityType? }` | `{ totalChunksIndexed }` | Bulk index all entities of a type (or all) |
| POST | `/ai/assistants/{assistantId}/chat` | `{ question, history? }` | `{ answer }` | Chat with a specific assistant. Question max 2000 chars. |

### Assistant CRUD Endpoints

| Method | Path | Auth | Request | Response | Notes |
|--------|------|------|---------|----------|-------|
| GET | `/ai-assistants` | Any | -- | `AiAssistantResponseModel[]` | Active assistants only (`IsActive = true`) |
| GET | `/ai-assistants/all` | Admin | -- | `AiAssistantResponseModel[]` | All assistants (active + inactive) |
| GET | `/ai-assistants/{id}` | Any | -- | `AiAssistantResponseModel` | Single assistant by ID |
| POST | `/ai-assistants` | Admin | `AiAssistantRequestModel` | `AiAssistantResponseModel` | Creates a new assistant. Returns 201. |
| PUT | `/ai-assistants/{id}` | Admin | `AiAssistantRequestModel` | `AiAssistantResponseModel` | Updates an existing assistant |
| DELETE | `/ai-assistants/{id}` | Admin | -- | 204 No Content | Soft-deletes an assistant |

### Request/Response Models

**AiAssistantRequestModel:**

| Field | Type | Validation | Default |
|-------|------|-----------|---------|
| `name` | `string` | Required, max 100 chars | -- |
| `description` | `string?` | Max 500 chars | `""` |
| `icon` | `string?` | Max 50 chars | `"smart_toy"` |
| `color` | `string?` | -- | `"#0d9488"` |
| `category` | `string?` | -- | `"Custom"` |
| `systemPrompt` | `string` | Required, max 50,000 chars | -- |
| `allowedEntityTypes` | `string[]?` | -- | `[]` |
| `starterQuestions` | `string[]?` | -- | `[]` |
| `isActive` | `bool` | -- | `true` |
| `sortOrder` | `int` | >= 0 | `0` |
| `temperature` | `double` | 0.0 -- 1.0 | `0.7` |
| `maxContextChunks` | `int` | 1 -- 20 | `5` |

**AiAssistantResponseModel:**

All fields from the request model, plus:

| Field | Type | Notes |
|-------|------|-------|
| `id` | `int` | Auto-generated primary key |
| `isBuiltIn` | `bool` | True for seeded assistants |

**RagSearchResultModel:**

| Field | Type | Notes |
|-------|------|-------|
| `entityType` | `string` | e.g., "Job", "Part" |
| `entityId` | `int` | Entity primary key |
| `chunkText` | `string` | The matched text chunk |
| `sourceField` | `string?` | Which field the chunk came from |
| `score` | `double` | Relevance score (0.0 -- 1.0, approximated from result position) |

---

## Graceful Degradation

When the Ollama container (`forge-ai`) is down or unreachable, the system degrades as follows:

| Feature | Behavior When AI Unavailable |
|---------|------------------------------|
| AI status check | `GET /ai/status` returns `{ available: false }`. Frontend sets `AiService.available()` to `false`. |
| Help chat | Returns canned message: "The AI service is currently unavailable. Please try again later." |
| Assistant chat | Same canned unavailability message. |
| Search suggestions | Falls back to three hardcoded suggestions (Search Jobs/Parts/Customers). |
| RAG search | Returns empty results (embedding generation fails gracefully, returns empty array). |
| Header AI column | Not rendered (conditional on `AiService.available()`). |
| Document indexing | Hangfire job logs a warning and skips. Individual index calls return 0 chunks. |
| Text generation | HTTP error propagated to caller. |
| Summarization | HTTP error propagated to caller. |

The availability check uses a 5-second timeout (`CancellationTokenSource.CreateLinkedTokenSource` with `CancelAfter(5s)`) to avoid blocking the UI.

---

## Database Entity

### DocumentEmbedding

Extends `BaseAuditableEntity`. Table: `document_embeddings`.

| Column | Type | Notes |
|--------|------|-------|
| `entity_type` | `text` | Entity type string |
| `entity_id` | `int` | Entity primary key |
| `chunk_text` | `text` | The text chunk |
| `chunk_index` | `int` | Sequential index within the entity |
| `source_field` | `text?` | Field name the chunk was extracted from |
| `embedding` | `vector(384)` | pgvector vector column |
| `model_name` | `text` | Embedding model name |

### AiAssistant

Extends `BaseAuditableEntity`. Table: `ai_assistants`.

| Column | Type | Notes |
|--------|------|-------|
| `name` | `text` | Display name |
| `description` | `text` | Short description |
| `icon` | `text` | Material Icons name |
| `color` | `text` | Hex color |
| `category` | `text` | General, HR, Procurement, Sales, Custom |
| `system_prompt` | `text` | Full system prompt (up to 50,000 chars) |
| `allowed_entity_types` | `text` | JSON array of entity type strings |
| `starter_questions` | `text` | JSON array of question strings |
| `is_active` | `bool` | Whether the assistant is available to users |
| `is_built_in` | `bool` | True for seeded assistants (cannot be deleted) |
| `sort_order` | `int` | Display order |
| `temperature` | `double` | LLM temperature (0.0 -- 1.0) |
| `max_context_chunks` | `int` | Number of RAG chunks to include |

---

## Known Limitations

1. **No response streaming in assistant chat** -- The help chat supports SSE streaming (`/ai/help/stream`), but the assistant chat endpoint (`/ai/assistants/{assistantId}/chat`) is synchronous only. Users see the typing indicator until the full response is ready.

2. **Conversation history is ephemeral** -- AI conversations are stored in the component's in-memory `Map` and lost on page refresh or navigation away. There is no server-side persistence of AI chat history.

3. **Approximate relevance scoring** -- RAG search scores are approximated from result position (`1.0 - (index * 0.05)`) rather than actual cosine similarity values. This is a simplification in the `RagSearchHandler`.

4. **No file content indexing** -- `FileAttachment` indexing only captures the filename. Full-text extraction of PDF, STEP, and other document content is not implemented.

5. **Sequential bulk indexing** -- The `BulkIndexDocumentsHandler` processes entities one at a time (no parallelism). For large datasets, this can be slow.

6. **No user-specific RAG context** -- The assistant chat uses the assistant's entity type filters but does not filter by the user's role or data permissions. A Production Worker chatting with the General Assistant could receive RAG context from any entity type.

7. **Documentation hash collisions** -- Documentation entity IDs are generated from filename hashes (`Math.Abs(fileName.GetHashCode()) % 900_000 + 100_000`). Hash collisions between filenames would cause embedding overwrites.

8. **No conversation branching** -- Users cannot fork or branch conversations. Each assistant has a single linear conversation thread.

9. **Limited history window** -- Only the last 6 messages of conversation history are included in the prompt (server-side), even though the client sends up to 10.

10. **No model selection UI** -- The Ollama model is configured server-side in `appsettings.json`. Users cannot choose between models.

11. **No token usage tracking** -- There is no visibility into token consumption, generation time, or cost per query.

12. **Single-language prompts** -- System prompts are in English regardless of the user's locale setting.
