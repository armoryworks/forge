# Concurrency Conflict UX — Wave-1 Design (FE, 2026-05-21)

**Status:** Design-only. Implementation gated on BE-1 shipping the 409/If-Match
contract. This doc exists to (a) describe the proposed UX so eng-lead can confirm
the response shape before building, and (b) let FE build the moment BE-1 lands.

---

## 1. Current state

| Path | Trigger | UX |
|------|---------|-----|
| 412 Precondition Failed | ETag interceptor → `ConcurrencyConflictService.notify()` | Modal: "Reload" (`window.location.reload()`) or "Cancel" |
| 409 Conflict | `http-error.interceptor.ts` | Toast warning with server message or fallback "errors.resourceModified" |

**Primary pain point:** `window.location.reload()` on 412 is destructive — it
closes all open dialogs and loses unsaved work in unrelated forms. It is the right
safe default for Wave-0, but Wave-1 can do better.

---

## 2. Proposed UX (ready to build the moment BE-1 ships)

### 2a. Soft-reload pattern for edit dialogs

Components that own an editable entity register a **soft-reload callback** with
`ConcurrencyConflictService` for their resource key.  When a 412 fires for that
key, the dialog intercepts it and re-fetches the entity in place — no page reload.

```
// In an edit dialog's ngOnInit (or effect):
this.conflictSvc.registerSoftReload(
  `/api/v1/jobs/${this.jobId}`,
  () => this.loadJob(this.jobId),       // soft reload
);
// Called on dialog destroy to unregister.
```

The conflict modal then offers:

> **"This record was updated while you were editing."**
>
> [**Load current version**] — runs the registered callback; reloads the entity
> into the form (edits replaced); dialog stays open.
>
> [**Keep my draft**] — dismisses modal; user sees their edits; ETag cache is
> cleared so their next save will 412 again (correct — they haven't seen the
> current version).
>
> _(fallback when no callback registered)_ [**Reload page**] — current behaviour.

### 2b. Richer modal copy (when BE sends conflict metadata)

If the 409/412 response body includes `changedBy` / `changedAt`, the modal can say:

> "**J. Silva** updated this record 3 minutes ago.  Do you want to load the
> current version or keep your draft?"

This requires BE-1 to include those fields (see §3 below).

### 2c. 409 toast → modal for high-stakes paths

The current toast for 409 is fine for low-stakes business conflicts
(e.g. "order already converted").  For concurrency-specific 409s (same body shape
as 412 but a different HTTP verb or resource-state reason), upgrade to the same
conflict modal so the user gets the reload/keep-draft choice.

Differentiation: the `type` field in the response body distinguishes a
concurrency 409 from a business-rule 409 (see §3).

---

## 3. Proposed 409 response body — QUESTIONS FOR ENG-LEAD

For the FE to implement §2b and §2c, the BE-1 endpoint needs to return a
structured error body on both 409 and 412.  Proposed shape:

```json
{
  "type": "concurrency_conflict",
  "resource": "/api/v1/jobs/179",
  "currentVersion": "\"abc123\"",
  "changedBy": "J. Silva",
  "changedAt": "2026-05-21T10:42:00Z"
}
```

**Required to confirm:**

1. **Status code** — Does BE-1 use 412 (HTTP-conventional: conditional request
   failed) or 409 (resource conflict) for If-Match mismatches?  The FE interceptor
   currently only handles 412; if BE-1 returns 409 for some endpoints it needs to
   handle both.

2. **Response body fields** — Which of `currentVersion`, `changedBy`, `changedAt`
   can BE-1 cheaply include?  `changedBy`/`changedAt` require the entity to track
   `UpdatedBy` / `UpdatedAt` (most already do).  `currentVersion` is just the
   current ETag/rowVersion — easy.

3. **`type` discriminator** — Does BE-1 want to distinguish concurrency 409s from
   business-rule 409s via a `type` field, or via status code alone (409 = concurrency,
   422 = business rule)?

4. **Sub-path endpoints** (gap from F-056) — Do endpoints like
   `PATCH /jobs/{id}/stage`, `PATCH /jobs/{id}/subtasks/{id}` enforce 428/412 at
   all?  If not, the If-Match injection on sub-paths is a no-op and F-056's
   parent-path fallback is the fix.

---

## 4. Implementation sketch (design-only, not built yet)

### ConcurrencyConflictService additions

```typescript
// New method — components call this in their init and clean up on destroy.
registerSoftReload(resourceKey: string, reloadFn: () => void): () => void {
  this.softReloadCallbacks.set(resourceKey, reloadFn);
  return () => this.softReloadCallbacks.delete(resourceKey);
}

// Updated notify() — passes callback to dialog if found.
notify(evt: ConcurrencyConflictEvent): void {
  const callback = this.softReloadCallbacks.get(evt.resource ?? '');
  const ref = this.dialog.open(ConcurrencyConflictDialogComponent, {
    data: { resource: evt.resource, hasSoftReload: !!callback, ...conflictMeta },
    ...
  });
  ref.afterClosed().subscribe(result => {
    if (result === 'soft-reload' && callback) {
      this.etagCache.clear(evt.resource!);
      callback();                // component re-fetches its own entity
    } else if (result === 'hard-reload') {
      this.etagCache.clear(evt.resource!);
      window.location.reload();  // existing safe fallback
    }
    // 'cancel' → nothing
  });
}
```

### ConcurrencyConflictDialogData additions

```typescript
export interface ConcurrencyConflictDialogData {
  resource: string | null;
  hasSoftReload: boolean;          // controls "Load current version" button
  changedBy?: string;              // from BE response body (optional)
  changedAt?: string;              // ISO timestamp (optional)
}

export type ConcurrencyConflictResolution = 'soft-reload' | 'hard-reload' | 'cancel';
```

### Dialog copy (with soft-reload path)

```
Title: "Record Updated"
Body:  If hasSoftReload && changedBy:
         "{ changedBy } updated this record { changedAt | relative }."
       If hasSoftReload && !changedBy:
         "This record was updated while you were editing."
       Else:
         "This record was changed by another user.
          Reload the page to see the latest version."

Buttons:
  [Cancel (secondary)]
  [Keep My Draft (secondary)]      visible if hasSoftReload
  [Load Current Version (primary)] visible if hasSoftReload
  [Reload Page (primary)]          visible if !hasSoftReload
```

---

## 5. Files to modify when ready

| File | Change |
|------|--------|
| `concurrency-conflict.service.ts` | Add `softReloadCallbacks` map + `registerSoftReload()` |
| `concurrency-conflict-dialog.component.ts` | Extend data interface + new resolution type |
| `concurrency-conflict-dialog.component.html` | Conditional copy + third button |
| `etag.interceptor.ts` | Handle 409 with `type:"concurrency_conflict"` same as 412 |
| `http-error.interceptor.ts` | Skip generic toast for 409 when body `type` is `concurrency_conflict` |
| Edit dialogs (job, sales-order, etc.) | Call `registerSoftReload` in init; clean up on destroy |

Estimated scope once eng-lead confirms §3: ~1 day FE including dialog copy and
registration wiring in the 3–4 highest-traffic edit dialogs.

---

_Author: [ENG] 2026-05-21.  Waiting on eng-lead §3 confirmation before coding._
