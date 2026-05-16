
# Step 4 — Finish Homework + Report Card Designer

The two modules are ~70% built. Designer, generator, PDF renderer, AI grading inbox, and student homework list already work. This step closes the remaining gaps so a school can actually run a term end-to-end.

## Gaps found

**Homework**
- Students can only submit text — no file attachments (photos of handwritten work, PDFs).
- Teachers have no per-assignment submission viewer in `HomeworkManagement` (they see counts only). Manual grading lives in a separate `GradingInbox` and only handles AI-graded items.
- No "remind students" / due-date nudge.

**Report Cards**
- Parents and students cannot view their published report cards anywhere in the app.
- Teachers cannot edit per-student remarks before publishing — comments are blank unless typed via raw JSON.
- No AI assist for principal/teacher remarks (the unique pillar-1 differentiator from the strategy doc).

## Plan

### 1. Homework — file uploads
- Use existing `assignments` storage bucket.
- Extend `HomeworkList` (student view) with a file picker that uploads to `assignments/{user_id}/{assignment_id}/{filename}`, stores the path in `response_data.attachments[]` alongside text.
- Render attachment links in the teacher submissions drawer (next item).
- Add storage RLS so students can write to their own folder and teachers/admins of the same school can read.

### 2. Homework — teacher submission viewer + manual grade
- New component `HomeworkSubmissionsDrawer` opened from a "View" button on each row in `HomeworkManagement`.
- Lists all students in the assigned section with: status badge (not submitted / submitted / ai_graded / graded), text response, attachment links, AI score & feedback if present.
- Inline score + feedback inputs; "Save grade" updates `homework_submissions` to `status='graded'`.
- Bulk "Approve all AI grades" button at the top.

### 3. Report Card Designer — per-student remarks + AI assist
- In `ReportCardManagement`, add an "Edit" button per row → small dialog to edit `data.comments` (and tweak overall/subjects if needed).
- "Generate with AI" button calls a new edge function `generate-report-card-remarks` that takes the student's subjects, attendance, and term, and returns a 2-3 sentence professional remark in the school's primary language. Uses Lovable AI Gateway (`google/gemini-2.5-flash`).
- Saves back to `report_cards.data.comments`.

### 4. Parent/Student-facing report card view
- New route `/report-cards` (lazy-loaded page).
- For students: lists their own published report cards (`report_cards` where `student_id = auth.uid()` and `published = true`).
- For parents: lists published cards for each linked child (via `parent_children`).
- Each row has "Download PDF" using the existing `renderReportCardToPdf` + the school's saved `report_card_settings.layout_config`.
- Add nav entry in `AppSidebar` / mobile bottom nav under "Progress" section, visible only when at least one published card exists.

### 5. Small polish
- Show due-date countdown chip ("Due in 2 days" / "Overdue") on `HomeworkList` items.
- Show submission count vs total assigned in `HomeworkManagement` (e.g. `12 / 24`).
- "Notify parents" toggle on report card publish — fires existing `send-parent-weekly-digest` style edge function (new lightweight one: `send-report-card-published`) that emails each parent a "Report card available" link.

## Technical details

**DB / migration (one migration)**
- No new tables — `report_cards` and `homework_submissions` already cover this.
- Storage policies on `assignments` bucket:
  - INSERT: authenticated, path starts with `auth.uid()::text/`.
  - SELECT: owner OR same-school teacher/admin (via `is_school_admin_of` / `school_teachers` lookup on the assignment's `school_id`).
- RLS additions:
  - `report_cards`: SELECT for `student_id = auth.uid()` when `published = true`; SELECT for parents via `parent_children` join.

**Edge functions (new)**
- `generate-report-card-remarks` — input `{ student_name, subjects:[{subject,avg}], overall, attendance_rate, term, language }`, returns `{ remarks }`. JWT-verified.
- `send-report-card-published` — input `{ school_id, term, year }`. Iterates published cards, looks up parent emails via `parent_children` + `profiles`, sends Resend email with a deep link to `/report-cards`.

**Files to add**
- `src/components/admin/HomeworkSubmissionsDrawer.tsx`
- `src/components/admin/ReportCardEditDialog.tsx`
- `src/pages/ReportCards.tsx` (+ route in `App.tsx`)
- `supabase/functions/generate-report-card-remarks/index.ts`
- `supabase/functions/send-report-card-published/index.ts`

**Files to edit**
- `src/components/student/HomeworkList.tsx` — file upload + due-date chips.
- `src/components/admin/HomeworkManagement.tsx` — "View submissions" button, real submission counts.
- `src/components/admin/ReportCardManagement.tsx` — edit dialog hookup, "Notify parents" on publish.
- `src/components/AppSidebar.tsx` (+ mobile nav) — new "Report Cards" link for student/parent roles.

## Out of scope (intentionally)
- Rich-text editor for remarks (plain textarea is enough for v1).
- Per-subject teacher comments (one overall remark only).
- SMS notifications (email is fine for v1).
- Re-opening a published card (admin can republish via DB if needed).

Ready to implement?
