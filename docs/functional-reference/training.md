# Training (LMS) — Functional Reference

## 1. Overview

Forge includes a built-in Learning Management System (LMS) that provides employee training through multiple content formats. The system ships with 46 seeded training modules organized into 8 learning paths covering topics from onboarding to advanced manufacturing workflows.

The LMS supports four content types (Article, Walkthrough, QuickRef, Quiz), randomized quiz question pools, interactive guided tours via driver.js, learning style filtering, progress tracking with time-spent analytics, and admin CRUD with per-user drill-down reporting.

**Key entities:** `TrainingModule`, `TrainingPath`, `TrainingPathModule`, `TrainingPathEnrollment`, `TrainingProgress`

**Access:** All authenticated users can access `/training`. Admin CRUD is under `/admin/training` (Admin + Manager roles).

---

## 2. Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/training` | Redirects to `/training/my-learning` | Default landing |
| `/training/my-learning` | `TrainingComponent` | Enrolled paths with progress |
| `/training/paths` | `TrainingComponent` | Browse all available learning paths |
| `/training/all-modules` | `TrainingComponent` | Browse/filter all published modules |
| `/training/library` | Redirects to `/training/all-modules` | Legacy alias |
| `/training/module/:id` | `TrainingModuleComponent` | View/complete a single module |
| `/training/path/:id` | `TrainingPathComponent` | View path detail with ordered modules |

The main `TrainingComponent` uses the `:tab` route parameter pattern. Tabs are `my-learning`, `paths`, and `all-modules`. Tab switching navigates via `router.navigate(['..', tab])`.

---

## 3. My Learning Tab

The default landing tab shows the current user's enrolled learning paths as enrollment cards.

**Enrollment card contents:**
- Path icon (Material icon from `TrainingPath.icon`)
- Path title and description
- Module count: `{completedModules} / {totalModules} modules`
- Progress percentage (computed: `Math.round((completedModules / totalModules) * 100)`)
- Visual progress bar (`role="progressbar"` with ARIA attributes)
- Status chip: "Completed" (green) when `completedAt` is set, otherwise "Continue" chevron CTA
- Clicking a card navigates to `/training/path/{pathId}`

**Empty state:** Shows `<app-empty-state>` with `school` icon when the user has no enrollments.

---

## 4. Learning Paths Tab

Displays all active learning paths available in the system, regardless of enrollment status.

**Path card contents:**
- Path icon and title
- Description text
- Module count: `{modules.length} modules`
- If enrolled: `{completedModules}/{totalModules} complete` with progress bar
- Badges: "Completed" chip (green) if enrollment is complete, "Auto-assigned" chip (primary) if the path has `isAutoAssigned = true`

Clicking a path card navigates to `/training/path/{id}`.

---

## 5. All Modules Tab

Displays a filterable grid of all published training modules.

### Filters

| Filter | Control | Options |
|--------|---------|---------|
| Search | `<app-input>` with `search` prefix | Searches title and summary (case-insensitive) |
| Type | `<app-select>` | All, Article, Walkthrough, Quick Reference, Quiz |
| Learning Style | `<app-select>` | All, Visual, Reading, Hands-on |

All filtering is client-side. Modules are loaded once with `pageSize: 200`.

### Module Card

Each module renders as a card with:
- **Type bar:** Content type icon + label, status chip (Completed/In Progress) if applicable
- **Body:** Title, summary text
- **Footer:** Estimated time (`~{estimatedMinutes} min`), up to 3 tag chips
- **Style hint:** Learning style recommendation (e.g., "Best for: Reading / Writing learners")
- CSS classes: `training-card--completed`, `training-card--in-progress`, `[data-content-type]` attribute

Clicking a card navigates to `/training/module/{id}`.

---

## 6. Module Types

### 6.1 Article

**Content model (`ArticleContent`):**
```typescript
interface ArticleContent {
  body: string;           // Markdown body text
  sections: ArticleSection[];
}
interface ArticleSection {
  type: 'text' | 'image' | 'callout';
  content?: string;       // Markdown for text/callout
  url?: string;           // Image URL
  alt?: string;           // Image alt text
  caption?: string;       // Image caption
  level?: 'info' | 'warning' | 'tip';  // Callout severity
}
```

**Rendering:**
- If the body contains multiple H2/H3 headings, an article outline nav is rendered ("In this article")
- Body is rendered via `<markdown>` (ngx-markdown)
- Sections render in order: `text` as markdown, `image` as `<figure>` with optional caption, `callout` as info/warning/tip blocks with appropriate icons
- Completion requires a reading timer to reach the estimated time (see section 6.5)

### 6.2 Walkthrough

**Content model (`WalkthroughContent`):**
```typescript
interface WalkthroughContent {
  appRoute: string;           // Target page route (e.g., "/kanban")
  startButtonLabel: string;   // Custom label for start button
  steps: WalkthroughStep[];
}
interface WalkthroughStep {
  element?: string;           // CSS selector for highlighted element
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
  };
}
```

**Rendering:**
- Hero section with icon, description of the interactive tour concept
- Meta bar: step count, "Interactive" badge, "Drag the popover to reposition it" hint
- Step preview: numbered ordered list showing all step titles ("What you'll learn")
- Start button: "Take the Tour" (customizable via `startButtonLabel`)

**Tour execution (driver.js integration):**
1. Navigates to the target `appRoute` with `?walkthrough={moduleId}` query param
2. Dynamically imports `driver.js`
3. Creates a custom SVG connector overlay (`createTourSvg`) for visual connection between highlighted element and popover
4. Driver instance configured with: `animate: true`, `overlayOpacity: 0`, `allowClose: true`, popover class `qb-tour-popover`
5. `onHighlighted`: Updates SVG connector, sets up popover drag-to-reposition
6. `onNextClick`: On last step (Done), cleans up, marks module complete, navigates back to `/training/module/{id}`
7. `onDestroyed`: Cleans up SVG overlay on Escape/close
8. Navigation guard: If user navigates away mid-tour (back button, sidebar), tour is destroyed automatically

**Completion:** Completing the tour auto-marks the module as done. No reading timer is used.

### 6.3 Quick Reference (QuickRef)

**Content model (`QuickRefContent`):**
```typescript
interface QuickRefContent {
  title: string;
  groups: QuickRefGroup[];
}
interface QuickRefGroup {
  heading: string;
  items: QuickRefItem[];  // { label, value } pairs
}
```

**Rendering:**
- Title with print button (calls `window.print()`)
- Groups rendered as sections with heading, each containing a definition list (`<dl>`) of label/value pairs
- Minimal reading timer: `Math.min(30, estimatedMinutes * 15)` seconds minimum

### 6.4 Quiz

See section 7 (Quiz System) for full details.

### 6.5 Reading Timer

For Article and QuickRef modules, a reading timer tracks time spent on the page:
- **Article:** Target seconds = `Math.max(20, estimatedMinutes * 60)`
- **QuickRef:** Target seconds = `Math.min(30, estimatedMinutes * 15)`
- **Walkthrough:** No timer (target = 0, completes via tour)
- **Quiz:** No timer (completes via quiz submission)

Timer behavior:
- Ticks every 1 second via `interval(1000)` with `takeUntilDestroyed`
- Pauses when the browser tab is hidden (`document.hidden`)
- Pauses when `timerComplete()` is true
- Progress bar shows percentage: `Math.min(100, Math.round((elapsed / target) * 100))`
- "Mark as Complete" button is disabled until timer reaches 100%
- Remaining time displayed as `M:SS` or `Xs`
- Heartbeat sent every 30 seconds to `POST /progress/{moduleId}/heartbeat` with `{ seconds: 30 }`

---

## 7. Quiz System

### 7.1 Content Model

```typescript
interface QuizContent {
  passingScore: number;           // Percentage required to pass (e.g., 70)
  shuffleQuestions: boolean;      // Randomize question order
  shuffleOptions: boolean;        // Randomize option order per question
  showExplanationsAfterSubmit: boolean;  // Show explanations in review
  timeLimit?: number;             // Minutes (optional, display-only on frontend)
  questionsPerQuiz?: number;      // Random subset size per attempt
  poolSize?: number;              // Total questions in pool (injected by server)
  questions: QuizQuestion[];
}
interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  explanation?: string;           // Shown after submission if enabled
}
interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;            // Stripped for non-admin users by server
}
```

### 7.2 Randomized Question Pools

When `questionsPerQuiz` is set and is less than the total question count:

1. **Server-side selection:** `GetTrainingModuleHandler` randomly selects `questionsPerQuiz` questions from the full pool using Fisher-Yates shuffle
2. **Session persistence:** Selected question IDs are stored in `TrainingProgress.QuizSessionJson` so subsequent loads return the same questions (stable mid-quiz experience)
3. **Session reset:** On quiz failure, `QuizSessionJson` is cleared so the next attempt generates a fresh random selection
4. **On pass:** Session is preserved for post-pass review
5. **Pool size injection:** Server adds `poolSize` to the response so the frontend can display "randomly selected from {poolSize}"

### 7.3 Security

- `isCorrect` flags and `passingScore` are stripped from the JSON before returning to non-admin users
- Option order is shuffled server-side when `shuffleOptions` is true
- Scoring happens server-side only; the client never sees correct answers until after submission

### 7.4 Quiz UI Flow

**Pre-submission:**
- Info bar: question count, pool hint ("randomly selected from N"), passing score, optional time limit
- Progress bar: `{answeredCount} of {totalQuestions} answered`
- "Ready to submit" indicator when all questions are answered
- Questions rendered with radio button options (`role="radiogroup"`)
- Submit button disabled until all questions answered

**Post-submission (score card):**
- Score circle: percentage + PASSED/FAILED
- Score detail: `{correctCount} of {totalQuestions} correct`, `{passingScore}% required to pass`
- "Try Again" button if failed (calls `retry()` which resets all state; next load generates new random selection)
- Answer review section showing all questions with:
  - Correct answer highlighted (green check)
  - Incorrect user answers marked (red X)
  - Explanation text if `showExplanationsAfterSubmit` is true

### 7.5 Scoring

Scoring is performed in `SubmitQuizHandler`:
1. Only questions from the current session (`QuizSessionJson`) are scored
2. Score = `Math.Round((correctCount / totalScorable) * 100)`
3. Pass = `score >= passingScore`
4. On pass: status set to `Completed`, `CompletedAt` stamped, enrollment completion checked
5. On fail: status stays `InProgress`, `QuizSessionJson` cleared for next attempt
6. `QuizAttempts` incremented on each submission

### 7.6 Enrollment Auto-Completion

After a quiz pass (or any module completion), `CheckAndCompleteEnrollmentsAsync` runs:
1. Loads all incomplete enrollments for the user
2. For each enrollment, checks if all required modules (`IsRequired = true`) in the path are completed
3. If all required modules are complete, stamps `CompletedAt` on the enrollment

---

## 8. Learning Style Filter

The All Modules tab includes a "Learning Style" dropdown that maps learning preferences to content types:

| Learning Style | Matched Content Types |
|---------------|----------------------|
| Visual | Walkthrough, QuickRef |
| Reading | Article, QuickRef |
| Hands-on (Kinesthetic) | Walkthrough, Quiz |

Each module card also displays a style hint:
- Article: "Best for: Reading / Writing learners"
- Walkthrough: "Best for: Visual / Kinesthetic learners"
- QuickRef: "Best for: Visual / Reading learners"
- Quiz: "Best for: Kinesthetic learners -- learn by doing"

---

## 9. Admin CRUD

Admin training management is located within the Admin feature at `/admin/training` (accessible to Admin and Manager roles). The panel has three sub-tabs: Content, Paths, and User Progress.

### 9.1 Content Sub-Tab (Modules)

**DataTable columns:** Title, Content Type (chip with icon), Estimated Minutes, Published (check/unpublished icon), Actions

**Actions per module:**
- Edit (opens module dialog)
- Delete (soft-delete)
- Generate Walkthrough (Walkthrough type only) -- uses AI to auto-generate driver.js steps

**New Module button:** Opens `TrainingModuleDialogComponent` (800px dialog)

### 9.2 Module Dialog Fields

| Field | Control | Validation | Notes |
|-------|---------|------------|-------|
| Title | `<app-input>` | Required, max 200 chars | |
| Slug | `<app-input>` | Max 200 chars | Auto-generated from title (kebab-case), editable |
| Summary | `<app-textarea>` | Required, max 500 chars | 2 rows |
| Content Type | `<app-select>` | Required | Article, Video, Walkthrough, Quick Reference, Quiz |
| Estimated Minutes | `<app-input type="number">` | Required, min 1 | |
| App Routes | `<app-input>` | Optional | Comma-separated routes (e.g., `/kanban, /backlog`) |
| Tags | `<app-input>` | Optional | Comma-separated tags (e.g., `onboarding, kanban`) |
| Published | `<app-toggle>` | | Default: off |
| Content JSON | `<app-textarea>` | Must be valid JSON | 12 rows. Label changes based on content type (e.g., "Quiz Questions JSON", "Walkthrough Steps JSON") |

**Draft support:** Enabled via `DraftConfig` with `entityType: 'training-module'`.

**Slug auto-generation:** Title changes auto-generate the slug (lowercase, alphanumeric + hyphens) unless editing an existing module that already has a slug.

### 9.3 Walkthrough AI Generation

For Walkthrough-type modules, the admin panel provides a "Generate Walkthrough" button (sparkle icon). The flow:

1. Admin clicks the generate button on a walkthrough module row
2. `POST /api/v1/training/modules/{id}/generate-walkthrough` is called with the admin's JWT
3. Server uses PuppeteerSharp to navigate to the module's target page in a headless browser (authenticated as the admin)
4. Extracts the live DOM and sends it to Ollama for step generation
5. Returns generated `WalkthroughStep[]`
6. Opens a preview dialog (`WalkthroughPreviewDialogComponent`) for the admin to review and save

### 9.4 Paths Sub-Tab

**DataTable columns:** Title, Modules (count), Auto-assign, Active, Actions (edit)

**New Path button:** Opens `TrainingPathDialogComponent` (600px dialog)

### 9.5 Path Dialog Fields

| Field | Control | Validation | Notes |
|-------|---------|------------|-------|
| Title | `<app-input>` | Required, max 200 chars | |
| Slug | `<app-input>` | Max 200 chars | Auto-generated from title |
| Description | `<app-textarea>` | Max 500 chars | 2 rows |
| Icon | `<app-input>` | Max 50 chars | Material icon name (default: `school`) |
| Auto-assign to new users | `<app-toggle>` | | Default: off |
| Active | `<app-toggle>` | | Default: on |

**Draft support:** Enabled via `DraftConfig` with `entityType: 'training-path'`.

### 9.6 User Progress Sub-Tab

**DataTable columns:** User (display name), Role (chip), Enrolled (count), Completed (count), Progress (% with colored progress bar), Last Activity (date), Detail (open icon)

**Progress bar colors:**
- Green: >= 100%
- Yellow: >= 50% and < 100%
- Red: < 50%

Clicking the detail icon opens the per-user training detail panel (see section 10).

---

## 10. Per-User Detail Drill-Down

`UserTrainingDetailPanelComponent` provides a detailed view of a specific user's training progress. Opened from the admin Progress tab via `DetailDialogService` with entity type `training`.

**URL sync:** `?detail=training:{userId}` -- supports direct linking and auto-open on page load.

### Detail Panel Contents

**Header:** User display name, role chip

**Summary stats (3 columns):**
- `{completedCount} of {totalModules} Completed`
- `{overallCompletionPct}%` Overall Progress
- `{totalEnrolled}` Paths Enrolled

**Progress bar:** Full-width bar showing overall completion percentage

**Module breakdown:** List of all modules with:
- Content type icon
- Module title
- Time spent (formatted as `Xs`, `Xm`, or `Xh Xm`)
- Quiz score (if applicable)
- Completion date (MM/dd/yyyy)
- Status chip: Completed (green), In Progress (blue), Not Started (muted)

---

## 11. Progress Tracking

### 11.1 Progress Entity

```csharp
public class TrainingProgress : BaseAuditableEntity
{
    public int UserId { get; set; }
    public int ModuleId { get; set; }
    public TrainingProgressStatus Status { get; set; }  // NotStarted, InProgress, Completed
    public int? QuizScore { get; set; }
    public int? QuizAttempts { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int TimeSpentSeconds { get; set; }
    public string? QuizAnswersJson { get; set; }
    public string? QuizSessionJson { get; set; }  // Random question IDs for current session
    public int? WalkthroughStepReached { get; set; }
}
```

### 11.2 Progress Lifecycle

1. **Module opened:** `POST /progress/{moduleId}/start` -- creates/updates progress with `StartedAt`, status `InProgress`
2. **Heartbeat (every 30s):** `POST /progress/{moduleId}/heartbeat` with `{ seconds: 30 }` -- increments `TimeSpentSeconds`
3. **Module completed:** `POST /progress/{moduleId}/complete` -- sets status to `Completed`, stamps `CompletedAt`
4. **Quiz submitted:** `POST /progress/{moduleId}/submit-quiz` -- updates `QuizScore`, `QuizAttempts`, potentially sets `Completed`

### 11.3 Admin Progress Summary

`GET /training/admin/progress-summary` (Admin/Manager only) returns per-user aggregates:
- `displayName`, `role`
- `totalEnrolled`, `totalCompleted`
- `overallCompletionPct` (percentage)
- `lastActivityAt` (most recent progress timestamp)

---

## 12. Enrollment

### 12.1 Enrollment Entity

```csharp
public class TrainingPathEnrollment : BaseAuditableEntity
{
    public int UserId { get; set; }
    public int PathId { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public bool IsAutoAssigned { get; set; }
    public int? AssignedByUserId { get; set; }
}
```

### 12.2 Manual Enrollment

`POST /api/v1/training/enrollments` (Admin only):
```json
{ "userId": 5, "pathId": 3 }
```
- Creates enrollment record with `IsAutoAssigned = false` and `AssignedByUserId` set to the admin
- Duplicate enrollment throws `InvalidOperationException` (409)

### 12.3 Auto-Enrollment

Paths with `IsAutoAssigned = true` are automatically assigned to new users. The `TrainingPath.AllowedRoles` field can restrict auto-assignment to specific roles.

### 12.4 Path-Module Relationship

```csharp
public class TrainingPathModule : BaseAuditableEntity
{
    public int PathId { get; set; }
    public int ModuleId { get; set; }
    public int Position { get; set; }       // Order within path
    public bool IsRequired { get; set; }    // Required for path completion
}
```

Modules within a path have a `Position` (display order) and `IsRequired` flag. Only required modules count toward path completion. The path detail view shows a "Required" warning chip on required modules.

---

## 13. API Endpoints

### Modules

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/training/modules` | Any | List modules (paginated). Query: `search`, `contentType`, `tag`, `includeUnpublished`, `page`, `pageSize` |
| GET | `/api/v1/training/modules/by-route?route={route}` | Any | Get modules associated with a specific app route |
| GET | `/api/v1/training/modules/{id}` | Any | Get module detail (quiz content sanitized for non-admins) |
| POST | `/api/v1/training/modules` | Admin | Create module |
| PUT | `/api/v1/training/modules/{id}` | Admin | Update module |
| DELETE | `/api/v1/training/modules/{id}` | Admin | Soft-delete module |
| POST | `/api/v1/training/modules/{id}/generate-walkthrough` | Admin | AI-generate walkthrough steps |

### Paths

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/training/paths` | Any | List all paths (filtered by role for non-admins) |
| GET | `/api/v1/training/paths/{id}` | Any | Get path detail with modules and user progress |

### Enrollments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/training/enrollments` | Admin | Enroll a user in a path. Body: `{ userId, pathId }` |

### My Progress

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/training/my-enrollments` | Any | Current user's enrollments with progress counts |
| GET | `/api/v1/training/my-progress` | Any | Current user's module-level progress records |

### Progress Tracking

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/training/progress/{moduleId}/start` | Any | Record module start |
| POST | `/api/v1/training/progress/{moduleId}/heartbeat` | Any | Record time spent. Body: `{ seconds }` |
| POST | `/api/v1/training/progress/{moduleId}/complete` | Any | Mark module as complete |
| POST | `/api/v1/training/progress/{moduleId}/submit-quiz` | Any | Submit quiz answers. Body: `{ answers: [{ questionId, optionId }] }` |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/training/admin/progress-summary` | Admin, Manager | Per-user progress aggregates |
| GET | `/api/v1/training/admin/users/{userId}/detail` | Admin, Manager | Detailed module-level breakdown for a user |

---

## 14. Known Limitations

1. **No Video content type in frontend:** The `TrainingContentType` enum in .NET only includes Article, Walkthrough, QuickRef, and Quiz (Video was removed from the enum value `1`). The `VideoContent` model exists on the frontend but there is no rendering path in `TrainingModuleComponent`. The admin module dialog still shows "Video" as a content type option.

2. **No path editing beyond creation:** The path edit button in the admin Paths tab has a `click` handler that only stops propagation -- it does not open an edit dialog. Module ordering within paths and module-to-path assignment are not exposed in the UI.

3. **No module reordering UI:** The `SortOrder` field on modules and `Position` on path-modules must be managed via direct API calls or database edits -- there is no drag-and-drop or reorder UI.

4. **Content JSON is raw:** Module content is edited as raw JSON in a textarea. There is no visual editor for article sections, quiz question builders, or walkthrough step editors (except the AI-generated walkthrough preview).

5. **No self-enrollment:** Users cannot enroll themselves in paths. Enrollment requires an admin via `POST /enrollments` or auto-assignment on the path. The Paths tab shows available paths but has no "Enroll" button.

6. **Time limit is display-only:** The `timeLimit` field on quiz content is displayed in the UI but not enforced -- there is no countdown timer or auto-submission.

7. **No unenrollment:** There is no API endpoint or UI for removing a user from a path.

8. **No certificate/badge system:** Completing a path does not generate certificates, badges, or downloadable proof of completion.

9. **Quiz retry generates new questions immediately:** On retry, the frontend resets local state and re-fetches the module. Because `QuizSessionJson` was cleared on failure, the server generates a new random question set. There is no option to retry with the same questions.

10. **Walkthrough AI generation requires Ollama:** The `generate-walkthrough` endpoint depends on the AI profile (Ollama container) being available. It will fail if the AI service is not running.
