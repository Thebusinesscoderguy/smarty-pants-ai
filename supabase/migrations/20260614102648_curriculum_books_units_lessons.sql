-- Phase 0 of the structured curriculum system: books -> units -> lessons.
-- subject_id anchors to school_subjects (the table teachers associate through via
-- teacher_subject_sections). school_id is denormalized onto units & lessons so RLS
-- stays simple/fast. No documents, AI parsing, onboarding wiring, or seed data here.
--
-- NOTE: already applied to the live project on 2026-06-14 via Supabase MCP
-- (migration version 20260614102648). This file exists for repo/local parity and
-- carries the same version, so `supabase db push` treats it as already applied and
-- does NOT re-run it. It is additionally written to be idempotent (IF NOT EXISTS /
-- DROP POLICY IF EXISTS) so re-running on a fresh project or `db reset` is safe.

create table if not exists public.curriculum_books (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.school_accounts(id) on delete cascade,
  subject_id  uuid not null references public.school_subjects(id) on delete restrict,
  grade_level text not null,
  title       text not null,
  status      text not null default 'draft' check (status in ('draft','published')),
  created_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.curriculum_units (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.curriculum_books(id) on delete cascade,
  school_id   uuid not null references public.school_accounts(id) on delete cascade,
  title       text not null,
  summary     text,
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.curriculum_lessons (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references public.curriculum_units(id) on delete cascade,
  school_id    uuid not null references public.school_accounts(id) on delete cascade,
  title        text not null,
  content      text,
  summary      text,
  source_pages text,
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_curriculum_books_subject_grade on public.curriculum_books(school_id, subject_id, grade_level);
create index if not exists idx_curriculum_units_book   on public.curriculum_units(book_id);
create index if not exists idx_curriculum_lessons_unit on public.curriculum_lessons(unit_id);

alter table public.curriculum_books   enable row level security;
alter table public.curriculum_units   enable row level security;
alter table public.curriculum_lessons enable row level security;

-- ===== curriculum_books =====
drop policy if exists "School admins manage books" on public.curriculum_books;
create policy "School admins manage books" on public.curriculum_books
  for all to authenticated
  using (is_school_admin_of(auth.uid(), school_id))
  with check (is_school_admin_of(auth.uid(), school_id));

drop policy if exists "School members read books" on public.curriculum_books;
create policy "School members read books" on public.curriculum_books
  for select to authenticated
  using (is_school_member(auth.uid(), school_id));

drop policy if exists "Assigned teachers read published books" on public.curriculum_books;
create policy "Assigned teachers read published books" on public.curriculum_books
  for select to authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.teacher_subject_sections tss
      join public.school_teachers t on t.id = tss.teacher_id
      where tss.subject_id = curriculum_books.subject_id
        and t.is_active
        and lower(t.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ===== curriculum_units =====
drop policy if exists "School admins manage units" on public.curriculum_units;
create policy "School admins manage units" on public.curriculum_units
  for all to authenticated
  using (is_school_admin_of(auth.uid(), school_id))
  with check (is_school_admin_of(auth.uid(), school_id));

drop policy if exists "School members read units" on public.curriculum_units;
create policy "School members read units" on public.curriculum_units
  for select to authenticated
  using (is_school_member(auth.uid(), school_id));

drop policy if exists "Assigned teachers read published units" on public.curriculum_units;
create policy "Assigned teachers read published units" on public.curriculum_units
  for select to authenticated
  using (
    exists (
      select 1 from public.curriculum_books b
      join public.teacher_subject_sections tss on tss.subject_id = b.subject_id
      join public.school_teachers t on t.id = tss.teacher_id
      where b.id = curriculum_units.book_id
        and b.status = 'published'
        and t.is_active
        and lower(t.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ===== curriculum_lessons =====
drop policy if exists "School admins manage lessons" on public.curriculum_lessons;
create policy "School admins manage lessons" on public.curriculum_lessons
  for all to authenticated
  using (is_school_admin_of(auth.uid(), school_id))
  with check (is_school_admin_of(auth.uid(), school_id));

drop policy if exists "School members read lessons" on public.curriculum_lessons;
create policy "School members read lessons" on public.curriculum_lessons
  for select to authenticated
  using (is_school_member(auth.uid(), school_id));

drop policy if exists "Assigned teachers read published lessons" on public.curriculum_lessons;
create policy "Assigned teachers read published lessons" on public.curriculum_lessons
  for select to authenticated
  using (
    exists (
      select 1 from public.curriculum_units u
      join public.curriculum_books b on b.id = u.book_id
      join public.teacher_subject_sections tss on tss.subject_id = b.subject_id
      join public.school_teachers t on t.id = tss.teacher_id
      where u.id = curriculum_lessons.unit_id
        and b.status = 'published'
        and t.is_active
        and lower(t.email) = lower(auth.jwt() ->> 'email')
    )
  );
