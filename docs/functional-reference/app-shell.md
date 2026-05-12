# Application Shell

## Overview

The application shell is the persistent layout wrapper that surrounds every authenticated page in Forge. It provides navigation, global search, notifications, theme switching, real-time connection status, offline resilience indicators, and a loading overlay. The shell is conditionally rendered: it appears only when the user is authenticated and the current route is not a display route (shop floor kiosk, form render) or auth route (login, setup, SSO callback).

The shell is implemented across these primary components:

| Component | Selector | File |
|-----------|----------|------|
| `AppComponent` | `app-root` | `app.component.ts` / `.html` / `.scss` |
| `AppHeaderComponent` | `app-header` | `core/layout/app-header.component.ts` / `.html` / `.scss` |
| `SidebarComponent` | `app-sidebar` | `core/layout/sidebar.component.ts` / `.html` / `.scss` |
| `LoadingOverlayComponent` | `app-loading-overlay` | `shared/components/loading-overlay/` |
| `ConnectionBannerComponent` | `app-connection-banner` | `shared/components/connection-banner/` |
| `OfflineBannerComponent` | `app-offline-banner` | `shared/components/offline-banner/` |
| `ToastContainerComponent` | `app-toast-container` | `shared/components/toast/` |
| `KeyboardShortcutsHelpComponent` | `app-keyboard-shortcuts-help` | `shared/components/keyboard-shortcuts-help/` |

The `LayoutService` (`shared/services/layout.service.ts`) is the central service that manages sidebar state, mobile detection, route classification, and breadcrumb resolution.

---

## Layout Structure

The app shell uses a full-viewport flex column layout. The host element (`app-root`) fills `100vh` with `overflow: hidden`, preventing any document-level scroll.

```
+----------------------------------------------------------+
| Skip Link (hidden, visible on focus)                     |
+----------------------------------------------------------+
| Header (app-header) - fixed height, z-index: 100         |
+----------------------------------------------------------+
| Connection Banner (conditional)                          |
+----------------------------------------------------------+
| Onboarding Banner (conditional)                          |
+----------------------------------------------------------+
| +--------+---------------------------------------------+ |
| |Sidebar | Main Content Area (router-outlet)            | |
| |        |                                             | |
| |        | - flex: 1, overflow: hidden                  | |
| |        | - routed components fill available space     | |
| +--------+---------------------------------------------+ |
+----------------------------------------------------------+
| Offline Banner (bottom-center, conditional)              |
| Loading Overlay (full-screen, conditional)               |
| Toast Container (upper-right, stacked)                   |
| Keyboard Shortcuts Help (overlay, conditional)           |
+----------------------------------------------------------+
```

### Shell Visibility

The shell renders conditionally based on the `showShell` computed signal in `AppComponent`:

```typescript
protected readonly showShell = computed(() =>
  this.authService.isAuthenticated() &&
  !this.layout.isDisplayRoute() &&
  !this.layout.isAuthRoute()
);
```

When `showShell` is `false`, only a bare `<main>` with `<router-outlet>` renders (no header, no sidebar). This applies to:

- Login page (`/login`)
- Setup wizard (`/setup`, `/setup/:token`)
- SSO callback (`/sso/callback`)
- Shop floor display (`/display/shop-floor`)
- Form render pages (`/__render-form`)
- Mobile app routes (`/m`, `/m/*`)

### CSS Structure

| Selector | Purpose |
|----------|---------|
| `:host` (app-root) | `display: flex; flex-direction: column; height: 100vh; overflow: hidden` |
| `.app-body` | `display: flex; flex: 1; overflow: hidden; position: relative` - horizontal container for sidebar + main |
| `.app-main` | `flex: 1; overflow: hidden; display: flex; flex-direction: column` - content area |
| `.app-main > *:not(router-outlet)` | `flex: 1; min-height: 0` - routed components fill available space |

### Inert Attribute

When the global loading overlay is active, the `.app-body` div receives the `inert` attribute, which prevents all user interaction with the content beneath the overlay:

```html
<div class="app-body" [attr.inert]="isGlobalLoading() || null">
```

### Skip Link

The first focusable element in the DOM is a skip-to-content link for accessibility:

```html
<a class="skip-link" href="#main-content">Skip to content</a>
```

It is visually hidden off-screen by default and becomes visible on keyboard focus, positioned at the top-left with a primary-colored border.

---

## Sidebar

### Component

`SidebarComponent` at `core/layout/sidebar.component.ts`. Selector: `app-sidebar`.

### Navigation Structure

The sidebar organizes navigation items into four named groups plus a bottom section:

**Operations**
| Icon | Label | Route | Shortcut | Allowed Roles |
|------|-------|-------|----------|---------------|
| `dashboard` | Dashboard | `/dashboard` | Q then D | All |
| `view_kanban` | Board | `/kanban` | Q then K | Admin, Manager, Engineer, ProductionWorker |
| `inbox` | Backlog | `/backlog` | Q then B | Admin, Manager, PM, Engineer |
| `event_note` | Planning | `/planning` | -- | Admin, Manager, PM |
| `calendar_month` | Calendar | `/calendar` | -- | All |

**Sales**
| Icon | Label | Route | Allowed Roles |
|------|-------|-------|---------------|
| `people` | Customers | `/customers` | Admin, Manager, PM, OfficeManager |
| `people_outline` | Leads | `/leads` | Admin, Manager, PM |
| `request_quote` | Quotes | `/quotes` | Admin, Manager, PM, OfficeManager |
| `shopping_cart` | Sales Orders | `/sales-orders` | Admin, Manager, PM, OfficeManager |
| `outbox` | Shipments | `/shipments` | Admin, Manager, OfficeManager |
| `receipt` | Invoices | `/invoices` | Admin, Manager, OfficeManager |
| `payments` | Payments | `/payments` | Admin, Manager, OfficeManager |
| `assignment_return` | Customer Returns | `/customer-returns` | Admin, Manager, PM, OfficeManager |

**Supply**
| Icon | Label | Route | Shortcut | Allowed Roles |
|------|-------|-------|----------|---------------|
| `precision_manufacturing` | Parts | `/parts` | Q then P | Admin, Manager, Engineer, PM |
| `inventory_2` | Inventory | `/inventory` | Q then I | Admin, Manager, Engineer, OfficeManager |
| `batch_prediction` | Lots | `/lots` | -- | Admin, Manager, Engineer |
| `local_shipping` | Vendors | `/vendors` | -- | Admin, Manager, OfficeManager |
| `description` | Purchase Orders | `/purchase-orders` | -- | Admin, Manager, OfficeManager |
| `request_quote` | RFQs | `/purchasing` | -- | Admin, Manager, OfficeManager |
| `hub` | MRP | `/mrp` | -- | Admin, Manager |
| `event_note` | Scheduling | `/scheduling` | -- | Admin, Manager |
| `speed` | OEE | `/oee` | -- | Admin, Manager |

**Resources**
| Icon | Label | Route | Shortcut | Allowed Roles |
|------|-------|-------|----------|---------------|
| `build` | Assets | `/assets` | -- | Admin, Manager |
| `schedule` | Time | `/time-tracking` | Q then T | All |
| `badge` | Employees | `/employees` | -- | Admin, Manager |
| `receipt_long` | Expenses | `/expenses` | -- | Admin, Manager, Engineer, OfficeManager |
| `rule` | Approvals | `/approvals` | -- | Admin, Manager, PM, OfficeManager |
| `bar_chart` | Reports | `/reports` | Q then R | Admin, Manager, PM |
| `smart_toy` | AI | `/ai` | -- | All |
| `school` | Training | `/training/library` | -- | All |

**Bottom Section** (below spacer, separated by divider)
| Icon | Label | Route | Allowed Roles |
|------|-------|-------|---------------|
| `storefront` | Shop Floor | `/display/shop-floor` | Admin, Manager |
| `settings` | Admin | `/admin` | Admin, Manager, OfficeManager |

### Admin Sub-Navigation

When the current route starts with `/admin` and the sidebar is expanded, the Admin nav item expands to show its child routes inline as indented sub-items (class `nav-item--sub`, left padding `$sp-2xl`, height 30px, smaller icon `$icon-size-xs`). Children are filtered by the user's roles.

Admin children:
| Icon | Label | Route | Allowed Roles |
|------|-------|-------|---------------|
| `people` | Users | `/admin/users` | Admin |
| `route` | Track Types | `/admin/track-types` | Admin |
| `dataset` | Ref Data | `/admin/reference-data` | Admin |
| `translate` | Terminology | `/admin/terminology` | Admin |
| `settings` | Settings | `/admin/settings` | Admin |
| `hub` | Integrations | `/admin/integrations` | Admin |
| `smart_toy` | AI Assistants | `/admin/ai-assistants` | Admin |
| `groups` | Teams | `/admin/teams` | Admin |
| `percent` | Sales Tax | `/admin/sales-tax` | Admin |
| `manage_search` | Audit Log | `/admin/audit-log` | Admin |
| `edit_note` | Time Corrections | `/admin/time-corrections` | Admin, Manager |
| `event` | Events | `/admin/events` | Admin, Manager |
| `swap_horiz` | EDI | `/admin/edi` | Admin |
| `verified_user` | MFA Policy | `/admin/mfa` | Admin |
| `school` | Training | `/admin/training` | Admin, Manager |
| `fact_check` | Compliance | `/admin/compliance` | Admin, Manager, OfficeManager |

### Collapse Behavior

The sidebar has two states:

| State | Width | Content |
|-------|-------|---------|
| Collapsed | `$sidebar-width-collapsed` (52px) | Icons only, centered |
| Expanded | `$sidebar-width-expanded` (200px) | Icons + labels, left-aligned with `$sp-lg` padding |

The collapse state is toggled by the top toggle button (chevron icon) and persisted to `localStorage` under key `qbe-sidebar-collapsed`. Default state on first load is collapsed (`localStorage.getItem('qbe-sidebar-collapsed') !== 'false'`).

Transition: `width $transition-sidebar` (200ms ease).

When collapsed:
- Group section labels are hidden
- Nav item labels are hidden
- Keyboard shortcut hints (`kbd-hint`) are hidden
- Nav items are centered with icon only
- Badges move to absolute position (top-right of the icon, smaller size)

When expanded:
- Section labels (e.g., "Operations", "Sales") display as uppercase 9px labels
- Nav items show icon + label in a row with 8px gap
- Keyboard shortcut hints appear right-aligned in mono font
- Badges appear right-aligned with `margin-left: auto`

### Active State

Active navigation items use Angular's `routerLinkActive="nav-item--active"` directive. The active state applies:
- Text color: `var(--primary)`
- Background: `var(--primary-light)`
- Left border indicator: 3px solid `var(--primary)`, inset 6px from top and bottom

### Role-Based Filtering

Each `NavItem` can specify `allowedRoles: string[]`. Items without `allowedRoles` are visible to all authenticated users. The sidebar uses `AuthService.hasAnyRole()` to filter items. Groups with zero visible items after filtering are removed entirely.

### Mobile Behavior

On mobile (viewport width < 768px, detected via `LayoutService._isMobile`):

- The sidebar is hidden by default
- A hamburger button appears in the header to toggle it
- When open, the sidebar is positioned fixed, below the header, spanning the remaining viewport height, at z-index `$z-sidebar` (200)
- A backdrop (`mobile-sidebar-backdrop`) covers the rest of the screen at `$z-sidebar - 1` with `$backdrop-color` (rgba(0,0,0,0.3))
- Clicking the backdrop or any nav item calls `layout.closeMobileMenu()`
- The sidebar is always expanded (full-width with labels) when shown on mobile

### Sidebar Visibility

The sidebar is hidden entirely on:
- Display routes (`/display/*`, `/__render-form`, `/m/*`)
- Account routes (`/account/*`)
- Onboarding routes (`/onboarding/*`)

This is computed by `LayoutService.sidebarVisible`.

### i18n

All nav labels use `TranslatePipe` with i18n keys (e.g., `nav.dashboard`, `navGroups.operations`). The `title` attribute combines the translated label with the keyboard shortcut if present.

---

## Header

### Component

`AppHeaderComponent` at `core/layout/app-header.component.ts`. Selector: `app-header`.

### Dimensions and Styling

- Height: `var(--header-height)` (44px via `$header-height`)
- Background: `var(--header)` (a dark color from the theme)
- Text color: white
- Padding: `0 $sp-lg` (0 16px)
- Gap between items: `$sp-md` (8px)
- Z-index: `$z-sticky` (100)
- Flex-shrink: 0 (never compresses)

### Header Elements (Left to Right)

1. **Hamburger Button** (mobile only): Toggles mobile sidebar. Shows `menu` icon when closed, `close` when open.

2. **Logo/Brand Link**: Links to `/dashboard`. Shows either:
   - A custom brand logo image (`app-header__brand-logo`, 28px height) if `ThemeService.logoUrl` is set
   - The default text logo "QB:Eng" with the colon in accent color

3. **Separator**: A 1px x 20px vertical line at 15% white opacity. Hidden on tablet breakpoint.

4. **Breadcrumb**: Two-level breadcrumb navigation. Hidden on tablet breakpoint.
   - First link: "Home" linking to `/dashboard`
   - Separator: `chevron_right` icon (14px)
   - Second link: Current page label (bold, full opacity), derived from the route by `LayoutService.routeToLabel()`
   - Style: uppercase, 11px, 0.5px letter spacing, white text

5. **Global Search**: Described in detail in the Global Search section below. Hidden during onboarding routes.

6. **Action Buttons** (right-aligned via `margin-left: auto`): Hidden during onboarding routes (except theme toggle).
   - **Chat** (`chat_bubble_outline`): Toggles the chat side panel. Shows unread badge.
   - **AI Assistant** (`smart_toy`): Toggles the AI help panel. Only visible when AI service is available.
   - **Training** (`school`): Toggles the training context panel. Has `icon-btn--active` state.
   - **Notifications** (`notifications_none`): Toggles the notification panel. Shows unread count badge.
   - **Theme Toggle** (`dark_mode` / `light_mode`): Toggles between light and dark themes.
   - **User Menu**: User name + menu icon button. See User Menu section.

### Action Button Styling

Icon buttons in the header are 30x30px with 18px icons. On hover, they get a subtle white background (8% opacity). Active state (`icon-btn--active`) uses 15% white background and accent-light text color.

### Badge

Unread count badges on chat and notification buttons are positioned absolute (top-right), with accent background, white text, 8px font, 14px minimum width/height, 0px border-radius (sharp corners matching the design system).

### Breadcrumb Label Resolution

`LayoutService.routeToLabel()` maps the first URL segment to a human-readable label via a static lookup table:

| Segment | Label |
|---------|-------|
| `dashboard` | Dashboard |
| `kanban` | Kanban Board |
| `backlog` | Backlog |
| `planning` | Planning |
| `calendar` | Calendar |
| `parts` | Parts Catalog |
| `inventory` | Inventory |
| `customers` | Customers |
| `vendors` | Vendors |
| `quotes` | Quotes |
| `sales-orders` | Sales Orders |
| `purchase-orders` | Purchase Orders |
| `shipments` | Shipments |
| `invoices` | Invoices |
| `payments` | Payments |
| `leads` | Leads |
| `expenses` | Expenses |
| `assets` | Assets |
| `time-tracking` | Time Tracking |
| `quality` | Quality |
| `reports` | Reports |
| `admin` | Admin |
| `account` | Account |
| `ai` | AI Assistants |
| `chat` | Chat |
| `notifications` | Notifications |

Unknown segments are title-cased with hyphens replaced by spaces.

---

## User Menu

The user menu is a dropdown anchored to the top-right of the header. It opens on click of the user trigger button and closes on backdrop click or menu item selection.

### Trigger Button

Displays the user's full name in `Last, First` format (hidden on tablet) and a `menu`/`close` icon. Styled with a thin white border, semi-transparent background, and hover effect.

### Menu Structure

The dropdown is 260px wide, positioned below the trigger with an 8px gap, at z-index `$z-dropdown` (300). It has a surface background, thin border, and `$shadow-dropdown`.

1. **User Header**: Avatar circle (36px, user's avatar color, initials) + name, email, and roles (comma-separated, uppercase, muted).

2. **Divider**

3. **Account Settings**: Icon `manage_accounts`. Navigates to `/account`. Closes menu.

4. **About**: Icon `info`. Opens the About dialog (see below). Closes menu.

5. **Divider**

6. **Language Selector**: Shows a `translate` icon and label, with a row of language buttons below. The active language button is highlighted with primary color background. Languages come from `LanguageService.availableLanguages`. Clicking a language calls `languageService.setLanguage()`.

7. **Divider**

8. **Sign Out**: Icon `logout`. Red danger styling (`user-menu__item--danger`). Calls `authService.logout()` and navigates to `/login`. The logout flow checks for unsaved drafts via `DraftRecoveryService.checkBeforeLogout()` (registered as a before-logout callback in `AppComponent.ngOnInit`).

### About Dialog

Opens as an `<app-dialog>` with title "About Forge" at 420px width. Contains:

- Application logo text "QB:Eng" in heading size with primary color
- Tagline: "Manufacturing Operations Platform" (uppercase, muted)
- Metadata table:
  - **Your build**: Git commit SHA from `VersionService.local()`, or "dev" for development builds
  - **Latest on main**: Latest SHA from `VersionService`, with "up to date" (green check) or "update available" (yellow update icon) badge
  - **License**: GNU General Public License v3.0
  - **Stack**: Angular 21, .NET 9, PostgreSQL
- Description paragraph about the project

---

## Theme System

### Service

`ThemeService` at `shared/services/theme.service.ts`. Singleton (`providedIn: 'root'`).

### Light/Dark Mode

Two theme modes: `'light'` and `'dark'`. The active theme is applied by setting a `data-theme` attribute on the `<html>` element:

```typescript
document.documentElement.setAttribute('data-theme', theme);
```

CSS custom properties are defined in `styles.scss` under `[data-theme='light']` and `[data-theme='dark']` selectors. All component styles reference these properties (e.g., `var(--bg)`, `var(--text)`, `var(--surface)`).

### Persistence

- **localStorage key**: `qbe-theme` (value: `'light'` or `'dark'`)
- On construction, the service reads the saved theme and applies it immediately
- On toggle, it saves to localStorage and broadcasts to other tabs

### Cross-Tab Sync

Theme changes are broadcast to other tabs via `BroadcastService`. The service exposes `registerBroadcastCallback()` which `BroadcastService` uses to push theme changes without re-broadcasting (preventing infinite loops). The method `applyThemeFromBroadcast()` applies the theme without triggering another broadcast.

### Brand Colors

The theme supports admin-configurable brand colors for `--primary` and `--accent`. These are:

1. Cached in localStorage under key `qbe-brand-colors` (JSON object with `primary` and `accent` strings)
2. Loaded from the API via `loadBrandSettings()` which calls `GET /api/v1/admin/brand`
3. Applied directly to `document.documentElement.style` as CSS custom property overrides

Brand settings also include:
- **App name**: Updates `document.title` and the `appName` signal
- **Logo**: If the brand has a logo, `logoUrl` signal is set to the API endpoint with a cache-busting timestamp

### Font Scale

Four font scale options: `'default'`, `'comfortable'`, `'large'`, `'xl'`. Applied via `data-font-size` attribute on `<html>`. Persisted to localStorage under `qbe-font-scale`.

### CSS Custom Properties

The full set of theme-aware custom properties:

| Property | Purpose |
|----------|---------|
| `--primary` | Primary brand color |
| `--primary-light` | Light tint of primary |
| `--primary-dark` | Dark shade of primary |
| `--header` | Header background color |
| `--accent` | Accent/highlight color |
| `--accent-light` | Light tint of accent |
| `--success` / `--success-light` | Success states |
| `--info` / `--info-light` | Info states |
| `--warning` / `--warning-light` | Warning states |
| `--error` / `--error-light` | Error/danger states |
| `--bg` | Page background |
| `--surface` | Card/panel background |
| `--border` | Border color |
| `--text` | Primary text |
| `--text-secondary` | Secondary text |
| `--text-muted` | Muted/label text |

---

## Global Search

### Location

The search bar is positioned in the header between the breadcrumb and the action buttons. It takes `flex: 1` to fill available horizontal space. It is hidden on tablet breakpoints and during onboarding routes.

### Visual Design

- Container: `var(--bg)` background, 2px border (transparent by default, `var(--primary)` when focused)
- Search icon (`search`, 16px, muted) on the left
- Input field: transparent background, 11px font, `var(--text)` color
- Keyboard hint: `Ctrl+K` badge on the right side, mono font, 10px, semi-transparent background

### Keyboard Shortcut

`Ctrl+K` (or `Cmd+K` on Mac) focuses the search input. Handled by a `@HostListener('document:keydown')` on `AppHeaderComponent`:

```typescript
@HostListener('document:keydown', ['$event'])
onKeydown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    document.querySelector<HTMLInputElement>('.search-input')?.focus();
  }
}
```

### Search Behavior

Two parallel search pipelines run on input:

**1. Standard Search (300ms debounce)**
- Minimum 2 characters
- Calls `SearchService.search(term)` which hits `GET /api/v1/search?q={term}&limit=20`
- Returns `SearchResult[]` with `entityType`, `entityId`, `title`, `subtitle`, `icon`, `url`
- Results appear in the left column of the dropdown

**2. AI/RAG Search (600ms debounce)**
- Minimum 2 characters
- Only runs when `AiService.available()` is true (Ollama AI container is running)
- Calls `AiService.ragSearch(term)` for vector-similarity search
- Returns `RagSearchResult[]` with `entityType`, `entityId`, `chunkText`, `sourceField`, `score`
- Also returns a `generatedAnswer` string (AI-generated natural language answer)
- Results filtered to exclude `Documentation` entity type (internal docs)
- Results appear in the right column of the dropdown

### Results Dropdown

The results dropdown (`search-results`) appears below the search bar, spanning its full width.

**Single-column layout** (standard search only): When AI is not available, results show in a single scrollable list.

**Two-column layout** (`search-results--two-col`): When AI is available, the dropdown uses a CSS grid with two equal columns:
- Left column: Standard search results with "Results" header
- Right column: AI results with "AI Results" header, subtle accent-tinted background

Each standard result row shows:
- Entity type icon (18px, muted)
- Title (bold, truncated) and subtitle (10px, secondary color)
- Entity type label (9px uppercase, muted)

Each AI result row shows the same layout plus a relevance score percentage in mono font with primary color.

If the AI returns a generated answer, it appears at the top of the AI column in an accent-tinted box with a `lightbulb` icon.

Empty states show centered muted text: "No matches found" or "Type to search with AI".

### Result Navigation

Clicking a standard result calls `navigateToResult()`, which:
1. Closes mobile menu
2. Hides results
3. Clears the search input
4. Maps the entity type to a detail dialog type string
5. Navigates to the result URL with `?detail={type}:{id}` query parameter for dialog-based entities

Clicking an AI result calls `navigateToRagResult()`, which navigates to the entity's list page with the detail query parameter.

### Entity Type to Route Mapping

| Entity Type | List Route | Detail Type |
|-------------|-----------|-------------|
| job | /kanban | job |
| part | /parts | part |
| customer | /customers | customer |
| lead | /leads | lead |
| asset | /assets | asset |
| expense | /expenses | -- |
| vendor | /vendors | vendor |
| salesorder | /sales-orders | sales-order |
| purchaseorder | /purchase-orders | purchase-order |
| quote | /quotes | quote |
| shipment | /shipments | shipment |
| invoice | /invoices | invoice |
| payment | /payments | payment |
| lot | /quality | lot |

### Entity Type Icons

| Entity Type | Icon |
|-------------|------|
| job | `work` |
| part | `inventory_2` |
| customer | `person` |
| lead | `handshake` |
| asset | `precision_manufacturing` |
| expense | `receipt_long` |
| vendor | `store` |
| salesorder | `shopping_cart` |
| purchaseorder | `receipt` |
| quote | `request_quote` |
| shipment | `local_shipping` |
| invoice | `description` |
| payment | `payments` |
| lot | `science` |

### Focus/Blur Behavior

- On focus: re-shows cached results if any exist
- On blur: hides results after a 200ms delay (to allow click events on results to fire)

---

## Loading Overlay

### Service

`LoadingService` at `shared/services/loading.service.ts`. Singleton.

### Cause Queue

The service maintains a signal-based array of `LoadingCause` objects, each with a unique `key` and `message` string. Multiple concurrent loading operations stack their messages. The overlay is visible whenever the causes array is non-empty.

### API

| Method | Signature | Description |
|--------|-----------|-------------|
| `track` | `track<T>(message: string, source: Observable<T>): Observable<T>` | Wraps an Observable, auto-starts/stops loading |
| `trackPromise` | `trackPromise<T>(message: string, promise: Promise<T>): Promise<T>` | Wraps a Promise, auto-starts/stops loading |
| `start` | `start(key: string, message: string): void` | Manually start a loading cause |
| `stop` | `stop(key: string): void` | Remove a loading cause by key |
| `clear` | `clear(): void` | Remove all causes |

### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `isLoading` | `boolean` | True when any causes are active |
| `message` | `string` | Message from the most recently added cause |
| `causes` | `readonly LoadingCause[]` | Full cause queue |

### Route Loading

`RouteLoadingService` (`shared/services/route-loading.service.ts`) automatically shows the loading overlay during route transitions. It is initialized in `AppComponent.ngOnInit()`. It uses the key `'route-navigation'` and message `'Loading...'`. A minimum display time of 400ms prevents flash-of-overlay for fast transitions.

### Visual Presentation

The `LoadingOverlayComponent` renders:
- A full-screen overlay (`loading-overlay`)
- A centered SVG spinner with track and animated arc circles
- A stacked message area below the spinner

Messages animate in (slide from below) and out (slide left or right, alternating). The component tracks `DisplayCause` objects with `state: 'entering' | 'visible' | 'exiting'` and `exitDirection: 'left' | 'right'`. Exit animations last 400ms before the cause is removed from the display list.

### ARIA

The overlay has `role="alert"` and `aria-live="assertive"` for screen reader announcements.

---

## Connection Banner

### Component

`ConnectionBannerComponent` at `shared/components/connection-banner/connection-banner.component.ts`. Selector: `app-connection-banner`.

### Position

Renders directly after `<app-header>` in the app shell, before the main content area.

### SignalR States

The banner reflects the aggregate SignalR connection state from `SignalrService.connectionState`:

| State | Visual | Message |
|-------|--------|---------|
| `connected` | Hidden | -- |
| `reconnecting` | Yellow/warning bar | "Reconnecting..." |
| `disconnected` | Red/error bar (`connection-banner--disconnected`) | "Connection lost" |

### Debounce and Grace Period

To prevent flashing the banner on brief network blips:

- **Startup grace**: The banner does not show for the first 10 seconds after the component initializes (`STARTUP_GRACE_MS = 10_000`).
- **Debounce**: When the connection drops, the banner only appears after 5 seconds of continuous disconnection (`DEBOUNCE_MS = 5_000`). If the connection recovers within 5 seconds, no banner is shown.
- **First connection**: The banner only shows after the SignalR service has successfully connected at least once (`signalr.hasEverConnected()`). This prevents a banner during initial connection establishment.

### Dismissal

The banner has a close button. Dismissing hides it until the next state change. When the connection recovers (`connected`), the dismissed state resets so the banner will reappear if the connection drops again.

### Template

```html
<div class="connection-banner" [class.connection-banner--disconnected]="state() === 'disconnected'">
  <span class="material-icons-outlined connection-banner__icon">wifi_off</span>
  <span class="connection-banner__message">{{ message() }}</span>
  <button class="connection-banner__dismiss" (click)="dismiss()" aria-label="Dismiss connection banner">
    <span class="material-icons-outlined">close</span>
  </button>
</div>
```

---

## Offline Banner

### Component

`OfflineBannerComponent` at `shared/components/offline-banner/offline-banner.component.ts`. Selector: `app-offline-banner`.

### Position

Renders at the bottom-center of the viewport, outside the shell flow (fixed/absolute positioning via CSS).

### States

| State | Icon | Message | Styling Class |
|-------|------|---------|---------------|
| `hidden` | -- | -- | Not rendered |
| `offline` | `cloud_off` | "Connection lost. Changes will sync when reconnected." (with pending count if > 0) | `offline-banner--offline` |
| `syncing` | `sync` (spinning) | "Syncing N changes..." | `offline-banner--syncing` |
| `synced` | `cloud_done` | "All changes synced" | `offline-banner--synced` |

### Detection

- Online/offline status is detected via `navigator.onLine` and `window.addEventListener('online'/'offline')`
- Pending change count and sync state come from `OfflineQueueService`
- The "synced" message auto-dismisses after 3 seconds

### Pending Count Badge

When offline with pending queued operations, a badge shows the count of pending items.

### ARIA

The banner has `role="status"` and `aria-live="polite"` for non-intrusive screen reader updates.

---

## Route Structure

### Top-Level Routes

All feature routes are lazy-loaded via `loadChildren` or `loadComponent`. The routing structure:

**Unguarded Routes** (no auth required):
| Path | Component/Module | Guards |
|------|-----------------|--------|
| `/login` | `LoginComponent` | `setupCompleteGuard` (redirects to setup if no users exist) |
| `/sso/callback` | `SsoCallbackComponent` (lazy) | None |
| `/setup` | `SetupComponent` | `setupRequiredGuard` (only accessible when setup needed) |
| `/setup/:token` | `TokenSetupComponent` | None |
| `/display/shop-floor` | Shop floor routes (lazy) | None |
| `/__render-form` | Render routes (lazy) | None |
| `/dev-tools` | Dev tools routes (lazy) | None |

**Authenticated Routes** (guarded by `authGuard` + `mobileRedirectGuard`):
| Path | Module | Additional Role Guard |
|------|--------|-----------------------|
| `/dashboard` | Dashboard | -- |
| `/kanban` | Kanban | -- |
| `/backlog` | Backlog | -- |
| `/calendar` | Calendar | -- |
| `/parts` | Parts | Admin, Manager, Engineer, PM |
| `/inventory` | Inventory | Admin, Manager, Engineer, OfficeManager |
| `/customers` | Customers | Admin, Manager, PM, OfficeManager |
| `/leads` | Leads | Admin, Manager, PM |
| `/expenses` | Expenses | -- |
| `/assets` | Assets | Admin, Manager |
| `/time-tracking` | Time Tracking | -- |
| `/employees` | Employees | Admin, Manager |
| `/reports` | Reports | Admin, Manager, PM |
| `/planning` | Planning | Admin, Manager, PM |
| `/vendors` | Vendors | Admin, Manager, OfficeManager |
| `/purchasing` | Purchasing (RFQs) | Admin, Manager, OfficeManager |
| `/purchase-orders` | Purchase Orders | Admin, Manager, OfficeManager |
| `/sales-orders` | Sales Orders | Admin, Manager, PM, OfficeManager |
| `/quotes` | Quotes | Admin, Manager, PM, OfficeManager |
| `/shipments` | Shipments | Admin, Manager, OfficeManager |
| `/invoices` | Invoices | Admin, Manager, OfficeManager |
| `/payments` | Payments | Admin, Manager, OfficeManager |
| `/notifications` | Notifications | -- |
| `/worker` | Worker | -- |
| `/approvals` | Approvals | Admin, Manager, PM, OfficeManager |
| `/quality` | Quality | Admin, Manager, Engineer |
| `/customer-returns` | Customer Returns | Admin, Manager, PM, OfficeManager |
| `/lots` | Lots | Admin, Manager, Engineer |
| `/account` | Account | -- |
| `/onboarding` | Onboarding | -- |
| `/training` | Training | -- |
| `/ai` | AI | -- |
| `/mrp` | MRP | Admin, Manager |
| `/oee` | OEE | Admin, Manager |
| `/scheduling` | Scheduling | Admin, Manager |
| `/chat` | Chat | -- |
| `/admin` | Admin | Admin, Manager, OfficeManager |

**Mobile Routes** (guarded by `authGuard`, no mobile redirect):
| Path | Module |
|------|--------|
| `/m` | Mobile routes (lazy) |

### Guards

| Guard | Location | Purpose |
|-------|----------|---------|
| `authGuard` | `shared/guards/auth.guard.ts` | Checks `AuthService.isAuthenticated()`, redirects to `/login` if not |
| `mobileRedirectGuard` | `shared/guards/mobile-redirect.guard.ts` | Redirects phone-like devices to `/m` routes automatically |
| `setupCompleteGuard` | `shared/guards/setup.guard.ts` | Prevents accessing `/login` if initial setup has not been completed (no admin user exists) |
| `setupRequiredGuard` | `shared/guards/setup.guard.ts` | Only allows `/setup` when setup is actually needed |
| `roleGuard(roles...)` | `shared/guards/role.guard.ts` | Factory function returning a guard that checks if the user has any of the specified roles |

### Default Route

The default route (`/`) redirects to `/dashboard`. For mobile devices, `mobileRedirectGuard` intercepts and redirects to `/m` instead.

---

## Keyboard Shortcuts

### Service

`KeyboardShortcutsService` at `shared/services/keyboard-shortcuts.service.ts`. Initialized in `AppComponent.ngOnInit()`.

### Chord Sequences

Navigation shortcuts use a two-key chord sequence: press `Q` first, then the target key within 1500ms. The `chordActive` signal is true while waiting for the second key. If no second key is pressed within the timeout, the chord is cancelled.

Chord detection is skipped when focus is in an `<input>`, `<textarea>`, `<select>`, or content-editable element.

### Registered Shortcuts

**Navigation (chord: Q then ...)**
| Second Key | Action |
|-----------|--------|
| D | Go to Dashboard (`/dashboard`) |
| K | Go to Kanban (`/kanban`) |
| B | Go to Backlog (`/backlog`) |
| P | Go to Parts (`/parts`) |
| I | Go to Inventory (`/inventory`) |
| R | Go to Reports (`/reports`) |
| T | Go to Time Tracking (`/time-tracking`) |

**General**
| Key | Action |
|-----|--------|
| `/` | Toggle keyboard shortcuts help panel |
| `Escape` | Close keyboard shortcuts help panel |
| `Ctrl+K` | Focus global search (handled by `AppHeaderComponent`, not this service) |

### Help Panel

The `KeyboardShortcutsHelpComponent` displays all registered shortcuts grouped by `context` (e.g., "Navigation", "General"). Each shortcut shows:
- For chord shortcuts: two key badges separated by "then"
- For modifier shortcuts: key badges joined by "+"

The help panel is toggled by pressing `/` or via `KeyboardShortcutsService.toggleHelp()`.

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Variable | Value | Behavior |
|-----------|----------|-------|----------|
| Mobile | `$breakpoint-mobile` | 768px | Hamburger menu, full-width sidebar overlay, hide breadcrumb/search/user name |
| Tablet | `$breakpoint-tablet` | 1024px | Hide breadcrumb, search bar, user name in header |
| Desktop | `$breakpoint-desktop` | 1200px | Full layout |
| Wide | `$breakpoint-wide` | 1400px | Content max-width cap (except kanban/shop floor) |

### Mobile (< 768px)

- Header: hamburger button visible, breadcrumb hidden, search hidden, user name hidden
- Sidebar: fixed overlay with backdrop, always expanded when shown, closes on nav click
- Action buttons: tighter gap (`$sp-xxs`)
- Mobile device detection (`LayoutService.isMobileDevice()`) triggers redirect to `/m` routes via `mobileRedirectGuard`

### Tablet (< 1024px)

- Elements with class `hide-tablet` are hidden (breadcrumb, header separator, search bar, user trigger name)
- Action button gap reduces to `$sp-xxs`

### Resize Handling

`LayoutService` listens for `window.resize` events (outside Angular zone for performance) and updates `_isMobile` only when crossing the 768px threshold. When transitioning from mobile to desktop, the mobile menu is automatically closed.

---

## App Initialization

When the app loads, `AppComponent` orchestrates initialization in its constructor and `ngOnInit`:

### Constructor (reactive effects)

1. **Auth state effect**: When authenticated:
   - Connects NotificationHub and ChatHub
   - Loads notifications, user preferences, accounting config, employee profile
   - Starts the barcode/NFC scanner
   - Runs draft recovery (post-login)
   
   When not authenticated:
   - Stops all SignalR connections
   - Stops scanner (unless on display route)
   - Redirects to `/login` (unless on auth/display route)

2. **Sync conflict effect**: Watches `OfflineQueueService.conflict()` and opens `SyncConflictDialogComponent` when a 409 conflict occurs

### ngOnInit

1. Initializes `RouteLoadingService` (automatic route transition overlay)
2. Initializes `BroadcastService` (cross-tab auth/theme sync)
3. Initializes `DraftBroadcastService` (cross-tab draft sync)
4. Initializes `LanguageService`
5. Registers before-logout callback for draft warning
6. Loads brand settings (custom colors, logo, app name)
7. Registers all help tours (kanban, dashboard, parts, inventory, expenses, time tracking, reports, admin, planning)
8. Initializes keyboard shortcuts
9. Starts watching URL for `?tutorial=` and `?walkthrough=` query parameters to resume training walkthroughs

### ngOnDestroy

1. Stops all SignalR connections
2. Destroys keyboard shortcuts listener
3. Stops barcode/NFC scanner
4. Cancels draft TTL check timer

---

## Panels and Overlays

Several slide-out panels are managed by the header component:

| Panel | Selector | Trigger | Position |
|-------|----------|---------|----------|
| Notification Panel | `app-notification-panel` | Bell icon click | Right side, below header, with backdrop |
| Chat Panel | `app-chat` | Chat icon click, via `#chatPanel` template ref | Side panel |
| AI Help Panel | `app-ai-help-panel` | AI icon click, via `#aiHelpPanel` template ref | Side panel, receives current route |
| Training Context Panel | `app-training-context-panel` | Training icon click | Side panel, receives current route and open state |

The notification panel uses a full-screen backdrop (`notification-backdrop`, z-index `$z-dropdown - 1`) that closes the panel on click.
