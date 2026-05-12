# Offline & PWA

## Overview

Forge is a Progressive Web App (PWA) with offline resilience. The system uses three complementary mechanisms to ensure the application remains usable during network interruptions:

1. **Angular Service Worker** -- Caches the app shell (HTML, JS, CSS, fonts) for instant loads and provides stale-while-revalidate API response caching.
2. **IndexedDB Action Queue** -- Queues write operations (POST, PUT, PATCH, DELETE) made while offline and drains them sequentially when connectivity returns.
3. **IndexedDB Data Cache** -- Lookup data (customers, parts, track types, reference data, terminology) is cached in IndexedDB with `last_synced` timestamps. Stale cache is shown immediately while fresh data loads in the background.

The user is informed of offline state, sync progress, and conflicts through the `OfflineBannerComponent` and `SyncConflictDialogComponent`.

---

## Service Worker Configuration

**Location:** `forge-ui/ngsw-config.json`

The Angular service worker (`@angular/service-worker`) is configured with two asset groups and two data groups.

### Asset Groups

| Group | Install Mode | Update Mode | Resources |
|-------|-------------|-------------|-----------|
| `app-shell` | `prefetch` | `prefetch` | `/favicon.ico`, `/index.html`, `/*.css`, `/*.js` |
| `assets` | `lazy` | `prefetch` | `/media/**`, `/**/*.woff2`, `/**/*.woff`, `/**/*.ttf` |

The app shell is prefetched on install, ensuring the application loads instantly even without network. Fonts and media assets are loaded lazily on first access but prefetched on subsequent updates.

### Data Groups

| Group | URLs | Strategy | Max Size | Max Age | Timeout |
|-------|------|----------|----------|---------|---------|
| `lookup-data` | `/api/v1/customers`, `/api/v1/parts`, `/api/v1/track-types`, `/api/v1/reference-data`, `/api/v1/terminology` | `freshness` | 100 entries | 1 day | 5 seconds |
| `api-responses` | `/api/v1/**` | `freshness` | 50 entries | 1 hour | 10 seconds |

Both groups use the `freshness` strategy (stale-while-revalidate): the service worker attempts to fetch from the network first. If the network does not respond within the timeout, cached data is returned. Lookup data has a longer cache lifetime (1 day) and shorter timeout (5 seconds) because it changes infrequently and is critical for form dropdowns.

---

## Offline Action Queue

### OfflineQueueService

**Location:** `forge-ui/src/app/shared/services/offline-queue.service.ts`

A signal-based service that persists pending write operations in an IndexedDB database (`forge-offline-queue`, object store: `queue`). Operations are queued when the application detects the user is offline and are drained in FIFO order when connectivity returns.

**Signals:**
- `pendingCount: WritableSignal<number>` -- Number of queued operations
- `syncing: WritableSignal<boolean>` -- True while the drain loop is actively processing entries
- `lastSyncResult: WritableSignal<SyncResult | null>` -- Result of the most recent drain attempt
- `conflict: WritableSignal<SyncConflict | null>` -- Non-null when a 409 conflict pauses the drain

### Enqueue

```typescript
await offlineQueue.enqueue('POST', '/api/v1/jobs', jobPayload, 'Create new job');
```

Each entry is stored with:
- `id` -- UUID (`crypto.randomUUID()`)
- `method` -- HTTP method (POST, PUT, PATCH, DELETE)
- `url` -- Full API URL
- `body` -- Request payload (serialized as-is)
- `timestamp` -- `Date.now()` epoch
- `description` -- Human-readable label for the operation

### Drain

The drain process runs automatically when the browser fires the `online` event. It can also be triggered manually via `drain()`.

**Drain algorithm:**

1. Guard against concurrent drains (`isDraining` flag).
2. Set `syncing` signal to `true`.
3. Read all entries from IndexedDB, sorted by `timestamp` ascending (FIFO).
4. For each entry:
   a. Execute the HTTP request (`POST`, `PUT`, `PATCH`, or `DELETE`).
   b. On success: remove the entry from IndexedDB, increment `processed`, update `pendingCount`.
   c. On 409 Conflict: pause the drain, populate the `conflict` signal with a `SyncConflict` object, increment `failed`, break.
   d. On other error: increment `failed`, break (stop processing to preserve order).
5. Set `syncing` to `false`, emit `SyncResult`.

**Return value:** `DrainResult { processed, failed, remaining }`

### Conflict Resolution

When the drain encounters a 409 response, it pauses and exposes the conflict through the `conflict` signal. The `SyncConflictDialogComponent` presents three resolution options:

| Resolution | Method | Behavior |
|-----------|--------|----------|
| Keep Mine | `resolveConflictKeepMine(entryId)` | Retries the request with `X-Force-Overwrite: true` header, removes entry on success, resumes drain |
| Keep Server | `resolveConflictKeepServer(entryId)` | Discards the local entry without retrying, resumes drain |
| Cancel | `resolveConflictCancel()` | Clears the conflict signal without resolving; entry stays in queue |

### Queue Management

- `getQueueSize()` -- Returns current entry count from IndexedDB
- `clearQueue()` -- Removes all entries (best-effort, silent failure)

---

## Data Models

### OfflineQueueEntry

```typescript
interface OfflineQueueEntry {
  id: string;           // crypto.randomUUID()
  method: string;       // POST, PUT, PATCH, DELETE
  url: string;          // Full API URL
  body: unknown;        // Request payload
  timestamp: number;    // Date.now() epoch
  description?: string; // Human-readable label
}
```

### SyncConflict

```typescript
interface SyncConflict {
  entryId: string;       // Queue entry ID
  description: string;   // Human-readable operation label
  url: string;           // Target API URL
  method: string;        // HTTP method
  localValue: unknown;   // Payload that was sent
  serverMessage: string; // Server error message (from Problem Details title/detail)
}
```

### SyncConflictResolution

```typescript
type SyncConflictResolution = 'keep-mine' | 'keep-server' | 'cancel';
```

### SyncResult

```typescript
interface SyncResult {
  processed: number;  // Successfully replayed operations
  failed: number;     // Operations that failed (conflict or error)
  remaining: number;  // Entries still in queue
  success: boolean;   // true if failed === 0
  timestamp: number;  // When the drain completed
}
```

---

## OfflineBannerComponent

**Location:** `forge-ui/src/app/shared/components/offline-banner/`

A bottom-center banner that communicates offline state, sync progress, and sync completion to the user.

```html
<app-offline-banner />
```

### States

| State | Icon | Message | Auto-Dismiss |
|-------|------|---------|-------------|
| `offline` (no pending) | `cloud_off` | "Connection lost. Changes will sync when reconnected." | No |
| `offline` (with pending) | `cloud_off` | "You are offline. {count} changes pending sync." | No |
| `syncing` | `sync` | "Syncing {count} changes..." | No |
| `synced` | `cloud_done` | "All changes synced" | Yes (3 seconds) |

### Behavior

- Listens to `window.online` and `window.offline` events to track connectivity.
- Watches `OfflineQueueService.syncing`, `pendingCount`, and `lastSyncResult` signals.
- On successful sync (result has `processed > 0` and `success === true`), shows the "synced" message for 3 seconds, then auto-dismisses.
- Going offline clears any "synced" message and cancels the auto-dismiss timer.

---

## SyncConflictDialogComponent

**Location:** `forge-ui/src/app/shared/components/sync-conflict-dialog/`

A `MatDialog`-based component that presents sync conflicts for user resolution. Opened when `OfflineQueueService.conflict` becomes non-null.

### Dialog Content

- **Title:** Conflict description (e.g., "Update Job")
- **Server message:** The `detail` or `title` from the server's 409 Problem Details response
- **Local value preview:** JSON-formatted display of the payload that was sent (when available)

### Actions

- **Keep Mine** -- Returns `'keep-mine'`. Caller retries with force header.
- **Keep Server** -- Returns `'keep-server'`. Caller discards local change.
- **Cancel** -- Returns `'cancel'`. Conflict stays unresolved; entry remains in queue.

```typescript
interface SyncConflictDialogData {
  conflict: SyncConflict;
}
```

---

## IndexedDB Data Cache

Separate from the action queue, the application maintains lookup data caches in IndexedDB using a wrapper service. Cached collections include customers, parts, track types, reference data, and terminology.

**Strategy:** Stale-while-revalidate. On page load, the cache is read immediately and displayed. A background fetch updates the cache and refreshes the UI if newer data arrives. The `last_synced` timestamp on each cache entry determines staleness.

This cache operates independently of the Angular service worker's `dataGroups` cache but provides the same resilience pattern at the application level for structured data that needs to survive IndexedDB queries and filtering.

---

## Conflict Resolution Strategy

The system uses **last-write-wins** for most concurrent edits. This matches the strategy used by SignalR for multi-user board edits and keeps the conflict model simple:

- **Optimistic UI:** Changes are applied locally immediately. If the server rejects the change (409), the user is prompted to choose between their version and the server's.
- **No silent data loss:** Queued operations are never silently discarded. Every failed operation either prompts the user or remains in the queue for retry.
- **Force overwrite:** The `X-Force-Overwrite: true` header tells the server to accept the client's version regardless of version conflicts. This is only sent when the user explicitly chooses "Keep Mine."

---

## Key Files

| File | Purpose |
|------|---------|
| `forge-ui/ngsw-config.json` | Angular service worker configuration (asset + data caching) |
| `forge-ui/src/app/shared/services/offline-queue.service.ts` | IndexedDB action queue (enqueue, drain, conflict resolution) |
| `forge-ui/src/app/shared/components/offline-banner/offline-banner.component.ts` | Offline/syncing/synced status banner |
| `forge-ui/src/app/shared/components/sync-conflict-dialog/sync-conflict-dialog.component.ts` | 409 conflict resolution dialog |
| `forge-ui/src/app/shared/models/offline-queue-entry.model.ts` | `OfflineQueueEntry`, `DrainResult` |
| `forge-ui/src/app/shared/models/sync-conflict.model.ts` | `SyncConflict`, `SyncConflictResolution` |
| `forge-ui/src/app/shared/models/sync-result.model.ts` | `SyncResult` |
