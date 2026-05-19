# OAuth Initiation — Publisher / Subscriber Pattern

> **Status:** Subscriber (single canonical handler) shipped in
> [`85b3c69`](https://github.com/armoryworks/forge-api/commit/85b3c69).
> First publisher (admin Integrations dialog Connect button) shipped in
> [`2402c0d`](https://github.com/armoryworks/forge-ui/commit/2402c0d).

## What this is

Centralised OAuth-authorization-URL build for every accounting provider
(QuickBooks, Xero, FreshBooks, Sage, Zoho). Any code that wants to
start an OAuth handshake dispatches a single MediatR command — the
per-provider URL build logic lives in exactly one place.

## The subscriber

```csharp
// forge.api/Features/Accounting/InitiateAccountingOAuth.cs
public record InitiateAccountingOAuthCommand(string Provider)
    : IRequest<InitiateAccountingOAuthResult>;

public record InitiateAccountingOAuthResult(
    string Provider,
    string AuthorizationUrl,
    string State);
```

The handler:
- Builds the per-provider authorization URL from the live `IOptions<T>`
  (which is hot-reloaded from `system_settings` per the Phase 1 work, so
  ClientId / Secret reflect the latest admin edits).
- Generates a CSRF state token, stores it in the HTTP session under
  `{provider}_oauth_state`.
- Throws `InvalidOperationException` if the provider isn't configured
  (no ClientId entered yet) — caller maps to 400 with the error message.

## Current publishers

| Publisher | Location | What it does |
|---|---|---|
| Admin Integrations dialog "Connect" button | `forge-ui/src/app/features/admin/components/integration-config-dialog/` | When the user has saved ClientId + Secret and the provider is in `OAUTH_CONNECTABLE_PROVIDERS`, a Connect button appears in the dialog footer. Click → HTTP GET `/api/v1/{provider}/authorize` → server dispatches `InitiateAccountingOAuthCommand` → response has `authorizationUrl` → full-page redirect. |
| Five `/{provider}/authorize` controller endpoints | `forge-api/forge.api/Controllers/AccountingController.cs` | All five are now thin wrappers: receive the request, dispatch the command, return the URL in a JSON response. They're still useful as REST surfaces for external clients (mobile app, CLI tools) that prefer hitting the endpoint directly over dispatching the command via internal code. |

## Future publishers (architecture is ready for them)

These don't exist yet but the subscriber pattern is wired so they can
be added with one MediatR `Send` call each.

### Accounting-screen "Sync now" / "Reconnect" prompts

When a sync operation fails because the OAuth token couldn't be
refreshed (refresh token expired, user revoked access at the provider
side, etc.), the appropriate surface — Invoices page, Payments page,
Customers page sync section — should:

1. Detect the failure (HTTP 401 from the accounting service, or an
   explicit `AccountingSyncStatus.RequiresReconnect` flag returned by
   the backend).
2. Show a "Reconnect to {provider}" prompt inline (snackbar.warn with
   an action button, or an inline banner on the affected list).
3. On click → dispatch `InitiateAccountingOAuthCommand` → redirect.

The redirect handler should accept a `returnUrl` query param so the
provider's callback can bounce the user back to the page they came from
(currently the callback hardcodes `/admin?tab=integrations`).

### Token-refresh background job

Hangfire job that proactively refreshes tokens nearing expiry. When the
provider's refresh endpoint returns a "user re-authorization required"
error, the job emits a domain event (or notification) that surfaces a
banner the next time a logged-in admin loads any page. Click → dispatch
the same command.

### Periodic health check

Admin dashboard widget showing the connection state of every
admin-configured accounting provider. When one's broken, click →
reconnect via the same command.

## Why this matters

Before this pattern, each new publisher would either:
- Duplicate the per-provider URL-build logic (5x copies that drift over
  time), or
- Couple directly to one specific controller endpoint (creating a
  weird "the Invoices page knows about the AccountingController"
  dependency).

Now: every publisher dispatches one command. Adding a new accounting
provider with OAuth = one new case in the handler's switch + descriptor +
options + propagation. Adding a new publisher = one `Send` call.

## What's NOT yet covered

- **Callback unification.** Each provider's `/{provider}/callback`
  endpoint still has bespoke token-exchange + audience-fetch logic
  (Xero's `/connections` call for tenantId, Zoho's data-center URL flip,
  etc.). Unifying into a single `CompleteAccountingOAuthCommand` is a
  Phase 2b follow-up. Lower priority — each callback is hit once per
  connection lifecycle, and the duplication is isolated to one method
  per provider.
- **Drive / Calendar / Gmail-OAuth.** These need their own initiate
  command path (similar shape but per-user storage routing — see
  `IExternalIdentityResolver` and `TokenScope.User`). Deferred pending
  the UserId Guid/int reconciliation between `UserCloudStorageLink` and
  `ApplicationUser`.
- **Per-user OAuth UI** at `/account/integrations`. The
  `UserIntegrationsController` exists but no dedicated page surfaces it
  for end users. When Drive / Calendar / Gmail-OAuth get their initiate
  commands, this page becomes the publisher for them.
