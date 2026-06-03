## Universal Import / Export System

Add a single, reusable Import/Export engine that plugs into every database-backed entity in the school admin (Gradebook, Teachers, Students, Sections/Classes, Subjects, Attendance, Report Cards, Homework, Assignments, Semester Marks, Daily Grades, Invoices, Fees, Question Bank). Every entity supports **CSV, XLSX, Excel-flavored .xls (read-only), PDF (export only / OCR-on-import), and Manual Entry**.

### 1. Core engine (new)

`src/lib/dataPortability/` — framework-agnostic core:
- `types.ts` — `EntityDescriptor { key, label, columns: ColumnDef[], fetch(schoolId), upsert(rows), pdfTemplate? }`
- `registry.ts` — central map of all importable/exportable entities
- `exporters/csv.ts` — existing logic, hardened
- `exporters/xlsx.ts` — `xlsx` (SheetJS) library, multi-sheet workbooks, styled headers
- `exporters/pdf.ts` — `jspdf` + `jspdf-autotable`, branded headers, page numbers (reuse pattern from `src/lib/reportCardPdf.ts`)
- `importers/csv.ts` — reuse existing parser
- `importers/xlsx.ts` — SheetJS read, auto-detect header row, per-sheet entity mapping
- `importers/pdf.ts` — text extraction via `pdfjs-dist` for table-shaped PDFs; falls back to "structure not detected, please use CSV/XLSX" message
- `validation.ts` — Zod schema per entity, row-by-row validation, returns `{ valid, errors: [{row, col, message}] }`

### 2. Reusable UI components (new)

`src/components/admin/data-portability/`:
- `DataPortabilityDialog.tsx` — single dialog with 3 tabs: **Import**, **Export**, **Manual Entry**
- `ImportPanel.tsx` — file dropzone (CSV/XLSX/XLS/PDF), column-mapping step (auto-mapped with manual override), preview first 10 rows, validation summary, dry-run / commit buttons
- `ExportPanel.tsx` — format radio (CSV/XLSX/PDF), column picker, optional filters (date range, section, grade), download button
- `ManualEntryPanel.tsx` — inline editable grid (TanStack-style table) for adding/editing rows directly, save on commit
- `ColumnMapper.tsx` — drag-to-map source column → target field
- `TemplateDownloadButton.tsx` — emits empty CSV + XLSX with headers + example row

### 3. Entity descriptors (new)

Register each entity in `registry.ts`:

| Entity | Source table | Key columns |
|---|---|---|
| Students | `profiles` + `school_student_relationships` | id, name, email, grade, section |
| Teachers | `school_teachers` | email, first_name, last_name, subjects |
| Sections (Classes) | `school_sections` | grade, label, capacity, room |
| Subjects | `school_subjects` | name, code, grade_level |
| Teacher↔Section | `teacher_subject_sections` | teacher_email, subject, section |
| Attendance | `attendance_records` + `student_attendance` | date, student, subject, status |
| Daily Grades | `student_daily_grades` | student, subject, date, score, weight |
| Semester Marks | `student_semester_marks` | student, subject, semester, project, literacy, final |
| Report Cards | `report_cards` | student, term, year, overall, published |
| Homework | `homework_assignments` + `homework_submissions` | title, subject, due, student, score |
| Assignments | `assignments` + `assignment_submissions` | title, due, student, score |
| Question Bank | `question_bank` | subject, type, question, choices, answer, difficulty |
| Invoices | `school_invoices` | student, amount, due, status |
| Fees | fee tables | category, amount, frequency |

### 4. Surface in existing UI

- **Rewrite** `src/components/admin/ImportExportCenter.tsx` to use the new engine: entity dropdown + `DataPortabilityDialog`
- Add a small **"⋯ Import/Export"** menu button to:
  - `GradeBook` tab header
  - `AttendanceTab` (current sub-tab in `gradebook/`)
  - `SemesterMarksTab`
  - Teachers admin tab
  - Students admin tab
  - Sections admin tab
  - Subjects admin tab
  - Question Bank
  - Report Cards page
  - Homework manager
  - Invoices / Fees
  Each opens the same dialog scoped to that entity.

### 5. PDF specifics

- **Export**: branded PDF — school logo (from `school_accounts`), title, generated date, paginated table (jspdf-autotable). Already proven pattern in `reportCardPdf.ts`.
- **Import**: parse with `pdfjs-dist`, detect tabular text by y-coordinate clustering. If detection confidence is low, show: *"PDF structure not auto-detected — please paste into the manual grid or upload CSV/XLSX."*

### 6. Manual entry

Inline editable grid (uses existing shadcn `Table` + controlled inputs). Add row, delete row, validate inline, batch save through the same `upsert` path importers use — single code path = single source of truth for validation.

### 7. Dependencies to add

- `xlsx` (SheetJS community build) — read/write Excel
- `jspdf-autotable` — already implied by `jspdf` usage; confirm
- `pdfjs-dist` — already in project (used in `pdfFirstPageToImage.ts`)
- Zod — already installed

### 8. Localization

Headers + dialog strings go through existing `translations.ts` (EN + AR). Exported PDFs render Arabic with the Arabic font already loaded in `reportCardPdf.ts`.

### 9. Security

- All upserts go through existing Supabase client with RLS — admins limited by `is_school_admin_of`, teachers by `teacher_subject_sections`
- File size cap: 10 MB
- Server-side validation NOT moved to edge functions in v1 (RLS already enforces auth); can be hardened later

### 10. Out of scope (v1)

- Live Google Sheets sync
- Scheduled / recurring exports
- Importing photos/avatars from XLSX (manual upload remains)
- OCR on scanned (non-text) PDFs — message tells the user to use CSV/XLSX

---

### Build order

1. Install `xlsx` + `jspdf-autotable`, scaffold `dataPortability/` core
2. Build `DataPortabilityDialog` with Students entity end-to-end (CSV + XLSX + PDF + manual)
3. Register remaining entities one-by-one
4. Wire the dialog into each admin sub-page
5. Replace `ImportExportCenter` with the unified entity-picker view
6. Translations + QA pass

Estimated: ~1 large iteration. Want me to proceed with the full build, or start with a smaller slice (e.g. Students + Teachers + Gradebook only) and expand after you see it working?