# Training Content Guide

> Reference for writing, seeding, and maintaining training modules in the Forge LMS.
> See `implementation-status.md` for current module/path counts.

---

## Module Content Types

Each `TrainingModule.Content` is a JSONB column storing a typed payload.
The `TrainingContentType` enum determines which renderer is used on the frontend.

---

### Article (`ArticleContent`)

Rich long-form content. Rendered with sidebar table of contents, collapsible sections.

```json
{
  "sections": [
    {
      "id": "intro",
      "heading": "Introduction",
      "body": "Markdown or plain text paragraph content..."
    },
    {
      "id": "step-by-step",
      "heading": "Step-by-Step Guide",
      "body": "Another section body..."
    }
  ]
}
```

**Tips:**
- Keep `id` values lowercase-kebab (used as anchor links for TOC)
- Aim for 4–8 sections per article
- `estimatedMinutes` should reflect reading time at ~200 wpm

---

### Video (`VideoContent`)

YouTube embed with chapters and optional transcript.

```json
{
  "youtubeId": "dQw4w9WgXcQ",
  "chapters": [
    { "timeSeconds": 0,   "label": "Introduction" },
    { "timeSeconds": 45,  "label": "Creating a Job Card" },
    { "timeSeconds": 120, "label": "Moving Between Stages" }
  ],
  "transcript": "Optional full transcript text..."
}
```

**Tips:**
- `youtubeId` is the 11-character video ID from the URL
- Chapters improve navigation; include at least 3 for videos > 5 min
- `transcript` is optional but improves searchability

---

### Walkthrough (`WalkthroughContent`)

Interactive step-by-step tour rendered via driver.js.

```json
{
  "steps": [
    {
      "element": "#kanban-board",
      "title": "The Kanban Board",
      "body": "This is your main production tracking board. Each column is a stage in your workflow."
    },
    {
      "element": ".job-card:first-child",
      "title": "Job Cards",
      "body": "Each card represents a job. Click a card to see its details."
    }
  ]
}
```

**Tips:**
- `element` is a CSS selector pointing to a real DOM element in the app
- Keep steps short (1–2 sentences) — driver.js overlays are read quickly
- Typically 5–12 steps per walkthrough
- Test that selectors still match after UI changes

---

### Quick Reference (`QuickRefContent`)

Tabular reference sections — keyboard shortcuts, field definitions, status codes, etc.

```json
{
  "sections": [
    {
      "heading": "Keyboard Shortcuts",
      "rows": [
        { "key": "Ctrl + N",      "value": "New Job" },
        { "key": "Ctrl + F",      "value": "Focus Search" },
        { "key": "Escape",        "value": "Close dialog / panel" }
      ]
    },
    {
      "heading": "Job Statuses",
      "rows": [
        { "key": "Quote Requested", "value": "Initial inquiry received, awaiting quote" },
        { "key": "In Production",   "value": "Active manufacturing or build work" }
      ]
    }
  ]
}
```

**Tips:**
- Each section renders as a labeled two-column table
- QuickRef modules include a Print button (browser print dialog, hides nav)
- Ideal for reference content users will return to repeatedly

---

### Quiz (`QuizContent`)

Randomized question pool with multiple-choice answers. Questions and options are shuffled per attempt.

```json
{
  "questionsPerQuiz": 5,
  "passingScore": 80,
  "questions": [
    {
      "id": "q1",
      "text": "What is the primary purpose of a Kanban board?",
      "options": [
        { "id": "a", "text": "To track inventory levels" },
        { "id": "b", "text": "To visualize workflow stages and job progress", "correct": true },
        { "id": "c", "text": "To manage employee schedules" },
        { "id": "d", "text": "To generate invoices automatically" }
      ]
    },
    {
      "id": "q2",
      "text": "Which action is NOT available from the kanban bulk action bar?",
      "options": [
        { "id": "a", "text": "Move selected jobs to a different stage" },
        { "id": "b", "text": "Assign selected jobs to a user" },
        { "id": "c", "text": "Delete selected jobs permanently", "correct": true },
        { "id": "d", "text": "Archive selected jobs" }
      ]
    }
  ]
}
```

**Tips:**
- Pool size should be 20–25 questions; `questionsPerQuiz` controls how many are selected per attempt
- Minimum recommended `questionsPerQuiz`: 5 (short check-in), 8–10 (standard quiz)
- `passingScore` is a percentage (0–100), default 80
- Each question MUST have exactly one option with `"correct": true`
- Question `id` values are stable identifiers used for session persistence — never reuse IDs
- Option `id` values (`a`, `b`, `c`, `d`) are used in session tracking — keep them stable
- Write distractor options that are plausible but clearly wrong on reflection
- Avoid double negatives in question text

---

## Seed Data Patterns

### Module Idempotency (by slug)

All modules are seeded by slug. If a module with that slug already exists in the DB, the seed skips it.

```csharp
private static async Task<TrainingModule> GetOrCreateModule(
    AppDbContext db, string slug, Func<TrainingModule> factory)
{
    var existing = await db.TrainingModules.FirstOrDefaultAsync(m => m.Slug == slug);
    if (existing != null) return existing;
    var module = factory();
    db.TrainingModules.Add(module);
    await db.SaveChangesAsync();
    return module;
}
```

### Path Existence Guards (per path title)

Paths are guarded by title so they can be added to an already-seeded database:

```csharp
if (!await db.TrainingPaths.Where(p => p.Title == "Shop Floor Worker").AnyAsync())
{
    // create path and associate modules
}
```

### Separate Seed Methods (for additions)

The initial `SeedTrainingAsync` has `if (await db.TrainingModules.AnyAsync()) return;` — it skips all modules if any exist.

When adding new content to an existing database, use a **separate method** called after the initial seed:

```csharp
// In SeedAsync — order matters:
await SeedTrainingAsync(db);                    // original (skips if modules exist)
await SeedAdditionalTrainingPathsAsync(db);     // new paths — per-path guards, always runs
```

### Cross-Path Module Reuse

Modules can be associated with multiple paths. Use the `bySlug` dictionary to look up existing modules:

```csharp
var bySlug = await db.TrainingModules
    .ToDictionaryAsync(m => m.Slug, m => m);

// Reuse in a new path:
if (bySlug.TryGetValue("kanban-board-basics", out var kanban))
    path.Modules.Add(new TrainingPathModule { Module = kanban, Order = 1 });
```

---

## Content Library (Current)

### Paths (8 total)

| # | Title | Modules | Auto-Assigned | Target Role |
|---|-------|---------|--------------|-------------|
| 1 | New Employee Onboarding | 7 | Yes | All |
| 2 | Production Engineer Training | 8 | Yes | Engineer |
| 3 | Shop Floor Worker | 6 | No | Worker |
| 4 | Production Manager | 6 | No | Manager |
| 5 | Office and Finance | 7 | No | Office Manager |
| 6 | Parts, Inventory and Quality | 7 | No | Engineer/PM |
| 7 | Admin Setup and Configuration | 7 | No | Admin |
| 8 | Sales and Customer Management | 5 | No | PM/Office |

### Module Slugs (stable identifiers)

The following slugs are defined in seed data. Never rename a slug after initial deployment — it breaks session persistence and progress records.

| Slug | Type | Path(s) |
|------|------|---------|
| `welcome-to-forge` | Article | 1 |
| `navigating-the-interface` | Walkthrough | 1 |
| `kanban-board-basics` | Walkthrough | 1, 2, 4 |
| `logging-your-time` | Article | 1, 3 |
| `submitting-expenses` | Article | 1, 3 |
| `planning-and-cycles` | Article | 1 |
| `onboarding-quiz` | Quiz | 1 |
| `job-card-deep-dive` | Article | 2 |
| `backlog-and-planning` | Article | 2, 4 |
| `parts-catalog-basics` | Article | 2, 6 |
| `purchase-orders-and-receiving` | Article | 2, 5, 6 |
| `reports-and-analytics` | Article | 2, 4 |
| `quality-control-basics` | Article | 2, 6 |
| `time-tracking-advanced` | Walkthrough | 2 |
| `engineer-quiz` | Quiz | 2 |
| `clock-in-clock-out` | Walkthrough | 3 |
| `kiosk-authentication` | Article | 3 |
| `shop-floor-scanning` | Article | 3 |
| `shop-floor-quick-reference` | QuickRef | 3 |
| `approving-expenses` | Article | 4 |
| `capacity-monitoring` | Article | 4 |
| `manager-quiz` | Quiz | 4 |
| `customers-and-contacts` | Article | 5, 8 |
| `quotes-and-estimates` | Article | 5, 8 |
| `invoicing-and-payments` | Article | 5 |
| `recording-payments` | Article | 5 |
| `vendor-management` | Article | 5 |
| `office-quick-reference` | QuickRef | 5 |
| `inventory-management` | Article | 6 |
| `bin-transfers-walkthrough` | Walkthrough | 6 |
| `quality-inspections-advanced` | Article | 6 |
| `inventory-quick-reference` | QuickRef | 6 |
| `parts-inventory-quiz` | Quiz | 6 |
| `system-settings-overview` | Article | 7 |
| `compliance-form-admin` | Article | 7 |
| `integrations-setup` | Article | 7 |
| `reference-data-management` | Article | 7 |
| `audit-log-quick-reference` | QuickRef | 7 |
| `training-module-admin` | Article | 7 |
| `leads-pipeline` | Article | 8 |
| `shipments-and-tracking` | Article | 8 |
| `sales-quick-reference` | QuickRef | 8 |
| `parts-quick-reference` | QuickRef | 6 |
| `admin-users-and-roles` | Article | 7 |

---

## Naming Conventions

| Element | Rule | Example |
|---------|------|---------|
| Module slug | lowercase-kebab, unique, immutable after creation | `kanban-board-basics` |
| Module title | Title Case, max 60 chars | "Kanban Board Basics" |
| Module summary | Sentence case, max 160 chars, no period | "Learn how to create, move, and manage job cards on the kanban board" |
| Quiz question ID | `q` + 1-based integer | `q1`, `q2`, `q3` |
| Quiz option ID | Single lowercase letter | `a`, `b`, `c`, `d` |
| Path icon | Material Icons Outlined name | `school`, `engineering`, `factory` |

---

## Admin Panel Operations

The admin Training panel (accessible to Admin and Manager roles) has three tabs:

- **Content** — Create/edit/delete individual modules. JSON editor for ContentJson field.
- **Paths** — Create/edit/delete paths. Module picker with drag-reorder.
- **User Progress** — DataTable showing all users with enrollment summary. Click the `open_in_new` icon on any row to open a `DetailSidePanelComponent` showing per-module breakdown.

### Regenerating Walkthrough Steps

Walkthrough-type rows in the Content tab show an `auto_awesome` "Regenerate Steps" button (opens `WalkthroughPreviewDialogComponent`). This triggers `IAiService.GenerateAsync()` with the module title and summary as context, and the current steps JSON as a revision seed.

---

## Adding New Content

1. Choose the appropriate content type for the learning objective
2. Assign a unique slug (kebab-case, describes the content, never reused)
3. Write the `ContentJson` following the schema above
4. Add to `SeedData.cs` via `GetOrCreateModule()` helper
5. If adding a new path, add a title-guard and associate modules via `bySlug`
6. Run `docker compose up -d --build forge-api` to apply seed changes to dev DB
7. Verify the module appears in `/training/all-modules` and the path appears in `/training/paths`
