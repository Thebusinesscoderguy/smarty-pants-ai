# Add 4 EduCore-gap features

Big scope, so here's the plan before I touch anything. All four ship in one build session, gated behind School Admin / Teacher roles.

---

## 1. Attendance

### DB (one migration)
- `attendance_records` — `student_id`, `section_id`, `date`, `period` (nullable, for period-based), `status` (`present` | `absent` | `late` | `excused`), `notes`, `marked_by`, `marked_at`. Unique on (student, date, period).
- `attendance_settings` per school — `mode` (`daily` | `period`), `periods_per_day`.
- RLS: students see own; parents see own children; teachers see their assigned sections; school admin sees their school.

### UI
- New tab under **Academics** → "Attendance".
- `AttendanceMarker.tsx` — pick section + date, grid of students with P/A/L/E buttons, bulk "Mark all present".
- `AttendanceReport.tsx` — per-student % attendance, monthly heatmap, absence list.
- Surface attendance % on the student dashboard + parent monitoring page.

---

## 2. Official Report Cards

### DB
- `report_cards` — `student_id`, `term` (`Term 1` | `Term 2` | `Term 3` | `Final`), `academic_year`, `generated_at`, `data` (jsonb snapshot of grades/attendance/comments), `pdf_url`, `published` bool, `principal_signature_url`.
- `report_card_settings` per school — letterhead URL, principal name, school name/address, grading scale, term dates.

### Edge function: `generate-report-card`
- Pulls grades from `gradebook_entries` (weighted to 100), attendance % for the term, teacher comments, computes GPA + class rank.
- Generates a PDF using `jspdf` client-side (matches the existing `PDFStudyPlanButton` pattern) — letterhead, student photo, subject table, attendance, comments, signature line.

### UI
- `ReportCardManagement.tsx` under Academics — generate per-section, preview, publish to parents.
- Parent/student sees published report card in their dashboard with download button.

---

## 3. Bulk Import / Export

### Already exists
- `BulkStudentImport.tsx` — keep, extend.

### Add
- `BulkTeacherImport.tsx` — CSV: name, email, subjects, sections.
- `BulkGradeImport.tsx` — CSV: student_email, subject, assessment_name, score.
- **Export buttons** on Students, Teachers, Gradebook, Attendance, Report Cards → CSV download.
- Unified `ImportExportCenter.tsx` under Settings tab with downloadable CSV templates for each entity.
- Migration helper note: "Coming from EduCore? Map your export columns to our template."

### Tech
- Use `papaparse` for CSV parsing (already common, will add if missing).
- Server-side validation per row, return error report with row numbers.

---

## 4. Role-Based Permissions (expanded)

### Current
- `user_role` enum: `teacher`, `parent`, `student` (+ school admin via `school_accounts.admin_user_id`).

### Add
- New enum values: `principal`, `vice_principal`, `registrar`, `accountant`.
- `school_staff` table — `school_id`, `user_id`, `role`, `permissions` (jsonb override), `is_active`.
- `has_school_role(_user_id, _school_id, _role)` security-definer function.
- Permission matrix (default per role):
  - **Principal** — everything except billing
  - **Vice Principal** — academics + people, no billing/settings
  - **Registrar** — students, sections, attendance, report cards (no grades edit)
  - **Accountant** — billing + fees only
  - **Teacher** — already scoped
- `RoleGuard` component wraps tabs/buttons; `useSchoolPermissions()` hook.

### UI
- Under Settings → "Staff & Permissions" tab to invite staff with role.
- Update `SchoolAdmin.tsx` to filter the group bar based on `useSchoolPermissions()`.

---

## Execution order
1. Migration (all 4 schema changes in one) → wait for approval.
2. Attendance (DB done, build UI + edge nothing needed).
3. Report Cards (edge function + UI).
4. Bulk import/export (frontend + papaparse).
5. RBAC wiring (hook + guards + staff invite UI).

## Out of scope (call out now)
- Timetable/scheduling — not in this batch.
- Fees/finance module — accountant role exists but fee tables come later.
- WhatsApp/SMS notifications — later.
- The report card PDF will use the standard letterhead upload — no per-school custom layout editor in v1.

Ready to run the migration on approval.
