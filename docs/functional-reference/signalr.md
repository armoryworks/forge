# SignalR Real-Time

## Overview

Forge uses ASP.NET Core SignalR for real-time bidirectional communication between the server and connected browser clients. Four domain-specific hubs handle distinct concerns: kanban board synchronization, notification delivery, time tracking events, and chat messaging. All hubs require JWT authentication and use WebSocket transport through an nginx reverse proxy.

The frontend manages connections through a layered service architecture: a singleton `SignalrService` handles low-level connection lifecycle (creation, retry, teardown), while domain-specific hub services (`BoardHubService`, `NotificationHubService`, `TimerHubService`, `ChatHubService`) wrap it with event registration and group management.

---

## Server-Side Hubs

All four hubs live in `forge-api/forge.api/Hubs/` and are mapped in `Program.cs`:

```csharp
app.MapHub<BoardHub>("/hubs/board");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<TimerHub>("/hubs/timer");
app.MapHub<ChatHub>("/hubs/chat");
```

Every hub class is decorated with `[Authorize]`, requiring a valid JWT for connection.

### BoardHub

Manages kanban board and job detail subscriptions. Clients join/leave groups scoped to a track type (board) or individual job.

**Server methods (invoked by client):**

| Method | Parameter | Group Pattern | Purpose |
|--------|-----------|---------------|---------|
| `JoinBoard` | `trackTypeId: int` | `board:{trackTypeId}` | Subscribe to all job events on a board |
| `LeaveBoard` | `trackTypeId: int` | `board:{trackTypeId}` | Unsubscribe from board events |
| `JoinJob` | `jobId: int` | `job:{jobId}` | Subscribe to subtask changes on a specific job |
| `LeaveJob` | `jobId: int` | `job:{jobId}` | Unsubscribe from job-specific events |

**Server-to-client events (broadcast from MediatR handlers):**

| Event | Group | Triggered By | Payload |
|-------|-------|-------------|---------|
| `jobCreated` | `board:{trackTypeId}` | `CreateJobHandler` | `BoardJobCreatedEvent` (jobId, jobNumber, title, trackTypeId, stageId, position) |
| `jobMoved` | `board:{trackTypeId}` | `MoveJobStageHandler`, `BulkMoveJobStageHandler` | `BoardJobMovedEvent` (jobId, previousStageId, stageId, position) |
| `jobUpdated` | `board:{trackTypeId}` and `job:{jobId}` | `UpdateJobHandler` | Job update event (dual broadcast to board and job groups) |
| `jobPositionChanged` | `board:{trackTypeId}` | `UpdateJobPositionHandler` | `BoardJobPositionChangedEvent` (jobId, stageId, position) |
| `subtaskChanged` | `job:{jobId}` | `CreateSubtaskHandler`, `UpdateSubtaskHandler` | `{ jobId, subtask, changeType }` where changeType is `"created"` or `"updated"` |

### NotificationHub

Auto-joins users to a personal group on connection. No client-invocable methods beyond the connection itself.

**Lifecycle:**
- `OnConnectedAsync` -- Adds connection to `user:{userId}` group using `Context.UserIdentifier`
- `OnDisconnectedAsync` -- Removes connection from the user group

**Server-to-client events:**

| Event | Group | Triggered By | Payload |
|-------|-------|-------------|---------|
| `notificationReceived` | `user:{userId}` | `CreateNotificationHandler` | Full `AppNotification` response model |

### TimerHub

Auto-joins users to a personal group on connection, identical to NotificationHub.

**Lifecycle:**
- `OnConnectedAsync` -- Adds connection to `user:{userId}` group
- `OnDisconnectedAsync` -- Removes connection from the user group

**Server-to-client events:**

| Event | Group | Triggered By | Payload |
|-------|-------|-------------|---------|
| `timerStarted` | `user:{userId}` | `StartTimerHandler` | `TimerStartedEvent` (userId, timeEntry) |
| `timerStopped` | `user:{userId}` | `StopTimerHandler` | `TimerStoppedEvent` (userId, timeEntry) |

### ChatHub

Combines user-scoped auto-join (for DM delivery) with explicit room group management (for group chat).

**Lifecycle:**
- `OnConnectedAsync` -- Adds connection to `user:{userId}` group (reads userId from `ClaimTypes.NameIdentifier`)
- `OnDisconnectedAsync` -- Removes connection from the user group

**Server methods (invoked by client):**

| Method | Parameter | Group Pattern | Purpose |
|--------|-----------|---------------|---------|
| `JoinRoom` | `roomId: int` | `chat-room:{roomId}` | Subscribe to group chat messages |
| `LeaveRoom` | `roomId: int` | `chat-room:{roomId}` | Unsubscribe from room messages |

**Server-to-client events:**

| Event | Group | Triggered By | Payload |
|-------|-------|-------------|---------|
| `messageReceived` | `user:{recipientId}` | `SendMessageHandler` | `ChatMessageEvent` (messageId, senderId, content, timestamp) |

---

## JWT Authentication for WebSocket

WebSocket connections cannot use HTTP Authorization headers. SignalR transmits the JWT via the `access_token` query string parameter. The server extracts it in `JwtBearerEvents.OnMessageReceived`:

```csharp
// Program.cs (JWT configuration)
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        if (!string.IsNullOrEmpty(accessToken) &&
            (path.StartsWithSegments("/hubs") || path.StartsWithSegments("/api/v1/downloads")))
        {
            context.Token = accessToken;
        }
        return Task.CompletedTask;
    }
};
```

The frontend passes the token via `HubConnectionBuilder.withUrl()`:

```typescript
const connection = new HubConnectionBuilder()
  .withUrl(`${environment.hubUrl}/${hubPath}`, {
    accessTokenFactory: () => this.authService.token() ?? '',
  })
  .build();
```

If the negotiate request returns 401/403 (expired or invalid token), `SignalrService` detects the auth error and calls `authService.clearAuth()` to trigger re-login.

---

## Nginx WebSocket Proxy

The nginx reverse proxy upgrades HTTP connections to WebSocket for hub paths:

```nginx
location /hubs/ {
    proxy_pass http://forge-api:8080/hubs/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    ...
}
```

---

## Frontend Services

### SignalrService

**Location:** `forge-ui/src/app/shared/services/signalr.service.ts`

Singleton connection manager (`providedIn: 'root'`). All hub-specific services delegate to this service for connection lifecycle.

**Signals:**
- `connectionState: Signal<ConnectionState>` -- Aggregate state across all hubs: `'disconnected' | 'connecting' | 'connected' | 'reconnecting'`
- `hasEverConnected: Signal<boolean>` -- True once any hub has successfully connected (prevents banner flash on startup)

**Connection lifecycle:**

1. `getOrCreateConnection(hubPath)` -- Creates a `HubConnection` with automatic reconnect schedule `[0, 1000, 2000, 5000, 10000, 30000]ms` and registers reconnecting/reconnected/close handlers. Returns existing connection if already created.
2. `startConnection(hubPath)` -- Starts the connection with retry. Returns a promise that resolves on eventual success. Retries every 5 seconds on failure. Detects 401/403 errors and clears auth instead of retrying.
3. `stopConnection(hubPath)` -- Stops a specific hub connection, clears retry timers, removes from internal maps.
4. `stopAll()` -- Stops all hub connections. Called on logout.

**Reconnection strategy:**

The system has two layers of reconnection:

1. **Automatic reconnect** (built-in) -- `withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])` handles transient disconnections. The delay array means: retry immediately, then at 1s, 2s, 5s, 10s, 30s.
2. **Manual reconnect** (after exhaustion) -- When `onclose` fires (automatic reconnect gave up), `scheduleManualReconnect` waits 10 seconds, destroys the dead connection, creates a fresh one, and calls `startConnection` again. This only fires if the user is still authenticated.

**Global state derivation:**

`updateGlobalState()` checks all active `HubConnection` states. If any is `Connected`, global state is `'connected'`. If any is `Reconnecting`, global state is `'reconnecting'`. Otherwise `'disconnected'`.

### BoardHubService

**Location:** `forge-ui/src/app/shared/services/board-hub.service.ts`

Wraps SignalrService for the `/hubs/board` endpoint. Tracks current board and job group memberships.

**Key behaviors:**
- `connect()` -- Creates connection, registers event handlers, sets up `onreconnected` to rejoin groups automatically.
- `disconnect()` -- Leaves groups, unregisters handlers, stops connection.
- `joinBoard(trackTypeId)` -- Automatically leaves any current board group before joining the new one.
- `joinJob(jobId)` -- Automatically leaves any current job group before joining the new one.
- Handler registration uses the `.off()` then `.on()` pattern to prevent handler accumulation across reconnects.

**Event callbacks:**

```typescript
boardHub.onJobCreatedEvent((event) => this.reloadBoard());
boardHub.onJobMovedEvent((event) => this.reloadBoard());
boardHub.onJobUpdatedEvent((event) => this.reloadBoard());
boardHub.onJobPositionChangedEvent((event) => this.reloadBoard());
boardHub.onSubtaskChangedEvent((event) => this.reloadSubtasks());
```

### NotificationHubService

**Location:** `forge-ui/src/app/shared/services/notification-hub.service.ts`

Connects once during app initialization (in `AppComponent.ngOnInit()` after authentication). Automatically pushes received notifications into `NotificationService`.

```typescript
connection.on('notificationReceived', (notification: AppNotification) => {
  this.notificationService.push(notification);
});
```

Has a `connected` guard flag to prevent duplicate connections.

### TimerHubService

**Location:** `forge-ui/src/app/shared/services/timer-hub.service.ts`

Used by the time tracking feature. Supports explicit user group management.

**Server methods:** `JoinUserGroup(userId)`, `LeaveUserGroup(userId)` -- These are hub methods for subscribing to timer events for a specific user.

**Event callbacks:**

```typescript
timerHub.onTimerStartedEvent((event: TimerEvent) => this.loadEntries());
timerHub.onTimerStoppedEvent((event: TimerEvent) => this.loadEntries());
```

Auto-rejoins user groups after reconnection via `onreconnected` handler.

### ChatHubService

**Location:** `forge-ui/src/app/shared/services/chat-hub.service.ts`

Connects when the chat feature is opened. Registers a single `messageReceived` event handler.

```typescript
chatHub.onMessageReceived((event) => this.handleNewMessage(event));
```

---

## ConnectionBannerComponent

**Location:** `forge-ui/src/app/shared/components/connection-banner/`

Displays a warning banner when SignalR connections are degraded. Added to `app.component.html` with no configuration needed:

```html
<app-connection-banner />
```

**Visibility logic:**

The banner is shown only when all of the following are true:
1. **Startup grace period elapsed** -- 10 seconds after `ngOnInit` (prevents flash during initial connection).
2. **Not dismissed** -- User can manually dismiss the banner.
3. **Has ever connected** -- At least one hub has successfully connected previously (prevents banner on first load).
4. **Debounced disconnection** -- Connection has been down for at least 5 seconds continuously (prevents flashing on brief network blips).

**Visual states:**
- `reconnecting` -- Yellow/warning banner with "Reconnecting..." message.
- `disconnected` -- Red/error banner with "Connection lost" message.

When the connection returns to `connected`, the banner immediately clears and resets the dismissed state so it can appear again on future disconnections.

---

## Server-Side Broadcasting Pattern

MediatR handlers inject `IHubContext<THubClass>` to broadcast events after `SaveChangesAsync`:

```csharp
// In handler primary constructor:
IHubContext<BoardHub> boardHub

// After SaveChangesAsync:
await boardHub.Clients.Group($"board:{trackTypeId}")
    .SendAsync("jobCreated", new BoardJobCreatedEvent(...), cancellationToken);
```

This pattern is used by: `CreateJobHandler`, `UpdateJobHandler`, `MoveJobStageHandler`, `BulkMoveJobStageHandler`, `UpdateJobPositionHandler`, `CreateSubtaskHandler`, `UpdateSubtaskHandler`, `StartTimerHandler`, `StopTimerHandler`, `CreateNotificationHandler`, `SendMessageHandler`.

---

## Group Membership Summary

| Group Pattern | Hub | Scope | Joined By |
|---------------|-----|-------|-----------|
| `board:{trackTypeId}` | Board | All jobs on a track type | Client invokes `JoinBoard` |
| `job:{jobId}` | Board | Single job detail | Client invokes `JoinJob` |
| `user:{userId}` | Notification | Per-user notifications | Auto on connect |
| `user:{userId}` | Timer | Per-user timer events | Auto on connect |
| `user:{userId}` | Chat | Per-user DMs | Auto on connect |
| `chat-room:{roomId}` | Chat | Group chat room | Client invokes `JoinRoom` |

**Important:** SignalR group memberships are server-side and lost on disconnect. All hub services that manage groups implement `onreconnected` handlers that automatically rejoin previously active groups.

---

## App Lifecycle Integration

1. **Login** -- After authentication, `AppComponent.ngOnInit()` connects `NotificationHubService` and starts the `ScannerService`. Feature-specific hubs (Board, Timer, Chat) connect when their respective pages are visited.
2. **Feature navigation** -- `BoardHubService` connects/disconnects with the kanban feature lifecycle. `TimerHubService` connects when time tracking is active. `ChatHubService` connects when chat is opened.
3. **Logout** -- An `effect()` in `AppComponent` watches `authService.isAuthenticated()`. When it becomes false, `signalrService.stopAll()` is called to tear down all hub connections.
4. **Multi-tab** -- Each browser tab opens its own set of SignalR connections. This is acceptable for the expected scale (< 50 concurrent users per deployment).

---

## Key Files

| File | Purpose |
|------|---------|
| `forge-api/forge.api/Hubs/BoardHub.cs` | Board hub: JoinBoard, LeaveBoard, JoinJob, LeaveJob |
| `forge-api/forge.api/Hubs/NotificationHub.cs` | Notification hub: auto user group join/leave |
| `forge-api/forge.api/Hubs/TimerHub.cs` | Timer hub: auto user group join/leave |
| `forge-api/forge.api/Hubs/ChatHub.cs` | Chat hub: auto user group + JoinRoom/LeaveRoom |
| `forge-ui/src/app/shared/services/signalr.service.ts` | Singleton connection manager |
| `forge-ui/src/app/shared/services/board-hub.service.ts` | Board event registration and group management |
| `forge-ui/src/app/shared/services/notification-hub.service.ts` | Notification push integration |
| `forge-ui/src/app/shared/services/timer-hub.service.ts` | Timer event registration |
| `forge-ui/src/app/shared/services/chat-hub.service.ts` | Chat message event registration |
| `forge-ui/src/app/shared/components/connection-banner/connection-banner.component.ts` | Reconnecting/disconnected warning UI |
| `forge-ui/src/app/shared/models/signalr.model.ts` | `ConnectionState` type |
| `forge-ui/src/app/shared/models/timer-event.model.ts` | `TimerEvent` interface |
