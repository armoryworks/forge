# Forge mobile — store submission pack

Everything the two store consoles ask for, written once. Steps marked **Dan** need
an account only he can hold.

## Identity

| | |
|---|---|
| App name | Forge |
| Bundle / package | `com.armoryworks.forge` |
| Category | Business |
| Age rating | 4+ / Everyone (no user-generated public content, no ads, no purchases) |
| Price | Free (the app is useless without a Forge instance; licensing is on the server) |
| Support URL | https://armoryworks.com/forge/support |
| Privacy policy URL | https://armoryworks.com/forge/privacy — **Dan: publish before submission** |

## Short description (80 chars)

Scan, clock, move stock and check jobs on the shop floor — on your own Forge.

## Full description

Forge Mobile is the shop-floor companion to your company's Forge manufacturing
system. Point the camera at any Forge label and act on it in one tap: advance a
job, start a timer, move stock between bins, clock in or out. Everything shows
an undo. Works offline and syncs in order when the signal comes back.

The app connects only to your company's Forge server, which your administrator
enrolls with a QR code. Armory Works never sees your data.

Requires a Forge instance with the mobile capability enabled. Ask your
administrator for an enrollment code.

## Privacy answers

Both consoles ask the same questions. The truthful answers:

- **Data collected by the developer:** none. Apple: "Data Not Collected". Google
  Data safety: no data collected, no data shared.
- The app transmits data (scans, clock events, notes, photos) to the **customer's
  own server** chosen at enrollment. Encrypted in transit (TLS required, certificate
  pinned). Users can request deletion from their employer; the developer holds
  nothing.
- Optional crash reports go to the customer's own GlitchTip, only when the
  customer configures one and the user leaves the toggle on. Reports carry the
  error, app build and screen name — no identifiers.
- No advertising ID, no analytics SDK, no third-party SDKs that phone home.
- Tracking (Apple ATT): none. Do not show the ATT prompt.

## Permissions and why (review notes)

| Permission | Why |
|---|---|
| Camera | Scanning labels; attaching a photo to a job |
| Microphone / speech | Dictating a job note or a lookup |
| Face ID / biometrics | Unlocking the app without the PIN |
| Vibration | Scan feedback |

## App Review notes (paste into both consoles)

> The app requires a Forge server. Use the demo instance below; scan the
> enrollment QR at the link (or type the server address and sign in with the
> demo credentials). Everything in the app acts on demo data.
>
> Demo server: https://demo.forge.armoryworks.com — **Dan: stand this up on the
> demo box with CAP-MOBILE-* enabled and a reviewer user; the enrollment QR is
> issued from Admin → Devices (10-minute tokens — issue a fresh one the day of
> submission and note the login fallback).**
> Reviewer login: reviewer@demo.forge.armoryworks.com / (password in the console's
> private notes field).

## Screenshots (per device size the console asks for)

Take at 390×844 (iPhone 6.1") and 1080×2400 (Android) from the demo instance,
dark theme, English and Spanish sets:

1. Scan — viewfinder on a job label with the action sheet open
2. Job status — stage, next column, undo toast visible
3. Clock — "IN" in large type
4. Move stock — quantity stepper with lot picker
5. Lookup — results list
6. Account — instances and devices

Feature graphic (Play, 1024×500): the Forge mark on the header colour with the
short description. Icon: `forge-ui/public/icons/` (adaptive foreground/background
already split).

## Build & sign

**Android (any box with Java 17 + Android SDK):**

```
cd forge-ui && npm run build:mobile && npx cap sync android
cd android && ./gradlew bundleRelease   # needs android/keystore.properties
```

- **Dan:** create the upload key once (`keytool -genkeypair -v -keystore forge-upload.jks -alias forge -keyalg RSA -keysize 4096 -validity 10000`), keep it out of git, fill `keystore.properties`, enroll **Play App Signing** on first upload so Google holds the app-signing key.
- Bump `versionCode`/`versionName` in `android/app/build.gradle` per release.

**iOS (a Mac with Xcode 16):**

```
cd forge-ui && npm run build:mobile && npx cap sync ios && npx cap open ios
```

- Add `ios/App/App/Plugins/TlsPinPlugin.swift` to the App target the first time (File → Add Files…).
- Signing: automatic with the Armory Works team; **Dan:** Apple Developer Program enrollment + App Store Connect record for `com.armoryworks.forge`.
- Product → Archive → Distribute → App Store Connect. TestFlight first.

## Release checklist

- [ ] `forge/docs/mobile-test-matrix.md` hands-on pass on real devices
- [ ] Server: `Mobile__CertSha256` set on every customer box that will enroll phones
- [ ] `MOBILE_MIN_APP_VERSION` matches the build being shipped
- [ ] Privacy policy URL live
- [ ] Demo instance reachable from outside; reviewer user works; fresh enrollment QR
- [ ] Screenshots current for this build
- [ ] Play: Data safety form answered "no data collected"; App Store: privacy "Data Not Collected"
