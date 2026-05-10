# Add #7 Homework & Assignments + #12 Custom Report Card Designer

Two modules, one build session. Both gated behind School Admin / Teacher.

---

## 1. Homework & Assignments

Distinct from quizzes: due dates, file submissions, written feedback, late tracking.

### DB (one migration)
- `assignments` — `school_id`, `section_id`, `subject_id` (nullable), `created_by` (teacher), `title`, `description` (rich text), `due_date`, `total_points`, `attachment_urls` (text[]), `allow_late`, `late_penalty_pct`, `published`, `created_at`.
- `assignment_submissions` — `assignment_id`, `student_id`, `submitted_at`, `content` (text), `attachment_urls` (text[]), `status` (`draft` | `submitted` | `late` | `graded`), `score`, `feedback`, `graded_by`, `graded_at`. Unique `(assignment_id, student_id)`.
- Storage bucket `assignments` (private). RLS: students see/upload own; teachers see their section's; admin sees school's.

### UI
- **Teacher view** — `AssignmentManagement.tsx` under Academics: create assignment (rich text + file upload + section picker + due date), list with submission counts, click into assignment → submission grid with inline grade + feedback.
- **Student view** — `HomeworkList.tsx` already exists; extend it to show new `assignments`, with a submit modal (text + file upload).
- **Parent view** — surface "Pending homework" + "Late assignments" on monitoring dashboard.
- Notifications: row in `notifications` (already exists) on assign/grade.

---

## 2. Custom Report Card Designer

Replace the fixed `jsPDF` template with a per-school configurable layout.

### DB
- Extend `report_card_settings` (already exists) with:
  - `layout_config` jsonb — sections array describing what to render
  - `header_logo_url`, `footer_text`, `accent_color`, `font_family`
  - `grading_scale` jsonb (already noted in plan, formalize: `[{min:90,letter:'A',gpa:4.0}, ...]`)
- New `report_card_templates` — `school_id`, `name`, `is_default`, `layout_config` (so a school can save multiple templates, e.g. K-5 vs 6-12).

### Layout config schema
```jsonc
{
  "sections": [
    { "type": "header", "show_logo": true, "show_school_name": true, "show_term": true },
    { "type": "student_info", "fields": ["name","grade","section","photo","student_id"] },
    { "type": "subjects_table", "columns": ["subject","score","letter","comments"], "show_weighted": true },
    { "type": "attendance", "show_breakdown": true },
    { "type": "behavior", "enabled": false },
    { "type": "comments", "label": "Principal's Remarks" },
    { "type": "signature", "lines": ["Principal","Class Teacher","Parent"] }
  ],
  "style": { "accent": "#f97316", "font": "helvetica", "page_size": "a4" }
}
```

### UI — `ReportCardDesigner.tsx` (new tab under Academics → Report Cards)
- Two-pane editor: left = section list (drag to reorder via `@dnd-kit/sortable`, toggle on/off, edit per-section options), right = live preview using a React-rendered version of the same layout.
- Top bar: template selector, "Save as default", "New template", upload logo, accent color picker.
- "Generate sample" button renders a dummy student to PDF for testing.

### PDF generation update
- Refactor existing `downloadPdf` / `downloadAllPdf` in `ReportCardManagement.tsx` into a shared `lib/reportCardPdf.ts` that takes `(card, settings, layout_config)` and walks the sections array.
- Each section type has a renderer function. Unknown types skipped gracefully.
- Same renderer used for live preview (HTML) and PDF (jsPDF) — keeps WYSIWYG honest.

---

## Execution order
1. Migration for both (assignments + submissions tables, report_card_templates, extend report_card_settings) — wait for approval.
2. Storage bucket `assignments` + RLS.
3. Homework: teacher management UI + student submit flow + parent surfacing.
4. Report Card Designer: shared renderer lib → designer UI → wire into existing generate/download.

## Out of scope
- Plagiarism detection (call out as future).
- Per-student custom report card overrides (school-level templates only in v1).
- Drag-resize of sections — reorder + toggle only.
- Rubric-based grading on assignments — single score + free-text feedback only.

Ready to run the migration on approval.
