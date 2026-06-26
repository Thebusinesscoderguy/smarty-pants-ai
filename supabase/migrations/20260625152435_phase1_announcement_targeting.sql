-- Phase 1: extend the existing newsfeed (school_news) into a targeted,
-- schedulable Announcement Dashboard. Reuses school_news instead of a new table.
alter table public.school_news
  add column if not exists audience text not null default 'all'
    check (audience in ('all','teachers','parents','students','class')),
  add column if not exists section_id uuid references public.school_sections(id) on delete set null,
  add column if not exists publish_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz;

create index if not exists school_news_publish_window_idx
  on public.school_news (school_id, publish_at, expires_at);

-- Admin "manage all" and teacher "manage own" policies are unchanged: authors
-- always see their drafts/scheduled/expired posts. Only the consumer SELECT
-- policies (students/parents) gain audience + publish-window filtering, and we
-- add a teacher consumer-feed SELECT policy.

drop policy if exists "Students can view school news" on public.school_news;
create policy "Students can view school news"
on public.school_news for select
to authenticated
using (
  school_id in (
    select school_student_relationships.school_id
    from school_student_relationships
    where school_student_relationships.student_id = auth.uid()
      and school_student_relationships.is_active = true
  )
  and now() between publish_at and coalesce(expires_at, 'infinity'::timestamptz)
  and (
    audience in ('all','students')
    or (audience = 'class' and section_id in (
      select ss.section_id from section_students ss where ss.student_id = auth.uid()
    ))
  )
);

drop policy if exists "Parents can view school news" on public.school_news;
create policy "Parents can view school news"
on public.school_news for select
to authenticated
using (
  school_id in (
    select ssr.school_id
    from school_student_relationships ssr
    join parent_child_relationships pcr on pcr.child_id = ssr.student_id
    where pcr.parent_id = auth.uid() and ssr.is_active = true
  )
  and now() between publish_at and coalesce(expires_at, 'infinity'::timestamptz)
  and (
    audience in ('all','parents')
    or (audience = 'class' and section_id in (
      select ss.section_id
      from section_students ss
      join parent_child_relationships pcr on pcr.child_id = ss.student_id
      where pcr.parent_id = auth.uid()
    ))
  )
);

-- Teachers consume the feed too (targeted to 'all' or 'teachers'); they keep
-- full manage rights on their own posts via the existing ALL policy.
drop policy if exists "Teachers can view targeted school news" on public.school_news;
create policy "Teachers can view targeted school news"
on public.school_news for select
to authenticated
using (
  school_id in (
    select school_teachers.school_id
    from school_teachers
    where lower(school_teachers.email) = lower((auth.jwt() ->> 'email'))
      and school_teachers.is_active = true
  )
  and now() between publish_at and coalesce(expires_at, 'infinity'::timestamptz)
  and audience in ('all','teachers')
);
