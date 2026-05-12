# PDF Form Extraction Pipeline

> Architecture for extracting `ComplianceFormDefinition` JSON from government PDF forms.

## Overview

Government compliance forms (W-4, I-9, state withholding) are fillable PDFs with AcroForm fields. This pipeline extracts their structure into `ComplianceFormDefinition` JSON that the `ComplianceFormRendererComponent` renders using ng-dynamic-forms.

### Design Principles

1. **pdf.js is the extraction engine** — Mozilla's PDF renderer provides the most accurate text content, font metadata, field annotations, and reading order of any PDF library. It's the same engine browsers use to display PDFs.
2. **PuppeteerSharp bridges C# to pdf.js** — headless Chromium runs in the API container, executing a bundled JS extraction script that calls pdf.js APIs directly.
3. **Smart pattern-based inference** — the parser detects government form patterns (step sections, amount lines, filing status, signature blocks) from structural cues rather than hardcoded field IDs.
4. **AI-assisted verification and refinement** — after extraction, structural checks validate the result. If checks fail, the existing Ollama AI service corrects the JSON. Max 3 refinement iterations before flagging for human review.

---

## Architecture

```
Admin clicks "Extract Form Definition"
  │
  ▼
ExtractFormDefinitionHandler (MediatR)
  │
  ├─ Downloads PDF (from SourceUrl or MinIO)
  │
  ▼
IPdfJsExtractorService.ExtractRawAsync(pdfBytes)
  │
  ├─ PuppeteerSharp launches headless Chromium
  ├─ Opens bundled extraction page (wwwroot/pdf-extract.html)
  ├─ Passes PDF bytes to JS extraction function
  ├─ JS calls pdf.js APIs:
  │     page.getTextContent()  → text items with fonts, positions, reading order
  │     page.getAnnotations()  → form fields with types, positions, options, labels
  ├─ Returns structured JSON (PdfExtractionResult)
  │
  ▼
IFormDefinitionParser.Parse(PdfExtractionResult)
  │
  ├─ Groups text items into sections (font size + bold = section headers)
  ├─ Assigns fields to sections by position
  ├─ Detects government layout patterns:
  │     • Step sections (numbered, with step labels)
  │     • Amount lines (currency fields at right edge)
  │     • Filing status (radio groups with descriptive options)
  │     • Signature blocks (signature + date fields)
  │     • Form headers (title banner at page top)
  │     • Shaded/highlighted sections
  ├─ Maps to ComplianceFormDefinition JSON
  │
  ▼
IFormDefinitionVerifier.VerifyAsync(json, rawResult)
  │
  ├─ Structural checks:
  │     • Field count matches annotation count
  │     • All annotations have corresponding fields
  │     • All bold/large text appears as section titles
  │     • No orphaned fields (every field in a section)
  │     • Text coverage percentage
  │
  ├─ If checks pass → done
  │
  ├─ If checks fail → AI refinement:
  │     • Sends to IAiService:
  │       - Current ComplianceFormDefinition JSON
  │       - Raw pdf.js extraction data (ground truth)
  │       - Specific failures list
  │       - ComplianceFormDefinition schema
  │     • AI returns corrected JSON
  │     • Re-verify (max 3 iterations)
  │     • If still fails → flag for human review
  │
  ▼
FormDefinitionVersion stored in database
  │
  ▼
ComplianceFormRendererComponent renders form (unchanged)
```

---

## Components

### 1. JS Extraction Script (`wwwroot/pdf-extract.html`)

A bundled HTML page with pdf.js that exposes an `extractFormStructure(pdfBytesBase64)` function. Called by PuppeteerSharp via `page.EvaluateAsync()`.

**Returns:**

```json
{
  "pageCount": 4,
  "pages": [
    {
      "pageNumber": 1,
      "width": 612,
      "height": 792,
      "textItems": [
        {
          "text": "Step 1:",
          "x": 45.2,
          "y": 685.4,
          "width": 42.0,
          "height": 14.0,
          "fontName": "Helvetica-Bold",
          "fontSize": 14.0,
          "isBold": true,
          "color": "#000000"
        }
      ],
      "annotations": [
        {
          "id": "f1_01",
          "fieldType": "text",
          "x": 180.5,
          "y": 660.2,
          "width": 250.0,
          "height": 20.0,
          "fieldName": "First name and middle initial",
          "alternativeText": "First name and middle initial",
          "defaultValue": "",
          "maxLength": 100,
          "required": false,
          "readOnly": false,
          "options": null,
          "radioGroupName": null
        }
      ]
    }
  ]
}
```

**Key pdf.js APIs used:**

- `pdfjsLib.getDocument(data)` — loads PDF from bytes
- `page.getTextContent()` — returns `TextContent.items[]` with `str`, `transform` (position matrix), `fontName`, `width`, `height`
- `page.getAnnotations()` — returns `AnnotationData[]` with `id`, `fieldType`, `rect`, `fieldName`, `alternativeText`, `fieldValue`, `options`, `fieldFlags`, `radioButton`, etc.

### 2. IPdfJsExtractorService (`forge.core/Interfaces/`)

```csharp
public interface IPdfJsExtractorService
{
    Task<PdfExtractionResult> ExtractRawAsync(byte[] pdfBytes, CancellationToken ct);
}
```

**Implementation** (`forge.integrations/PdfJsExtractorService.cs`):

- Manages a PuppeteerSharp browser instance (lazy-initialized, reused)
- Opens `pdf-extract.html` in a new page
- Passes PDF bytes as base64
- Deserializes the JS return value into `PdfExtractionResult`
- Disposes the page after extraction (browser stays warm)

**Mock** (`forge.integrations/MockPdfJsExtractorService.cs`):

- Returns canned extraction data for development/testing when `MockIntegrations=true`

### 3. IFormDefinitionParser (`forge.core/Interfaces/`)

```csharp
public interface IFormDefinitionParser
{
    string Parse(PdfExtractionResult rawResult, string formType);
}
```

**Implementation** (`forge.integrations/FormDefinitionParser.cs`):

Stateless parser that converts raw pdf.js output to `ComplianceFormDefinition` JSON. Pattern detection rules:

| Pattern | Detection Logic | Maps To |
|---------|----------------|---------|
| Step section | Bold text matching `Step \d+:` or large font divider | `layout: "step"`, `stepNumber`, `stepName` |
| Amount line | Currency/number field at right edge of step section | `fieldLayout: "amount-line"`, `amountLabel` |
| Amount total | Amount field following other amounts, bold label | `fieldLayout: "amount-line-total"` |
| Filing status | Radio group with descriptive option labels | `fieldLayout: "filing-status"` |
| Signature block | Text field near bottom + date field | `fieldLayout: "signature-field"` + `"signature-date"` |
| Form header | Large/bold text cluster at page top | `layout: "form-header"`, 3-column grid |
| Grid cells | Multiple fields on same Y-row within a step | `fieldLayout: "grid-cell"`, `gridColumn` |
| Checkbox with dots | Standalone checkbox with leader dots | `fieldLayout: "checkbox-dots"` |
| Shaded section | Background fill detection (if available) or even-step pattern | `shaded: true` |
| Instructions | Non-bold text blocks between sections | Section `instructions` or field `displayText` |

### 4. IFormDefinitionVerifier (`forge.core/Interfaces/`)

```csharp
public interface IFormDefinitionVerifier
{
    Task<VerificationResult> VerifyAsync(
        string formDefinitionJson,
        PdfExtractionResult rawResult,
        string formType,
        CancellationToken ct);
}
```

**VerificationResult:**

```csharp
public record VerificationResult(
    bool Passed,
    double FieldCoveragePercent,    // % of annotations mapped to fields
    double TextCoveragePercent,     // % of bold/large text in section titles
    List<string> MissingFieldIds,   // Annotations not found in definition
    List<string> OrphanedFieldIds,  // Fields not in any section
    List<string> Issues,            // Human-readable issue descriptions
    string? CorrectedJson);         // AI-corrected JSON if refinement succeeded
```

**Verification checks:**

1. **Field coverage** — every PDF annotation ID must appear as a field in the definition
2. **Section coverage** — every bold/large text item should appear as a section title
3. **No orphans** — every field must be inside a section
4. **Structural validity** — JSON parses, has pages/sections/fields hierarchy
5. **Type consistency** — field types match annotation types (text→text, checkbox→checkbox, radio→radio)

**AI refinement loop:**

```
if (!result.Passed && iteration < 3):
    prompt = buildCorrectionPrompt(currentJson, rawResult, result.Issues)
    correctedJson = await aiService.GenerateAsync(prompt)
    result = verify(correctedJson, rawResult)  // recursive
```

### 5. Cross-Container Visual Verification (Optional Enhancement)

For visual diff verification, the API calls the running UI container:

```
POST http://forge-ui/api/verify-form-render
Body: { formDefinitionJson, sourceUrl }

UI container:
  1. Renders ComplianceFormRendererComponent with the JSON
  2. Takes screenshot
  3. Renders source PDF with ngx-extended-pdf-viewer
  4. Takes screenshot
  5. Computes SSIM similarity score
  6. Returns { score, screenshots }
```

This is a future enhancement — structural checks + AI refinement are the primary verification path.

---

## Docker Configuration

### API Container Changes

The Dockerfile adds Chromium for PuppeteerSharp:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime  # Not alpine (Chromium needs glibc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

**Note:** Alpine doesn't support Chromium well. The runtime base image changes from `aspnet:9.0-alpine` to `aspnet:9.0` (Debian-based). This increases image size by ~100-150MB but provides reliable Chromium support.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` | Path to Chromium binary in container |
| `PDF_EXTRACTION_MAX_ITERATIONS` | `3` | Max AI refinement iterations |
| `PDF_EXTRACTION_FIELD_COVERAGE_THRESHOLD` | `0.95` | Min field coverage to pass verification |
| `PDF_EXTRACTION_TEXT_COVERAGE_THRESHOLD` | `0.80` | Min text coverage to pass verification |

---

## Data Flow for Each Trigger

### Manual Extraction (Admin)

```
POST /api/v1/compliance-forms/{id}/extract-definition
  → ExtractFormDefinitionHandler
  → Downloads PDF → IPdfJsExtractorService.ExtractRawAsync
  → IFormDefinitionParser.Parse
  → IFormDefinitionVerifier.VerifyAsync (with AI refinement)
  → Store FormDefinitionVersion
```

### Template Sync (Hangfire)

```
SyncComplianceTemplateHandler
  → Downloads PDF, compares SHA-256 hash
  → If changed: IPdfJsExtractorService → Parser → Verifier → new version
```

### State Withholding (Lazy, On First Access)

```
GetMyStateFormDefinitionHandler
  → Check cached version in DB
  → If none: download state PDF → IPdfJsExtractorService → Parser → Verifier → cache
```

---

## File Structure

```
forge.core/Interfaces/
  IPdfJsExtractorService.cs              (NEW)
  IFormDefinitionParser.cs               (NEW)
  IFormDefinitionVerifier.cs             (NEW)

forge.core/Models/
  PdfExtractionResult.cs                 (NEW — raw pdf.js output model)
  FormVerificationResult.cs              (NEW)

forge.integrations/
  PdfJsExtractorService.cs              (NEW — PuppeteerSharp + pdf.js)
  MockPdfJsExtractorService.cs          (NEW — mock for dev/test)
  FormDefinitionParser.cs               (NEW — smart pattern parser)
  FormDefinitionVerifier.cs             (NEW — structural checks + AI loop)
  PdfFormExtractorService.cs            (DELETED)
  MockPdfFormExtractorService.cs        (DELETED)

forge.api/wwwroot/
  pdf-extract.html                       (NEW — bundled pdf.js extraction page)

forge.api/Dockerfile              (MODIFIED — add Chromium)
```

---

## Migration from PdfPig

1. New services created alongside existing `IPdfFormExtractorService`
2. Handlers updated to use new `IPdfJsExtractorService` + `IFormDefinitionParser` + `IFormDefinitionVerifier`
3. Old `IPdfFormExtractorService`, `PdfFormExtractorService`, `MockPdfFormExtractorService` deleted
4. PdfPig NuGet package removed from `forge.integrations.csproj`
5. Existing `FormDefinitionVersion` records in database remain valid — the JSON schema is unchanged

---

## Hardcoded Builders vs Generic Parser

The pipeline supports two extraction strategies, chosen automatically by `FormDefinitionBuilderFactory`:

| Strategy | When Used | Accuracy | Maintenance |
|----------|-----------|----------|-------------|
| **Hardcoded Builder** | Known federal forms (W-4, I-9) | Pixel-perfect — hand-tuned labels, layouts, validations | Must update when IRS changes the form |
| **Generic Parser** | Unknown/new forms, state forms | Good — pattern-based inference from PDF structure | Zero maintenance, lower fidelity |

```csharp
var builder = builderFactory.TryGetBuilder(template.FormType);
if (builder is not null)
    json = builder.Build(rawResult);   // Hardcoded path
else
    json = formParser.Parse(rawResult, formType);  // Generic path
```

Both strategies receive the same `PdfExtractionResult` from pdf.js. Builders use it to map real PDF annotation IDs to their hardcoded field definitions. The generic parser infers everything from the raw data.

---

## W-4 Builder — Deep Dive (`W4FormDefinitionBuilder.cs`)

The W-4 builder is ~900 lines of hand-tuned C# that produces a `ComplianceFormDefinition` JSON matching the IRS Form W-4 (2026) at near pixel-perfect fidelity. It is the reference implementation for all government form builders.

### Architecture

```
W4FormDefinitionBuilder.Build(PdfExtractionResult raw)
  │
  ├─ PdfMetricsCalculator.Compute(raw)    → Base CSS metrics from PDF analysis
  ├─ Override with hand-tuned values       → ~60 CSS custom properties
  │
  ├─ BuildPage1(raw)     → Employee's Withholding Certificate (fillable)
  │     ├─ BuildFormHeader()
  │     ├─ BuildStep1(raw)     → Personal info grid (name, SSN, address)
  │     ├─ BuildTipAndGating()  → TIP block + filing status instructions
  │     ├─ BuildStep2(raw)     → Multiple Jobs (checkbox + instructions)
  │     ├─ BuildStep3(raw)     → Dependents (amount lines 3a, 3b, total)
  │     ├─ BuildStep4(raw)     → Other Adjustments (4a, 4b, 4c)
  │     ├─ BuildExemptRow(raw) → Exempt checkbox + instructions
  │     ├─ BuildStep5(raw)     → Signature + date
  │     ├─ BuildEmployersOnly(raw) → Employer name/address/EIN/dates
  │     └─ BuildFormFooter()
  │
  ├─ BuildPage2()         → General Instructions (read-only HTML)
  ├─ BuildPage3(raw)      → Multiple Jobs Worksheet (fillable lines 1-4)
  ├─ BuildPage4(raw)      → Deductions Worksheet (fillable lines 1-5)
  └─ BuildPage5()         → Tax Tables (read-only HTML)
```

### Annotation Mapping

The builder bridges its hardcoded field structure to real PDF annotation IDs using `AnnotationMapper`:

```csharp
// Look up annotation by its ID pattern (e.g., "f1_01" for first name)
var firstName = Ann(raw, 1, "f1_01") ?? "w4_firstName";

// Ann() is a helper that calls AnnotationMapper.FindByName()
// Falls back to a synthetic ID if the annotation isn't found
```

`AnnotationMapper` provides three lookup strategies:
- **By name/ID pattern** — regex on annotation `id` or `fieldName` (preferred)
- **By position** — rectangular region on a page (fallback for unlabeled fields)
- **By type in region** — all checkboxes/radios within a bounding box

This means the same builder works even if the IRS renumbers annotations in a new PDF revision — the fallback synthetic IDs keep the form functional.

### CSS Custom Properties

The builder sets ~60 CSS custom properties that the frontend `ComplianceFormRendererComponent` consumes as CSS variables. These are split into two layers:

1. **Auto-computed** (`PdfMetricsCalculator.Compute`) — font tiers, line heights, step label widths measured from the actual PDF text items
2. **Hand-tuned overrides** — pixel-perfect values reverse-engineered from the source PDF at 100% zoom

Key measurement categories:

| Category | Examples | Purpose |
|----------|----------|---------|
| Font sizes | `gov-font: 9px`, `gov-font-sm: 7px`, `gov-font-title: 16px` | Match IRS form typography exactly |
| Line heights | `gov-line-height: 1.15`, `gov-line-height-tight: 1.1` | Dense text spacing matches PDF |
| Layout | `gov-step-label-pct: 14%`, `gov-amount-col-width: 155px` | Step sidebar and amount column sizing |
| Borders | `gov-border-heavy: 2px`, `gov-border-normal: 1px` | IRS form border weights |
| Element sizes | `gov-input-height: 18px`, `gov-checkbox-size: 10px` | Field dimensions match PDF form fields |
| Signature | `gov-signature-font-size: 18px`, `gov-signature-height: 28px` | Cursive signature preview sizing |
| Colors | `gov-shading-color: rgba(200, 215, 235, 0.2)` | Blue shading on alternating steps |

### PdfMetricsCalculator

Auto-computes CSS metrics from raw PDF data without any form-specific knowledge:

1. **Font tier analysis** — groups all text items by font size (rounded to nearest 0.5pt), identifies body (most frequent), title (largest in top 15%), step number (bold "Step N:" pattern), small (most frequent below body), and large (biggest non-title)
2. **PDF-to-CSS conversion** — converts PDF points to CSS pixels at 96 DPI (`1pt ≈ 1.333px`)
3. **Line height** — computes median ratio of vertical spacing between adjacent body-font text items
4. **Step label width** — measures rightmost extent of bold "Step N:" text as percentage of page width

### Section Layout Types

Each section in the JSON carries a `layout` property that tells the renderer which template to use:

| Layout | Purpose | W-4 Usage |
|--------|---------|-----------|
| `form-header` | 3-column header (form number / title / OMB number) | Page 1 top banner |
| `step` | Step sidebar (number + name) with content area | Steps 1–5 |
| `step-amounts` | Step with right-aligned amount column | Steps 3, 4 |
| `tip` | Highlighted instruction block | TIP box between Steps 1–2 |
| `exempt` | Horizontal split label + content | Exempt from withholding row |
| `sign` | Signature + date with heavy bottom border | Step 5 |
| `employers-only` | Read-only employer section | Employers Only block |
| `form-footer` | Footer with Cat. No., form revision | Page 1 footer |
| `instructions` | Read-only HTML content block | Pages 2, 5 |
| `worksheet` | Numbered worksheet lines with amount fields | Pages 3, 4 |

### Field Layout Types

Individual fields carry `fieldLayout` metadata for rendering:

| Field Layout | Purpose | Example |
|-------------|---------|---------|
| `grid-cell` | Positioned in CSS grid within a step | Name, SSN, address fields |
| `amount-line` | Right-aligned dollar amount with dot leaders | Lines 3(a), 4(a), etc. |
| `amount-line-inner` | Sub-item amount indented from main amount column | Within Step 4 |
| `amount-line-total` | Bold total amount line | Line 3 total |
| `filing-status` | Radio group with square checkboxes | Single/Married/HoH |
| `checkbox-dots` | Standalone checkbox with dot leader text | Step 2 checkbox |
| `signature-field` | Signature text input with cursive preview | Step 5 signature |
| `signature-date` | Date picker next to signature | Step 5 date |
| `worksheet-line` | Numbered line with text + amount input | Worksheet pages |

### W-4 Page Structure

**Page 1** — Employee's Withholding Certificate (the main fillable page)
- Form header (W-4 / title / OMB)
- Step 1: Personal Information — CSS grid (3 columns: `2fr 1fr 1fr`) with name, last name, SSN, address, city/state/zip, filing status radio group
- TIP block — bold highlighted instruction text
- Step 2: Multiple Jobs — checkbox with descriptive text, instructions with conditional worksheet reference
- Step 3: Claim Dependents — two amount lines (3a qualifying children × $2,300, 3b other dependents × $500) + total
- Step 4: Other Adjustments — three sub-amount lines (4a other income, 4b deductions, 4c extra withholding)
- Exempt from Withholding — checkbox + instructions
- Step 5: Sign Here — typed signature with cursive preview + date picker
- Employers Only — read-only employer info section
- Footer — Cat. No., form revision, irs.gov URL

**Page 2** — General Instructions (read-only)
- HTML content rendered from the IRS instruction text
- Covers: specific instructions for each step, privacy notice, paperwork reduction notice

**Page 3** — Multiple Jobs Worksheet (fillable)
- 4 numbered worksheet lines with instructions + amount inputs
- Tax table reference instructions

**Page 4** — Deductions Worksheet (fillable)
- 5 numbered lines for computing deductions
- References standard deduction amounts for each filing status

**Page 5** — Tax Tables (read-only)
- Higher Paying Job annual wages table
- Lower Paying Job annual wages table
- Head of Household table
- Married Filing Jointly table

---

## ComplianceFormDefinition JSON Schema

The JSON schema used by both builders and the generic parser:

```typescript
interface ComplianceFormDefinition {
  formType: string;           // "W4", "I9", "StateWithholding"
  title: string;              // Display title
  formNumber: string;         // "Form W-4"
  revision: string;           // "2026"
  agency: string;             // Issuing agency
  formLayout: 'default' | 'government';  // Rendering mode
  maxWidth?: string;          // "850px" — centered constraint
  formStyles?: Record<string, string>;   // CSS custom properties

  pages: FormPage[];          // Multi-page forms (tabbed in UI)
}

interface FormPage {
  id: string;
  title: string;
  readonly?: boolean;         // Display-only pages (instructions, tables)
  sections: FormSection[];
}

interface FormSection {
  id: string;
  title: string;
  layout?: string;            // Section layout type (see table above)
  shaded?: boolean;           // Blue background
  stepNumber?: string;        // "Step 1:"
  stepName?: string;          // "Enter\nPersonal\nInformation"
  gridColumns?: string;       // CSS grid template
  amountColumnWidth?: string; // Right-side amount column
  heavyBorder?: boolean;      // 2px bottom border
  fields: FormFieldDefinition[];
}

interface FormFieldDefinition {
  id: string;                 // Maps to PDF annotation ID (e.g., "f1_01")
  type: string;               // text, number, currency, ssn, date, checkbox, radio, signature, html
  label: string;
  fieldLayout?: string;       // Field layout type (see table above)
  amountLabel?: string;       // "3(a)" — shaded column label
  gridColumn?: string;        // CSS grid placement
  gridRow?: string;
  required?: boolean;
  maxlength?: number;
  mask?: string;              // "ssn", "phone", "zip"
  placeholder?: string;
  prefix?: string;            // "$" for currency
  suffix?: string;
  options?: { value: string; label: string; hint?: string }[];
  html?: string;              // Rich content for html-type fields
  displayText?: string;       // Plain text display within a step
  checkboxStyle?: 'circle' | 'square';
  autocomplete?: string;      // HTML autocomplete attribute
}
```

---

## Frontend Rendering (`ComplianceFormRendererComponent`)

The renderer in `forge-ui/src/app/features/account/components/compliance-form-renderer/` consumes the JSON and produces a pixel-accurate HTML/CSS reproduction.

### Rendering Strategy

When `formLayout === 'government'`, the renderer switches from Material Design wrappers to native HTML elements styled with CSS custom properties:

| JSON Layout | Rendered As |
|------------|------------|
| `form-header` | 3-column CSS grid (left/center/right) with form number, title, OMB |
| `step` | 2-column layout: step label sidebar (fixed %) + content area |
| `step-amounts` | Same as `step` but with right-aligned amount column |
| `grid-cell` | CSS grid cell positioned by `gridColumn`/`gridRow` |
| `amount-line` | Flex row: label text + dot leaders + `$` prefix + `<input>` |
| `filing-status` | Vertical radio group with square checkboxes (not Material radio) |
| `signature-field` | Text input that displays typed name in cursive (`Brush Script MT, Dancing Script`) |
| `html` | Raw `innerHTML` rendering (for instructions, tips, footnotes) |

### Form State Management

- **Single `FormGroup`** spans all pages — validation works across tabs
- **Per-page model maps** — each tab renders only its own section's controls via `sectionsToModels()`
- **`complianceDefinitionToModels()`** converts the full JSON definition into `DynamicFormModel[]` for ng-dynamic-forms
- **`normalizeFormPages()`** normalizes flat `sections` definitions into `pages[]` array
- **`initialData`** input pre-fills the form from saved `formDataJson` (draft or completed)
- **Read-only pages** (instructions, tables) are detected automatically — no interactive controls rendered

### Government Form CSS Architecture

The `.gov-form__*` CSS classes in `compliance-form-renderer.component.scss` consume the CSS custom properties set by the builder:

```scss
.gov-form__body {
  font-size: var(--gov-font);
  line-height: var(--gov-line-height);
}
.gov-form__step-label {
  width: var(--gov-step-label-pct);
}
.gov-form__amount-col {
  width: var(--gov-amount-col-width);
}
.gov-form__input {
  height: var(--gov-input-height);
  padding: var(--gov-input-padding);
}
```

This means the same component renders any government form — the builder controls all visual properties via CSS custom properties, and the renderer is form-agnostic.

---

## Visual Verification Pipeline

After extraction, a non-blocking background task compares the rendered form against the source PDF:

```
ExtractFormDefinitionHandler
  │
  └─ Fire-and-forget: CompareFormRenderingCommand
       │
       ├─ Render source PDF pages as PNG (PuppeteerSharp + pdf.js)
       ├─ Render form definition as PNG (PuppeteerSharp + headless Angular)
       │     └─ Navigates to http://forge-ui/__render-form
       │        Injects formDefinitionJson, captures page screenshots
       │
       ├─ Compare each page pair (SkiaImageComparisonService)
       │     ├─ Convert to grayscale, resize to match
       │     ├─ Content density comparison (dark pixel ratio delta)
       │     ├─ Block-based SSIM-lite (16×16 pixel blocks)
       │     └─ Optional: Ollama vision semantic comparison
       │
       └─ Store results on FormDefinitionVersion
             ├─ visual_similarity_score (double)
             ├─ visual_comparison_passed (bool, threshold ≥ 0.55)
             └─ visual_comparison_json (detailed per-page results)
```

The visual comparison is informational — a low similarity score doesn't block the form definition. It helps admins identify rendering issues (missing fields, wrong layout, broken CSS).

---

## Auto-Extraction on Startup

Templates with `IsAutoSync = true` and a `SourceUrl` are automatically extracted on app startup if they have no `FormDefinitionVersion` records. This runs in `Program.cs` after seeding:

```csharp
var templatesNeedingExtraction = await db.ComplianceFormTemplates
    .Where(t => t.IsAutoSync && t.SourceUrl != null && !t.FormDefinitionVersions.Any())
    .ToListAsync();

foreach (var tmpl in templatesNeedingExtraction)
    await mediator.Send(new ExtractFormDefinitionCommand(tmpl.Id));
```

This ensures employees see fillable forms immediately after first deployment — no manual admin action required. Extraction failures are logged as warnings; admin can retry manually from the Compliance tab.

---

## Adding a New Form Builder

To add a hardcoded builder for a new form (e.g., a new state form):

1. Create `Builders/{FormType}FormDefinitionBuilder.cs` implementing `IFormDefinitionBuilder`
2. Set `FormType` property to the matching `ComplianceFormType` enum value
3. Implement `Build(PdfExtractionResult raw)`:
   - Call `PdfMetricsCalculator.Compute(raw)` for base metrics
   - Override with hand-tuned CSS properties
   - Use `AnnotationMapper` to map fields to real PDF annotation IDs
   - Return serialized JSON matching the `ComplianceFormDefinition` schema
4. Register in DI — `FormDefinitionBuilderFactory` auto-discovers all `IFormDefinitionBuilder` implementations via constructor injection

The factory resolves builders by `ComplianceFormType`, falling back to the generic parser when no builder exists.

---

## Future: Database Field Mapping (Batch)

> Planned for a later phase.

Automatic mapping of form field IDs to database columns. A batch process that:
1. Analyzes field labels and types from the `ComplianceFormDefinition`
2. Matches to `ApplicationUser` / `ComplianceFormSubmission` columns
3. Enables auto-population of known fields (name, SSN, address) from employee profile
4. Enables auto-extraction of submitted data into structured database columns
