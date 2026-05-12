# AI Assistant

**Route:** `/ai`
**Access Roles:** All roles (role-filtered responses)
**Page Title:** AI Assistant

## Purpose

The AI module provides two surfaces:

1. **Built-in Help Chat** (robot icon in header) — role-aware Q&A about the platform
2. **AI Assistant Page** — configurable domain assistants (HR, procurement, sales)

Both use Ollama (self-hosted LLM: llama3.2:3b) with RAG retrieval from pgvector.

## Role-Based Help Chat

The header robot icon opens a context-aware chat. Responses and RAG data are filtered
by the user's highest-privilege role:

| Role | Context | RAG Sources |
|:-----|:--------|:------------|
| Admin | Full system + admin panel + Docker + Hangfire | All entity types |
| Manager | Operations + financials + team management | All entity types |
| Office Manager | Customers, invoices, AR, shipments | Customer, Invoice, Payment, SO, Shipment, Vendor, Expense, Documentation |
| PM | Backlog, planning, reports, leads | Job, Customer, Lead, Quote, SO, Documentation |
| Engineer | Kanban, parts, inventory, quality, time | Job, Part, Asset, Customer, Documentation |
| Production Worker | Shop floor, timer, QC basics | Job, Part, Documentation |

## Configurable AI Assistants (Admin)

Admins can create domain-specific assistants (HR assistant, Procurement assistant, etc.)
with custom system prompts and RAG configurations. Accessible from Admin > AI Assistants.

## RAG Infrastructure

- **Model:** all-minilm:l6-v2 for embeddings (384-dim pgvector)
- **Generation:** llama3.2:3b
- **Indexed sources:** 12 documentation files + Jobs, Parts, Customers, Assets
- **Total vectors:** ~1553+ documentation chunks
- **Indexing:** Hangfire — every 30 min for entities, daily at 3 AM for docs
- **Chunk size:** 450 chars (safe for all-minilm:l6-v2 ~256 token limit)

## Toolbar Actions

- New Conversation
- Clear History


## Finding Controls

Use these landmarks when you need help locating a specific control.
Positions are described relative to a standard 1920×1080 desktop layout.

### 🔵 Top Header Bar (always visible, 44px strip at very top)

- **Open Chat** — look for the `chat_bubble_outline` icon (right side of toolbar)
- **Ai Assistant (smart_toy)** — look for the `smart_toy` icon (right side of toolbar)
- **Notifications bell** — look for the `notifications_none` icon (top-right corner)
- **Toggle dark/light theme** — look for the `dark_mode` icon (top-right corner)
- **User, Admin** — look for the `menu` icon (top-right corner)

### 🟦 Page Toolbar (below header — search, filters, action buttons)

- **Dismiss onboarding banner** — look for the `close` icon (top-right corner)
- **Expand sidebar** — look for the `chevron_right` icon (left sidebar)

### 📋 Top of Content Area (first rows, column headers)

- **General AssistantGeneral-purpose help for navigating and using Forge.** — look for the `smart_toy` icon (left side of toolbar)
- **HR AssistantEmployee onboarding, compliance, training, and policy guidance.** — look for the `badge` icon (left side of toolbar)

### 📄 Middle of Page (main content)

- **How do I create a new job?** — look for the `chat_bubble_outline` icon (center)
- **How does the quote to order workflow work?** — look for the `chat_bubble_outline` icon (center)
- **How do I track inventory?** — look for the `chat_bubble_outline` icon (center)
- **What keyboard shortcuts are available?** — look for the `chat_bubble_outline` icon (center)

<!-- /finding-controls -->

## UX Analysis

### Flow Quality: ★★★★☆

Self-hosted AI with role-based context filtering is a strong differentiator. No data
leaves the local infrastructure.

### Usability Observations

- Conversation history persists within the session
- Smart search in header uses AI to enhance search suggestions
- Graceful degradation when Ollama is unavailable

### Functional Gaps / Missing Features

- No AI-assisted job description generation from template (RAG context could draft it)
- No predictive lead time estimation from historical job data
- No anomaly detection alerts (e.g., "this job is behind typical pace")
- Vision model (llava:7b) configured but not yet wired to specific UI interactions
- No streaming responses (full response arrives at once — no token streaming)
- AI assistant page UX for non-technical users needs more guided prompts
