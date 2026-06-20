-- Phase 2 SPIKE: document upload + AI-split job tracking.
-- Draft-only: proposed_structure holds the AI's book->units->lessons tree as JSON.
-- It is NOT written into curriculum_books/units/lessons until a (future) approve step.
--
-- NOTE: already applied to the live project on 2026-06-20 via Supabase MCP
-- (migration version 20260620082227). This file exists for repo/local parity and
-- carries the same version, so `supabase db push` treats it as already applied and
-- does NOT re-run it. It is additionally idempotent (IF NOT EXISTS / DROP POLICY
-- IF EXISTS) so re-running on a fresh project or `db reset` is safe.

create table if not exists public.curriculum_documents (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.school_accounts(id) on delete cascade,
  subject_id   uuid not null references public.school_subjects(id) on delete restrict,
  grade_level  text not null,
  title        text not null,
  storage_path text not null,                       -- {school_id}/{document_id}/{filename} in curriculum-docs
  mime_type    text,
  page_count   int,
  status       text not null default 'uploaded'
               check (status in ('uploaded','parsing','parsed','failed')),
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.curriculum_parse_jobs (
  id                  uuid primary key default gen_random_uuid(),
  document_id         uuid not null references public.curriculum_documents(id) on delete cascade,
  school_id           uuid not null references public.school_accounts(id) on delete cascade,  -- denormalized for RLS
  status              text not null default 'queued'
                      check (status in ('queued','running','succeeded','failed')),
  model               text,
  error               text,                          -- populated on the loud-failure path (scanned/no-text PDFs)
  proposed_structure  jsonb,                         -- draft book->units->lessons; NULL until succeeded
  book_id             uuid references public.curriculum_books(id) on delete set null,  -- null until approved (future)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_curriculum_documents_school  on public.curriculum_documents(school_id, subject_id, grade_level);
create index if not exists idx_curriculum_parse_jobs_doc     on public.curriculum_parse_jobs(document_id);
create index if not exists idx_curriculum_parse_jobs_school  on public.curriculum_parse_jobs(school_id, status);

alter table public.curriculum_documents  enable row level security;
alter table public.curriculum_parse_jobs enable row level security;

-- ===== curriculum_documents — admins of the owning school only =====
drop policy if exists "School admins manage curriculum documents" on public.curriculum_documents;
create policy "School admins manage curriculum documents" on public.curriculum_documents
  for all to authenticated
  using (is_school_admin_of(auth.uid(), school_id))
  with check (is_school_admin_of(auth.uid(), school_id));

-- ===== curriculum_parse_jobs — admins of the owning school only =====
drop policy if exists "School admins manage parse jobs" on public.curriculum_parse_jobs;
create policy "School admins manage parse jobs" on public.curriculum_parse_jobs
  for all to authenticated
  using (is_school_admin_of(auth.uid(), school_id))
  with check (is_school_admin_of(auth.uid(), school_id));
