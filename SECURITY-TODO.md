# Security TODO

Tracked follow-ups from the security hardening pass (2026-06-13). Items here are
deferred fixes that were intentionally NOT applied yet, with enough context to
pick them up later.

## student-avatars bucket — full privacy (deferred; Option B)

**Status:** deferred. The quick mitigation (Option A) is already applied — the
`student-avatars` bucket no longer allows anonymous listing/enumeration (the
public `SELECT` policy on `storage.objects` was replaced with an
authenticated-scoped one in migration `restrict_student_avatars_listing`).

**Still open:** the bucket remains `public = true`, so individual avatar objects
are still downloadable by anyone who knows/guesses the path
(`{studentId}/avatar.{ext}` — student IDs are not secret). The proper fix is to
make the bucket private and serve avatars via short-lived signed URLs.

**Why it wasn't done now:** it's a real refactor with non-trivial blast radius,
not a config flip. Required work:

1. Set the bucket private: `update storage.buckets set public = false where id = 'student-avatars';`
2. Upload path — `src/components/admin/StudentManagement.tsx` (~L256-272): stop
   persisting `getPublicUrl(...)` into `profiles.avatar_url`; store the bare
   object path instead.
3. Render sites — switch from `<img src={avatar_url}>` to minting a
   `createSignedUrl(path, ttl)` at load time (the `assignments` bucket already
   does this in `AssignmentManagement.tsx` / `HomeworkSubmissionsDrawer.tsx`).
   Affected files:
   - `src/components/admin/StudentManagement.tsx`
   - `src/components/admin/GradeBook.tsx`
   - `src/components/admin/gradebook/AttendanceTab.tsx`
   - `src/components/admin/gradebook/SemesterMarksTab.tsx`
   - `src/components/admin/gradebook/SemesterSummaryTab.tsx`
4. One-time data migration: convert existing full public URLs stored in
   `profiles.avatar_url` into bare paths.
5. Add `storage.objects` SELECT RLS scoping who may read each avatar
   (owner / parent / school staff).

## Other deferred items (owner to action, outside DB-migration scope)

- **Auth config (manual, dashboard):** enable leaked-password protection and set
  email OTP expiry to 1800s. (Done manually by repo owner — verify.)
- **Postgres patch upgrade:** `supabase-postgres-15.8.1.093` has outstanding
  security patches. Schedule an in-place 15.x patch during a low-traffic window
  outside exam periods (the every-minute `exam-auto-submit-expired` cron and live
  `exam_sessions` are the timing-sensitive pieces).
