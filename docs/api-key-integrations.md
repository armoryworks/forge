# API Key & Federated SSO Integrations

This doc covers the two mechanisms Forge exposes for non-browser clients:

1. **`SystemApiKey` scheme** — user-bound API keys for headless sync clients
   (e.g. an external website's contact-form relay that POSTs new leads into
   Forge as a narrowly-scoped service identity).
2. **SSO token exchange** — federated client apps that authenticate users
   against the same OIDC IdP as Forge (today: Google) and want a Forge JWT
   for those users without a browser round-trip.

Both mechanisms are designed so that any external system can integrate
without Forge needing to know about it. The bootstrap, role, and endpoints
are generic; the contract is published here.

> Status: pre-beta. Surface is stable enough for production integrations;
> rate-limiting and per-key scope grants are tracked as future work
> (noted inline below).

---

## 1. `SystemApiKey` — user-bound API keys

### 1.1 What it is

A `SystemApiKey` is an authentication credential issued AGAINST an
`ApplicationUser`. When the key is presented in a request, the auth
handler hydrates the request principal AS that user — `CurrentUserId`,
audit logs, activity logs, and `[Authorize(Roles = ...)]` checks all
behave exactly as if the user had logged in interactively.

This is distinct from `BiApiKey`, which is **unbound** — BI keys carry a
synthetic `BiApiClient` role and a synthetic NameIdentifier (the key id).
BI keys are appropriate for read-only data exports where audit attribution
to a real person isn't required. System keys are appropriate for sync
clients that need to act as a specific (real or service) user, with that
user's roles driving every downstream authorization check.

We deliberately did NOT add a discriminator field to `BiApiKey` to unify
the two. They have fundamentally different principal-construction
semantics (unbound vs user-bound) and their audit + role behaviors would
diverge further over time. Forking is the right boundary; the small cost
of two parallel CRUD surfaces is worth the clarity.

### 1.2 Bootstrap

On first boot, Forge automatically:

1. Creates the service user `lead-intake-system@forge.local`:
   - In role `LeadIntake` (see §1.3).
   - Password disabled (`UserManager.RemovePassword`) — the user cannot
     log in interactively. Authentication is via API key ONLY.
   - `IsActive=true`; the auth handler checks this on every request, so
     deactivating the user disables every key bound to it.
2. Issues ONE `SystemApiKey` for that user with a 32-byte random plaintext,
   base64url-encoded with an `fsk_` prefix (`fsk_<8+ random chars>`).
3. Logs the plaintext to stdout/Serilog **exactly once**, prefixed
   `[API-KEY-BOOTSTRAP]`. The operator MUST capture this line on first
   boot — the plaintext is never logged or returned again, and only the
   PBKDF2 hash is persisted.

Sample bootstrap log line:

```
[API-KEY-BOOTSTRAP] One-time lead-intake key issued for lead-intake-system@forge.local
(prefix fsk_aBcDeFg1). Copy this plaintext to your integration's secrets store NOW —
it will not be shown again. To rotate, issue a new key via POST /api/v1/admin/system-api-keys
and revoke the old one via DELETE /api/v1/admin/system-api-keys/{id}.
    PLAINTEXT KEY: fsk_aBcDeFg1HiJkLmNoPqRsTuVwXyZ012345678
```

If the operator misses the line, they MUST rotate via the admin endpoint
(see §1.5) before the integration can be brought up. There is no
"recover the plaintext" path — that's the entire point of the
hash-and-discard pattern.

### 1.3 The `LeadIntake` role

`LeadIntake` is a single-purpose headless role. It grants:

- `POST /api/v1/leads` — create a Lead.
- `GET /api/v1/leads`, `GET /api/v1/leads/{id}` — read Leads (for outbox
  idempotency checks: "did I already create this Lead?").

It grants **nothing else**. Customers, contacts, addresses, deletes,
admin operations, and all other Lead endpoints (`PATCH`, `convert`,
bulk-intake, outreach-preferences, queue, activity log) are explicitly
blocked at the controller. A `LeadIntake`-authenticated request to any
of those endpoints returns HTTP 403.

Implementation: `LeadsController` declares
`[Authorize(Roles = "Admin,Manager,PM,LeadIntake")]` at controller level,
with multi-scheme auth (`Bearer + SystemApiKey`). Every method that
should NOT be reachable by intake clients carries an additional
`[Authorize(Roles = "Admin,Manager,PM")]` — ASP.NET Core composes
multiple `[Authorize]` attributes via AND, so the `LeadIntake` role
satisfies the controller but fails the per-method check.

If a future integration needs additional grants, expand the role
EXPLICITLY with a recorded decision — don't accrete permissions silently.
The single-purpose nature is the entire safety story.

### 1.4 Presenting a key on a request

Two header options. Use one; do NOT use both.

```http
GET /api/v1/leads HTTP/1.1
Host: forge.example.com
X-Forge-Api-Key: fsk_aBcDeFg1HiJkLmNoPqRsTuVwXyZ012345678
```

```http
GET /api/v1/leads HTTP/1.1
Host: forge.example.com
Authorization: ForgeApiKey fsk_aBcDeFg1HiJkLmNoPqRsTuVwXyZ012345678
```

The `X-Forge-Api-Key` header is namespaced so a host that also speaks the
BI key scheme (`X-Api-Key`) can route both without collision.

There is no query-string fallback — query strings are frequently logged
by load balancers, reverse proxies, and access logs, so accepting keys
that way would leak them at scale.

### 1.5 Issuance, listing, rotation, revocation

All three endpoints are JWT-Admin-only (keys cannot mint keys — privilege
escalation prevention) and gated by capability `CAP-IDEN-AUTH-API-KEYS`.

**Issue a new key:**
```http
POST /api/v1/admin/system-api-keys
Authorization: Bearer <admin JWT>
Content-Type: application/json

{
  "name": "lead-intake (rotated 2026-05-17)",
  "userId": 12,
  "expiresAt": null,
  "scopes": null,
  "allowedIps": null
}
```

Response:
```json
{
  "id": 47,
  "name": "lead-intake (rotated 2026-05-17)",
  "keyPrefix": "fsk_xyzAbc12",
  "plaintextKey": "fsk_xyzAbc12LmNoPqRsTuVwXyZ987654321ABCDE",
  "userId": 12,
  "expiresAt": null
}
```

`plaintextKey` is returned ONCE. Subsequent reads via `GET .../system-api-keys`
return only `keyPrefix`. Save the plaintext to your secrets store immediately.

**List existing keys (no plaintext):**
```http
GET /api/v1/admin/system-api-keys
```

**Revoke a key:**
```http
DELETE /api/v1/admin/system-api-keys/{id}
```

Revocation sets `IsActive=false`. Auth attempts with a revoked key fail
fast at the prefix-lookup phase. Revocation is idempotent — revoking an
already-revoked key still emits an audit row so operators can see the
operation arrived.

**Rotation procedure (zero downtime):**

1. Issue a new key via `POST`. Capture the plaintext.
2. Roll the integration to the new key (deploy / config reload).
3. Verify traffic on the new key prefix (see `lastUsedAt` on the new key).
4. Revoke the old key via `DELETE`.

### 1.6 Lead create — request and response shape

This is the v0 essential surface for outbox-style relay. The endpoint is
the canonical `/api/v1/leads` (not a key-scoped path); the `LeadIntake`
role gates access.

**Request (contact-form relay):**

```http
POST /api/v1/leads HTTP/1.1
Host: forge.example.com
X-Forge-Api-Key: fsk_...
Content-Type: application/json

{
  "companyName": "Acme Corp",
  "contactName": "Jane Doe",
  "email": "jane@acme.example",
  "phone": "+1 555 0123",
  "source": "contact-form:Sales Inquiry",
  "notes": "Interested in the X widget. Quote needed by 2026-06-01.\n\n— Jane",
  "followUpDate": null,
  "engagementShape": null,
  "accountId": null,
  "customFieldValues": null
}
```

Mapping notes for typical contact-form payloads:

| Contact-form field | Forge field             |
|--------------------|-------------------------|
| `name`             | `contactName`           |
| `email`            | `email`                 |
| `company`          | `companyName`           |
| `topic`            | `source` (prefix it with `contact-form:` so it sorts cleanly in reports) OR `customFieldValues["topic"]` |
| `message`          | `notes`                 |

`companyName` is required (`FluentValidation`). Everything else is
optional; the email pattern is validated when present.

**Success (201 Created):**

```json
{
  "id": 1042,
  "companyName": "Acme Corp",
  "contactName": "Jane Doe",
  "email": "jane@acme.example",
  "phone": "+1 555 0123",
  "source": "contact-form:Sales Inquiry",
  "status": "New",
  "createdAt": "2026-05-17T22:13:04Z",
  ...
}
```

**Errors:** all errors follow RFC 7807 `application/problem+json`.

| Status | Cause                                                       | Retry-safe? |
|--------|-------------------------------------------------------------|-------------|
| 400    | Body shape invalid (missing `companyName`, bad email, etc.) | No — fix the body first. |
| 401    | Missing / bad / revoked / expired API key                   | No — rotate or investigate. |
| 403    | Authenticated but not authorized (e.g. role lacks permission, or capability `CAP-O2C-LEAD` disabled on this install) | No — operator action required. |
| 409    | Business-rule conflict (e.g. duplicate suppression hit)     | No — surface to upstream. |
| 5xx    | Server-side failure                                         | **Yes** — retry with exponential backoff. Forge has no idempotency-key header today, so use `GET /api/v1/leads?search=...` to check before retrying on POST after a network-timeout / 5xx where you don't know if the write landed. |

### 1.7 Rate limits

There is no per-key rate limit today. Forge's global rate limiter (set in
`Program.cs`) applies to all callers indiscriminately. Per-key /
per-tenant rate-limit policies are tracked as future work — when added,
limits will be configurable via system settings, not hard-coded.

### 1.8 IP allow-listing (optional)

The `allowedIps` field on `POST /api/v1/admin/system-api-keys` accepts a
list of permitted client IPs. When present, the auth handler rejects
requests from any other source after key verification (the IP check
runs AFTER PBKDF2 verify so it doesn't leak whether a key exists at a
given prefix). Useful for hardening keys whose consumer has a stable
egress IP.

---

## 2. SSO token exchange

### 2.1 What it is

`POST /api/v1/auth/sso/token-exchange` accepts an OIDC id_token from a
configured external provider (today: Google) and returns a standard Forge
JWT. The id_token IS the credential — it's validated server-side against
the provider's published JWKS and the install's configured client id
(audience).

This lets a federated client app (deployed alongside Forge) authenticate
its users against the same IdP, then drive Forge actions AS those users
WITHOUT going through Forge's browser-based OAuth code flow. The returned
Forge JWT carries the real user's id and roles; their actions appear in
Forge's audit log under their own identity, not under a service account.

Use this when:
- Your client app already has the user's fresh Google id_token from a
  same-IdP login.
- You want per-user attribution in Forge (not a single shared service
  identity).
- You don't want to embed the OAuth round-trip in your client UX.

Use the `SystemApiKey` mechanism (§1) when:
- The traffic is genuinely anonymous-origin (a public website's contact
  form).
- The integration is server-to-server with no end-user behind it.

### 2.2 Request and response

**Request:**

```http
POST /api/v1/auth/sso/token-exchange HTTP/1.1
Host: forge.example.com
Content-Type: application/json

{
  "provider": "google",
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

`provider` is currently always `"google"`. (Microsoft and generic OIDC
support already exist for the browser flow; token exchange will follow
when needed.)

**Success (200 OK):** standard `LoginResponse` — same shape as
`POST /api/v1/auth/login`:

```json
{
  "token": "eyJhbGciOi...",
  "expiresAt": "2026-05-18T22:13:04Z",
  "user": {
    "id": 7,
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "initials": "JD",
    "avatarColor": "#0d9488",
    "roles": ["Engineer"],
    "mustChangePassword": false
  }
}
```

Cache the Forge JWT per user session. Use it as a standard
`Authorization: Bearer ...` on subsequent calls. Refresh via the normal
`POST /api/v1/auth/refresh` path — Forge's refresh story is unchanged.

**Errors:**

| Status | Cause                                                       |
|--------|-------------------------------------------------------------|
| 400    | Body shape invalid (missing fields, unsupported provider).  |
| 401    | id_token validation failed: bad signature, expired, wrong audience, unverified email, or Google JWKS unreachable. |
| 403    | `SsoOptions.Google.AllowedDomains` policy excludes the email's domain (see §3). |
| 409    | The token validated but no matching `ApplicationUser` exists for that subject or email. Admin must provision the user first. |

### 2.3 Validation details

The validator checks:

- **Signature** — against Google's live JWKS at
  `https://www.googleapis.com/oauth2/v3/certs`. The key set is cached
  (12h refresh) by the standard `ConfigurationManager<OpenIdConnectConfiguration>`.
- **Issuer** — must be `https://accounts.google.com` or `accounts.google.com`.
- **Audience** — must be the configured `Sso:Google:ClientId`. Critical:
  this is what prevents an attacker from forwarding an id_token issued
  for a different app.
- **Lifetime** — `exp` and `nbf` claims, with 2-minute clock-skew tolerance.
- **`email_verified`** — must be `true`. Email is the fallback link key
  in `SsoCallbackHandler` (when no `GoogleId` exists on the local user
  yet), so an unverified email would let an attacker claim a Google
  account for an email they don't own.

After validation, the trusted `sub` and `email` claims are forwarded to
the same `SsoCallbackHandler` the browser flow uses. The two flows
therefore have identical user-resolution and auto-link semantics — a
change to user lookup affects both.

---

## 3. `SsoOptions.{Provider}.AllowedDomains` — per-install domain restriction

By default, any account a provider authenticates is eligible for local
user lookup. To restrict to a specific set of email domains (e.g. only
permit your company's Google Workspace accounts on a given install), set:

```json
{
  "Sso": {
    "Google": {
      "Enabled": true,
      "ClientId": "...",
      "ClientSecret": "...",
      "AllowedDomains": ["yourcompany.com"]
    }
  }
}
```

Behavior:

- When `AllowedDomains` is null or empty → no restriction (current default).
- When non-empty → the email-domain (suffix after the last `@`) of the
  validated external account must match one of the listed domains
  (case-insensitive). Otherwise → 403 `Domain not permitted`.
- Comparison is exact. `example.com` permits `user@example.com` but NOT
  `user@sub.example.com`. List each subdomain explicitly if needed.
- Wildcards are NOT supported.

Enforcement lives in `SsoCallbackHandler`, so BOTH the browser-OAuth
callback AND the token-exchange endpoint honor the same policy. Browser-
flow rejections redirect to `/sso/callback?error=domain_not_permitted`
so the UI can render a tailored message; token-exchange rejections
return 403 problem+json.

---

## 4. Audit & telemetry

- Every `SystemApiKey` issuance writes a `SystemApiKeyIssued` system-wide
  audit row (name + prefix + bound user, NEVER plaintext or hash).
- Every revocation writes `SystemApiKeyRevoked` (same shape).
- Optional `SystemApiKeyUsed` audit row on every successful key auth.
  OFF by default (too noisy for high-traffic keys). Toggle via
  `SystemApiKey:AuditUseEvents = true` in `appsettings.json`.
- `LastUsedAt` on the key row is bumped best-effort on every successful
  auth — useful for detecting orphaned / unused keys at rotation time.

Standard authentication failures (bad key, wrong header, expired) emit a
401 with no body details — by design, the auth handler does not leak
whether a key prefix exists, whether it's expired vs revoked, etc.

---

## 5. What this surface deliberately does NOT include

- **No public/anonymous endpoints.** All Forge surfaces (including
  `/api/v1/leads`) require authentication. Anonymous-origin traffic
  (contact forms, etc.) is the consumer's responsibility to relay via
  a `SystemApiKey` from their backend — Forge does not expose any
  `[AllowAnonymous]` write endpoint for external submission.
- **No client-managed lookup of plaintext keys.** Lost plaintext → rotate.
- **No client-side scope grants beyond the bound user's roles.** The
  `scopes` field on the issuance request is reserved but not enforced
  today — the user's roles are the sole permission model.
- **No automatic key expiration default.** Bootstrap keys have no TTL
  unless the operator sets one explicitly. Treat key lifetime the same
  as any other long-lived secret: rotate on a schedule.
