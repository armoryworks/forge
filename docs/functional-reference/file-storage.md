# File Storage

## Overview

Forge uses MinIO (S3-compatible object storage) for all file attachments. Files are associated with entities through a polymorphic `FileAttachment` table that stores the entity type and ID alongside the MinIO bucket name and object key. The frontend provides drag-and-drop upload (`FileUploadZoneComponent`), a fullscreen image viewer (`LightboxGalleryComponent`), and device camera capture (`CameraCaptureComponent`).

Files are soft-deleted: the `FileAttachment` database record is marked with `DeletedAt` via the standard `BaseEntity` soft-delete mechanism. MinIO objects are retained indefinitely (not deleted from storage on soft-delete).

---

## Backend Architecture

### IStorageService

**Location:** `forge-api/forge.core/Interfaces/IStorageService.cs`

The storage abstraction used by all file operations:

```csharp
public interface IStorageService
{
    Task UploadAsync(string bucketName, string objectKey, Stream stream, string contentType, CancellationToken ct);
    Task<Stream> DownloadAsync(string bucketName, string objectKey, CancellationToken ct);
    Task<string> GetPresignedUrlAsync(string bucketName, string objectKey, int expirySeconds, CancellationToken ct);
    Task DeleteAsync(string bucketName, string objectKey, CancellationToken ct);
    Task EnsureBucketExistsAsync(string bucketName, CancellationToken ct);
    Task<bool> TestConnectionAsync(CancellationToken ct);
}
```

### MinioStorageService

**Location:** `forge-api/forge.integrations/MinioStorageService.cs`

Production implementation using the Minio .NET SDK (v7.0.0).

**Dual-client architecture:**

The service maintains two MinIO client instances:
1. `_client` -- Points to the internal Docker hostname (e.g., `forge-storage:9000`). Used for upload, download, delete, and bucket management.
2. `_presignClient` -- Points to the public endpoint (e.g., `localhost:9000`). Used exclusively for presigned URL generation. This is necessary because presigned URLs embed the host in their HMAC signature, so the URL must match the host that the browser will actually request.

**Configuration:** `MinioOptions` in `forge.core/Models/MinioOptions.cs`

| Setting | Purpose |
|---------|---------|
| `Endpoint` | Internal MinIO hostname (Docker service name) |
| `PublicEndpoint` | Browser-accessible MinIO hostname (for presigned URLs) |
| `AccessKey` | MinIO access key |
| `SecretKey` | MinIO secret key |
| `UseSsl` | Whether to use HTTPS |

**Operations:**

| Method | Implementation |
|--------|---------------|
| `UploadAsync` | `PutObjectAsync` with stream data and content type |
| `DownloadAsync` | `GetObjectAsync` with callback stream copied to `MemoryStream`. Returns stream at position 0. |
| `GetPresignedUrlAsync` | `PresignedGetObjectAsync` via `_presignClient` with configurable expiry |
| `DeleteAsync` | `RemoveObjectAsync` |
| `EnsureBucketExistsAsync` | `BucketExistsAsync` + `MakeBucketAsync` if not found |
| `TestConnectionAsync` | `ListBucketsAsync` wrapped in try/catch |

### MockStorageService

**Location:** `forge-api/forge.integrations/MockStorageService.cs`

In-memory `ConcurrentDictionary` implementation used when `MOCK_INTEGRATIONS=true`. All operations succeed immediately. Used for development and testing.

---

## Buckets

| Bucket Name | Purpose |
|-------------|---------|
| `forge-job-files` | Job-related documents (work orders, drawings, specs) |
| `forge-receipts` | Expense receipts and financial documents |
| `forge-employee-docs` | Employee documents (tax forms, compliance, identity) |

Buckets are auto-created on first use via `EnsureBucketExistsAsync`.

---

## FileAttachment Entity

**Location:** `forge-api/forge.core/Entities/FileAttachment.cs`

Extends `BaseAuditableEntity` (inherits `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`, `DeletedBy`, `CreatedBy`).

| Property | Type | Description |
|----------|------|-------------|
| `FileName` | `string` | Original file name |
| `ContentType` | `string` | MIME type |
| `Size` | `long` | File size in bytes |
| `BucketName` | `string` | MinIO bucket name |
| `ObjectKey` | `string` | MinIO object key (path within bucket) |
| `EntityType` | `string` | Polymorphic entity type (e.g., `"jobs"`, `"expenses"`, `"employees"`) |
| `EntityId` | `int` | ID of the associated entity |
| `UploadedById` | `int` | User who uploaded the file |
| `DocumentType` | `string?` | Optional document classification |
| `ExpirationDate` | `DateTimeOffset?` | Optional expiration date |
| `PartRevisionId` | `int?` | Optional FK to PartRevision (for revision-scoped files) |
| `RequiredRole` | `string?` | Optional role required to access the file |
| `Sensitivity` | `string?` | Optional sensitivity classification |
| `PartRevision` | `PartRevision?` | Navigation property |

The `EntityType`/`EntityId` pair creates a polymorphic association, allowing any entity type to have file attachments without separate join tables.

---

## API Endpoints

**Controller:** `forge-api/forge.api/Controllers/FilesController.cs`

All endpoints require `[Authorize]`.

| Method | Route | Description | Response |
|--------|-------|-------------|----------|
| `GET` | `/api/v1/{entityType}/{entityId}/files` | List all files for an entity | `List<FileAttachmentResponseModel>` |
| `POST` | `/api/v1/{entityType}/{entityId}/files` | Upload a single file | `201 Created` + `FileAttachmentResponseModel` |
| `POST` | `/api/v1/{entityType}/{entityId}/files/chunked` | Upload a file chunk (for large files) | `ChunkedUploadResponseModel` |
| `GET` | `/api/v1/files/{id}/download` | Download a file by ID | File stream with content type + name |
| `GET` | `/api/v1/parts/{partId}/revisions/{revisionId}/files` | List files for a specific part revision | `List<FileAttachmentResponseModel>` |
| `DELETE` | `/api/v1/files/{id}` | Soft-delete a file | `204 No Content` |

Both upload endpoints use `[DisableRequestSizeLimit]` to support large files.

### Chunked Upload

For files larger than the chunk threshold (default 5MB), the frontend splits the file and sends chunks sequentially:

**Form fields per chunk:**
- `uploadId` -- UUID identifying the upload session
- `fileName` -- Original file name
- `contentType` -- MIME type
- `chunkIndex` -- Zero-based chunk index
- `totalChunks` -- Total number of chunks
- `chunk` -- The chunk data (multipart file)

**Response:**
```typescript
interface ChunkedUploadResponse {
  uploadId: string;
  chunkIndex: number;
  isComplete: boolean;
  fileAttachment: UploadedFile | null;  // Only populated on final chunk
}
```

When `isComplete` is true and `fileAttachment` is non-null, the upload is finished and the assembled file has been stored.

---

## FileUploadZoneComponent

**Location:** `forge-ui/src/app/shared/components/file-upload-zone/`

Drag-and-drop file upload zone with per-file progress bars, file type validation, file size validation, and chunked upload support.

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `entityType` | `string` (required) | -- | Entity type for the upload URL (e.g., `"jobs"`) |
| `entityId` | `string \| number` (required) | -- | Entity ID for the upload URL |
| `accept` | `string` | `''` | Comma-separated accepted file types (e.g., `".pdf,.step,.stl"`) |
| `maxSizeMb` | `number` | `50` | Maximum file size in MB |
| `multiple` | `boolean` | `true` | Whether multiple files can be uploaded at once |
| `chunkSizeMb` | `number` | `5` | Files larger than this use chunked upload |

### Output

| Output | Type | Description |
|--------|------|-------------|
| `uploaded` | `UploadedFile` | Emits for each successfully uploaded file |

### UploadedFile

```typescript
interface UploadedFile {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}
```

### Upload Flow

1. Files are selected via drag-and-drop, file picker button, or programmatic `browse()` call.
2. Each file is validated against `maxSizeMb` and `accept` constraints.
3. Files smaller than `chunkSizeMb` are uploaded as a single multipart POST to `/api/v1/{entityType}/{entityId}/files` with progress tracking via `HttpEventType.UploadProgress`.
4. Files larger than `chunkSizeMb` are split into chunks and uploaded sequentially to `/api/v1/{entityType}/{entityId}/files/chunked`.
5. Progress bars update per-file. Errors display inline and auto-dismiss after 5 seconds.
6. On completion, the `uploaded` output emits the `UploadedFile` and the progress bar is removed.

### File Type Validation

The `accept` input uses the same format as HTML `<input accept>`: file extensions (`.pdf`, `.stl`) and MIME types (`image/*`, `application/pdf`). Wildcard MIME types (`image/*`) match any subtype.

### Usage

```html
<app-file-upload-zone
  entityType="jobs"
  [entityId]="jobId"
  accept=".pdf,.step,.stl"
  [maxSizeMb]="50"
  (uploaded)="onFileUploaded($event)" />
```

---

## LightboxGalleryComponent

**Location:** `forge-ui/src/app/shared/components/lightbox-gallery/`

Fullscreen image viewer with thumbnail strip, keyboard navigation, and touch/swipe support.

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `items` | `GalleryItem[]` (required) | Array of items to display |
| `startIndex` | `number` | Initial item index (default `0`) |

### Output

| Output | Type | Description |
|--------|------|-------------|
| `closed` | `void` | Emits when the lightbox is closed |

### GalleryItem

```typescript
interface GalleryItem {
  url: string;           // Full-size image/file URL
  thumbnailUrl?: string; // Optional thumbnail URL
  title?: string;        // Optional title
  type: 'image' | 'pdf' | 'other';  // File type for icon display
}
```

### Navigation

| Input | Action |
|-------|--------|
| Escape | Close lightbox |
| Left Arrow | Previous item |
| Right Arrow | Next item |
| Click backdrop | Close lightbox |
| Swipe left (touch) | Next item (minimum 50px distance) |
| Swipe right (touch) | Previous item (minimum 50px distance) |
| Click thumbnail | Jump to item |

### Visual Behavior

- Items transition with a 150ms fade effect (20ms settle after index change).
- The active thumbnail scrolls into view smoothly within the thumbnail strip.
- Non-image items display file type icons (`picture_as_pdf` for PDFs, `insert_drive_file` for others).
- Counter displays as "N / Total" in the header.

---

## CameraCaptureComponent

**Location:** `forge-ui/src/app/shared/components/camera-capture/`

Device camera capture overlay for taking photos of receipts, documents, or work-in-progress. Supports both camera capture and file picker fallback.

### Inputs / Outputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls overlay visibility |

| Output | Type | Description |
|--------|------|-------------|
| `captured` | `CameraCaptureResult` | Emits captured image data |
| `closed` | `void` | Emits when the overlay is closed |

### CameraCaptureResult

```typescript
interface CameraCaptureResult {
  blob: Blob;        // Image blob (JPEG, 85% quality)
  dataUrl: string;   // Base64 data URL for preview
  width: number;     // Image width in pixels
  height: number;    // Image height in pixels
}
```

### Camera States

| State | Description |
|-------|-------------|
| `initializing` | Requesting camera access |
| `streaming` | Camera feed active, ready to capture |
| `captured` | Photo taken, showing preview |
| `denied` | Camera permission denied by user |
| `unavailable` | Camera not available (no `getUserMedia` support) |

### Capture Flow

1. When `open` becomes true, the component requests camera access via `navigator.mediaDevices.getUserMedia()`.
2. Camera preference: `facingMode: 'environment'` (rear camera on mobile), resolution: `1920x1080`.
3. The live feed is displayed in a `<video>` element.
4. The user can capture (draws video frame to canvas, produces JPEG blob at 85% quality), retake, or use the captured image.
5. "Use" emits the `CameraCaptureResult` and closes the overlay.
6. A file picker button provides a fallback for devices without cameras.

### Cleanup

Camera stream tracks are stopped on close, retake (before restart), and component destruction. The Escape key closes the overlay via a document-level keyboard listener that is properly added/removed with the overlay lifecycle.

---

## Soft Delete Behavior

When a file is deleted via `DELETE /api/v1/files/{id}`:
1. The `FileAttachment` record's `DeletedAt` timestamp is set (standard `BaseEntity` soft delete).
2. The MinIO object is **not** deleted from storage.
3. The file no longer appears in `GET` queries (filtered by EF Core global query filter on `DeletedAt == null`).
4. The file remains recoverable by clearing the `DeletedAt` field in the database.

---

## Key Files

| File | Purpose |
|------|---------|
| `forge-api/forge.core/Interfaces/IStorageService.cs` | Storage abstraction interface |
| `forge-api/forge.integrations/MinioStorageService.cs` | MinIO S3-compatible implementation |
| `forge-api/forge.integrations/MockStorageService.cs` | In-memory mock for development |
| `forge-api/forge.core/Entities/FileAttachment.cs` | Polymorphic file attachment entity |
| `forge-api/forge.api/Controllers/FilesController.cs` | File CRUD + chunked upload endpoints |
| `forge-api/forge.api/Features/Files/` | MediatR handlers (upload, download, delete, list) |
| `forge-ui/src/app/shared/components/file-upload-zone/file-upload-zone.component.ts` | Drag-and-drop upload with progress |
| `forge-ui/src/app/shared/components/lightbox-gallery/lightbox-gallery.component.ts` | Fullscreen image viewer |
| `forge-ui/src/app/shared/components/camera-capture/camera-capture.component.ts` | Device camera capture overlay |
| `forge-ui/src/app/shared/models/gallery-item.model.ts` | `GalleryItem` interface |
| `forge-ui/src/app/shared/models/camera-capture-result.model.ts` | `CameraCaptureResult` interface |
