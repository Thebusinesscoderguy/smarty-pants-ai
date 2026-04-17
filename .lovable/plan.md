
## The real gap

The seed function populates frameworks, grades, and subjects reasonably well — but **`curriculum_units` is empty**. Units (e.g. "Unit 4: Quadratic Equations" with topics) are what actually power "align this quiz to a specific chapter." Without them, curriculum alignment only narrows to (framework, grade, subject) — not much better than a free-text dropdown.

That's ~12 frameworks × ~10 grades × ~6 subjects ≈ **700 missing units**. That's the launch blocker.

## Why not hand-curate?

- Official syllabi (Cambridge, IB, MOE textbooks) are copyrighted and not in machine-readable form.
- Manually entering 700 units would take days and still be wrong by the next syllabus update.
- Schools' real-world curricula vary from official ones anyway.

## Recommended approach: AI baseline + admin override

**1. AI-generated baseline units (one-time backfill)**
- New edge function `backfill-curriculum-units` loops every (framework, grade, subject) combo.
- Calls GPT-4o-mini: *"List 6–10 standard units taught in {Cambridge IGCSE Math 0580, Year 10}, with 3–6 topics each, as JSON."*
- Inserts into `curriculum_units` with `is_custom=false`. Idempotent — skips combos that already have units.
- Cost: ~$3–5 total. Runtime: ~10 min.
- Quality: 80–90% accurate for well-known curricula (Cambridge, IB, Common Core, UK National); decent for MOE.

**2. Verification badge**
- Add `verification_status` column (`ai_generated` | `verified` | `community`, default `ai_generated`).
- Selector shows a small "AI-generated" tag on those units so teachers know to double-check.
- You can hand-verify Cambridge/IB later and flip to `verified`.

**3. School admins override anything wrong**
- `CurriculumAdminPanel` already supports `is_custom=true`. Wrong global data never blocks a customer — they edit their own copy.

**4. Per-slice "Generate with AI" button** in the admin panel
- Lets a school admin re-generate units for one (grade, subject) slice on demand — faster feedback loop than a full backfill if they spot a gap.

**5. Telemetry**
- Track which units get used in quiz generation and which get overridden — those tell you which to fix first post-launch.

## What I'll build

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Add `verification_status` text column to `curriculum_units` (default `'ai_generated'`) |
| `supabase/functions/backfill-curriculum-units/index.ts` | New: iterates combos, calls OpenAI, upserts units. Service-role-protected. |
| `supabase/config.toml` | Register new function with `verify_jwt = false` (called from admin UI with role check inside) |
| `src/components/curriculum/CurriculumAdminPanel.tsx` | "Generate units with AI" button (full + per-slice) |
| `src/components/CurriculumSelector.tsx` | "AI-generated" badge on units |

## What I won't do

- Hardcode 700 units manually — slow, inaccurate, stale.
- Scrape official sites — copyright risk.
- Block launch on human verification — AI baseline + override unblocks today.

## Two questions before I build

1. **Data strategy** — Pick one:
   - **(A) AI-generated baseline + admin override** *(recommended, 1 session)*
   - **(B) AI baseline + I hand-verify Cambridge IGCSE / IB DP / US Common Core against public syllabi** *(adds ~1 hour)*
   - **(C) Skip units entirely for launch** — alignment only narrows to (framework, grade, subject)

2. **Framework scope** — Pick one:
   - **(A) Keep all 12** — MOE stays AI-generated until verified
   - **(B) Trim to 6 well-known ones** (Cambridge ×4, IB ×2, US Common Core, UK National) — hide MOE until regional verification
