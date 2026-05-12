# Dialog Controls — Spatial Guide

All dialogs in Forge share the same layout structure.

## Universal Dialog Layout

```
┌─────────────────────────────────────┐
│  Dialog Title              [X Close] │  ← Top of dialog
├─────────────────────────────────────┤
│  Form fields (scroll if tall)        │  ← Body
│  ┌──────────┐  ┌──────────┐          │
│  │ Field 1  │  │ Field 2  │          │  ← 2-column rows
│  └──────────┘  └──────────┘          │
│  ┌────────────────────────┐          │
│  │ Full-width field       │          │
│  └────────────────────────┘          │
├─────────────────────────────────────┤
│              [Cancel]  [Save/Create] │  ← Footer (right-aligned)
└─────────────────────────────────────┘
```

## Finding Controls Inside Dialogs

| What you want | Where to look |
|:--------------|:--------------|
| Close the dialog | **X button** in the top-right corner of the dialog header |
| Save/Create | **Blue primary button** in the bottom-right corner of the dialog |
| Cancel | Button to the **left** of the primary button, bottom-right area |
| Scroll through fields | The dialog body scrolls — **scroll down** if you cannot see all fields |
| Select a date | Click the **calendar icon** on the right side of a date field |
| Select from a dropdown | Click the **chevron/arrow** on the right side of a select field |
| Upload a file | Look for a **dashed upload zone** or the `upload_file` icon |
| Validation errors | **Hover over the disabled Save button** — a popover shows what fields are missing |

## Key Dialog Variants

### Confirm / Destructive Action Dialog
- Smaller dialog (~400px wide)
- Shows a warning message in the body
- Confirm button is **red** for destructive actions (Delete, Archive)
- Located: center of screen, overlays the page

### Form Dialogs (Create/Edit)
- Wider dialogs (520–800px)
- Two-column layout for short fields, full-width for long fields
- Required fields are marked with `*` in the label

### File Upload Dialogs
- Drop zone in the center of the dialog body
- "Click to browse" text — clicking opens the OS file picker
- After upload: file list appears below the drop zone
