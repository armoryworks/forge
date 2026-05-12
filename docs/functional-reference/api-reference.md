# Forge API Reference

Comprehensive reference for all REST API endpoints exposed by the Forge backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Request/Response Format](#requestresponse-format)
5. [Pagination](#pagination)
6. [Error Format](#error-format)
7. [Rate Limiting](#rate-limiting)
8. [Endpoint Directory](#endpoint-directory)
   - [Auth and Identity](#auth-and-identity)
   - [Dashboard and Search](#dashboard-and-search)
   - [Jobs and Kanban](#jobs-and-kanban)
   - [Parts](#parts)
   - [Inventory](#inventory)
   - [Customers, Contacts, and Addresses](#customers-contacts-and-addresses)
   - [Leads](#leads)
   - [Estimates](#estimates)
   - [Quotes](#quotes)
   - [Sales Orders](#sales-orders)
   - [Purchase Orders](#purchase-orders)
   - [Vendors](#vendors)
   - [Shipments](#shipments)
   - [Invoices](#invoices)
   - [Payments](#payments)
   - [Expenses](#expenses)
   - [Time Tracking](#time-tracking)
   - [Quality](#quality)
   - [SPC (Statistical Process Control)](#spc-statistical-process-control)
   - [NCR and CAPA](#ncr-and-capa)
   - [FMEA](#fmea)
   - [PPAP](#ppap)
   - [Assets and Maintenance](#assets-and-maintenance)
   - [Planning Cycles](#planning-cycles)
   - [Files and Storage](#files-and-storage)
   - [Chat](#chat)
   - [AI](#ai)
   - [AI Assistants](#ai-assistants)
   - [Training](#training)
   - [Notifications](#notifications)
   - [Events](#events)
   - [Compliance Forms](#compliance-forms)
   - [Identity Documents](#identity-documents)
   - [Payroll](#payroll)
   - [Employee Profile](#employee-profile)
   - [Employees](#employees)
   - [Onboarding](#onboarding)
   - [Admin](#admin)
   - [Users](#users)
   - [Reference Data](#reference-data)
   - [Company Locations](#company-locations)
   - [Terminology](#terminology)
   - [User Preferences](#user-preferences)
   - [Scheduled Tasks](#scheduled-tasks)
   - [EDI](#edi)
   - [Report Builder](#report-builder)
   - [Canned Reports](#canned-reports)
   - [Status Tracking](#status-tracking)
   - [Customer Returns](#customer-returns)
   - [Lots](#lots)
   - [Scheduling](#scheduling)
   - [MRP](#mrp)
   - [Sales Tax](#sales-tax)
   - [Price Lists](#price-lists)
   - [Pricing](#pricing)
   - [Recurring Orders](#recurring-orders)
   - [Accounting](#accounting)
   - [Barcodes](#barcodes)
   - [Shop Floor](#shop-floor)
   - [Andon](#andon)
   - [Approvals](#approvals)
   - [Projects](#projects)
   - [Work Centers](#work-centers)
   - [Shifts](#shifts)
   - [Plants](#plants)
   - [Currencies and Exchange Rates](#currencies-and-exchange-rates)
   - [CPQ (Configure-Price-Quote)](#cpq-configure-price-quote)
   - [Consignment Agreements](#consignment-agreements)
   - [Inter-Plant Transfers](#inter-plant-transfers)
   - [Pick Waves](#pick-waves)
   - [ABC Classification](#abc-classification)
   - [Back-to-Back and Drop Ship Orders](#back-to-back-and-drop-ship-orders)
   - [Controlled Documents](#controlled-documents)
   - [COPQ Reports](#copq-reports)
   - [Sankey Reports](#sankey-reports)
   - [Predictive Maintenance](#predictive-maintenance)
   - [Machine Connections (IoT)](#machine-connections-iot)
   - [E-Commerce](#e-commerce)
   - [BI API Keys](#bi-api-keys)
   - [Webhooks](#webhooks)
   - [User Integrations](#user-integrations)
   - [Reviews](#reviews)
   - [Serials](#serials)
   - [Replenishment](#replenishment)
   - [Subcontracting](#subcontracting)
   - [Leave Management](#leave-management)
   - [Languages and Translations](#languages-and-translations)
   - [Purchasing / RFQs](#purchasing--rfqs)
   - [Shop Floor Machine (IoT)](#shop-floor-machine-iot)
   - [Downloads](#downloads)
   - [Entity Activity](#entity-activity)
   - [Address Validation](#address-validation)
   - [Track Types](#track-types)

---

## Overview

The Forge API is a RESTful JSON API built on ASP.NET Core 9. All endpoints are prefixed with `/api/v1/`. The API uses MediatR (CQRS pattern) internally -- controllers are thin dispatchers to command/query handlers.

---

## Authentication

### JWT Bearer Tokens

All endpoints require authentication unless marked `[AllowAnonymous]`. Tokens are passed via the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

### Obtaining a Token

**POST** `/api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1,
  "email": "user@example.com",
  "roles": ["Admin"],
  "requiresMfa": false
}
```

If `requiresMfa` is `true`, the client must complete the MFA challenge flow (see MFA endpoints below) before the token is fully authorized.

### Refresh Flow

**POST** `/api/v1/auth/refresh` (requires valid JWT)

Returns a new `LoginResponse` with a fresh token. The old token's JTI is used to issue the replacement.

### Token Lifetime

- Access tokens: short-lived (configured in `appsettings.json` under `Jwt:TokenLifetimeMinutes`)
- On 401: the Angular `authInterceptor` attempts a silent refresh, queuing concurrent requests during the refresh cycle

### Alternative Auth Methods

| Method | Endpoint | Use Case |
|--------|----------|----------|
| Kiosk login | `POST /api/v1/auth/kiosk-login` | Barcode + PIN |
| NFC login | `POST /api/v1/auth/nfc-login` | NFC tag + PIN |
| Scan login | `POST /api/v1/auth/scan-login` | Unified scan identifier (RFID/NFC/barcode) + PIN |
| SSO login | `GET /api/v1/auth/sso/{provider}/login` | Google, Microsoft, OIDC redirect |

---

## Base URL

All endpoints are prefixed:

```
/api/v1/
```

Example: `GET /api/v1/jobs`, `POST /api/v1/auth/login`

---

## Request/Response Format

| Aspect | Convention |
|--------|-----------|
| Content-Type | `application/json` |
| Property naming | camelCase |
| Dates | ISO 8601 UTC (`DateTimeOffset` serialized as `2026-04-16T14:30:00Z`) |
| Enums | Serialized as strings (`JsonStringEnumConverter`) |
| Null handling | Null fields included in response; omit optional fields in requests |

---

## Pagination

### Offset-Based (Standard Lists)

Query parameters:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number (1-based) |
| `pageSize` | `25` | Items per page (max 100) |
| `sort` | varies | Sort field |
| `order` | `desc` | Sort direction (`asc` or `desc`) |

Response shape:

```json
{
  "data": [...],
  "page": 1,
  "pageSize": 25,
  "totalCount": 142,
  "totalPages": 6
}
```

### Cursor-Based (Real-Time Feeds)

Used for chat messages, activity logs, notifications.

Query parameters: `cursor` (opaque string), `limit` (default 50).

---

## Error Format

All errors follow **Problem Details (RFC 7807)**:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 400,
  "detail": "The 'Title' field is required.",
  "traceId": "00-abc123-def456-00"
}
```

### Common Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST (with `Location` header) |
| `204` | No Content | Successful DELETE or action with no body |
| `400` | Bad Request | Validation failure |
| `401` | Unauthorized | Missing or expired token |
| `403` | Forbidden | Insufficient role |
| `404` | Not Found | Entity not found (`KeyNotFoundException`) |
| `409` | Conflict | Business rule violation |
| `500` | Server Error | Unhandled exception |

### Global Exception Middleware

- `KeyNotFoundException` --> 404
- `ValidationException` (FluentValidation) --> 400
- Business exceptions --> 409
- All others --> 500 with Serilog structured log

---

## Rate Limiting

The API uses ASP.NET Core's built-in rate limiting middleware with three strategies:

| Strategy | Description |
|----------|-------------|
| Fixed window | N requests per time window |
| Sliding window | Rolling window rate limit |
| Token bucket | Burst-friendly with sustained rate |

Loopback IPs (`127.0.0.1`, `::1`) bypass rate limiting for E2E test throughput.

Rate limit exceeded returns `429 Too Many Requests`.

---

## Endpoint Directory

Legend for all tables below:

- **Auth**: Yes = requires JWT; No = `[AllowAnonymous]`
- **Roles**: Comma-separated roles required (empty = any authenticated user)

---

### Auth and Identity

**Controller:** `AuthController`
**Base path:** `/api/v1/auth`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/login` | No | -- | Authenticate with email/password. Returns JWT. |
| GET | `/me` | Yes | -- | Get current authenticated user details |
| GET | `/status` | No | -- | Check if initial setup is complete |
| POST | `/setup` | No | -- | Initial system setup (create admin + company) |
| GET | `/validate-token/{token}` | No | -- | Validate an employee setup token |
| POST | `/complete-setup` | No | -- | Complete employee account setup via token |
| POST | `/set-pin` | Yes | -- | Set kiosk PIN for current user |
| POST | `/kiosk-login` | No | -- | Barcode/employee ID + PIN login |
| POST | `/nfc-login` | No | -- | NFC tag + PIN login |
| POST | `/scan-login` | No | -- | Unified scan identifier + PIN login |
| PUT | `/profile` | Yes | -- | Update current user profile |
| POST | `/logout` | Yes | -- | Invalidate current token |
| POST | `/refresh` | Yes | -- | Refresh JWT token |
| POST | `/change-password` | Yes | -- | Change current user password |
| GET | `/sso/providers` | No | -- | List available SSO providers |
| GET | `/sso/{provider}/login` | No | -- | Initiate SSO OAuth flow |
| GET | `/sso/{provider}/callback` | No | -- | SSO OAuth callback handler |
| POST | `/sso/link` | Yes | -- | Link SSO identity to current account |
| DELETE | `/sso/unlink/{provider}` | Yes | -- | Unlink SSO identity |
| GET | `/sso/linked` | Yes | -- | List linked SSO providers |
| POST | `/mfa/setup` | Yes | -- | Begin TOTP MFA setup (returns QR code) |
| POST | `/mfa/verify-setup` | Yes | -- | Verify TOTP code to complete MFA setup |
| DELETE | `/mfa/disable` | Yes | -- | Disable MFA for current user |
| DELETE | `/mfa/devices/{deviceId}` | Yes | -- | Remove a specific MFA device |
| GET | `/mfa/status` | Yes | -- | Get MFA enrollment status |
| POST | `/mfa/challenge` | No | -- | Create MFA challenge for login |
| POST | `/mfa/validate` | No | -- | Validate MFA code during login |
| POST | `/mfa/recovery` | No | -- | Use recovery code for MFA login |
| POST | `/mfa/recovery-codes` | Yes | -- | Generate new recovery codes |

---

### Dashboard and Search

**Controller:** `DashboardController`
**Base path:** `/api/v1/dashboard`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get dashboard aggregate data |
| GET | `/open-orders` | Yes | -- | Get open orders summary |
| GET | `/margin-summary` | Yes | -- | Get margin summary KPIs |
| GET | `/layout` | Yes | -- | Get default dashboard layout |

**Controller:** `SearchController`
**Base path:** `/api/v1/search`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/?q={term}&limit=20` | Yes | -- | Full-text search across 6 entity types |

---

### Jobs and Kanban

**Controller:** `JobsController`
**Base path:** `/api/v1/jobs`
**Default roles:** Admin, Manager, PM, Engineer, ProductionWorker, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List jobs. Filters: `trackTypeId`, `stageId`, `assigneeId`, `isArchived`, `search`, `customerId` |
| GET | `/calendar.ics` | Yes | Default | Export jobs as iCalendar file |
| GET | `/{id}` | Yes | Default | Get job detail |
| POST | `/` | Yes | Default | Create job |
| PUT | `/{id}` | Yes | Default | Update job |
| PATCH | `/{id}/stage` | Yes | Default | Move job to different stage |
| PATCH | `/{id}/position` | Yes | Default | Update job sort position within stage |
| GET | `/{id}/activity` | Yes | Default | Get job activity log |
| POST | `/{id}/comments` | Yes | Default | Add comment to job |
| GET | `/{id}/subtasks` | Yes | Default | List job subtasks |
| POST | `/{id}/subtasks` | Yes | Default | Create subtask |
| PATCH | `/{id}/subtasks/{subtaskId}` | Yes | Default | Update subtask |
| GET | `/{id}/links` | Yes | Default | List linked jobs |
| POST | `/{id}/links` | Yes | Default | Create job link |
| DELETE | `/{id}/links/{linkId}` | Yes | Default | Delete job link |
| GET | `/{id}/parts` | Yes | Default | List parts assigned to job |
| POST | `/{id}/parts` | Yes | Default | Add part to job |
| PATCH | `/{id}/parts/{jobPartId}` | Yes | Default | Update job part |
| DELETE | `/{id}/parts/{jobPartId}` | Yes | Default | Remove part from job |
| GET | `/{id}/custom-fields` | Yes | Default | Get custom field values |
| PUT | `/{id}/custom-fields` | Yes | Default | Update custom field values |
| GET | `/{id}/production-runs` | Yes | Default | List production runs |
| POST | `/{id}/production-runs` | Yes | Default | Create production run |
| PUT | `/{id}/production-runs/{runId}` | Yes | Default | Update production run |
| DELETE | `/{id}/production-runs/{runId}` | Yes | Default | Delete production run |
| PATCH | `/bulk/stage` | Yes | Default | Bulk move jobs to stage |
| PATCH | `/bulk/assign` | Yes | Default | Bulk assign jobs |
| PATCH | `/bulk/priority` | Yes | Default | Bulk update priority |
| POST | `/bulk/archive` | Yes | Default | Bulk archive jobs |

**Controller:** `KanbanCardsController`
**Base path:** `/api/v1/kanban`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/board/{trackTypeId}` | Yes | -- | Get kanban board data for track type |

**Controller:** `TrackTypesController`
**Base path:** `/api/v1/track-types`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List all track types |
| GET | `/{id}` | Yes | -- | Get track type with stages |

---

### Parts

**Controller:** `PartsController`
**Base path:** `/api/v1/parts`
**Default roles:** Admin, Manager, Engineer, ProductionWorker, PM, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List parts. Filters: `status`, `type`, `search` |
| GET | `/{id}` | Yes | Default | Get part detail |
| POST | `/` | Yes | Default | Create part |
| PATCH | `/{id}` | Yes | Default | Update part |
| DELETE | `/{id}` | Yes | Default | Soft-delete part |
| POST | `/{id}/bom` | Yes | Default | Add BOM entry |
| PATCH | `/{id}/bom/{bomEntryId}` | Yes | Default | Update BOM entry |
| DELETE | `/{id}/bom/{bomEntryId}` | Yes | Default | Delete BOM entry |
| GET | `/{id}/revisions` | Yes | Default | List part revisions |
| POST | `/{id}/revisions` | Yes | Default | Create part revision |
| GET | `/{id}/operations` | Yes | Default | List routing operations |
| POST | `/{id}/operations` | Yes | Default | Create operation |
| PATCH | `/{id}/operations/{operationId}` | Yes | Default | Update operation |
| DELETE | `/{id}/operations/{operationId}` | Yes | Default | Delete operation |
| POST | `/{id}/operations/{operationId}/materials` | Yes | Default | Add operation material |
| DELETE | `/{id}/operations/{operationId}/materials/{materialId}` | Yes | Default | Remove operation material |
| GET | `/{id}/operations/{operationId}/activity` | Yes | Default | Get operation activity log |
| POST | `/{id}/operations/{operationId}/activity` | Yes | Default | Add operation comment |
| POST | `/{id}/link-accounting-item` | Yes | Default | Link part to accounting item |
| DELETE | `/{id}/link-accounting-item` | Yes | Default | Unlink from accounting item |
| GET | `/thumbnails?partIds=1,2,3` | Yes | Default | Get 3D thumbnails for parts |
| GET | `/{id}/activity` | Yes | Default | Get part activity log |
| GET | `/{id}/prices` | Yes | Default | Get part price history |
| POST | `/{id}/prices` | Yes | Default | Add part price entry |
| GET | `/{id}/alternates` | Yes | Default | List alternate parts |
| POST | `/{id}/alternates` | Yes | Default | Create alternate part link |
| PATCH | `/{id}/alternates/{alternateId}` | Yes | Default | Update alternate |
| DELETE | `/{id}/alternates/{alternateId}` | Yes | Default | Remove alternate |

---

### Inventory

**Controller:** `InventoryController`
**Base path:** `/api/v1/inventory`
**Default roles:** Admin, Manager, OfficeManager, Engineer, ProductionWorker

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/locations` | Yes | Default | Get location tree |
| GET | `/locations/bins` | Yes | Default | Get flat bin locations |
| POST | `/locations` | Yes | Default | Create storage location |
| DELETE | `/locations/{id}` | Yes | Default | Delete storage location |
| GET | `/locations/{locationId}/contents` | Yes | Default | Get bin contents |
| POST | `/bin-contents` | Yes | Default | Place content in bin |
| DELETE | `/bin-contents/{id}` | Yes | Default | Remove bin content |
| GET | `/parts` | Yes | Default | Get inventory per part. Filter: `search` |
| GET | `/movements` | Yes | Default | Get movement history. Filters: `locationId`, `entityType`, `entityId`, `take` |
| GET | `/low-stock` | Yes | Default | Get low stock alerts |
| POST | `/receive` | Yes | Default | Receive goods (PO receiving) |
| GET | `/receiving-history` | Yes | Default | Get receiving history |
| POST | `/transfer` | Yes | Default | Transfer stock between locations |
| POST | `/adjust` | Yes | Admin, Manager | Adjust stock quantity |
| GET | `/cycle-counts` | Yes | Default | List cycle counts |
| POST | `/cycle-counts` | Yes | Default | Create cycle count |
| PUT | `/cycle-counts/{id}` | Yes | Admin, Manager | Update/close cycle count |
| GET | `/reservations` | Yes | Default | List reservations |
| POST | `/reservations` | Yes | Default | Create inventory reservation |
| DELETE | `/reservations/{id}` | Yes | Default | Release reservation |
| GET | `/pending-inspection` | Yes | Default | Get items pending inspection |
| POST | `/inspect/{receivingRecordId}` | Yes | Default | Record inspection result |
| POST | `/inspect/{receivingRecordId}/waive` | Yes | Admin, Manager | Waive inspection |
| GET | `/uom` | Yes | Default | List units of measure |
| POST | `/uom` | Yes | Admin, Manager | Create UoM |
| PUT | `/uom/{id}` | Yes | Admin, Manager | Update UoM |
| GET | `/uom/conversions` | Yes | Default | List UoM conversions |
| POST | `/uom/conversions` | Yes | Admin, Manager | Create UoM conversion |
| GET | `/uom/convert` | Yes | Default | Convert quantity between UoMs |
| GET | `/atp/{partId}` | Yes | Default | Get available-to-promise |
| GET | `/atp/{partId}/timeline` | Yes | Default | Get ATP timeline projection |

---

### Customers, Contacts, and Addresses

**Controller:** `CustomersController`
**Base path:** `/api/v1/customers`
**Default roles:** Admin, Manager, OfficeManager, PM, Engineer

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List customers. Filters: `search`, `isActive` |
| GET | `/dropdown` | Yes | Default | Lightweight dropdown list |
| GET | `/{id}` | Yes | Default | Get customer detail |
| POST | `/` | Yes | Default | Create customer |
| PUT | `/{id}` | Yes | Default | Update customer |
| DELETE | `/{id}` | Yes | Default | Soft-delete customer |
| POST | `/{id}/contacts` | Yes | Default | Create contact |
| PUT | `/{id}/contacts/{contactId}` | Yes | Default | Update contact |
| DELETE | `/{id}/contacts/{contactId}` | Yes | Default | Delete contact |
| GET | `/{id}/interactions` | Yes | Default | List contact interactions. Filter: `contactId` |
| POST | `/{id}/interactions` | Yes | Default | Create interaction |
| PATCH | `/{id}/interactions/{interactionId}` | Yes | Default | Update interaction |
| DELETE | `/{id}/interactions/{interactionId}` | Yes | Default | Delete interaction |
| GET | `/{id}/activity` | Yes | Default | Get customer activity log |
| GET | `/{id}/statement` | Yes | Default | Generate customer statement PDF |
| GET | `/{id}/summary` | Yes | Default | Get customer summary stats |
| GET | `/{id}/credit-status` | Yes | Default | Get credit status |
| POST | `/{id}/credit-hold` | Yes | Default | Place customer on credit hold |
| POST | `/{id}/credit-release` | Yes | Default | Release credit hold |
| GET | `/credit-risk-report` | Yes | Default | Get all customers' credit risk |

**Controller:** `CustomerAddressesController`
**Base path:** `/api/v1/customers/{customerId}/addresses`
**Default roles:** Admin, Manager, OfficeManager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List addresses for customer |
| POST | `/` | Yes | Default | Create address |
| PUT | `/{id}` | Yes | Default | Update address |
| DELETE | `/{id}` | Yes | Default | Delete address |

---

### Leads

**Controller:** `LeadsController`
**Base path:** `/api/v1/leads`
**Default roles:** Admin, Manager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List leads. Filters: `status`, `search` |
| GET | `/{id}` | Yes | Default | Get lead detail |
| POST | `/` | Yes | Default | Create lead |
| PATCH | `/{id}` | Yes | Default | Update lead |
| POST | `/{id}/convert` | Yes | Default | Convert lead to customer (optionally create job) |
| DELETE | `/{id}` | Yes | Default | Soft-delete lead |
| GET | `/{id}/activity` | Yes | Default | Get lead activity log |

---

### Estimates

**Controller:** `EstimatesController`
**Base path:** `/api/v1/estimates`
**Default roles:** Admin, Manager, OfficeManager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List estimates. Filters: `customerId`, `status` |
| GET | `/{id}` | Yes | Default | Get estimate detail |
| POST | `/` | Yes | Default | Create estimate |
| PUT | `/{id}` | Yes | Default | Update estimate |
| DELETE | `/{id}` | Yes | Default | Soft-delete estimate |
| POST | `/{id}/convert` | Yes | Default | Convert estimate to quote |

---

### Quotes

**Controller:** `QuotesController`
**Base path:** `/api/v1/quotes`
**Default roles:** Admin, Manager, OfficeManager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List quotes. Filters: `customerId`, `status` |
| GET | `/{id}` | Yes | Default | Get quote detail with lines |
| POST | `/` | Yes | Default | Create quote with lines |
| PUT | `/{id}` | Yes | Default | Update quote header |
| POST | `/{id}/send` | Yes | Default | Mark quote as sent |
| POST | `/{id}/accept` | Yes | Default | Accept quote |
| POST | `/{id}/reject` | Yes | Default | Reject/decline quote |
| POST | `/{id}/convert` | Yes | Default | Convert quote to sales order |
| DELETE | `/{id}` | Yes | Default | Soft-delete quote |

---

### Sales Orders

**Controller:** `SalesOrdersController`
**Base path:** `/api/v1/orders`
**Default roles:** Admin, Manager, OfficeManager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List sales orders. Filters: `customerId`, `status` |
| GET | `/{id}` | Yes | Default | Get sales order detail with lines |
| POST | `/` | Yes | Default | Create sales order |
| PUT | `/{id}` | Yes | Default | Update sales order header |
| POST | `/{id}/confirm` | Yes | Default | Confirm sales order |
| POST | `/{id}/cancel` | Yes | Default | Cancel sales order |
| DELETE | `/{id}` | Yes | Default | Soft-delete sales order |

---

### Purchase Orders

**Controller:** `PurchaseOrdersController`
**Base path:** `/api/v1/purchase-orders`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List POs. Filters: `vendorId`, `jobId`, `status` |
| GET | `/{id}` | Yes | Default | Get PO detail with lines |
| POST | `/` | Yes | Default | Create PO |
| PUT | `/{id}` | Yes | Default | Update PO header |
| POST | `/{id}/submit` | Yes | Default | Submit PO to vendor |
| POST | `/{id}/acknowledge` | Yes | Default | Vendor acknowledges PO |
| POST | `/{id}/receive` | Yes | Default | Receive items against PO |
| POST | `/{id}/cancel` | Yes | Default | Cancel PO |
| POST | `/{id}/close` | Yes | Default | Close PO |
| GET | `/calendar` | Yes | Default | Get POs for calendar view |
| DELETE | `/{id}` | Yes | Default | Soft-delete PO |
| GET | `/{id}/releases` | Yes | Default | List blanket PO releases |
| POST | `/{id}/releases` | Yes | Default | Create blanket PO release |
| PATCH | `/{id}/releases/{releaseNum}` | Yes | Default | Update release |

---

### Vendors

**Controller:** `VendorsController`
**Base path:** `/api/v1/vendors`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List vendors. Filters: `search`, `isActive` |
| GET | `/dropdown` | Yes | Default | Lightweight dropdown list |
| GET | `/{id}` | Yes | Default | Get vendor detail |
| POST | `/` | Yes | Default | Create vendor |
| PUT | `/{id}` | Yes | Default | Update vendor |
| DELETE | `/{id}` | Yes | Default | Soft-delete vendor |
| GET | `/{id}/scorecard` | Yes | Default | Get vendor scorecard. Filters: `dateFrom`, `dateTo` |
| GET | `/performance-report` | Yes | Default | Get vendor performance comparison |

---

### Shipments

**Controller:** `ShipmentsController`
**Base path:** `/api/v1/shipments`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List shipments. Filters: `salesOrderId`, `status` |
| GET | `/{id}` | Yes | Default | Get shipment detail |
| POST | `/` | Yes | Default | Create shipment with lines |
| PUT | `/{id}` | Yes | Default | Update shipment header |
| POST | `/{id}/ship` | Yes | Default | Mark shipment as shipped |
| POST | `/{id}/deliver` | Yes | Default | Mark shipment as delivered |
| GET | `/{id}/packing-slip` | Yes | Default | Generate packing slip PDF |
| GET | `/{id}/bill-of-lading` | Yes | Default | Generate bill of lading PDF |
| POST | `/{id}/rates` | Yes | Default | Get shipping rates from carriers |
| POST | `/{id}/label` | Yes | Default | Create shipping label |
| GET | `/{id}/tracking` | Yes | Default | Get shipment tracking info |
| POST | `/validate-address` | Yes | Default | Validate shipping address |
| GET | `/{id}/packages` | Yes | Default | List shipment packages |
| POST | `/{id}/packages` | Yes | Default | Add package to shipment |
| PATCH | `/{id}/packages/{packageId}` | Yes | Default | Update package |
| DELETE | `/{id}/packages/{packageId}` | Yes | Default | Remove package |

---

### Invoices

**Controller:** `InvoicesController`
**Base path:** `/api/v1/invoices`
**Default roles:** Admin, Manager, OfficeManager

> Accounting boundary: Full CRUD in standalone mode. Read-only when accounting provider connected.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List invoices. Filters: `customerId`, `status` |
| GET | `/{id}` | Yes | Default | Get invoice detail |
| POST | `/` | Yes | Default | Create invoice with lines |
| POST | `/{id}/send` | Yes | Default | Mark invoice as sent |
| POST | `/{id}/email` | Yes | Default | Email invoice to recipient |
| POST | `/{id}/void` | Yes | Default | Void invoice |
| GET | `/{id}/pdf` | Yes | Default | Generate invoice PDF |
| DELETE | `/{id}` | Yes | Default | Soft-delete invoice |
| GET | `/uninvoiced-jobs` | Yes | Default | List jobs ready for invoicing |
| POST | `/from-job/{jobId}` | Yes | Default | Create invoice from completed job |
| GET | `/queue-settings` | Yes | Default | Get invoice queue settings |
| PUT | `/queue-settings` | Yes | Admin | Update invoice queue settings |

---

### Payments

**Controller:** `PaymentsController`
**Base path:** `/api/v1/payments`
**Default roles:** Admin, Manager, OfficeManager

> Accounting boundary: Full CRUD in standalone mode. Read-only when accounting provider connected.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List payments. Filter: `customerId` |
| GET | `/{id}` | Yes | Default | Get payment detail with applications |
| POST | `/` | Yes | Default | Record payment with invoice applications |
| DELETE | `/{id}` | Yes | Default | Soft-delete payment |

---

### Expenses

**Controller:** `ExpensesController`
**Base path:** `/api/v1/expenses`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List expenses. Filters: `userId`, `status`, `search` |
| POST | `/` | Yes | -- | Create expense |
| PATCH | `/{id}/status` | Yes | -- | Update expense status (approve/reject) |
| DELETE | `/{id}` | Yes | -- | Soft-delete expense |
| GET | `/{id}/activity` | Yes | -- | Get expense activity log |
| GET | `/settings` | Yes | Admin, Manager | Get expense settings |
| PUT | `/settings` | Yes | Admin | Update expense settings |
| GET | `/recurring` | Yes | -- | List recurring expenses |
| POST | `/recurring` | Yes | -- | Create recurring expense |
| PATCH | `/recurring/{id}` | Yes | -- | Update recurring expense |
| DELETE | `/recurring/{id}` | Yes | -- | Delete recurring expense |
| GET | `/upcoming` | Yes | -- | Get upcoming expenses (from recurring) |

---

### Time Tracking

**Controller:** `TimeTrackingController`
**Base path:** `/api/v1/time-tracking`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/entries` | Yes | -- | List time entries. Filters: `userId`, `jobId`, `from`, `to` |
| POST | `/entries` | Yes | -- | Create manual time entry |
| PATCH | `/entries/{id}` | Yes | -- | Update time entry |
| DELETE | `/entries/{id}` | Yes | -- | Delete time entry |
| POST | `/timer/start` | Yes | -- | Start timer |
| POST | `/timer/stop` | Yes | -- | Stop timer |
| GET | `/clock-status` | Yes | -- | Get current user clock-in status |
| GET | `/clock-events` | Yes | -- | List clock events. Filters: `userId`, `from`, `to` |
| POST | `/clock-events` | Yes | -- | Create clock event |
| GET | `/pay-period` | Yes | -- | Get current pay period info |
| PUT | `/pay-period/settings` | Yes | Admin | Update pay period settings |
| POST | `/lock-period` | Yes | Admin, Manager | Lock pay period |
| PATCH | `/entries/{id}/correct` | Yes | Admin, Manager | Admin time correction with audit trail |
| GET | `/corrections` | Yes | Admin, Manager | List time corrections |
| GET | `/overtime/{userId}` | Yes | Admin, Manager | Get overtime breakdown for user/week |
| GET | `/overtime-rules` | Yes | Admin, Manager | List overtime rules |
| POST | `/overtime-rules` | Yes | Admin | Create overtime rule |

---

### Quality

**Controller:** `QualityController`
**Base path:** `/api/v1/quality`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/templates` | Yes | -- | List QC templates |
| POST | `/templates` | Yes | Admin, Manager | Create QC template |
| GET | `/inspections` | Yes | -- | List inspections. Filters: `jobId`, `status`, `lotNumber` |
| POST | `/inspections` | Yes | -- | Create inspection |
| PUT | `/inspections/{id}` | Yes | -- | Update inspection |
| GET | `/ecos` | Yes | Admin, Manager, Engineer | List ECOs. Filter: `status` |
| GET | `/ecos/{id}` | Yes | Admin, Manager, Engineer | Get ECO detail |
| POST | `/ecos` | Yes | Admin, Manager, Engineer | Create ECO |
| PATCH | `/ecos/{id}` | Yes | Admin, Manager, Engineer | Update ECO |
| POST | `/ecos/{id}/approve` | Yes | Admin, Manager | Approve ECO |
| POST | `/ecos/{id}/implement` | Yes | Admin, Manager, Engineer | Implement ECO |
| POST | `/ecos/{id}/affected-items` | Yes | Admin, Manager, Engineer | Add affected item to ECO |
| DELETE | `/ecos/{id}/affected-items/{itemId}` | Yes | Admin, Manager, Engineer | Remove affected item |
| GET | `/gages` | Yes | -- | List gages. Filters: `status`, `search` |
| GET | `/gages/{id}` | Yes | -- | Get gage detail |
| POST | `/gages` | Yes | Admin, Manager | Create gage |
| PATCH | `/gages/{id}` | Yes | Admin, Manager | Update gage |
| GET | `/gages/due` | Yes | -- | Get gages due for calibration |
| GET | `/gages/{id}/calibrations` | Yes | -- | Get gage calibration history |
| POST | `/gages/{id}/calibrations` | Yes | Admin, Manager | Record calibration |

---

### SPC (Statistical Process Control)

**Controller:** `SpcController`
**Base path:** `/api/v1/spc`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/characteristics` | Yes | -- | List SPC characteristics. Filters: `partId`, `operationId`, `isActive` |
| POST | `/characteristics` | Yes | Admin, Manager | Create SPC characteristic |
| GET | `/characteristics/{id}` | Yes | -- | Get characteristic detail |
| PUT | `/characteristics/{id}` | Yes | Admin, Manager | Update characteristic |
| GET | `/characteristics/{id}/chart` | Yes | -- | Get control chart data |
| POST | `/measurements` | Yes | -- | Record SPC measurements |
| GET | `/measurements` | Yes | -- | List measurements. Filters: `characteristicId`, `dateFrom`, `dateTo`, `jobId` |
| POST | `/characteristics/{id}/recalculate-limits` | Yes | Admin, Manager | Recalculate control limits |
| GET | `/capability/{characteristicId}` | Yes | -- | Get process capability (Cp/Cpk) |
| GET | `/out-of-control` | Yes | -- | List OOC events. Filters: `status`, `severity`, `characteristicId` |
| POST | `/out-of-control/{id}/acknowledge` | Yes | -- | Acknowledge OOC event |
| POST | `/out-of-control/{id}/create-capa` | Yes | Admin, Manager | Create CAPA from OOC event |

---

### NCR and CAPA

**Controller:** `NcrCapaController`
**Base path:** `/api/v1/quality`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/ncrs` | Yes | -- | List NCRs. Filters: `type`, `status`, `partId`, `jobId`, `vendorId`, `customerId`, `dateFrom`, `dateTo` |
| POST | `/ncrs` | Yes | -- | Create NCR |
| GET | `/ncrs/{id}` | Yes | -- | Get NCR detail |
| PATCH | `/ncrs/{id}` | Yes | -- | Update NCR |
| POST | `/ncrs/{id}/disposition` | Yes | Admin, Manager | Disposition NCR |
| POST | `/ncrs/{id}/create-capa` | Yes | Admin, Manager | Create CAPA from NCR |
| GET | `/capas` | Yes | -- | List CAPAs. Filters: `status`, `type`, `ownerId`, `priority`, `dueDateFrom`, `dueDateTo` |
| POST | `/capas` | Yes | Admin, Manager | Create CAPA |
| GET | `/capas/{id}` | Yes | -- | Get CAPA detail |
| PATCH | `/capas/{id}` | Yes | Admin, Manager | Update CAPA |
| POST | `/capas/{id}/advance` | Yes | Admin, Manager | Advance CAPA to next phase |
| GET | `/capas/{id}/tasks` | Yes | -- | List CAPA tasks |
| POST | `/capas/{id}/tasks` | Yes | Admin, Manager | Create CAPA task |
| PATCH | `/capas/{id}/tasks/{taskId}` | Yes | -- | Update CAPA task |

---

### FMEA

**Controller:** `FmeaController`
**Base path:** `/api/v1/fmeas`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List FMEAs. Filters: `type`, `partId`, `status` |
| GET | `/{id}` | Yes | -- | Get FMEA detail with items |
| POST | `/` | Yes | Admin, Manager, Engineer | Create FMEA |
| PUT | `/{id}` | Yes | Admin, Manager, Engineer | Update FMEA header |
| POST | `/{id}/items` | Yes | Admin, Manager, Engineer | Add FMEA item (failure mode) |
| PUT | `/{id}/items/{itemId}` | Yes | Admin, Manager, Engineer | Update FMEA item |
| DELETE | `/{id}/items/{itemId}` | Yes | Admin, Manager, Engineer | Delete FMEA item |
| POST | `/{id}/items/{itemId}/action` | Yes | Admin, Manager, Engineer | Record action taken on item |
| POST | `/{id}/items/{itemId}/link-capa` | Yes | Admin, Manager, Engineer | Link FMEA item to CAPA |
| GET | `/high-rpn?threshold=200` | Yes | -- | List items above RPN threshold |
| GET | `/{id}/risk-summary` | Yes | -- | Get FMEA risk summary stats |

---

### PPAP

**Controller:** `PpapController`
**Base path:** `/api/v1/ppap-submissions`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List PPAP submissions. Filters: `partId`, `customerId`, `status` |
| GET | `/{id}` | Yes | -- | Get PPAP submission detail |
| POST | `/` | Yes | Admin, Manager, Engineer | Create PPAP submission |
| PUT | `/{id}` | Yes | Admin, Manager, Engineer | Update submission |
| PUT | `/{id}/elements/{number}` | Yes | Admin, Manager, Engineer | Update specific element |
| POST | `/{id}/submit` | Yes | Admin, Manager, Engineer | Submit for customer review |
| POST | `/{id}/response` | Yes | Admin, Manager | Record customer response |
| POST | `/{id}/psw/sign` | Yes | Admin, Manager, Engineer | Sign Part Submission Warrant |
| GET | `/api/v1/ppap/level-requirements/{level}` | Yes | -- | Get element requirements for PPAP level |

---

### Assets and Maintenance

**Controller:** `AssetsController`
**Base path:** `/api/v1/assets`
**Default roles:** Admin, Manager, Engineer

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List assets. Filters: `type`, `status`, `search` |
| POST | `/` | Yes | Default | Create asset |
| PATCH | `/{id}` | Yes | Default | Update asset |
| DELETE | `/{id}` | Yes | Default | Soft-delete asset |
| GET | `/{id}/activity` | Yes | Default | Get asset activity log |
| GET | `/{id}/maintenance/logs` | Yes | Default | Get maintenance log entries |
| GET | `/{id}/maintenance` | Yes | Default | Get maintenance schedules for asset |
| GET | `/maintenance` | Yes | Default | Get all maintenance schedules |
| POST | `/{id}/maintenance` | Yes | Default | Create maintenance schedule |
| POST | `/maintenance/{scheduleId}/log` | Yes | Default | Log maintenance performed |
| DELETE | `/maintenance/{scheduleId}` | Yes | Default | Delete maintenance schedule |
| PATCH | `/{id}/hours` | Yes | Default | Update machine hours |
| GET | `/{id}/downtime` | Yes | Default | Get asset downtime logs |
| GET | `/downtime` | Yes | Default | Get all downtime logs |
| POST | `/{id}/downtime` | Yes | Default | Create downtime log |
| PATCH | `/downtime/{id}/end` | Yes | Default | End downtime event |
| POST | `/maintenance/{scheduleId}/create-job` | Yes | Default | Create maintenance job from schedule |

---

### Planning Cycles

**Controller:** `PlanningCyclesController`
**Base path:** `/api/v1/planning-cycles`
**Default roles:** Admin, Manager, PM, Engineer, ProductionWorker

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List planning cycles |
| GET | `/current` | Yes | Default | Get current active cycle |
| GET | `/{id}` | Yes | Default | Get cycle detail with entries |
| POST | `/` | Yes | Default | Create planning cycle |
| PUT | `/{id}` | Yes | Default | Update cycle |
| POST | `/{id}/activate` | Yes | Default | Activate cycle |
| POST | `/{id}/complete` | Yes | Default | Complete cycle (optional rollover) |
| POST | `/{id}/entries` | Yes | Default | Commit job to cycle |
| DELETE | `/{id}/entries/{jobId}` | Yes | Default | Remove job from cycle |
| PUT | `/{id}/entries/order` | Yes | Default | Reorder entries |
| POST | `/{id}/entries/{jobId}/complete` | Yes | Default | Mark entry complete |

---

### Files and Storage

**Controller:** `FilesController`
**Base path:** `/api/v1`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/{entityType}/{entityId}/files` | Yes | -- | List files for entity |
| POST | `/{entityType}/{entityId}/files` | Yes | -- | Upload file (multipart) |
| POST | `/{entityType}/{entityId}/files/chunked` | Yes | -- | Upload file chunk (resumable) |
| GET | `/files/{id}/download` | Yes | -- | Download file |
| GET | `/parts/{partId}/revisions/{revisionId}/files` | Yes | -- | Get files by part revision |
| DELETE | `/files/{id}` | Yes | -- | Soft-delete file |

**Controller:** `StorageController`
**Base path:** `/api/v1/storage`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/{bucket}/{key}?token=` | No | -- | Serve file via presigned token (local storage only) |

---

### Chat

**Controller:** `ChatController`
**Base path:** `/api/v1/chat`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/conversations` | Yes | -- | List DM conversations |
| GET | `/messages/{otherUserId}` | Yes | -- | Get messages with user. Params: `page`, `pageSize` |
| POST | `/messages` | Yes | -- | Send DM |
| POST | `/messages/{otherUserId}/read` | Yes | -- | Mark messages as read |
| GET | `/rooms` | Yes | -- | List chat rooms |
| POST | `/rooms` | Yes | -- | Create chat room |
| GET | `/rooms/{roomId}/messages` | Yes | -- | Get room messages |
| POST | `/rooms/{roomId}/messages` | Yes | -- | Send room message |
| POST | `/rooms/{roomId}/members/{userId}` | Yes | -- | Add room member |
| DELETE | `/rooms/{roomId}/members/{userId}` | Yes | -- | Remove room member |

---

### AI

**Controller:** `AiController`
**Base path:** `/api/v1/ai`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/status` | Yes | -- | Check Ollama availability |
| POST | `/generate` | Yes | -- | Generate text via AI |
| POST | `/summarize` | Yes | -- | Summarize text |
| POST | `/search-suggest` | Yes | -- | AI-powered search suggestions |
| POST | `/help` | Yes | -- | AI help chat (sync) |
| POST | `/help/stream` | Yes | -- | AI help chat (SSE streaming) |
| POST | `/search` | Yes | -- | RAG search across documents |
| POST | `/index` | Yes | -- | Index document for RAG |
| POST | `/bulk-index` | Yes | -- | Bulk index documents |
| POST | `/assistants/{assistantId}/chat` | Yes | -- | Chat with configured AI assistant |

---

### AI Assistants

**Controller:** `AiAssistantsController`
**Base path:** `/api/v1/ai-assistants`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List active AI assistants |
| GET | `/all` | Yes | Admin | List all assistants (including inactive) |
| GET | `/{id}` | Yes | -- | Get assistant detail |
| POST | `/` | Yes | Admin | Create AI assistant |
| PUT | `/{id}` | Yes | Admin | Update AI assistant |
| DELETE | `/{id}` | Yes | Admin | Delete AI assistant |

---

### Training

**Controller:** `TrainingController`
**Base path:** `/api/v1/training`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/modules` | Yes | -- | List modules. Filters: `search`, `contentType`, `tag`, `includeUnpublished`, `page`, `pageSize` |
| GET | `/modules/by-route?route=` | Yes | -- | Get modules for a specific app route |
| GET | `/modules/{id}` | Yes | -- | Get module detail |
| POST | `/modules` | Yes | Admin | Create module |
| PUT | `/modules/{id}` | Yes | Admin | Update module |
| DELETE | `/modules/{id}` | Yes | Admin | Delete module |
| POST | `/modules/{id}/generate-walkthrough` | Yes | Admin | Auto-generate driver.js walkthrough via AI |
| GET | `/paths` | Yes | -- | List training paths |
| GET | `/paths/{id}` | Yes | -- | Get path detail |
| POST | `/enrollments` | Yes | Admin | Enroll user in path |
| GET | `/my-enrollments` | Yes | -- | Get current user enrollments |
| GET | `/my-progress` | Yes | -- | Get current user progress |
| POST | `/progress/{moduleId}/start` | Yes | -- | Record module start |
| POST | `/progress/{moduleId}/heartbeat` | Yes | -- | Record progress heartbeat |
| POST | `/progress/{moduleId}/complete` | Yes | -- | Mark module complete |
| POST | `/progress/{moduleId}/submit-quiz` | Yes | -- | Submit quiz answers |
| GET | `/admin/progress-summary` | Yes | Admin, Manager | Get all users' progress summary |
| GET | `/admin/users/{userId}/detail` | Yes | Admin, Manager | Get user training detail |

---

### Notifications

**Controller:** `NotificationsController`
**Base path:** `/api/v1/notifications`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get all notifications (wrapped in `{ data: [...] }`) |
| PATCH | `/{id}` | Yes | -- | Update notification (read, pin, dismiss) |
| POST | `/mark-all-read` | Yes | -- | Mark all notifications as read |
| POST | `/dismiss-all` | Yes | -- | Dismiss all notifications |

---

### Events

**Controller:** `EventsController`
**Base path:** `/api/v1/events`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List events. Filters: `from`, `to`, `eventType` |
| GET | `/{id}` | Yes | -- | Get event detail |
| POST | `/` | Yes | Admin, Manager | Create event |
| PUT | `/{id}` | Yes | Admin, Manager | Update event |
| DELETE | `/{id}` | Yes | Admin, Manager | Delete event |
| POST | `/{id}/respond` | Yes | -- | RSVP to event |
| GET | `/upcoming` | Yes | -- | Get upcoming events for current user |
| GET | `/upcoming/{userId}` | Yes | Admin, Manager | Get upcoming events for specific user |

---

### Compliance Forms

**Controller:** `ComplianceFormsController`
**Base path:** `/api/v1/compliance-forms`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List templates. Filter: `includeInactive` |
| GET | `/{id}` | Yes | Admin | Get template detail |
| POST | `/` | Yes | Admin | Create template |
| PUT | `/{id}` | Yes | Admin | Update template |
| DELETE | `/{id}` | Yes | Admin | Delete template |
| POST | `/{id}/upload` | Yes | Admin | Attach PDF document to template |
| POST | `/{id}/blank-pdf-template` | Yes | Admin | Set blank PDF template |
| PUT | `/{id}/form-definition` | Yes | Admin | Update form definition JSON |
| POST | `/{id}/extract-definition` | Yes | Admin | Extract form definition from PDF |
| POST | `/{id}/extract-raw` | Yes | Admin | Diagnostic: raw pdf.js extraction |
| POST | `/{id}/compare-visual` | Yes | Admin | Visual comparison of render vs PDF |
| GET | `/versions/{versionId}/comparison` | Yes | Admin | Get comparison result |
| POST | `/{id}/sync` | Yes | Admin | Sync template from source |
| POST | `/sync-all` | Yes | Admin | Sync all templates |
| GET | `/my-state-definition` | Yes | -- | Get state-specific form definition |
| GET | `/submissions/me` | Yes | -- | Get current user submissions |
| GET | `/submissions/me/{formType}` | Yes | -- | Get submission by form type |
| PUT | `/{id}/form-data` | Yes | -- | Save form data (draft) |
| POST | `/{id}/submit-form` | Yes | -- | Submit completed form |
| POST | `/{id}/submit` | Yes | -- | Create submission (DocuSeal) |
| POST | `/webhook` | No | -- | DocuSeal webhook handler |
| GET | `/submissions/{submissionId}/pdf` | Yes | -- | Download submission PDF |
| GET | `/admin/users/{userId}` | Yes | Admin, Manager, OfficeManager | Get user compliance detail |
| POST | `/admin/users/{userId}/remind` | Yes | Admin, Manager, OfficeManager | Send compliance reminder |
| GET | `/admin/i9-pending` | Yes | Admin, Manager, OfficeManager | List pending I-9 section 2 reviews |
| POST | `/submissions/{submissionId}/complete-i9-section2` | Yes | Admin, Manager, OfficeManager | Complete I-9 section 2 |

---

### Identity Documents

**Controller:** `IdentityDocumentsController`
**Base path:** `/api/v1/identity-documents`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/me` | Yes | -- | Get current user identity documents |
| POST | `/me` | Yes | -- | Upload identity document |
| DELETE | `/me/{id}` | Yes | -- | Delete identity document |
| GET | `/admin/users/{userId}` | Yes | Admin, Manager, OfficeManager | Get user identity documents |
| POST | `/admin/{id}/verify` | Yes | Admin, Manager, OfficeManager | Verify identity document |

---

### Payroll

**Controller:** `PayrollController`
**Base path:** `/api/v1/payroll`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/pay-stubs/me` | Yes | -- | Get current user pay stubs |
| GET | `/pay-stubs/{id}/pdf` | Yes | -- | Get pay stub PDF |
| GET | `/tax-documents/me` | Yes | -- | Get current user tax documents |
| GET | `/tax-documents/{id}/pdf` | Yes | -- | Get tax document PDF |
| GET | `/pay-stubs/users/{userId}` | Yes | Admin, Manager, OfficeManager | Get user pay stubs |
| POST | `/pay-stubs/users/{userId}` | Yes | Admin, Manager, OfficeManager | Upload pay stub |
| GET | `/tax-documents/users/{userId}` | Yes | Admin, Manager, OfficeManager | Get user tax documents |
| POST | `/tax-documents/users/{userId}` | Yes | Admin, Manager, OfficeManager | Upload tax document |

---

### Employee Profile

**Controller:** `EmployeeProfileController`
**Base path:** `/api/v1/employee-profile`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get current user employee profile |
| PUT | `/` | Yes | -- | Update current user profile |
| GET | `/completeness` | Yes | -- | Get profile completeness percentage |
| POST | `/acknowledge/{formType}` | Yes | -- | Acknowledge a compliance form |

---

### Employees

**Controller:** `EmployeesController`
**Base path:** `/api/v1/employees`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List employees. Filters: `search`, `teamId`, `role`, `isActive` |
| GET | `/{id}` | Yes | Default | Get employee detail |
| GET | `/{id}/stats` | Yes | Default | Get employee statistics |
| GET | `/{id}/time-summary` | Yes | Default | Get employee time summary |
| GET | `/{id}/pay-summary` | Yes | Default | Get employee pay stubs |

---

### Onboarding

**Controller:** `OnboardingController`
**Base path:** `/api/v1/onboarding`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/submit` | Yes | -- | Submit unified onboarding wizard |
| POST | `/i9-document` | Yes | -- | Upload I-9 identity document (multipart) |
| POST | `/voided-check` | Yes | -- | Upload voided check image (multipart) |

---

### Admin

**Controller:** `AdminController`
**Base path:** `/api/v1/admin`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/roles` | Yes | Admin, Manager | List roles |
| GET | `/users` | Yes | Admin | List all users |
| POST | `/users` | Yes | Admin | Create user (generates setup token) |
| PUT | `/users/{id}` | Yes | Admin | Update user |
| POST | `/users/{id}/setup-token` | Yes | Admin | Generate setup token |
| POST | `/users/{id}/send-invite` | Yes | Admin | Send setup invite email |
| POST | `/users/{id}/reset-pin` | Yes | Admin | Reset user kiosk PIN |
| POST | `/users/{id}/deactivate` | Yes | Admin | Deactivate user |
| POST | `/users/{id}/reactivate` | Yes | Admin | Reactivate user |
| GET | `/users/{id}/documents` | Yes | Admin | Get employee documents |
| GET | `/audit-log` | Yes | Admin | Get audit log. Filters: `userId`, `action`, `entityType`, `from`, `to`, `page`, `pageSize` |
| GET | `/users/{userId}/scan-identifiers` | Yes | Admin | List scan identifiers (RFID/NFC/barcode) |
| POST | `/users/{userId}/scan-identifiers` | Yes | Admin | Add scan identifier |
| DELETE | `/users/{userId}/scan-identifiers/{id}` | Yes | Admin | Remove scan identifier |
| GET | `/storage-usage` | Yes | Admin | Get storage usage by bucket |
| GET | `/users/{userId}/employee-profile` | Yes | Admin | Get employee profile (admin view) |
| PUT | `/users/{userId}/employee-profile` | Yes | Admin | Update employee profile (admin) |
| PATCH | `/users/{userId}/work-location` | Yes | Admin | Set user work location |
| GET | `/integrations` | Yes | Admin | Get integration settings |
| PUT | `/integrations/{provider}` | Yes | Admin | Update integration settings |
| POST | `/integrations/{provider}/test` | Yes | Admin | Test integration connection |
| GET | `/company-profile` | Yes | Admin | Get company profile |
| PATCH | `/company-profile` | Yes | Admin | Update company profile |
| GET | `/track-types` | Yes | Admin | List track types |
| POST | `/track-types` | Yes | Admin | Create track type |
| PUT | `/track-types/{id}` | Yes | Admin | Update track type |
| DELETE | `/track-types/{id}` | Yes | Admin | Delete track type |
| GET | `/reference-data` | Yes | Admin | List reference data groups |
| POST | `/reference-data` | Yes | Admin | Create reference data item |
| PUT | `/reference-data/{id}` | Yes | Admin | Update reference data item |
| DELETE | `/reference-data/{id}` | Yes | Admin | Delete reference data item |
| GET | `/brand` | No | -- | Get brand settings (login theming) |
| GET | `/logo` | No | -- | Get company logo image |
| POST | `/logo` | Yes | Admin | Upload company logo |
| DELETE | `/logo` | Yes | Admin | Delete company logo |
| GET | `/system-settings` | Yes | Admin | Get all system settings |
| PUT | `/system-settings` | Yes | Admin | Upsert system settings |
| GET | `/labor-rates/{userId}` | Yes | Admin | Get labor rates for user |
| POST | `/labor-rates` | Yes | Admin | Create labor rate |
| GET | `/shift-assignments` | Yes | Admin, Manager | List shift assignments |
| POST | `/shift-assignments` | Yes | Admin | Create shift assignment |
| DELETE | `/shift-assignments/{id}` | Yes | Admin | Delete shift assignment |
| GET | `/mfa/compliance` | Yes | Admin | Get MFA compliance status |
| PUT | `/mfa/policy` | Yes | Admin | Set MFA policy (required roles) |

---

### Users

**Controller:** `UsersController`
**Base path:** `/api/v1/users`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List all users (lightweight) |

---

### Reference Data

**Controller:** `ReferenceDataController`
**Base path:** `/api/v1/reference-data`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List reference data groups |
| GET | `/{groupCode}` | No | -- | Get reference data items by group code |

---

### Company Locations

**Controller:** `CompanyLocationsController`
**Base path:** `/api/v1/company-locations`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List all locations |
| GET | `/{id}` | Yes | Admin | Get location detail |
| POST | `/` | Yes | Admin | Create location |
| PUT | `/{id}` | Yes | Admin | Update location |
| DELETE | `/{id}` | Yes | Admin | Delete location |
| POST | `/{id}/set-default` | Yes | Admin | Set as default location |

---

### Terminology

**Controller:** `TerminologyController`
**Base path:** `/api/v1/terminology`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get terminology map |
| PUT | `/` | Yes | Admin | Update terminology entries |

---

### User Preferences

**Controller:** `UserPreferencesController`
**Base path:** `/api/v1/user-preferences`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get all preferences for current user |
| PATCH | `/` | Yes | -- | Update preferences (batch) |
| DELETE | `/{key}` | Yes | -- | Delete single preference |

---

### Scheduled Tasks

**Controller:** `ScheduledTasksController`
**Base path:** `/api/v1/scheduled-tasks`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List scheduled tasks |
| POST | `/` | Yes | Admin | Create scheduled task |
| PUT | `/{id}` | Yes | Admin | Update scheduled task |
| DELETE | `/{id}` | Yes | Admin | Delete scheduled task |
| POST | `/{id}/run` | Yes | Admin | Manually trigger task |

---

### EDI

**Controller:** `EdiController`
**Base path:** `/api/v1/edi`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/trading-partners` | Yes | Default | List trading partners. Filter: `isActive` |
| GET | `/trading-partners/{id}` | Yes | Default | Get trading partner detail |
| POST | `/trading-partners` | Yes | Default | Create trading partner |
| PUT | `/trading-partners/{id}` | Yes | Default | Update trading partner |
| DELETE | `/trading-partners/{id}` | Yes | Default | Delete trading partner |
| POST | `/trading-partners/{id}/test` | Yes | Default | Test EDI connection |
| GET | `/transactions` | Yes | Default | List transactions (paginated). Filters: `direction`, `transactionSet`, `status`, `tradingPartnerId`, `dateFrom`, `dateTo` |
| GET | `/transactions/{id}` | Yes | Default | Get transaction detail |
| POST | `/receive` | Yes | Default | Receive inbound EDI document |
| POST | `/send/{entityType}/{entityId}` | Yes | Default | Send outbound EDI document |
| POST | `/transactions/{id}/retry` | Yes | Default | Retry failed transaction |
| GET | `/trading-partners/{id}/mappings` | Yes | Default | List field mappings |
| POST | `/trading-partners/{id}/mappings` | Yes | Default | Create field mapping |
| PUT | `/mappings/{id}` | Yes | Default | Update field mapping |
| DELETE | `/mappings/{id}` | Yes | Default | Delete field mapping |

---

### Report Builder

**Controller:** `ReportBuilderController`
**Base path:** `/api/v1/report-builder`
**Default roles:** Admin, Manager, OfficeManager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/entities` | Yes | Default | List available report entity sources with fields |
| GET | `/saved` | Yes | Default | List saved reports |
| GET | `/saved/{id}` | Yes | Default | Get saved report detail |
| POST | `/saved` | Yes | Default | Create saved report |
| PUT | `/saved/{id}` | Yes | Default | Update saved report |
| DELETE | `/saved/{id}` | Yes | Default | Delete saved report |
| POST | `/run` | Yes | Default | Run ad-hoc report query |
| GET | `/{id}/export?format=Csv` | Yes | Default | Export report (CSV/Excel/PDF) |
| GET | `/schedules` | Yes | Admin, Manager | List report schedules |
| POST | `/schedules` | Yes | Admin, Manager | Create report schedule |
| DELETE | `/schedules/{id}` | Yes | Admin, Manager | Delete report schedule |

---

### Canned Reports

**Controller:** `ReportsController`
**Base path:** `/api/v1/reports`
**Default roles:** Admin, Manager, OfficeManager, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/jobs-by-stage` | Yes | Default | Jobs count by stage |
| GET | `/overdue-jobs` | Yes | Default | List overdue jobs |
| GET | `/time-by-user` | Yes | Default | Time logged per user |
| GET | `/expense-summary` | Yes | Default | Expense summary by category |
| GET | `/lead-pipeline` | Yes | Default | Lead pipeline funnel |
| GET | `/job-completion-trend` | Yes | Default | Job completion over time |
| GET | `/on-time-delivery` | Yes | Default | On-time delivery rate |
| GET | `/average-lead-time` | Yes | Default | Average lead time by track type |
| GET | `/team-workload` | Yes | Default | Team workload distribution |
| GET | `/customer-activity` | Yes | Default | Customer activity summary |
| GET | `/my-work-history` | Yes | Default | Current user work history |
| GET | `/my-time-log` | Yes | Default | Current user time log |
| GET | `/ar-aging` | Yes | Default | AR aging report |
| GET | `/revenue` | Yes | Default | Revenue report. Filter: `groupBy` |
| GET | `/simple-pnl` | Yes | Default | Simple P&L report |
| GET | `/my-expense-history` | Yes | Default | Current user expense history |
| GET | `/quote-to-close` | Yes | Default | Quote-to-close conversion |
| GET | `/shipping-summary` | Yes | Default | Shipping summary |
| GET | `/time-in-stage` | Yes | Default | Time in stage analysis |
| GET | `/employee-productivity` | Yes | Default | Employee productivity |
| GET | `/inventory-levels` | Yes | Default | Inventory levels report |
| GET | `/maintenance` | Yes | Default | Maintenance report |
| GET | `/quality-scrap` | Yes | Default | Quality/scrap report |
| GET | `/cycle-review` | Yes | Default | Planning cycle review |
| GET | `/job-margin` | Yes | Default | Job margin analysis |
| GET | `/my-cycle-summary` | Yes | Default | Current user cycle summary |
| GET | `/lead-sales` | Yes | Default | Lead-to-sales conversion |
| GET | `/rd` | Yes | Default | R&D activity report |
| GET | `/time-by-operation` | Yes | Default | Time by operation/routing step |
| GET | `/job-profitability` | Yes | Default | Job profitability analysis |
| GET | `/oee` | Yes | Default | OEE report across work centers |
| GET | `/oee/{workCenterId}` | Yes | Default | OEE for specific work center |
| GET | `/oee/{workCenterId}/trend` | Yes | Default | OEE trend over time |
| GET | `/oee/{workCenterId}/losses` | Yes | Default | Six big losses breakdown |

---

### Status Tracking

**Controller:** `StatusTrackingController`
**Base path:** `/api/v1/status-tracking`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/{entityType}/{entityId}/history` | Yes | -- | Get status history for entity |
| GET | `/{entityType}/{entityId}/active` | Yes | -- | Get current active status |
| POST | `/{entityType}/{entityId}/workflow` | Yes | -- | Set workflow status |
| POST | `/{entityType}/{entityId}/holds` | Yes | -- | Add hold |
| POST | `/holds/{id}/release` | Yes | -- | Release hold |

---

### Customer Returns

**Controller:** `CustomerReturnsController`
**Base path:** `/api/v1/customer-returns`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List returns. Filters: `customerId`, `status` |
| GET | `/{id}` | Yes | Default | Get return detail |
| POST | `/` | Yes | Default | Create return (optionally create rework job) |
| PUT | `/{id}` | Yes | Default | Update return |
| POST | `/{id}/resolve` | Yes | Default | Resolve return |
| POST | `/{id}/close` | Yes | Default | Close return |

---

### Lots

**Controller:** `LotsController`
**Base path:** `/api/v1/lots`
**Default roles:** Admin, Manager, Engineer, ProductionWorker

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List lot records. Filters: `partId`, `jobId`, `search` |
| POST | `/` | Yes | Default | Create lot record |
| GET | `/{lotNumber}/trace` | Yes | Default | Get lot traceability chain |

---

### Scheduling

**Controller:** `SchedulingController`
**Base path:** `/api/v1/scheduling`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/run` | Yes | Default | Run scheduler (forward/backward) |
| POST | `/simulate` | Yes | Default | Simulate schedule (what-if) |
| GET | `/runs` | Yes | Default | List schedule runs |
| GET | `/gantt` | Yes | Default | Get Gantt chart data |
| PATCH | `/operations/{id}` | Yes | Default | Reschedule operation |
| POST | `/operations/{id}/lock` | Yes | Default | Lock/unlock scheduled operation |
| GET | `/dispatch/{workCenterId}` | Yes | Default | Get dispatch list for work center |
| GET | `/work-center-load/{workCenterId}` | Yes | Default | Get work center load chart |

---

### MRP

**Controller:** `MrpController`
**Base path:** `/api/v1/mrp`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/runs` | Yes | Default | List MRP runs |
| GET | `/runs/{id}` | Yes | Default | Get MRP run detail |
| POST | `/runs` | Yes | Default | Execute MRP run |
| POST | `/runs/simulate` | Yes | Default | Simulate MRP run |
| GET | `/planned-orders` | Yes | Default | List planned orders. Filters: `mrpRunId`, `status` |
| PATCH | `/planned-orders/{id}` | Yes | Default | Update planned order (firm/notes) |
| POST | `/planned-orders/{id}/release` | Yes | Default | Release planned order to PO/Job |
| POST | `/planned-orders/bulk-release` | Yes | Default | Bulk release planned orders |
| DELETE | `/planned-orders/{id}` | Yes | Default | Delete planned order |
| GET | `/exceptions` | Yes | Default | List MRP exceptions. Filters: `mrpRunId`, `unresolvedOnly` |
| POST | `/exceptions/{id}/resolve` | Yes | Default | Resolve MRP exception |
| GET | `/master-schedules` | Yes | Default | List master production schedules |
| GET | `/master-schedules/{id}` | Yes | Default | Get master schedule detail |
| POST | `/master-schedules` | Yes | Default | Create master schedule |
| PUT | `/master-schedules/{id}` | Yes | Default | Update master schedule |

---

### Sales Tax

**Controller:** `SalesTaxController`
**Base path:** `/api/v1/sales-tax-rates`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List all tax rates |
| GET | `/for-customer/{customerId}` | Yes | -- | Get effective rate for customer |
| POST | `/` | Yes | Admin, Manager | Create tax rate |
| PUT | `/{id}` | Yes | Admin, Manager | Update tax rate |
| DELETE | `/{id}` | Yes | Admin | Delete tax rate |

---

### Price Lists

**Controller:** `PriceListsController`
**Base path:** `/api/v1/price-lists`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List price lists. Filter: `customerId` |
| GET | `/{id}` | Yes | Default | Get price list with entries |
| POST | `/` | Yes | Default | Create price list with entries |
| DELETE | `/{id}` | Yes | Default | Delete price list |

---

### Pricing

**Controller:** `PricingController`
**Base path:** `/api/v1/pricing`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/resolve?partId=&customerId=&quantity=` | Yes | -- | Resolve effective price for part/customer/qty |

---

### Recurring Orders

**Controller:** `RecurringOrdersController`
**Base path:** `/api/v1/recurring-orders`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List recurring orders. Filters: `customerId`, `isActive` |
| GET | `/{id}` | Yes | Default | Get recurring order detail |
| POST | `/` | Yes | Default | Create recurring order template |
| DELETE | `/{id}` | Yes | Default | Delete recurring order |

---

### Accounting

**Controller:** `AccountingController`
**Base path:** `/api/v1`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/admin/accounting-mode` | No | -- | Get active accounting provider |
| PUT | `/admin/accounting-mode` | Yes | Admin | Set active accounting provider |
| GET | `/accounting/providers` | Yes | -- | List available accounting providers |

Additional accounting endpoints exist for QuickBooks OAuth flow, sync operations, and provider-specific configuration.

---

### Barcodes

**Controller:** `BarcodesController`
**Base path:** `/api/v1/barcodes`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/?entityType=&entityId=` | Yes | -- | Get barcodes for entity |
| POST | `/regenerate` | Yes | -- | Regenerate barcode |

---

### Shop Floor

**Controller:** `ShopFloorController`
**Base path:** `/api/v1/display/shop-floor`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | No | -- | Get shop floor overview. Filter: `teamId` |
| GET | `/clock-status` | No | -- | Get worker clock-in status |
| GET | `/search?q=` | No | -- | Kiosk search (Jobs and Parts only) |
| POST | `/identify-scan` | No | -- | Identify scanned value |
| POST | `/clock` | No | -- | Clock in/out from kiosk |

---

### Andon

**Controller:** `AndonController`
**Base path:** `/api/v1/shop-floor/andon`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get andon board data |
| GET | `/alerts` | Yes | -- | List alerts. Filters: `workCenterId`, `status` |
| POST | `/alerts` | Yes | -- | Create andon alert |
| POST | `/alerts/{id}/acknowledge` | Yes | -- | Acknowledge alert |
| POST | `/alerts/{id}/resolve` | Yes | -- | Resolve alert |

---

### Approvals

**Controller:** `ApprovalsController`
**Base path:** `/api/v1/approvals`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/pending` | Yes | -- | Get pending approvals for current user |
| GET | `/history/{entityType}/{entityId}` | Yes | -- | Get approval history for entity |
| POST | `/submit` | Yes | -- | Submit entity for approval |
| POST | `/{requestId}/approve` | Yes | -- | Approve request |
| POST | `/{requestId}/reject` | Yes | -- | Reject request |

---

### Projects

**Controller:** `ProjectsController`
**Base path:** `/api/v1/projects`
**Default roles:** Admin, Manager, PM, Engineer

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List projects. Filters: `status`, `customerId`, `page`, `pageSize` |
| GET | `/{id}` | Yes | Default | Get project detail |
| POST | `/` | Yes | Default | Create project |
| PUT | `/{id}` | Yes | Default | Update project |
| DELETE | `/{id}` | Yes | Admin, Manager | Delete project |

---

### Work Centers

**Controller:** `WorkCentersController`
**Base path:** `/api/v1/work-centers`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List work centers |
| POST | `/` | Yes | Admin, Manager | Create work center |
| PUT | `/{id}` | Yes | Admin, Manager | Update work center |
| GET | `/{id}/calendar` | Yes | -- | Get work center calendar |

---

### Shifts

**Controller:** `ShiftsController`
**Base path:** `/api/v1/admin/shifts`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List shifts |
| POST | `/` | Yes | Admin | Create shift |
| PUT | `/{id}` | Yes | Admin | Update shift |
| DELETE | `/{id}` | Yes | Admin | Delete shift |

---

### Plants

**Controller:** `PlantsController`
**Base path:** `/api/v1/admin/plants`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List plants |
| POST | `/` | Yes | Admin | Create plant |
| PUT | `/{id}` | Yes | Admin | Update plant |

---

### Currencies and Exchange Rates

**Controller:** `CurrenciesController`
**Base path:** `/api/v1/admin/currencies`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List currencies |
| POST | `/` | Yes | Admin | Create currency |
| PUT | `/{id}` | Yes | Admin | Update currency |

**Controller:** `ExchangeRatesController`
**Base path:** `/api/v1/admin/exchange-rates`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List exchange rates |
| POST | `/` | Yes | Admin | Set exchange rate |
| GET | `/convert` | Yes | Admin | Convert amount between currencies |

---

### CPQ (Configure-Price-Quote)

**Controller:** `CpqController`
**Base path:** `/api/v1/cpq`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/configurators` | Yes | -- | List configurators. Filters: `isActive`, `basePartId` |
| POST | `/configurators` | Yes | Admin, Manager | Create configurator |
| GET | `/configurators/{id}` | Yes | -- | Get configurator detail |
| PUT | `/configurators/{id}` | Yes | Admin, Manager | Update configurator |
| POST | `/configure` | Yes | -- | Configure product (calculate price/BOM) |
| POST | `/validate` | Yes | -- | Validate configuration selections |
| POST | `/configurations` | Yes | -- | Save configuration |

---

### Consignment Agreements

**Controller:** `ConsignmentAgreementsController`
**Base path:** `/api/v1/consignment-agreements`
**Default roles:** Admin, Manager, OfficeManager, Engineer

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List agreements. Filters: `vendorId`, `customerId`, `status`, `partId` |
| GET | `/{id}` | Yes | Default | Get agreement detail |
| POST | `/` | Yes | Default | Create agreement |
| PUT | `/{id}` | Yes | Default | Update agreement |
| POST | `/{id}/consume` | Yes | Default | Record consumption transaction |
| POST | `/{id}/receive` | Yes | Default | Record receipt transaction |

---

### Inter-Plant Transfers

**Controller:** `InterPlantTransfersController`
**Base path:** `/api/v1/inventory/transfers`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List transfers. Filters: `status`, `plantId` |
| POST | `/` | Yes | -- | Create inter-plant transfer |
| POST | `/{id}/ship` | Yes | -- | Ship transfer |
| POST | `/{id}/receive` | Yes | -- | Receive transfer |

---

### Pick Waves

**Controller:** `PickWavesController`
**Base path:** `/api/v1/pick-waves`
**Default roles:** Admin, Manager, OfficeManager, Engineer, ProductionWorker

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List pick waves. Filters: `status`, `assignedToId` |
| GET | `/{id}` | Yes | Default | Get pick wave detail |
| POST | `/` | Yes | Default | Create pick wave |
| POST | `/auto-generate` | Yes | Default | Auto-generate wave from pending orders |
| POST | `/{id}/release` | Yes | Default | Release wave for picking |
| POST | `/{id}/lines/{lineId}/confirm` | Yes | Default | Confirm pick line |
| POST | `/{id}/complete` | Yes | Default | Complete pick wave |

---

### ABC Classification

**Controller:** `AbcClassificationController`
**Base path:** `/api/v1/inventory/abc`
**Default roles:** Admin, Manager, OfficeManager, Engineer

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/run` | Yes | Default | Run ABC classification analysis |
| GET | `/runs` | Yes | Default | List classification runs |
| GET | `/runs/{runId}/results` | Yes | Default | Get run results |
| GET | `/summary` | Yes | Default | Get current ABC summary |
| POST | `/runs/{runId}/apply` | Yes | Default | Apply classification to parts |

---

### Back-to-Back and Drop Ship Orders

**Controller:** `BackToBacksController`
**Base path:** `/api/v1`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/sales-orders/{soId}/lines/{lineId}/back-to-back` | Yes | Admin, Manager, OfficeManager, Engineer | Create back-to-back PO from SO line |
| POST | `/purchase-orders/{poId}/lines/{lineId}/link-receipt` | Yes | -- | Link receipt to back-to-back |
| GET | `/back-to-back/pending` | Yes | -- | Get pending back-to-back orders |

**Controller:** `DropShipsController`
**Base path:** `/api/v1`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/sales-orders/{soId}/lines/{lineId}/drop-ship` | Yes | Admin, Manager, OfficeManager, Engineer | Create drop-ship PO |
| POST | `/purchase-orders/{poId}/lines/{lineId}/drop-ship-confirm` | Yes | -- | Confirm drop-ship delivery |
| GET | `/drop-ships/pending` | Yes | -- | Get pending drop-ships |

---

### Controlled Documents

**Controller:** `ControlledDocumentsController`
**Base path:** `/api/v1/documents/controlled`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List documents. Filters: `category`, `status` |
| POST | `/` | Yes | -- | Create controlled document |
| GET | `/{documentId}/revisions` | Yes | -- | List document revisions |

---

### COPQ Reports

**Controller:** `CopqController`
**Base path:** `/api/v1/reports/copq`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | Get COPQ report. Params: `startDate`, `endDate` |
| GET | `/trend` | Yes | -- | Get COPQ trend. Param: `months` |
| GET | `/pareto` | Yes | -- | Get COPQ Pareto chart data |

---

### Sankey Reports

**Controller:** `SankeyReportsController`
**Base path:** `/api/v1/reports/sankey`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/material-flow` | Yes | -- | Get material flow Sankey data |

---

### Predictive Maintenance

**Controller:** `PredictiveMaintenanceController`
**Base path:** `/api/v1/predictions`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List predictions. Filters: `workCenterId`, `severity`, `status` |
| GET | `/{id}` | Yes | -- | Get prediction detail |
| POST | `/{id}/acknowledge` | Yes | -- | Acknowledge prediction |
| POST | `/{id}/schedule-maintenance` | Yes | Admin, Manager | Schedule preventive maintenance |
| POST | `/{id}/resolve` | Yes | -- | Resolve prediction |
| POST | `/{id}/false-positive` | Yes | -- | Mark as false positive |

---

### Machine Connections (IoT)

**Controller:** `MachineConnectionsController`
**Base path:** `/api/v1/admin/machine-connections`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List connections. Filter: `isActive` |
| POST | `/` | Yes | Default | Create machine connection |
| PUT | `/{id}` | Yes | Default | Update connection |
| POST | `/{id}/test` | Yes | Default | Test connection |

---

### E-Commerce

**Controller:** `ECommerceController`
**Base path:** `/api/v1/admin/ecommerce`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Default | List e-commerce integrations |
| POST | `/` | Yes | Default | Create integration |
| PUT | `/{id}` | Yes | Default | Update integration |
| POST | `/{id}/test` | Yes | Default | Test connection |
| POST | `/{id}/import` | Yes | Default | Import orders |
| GET | `/{id}/syncs` | Yes | Default | List order sync history |
| POST | `/syncs/{syncId}/retry` | Yes | Default | Retry failed import |

---

### BI API Keys

**Controller:** `BiApiKeysController`
**Base path:** `/api/v1/admin/bi-api-keys`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List BI API keys |
| POST | `/` | Yes | Admin | Create API key |
| DELETE | `/{id}` | Yes | Admin | Revoke API key |

---

### Webhooks

**Controller:** `WebhooksController`
**Base path:** `/api/v1/admin/webhooks`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | Admin | List all webhook subscriptions |
| POST | `/` | Yes | Admin | Create webhook subscription (url, eventTypesJson, secret, description, headersJson, maxRetries, autoDisableOnFailure) |
| GET | `/{subscriptionId}/deliveries` | Yes | Admin | List delivery attempts for a subscription |

---

### User Integrations

**Controller:** `UserIntegrationsController`
**Base path:** `/api/v1/user-integrations`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List current user integrations |

**Controller:** `AdminUserIntegrationsController`
**Base path:** `/api/v1/admin/user-integrations`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/{userId}` | Yes | Admin | Get user integration summaries |
| DELETE | `/{userId}/{integrationId}` | Yes | Admin | Revoke user integration |

---

### Reviews

**Controller:** `ReviewsController`
**Base path:** `/api/v1/reviews`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/cycles` | Yes | Admin, Manager | List review cycles |
| POST | `/cycles` | Yes | Admin | Create review cycle |
| GET | `/` | Yes | Admin, Manager | List performance reviews (query: cycleId, employeeId) |
| PATCH | `/{id}` | Yes | -- | Update review (status, overallRating, goalsJson, competenciesJson, strengthsComments, improvementComments, employeeSelfAssessment) |

---

### Serials

**Controller:** `SerialsController`
**Base path:** `/api/v1/serials`
**Default roles:** Admin, Manager, Engineer

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/part/{partId}` | Yes | Default | List serial numbers for a part (query: status) |
| POST | `/part/{partId}` | Yes | Default | Create serial number for a part |
| GET | `/{serialValue}/genealogy` | Yes | Default | Get full genealogy tree for a serial number |
| POST | `/{id}/transfer` | Yes | Default | Transfer serial number to new location/owner |
| GET | `/{id}/history` | Yes | Default | Get serial number movement/change history |

---

### Replenishment

**Controller:** `ReplenishmentController`
**Base path:** `/api/v1/replenishment`
**Default roles:** Admin, Manager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/burn-rates` | Yes | Default | Get part burn rates (query: search, needsReorderOnly) |
| GET | `/suggestions` | Yes | Default | List reorder suggestions (query: status) |
| POST | `/suggestions/{id}/approve` | Yes | Default | Approve a reorder suggestion |
| POST | `/suggestions/approve-bulk` | Yes | Default | Bulk approve suggestions (body: suggestionIds[]) |
| POST | `/suggestions/{id}/dismiss` | Yes | Default | Dismiss a reorder suggestion (body: reason) |

---

### Subcontracting

**Controller:** `SubcontractController`
**Base path:** `/api/v1` (mixed routes)
**Default roles:** Admin, Manager, Engineer, PM

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/jobs/{jobId}/operations/{opId}/send-out` | Yes | Default | Send operation to subcontractor |
| POST | `/subcontract-orders/{id}/receive` | Yes | Default | Record receipt of subcontracted work |
| GET | `/jobs/{jobId}/subcontract-orders` | Yes | Default | List subcontract orders for a job |
| GET | `/shop-floor/pending-subcontracts` | Yes | Default | List all pending subcontract orders |
| GET | `/reports/subcontract-spending` | Yes | Default | Subcontract spending report (query: dateFrom, dateTo) |

---

### Leave Management

**Controller:** `LeaveController`
**Base path:** `/api/v1/leave`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/policies` | Yes | -- | List leave policies (query: activeOnly) |
| POST | `/policies` | Yes | Admin | Create leave policy |
| GET | `/balances/{userId}` | Yes | -- | Get leave balances for a user |
| GET | `/requests` | Yes | -- | List leave requests (query: userId, status) |
| POST | `/requests` | Yes | -- | Submit a leave request |
| POST | `/requests/{id}/approve` | Yes | Admin, Manager | Approve a leave request |
| POST | `/requests/{id}/deny` | Yes | Admin, Manager | Deny a leave request (body: reason) |

---

### Languages and Translations

**Controller:** `LanguagesController`
**Base path:** `/api/v1/admin`
**Default roles:** Admin

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/languages` | Yes | Admin | List supported languages |
| GET | `/translations/{languageCode}` | Yes | Admin | Get all translation entries for a language |
| PUT | `/translations/{languageCode}/{key}` | Yes | Admin | Update a single translation entry |
| POST | `/translations/{languageCode}/import` | Yes | Admin | Bulk import translations |
| GET | `/translations/{languageCode}/export` | Yes | Admin | Export all translations as key-value map |

---

### Purchasing / RFQs

**Controller:** `PurchasingController`
**Base path:** `/api/v1/purchasing`
**Default roles:** Admin, Manager, OfficeManager

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/rfqs` | Yes | Default | List RFQs (query: status, search) |
| POST | `/rfqs` | Yes | Default | Create RFQ (partId, quantity, requiredDate, description, specialInstructions, responseDeadline) |
| GET | `/rfqs/{id}` | Yes | Default | Get RFQ detail |
| PUT | `/rfqs/{id}` | Yes | Default | Update RFQ |
| POST | `/rfqs/{id}/send` | Yes | Default | Send RFQ to selected vendors (body: vendorIds[]) |
| POST | `/rfqs/{id}/responses` | Yes | Default | Record vendor response (unitPrice, leadTimeDays, minimumOrderQuantity, toolingCost, quoteValidUntil, notes) |
| GET | `/rfqs/{id}/compare` | Yes | Default | Compare vendor responses side-by-side |
| POST | `/rfqs/{id}/award/{responseId}` | Yes | Default | Award RFQ to vendor response (creates PO) |

---

### Shop Floor Machine (IoT)

**Controller:** `ShopFloorMachineController`
**Base path:** `/api/v1/shop-floor/machine`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/{workCenterId}/live` | Yes | -- | Get latest machine data points for a work center |
| GET | `/{workCenterId}/history` | Yes | -- | Get historical machine data (query: tagId, from, to) |

---

### Downloads

**Controller:** `DownloadsController`
**Base path:** `/api/v1/downloads`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/rfid-relay-setup.ps1` | Yes | -- | Download RFID relay PowerShell setup script |
| GET | `/rfid-relay.zip` | Yes | -- | Download RFID relay scripts package |

---

### Entity Activity

**Controller:** `EntityActivityController`
**Base path:** `/api/v1/{entityType}/{entityId}`

Polymorphic activity/history/notes endpoints for any supported entity type.

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/activity` | Yes | -- | Get entity activity log |
| GET | `/history` | Yes | -- | Get entity change history |
| GET | `/notes` | Yes | -- | Get entity notes |
| POST | `/notes` | Yes | -- | Create entity note |

**Supported entity types:** Job, Part, Asset, Lead, Customer, Expense, SalesOrder, Invoice, Quote, Shipment, Payment, PurchaseOrder, Vendor, CustomerReturn, Lot

---

### Address Validation

**Controller:** `AddressesController`
**Base path:** `/api/v1/addresses`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/validate` | Yes | -- | Validate address (USPS or mock) |

---

### Track Types

**Controller:** `TrackTypesController`
**Base path:** `/api/v1/track-types`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | Yes | -- | List all track types with stages |
| GET | `/{id}` | Yes | -- | Get track type detail |

---

## SignalR Hubs

Real-time communication uses SignalR WebSocket connections. JWT is passed via `?access_token=` query string.

| Hub | Path | Purpose |
|-----|------|---------|
| BoardHub | `/hubs/board` | Kanban board real-time sync |
| NotificationHub | `/hubs/notifications` | Push notifications |
| TimerHub | `/hubs/timer` | Timer start/stop events |
| ChatHub | `/hubs/chat` | Real-time messaging |

All hubs require authentication (`[Authorize]`).
