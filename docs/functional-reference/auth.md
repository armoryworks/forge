# Authentication & MFA -- Functional Reference

## Overview

Forge implements a tiered authentication system designed for manufacturing environments where users range from office workers with full credentials to shop floor operators using RFID badges and PINs. The system supports four authentication tiers, single sign-on (SSO) via Google/Microsoft/OIDC, time-based one-time password (TOTP) multi-factor authentication, setup tokens for admin-provisioned accounts, and JWT-based session management.

---

## Authentication Tiers

| Tier | Method | Use Case | PIN Required |
|------|--------|----------|:------------:|
| Tier 1 | RFID/NFC scan + PIN | Shop floor kiosk (contactless badge) | Yes |
| Tier 2 | Barcode scan + PIN | Shop floor kiosk (badge barcode) | Yes |
| Tier 3 | Email + Password | Desktop/mobile web login | No (password is credential) |
| Tier 4 | SSO (Google/Microsoft/OIDC) | Desktop/mobile web login | No (IdP handles auth) |

Tier 1-2 are kiosk-oriented flows used on shop floor displays. Tier 3-4 are standard web login flows.

---

## Routes

### Auth Routes

| Path | Component | Auth Required | Purpose |
|------|-----------|:-------------:|---------|
| `/login` | `LoginComponent` | No | Standard credential login |
| `/setup` | `SetupComponent` | No | First-time system setup (admin account + company) |
| `/setup/:token` | `TokenSetupComponent` | No | Employee account setup via admin-generated token |
| `/sso/callback` | `SsoCallbackComponent` | No | OAuth callback handler |

### Account Security Route

| Path | Component | Auth Required | Purpose |
|------|-----------|:-------------:|---------|
| `/account/security` | `AccountSecurityComponent` | Yes | Password change, PIN setup, MFA management |

### Kiosk Auth Routes

Shop floor displays at `/display/shop-floor` handle authentication inline via RFID/NFC scan or barcode + PIN. These do not use the `/login` route.

---

## Login Flow (`/login`)

### Component

| Property | Value |
|----------|-------|
| Component | `LoginComponent` |
| Template | `login.component.html` |
| Style | `login.component.scss` |
| Change detection | `OnPush` |

### States

The login page renders one of three states:

1. **Already Logged In** -- shown when user has valid auth. Displays current user email with "Go to Dashboard" and "Sign Out & Switch Account" buttons.

2. **MFA Challenge** -- shown after successful credential login when MFA is required. Renders `MfaChallengeComponent` inline.

3. **Login Form** -- standard credential entry form.

### Login Form Fields

| Field | Control | Validators | data-testid |
|-------|---------|-----------|-------------|
| Email | `app-input` (type: email) | `required`, `email` | `login-email` |
| Password | `app-input` (type: password) | `required` | `login-password` |

**Submit button:** `data-testid="login-submit"`. Disabled when form is invalid or loading. Shows "Signing in..." text during submission.

### Login Flow Steps

1. User enters email and password, clicks "Sign In"
2. Component calls `AuthService.login({ email, password })` which POSTs to `/api/v1/auth/login`
3. **If MFA is required:** Response contains `mfaRequired: true` and `mfaUserId`. Component transitions to MFA challenge state.
4. **If MFA is not required:** Response contains JWT tokens and user profile. `AuthService` stores tokens in localStorage. Component navigates to:
   - `/account/profile` if `profileComplete` is false (desktop only, mobile skips this)
   - The `returnUrl` query parameter if present (set by auth guard on redirect)
   - The default route for the user's role (via `LayoutService.getDefaultRoute()`)

### Error Handling

| HTTP Status | Behavior |
|-------------|----------|
| 401 | Snackbar: login failed message |
| 500+ or has stack trace | Toast with error title, message, and details (copy button) |
| Other | Snackbar with server detail message or fallback |

### Query Parameters

| Param | Purpose |
|-------|---------|
| `reason=session_expired` | Shows info snackbar "Session expired" on page load |
| `returnUrl` | Captures intended destination from auth guard redirect; navigated to after login |

Both parameters are cleared from the URL on component init (via `replaceUrl` navigation).

### Setup Code Entry

Below the login form, a "Have a setup code?" link toggles a setup code input field. Entering a code and clicking "Continue" navigates to `/setup/{code}`.

### SSO Buttons

If SSO providers are configured, they appear below a divider labeled "or sign in with". Each provider renders as a stroked button with an icon:
- Google: `g_mobiledata` icon
- Microsoft: `window` icon
- Other OIDC: `key` icon

Clicking a provider button triggers `AuthService.ssoLogin(providerId)` which redirects the browser to `/api/v1/auth/sso/{provider}/login`.

---

## SSO Flow

### Provider Configuration

SSO providers are loaded from `GET /api/v1/auth/sso/providers` (public endpoint). Returns an array of `SsoProvider` objects with `id` and `name`.

### OAuth Round-Trip

1. **Initiate:** `GET /api/v1/auth/sso/{provider}/login` -- server returns an OAuth challenge that redirects the browser to the identity provider (Google, Microsoft, or generic OIDC).

2. **Callback:** `GET /api/v1/auth/sso/{provider}/callback` -- server authenticates against the temporary external cookie, extracts the external ID and email from claims, looks up the user in the database:
   - **User found:** Issues a JWT token and redirects to `/sso/callback?sso_token={token}`
   - **No matching account:** Redirects to `/sso/callback?error=no_account`
   - **Auth failed:** Redirects to `/sso/callback?error=sso_failed`

3. **Frontend Callback:** `SsoCallbackComponent` reads query parameters:
   - `sso_token`: Calls `AuthService.handleSsoToken(token)` to store the JWT, then navigates to the default route.
   - `error=sso_failed`: Shows error snackbar, redirects to `/login`.
   - `error=no_account`: Shows "No account found" error snackbar, redirects to `/login`.

### SSO Account Linking

Authenticated users can link/unlink SSO identities from their account:
- Link: `POST /api/v1/auth/sso/link`
- Unlink: `DELETE /api/v1/auth/sso/unlink/{provider}`
- List linked: `GET /api/v1/auth/sso/linked`

SSO does not support self-registration. The user account must exist first (created by admin); SSO links to the existing account by matching email.

---

## Multi-Factor Authentication (MFA)

### TOTP Setup Flow

MFA setup is accessed from Account > Security (`/account/security`).

#### MFA Setup Dialog

| Property | Value |
|----------|-------|
| Component | `MfaSetupDialogComponent` |
| Width | 480px |
| Opened via | `MatDialog` from `AccountSecurityComponent` |

**Steps:**

1. **Loading** -- spinner while calling `POST /api/v1/auth/mfa/setup` to generate TOTP secret.

2. **Scan** -- displays:
   - QR code via `QrCodeComponent` (200px, error correction M) containing the TOTP URI
   - "Can't scan? Enter key manually" toggle that reveals the manual entry key with copy button
   - 6-digit verification code input (`data-testid="mfa-verify-code"`)
   - "Verify & Enable" button (`data-testid="mfa-verify-submit"`)

3. **Complete** -- success confirmation with message about needing the authenticator app for future logins, and a hint to generate recovery codes from the Security page.

**API calls:**
- Begin setup: `POST /api/v1/auth/mfa/setup` (optional `deviceName` in body). Returns `MfaSetupResponse`:
  - `secret`: TOTP secret (base32)
  - `qrCodeUri`: `otpauth://` URI for QR code generation
  - `manualEntryKey`: Human-readable base32 key for manual entry
  - `deviceId`: ID of the created (unverified) device record
- Verify setup: `POST /api/v1/auth/mfa/verify-setup` with `{ deviceId, code }`. Returns `{ verified: boolean }`. On success, the device is marked as verified and MFA is enabled.

### MFA Challenge Flow (During Login)

When a user with MFA enabled logs in, the login endpoint returns `{ mfaRequired: true, mfaUserId: number }` instead of tokens. The login form is replaced by the `MfaChallengeComponent`.

#### MFA Challenge Component

| Property | Value |
|----------|-------|
| Component | `MfaChallengeComponent` |
| Inputs | `userId` (required) |
| Outputs | `validated` (emits `MfaValidateResponse`), `cancelled` (emits void) |

**On init:** Calls `POST /api/v1/auth/mfa/challenge` with `{ userId }` to create a challenge. Returns `MfaChallengeResponse`:
- `challengeToken`: Short-lived token for this challenge
- `deviceType`: Type of MFA device (Totp, Sms, Email, WebAuthn)
- `maskedTarget`: Masked hint (e.g., device name) shown to user

**TOTP Code Form:**

| Field | Control | Validators | data-testid |
|-------|---------|-----------|-------------|
| 6-digit code | `app-input` | `required`, `pattern(/^\d{6}$/)` | `mfa-code` |
| Remember this device | checkbox | -- | -- |

Submit calls `POST /api/v1/auth/mfa/validate` with `{ challengeToken, code, rememberDevice }`. Returns `MfaValidateResponse`:
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token
- `expiresAt`: Token expiration timestamp

On success, `LoginComponent.onMfaValidated()` calls `AuthService.completeMfaLogin(token)` to store the JWT, refreshes the user profile, and navigates to the appropriate post-login destination.

**Recovery Code Form:**

Accessible via "Use a recovery code instead" link. Toggles to a form with a single `recoveryCode` input (`data-testid="mfa-recovery-code"`).

Submit calls `POST /api/v1/auth/mfa/recovery` with `{ challengeToken, recoveryCode }`. Returns the same `MfaValidateResponse`.

**Error handling:** Invalid codes show an inline error message ("Invalid verification code" or "Invalid recovery code") and reset the input field.

**Cancel:** "Back to login" button emits `cancelled` output, which resets the login form to credential entry.

### MFA Device Management

Managed from Account > Security (`/account/security`).

**MFA Status Display:**

When MFA is enabled:
- Green status indicator: "Two-factor authentication is enabled"
- Policy enforcement banner (if enforced by admin): "Required by organization policy"
- List of registered devices with device type icon, name, last used date, default badge, and delete button
- Recovery codes remaining count
- Action buttons: Add Device, New Recovery Codes, Disable MFA (hidden when enforced by policy)

When MFA is disabled:
- Shield icon: "Two-factor authentication is not enabled"
- Policy enforcement warning (if enforced): "Required by organization policy -- you must enable MFA"
- "Enable Two-Factor Authentication" button

**API calls:**
- Get status: `GET /api/v1/auth/mfa/status`. Returns `MfaStatus`:
  - `isEnabled`: boolean
  - `isEnforcedByPolicy`: boolean
  - `devices`: array of `MfaDeviceSummary` (id, deviceType, deviceName, isDefault, isVerified, lastUsedAt)
  - `recoveryCodesRemaining`: number
- Remove device: `DELETE /api/v1/auth/mfa/devices/{deviceId}` (confirmation dialog with danger severity)
- Disable MFA: `DELETE /api/v1/auth/mfa/disable` (confirmation dialog with danger severity; blocked when enforced by policy)

### Recovery Codes

#### Recovery Codes Dialog

| Property | Value |
|----------|-------|
| Component | `MfaRecoveryCodesDialogComponent` |
| Width | 480px |
| Opened via | "New Recovery Codes" button on Security page |

Calls `POST /api/v1/auth/mfa/recovery-codes`. Returns `MfaRecoveryCodesResponse`:
- `codes`: array of strings (format: `XXXXX-XXXXX`)
- `warning`: string explaining that existing codes are invalidated

Displays:
- Warning banner explaining existing codes are invalidated
- Grid of recovery codes in `<code>` elements
- "Copy All" button (copies to clipboard)
- "Download" button (saves as text file)
- "I've Saved These Codes" confirmation button to close

### MFA Policy Enforcement (Admin)

Admins configure which roles require MFA from the Admin > MFA tab (see Admin Panel reference). When a role is enforced:
- Users with that role see "Required by organization policy" on their Security page
- The "Disable MFA" button is hidden for enforced users
- The compliance table in the admin panel shows enforcement status per user

---

## Kiosk Authentication (Shop Floor)

### Scan Login

Shop floor displays use a unified scan login flow. The `ScannerService` detects keyboard-wedge input from USB barcode scanners or NFC readers.

**API endpoint:** `POST /api/v1/auth/scan-login` with `{ scanValue, pin }`

The server checks `UserScanIdentifiers` first (matching by `identifierValue`), then falls back to the `EmployeeBarcode` field. Returns a standard `LoginResponse` with JWT tokens.

### Legacy Kiosk Login

For backward compatibility:
- `POST /api/v1/auth/kiosk-login` with `{ barcode, pin }` -- barcode-only kiosk auth
- `POST /api/v1/auth/nfc-login` -- NFC-specific login

### Kiosk PIN

PINs are separate from passwords. They are short numeric codes (4-8 digits) used for kiosk authentication, PBKDF2 hashed in the database.

Users set their PIN from Account > Security. The PIN form:

| Field | Control | Validators |
|-------|---------|-----------|
| PIN | `app-input` (type: password) | `required`, `pattern(/^\d{4,8}$/)` |
| Confirm PIN | `app-input` (type: password) | `required` |

Mismatch detection shows inline warning. Calls `POST /api/v1/auth/set-pin` with `{ pin }`.

Admins can reset a user's PIN via `POST /api/v1/admin/users/{id}/reset-pin`.

### Shop Floor Auth Flow

1. Shop floor display shows idle screen with "Scan Badge or Enter ID" prompt
2. Worker scans RFID/NFC badge or barcode
3. System identifies the user via `scan-login` endpoint
4. PIN entry screen appears with worker's name (auto-dismiss after 20s timeout)
5. Worker enters PIN
6. Job selection screen appears (auto-dismiss after 15s timeout)
7. Worker selects active job to clock in / start timer

---

## Setup Tokens (Admin-Provisioned Accounts)

### How It Works

Admin never sets passwords for users. Instead:

1. Admin creates user via Admin > Users > Add User
2. Server creates the user account (passwordless) and returns a setup token
3. Admin shares the token with the employee (verbally, email, or printed)
4. Employee navigates to `/setup/{token}` or enters the code on the login page via "Have a setup code?"

### Token Setup Component (`/setup/:token`)

| Property | Value |
|----------|-------|
| Component | `TokenSetupComponent` |
| Template | `token-setup.component.html` |

**On init:**
1. Reads token from route parameter
2. Validates token via `GET /api/v1/auth/validate-token/{token}`
3. If valid: shows welcome message with user's name and password form
4. If invalid/expired: shows error message

**Form fields:**

| Field | Control | Validators |
|-------|---------|-----------|
| Password | `app-input` (type: password) | `required`, `minLength(8)` |
| Confirm Password | `app-input` (type: password) | `required` |

**On submit:**
1. Validates passwords match (client-side check, snackbar error on mismatch)
2. Calls `POST /api/v1/auth/complete-setup` with `{ token, password }`
3. Server creates the password, issues JWT tokens, returns `LoginResponse`
4. Snackbar: "Account setup complete"
5. Navigates to `/account/profile` (if profile incomplete on desktop) or default route

### Token Lifecycle

- Tokens have a server-configured expiration period
- Expired tokens return an error on validation
- Admin can regenerate tokens via `POST /api/v1/admin/users/{id}/setup-token`
- Admin can also send an invite email with the setup link via `POST /api/v1/admin/users/{id}/send-invite`

---

## Initial System Setup (`/setup`)

First-time installation setup, accessible only when no admin account exists.

### Component

| Property | Value |
|----------|-------|
| Component | `SetupComponent` |
| Template | `setup.component.html` |

The setup wizard checks `GET /api/v1/auth/status` which returns `{ setupRequired: boolean }`. If setup is not required (admin exists), the route redirects to login.

### Step 1: Admin Account

| Field | Control | Validators | Required |
|-------|---------|-----------|:--------:|
| First Name | `app-input` | `required` | Yes |
| Last Name | `app-input` | `required` | Yes |
| Email | `app-input` (type: email) | `required`, `email` | Yes |
| Password | `app-input` (type: password) | `required`, `minLength(8)` | Yes |

"Next" button advances to Step 2 (validates Step 1 form first).

### Step 2: Company Details

| Field | Control | Validators | Required |
|-------|---------|-----------|:--------:|
| Company Name | `app-input` | `required`, `maxLength(200)` | Yes |
| Phone | `app-input` (mask: phone) | -- | -- |
| Email | `app-input` (type: email) | `email` | -- |
| EIN | `app-input` | -- | -- |
| Website | `app-input` | -- | -- |
| Location Name | `app-input` (default: "Main Office") | -- | -- |
| Address | `app-address-form` (US fixed, compact, no verify) | -- | -- |

"Back" button returns to Step 1. "Complete Setup" button submits both forms.

**On submit:** Calls `POST /api/v1/auth/setup` with all account and company fields. Server creates the admin user, company profile, and primary location. Returns `LoginResponse` with JWT tokens. Navigates to default route.

---

## JWT Token Management

### Token Storage

Tokens are stored in `localStorage`:
- `access_token`: Short-lived JWT access token
- `refresh_token`: Refresh token (if applicable)

### Token Lifecycle

1. **Login** -- server issues access token (and optionally refresh token)
2. **API Requests** -- `authInterceptor` attaches `Authorization: Bearer {token}` header to all API calls
3. **Token Refresh** -- `POST /api/v1/auth/refresh` issues a new access token using the current token's JTI and user ID
4. **Logout** -- `POST /api/v1/auth/logout` invalidates the current token server-side (by JTI). Client clears localStorage.

### Auth Interceptor Behavior

| HTTP Status | Action |
|-------------|--------|
| 401 | Attempts silent token refresh; if refresh fails, redirects to `/login?reason=session_expired` |
| 403 | Snackbar: "Access denied" |

Concurrent requests during refresh are queued and replayed after the refresh completes.

### Cross-Tab Session Sync

- **Logout propagation:** When one tab logs out, all other tabs are notified via `BroadcastChannel` / `storage` event and redirect to login.
- **Theme sync:** Theme changes propagate via `storage` event on the `themeMode` key.

---

## Account Security Page (`/account/security`)

### Change Password Section

| Field | Control | Validators | Required |
|-------|---------|-----------|:--------:|
| Current Password | `app-input` (type: password) | `required` | Yes |
| New Password | `app-input` (type: password) | `required`, `minLength(8)` | Yes |
| Confirm New Password | `app-input` (type: password) | `required` | Yes |

Password mismatch detection shows inline warning with icon. Submit calls `POST /api/v1/auth/change-password` with `{ currentPassword, newPassword }`.

### Kiosk PIN Section

Described above in the Kiosk Authentication section.

### Two-Factor Authentication Section

Described above in the MFA section. Shows current MFA status, registered devices, recovery code count, and action buttons.

---

## API Endpoints Summary

All endpoints are under `/api/v1/auth`.

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Credential login; returns JWT or MFA challenge |
| GET | `/auth/status` | Check if initial setup is required |
| POST | `/auth/setup` | First-time system setup (admin + company) |
| GET | `/auth/validate-token/{token}` | Validate a setup token |
| POST | `/auth/complete-setup` | Complete account setup with token + password |
| POST | `/auth/kiosk-login` | Kiosk login (barcode + PIN) |
| POST | `/auth/nfc-login` | NFC kiosk login |
| POST | `/auth/scan-login` | Unified scan login (any identifier + PIN) |
| GET | `/auth/sso/providers` | List configured SSO providers |
| GET | `/auth/sso/{provider}/login` | Initiate SSO OAuth flow |
| GET | `/auth/sso/{provider}/callback` | OAuth callback handler |
| POST | `/auth/mfa/challenge` | Create MFA challenge for login |
| POST | `/auth/mfa/validate` | Validate MFA code during login |
| POST | `/auth/mfa/recovery` | Validate recovery code during login |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current authenticated user profile |
| PUT | `/auth/profile` | Update user profile |
| POST | `/auth/logout` | Invalidate current token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/set-pin` | Set kiosk PIN |
| POST | `/auth/sso/link` | Link SSO identity to account |
| DELETE | `/auth/sso/unlink/{provider}` | Unlink SSO identity |
| GET | `/auth/sso/linked` | List linked SSO providers |
| POST | `/auth/mfa/setup` | Begin TOTP MFA setup |
| POST | `/auth/mfa/verify-setup` | Verify TOTP code to complete setup |
| DELETE | `/auth/mfa/disable` | Disable MFA (remove all devices + codes) |
| DELETE | `/auth/mfa/devices/{deviceId}` | Remove specific MFA device |
| GET | `/auth/mfa/status` | Get MFA status + devices + recovery count |
| POST | `/auth/mfa/recovery-codes` | Generate new recovery codes |

---

## Data Models

### LoginResponse

| Field | Type | Description |
|-------|------|-------------|
| `token` | string | JWT access token |
| `refreshToken` | string or null | Refresh token |
| `expiresAt` | string | Token expiration (ISO 8601) |
| `user` | AuthUserResponseModel | User profile |
| `mfaRequired` | boolean | Whether MFA challenge is needed |
| `mfaUserId` | number or null | User ID for MFA challenge |

### AuthUserResponseModel

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | User ID |
| `email` | string | Email address |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `initials` | string or null | Display initials |
| `avatarColor` | string or null | Avatar hex color |
| `roles` | string[] | Assigned roles |
| `profileComplete` | boolean | Whether profile is fully filled out |
| `hasPin` | boolean | Whether kiosk PIN is set |
| `mfaEnabled` | boolean | Whether MFA is enabled |

### MfaSetupResponse

| Field | Type | Description |
|-------|------|-------------|
| `secret` | string | TOTP secret (base32) |
| `qrCodeUri` | string | `otpauth://` URI for QR code |
| `manualEntryKey` | string | Human-readable base32 key |
| `deviceId` | number | ID of created device record |

### MfaChallengeResponse

| Field | Type | Description |
|-------|------|-------------|
| `challengeToken` | string | Short-lived challenge token |
| `deviceType` | MfaDeviceType | Device type (Totp, Sms, Email, WebAuthn) |
| `maskedTarget` | string or null | Masked hint for the device |

### MfaValidateResponse

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT access token |
| `refreshToken` | string | JWT refresh token |
| `expiresAt` | string | Token expiration (ISO 8601) |

### MfaStatus

| Field | Type | Description |
|-------|------|-------------|
| `isEnabled` | boolean | Whether MFA is active |
| `isEnforcedByPolicy` | boolean | Whether admin policy requires MFA for this user's role |
| `devices` | MfaDeviceSummary[] | Registered devices |
| `recoveryCodesRemaining` | number | Count of unused recovery codes |

### MfaDeviceSummary

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Device ID |
| `deviceType` | MfaDeviceType | Totp, Sms, Email, or WebAuthn |
| `deviceName` | string or null | User-assigned device name |
| `isDefault` | boolean | Whether this is the default device |
| `isVerified` | boolean | Whether device setup is verified |
| `lastUsedAt` | string or null | Last usage timestamp (ISO 8601) |

### MfaDeviceType

Enum: `Totp` | `Sms` | `Email` | `WebAuthn`

Currently only `Totp` is fully implemented. Other types exist as model placeholders.

### SetupTokenInfo

| Field | Type | Description |
|-------|------|-------------|
| `firstName` | string | User's first name |
| `lastName` | string | User's last name |

### SsoProvider

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Provider identifier (google, microsoft, oidc) |
| `name` | string | Display name |

---

## Known Limitations

1. **Only TOTP MFA is implemented.** The `MfaDeviceType` enum includes Sms, Email, and WebAuthn, but only TOTP (authenticator app) is functional. The others are model-level placeholders.

2. **SSO does not support self-registration.** Users must be pre-created by an admin. SSO links to an existing account by matching email address. There is no auto-provisioning of new accounts from SSO claims.

3. **"Remember this device" checkbox** is present in the MFA challenge form but the server-side implementation of device trust (skipping MFA for remembered devices) may vary based on deployment.

4. **Password reset flow** (forgot password) is not implemented as a self-service feature. Users who forget their password must contact an admin to generate a new setup token.

5. **Setup token expiration** is server-configured and not displayed to the admin during generation (only the expiration date is shown). The default expiration period is not configurable from the admin UI.

6. **PIN is independent from password.** Changing or resetting a password does not affect the PIN, and vice versa. A user can have a password without a PIN (no kiosk access) or a PIN without a password (kiosk-only, no web login).

7. **SSO callback uses query parameter tokens.** The `sso_token` is passed as a URL query parameter during the redirect from server to client. This is a short-lived token that is consumed immediately by the `SsoCallbackComponent`.

8. **Concurrent refresh token handling** queues requests during token refresh but does not handle the case where the refresh token itself has expired -- the user is redirected to login with a session expired message.

9. **RFID/NFC kiosk login** requires the RFID Relay Client to be installed and running on the kiosk machine. Without it, only barcode scanning is available for kiosk auth.
