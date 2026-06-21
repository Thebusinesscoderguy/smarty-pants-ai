-- Production curriculum pipeline (Option 3+): page ranges on units/lessons,
-- per-lesson image links, document no longer needs a stored raw PDF, and an
-- atomic publish RPC. The browser extracts text + embedded images and stores
-- only those + structure (never the raw PDF), which removes the storage size cap.
--
-- NOTE: already applied to the live project on 2026-06-21 via Supabase MCP
-- (migration version 20260621125659). Repo/local parity file, same version, so
-- `supabase db push` treats it as already applied. Idempotent (IF NOT EXISTS /
-- DROP POLICY IF EXISTS / CREATE OR REPLACE) so re-running on a fresh project or
-- `db reset` is safe.

-- 1. page ranges + confidence on units & lessons
alter table public.curriculum_units
  add column if not exists start_page int,
  add column if not exists end_page   int,
  add column if not exists confidence  text;

alter table public.curriculum_lessons
  add column if not exists start_page int,
  add column if not exists end_page   int,
  add column if not exists confidence  text;

-- 2. raw PDF is never stored anymore; keep extracted text for provenance/re-runs
alter table public.curriculum_documents alter column storage_path drop not null;
alter table public.curriculum_documents
  add column if not exists extracted_text text,
  add column if not exists char_count     int;

-- 3. per-lesson extracted images (each small; uploaded individually to curriculum-docs)
create table if not exists public.curriculum_lesson_images (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.curriculum_lessons(id)  on delete cascade,
  book_id      uuid not null references public.curriculum_books(id)    on delete cascade,
  school_id    uuid not null references public.school_accounts(id)     on delete cascade,
  document_id  uuid references public.curriculum_documents(id)         on delete set null,
  storage_path text not null,                       -- {school_id}/{document_id}/images/{page}-{idx}.png
  page_number  int,
  order_index  int not null default 0,
  width        int,
  height       int,
  created_at   timestamptz not null default now()
);

create index if not exists idx_curriculum_lesson_images_lesson on public.curriculum_lesson_images(lesson_id);
create index if not exists idx_curriculum_lesson_images_book   on public.curriculum_lesson_images(book_id);

alter table public.curriculum_lesson_images enable row level security;

drop policy if exists "School admins manage lesson images" on public.curriculum_lesson_images;
create policy "School admins manage lesson images" on public.curriculum_lesson_images
  for all to authenticated
  using (is_school_admin_of(auth.uid(), school_id))
  with check (is_school_admin_of(auth.uid(), school_id));

drop policy if exists "School members read lesson images" on public.curriculum_lesson_images;
create policy "School members read lesson images" on public.curriculum_lesson_images
  for select to authenticated
  using (is_school_member(auth.uid(), school_id));

drop policy if exists "Assigned teachers read published lesson images" on public.curriculum_lesson_images;
create policy "Assigned teachers read published lesson images" on public.curriculum_lesson_images
  for select to authenticated
  using (
    exists (
      select 1 from public.curriculum_books b
      join public.teacher_subject_sections tss on tss.subject_id = b.subject_id
      join public.school_teachers t on t.id = tss.teacher_id
      where b.id = curriculum_lesson_images.book_id
        and b.status = 'published'
        and t.is_active
        and lower(t.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 4. atomic publish: book -> units -> lessons -> image links, in one transaction,
-- under the caller's RLS (admin). Trusted fields (school/subject/grade) come from
-- the document row, not the payload.
create or replace function public.materialize_curriculum(p jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_document_id uuid := (p->>'document_id')::uuid;
  v_job_id      uuid := nullif(p->>'job_id','')::uuid;
  v_publish     boolean := coalesce((p->>'publish')::boolean, false);
  v_school_id   uuid;
  v_subject_id  uuid;
  v_grade_level text;
  v_doc_title   text;
  v_title       text;
  v_book_id     uuid;
  v_unit   jsonb;
  v_lesson jsonb;
  v_image  jsonb;
  v_unit_id   uuid;
  v_lesson_id uuid;
  v_uidx int := 0;
  v_lidx int := 0;
  v_iidx int := 0;
begin
  if v_document_id is null then
    raise exception 'document_id is required';
  end if;

  select school_id, subject_id, grade_level, title
    into v_school_id, v_subject_id, v_grade_level, v_doc_title
  from curriculum_documents
  where id = v_document_id;

  if v_school_id is null then
    raise exception 'document not found or not authorized';
  end if;

  v_title := coalesce(nullif(p->>'title',''), v_doc_title);

  insert into curriculum_books (school_id, subject_id, grade_level, title, status, created_by)
  values (v_school_id, v_subject_id, v_grade_level, v_title,
          case when v_publish then 'published' else 'draft' end, auth.uid())
  returning id into v_book_id;

  for v_unit in select value from jsonb_array_elements(coalesce(p->'units','[]'::jsonb))
  loop
    insert into curriculum_units (book_id, school_id, title, summary, order_index, start_page, end_page, confidence)
    values (v_book_id, v_school_id,
            coalesce(nullif(v_unit->>'title',''),'Untitled unit'),
            nullif(v_unit->>'summary',''),
            v_uidx,
            nullif(v_unit->>'start_page','')::int,
            nullif(v_unit->>'end_page','')::int,
            nullif(v_unit->>'confidence',''))
    returning id into v_unit_id;
    v_uidx := v_uidx + 1;

    v_lidx := 0;
    for v_lesson in select value from jsonb_array_elements(coalesce(v_unit->'lessons','[]'::jsonb))
    loop
      insert into curriculum_lessons (unit_id, school_id, title, content, summary, source_pages, order_index, start_page, end_page, confidence)
      values (v_unit_id, v_school_id,
              coalesce(nullif(v_lesson->>'title',''),'Untitled lesson'),
              nullif(v_lesson->>'content',''),
              nullif(v_lesson->>'summary',''),
              nullif(v_lesson->>'source_pages',''),
              v_lidx,
              nullif(v_lesson->>'start_page','')::int,
              nullif(v_lesson->>'end_page','')::int,
              nullif(v_lesson->>'confidence',''))
      returning id into v_lesson_id;
      v_lidx := v_lidx + 1;

      v_iidx := 0;
      for v_image in select value from jsonb_array_elements(coalesce(v_lesson->'images','[]'::jsonb))
      loop
        insert into curriculum_lesson_images (lesson_id, book_id, school_id, document_id, storage_path, page_number, order_index, width, height)
        values (v_lesson_id, v_book_id, v_school_id, v_document_id,
                v_image->>'storage_path',
                nullif(v_image->>'page_number','')::int,
                v_iidx,
                nullif(v_image->>'width','')::int,
                nullif(v_image->>'height','')::int);
        v_iidx := v_iidx + 1;
      end loop;
    end loop;
  end loop;

  update curriculum_documents set status = 'parsed', updated_at = now() where id = v_document_id;
  if v_job_id is not null then
    update curriculum_parse_jobs set book_id = v_book_id, updated_at = now() where id = v_job_id;
  end if;

  return v_book_id;
end;
$$;

grant execute on function public.materialize_curriculum(jsonb) to authenticated;
