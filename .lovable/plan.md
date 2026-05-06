## Scope

Two tracks:

1. **Exam Mode security verification + RLS audit** — most of the backend is already in place (edge functions + the `enforce_exam_session_student_updates` trigger). This pass verifies and closes any remaining gaps.
2. **Landing page rework** — reposition `/` around the school angle, add legal pages, fix the broken footer links.

You were right about #4 — School Admin already groups its tabs (People / Academics / Communication / Settings), so that one is dropped. The dashboard consolidation work that remains is only on the student/parent `Monitoring` + `Progress` pages, and that's a separate later track.

---

## Track 1 — Exam Mode security + RLS audit

### What's already done (verified)
- Edge functions exist and are wired up: `exam-start`, `exam-heartbeat`, `exam-submit`, `exam-record-violation`, `exam-auto-submit-expired`.
- `ExamRunner.tsx` calls them via `supabase.functions.invoke(...)` instead of writing scores directly.
- DB trigger `enforce_exam_session_student_updates` blocks students from changing `score`, `percentage`, `flagged`, `status`, etc. — only `answers` can be updated client-side.

### What still needs to happen

1. **Run `supabase--linter`** and capture the current ERROR/WARN list.
2. **Run `security--run_security_scan`** for a second opinion.
3. **One migration** to fix what the linter finds. Expected items based on the earlier audit notes:
   - 2× SECURITY DEFINER views → convert to `security_invoker = true` or drop the SECURITY DEFINER property.
   - 4× functions with mutable `search_path` → add `SET search_path = public` to each.
   - Tighten `exam_violations` INSERT: revoke from `authenticated`, allow only `service_role` (writes go through `exam-record-violation`).
   - Tighten `test_attempts` INSERT for exam-mode tests: only allow when there's a matching submitted `exam_sessions` row, OR restrict to `service_role` for `assessment_mode = 'exam'`.
   - Replace any remaining `USING (true)` / `WITH CHECK (true)` policies on UPDATE/DELETE/INSERT with proper ownership checks (enumerate from linter output, not guessed).
   - Move user-installed extensions (e.g. `pg_net`) out of the `public` schema if flagged.
4. **Schedule the cron** for `exam-auto-submit-expired` (every minute) via `pg_cron` + `pg_net` so stuck/abandoned exams auto-submit.
5. **Re-run the linter** — target is 0 ERRORs and only acceptable WARNs.
6. **Smoke test** the full exam flow: start → answer → violation → submit, plus the auto-submit-expired path.

### Technical notes
- Linter output drives the migration — the list above is the expected shape, but the actual SQL is written from real linter output, not assumed.
- The cron job is registered via the SQL editor (it embeds the project URL + anon key), not a portable migration.
- No frontend changes expected in this track.

---

## Track 2 — Landing page rework (school angle + legal)

### Goals
- Stop sounding like a generic AI tutor; lead with what schools actually buy: admin console, gradebook, exam mode, native Arabic.
- Fix the footer: Privacy and Terms currently link to `#`.

### Changes to `src/pages/Index.tsx`

```text
[Hero]
  Headline: "Run your school on Teachly."
  Sub: AI for principals, teachers, students, and parents — in English and Arabic.
  CTAs: [Book a school demo]  [Try it free]
  Visual: public/images/school-admin-dashboard.png

[Built for schools] — 3 cards
  • School Admin Console (screenshot: school-admin-dashboard.png)
  • Gradebook & Sections (100-pt weighted, Grades 1–12)
  • Exam Mode with anti-cheat (heartbeat, fullscreen, server-side scoring)

[Native Arabic / RTL]
  Side-by-side EN ↔ AR screenshot of the same screen.
  Copy: "Full Arabic UI with RTL — not Google-translated."

[Comparison strip]
  Small table: Teachly vs Khanmigo vs MagicSchool
  Rows: School admin console · Gradebook · Native Arabic · Exam Mode anti-cheat · Per-student classification

[Testimonials placeholder]
  3-card grid with placeholder quotes (real ones can be swapped in later).

[Existing pricing/FAQ links — kept]
[Generic AI-tutor marketing fluff — trimmed]
```

Two small new components under `src/components/landing/`:
- `SchoolFeatureCards.tsx`
- `CompetitorComparison.tsx`

### New legal pages
- `src/pages/Privacy.tsx` — generic but project-correct privacy policy (Supabase storage, Resend for email, Stripe/PayPal for payments, OpenAI/Gemini for AI, no selling of data).
- `src/pages/Terms.tsx` — standard terms of service (acceptable use, school contracts note, account termination).
- Add routes in `src/App.tsx`: `/privacy`, `/terms`.
- Update `src/components/layout/Footer.tsx` — replace the two `href="#"` with `<Link to="/privacy">` and `<Link to="/terms">`.

### Translations
Add EN + AR strings for the new landing sections and footer links to `src/contexts/LanguageContext.tsx` (or wherever `t()` keys live).

### Out of scope for this track
- No backend changes.
- No design-token changes — sticks with the existing orange/white semantic tokens.
- Testimonials are placeholders, not real customer logos.

---

## Execution order

1. Track 1 first (security — the only risky thing).
2. Track 2 right after (pure frontend, ship anytime).

Both can be done in one build session.
