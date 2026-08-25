---
title: Forge mobile app (Capacitor shell) — inspection findings and plan
type: delivery
status: pending
id: mobile-app-plan
updated: 2026-08-24
---

# Forge mobile app — step 1: repo inspection and plan

> **Gate.** Per Dan's brief (Track B, §13.1), nothing past this document is built until the
> plan is approved. The "Decisions needed" section at the bottom lists the conflicts between
> the brief and the codebase that need Dan's call before step 2 starts.

## 1. What the inspection found

Ground truth from forge-ui / forge-api as of 2026-08-24:

**UI.** Angular 21.2, single-project workspace, standalone + signals + OnPush mandated, Vitest
for unit tests, Playwright (functional gate) + Cypress (a11y gate) for E2E. A mobile web
feature already exists at `src/app/features/mobile/` (routes under `/m`: home, clock, jobs,
job-detail, scan, hours, chat, notifications, account) with an auto-redirect guard for phone
browsers. The web manifest points at `/m/` but its icon files don't exist (installability is
broken today).

**PWA/offline.** ngsw service worker with data groups for lookups and `/api/v1/**`.
`OfflineQueueService` (IndexedDB, FIFO by timestamp, serial replay, stop-on-failure) is fully
implemented and unit-tested — **and is dead code: nothing in production calls `enqueue()`**.
No idempotency anywhere in the queue or server. The queue's "Keep Mine" conflict path replays
with `X-Force-Overwrite: true`, which the server does not implement. The *live* concurrency
mechanism is ETag/`If-Match` → 412 with a reload dialog; the ETag cache is in-memory only.

**Auth.** 24-hour HS256 access tokens; **there is no refresh token** — `POST /auth/refresh`
re-issues a new access token and rotates the session JTI in a **static in-memory dictionary**
(sessions die on API restart; nothing is persisted; no device/session table exists). Tokens
live in localStorage. The auth interceptor attaches `Authorization` only to same-origin
(`/api/…`) or `localhost` URLs — a Capacitor origin gets no header today. TOTP MFA works
(Otp.NET, per-device lockout, recovery codes); WebAuthn/passkeys are **schema-only** (columns
and enum exist, no FIDO2 code). Kiosk auth is real: badge/PIN (`kiosk-login`, `scan-login`,
`nfc-login`), a `KioskTerminal` entity with `DeviceToken` header auth, and a `UserScanDevice`
pairing feature.

**Scanning.** Three decode paths: hardware keyboard-wedge (`ScannerService`), WebHID/WebSocket
RFID relay, and camera via html5-qrcode on `/m/scan`. **No ML Kit, no Capacitor.** The label
format's source of truth is `forge.api/Services/BarcodeService.cs` — prefixes `EMP` (badge),
`PRT` (part, or raw GS1 GTIN when licensed), `JOB`, `SO`, `PO`, `AST`, `LOC` (bin), `LOT`;
value = `{PREFIX}-{naturalId}`, `-{entityId}` appended on collision. There is **no
docs/labels.md**, and the mobile scan component's regex parser recognizes only a subset and
diverges from the server (routes to list pages, misses EMP/LOC/LOT/SO/PO/GTIN).

**API.** Base URL is compile-time (`environment.ts`), relative/same-origin in prod — no
runtime server-address mechanism. RFC 7807 errors (two documented envelope deviations).
Global fixed-window rate limit (2000/min, by username else IP). CORS is a config allowlist.
CSP `connect-src 'self'`; `Permissions-Policy` disables geolocation. No `.well-known`
endpoints served. No push (SignalR in-app only). No API v2.

**Capabilities.** `CapabilityCatalog.cs` currently defines **166** capabilities (not 164/157 —
the code is the truth and `ClaudeMdFactsTests` enforces the CLAUDE.md count line). UI reads a
descriptor after login, caches a snapshot in localStorage, refreshes on SignalR
`capabilityChanged`; `*appCap` directive + route guard + request-blocking interceptor.
Capability flips are audit-logged (`CapabilityAuditEvents`).

**Audit.** `ISystemAuditWriter` writes `audit_log_entries` with user, action, entity, details
JSON, IP, UA. Sessions themselves are not persisted or audited by the session store; there is
no device dimension.

**Ratchets that gate this work.** forge-ui: `ng lint --max-warnings=77`, `lint:standards`
(new files must be fully clean), `lint:i18n` (**every new UI string needs en + es in the same
commit**), a11y suite must cover new routes, visual verification per UI change. forge-api:
`ControllerCapabilityGateTests` (**every new controller must carry a capability attribute**),
`SourceStandardsRatchetTests` (IClock, no try/catch in controllers), `ClaudeMdFactsTests`
(capability count line must match the catalog). Both stacks: one type per file, docs only
under `docs/delivery/…` with frontmatter.

## 2. Stack and platform numbers

- Angular 21.2 (existing) + **Capacitor 7**. One codebase; the Angular app builds a `mobile`
  configuration alongside `production`/`demo`. Platform differences behind a single
  `Platform` service (`shared/services/platform.service.ts`): web implementation = current
  behavior; native implementation = Capacitor plugins.
- **Android: `targetSdk 36`, `minSdk 23`** (Capacitor 7 floor; ML Kit barcode needs 21+,
  BiometricPrompt needs 23 — 23 is the binding constraint). Play App Signing enrolled at
  first upload.
- **iOS: minimum 16.0** (passkey/`ASAuthorization` platform-authenticator APIs; Face ID APIs
  are older). Verify against the chosen biometric plugin in step 2 and restate.
- Bundle ID `com.armoryworks.forge` on both stores — **Dan reserves these now** (App Store
  Connect + Play Console are account actions the agent can't perform).
- Plugins: `@capacitor-mlkit/barcode-scanning`; a maintained biometric plugin with
  Keychain/Keystore-backed storage (candidate: `capacitor-native-biometric` or
  `@aparajita/capacitor-biometric-auth` + `@capacitor/secure-storage`-class plugin — final
  pick in step 2 with maintenance check); `@capacitor/push-notifications`, `haptics`, `app`,
  `network`, `device`. TLS pinning via the native HTTP layer (see §4.2).

## 3. Screens vs the existing `/m` feature

The brief scopes five screens: **Scan, Clock, Job Status, Move Stock, Lookup** (+ minimal
Account, § 5.7). The existing `/m` feature has nine pages including chat, hours,
notifications, and home — and no Move Stock or Lookup.

Proposal (needs Dan's sign-off, see D1): the Capacitor shell boots into a **new five-tab
mobile shell** that reuses `/m`'s components where they fit (clock, job detail, scan
viewfinder chrome) but is its own route tree (`/app`), so the five-screen scope is real and
the PWA's `/m` surface stays untouched for phone browsers. Chat/hours/notifications open the
desktop web app in the system browser via deep link, per the brief. No forked components:
pages are shared standalone components parameterized by the `Platform` service.

## 4. Server-side changes (the §13.1 list)

Each item is a new controller (capability-gated — the architecture test forces this) or a
change to existing middleware. New capability group **`CAP-MOBILE-*`** added to
`CapabilityCatalog.cs` (+ CLAUDE.md count line updated in the same commit): per-screen flags
(`CAP-MOBILE-SCAN`, `-CLOCK`, `-JOBSTATUS`, `-MOVESTOCK`, `-LOOKUP`) and per-risky-feature
flags (`-PUSH`, `-VOICE`, `-PHOTO`), plus `CAP-MOBILE-SHARED-DEVICE`.

1. **Persisted sessions + device registry** (prerequisite for everything in §5 of the brief).
   New `UserDevice` + `DeviceSession` entities (device ID, name, platform, enrolled-at/by,
   last-seen, revoked-at); `ISessionStore` gains a DB-backed implementation. Today's
   in-memory store can't do remote revoke, device lists, or survive restarts.
2. **Device-bound refresh tokens with rotation + family revocation.** Net-new credential
   type (none exists). Access tokens stay short-lived; refresh grant bound to the device
   record; stale-reuse revokes the family and flags the device (audit event).
3. **Enrollment**: admin "Add a device" UI (desktop, under Users), one-time 32-byte token
   (10-min expiry, single-use, bound to user + issuing admin), QR payload = {server URL,
   token, instance name, cert SHA-256}; `POST /api/v1/devices/enroll` exchange.
4. **`/.well-known/forge.json`** (name, api URL, auth methods, cert_sha256,
   min_app_version) — served by the API with an nginx location pass-through; nginx currently
   serves no `.well-known`.
5. **2FA policy** per instance (`off | admins_required | all_required`) — TOTP already
   works; **passkeys are a build** (fido2-net-lib + registration/assertion endpoints +
   desktop enroll UI). Recovery codes exist.
6. **Idempotency middleware**: `Idempotency-Key` header + 24 h key/response store + replay
   short-circuit; scan-collapse rule (same device+code+action within 3 s = one event,
   logged). Nothing like this exists; only per-feature `externalId` dedup on leads.
7. **Compensating actions** where missing (undo): revert job column, reverse stock move,
   delete clock event — same idempotency scheme. Exact endpoint list drafted in step 2 after
   mapping the five screens' mutations.
8. **Remote revoke + wipe signal**: revoke endpoint + a revoked-device response contract the
   app treats as wipe; stale-device flagging (no check-in for N days, default 30); audit
   events for enroll/revoke/token-reuse (writer exists, events are new).
9. **Push**: device push-token registry + FCM/APNs senders on the operator's instance;
   payloads carry an ID only, app fetches content. Net-new.
10. **Shared-device mode**: extends the existing `KioskTerminal` pattern to the mobile shell
    (instance-enrolled device, per-transaction badge/PIN attribution, 60 s identity
    auto-clear).
11. **Plumbing**: CORS entry for the Capacitor origin; auth-interceptor URL rule rewritten
    around the runtime API base; RFC 7807 unification check for the two deviant envelopes;
    rate-limit partition review for enrollment endpoints (anonymous NAT'd fleet shares one
    IP bucket today).
12. **Crash reporting**: optional self-hosted GlitchTip service in the compose stack
    (profile, off by default) + "Report a problem" ticket endpoint.

Client-side counterparts: runtime server-address/instance store (multi-instance, per-instance
tokens/queue/pins — §5.8), secure-storage token layer replacing localStorage on native,
TOFU pin verification in the native HTTP path, wiring `OfflineQueueService` into the five
screens' mutations with idempotency keys (reuse, don't rebuild — but it must actually be fed),
`docs/labels.md` written from `BarcodeService.cs` and a **shared scan parser** used by both
kiosk and mobile.

## 5. Order of work

As per the brief §13, unchanged, with step-2 add-ons discovered in inspection: PWA manifest
icons fixed in passing; `capacitor.config`, Android/iOS projects, CI lanes for the mobile
build. Every step ends green on: `lint`, `lint:i18n`, `lint:standards`, Vitest, Playwright
functional, `dotnet build -warnaserror && dotnet test` — plus the new unit tests §10 requires.

## 6. Decisions needed from Dan before step 2

- **D1 — Screen shell.** New five-tab `/app` shell reusing components (proposed), or trim
  the existing `/m` feature to five screens (changes the phone-browser PWA experience too)?
- **D2 — Refresh-token scope.** Device-bound refresh tokens are net-new. Mobile-only, with
  web keeping 24 h access tokens — or adopt refresh rotation for web sessions at the same
  time (bigger change, one auth model)?
- **D3 — Persisted sessions.** DB-backed session store replaces the in-memory one for all
  clients (web included) or runs alongside it for devices only? Replacing fixes "API restart
  logs everyone out" globally; alongside is smaller.
- **D4 — Passkeys.** Real FIDO2 build (fido2-net-lib, registration on desktop, assertion on
  phone) is meaningful scope. Ship in v1.0 per the brief, or is TOTP + enrollment-QR-as-
  second-factor acceptable for v1.0 with passkeys fast-following? The brief says nothing
  security-related defers — flagging the cost, not proposing the cut.
- **D5 — Keep-Mine conflict path.** The offline queue's `X-Force-Overwrite` has no server
  implementation. Implement it (bounded to the five screens' endpoints), or drop Keep-Mine
  and surface conflicts as desktop-review-only (matches the brief §7)?
- **D6 — Geolocation.** Permissions-Policy disables it everywhere. The brief never asks for
  location; confirm it stays off (recommended).
- **D7 — Store accounts.** Reserve `com.armoryworks.forge` on App Store Connect + Play
  Console and enroll Play App Signing — account actions only Dan can do; blocking for
  step 9, not for steps 2–8.
