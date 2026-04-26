## Five-part hardening + polish plan

### 1. Landing page differentiation — lean into the school angle

Rework `src/pages/Index.tsx` so the hero and first three sections showcase what generic AI-edu tools (Khanmigo, MagicSchool) don't have:

- **Hero**: replace generic "AI tutor" copy with a principal-focused headline + a screenshot of the School Admin dashboard (already exists at `public/images/school-admin-dashboard.png`). CTA: "Book a school demo" + "Try it free".
- **"Built for schools" section**: 3-up feature cards using real screenshots — School Admin dashboard, Grade Book (100-pt weighted system), Exam Mode with anti-cheat.
- **Arabic / RTL section**: side-by-side EN ↔ AR screenshot of the same dashboard. One-line: "Full Arabic UI with RTL support — not Google-translated."
- **Comparison strip**: small table — Teachly vs Khanmigo vs MagicSchool — rows: School admin console, Gradebook, Arabic native, Exam Mode anti-cheat, Per-student classification.
- **Keep** existing pricing/FAQ links; **trim** generic AI-tutor marketing fluff.

No backend changes. Pure marketing/IA rework on `Index.tsx` plus 1–2 new small components in `src/components/landing/`.

### 2. Move Exam Mode anti-cheat to the backend

**Why this is urgent (RLS audit finding):** the current `exam_sessions` UPDATE policy lets a student set their own `score`, `percentage`, `flagged`, and `status`. A student can open devtools and `supabase.from('exam_sessions').update({ score: 100, flagged: false })`. Same for `test_attempts` insert. This must be fixed alongside the edge function move.

**New edge functions** (`verify_jwt = true`, validate caller via JWT):

- `exam-start` — creates the session row server-side after re-verifying `is_test_assigned_to_student`. Returns `session_id` + server `start_time` + a short-lived signed `session_token`.
- `exam-record-violation` — appends to `exam_violations`, recomputes `violation_count`/`flagged` from the count, and triggers auto-submit if threshold crossed.
- `exam-submit` — accepts answers only, grades server-side (reuses `check-open-answer` logic for short-answer), writes `exam_sessions` final fields + mirrors to `test_attempts`. Client never sends a score.
- `exam-heartbeat` — claims/refreshes a server-side tab lock (new `exam_session_locks` table: `session_id`, `tab_id`, `last_seen_at`). Returns `{ owner: true|false }` so the client knows if it's been kicked. This replaces the localStorage heartbeat.
- `exam-auto-submit-expired` (cron, runs every minute via `pg_cron` + `pg_net`) — finds `exam_sessions` where `status='in_progress'` AND `start_time + time_limit*interval < now()` and force-submits them with whatever answers were last saved.

**RLS migration** (the actual security fix):
- `exam_sessions`: drop the broad student UPDATE policy. Replace with: students may UPDATE only `answers` (last-saved draft) on their own `in_progress` sessions. All status/score/percentage/flagged transitions go through edge functions (use `SECURITY DEFINER` functions called from the edge).
- `exam_violations`: revoke direct INSERT from clients; only `service_role` (i.e. edge function) writes.
- `test_attempts`: tighten INSERT policy — only allow when there is a matching submitted `exam_sessions` row for that student+test, OR keep the current open path but only for non-exam tests (`tests.assessment_mode <> 'exam'`).
- New table `exam_session_locks` with RLS that lets students read their own lock row but only edge functions write.

**Frontend** (`src/pages/ExamRunner.tsx`):
- Replace direct `supabase.from('exam_sessions').insert/update` calls with `supabase.functions.invoke('exam-start' | 'exam-record-violation' | 'exam-submit')`.
- Replace localStorage heartbeat with a 3-second `exam-heartbeat` poll. If the server says we're no longer the owner, switch to the existing `duplicate` phase.
- Save answer drafts every 10s via the still-allowed `answers`-only UPDATE so the cron auto-submit has fresh data.

### 3. Consolidate monitoring dashboards

Pick **one canonical dashboard per role** and delete the rest:

| Role | Keep | Delete |
|---|---|---|
| Student | `components/monitoring/EnhancedStudentDashboard.tsx` | `components/monitoring/StudentDashboard.tsx`, the duplicate quiz-perf wrapper |
| Parent | `components/monitoring/ParentDashboard.tsx` | (already canonical — verify only one importer) |
| Admin/Teacher | `components/monitoring/ComprehensiveMonitoringDashboard.tsx` | inline duplicates inside `pages/Monitoring.tsx` if any |
| Quiz analytics | fold into `EnhancedStudentDashboard` as a tab | delete standalone `QuizPerformanceAnalytics.tsx` |

Steps:
1. `rg` every import of the to-delete components, redirect to the canonical one (props may need a small adapter).
2. Move any unique widgets (charts, KPI cards) the deleted files have into `src/components/monitoring/widgets/` so nothing is lost.
3. Delete the orphaned files and any now-unused hooks (`useMonitoring` vs `useMonitoringData` vs `useUnifiedMonitoring` — keep `useUnifiedMonitoring` only).
4. Update `pages/Monitoring.tsx` to render the canonical dashboard based on role.

### 4. Quiz component consolidation

Create one engine + one runner:

- **New `src/hooks/useQuizEngine.ts`** — single source of truth for: load questions, randomize, track answers, score (MC/TF locally, short-answer via `check-open-answer`), submit to `quiz_attempts`. Replaces the per-component logic currently duplicated in `QuizTaker`, `AdaptiveQuizEngine`, `EnhancedQuizGenerator`, `QuizFromConversation`.
- **New `src/components/quiz/QuizRunner.tsx`** — single presentational runner with props: `mode: 'standard' | 'adaptive' | 'exam'`, `questions`, `onComplete`. `ExamRunner.tsx` keeps its anti-cheat shell but delegates question rendering to `QuizRunner`.
- **Keep** as thin wrappers: `QuizGenerator` (creation UI), `QuizLibrary` (listing), `QuizFromConversation` (entry point). Each just generates questions then opens `QuizRunner`.
- **Delete**: `EnhancedQuizGenerator` (merge useful bits into `QuizGenerator`), the standalone `AdaptiveQuizEngine` component (logic moves into `useQuizEngine` with `mode='adaptive'`).
- **Delete**: `useQuizMode`, `useAdaptiveQuiz` after their logic lands in `useQuizEngine`.

This is a refactor, not a behavior change — manual smoke test path: generate quiz → take quiz → adaptive quiz → quiz from conversation → exam mode.

### 5. RLS / security audit fixes

Linter + manual policy review surfaced these. A migration will fix all of them in one pass:

- **CRITICAL — exam_sessions UPDATE too broad** (covered in #2): students can rewrite their own score. Restrict UPDATE to the `answers` column only via column-level grant + a trigger that blocks non-`answers` changes from non-service-role callers.
- **CRITICAL — test_attempts INSERT unguarded for exams**: add a policy/trigger ensuring exam-mode tests can only get an attempt row written by the edge function (service role).
- **exam_violations INSERT**: revoke from `authenticated`, allow only `service_role`.
- **2× SECURITY DEFINER views** (linter ERRORs 1–2): identify the views, drop SECURITY DEFINER or convert to security-invoker views. Will check via `pg_views` in migration.
- **4× functions with mutable `search_path`** (linter WARNs 3–6): add `SET search_path = public` to each.
- **Extension in public schema** (linter WARN 8): move to `extensions` schema if it's user-installed (e.g. `pg_net`, `pg_cron`); leave alone if it's a Supabase-managed one we depend on.
- **RLS "always true" policies** (linter WARNs 9–12+): list them, replace `USING (true)` / `WITH CHECK (true)` on UPDATE/DELETE/INSERT with proper ownership checks. Will enumerate in the migration after a targeted query.
- **Cross-school leakage check**: verify every policy on `tests`, `test_questions`, `quizzes`, `quiz_attempts`, `student_classifications`, `school_news`, `gradebook_*` joins to a school the caller belongs to. Add missing checks.

A follow-up `supabase--linter` run after the migration must show 0 ERRORs and only acceptable WARNs.

---

### Suggested execution order

1. **#5 RLS fixes + #2 backend** in the same migration + edge function batch (they are entangled — the RLS lockdown depends on edge functions existing to do the writes).
2. **#3 monitoring consolidation** (mechanical, low-risk).
3. **#4 quiz consolidation** (largest refactor, isolate to its own loop).
4. **#1 landing page** (pure frontend, ship anytime).

### Technical details

- New table: `exam_session_locks(session_id uuid PK references exam_sessions, tab_id text, last_seen_at timestamptz default now())`. RLS: select own (via session join), no client write.
- Cron: `select cron.schedule('exam-auto-submit', '* * * * *', $$ select net.http_post(...'/functions/v1/exam-auto-submit-expired'...) $$);` — registered via insert tool (not migration) since it embeds the project URL + anon key.
- Edge function auth: all four use `verify_jwt = true` (default) and re-validate `is_test_assigned_to_student` server-side — never trust the client's claim of which test they're taking.
- Server-side grading reuses `check-open-answer` for short-answer questions, exact-match for MC/TF.
- Linter re-run after migration is required; plan assumes ≤1 follow-up migration to mop up edge cases the first pass misses.
