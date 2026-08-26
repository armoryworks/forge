# Forge mobile app — test matrix

What must be exercised before a store build ships. Automated where marked;
the rest is a hands-on pass on real hardware (emulators cannot do TOFU
certificate checks, biometrics, or torch).

## Devices

| Platform | Minimum | Verify on |
|---|---|---|
| Android | 6.0 (API 23) | one budget phone (≤3 GB RAM), one current flagship, one rugged scanner-phone if a customer has them |
| iOS | 16 | one iPhone SE-class, one current iPhone |

Screen: 360×640 up to 430×932 logical px; one-hand reach for every primary action.

## Automated gates (every commit)

| Layer | Command | Covers |
|---|---|---|
| forge-ui unit | `npm run test -- --watch=false` | scan-code hints, DSN parsing, screen guard, idempotency headers, offline queue (headers replay, per-instance, 4xx → rejected) |
| forge-ui e2e (stub-driven) | `npx playwright test mobile-shell` | shell tabs, clock punch + undo, lookup → action sheet → move prefill, job advance + undo, full Move Stock via typed labels (wrong kind, same bin, on-hand default, undo reverse move), typed label on Scan |
| forge-ui a11y | `npm run test:a11y` | axe critical/serious on all six shell routes + enrollment at 390×844 |
| forge-api | `dotnet test` | IdempotencyMiddleware (Postgres), ScanCollapseService, DbSessionStore, PasskeyService, mobile capability edges, problem-report validator, controller gate audit |

## Hands-on scenarios (per release)

### Enrollment & trust
- [ ] Scan an admin-issued QR → enrolled without typing; instance name shown during connect.
- [ ] Manual server entry: `http://` refused; bare host gets `https://`.
- [ ] First contact shows the certificate fingerprint; accept → pinned; later mismatch → refuses with the "certificate changed" message, no data sent.
- [ ] Expired enrollment token (10 min) → clear error, retry works with a fresh one.
- [ ] TOTP / passkey second factor when the role requires MFA.

### Session & lock
- [ ] PIN set at first launch; deep link that triggered setup is where you land afterwards.
- [ ] Idle lock after the role's timeout (floor 8 h / office 15 min); biometric unlock when enabled.
- [ ] Ten wrong PINs → wipe → back at enrollment.
- [ ] Admin revokes the device → next request wipes the app (`device-revoked`), other instances on the phone untouched.
- [ ] Refresh-token reuse (restore an old backup) → whole family revoked, device flagged in admin.

### Shared device
- [ ] Enrolled shared: no PIN lock; every action asks badge + PIN first; identity clears 60 s after the last action and immediately after a clock punch.

### Five screens
- [ ] Scan: torch, tick on decode, double-buzz on unknown, enrollment QR refused here with a hint.
- [ ] "Type it in" on Scan and Move Stock: a typed label id behaves exactly like a decode (same kind checks, same sheet); the link is easy to miss on purpose.
- [ ] Scan → job → advance → undo (moves back); duplicate scan inside 3 s collapses.
- [ ] Job Status: note preset picker, dictated note, photo attach; each with undo.
- [ ] Clock: OUT → IN → break → IN → OUT; undo inside 45 s; older undo refused with the desktop hint.
- [ ] Move Stock: part → from-bin → to-bin → quantity default = on hand; lot picker on lot-tracked part; wrong label kind double-buzzes; undo reverses the move.
- [ ] Lookup: type and voice; every result kind opens the right sheet.

### Offline
- [ ] Airplane mode: each mutation shows "Saved on this phone", header chip counts; undo drops it from the queue.
- [ ] Reconnect: replays in order with the original Idempotency-Key; server dedupes a double replay.
- [ ] A replay the server refuses (4xx) shows under "Needs attention" and does not block the rest.
- [ ] Icons and fonts render offline (no CDN).

### Instances
- [ ] Two instances enrolled; switch is one tap; each keeps its own queue, PIN, pin, tokens.
- [ ] Remove the active instance → lands on the other, or enrollment when none left.

### Capability flags
- [ ] Turn a screen flag off in admin → tab disappears on next descriptor load; URL to it lands on Account; API answers 403.
- [ ] Turning CAP-MOBILE-CORE off is refused while a screen flag is on.

### Diagnostics
- [ ] Report a problem → admin notification + API log line.
- [ ] With `MOBILE_CRASH_DSN` set: forced crash appears in GlitchTip with build + screen only; toggle off → nothing sent. Without DSN: no toggle shown, no traffic.
- [ ] Network capture over a full session shows only the instance host.

### Accessibility
- [ ] TalkBack / VoiceOver through enrollment, lock, and one action per screen.
- [ ] 200 % font scale: nothing clipped, nothing overlapping.
- [ ] Every touch target ≥ 44 pt; Clock button one-thumb reachable.
