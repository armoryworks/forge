# Authentication Flows

**Routes:** `/login`, `/setup`, `/token-setup`, `/sso-callback`
**Access Roles:** Unauthenticated only

## Purpose

Authentication is tiered to support both office users and shop floor workers without
a traditional username/password requirement for kiosk operation.

## Tier 1: RFID / NFC + PIN (Kiosk)

For shop floor workers with physical badges:
1. Worker scans RFID badge or NFC sticker at kiosk
2. PIN entry prompt appears
3. 4-6 digit PIN entered (numeric keypad)
4. JWT issued → worker is authenticated

**Hardware:** ACR122U NFC reader, NTAG215 stickers, USB barcode scanner (fallback)

## Tier 2: Barcode + PIN

For workers with printed barcode labels instead of NFC:
1. Scan barcode label (USB scanner → keyboard wedge input)
2. PIN entry prompt
3. JWT issued

## Tier 3: Username + Password (Standard)

Office employees and PMs use standard email/password login.

### Login Form Fields
| Field | Type | Required |
|:------|:-----|:---------|
| Email | Text | — |
| Password | Text | — |


## Tier 4: SSO (Google / Microsoft / OIDC)

Optional SSO via configured providers:
- Google Workspace
- Microsoft Azure AD
- Generic OIDC provider

SSO links to existing accounts — no self-registration.
Callback route: `/sso-callback`

## New Employee Setup Flow

Admins never set passwords. Instead:
1. Admin generates a **setup token** (time-limited, one-use)
2. Employee receives email with setup link or admin shares token directly
3. Employee visits `/token-setup?token=...` or `/setup`
4. Employee sets own password AND PIN
5. Account becomes active

## Session Management

- JWT access token (short-lived, e.g., 15 min)
- Refresh token (longer-lived, stored in localStorage)
- Auth interceptor silently refreshes before expiry
- Multi-tab logout sync via BroadcastChannel

## UX Analysis

### Flow Quality: ★★★★★

The tiered auth system is a genuine differentiator for manufacturing. Shop floor
workers get kiosk-friendly login without any technical overhead.

### Usability Observations

- PIN is separate from password — short numeric code, not a password
- Setup token eliminates IT help desk calls for forgotten initial passwords
- Refresh token prevents session timeouts during long work sessions

### Functional Gaps / Missing Features

- No two-factor authentication (2FA/MFA) for password logins
- No hardware security key (WebAuthn/FIDO2) support
- Session management page (view active sessions) is in account/security
  but forced logout of a specific session not yet implemented
- No automatic session timeout warning dialog before expiry
