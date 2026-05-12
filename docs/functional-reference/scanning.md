# Barcode & Scanning

## Overview

Forge supports barcode scanning, QR code display, NFC/RFID tag reading, and label printing across the application. The scanning infrastructure has two main modes:

1. **Global keyboard-wedge detection** -- The `ScannerService` listens for rapid keystroke patterns on `document` that indicate a USB barcode scanner or keyboard-wedge device, as opposed to normal human typing. This works application-wide without requiring focus on a specific input field.
2. **Focused scan input** -- The `BarcodeScanInputComponent` provides a dedicated input field for kiosk scenarios (e.g., shop floor clock-in) where the scanner input should be captured in a specific field.

Additionally, the system supports NFC/RFID readers through the `WebHidRfidService`, which connects via either a WebSocket relay server (cross-browser) or the WebHID API (Chromium only).

---

## ScannerService

**Location:** `forge-ui/src/app/shared/services/scanner.service.ts`

Global singleton (`providedIn: 'root'`) that detects USB barcode scanner and NFC reader input using keyboard-wedge detection. Started in `AppComponent.ngOnInit()` after authentication and stopped on logout.

### Detection Algorithm

The service registers a `keydown` listener on `document` (outside Angular zone for performance). It distinguishes scanner input from human typing based on keystroke timing:

1. **Threshold:** Consecutive keystrokes within 50ms (`SCAN_THRESHOLD_MS`) are accumulated into a buffer. Human typing is typically 100-300ms between keys.
2. **Completion:** A scan is considered complete when:
   - Enter key is pressed and the buffer contains at least 4 characters (`MIN_SCAN_LENGTH`), OR
   - 80ms (`SCAN_COMPLETE_DELAY_MS`) elapses after the last keystroke (fallback for scanners that do not send Enter)
3. **Editable element filtering:** When the active element is an editable field (`<input>`, `<textarea>`, `contentEditable`), the service only starts a new buffer if the keystroke timing matches scanner speed. Elements inside `app-barcode-scan-input` are always excluded (that component handles its own scanning).

### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `lastScan` | `ScanEvent \| null` | Most recent scan event |
| `enabled` | `boolean` | Whether scanning is active |
| `listening` | `boolean` | Whether the keydown listener is registered |
| `context` | `ScanContext` | Current scan context for routing |
| `hasRecentScan` | `boolean` | True if a scan occurred within the last 5 seconds |

### Methods

| Method | Description |
|--------|-------------|
| `start()` | Registers the keydown listener and attempts RFID relay connection |
| `stop()` | Removes the keydown listener and clears the buffer |
| `restart()` | Unconditionally tears down and re-registers (for pages managing their own lifecycle) |
| `setContext(context)` | Sets the scan context so feature pages can filter by context |
| `enable()` / `disable()` | Toggle scan detection without removing the listener |
| `clearLastScan()` | Resets the `lastScan` signal to null |

### ScanContext

```typescript
type ScanContext =
  | 'global'
  | 'parts'
  | 'inventory'
  | 'shop-floor'
  | 'kanban'
  | 'receiving'
  | 'shipping'
  | 'quality';
```

### ScanEvent

```typescript
interface ScanEvent {
  value: string;      // Scanned barcode/tag value
  timestamp: Date;    // When the scan occurred
  context: ScanContext; // Active context at scan time
}
```

### RFID Bridge

The `ScannerService` bridges NFC/RFID scans from `WebHidRfidService` into the unified scan signal. An `effect()` watches `rfid.lastScan()` and converts RFID UIDs into `ScanEvent` objects with the current context. This means feature pages only need to watch `scannerService.lastScan()` regardless of whether the scan came from a barcode scanner or NFC reader.

### Feature Integration Pattern

Each feature page sets its context and reacts to scans:

```typescript
private readonly scanner = inject(ScannerService);

constructor() {
  this.scanner.setContext('parts');

  effect(() => {
    const scan = this.scanner.lastScan();
    if (!scan || scan.context !== 'parts') return;
    this.scanner.clearLastScan();
    this.searchControl.setValue(scan.value);
  });
}
```

---

## Integration Points

### Parts

**Context:** `'parts'`

Scanned value is set as the search filter, triggering a part lookup by part number. If a matching part is found, it is selected and its detail panel opens.

### Inventory

**Context:** `'inventory'`

Scanned value is set as the search filter. The view switches to the stock tab to show matching inventory items and their bin locations.

### Kanban

**Context:** `'kanban'`

Scanned job number selects the matching job card on the board and opens its detail panel. The board scrolls to bring the selected card into view.

### Quality

**Context:** `'quality'`

Scanned value fills the active tab's search field (inspections or lots tab), filtering QC records by the scanned identifier.

### Shop Floor Clock

**Context:** `'shop-floor'`

Uses `BarcodeScanInputComponent` directly (focused input mode) rather than the global `ScannerService`. The dedicated input captures employee badge scans for clock-in/clock-out authentication.

---

## BarcodeScanInputComponent

**Location:** `forge-ui/src/app/shared/components/barcode-scan-input/`

A dedicated scan input field designed for kiosk use where scans should target a specific input rather than being detected globally.

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `'Scan Barcode'` | Field label |
| `placeholder` | `string` | `'Scan or type barcode...'` | Placeholder text |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount; re-focus after blur (kiosk mode) |

### Output

| Output | Type | Description |
|--------|------|-------------|
| `scanned` | `string` | Emits the scanned/typed value on Enter |

### Behavior

- Enter key submits the value if it meets the minimum length (4 characters).
- Tracks keystroke timing internally to distinguish scanner vs keyboard input (same 50ms threshold as `ScannerService`).
- In `autoFocus` mode, the input re-focuses itself after blur (150ms delay) unless another input intentionally took focus. This ensures kiosk displays always have the scan input ready.
- The global `ScannerService` skips keydown events inside `app-barcode-scan-input` elements to avoid double-processing.

### Public Methods

- `focus()` -- Programmatically focus the input
- `clear()` -- Clear the input value and scan buffer

---

## WebHidRfidService

**Location:** `forge-ui/src/app/shared/services/web-hid-rfid.service.ts`

Handles NFC/RFID reader communication through two transport mechanisms:

### Transport Priority

1. **WebSocket relay** (primary, cross-browser) -- Connects to `ws://localhost:9876`, a local relay server that bridges USB HID readers to the browser. The relay sends JSON messages with `type: 'scan'`, `'connected'`, `'disconnected'`, or `'error'`.
2. **WebHID API** (fallback, Chromium only) -- Directly accesses USB HID devices via the browser's WebHID API. Requires user gesture to pair.

### Connection Flow

1. `connect()` / `reconnect()` -- Tries WebSocket relay first (2 second timeout). If unreachable, falls back to WebHID (attempts to reconnect previously paired devices).
2. `requestDevice()` -- Same priority, but falls back to the WebHID device picker dialog instead of silent reconnect.
3. `probeRelay()` -- Silent check of relay reachability. Sets `error` signal to prompt UI download instructions if relay is not found.

### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `connected` | `boolean` | Whether any reader is connected |
| `deviceName` | `string \| null` | Name of the active reader |
| `lastScan` | `RfidScanEvent \| null` | Most recent RFID scan |
| `error` | `string \| null` | Error message |
| `activeMode` | `TransportMode` | `'none' \| 'websocket' \| 'webhid'` |
| `webHidSupported` | `boolean` | Whether the browser supports WebHID |
| `supported` | `boolean` | Always true (WebSocket relay works in any browser) |

### RfidScanEvent

```typescript
interface RfidScanEvent {
  uid: string;         // Hex-encoded tag UID
  timestamp: Date;     // When the scan occurred
  raw: Uint8Array;     // Raw bytes from the reader
}
```

### WebSocket Relay Protocol

The relay server communicates via JSON messages:

| Message Type | Direction | Fields | Purpose |
|-------------|-----------|--------|---------|
| `scan` | Server -> Client | `uid`, `timestamp`, `raw` | NFC tag scanned |
| `connected` | Server -> Client | `device` | Reader connected to relay |
| `disconnected` | Server -> Client | `device` | Reader disconnected from relay |
| `error` | Server -> Client | `message` | Relay error |

The relay auto-reconnects on close with a 3-second delay unless intentionally disconnected.

### Multi-Device Handling

The service tracks multiple connected reader names (the relay may report both contact and contactless interfaces of the same physical reader). It prefers contactless/NFC reader names (matching keywords: `contactless`, `nfc`, `rfid`, `acr122`) over contact/EMV readers for the `deviceName` signal.

### UID Extraction (WebHID)

Raw HID input reports are processed to extract the NFC tag UID:
1. Leading and trailing zero bytes are stripped.
2. If the first byte equals the remaining payload length, it is treated as a length prefix and removed.
3. The remaining bytes are hex-encoded (uppercase, zero-padded).
4. UIDs shorter than 2 or longer than 40 hex characters are rejected.

---

## QrCodeComponent

**Location:** `forge-ui/src/app/shared/components/qr-code/`

A thin wrapper around `angularx-qrcode` for displaying QR codes.

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `string` (required) | -- | Data to encode in the QR code |
| `size` | `number` | `128` | QR code size in pixels |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |

### Usage

```html
<app-qr-code [value]="'JOB-1055'" [size]="200" errorCorrectionLevel="H" />
```

---

## LabelPrintService

**Location:** `forge-ui/src/app/shared/services/label-print.service.ts`

Generates barcode and QR code images using `bwip-js` (lazy-loaded) and opens a print window with formatted labels.

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `generateBarcodeDataUrl` | `value: string`, `bcid?: string` (default `'code128'`), `scale?: number` (default `4`) | `Promise<string>` | Canvas-rendered barcode as PNG data URL |
| `generateQrDataUrl` | `value: string`, `scale?: number` (default `4`) | `Promise<string>` | Canvas-rendered QR code as PNG data URL |
| `printLabels` | `labels: LabelData[]` | `Promise<void>` | Opens print window with formatted label sheet |

### LabelData

```typescript
interface LabelData {
  type: 'barcode' | 'qr';  // Barcode or QR code
  value: string;            // Data to encode
  label?: string;           // Primary text below the code
  sublabel?: string;        // Secondary text below the label
  width?: number;           // Label width in mm (default 50)
  height?: number;          // Unused currently
}
```

### Print Layout

The `printLabels` method generates a self-contained HTML document that:
1. Renders all labels as inline-block elements with dashed borders (hidden in print).
2. Each label contains the barcode/QR image, optional primary text (10pt, bold), and optional secondary text (8pt, gray).
3. Uses `IBM Plex Mono` font family for consistent monospace rendering.
4. Waits for all images to load, then triggers `window.print()` after a 100ms delay.
5. Page margins are set to 8mm with 2mm inter-label margins.

### Lazy Loading

`bwip-js` is loaded on first use via dynamic import with a named webpack chunk (`bwip-js`). The loaded module is cached in the service instance for subsequent calls.

---

## Hardware

### Supported Devices

| Type | Device | Connection | Notes |
|------|--------|------------|-------|
| Barcode scanner | Any USB keyboard-wedge scanner | USB | Emulates keyboard input; no driver needed |
| NFC reader | ACR122U (recommended) | USB via relay or WebHID | NTAG215 stickers recommended |
| NFC stickers | NTAG215 | -- | Pre-programmed with employee badge IDs |

### Barcode Scanner Requirements

- Must operate in keyboard-wedge mode (emulates keyboard input).
- Must send Enter key after scan (recommended) or pause 80ms+ to trigger auto-complete.
- Keystroke interval must be < 50ms between characters (standard for all commercial scanners).
- Minimum 4-character barcode values are processed; shorter values are ignored.

---

## Key Files

| File | Purpose |
|------|---------|
| `forge-ui/src/app/shared/services/scanner.service.ts` | Global keyboard-wedge scan detection |
| `forge-ui/src/app/shared/services/web-hid-rfid.service.ts` | NFC/RFID via WebSocket relay or WebHID |
| `forge-ui/src/app/shared/services/label-print.service.ts` | Barcode/QR generation and label printing |
| `forge-ui/src/app/shared/components/barcode-scan-input/barcode-scan-input.component.ts` | Focused scan input field (kiosk use) |
| `forge-ui/src/app/shared/components/qr-code/qr-code.component.ts` | QR code display wrapper |
| `forge-ui/src/app/shared/models/scan-event.model.ts` | `ScanEvent`, `ScanContext` types |
