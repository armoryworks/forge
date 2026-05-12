# Notifications

## Overview

The notification system provides real-time and persistent alerts to users about events, assignments, deadlines, and system-generated warnings across the application. It combines two delivery mechanisms:

- **Push (real-time):** SignalR `NotificationHub` pushes notifications to connected clients the moment they are created. The frontend `NotificationHubService` listens for `notificationReceived` events and immediately adds them to the in-memory notification list via `NotificationService.push()`.
- **Pull (on-demand):** The frontend fetches the full notification list from `GET /api/v1/notifications` on app initialization (after authentication) and each time the notification panel is opened, ensuring any notifications missed during a SignalR disconnection are recovered.

Additionally, the system sends **email notifications** via SMTP for daily digests and other scheduled summaries. Email delivery is handled by `IEmailService` (implemented by `SmtpEmailService` using MailKit) and is independent of the in-app notification system.

All notifications are persisted in the `notifications` database table. Dismissed notifications are excluded from API responses but remain in the database (soft filtering via `IsDismissed` flag -- not soft delete via `DeletedAt`).

---

## Routes

### Full Page: `/notifications`

The dedicated notifications page at `/notifications` provides a full-screen view with two tabs:

- **All Notifications** -- DataTable listing all non-dismissed notifications with search, severity filter, and source filter. Includes "Mark All Read" and "Dismiss All" bulk actions in the toolbar.
- **Preferences** -- Per-user notification preference toggles (email delivery and sound settings).

Route definition in `notifications.routes.ts`:

```typescript
export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./notifications.component').then(m => m.NotificationsComponent),
  },
];
```

### Header Panel

The primary interaction point is the notification bell icon in the application header (`app-header.component.html`). Clicking the bell opens a slide-down `NotificationPanelComponent` overlay anchored to the header. A backdrop covers the rest of the page; clicking it or pressing Escape closes the panel.

---

## Notification Panel

The notification panel (`shared/components/notification-panel/`) is the quick-access overlay displayed from the header bell icon.

### Bell Icon and Badge

The bell icon (`notifications_none`) appears in the header action bar. When unread notifications exist, a numeric badge overlays the icon showing the count. The count is derived from `NotificationService.unreadCount`, which computes the number of notifications where `isRead === false` and `isDismissed === false`.

### Panel Structure

The panel has three sections:

1. **Header** -- Tab bar (All / Messages / Alerts) plus a "Mark All Read" icon button (visible only when unread count > 0).
2. **List** -- Scrollable list of notification items. Each item displays:
   - **Icon** -- Sender avatar (if `senderInitials` is present) or a severity icon (`info`, `warning`, `error` for critical).
   - **Title** -- Bold notification title.
   - **Message** -- Rendered through `RichTextPipe` to support formatted content.
   - **Timestamp** -- Formatted as `MM/dd/yyyy hh:mm a`.
   - **Actions** -- Pin/unpin button and dismiss (close) button, both stopping event propagation to prevent navigation.
   - Visual indicators: unread items have a distinct background; pinned items have a pinned styling.
3. **Footer** -- "Dismiss All" button.

### Notification Click Behavior

Clicking a notification item:
1. Marks the notification as read (optimistic UI update + API PATCH).
2. If the notification has `entityType` and `entityId`, closes the panel and navigates to the relevant entity page.

### Entity Route Resolution

The panel resolves entity types to application routes:

| Entity Type | Route | Query Params |
|-------------|-------|--------------|
| `job` | `/board` | `?job={id}` |
| `quote` | `/quotes` | `?id={id}` |
| `salesorder` | `/sales-orders` | `?id={id}` |
| `purchaseorder` | `/purchase-orders` | `?id={id}` |
| `invoice` | `/invoices` | `?id={id}` |
| `expense` | `/expenses` | `?id={id}` |
| `lead` | `/leads` | `?id={id}` |
| `part` | `/parts` | `?id={id}` |
| `shipment` | `/shipments` | `?id={id}` |
| `customer` | `/customers/{id}/overview` | -- |
| `asset` | `/assets` | `?id={id}` |
| `vendor` | `/vendors` | `?id={id}` |
| `timeentry` | `/time-tracking` | `?id={id}` |
| `training` | `/training` | -- |
| `users` | `/admin/users` | -- |
| `compliance_submissions` | `/account/tax-forms` | -- |
| `reorder_suggestions` | `/inventory/replenishment` | -- |
| `customerreturn` | `/customer-returns` | `?id={id}` |
| `payment` | `/payments` | `?id={id}` |
| `events` | -- (no navigation) | -- |
| `clock_events` | -- (no navigation) | -- |

---

## Notification Types

Notification types are free-form strings stored in the `Type` field. The following types are generated by the application:

| Type | Description | Source Handler |
|------|-------------|----------------|
| `mention` | User was @mentioned in a comment or note | `CreateJobComment`, `CreateJobNote`, `CreateEntityComment`, `CreateEntityNote` |
| `nudge` | Reminder about uninvoiced completed jobs | `UninvoicedJobNudgeJob` (Hangfire) |
| `alert` | System alert (e.g., overdue maintenance) | `OverdueMaintenanceJob` (Hangfire) |
| `event_invite` | User invited to an event | `CreateEvent` handler |
| `event_reminder` | Upcoming event reminder (30 min before) | `EventReminderJob` (Hangfire) |
| `mismatched_clock_event` | Unmatched clock-in from previous day | `CheckMismatchedClockEventsJob` (Hangfire) |
| `time_entry_corrected` | Manager corrected a user's time entry | `AdminCorrectTimeEntry` handler |
| `assignment` | Job or task assigned to user | (defined in model, triggered by assignment flows) |
| `overdue` | Job or task is past due | (defined in model, triggered by scheduled checks) |
| `expense` | Expense-related notification | (defined in model) |
| `maintenance` | Maintenance-related notification | (defined in model) |
| `system` | General system notification | (defined in model) |
| `message` | Direct message notification | (defined in model) |

---

## Notification Severities

| Severity | Icon | Description |
|----------|------|-------------|
| `info` | `info` (blue) | Informational -- mentions, assignments, routine updates |
| `warning` | `warning` (amber) | Attention needed -- overdue items, unmatched clock events, required events |
| `critical` | `error` (red) | Urgent -- critical system alerts |

---

## Notification Sources

Sources categorize where a notification originated. Used for panel tab filtering and full-page source filter:

| Source | Tab Filter | Description |
|--------|------------|-------------|
| `user` | Messages | User-generated: @mentions in comments/notes |
| `system` | Alerts | System-generated notifications |
| `invoicing` | -- | Uninvoiced job nudge reminders |
| `maintenance-overdue` | -- | Overdue maintenance schedule alerts |
| `events` | -- | Event invitations and reminders |
| `time_tracking` | -- | Time entry corrections and mismatched clock events |

Panel tab mapping:
- **All** -- Shows all non-dismissed notifications
- **Messages** -- Filters to `source === 'user'`
- **Alerts** -- Filters to `source === 'system'`

---

## Notification Model

### Frontend (`AppNotification`)

Defined in `shared/models/app-notification.model.ts`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique notification ID |
| `type` | `string` (union) | Notification type: `'assignment'`, `'overdue'`, `'expense'`, `'maintenance'`, `'system'`, `'message'`, `'mention'` |
| `severity` | `string` (union) | `'info'`, `'warning'`, `'critical'` |
| `source` | `string` (union) | `'user'`, `'system'` |
| `title` | `string` | Notification title |
| `message` | `string` | Notification body (supports rich text via `RichTextPipe`) |
| `isRead` | `boolean` | Whether the user has read the notification |
| `isPinned` | `boolean` | Whether the user pinned the notification |
| `isDismissed` | `boolean` | Whether the user dismissed the notification |
| `entityType` | `string` (optional) | Related entity type for navigation |
| `entityId` | `number` (optional) | Related entity ID for navigation |
| `senderInitials` | `string` (optional) | Sender's avatar initials (for user-source notifications) |
| `senderColor` | `string` (optional) | Sender's avatar color |
| `createdAt` | `Date` | Notification creation timestamp |

### Backend Entity (`Notification`)

Defined in `forge.core/Entities/Notification.cs`. Extends `BaseAuditableEntity` (inherits `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`, `DeletedBy`, `CreatedBy`).

| Field | Type | Description |
|-------|------|-------------|
| `UserId` | `int` | Target user who receives the notification |
| `Type` | `string` | Notification type (free-form, max 50 chars) |
| `Severity` | `string` | Default: `"info"` (max 20 chars) |
| `Source` | `string` | Default: `"system"` (max 50 chars) |
| `Title` | `string` | Notification title (max 200 chars) |
| `Message` | `string` | Notification body (max 2000 chars) |
| `IsRead` | `bool` | Read status |
| `IsPinned` | `bool` | Pin status |
| `IsDismissed` | `bool` | Dismiss status |
| `EntityType` | `string?` | Related entity type (max 50 chars) |
| `EntityId` | `int?` | Related entity ID |
| `SenderId` | `int?` | User ID of the notification sender (for @mentions) |

### API Response Model (`NotificationResponseModel`)

Returned by `GET /api/v1/notifications`:

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `int` | Notification ID |
| `Type` | `string` | Notification type |
| `Severity` | `string` | Severity level |
| `Source` | `string` | Source identifier |
| `Title` | `string` | Title text |
| `Message` | `string` | Body text |
| `IsRead` | `bool` | Read flag |
| `IsPinned` | `bool` | Pin flag |
| `IsDismissed` | `bool` | Dismiss flag |
| `EntityType` | `string?` | Related entity type |
| `EntityId` | `int?` | Related entity ID |
| `SenderInitials` | `string?` | Resolved from `ApplicationUser.Initials` via `SenderId` |
| `SenderColor` | `string?` | Resolved from `ApplicationUser.AvatarColor` via `SenderId` |
| `CreatedAt` | `DateTimeOffset` | Creation timestamp |

The repository resolves `SenderInitials` and `SenderColor` by joining the `SenderId` to the `Users` table, using a pre-built dictionary lookup to avoid N+1 queries.

---

## Actions

### Mark as Read

- **Single:** `NotificationService.markAsRead(id)` -- Optimistically updates the local signal, then sends `PATCH /api/v1/notifications/{id}` with `{ isRead: true }`. Also triggered automatically when a notification item is clicked.
- **All:** `NotificationService.markAllRead()` -- Updates all local notifications to read, then sends `POST /api/v1/notifications/mark-all-read`. Backend uses `ExecuteUpdateAsync` for a single bulk SQL update.

### Dismiss

- **Single:** `NotificationService.dismiss(id)` -- Optimistically sets `isDismissed: true`, then sends `PATCH /api/v1/notifications/{id}` with `{ isDismissed: true }`. Dismissed notifications are filtered out of all views.
- **All:** `NotificationService.dismissAll()` -- Dismisses all notifications optimistically, then sends `POST /api/v1/notifications/dismiss-all`. Backend uses `ExecuteUpdateAsync`.

### Pin / Unpin

`NotificationService.togglePin(id)` -- Toggles the `isPinned` flag optimistically, then sends `PATCH /api/v1/notifications/{id}` with the new `isPinned` value. Pinned notifications always sort before unpinned notifications, regardless of date.

### Sorting

The `filteredNotifications` computed signal sorts results: pinned first, then by `createdAt` descending (newest first).

---

## Filtering

### Notification Panel Filters

The panel supports filtering via the `NotificationFilter` interface:

```typescript
interface NotificationFilter {
  tab: 'all' | 'messages' | 'alerts';
  source?: 'user' | 'system';
  severity?: 'info' | 'warning' | 'critical';
  type?: string;
  unreadOnly: boolean;
}
```

Tab filter mapping:
- `all` -- No source filter applied
- `messages` -- Only notifications with `source === 'user'`
- `alerts` -- Only notifications with `source === 'system'`

Additional filters (`source`, `severity`, `type`, `unreadOnly`) can be set programmatically via `NotificationService.setFilter()`.

### Full Page Filters

The `/notifications` page adds client-side filtering on top of the service's `filteredNotifications`:

- **Search** -- Text search across `title` and `message` fields (case-insensitive).
- **Severity** -- Dropdown filter: All, Info, Warning, Critical.
- **Source** -- Dropdown filter: All, System, Board, Timer.

---

## Notification Preferences

User notification preferences are stored via `UserPreferencesService` (localStorage with API sync). The preferences tab on the `/notifications` page exposes four toggles:

### Email Notifications

| Preference Key | Default | Description |
|----------------|---------|-------------|
| `notif:email_critical` | `true` | Receive email for critical alerts |
| `notif:email_assignment` | `true` | Receive email for job assignments |
| `notif:email_mention` | `true` | Receive email when @mentioned |

### In-App Notifications

| Preference Key | Default | Description |
|----------------|---------|-------------|
| `notif:sound` | `true` | Play sound on new notification |

Preferences are toggled inline with immediate persistence via `UserPreferencesService.set()`. There is no dedicated backend entity for notification preferences -- they use the general-purpose `user_preferences` key-value store.

---

## Real-Time Delivery (SignalR)

### NotificationHub

The `NotificationHub` (`forge.api/Hubs/NotificationHub.cs`) is an authorized SignalR hub mapped at `/hubs/notifications`.

**Connection lifecycle:**
- `OnConnectedAsync` -- Adds the connection to a group named `user:{userId}` (derived from the JWT `NameIdentifier` claim).
- `OnDisconnectedAsync` -- Removes the connection from the user group.

This per-user group model ensures notifications are delivered only to the intended recipient, even if they have multiple tabs/devices connected.

### Server-Side Broadcasting

When a notification is created via `CreateNotificationHandler`, after persisting to the database, the handler broadcasts to the user's SignalR group:

```csharp
await notificationHub.Clients.Group($"user:{data.UserId}")
    .SendAsync("notificationReceived", result, cancellationToken);
```

The payload is the full `NotificationResponseModel` including resolved sender initials and color.

Note: Notifications created directly via `db.Notifications.Add()` (e.g., in `EventReminderJob`, `CheckMismatchedClockEventsJob`, `CreateEvent`) are **not** broadcast via SignalR. They are picked up on the next panel open or page refresh.

### Frontend Hub Service

`NotificationHubService` (`shared/services/notification-hub.service.ts`) wraps `SignalrService`:

1. Creates a connection to the `notifications` hub path.
2. Registers a single event handler: `notificationReceived` -- calls `NotificationService.push()` to prepend the notification to the in-memory list.
3. Cleans up handlers on disconnect (`.off('notificationReceived')` before re-registering and on disconnect).

The hub service is connected once in `AppComponent.ngOnInit()` after authentication. It disconnects on logout.

### Fallback

Each time the notification panel opens, `NotificationService.togglePanel()` calls `this.load()` to re-fetch all notifications from the API, ensuring any missed real-time pushes (due to network issues or SignalR reconnection gaps) are recovered.

---

## Email Notifications

Email delivery is separate from in-app notifications. The system uses `IEmailService` (implemented by `SmtpEmailService` via MailKit) for outbound email.

### Daily Digest

`DailyDigestJob` (Hangfire, runs daily at 7:00 AM UTC):

- Queries all active users with email addresses.
- For each user, gathers:
  - Jobs assigned to them due within the next 3 days.
  - Overdue jobs (past due, not completed).
  - Jobs completed yesterday (count).
- Skips users with no relevant activity.
- Sends an HTML email built by `EmailTemplateBuilder.BuildDigest()` with the subject `[{CompanyName}] Daily Digest -- {date}`.

### Other Email Triggers

- **Setup Invites** -- `SendSetupInvite` handler sends account setup emails to new users.
- **Invoice Emails** -- `SendInvoiceEmail` handler sends invoices as email with PDF attachment.
- **Integration Tests** -- `TestIntegrationConnection` can test SMTP connectivity.
- **DocuSeal** -- Document signing service sends signing request emails.

Email delivery is configured via `SmtpOptions` in `appsettings.json` (host, port, SSL, credentials, from address/name). When `MockIntegrations=true`, `MockEmailService` logs email operations without sending.

---

## API Endpoints

All endpoints require authentication (`[Authorize]`). Base path: `/api/v1/notifications`.

### GET /api/v1/notifications

Returns all non-dismissed notifications for the authenticated user.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 42,
      "type": "mention",
      "severity": "info",
      "source": "user",
      "title": "You were mentioned in a comment",
      "message": "Check the tolerances on this part...",
      "isRead": false,
      "isPinned": false,
      "isDismissed": false,
      "entityType": "Job",
      "entityId": 1055,
      "senderInitials": "DH",
      "senderColor": "#3b82f6",
      "createdAt": "2026-04-15T14:30:00+00:00"
    }
  ]
}
```

Sorted: pinned first, then by `createdAt` descending. Dismissed notifications are excluded at the repository level.

### PATCH /api/v1/notifications/{id}

Updates a single notification's read, pin, or dismiss status. Only the notification's owner can modify it.

**Request body:**
```json
{
  "isRead": true,
  "isPinned": false,
  "isDismissed": false
}
```

All fields are optional (`bool?`). Only provided fields are updated.

**Response:** `204 No Content`

**Errors:**
- `404` -- Notification not found.
- `403` -- Attempting to modify another user's notification (`UnauthorizedAccessException`).

### POST /api/v1/notifications/mark-all-read

Marks all unread notifications for the authenticated user as read. Uses `ExecuteUpdateAsync` for a single bulk SQL statement.

**Request body:** Empty `{}`

**Response:** `204 No Content`

### POST /api/v1/notifications/dismiss-all

Dismisses all non-dismissed notifications for the authenticated user. Uses `ExecuteUpdateAsync` for a single bulk SQL statement.

**Request body:** Empty `{}`

**Response:** `204 No Content`

---

## Backend Trigger Points

The following events generate in-app notifications. Notifications created via `CreateNotificationCommand` (MediatR) are also pushed via SignalR in real time. Those created directly via `db.Notifications.Add()` are persisted but not pushed until the next API fetch.

### User-Triggered (via MediatR -- real-time SignalR push)

| Trigger | Type | Severity | Source | Recipients | Entity |
|---------|------|----------|--------|------------|--------|
| @mention in job comment | `mention` | `info` | `user` | Each mentioned user | `Job:{jobId}` |
| @mention in job note | `mention` | `info` | `user` | Each mentioned user | `Job:{jobId}` |
| @mention in entity comment | `mention` | `info` | `user` | Each mentioned user | `{entityType}:{entityId}` |
| @mention in entity note | `mention` | `info` | `user` | Each mentioned user | `{entityType}:{entityId}` |
| Admin corrects time entry | `time_entry_corrected` | `info` | `time_tracking` | The employee whose entry was corrected | `time_entries:{entryId}` |

### Scheduled Jobs (via Hangfire -- persisted only, no SignalR push)

| Job | Schedule | Type | Severity | Source | Recipients |
|-----|----------|------|----------|--------|------------|
| `UninvoicedJobNudgeJob` | Daily at 1:00 AM UTC | `nudge` | `warning` | `invoicing` | All Admin and Manager users |
| `OverdueMaintenanceJob` | Daily at 2:00 AM UTC | `alert` | `warning` | `maintenance-overdue` | All Admin and Manager users (deduplicated per overdue period) |
| `EventReminderJob` | Every 15 minutes | `event_reminder` | `warning` (required) / `info` (optional) | `events` | All non-declined attendees |
| `CheckMismatchedClockEventsJob` | Daily at 2:00 AM UTC | `mismatched_clock_event` | `warning` (employee) / `info` (managers) | `time_tracking` | Employee + all managers |

### Event-Driven (via direct DB insert -- persisted only, no SignalR push)

| Trigger | Type | Severity | Source | Recipients | Entity |
|---------|------|----------|--------|------------|--------|
| Event created with attendees | `event_invite` | `warning` (required) / `info` (optional) | `events` | Each attendee | `events:{eventId}` |

### Deduplication

- **Overdue maintenance:** Checks if a notification with `EntityType=Asset`, `EntityId={assetId}`, `Source=maintenance-overdue` already exists after the schedule's `NextDueAt` timestamp. Skips if already notified for the current overdue period.
- **Mismatched clock events:** Queries for notifications already sent for the same `user:{userId}` with matching `Source=time_tracking`, `Type=mismatched_clock_event`, and `EntityType=clock_events` for yesterday's date.

---

## Key Files

### Frontend

| File | Purpose |
|------|---------|
| `shared/models/app-notification.model.ts` | `AppNotification` interface |
| `shared/models/notification-filter.model.ts` | `NotificationFilter` interface |
| `shared/models/notification-tab.type.ts` | `NotificationTab` type (`'all' \| 'messages' \| 'alerts'`) |
| `shared/services/notification.service.ts` | Core notification state management (signals, API calls, optimistic updates) |
| `shared/services/notification-hub.service.ts` | SignalR hub connection for real-time push |
| `shared/components/notification-panel/` | Header overlay panel component |
| `features/notifications/` | Full-page `/notifications` route component |

### Backend

| File | Purpose |
|------|---------|
| `forge.core/Entities/Notification.cs` | Database entity |
| `forge.core/Models/NotificationResponseModel.cs` | API response record |
| `forge.core/Models/CreateNotificationRequestModel.cs` | Internal creation request |
| `forge.core/Models/UpdateNotificationRequestModel.cs` | PATCH request body |
| `forge.core/Interfaces/INotificationRepository.cs` | Repository interface |
| `forge.data/Repositories/NotificationRepository.cs` | Repository implementation |
| `forge.api/Controllers/NotificationsController.cs` | REST API controller |
| `forge.api/Features/Notifications/` | MediatR handlers (Create, Get, Update, MarkAllRead, DismissAll) |
| `forge.api/Hubs/NotificationHub.cs` | SignalR hub |
| `forge.api/Jobs/EventReminderJob.cs` | Hangfire: event reminders |
| `forge.api/Jobs/UninvoicedJobNudgeJob.cs` | Hangfire: uninvoiced job nudges |
| `forge.api/Jobs/OverdueMaintenanceJob.cs` | Hangfire: overdue maintenance alerts |
| `forge.api/Jobs/CheckMismatchedClockEventsJob.cs` | Hangfire: unmatched clock-in alerts |
| `forge.api/Jobs/DailyDigestJob.cs` | Hangfire: email daily digest |
