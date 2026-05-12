# Events

## Overview

The Events feature provides company-wide event scheduling and attendance tracking. Events represent meetings, training sessions, safety briefings, and other organizational gatherings. Administrators and managers create events, assign attendees, and track RSVP responses. Events appear on the shop floor display for worker awareness and in individual employee detail pages for per-person event history.

### Event Types

| Type | Enum Value | Icon | Description |
|------|------------|------|-------------|
| Meeting | `Meeting` | `groups` | Team or company meetings |
| Training | `Training` | `school` | Training sessions, workshops |
| Safety | `Safety` | `health_and_safety` | Safety briefings, drills, inspections |
| Other | `Other` | `event` | Anything not fitting the above categories |

### Attendee Statuses

| Status | Enum Value | Description |
|--------|------------|-------------|
| Invited | `Invited` | Default status when attendee is added to an event |
| Accepted | `Accepted` | Attendee confirmed attendance |
| Declined | `Declined` | Attendee declined the invitation |
| Attended | `Attended` | Attendee physically attended (set post-event) |

---

## Routes & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/events` | `EventsPanelComponent` (admin tab) | Admin CRUD panel for all events |
| `/employees/:id/events` | `EmployeeEventsTabComponent` | Per-employee upcoming events tab |
| `/display/shop-floor` | `ShopFloorDisplayComponent` | Shop floor display (includes upcoming events section) |

The events admin panel is a tab within the Admin page (`AdminComponent`), accessible via `/admin/events`. It is not a standalone route -- the admin page uses `:tab` route parameters.

Sidebar navigation: Events is accessed via the Admin section, not as a standalone sidebar item.

---

## Access & Permissions

### Controller Authorization

The `EventsController` at `api/v1/events` requires authentication for all endpoints:

| Endpoint | Roles | Description |
|----------|-------|-------------|
| GET `/events` | All authenticated | List events (optional filters: from, to, eventType) |
| GET `/events/{id}` | All authenticated | Get event by ID |
| POST `/events` | Admin, Manager | Create event |
| PUT `/events/{id}` | Admin, Manager | Update event |
| DELETE `/events/{id}` | Admin, Manager | Soft-delete (cancel) event |
| POST `/events/{id}/respond` | All authenticated | RSVP to event |
| GET `/events/upcoming` | All authenticated | Get upcoming events for the current user |
| GET `/events/upcoming/{userId}` | Admin, Manager | Get upcoming events for a specific user |

### Admin Tab Access

The events tab in the admin panel is visible to Admin and Manager roles (`MANAGER_AND_ADMIN_TABS` set in `AdminComponent`). Users without Admin or Manager role are redirected to the compliance tab.

---

## Entities

### Event

Represents a scheduled event. Extends `BaseAuditableEntity`. Located in `forge.core/Entities/Event.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key (auto-increment) |
| Title | string | Event title (max 200 chars) |
| Description | string? | Event description (max 2000 chars) |
| StartTime | DateTimeOffset | Event start date and time (UTC) |
| EndTime | DateTimeOffset | Event end date and time (UTC, must be after StartTime) |
| Location | string? | Event location (max 200 chars) |
| EventType | EventType | Enum: Meeting, Training, Safety, Other |
| IsRequired | bool | Whether attendance is mandatory |
| CreatedByUserId | int | FK to the user who created the event |
| IsCancelled | bool | Whether the event has been cancelled |
| ReminderSentAt | DateTimeOffset? | When the reminder notification was sent |
| Attendees | ICollection\<EventAttendee\> | Navigation property to attendees |
| CreatedAt | DateTimeOffset | Audit timestamp |
| UpdatedAt | DateTimeOffset | Audit timestamp |
| DeletedAt | DateTimeOffset? | Soft-delete timestamp |

### EventAttendee

Tracks an attendee's RSVP status for an event. Extends `BaseEntity`. Located in `forge.core/Entities/EventAttendee.cs`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| EventId | int | FK to Event |
| UserId | int | FK to ApplicationUser |
| Status | AttendeeStatus | Enum: Invited, Accepted, Declined, Attended |
| RespondedAt | DateTimeOffset? | When the attendee last responded |

---

## Admin CRUD Panel

The `EventsPanelComponent` at `/admin/events` provides full event management.

### Event List

The panel renders a `DataTableComponent` with the following columns:

| Column | Field | Type | Width | Sortable | Filterable |
|--------|-------|------|-------|----------|------------|
| Title | `title` | text | auto | Yes | No |
| Type | `eventType` | enum | 100px | Yes | Yes (Meeting/Training/Safety/Other) |
| Start | `startTime` | date | 160px | Yes | No |
| End | `endTime` | date | 160px | Yes | No |
| Location | `location` | text | 150px | Yes | No |
| Attendees | `attendeeCount` | number | 100px | Yes | No |
| Required | `isRequired` | -- | 90px | Yes | No |
| Actions | `actions` | -- | 80px | No | No |

The type column renders as a chip with an icon. The required column shows a "Required" warning chip or "Optional" muted text. The actions column provides edit and cancel (delete) icon buttons.

### Header Bar

| Control | Type | Behavior |
|---------|------|----------|
| Event count | text | Displays total number of events |
| Type filter | `<app-select>` | Filters events by type. Options: All Types, Meeting, Training, Safety, Other. Triggers reload on change. |
| New Event button | `action-btn action-btn--primary` | Opens create dialog. Icon: `add`. `data-testid="new-event-btn"` |

### Create/Edit Dialog

The event dialog uses `<app-dialog>` with a width of `600px`.

| Field | Control | FormControl | Required | Validators | data-testid |
|-------|---------|-------------|----------|------------|-------------|
| Title | `<app-input>` | `title` | Yes | `required`, `maxLength(200)` | `event-title` |
| Type | `<app-select>` | `eventType` | Yes | `required` | `event-type` |
| Location | `<app-input>` | `location` | No | -- | `event-location` |
| Start Date | `<app-datepicker>` | `startDate` | Yes | `required` | `event-start-date` |
| Start Time | `<app-input>` | `startTime` | Yes | `required` (placeholder: "HH:MM") | `event-start-time` |
| End Date | `<app-datepicker>` | `endDate` | Yes | `required` | `event-end-date` |
| End Time | `<app-input>` | `endTime` | Yes | `required` (placeholder: "HH:MM") | `event-end-time` |
| Description | `<app-textarea>` | `description` | No | -- (3 rows) | `event-description` |
| Attendees | `<app-select>` | `attendeeUserIds` | No | Multiple select, options loaded from active users | -- |
| Required Attendance | `<app-toggle>` | `isRequired` | No | Default: false | `event-required` |

**Field layout:**
- Title: full width
- Type + Location: side-by-side (`dialog-row`)
- Start Date + Start Time: side-by-side (`dialog-row`)
- End Date + End Time: side-by-side (`dialog-row`)
- Description: full width
- Attendees: full width (multi-select)
- Required Attendance: full width toggle

**Default values on create:**
- `eventType`: "Meeting"
- `startTime`: "09:00"
- `endTime`: "10:00"
- `isRequired`: false
- `attendeeUserIds`: []

**Validation popover labels:** Title, Start Date, Start Time, End Date, End Time, Event Type.

**Date/time combination:** The component combines the date picker value and time string (HH:MM) into a full ISO datetime string before sending to the API. The `combineDateAndTime()` method parses the time string, sets hours/minutes on the date object, and calls `toISOString()`.

### Cancel Event

Cancelling an event opens a `ConfirmDialogComponent` with:
- Title: "Cancel Event?"
- Message: `Cancel "{event.title}"? Attendees will be notified.`
- Confirm label: "Cancel Event"
- Severity: `warn`

On confirmation, calls `DELETE /api/v1/events/{id}` which soft-deletes the event.

---

## Attendee Management & RSVP

### Invitation Notifications

When an event is created, a notification is sent to each attendee:
- Type: `event_invite`
- Severity: `warning` (if required) or `info` (if optional)
- Source: `events`
- Message: `{creatorName} invited you to "{eventTitle}" on {startTime}.`
- Entity link: `events:{eventId}`

### RSVP

Attendees can respond to events via `POST /api/v1/events/{id}/respond` with a status string:
- `"Accepted"` -- confirms attendance
- `"Declined"` -- declines the invitation

The response endpoint is available to all authenticated users. It records `RespondedAt` timestamp.

### Attendee User Options

The create/edit dialog loads the attendee multi-select options from `AdminService.getUsers()`, filtering to active users only. User names display in `Last, First` format.

---

## Shop Floor Integration

The shop floor display at `/display/shop-floor` includes an "Upcoming Events" section that appears when there are upcoming events for the authenticated user.

### Data Loading

The shop floor display calls `EventsService.getUpcomingEvents()` as part of a `forkJoin` alongside the overview and clock status data. The events call is wrapped in `catchError(() => of([]))` so a failed events API call does not block the entire shop floor load.

### Rendering

Events render in a card grid (`sf-events-grid`):

```html
<div class="sf-event-card" [class.sf-event-card--required]="event.isRequired">
  <div class="sf-event-card__icon">
    <span class="material-icons-outlined">{{ eventTypeIcon(event.eventType) }}</span>
  </div>
  <!-- title, time, location -->
</div>
```

Required events are visually distinguished with the `sf-event-card--required` modifier class.

The section header shows an event icon, "Upcoming Events" title, and a count badge.

---

## Employee Detail Events Tab

The `EmployeeEventsTabComponent` at `/employees/:id/events` shows upcoming events for a specific employee.

### Data Loading

On init, calls `EventsService.getUpcomingEventsForUser(employeeId)` to fetch events where the employee is an attendee. This endpoint requires Admin or Manager role.

### DataTable Columns

| Column | Field | Type | Width | Sortable |
|--------|-------|------|-------|----------|
| Title | `title` | text | auto | Yes |
| Type | `eventType` | text | 120px | Yes |
| Start | `startTime` | date | 160px | Yes |
| End | `endTime` | date | 160px | Yes |
| Location | `location` | text | 140px | Yes |
| Required | `isRequired` | -- | 90px | Yes |
| RSVP | `status` | text | 100px | Yes |

The RSVP column shows the attendee's status for that event (Invited/Accepted/Declined/Attended), determined by finding the attendee record matching the employee's user ID.

---

## 15-Minute Reminder Job

The `EventReminderJob` is a Hangfire recurring job registered in `Program.cs`:

```csharp
RecurringJob.AddOrUpdate<EventReminderJob>(
    "event-reminders",
    job => job.SendRemindersAsync(CancellationToken.None),
    "*/15 * * * *"); // Every 15 minutes
```

### Behavior

1. Runs every 15 minutes
2. Queries for events where:
   - `IsCancelled` is false
   - `ReminderSentAt` is null (reminder not yet sent)
   - `StartTime` is in the future (after `now`)
   - `StartTime` is within 30 minutes (before `now + 30 minutes`)
3. For each matching event, creates a notification for every attendee who has not declined:
   - Type: `event_reminder`
   - Severity: `warning` (if required) or `info` (if optional)
   - Source: `events`
   - Title: `Reminder: {eventTitle}`
   - Message: `"{eventTitle}" starts at {startTime:hh:mm tt}.{location if set}`
   - Entity link: `events:{eventId}`
4. Sets `ReminderSentAt` on the event to prevent duplicate reminders
5. Logs the number of attendees notified per event

### Window

Reminders are sent for events starting within 30 minutes. Since the job runs every 15 minutes, attendees receive reminders approximately 15-30 minutes before the event starts.

---

## API Endpoints

### Events CRUD

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/events` | All | List events (query: `from`, `to`, `eventType`) |
| GET | `/api/v1/events/{id}` | All | Get event by ID |
| POST | `/api/v1/events` | Admin, Manager | Create event |
| PUT | `/api/v1/events/{id}` | Admin, Manager | Update event |
| DELETE | `/api/v1/events/{id}` | Admin, Manager | Cancel (soft-delete) event |

### RSVP

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/events/{id}/respond` | All | RSVP to event (body: `{ "status": "Accepted" }`) |

### Upcoming Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/events/upcoming` | All | Get upcoming events for current user |
| GET | `/api/v1/events/upcoming/{userId}` | Admin, Manager | Get upcoming events for specific user |

### Request Model

```typescript
interface EventRequest {
  title: string;            // Required, max 200
  description?: string;     // Optional, max 2000
  startTime: string;        // ISO 8601 datetime
  endTime: string;          // ISO 8601 datetime (must be after startTime)
  location?: string;        // Optional, max 200
  eventType: string;        // "Meeting" | "Training" | "Safety" | "Other"
  isRequired: boolean;
  attendeeUserIds: number[];
}
```

### Response Model

```typescript
interface EventResponseModel {
  id: number;
  title: string;
  description: string | null;
  startTime: string;         // ISO 8601
  endTime: string;           // ISO 8601
  location: string | null;
  eventType: string;
  isRequired: boolean;
  isCancelled: boolean;
  createdByUserId: number;
  createdByName: string;     // "Last, First" format
  attendees: EventAttendeeResponseModel[];
  createdAt: string;
}

interface EventAttendeeResponseModel {
  id: number;
  userId: number;
  userName: string;          // "Last, First" format
  status: string;            // "Invited" | "Accepted" | "Declined" | "Attended"
  respondedAt: string | null;
}
```

### Validation (FluentValidation)

- `Title`: not empty, max 200 characters
- `Description`: max 2000 characters
- `Location`: max 200 characters
- `EventType`: not empty, must parse to valid `EventType` enum
- `EndTime`: must be after `StartTime`

---

## Known Limitations

1. **No calendar view** -- Events are managed via a flat DataTable in the admin panel. There is no calendar UI for events (the Calendar feature at `/calendar` is a separate feature not integrated with Events).

2. **No recurring events** -- Each event is a single occurrence. There is no recurrence pattern support (daily, weekly, monthly). Recurring events must be created individually.

3. **No attendee self-discovery** -- Employees cannot browse or search for events to join. They can only see events they have been explicitly invited to.

4. **Reminder timing is approximate** -- The 15-minute Hangfire interval means reminders arrive 15-30 minutes before the event, not at an exact time. The 30-minute window ensures no events are missed between job runs.

5. **No RSVP from notification** -- When an attendee receives an invitation notification, they cannot RSVP directly from the notification. They must navigate to a view with an RSVP action, which is currently only available via API (no dedicated RSVP UI for non-admin users).

6. **Soft-delete as cancellation** -- Deleting an event via the API performs a soft-delete. The `IsCancelled` field exists on the entity but is not explicitly set by the delete handler -- it relies on the global `DeletedAt` query filter.

7. **No time zone handling in UI** -- The admin dialog combines a date picker and a plain text time input (HH:MM format). Time zone conversion is handled by converting the combined local date/time to ISO via `toISOString()`, which uses the browser's local timezone. The API stores all times as `DateTimeOffset` (UTC).

8. **No attendance tracking workflow** -- The `Attended` status exists but there is no built-in mechanism for marking attendance (e.g., scan-in at the event). It must be set programmatically or via direct API call.
