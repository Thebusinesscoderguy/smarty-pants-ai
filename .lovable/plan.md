
User wants both #5 (teacher daily grading loop) and #6 (parent weekly digest). Let me scope concisely.

**Existing infra to leverage:**
- `check-open-answer` edge function (semantic grading) — already exists
- `homework_assignments` + `homework_submissions` tables (saw in HomeworkList.tsx)
- `learning_progress_snapshots`, `learning_analytics`, `student_interactions` — exist
- `parent_child_relationships` — exists
- Resend already configured (RESEND_API_KEY present)
- pg_cron available (used elsewhere)
- School admin nav already collapsed with "More" — can add Grading tab

**What's needed:**

### Part 1: Teacher Grading Inbox
- New page/tab: "Grading Inbox" inside SchoolAdmin (or top-level for teachers)
- Edge function `auto-grade-homework` runs nightly via cron — finds all `homework_submissions` with status='submitted' and no AI grade, calls semantic grading per question/response, writes `ai_score`, `ai_feedback`, `ai_confidence` to submissions, sets status='ai_graded'
- Migration: add `ai_score`, `ai_feedback`, `ai_confidence`, `ai_graded_at` columns to `homework_submissions`
- UI: Card list of all ai_graded submissions, grouped by assignment, showing student name + AI score + confidence + suggested feedback. Bulk "Approve all" + per-row Approve/Override. On approve → status='graded', score=ai_score (or override), feedback=ai_feedback.
- Schedule cron at 2am daily

### Part 2: Parent Weekly Digest
- Edge function `send-parent-weekly-digest` — for each parent, for each child, aggregate last 7 days: lessons completed (user_progress), quizzes taken w/ avg score (quiz_attempts), top weak area (learning_analytics where strength_score<0.5), top strength
- React Email template `parent-weekly-digest.tsx` (transactional)
- Need email infra setup first — check if done. Looking at secrets: RESEND_API_KEY exists but no email infra tables visible. Will use Resend directly via gateway (simpler, already configured pattern in this project per memory: features use Resend).
- Actually — memory says "Supabase for auth, Resend for features." So use Resend directly, not Lovable Emails infra.
- Schedule cron Friday 4pm local-ish (UTC — pick 16:00 UTC)
- Add unsubscribe column `weekly_digest_enabled` boolean default true on profiles or a new `parent_email_preferences` table

### Migration needs:
1. ALTER `homework_submissions` add ai_score numeric, ai_feedback text, ai_confidence numeric, ai_graded_at timestamptz
2. CREATE `parent_email_preferences` (parent_id PK, weekly_digest_enabled bool default true, last_digest_sent_at timestamptz)
3. Two pg_cron jobs (insert via insert tool, not migration)

### Files to create:
- `supabase/functions/auto-grade-homework/index.ts`
- `supabase/functions/send-parent-weekly-digest/index.ts`
- `src/components/admin/GradingInbox.tsx`
- `src/hooks/useGradingInbox.ts`
- Add tab to SchoolAdmin nav
- Settings toggle for parents in ParentSettings

Keep plan tight.
