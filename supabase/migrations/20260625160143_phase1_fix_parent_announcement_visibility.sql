-- A parent has no RLS read access to school_student_relationships / section_students,
-- so the parent announcement policy's join returned nothing. Use SECURITY DEFINER
-- helpers to resolve a parent's school/section ids without tripping those tables' RLS.
create or replace function public.parent_school_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct ssr.school_id
  from school_student_relationships ssr
  join parent_child_relationships pcr on pcr.child_id = ssr.student_id
  where pcr.parent_id = auth.uid() and ssr.is_active = true
$$;

create or replace function public.parent_section_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select ss.section_id
  from section_students ss
  join parent_child_relationships pcr on pcr.child_id = ss.student_id
  where pcr.parent_id = auth.uid()
$$;

revoke all on function public.parent_school_ids() from public;
revoke all on function public.parent_section_ids() from public;
grant execute on function public.parent_school_ids() to authenticated;
grant execute on function public.parent_section_ids() to authenticated;

drop policy if exists "Parents can view school news" on public.school_news;
create policy "Parents can view school news"
on public.school_news for select to authenticated
using (
  school_id in (select public.parent_school_ids())
  and now() between publish_at and coalesce(expires_at, 'infinity'::timestamptz)
  and (
    audience in ('all','parents')
    or (audience = 'class' and section_id in (select public.parent_section_ids()))
  )
);
