# TeachlyAI SMS — Feature Build Spec

**Source:** Requirements from Reem Hammouri (faculty champion), 25 Jun 2026
**Stack:** Vite + React + TypeScript · Supabase (Postgres + RLS + Edge Functions)
**Repo:** `smarty-pants-ai` · **Supabase project:** `twfzlbockonxopuindaw`
**Typecheck gate:** `tsc -b`

> Role names below (admin / leader / teacher / parent / student) are generic — map them to your existing role enum. RLS is described as *intent*, not written — have Claude Code generate the policies against the real schema. Table sketches are column lists, not migrations; reconcile against existing tables before creating new ones (especially gradebook, attendance, and messaging, which already exist).

---

## Build order

| # | Feature | Effort | Why here |
|---|---------|--------|----------|
| 0 | Shared: translation edge function | S | Dependency for #5 and announcement translation |
| 1 | Announcement Dashboard | S | Reuses newsfeed patterns; instant demo value |
| 2 | Grading Rubric | S–M | Fully specced; plugs into existing gradebook |
| 3 | Behavior Management | M | Self-contained CRUD; she listed it first |
| 4 | Classroom Observation | M | Leader-gated; uses existing role routing |
| 5 | Comms Hub: translation + history | M | Builds on existing parent–teacher messaging |
| 6 | Conference Scheduler | M–L | Availability + booking logic |
| 7 | Professional Growth Goals | L | Most surface area — the "hard" one, last |

**Sequencing logic:** cheap, high-visibility features first to build demo breadth fast; heavy features last. Rough order of magnitude — a couple of focused weeks solo with Claude Code, less if you batch the CRUD modules together.

---

## Phase 0 — Translation service (shared)

Thin, generic edge function so any feature can call it.

**`translate` edge function** — input `{ text, target_lang, source_lang? }` → `{ translated }`.
- Back it with Google Translate API or the Anthropic key you already have wired (Claude does translation well and avoids a new vendor).
- Cache every result in `message_translations` (below) and reuse for announcements — don't re-translate the same string twice.

---

## 1. Announcement Dashboard

**Goal:** school-wide or targeted announcements, pinnable, on a dashboard feed.

**`announcements`**
- `id` uuid pk · `author_id` → profiles
- `title` text · `body` text
- `audience` text check in (`all`,`teachers`,`parents`,`students`,`class`)
- `class_id` uuid null (when audience = `class`)
- `pinned` bool default false
- `publish_at` timestamptz default now() · `expires_at` timestamptz null
- `created_at` timestamptz default now()

**RLS:** admin/leader insert any; teacher insert for own classes; users select rows whose audience targets them AND `now()` between `publish_at` and `coalesce(expires_at, 'infinity')`.

**UI:** composer (title, body, audience selector, pin toggle, optional expiry); dashboard feed (pinned first, then recent); render via `translate` to viewer's language. Read receipts → skip for v1.

**Acceptance**
- [ ] Leader posts an announcement targeted to a role/class
- [ ] Only the right audience sees it
- [ ] Pinned items sort to top; expired items drop off

---

## 2. Grading Rubric

**Goal:** teachers enter component marks; total auto-computes and is capped at 100.

**Weights:** Exam 20 · Quizzes 20 · Attendance 20 · Literacy 10 · Project 10 · Classwork 10 · Homework 10.

**`rubric_grades`** (one row per student × subject × term)
- `id` · `student_id` · `subject_id` · `term_id` · `teacher_id`
- `exam_score` numeric check (0–20)
- `quiz_score` numeric check (0–20)
- `attendance_score` numeric check (0–20)
- `literacy_score` numeric check (0–10)
- `project_score` numeric check (0–10)
- `cw_score` numeric check (0–10)
- `hw_score` numeric check (0–10)
- `total` numeric **GENERATED ALWAYS AS** (sum of the seven) **STORED**
- unique (`student_id`, `subject_id`, `term_id`)

The generated `total` plus per-column checks enforce Reem's "won't accept more than 100" **at the database level** — there's no path to over-enter, from any client.

**Attendance score (out of 20) — from per-class attendance taking:**

Flow: each time a teacher takes a class, they pick the class they're teaching, mark who's present, and for each absentee pick a reason (Medical, etc.) or leave it unexcused ("no reason"). One take = one session.

Reads from / builds on:
- `class_sessions` — `id` · `class_id` · `teacher_id` · `subject_id` · `session_date` (one row per class taken)
- `attendance_records` — `id` · `session_id` · `student_id` · `status` (`present`/`absent`) · `reason_id` null (set when absent)
- `attendance_reasons` (configurable) — `id` · `label` · `excused` bool — seed: Medical (excused), Family (excused), **Unexcused / no reason** (not excused)

Derivation per student × subject × term:
`attendance_score = round( (present + excused_absences) / total_sessions × 20 )`
— only **unexcused** absences pull the score down; medical etc. don't penalize. The one policy switch is "does an excused absence count as present for the grade?" — default **yes**; confirm with Reem. Result fills `attendance_score` in `rubric_grades`, still teacher-overridable.

**UI:** per-class entry grid, 7 inputs per student, live total, inline validation per cell, save per row or bulk.

**Acceptance**
- [ ] Each component rejects marks above its max
- [ ] Total computes automatically and can't exceed 100
- [ ] Attendance score derived from session attendance (only unexcused absences lower it), teacher-overridable

---

## 3. Behavior Management

**Goal:** log positive/negative incidents; generate incident reports.

**`behavior_categories`** (configurable): `id` · `name` · `valence` (`positive`/`negative`) · `default_points` int
**`behavior_incidents`**: `id` · `student_id` · `recorded_by` · `category_id` · `valence` · `description` · `points` int · `incident_date` date · `created_at`

**RLS:** teacher/leader/admin insert; parent select own child; student select own (optional); admin/leader select all.

**UI:** quick-log form (student, category, note); per-student behavior profile (timeline + running points); class/date filters; incident report export (print/PDF) per student or class.

**Acceptance**
- [ ] Log a positive and a negative incident
- [ ] Per-student report shows history + totals
- [ ] Parent sees only their child's record

---

## 4. Classroom Observation

**Goal:** leaders observe teachers against a template; teacher views feedback.

**`observation_templates`**: `id` · `name` · `criteria` jsonb (list of `{label, type, scale}`)
**`observations`**: `id` · `observer_id` · `teacher_id` · `class_id` · `template_id` · `responses` jsonb · `notes` · `status` (`draft`/`submitted`/`acknowledged`) · `observed_at` · `created_at`

**RLS:** leader/admin insert + select all; observed teacher select + acknowledge own; nobody edits others' observations.

**UI:** template-driven observation form; leader dashboard (observations conducted); teacher view of received observations + acknowledge button.

**Acceptance**
- [ ] Leader completes an observation from a template
- [ ] Observed teacher sees it and can acknowledge
- [ ] Non-leaders can't create observations

---

## 5. Comms Hub — translation + history

Builds on existing parent–teacher messaging + newsfeed.

- Add `preferred_language` text to profiles.
- **`message_translations`**: `id` · `message_id` · `target_language` · `translated_text` · unique (`message_id`, `target_language`).

**Translation:** on render, if message language ≠ viewer's `preferred_language`, call `translate` (Phase 0), cache, display translated with a **"show original"** toggle.

**History:** per parent–teacher thread, full chronological history with timestamps + search by keyword/date; optional export.

**Acceptance**
- [ ] Message from teacher shows in parent's preferred language automatically
- [ ] "Show original" toggle works
- [ ] Thread history is complete and searchable

---

## 6. School Calendar

**Goal:** the school publishes a color-coded calendar; everyone (parents, teachers, students) views it read-only. No slots, no bookings, no parent self-service.

**`school_calendar_categories`**: `id` · `school_id` · `name` · `color` (hex) · `created_by` · `created_at`
- Seed defaults: No School / Holiday, Parent-Teacher Conference, Exam, Event (each with a color). Admin can add more or recolor.

**`school_calendar_entries`**: `id` · `school_id` · `category_id` · `title` · `start_date` · `end_date` (= `start_date` for single days; supports multi-day ranges) · `description` · `created_by` · `created_at`

**RLS:** school admin manages categories + entries (insert/update/delete) for their school; **all authenticated members of the school SELECT (read-only)** — parents, teachers, students. Membership resolved via the `user_school_ids()` helper (admin / teacher-by-email / student / parent-of-student).

**Calendar logic:** month-grid view; weekends auto-colored from a single editable constant `WEEKEND_DAYS` (default **Friday + Saturday**, Saudi week — getDay `[5,6]`, NOT Sat/Sun). Posted entries overlay on their dates in the category color; multi-day entries render across the full range. A color legend shows weekday, weekend, and each category.

**UI:** admin management surface (create/edit/delete entries, add categories / change colors) in SchoolAdmin; **read-only calendar view reachable by every role** — parent (FamilyHub), student (StudentDashboard), teacher (SchoolAdmin), admin.

**Acceptance**
- [ ] Admin posts a No-School day, a PTC day, and a multi-day event → all appear, correctly colored, on the calendar for a parent / teacher / student account
- [ ] Weekends (Fri–Sat) auto-colored with no manual entry
- [ ] Legend shows each color's meaning
- [ ] Non-admin can view but cannot edit

---

## 7. Professional Growth Goals

The hard one — keep v1 scope tight: goals + progress updates + status, for teachers and students.

**`growth_goals`**: `id` · `owner_id` · `owner_type` (`teacher`/`student`) · `title` · `description` · `target_date` · `status` (`not_started`/`in_progress`/`achieved`) · `progress` int (0–100) · `created_by` · `created_at`
**`goal_updates`**: `id` · `goal_id` · `note` · `progress` int · `created_by` · `created_at` (the progress timeline)

**RLS:** owner edits own; supervisor views/comments (leaders → teachers, teachers → their students); admin all.

**UI:** goal list per owner; goal detail with progress timeline; add-update form; status + progress controls.

**Scope guard for v1:** no auto-linking to grades or observations, no approval workflows. Just create → update progress → mark achieved.

**Acceptance**
- [ ] Create a goal for a teacher and for a student
- [ ] Log progress updates over time (timeline visible)
- [ ] Mark a goal achieved

---

## When it's all shipped

Record the walkthrough video Reem asked for. **Demo each feature's acceptance criteria in order — that checklist above doubles as your demo script**, and it's effectively her acceptance criteria, so hitting every box is what gets her the green light with the board.
