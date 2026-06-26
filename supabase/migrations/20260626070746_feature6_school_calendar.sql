-- Feature 6 (replaced): school-published, color-coded calendar (read-only for all).

-- Helper: every school_id the current user belongs to, across ALL roles
-- (admin / teacher / student / parent). SECURITY DEFINER so the read policies
-- don't trip RLS on the underlying relationship tables.
create or replace function public.user_school_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select sa.id from school_accounts sa where sa.admin_user_id = auth.uid()
  union
  select st.school_id from school_teachers st
    where lower(st.email) = lower((auth.jwt() ->> 'email')) and st.is_active = true
  union
  select ssr.school_id from school_student_relationships ssr
    where ssr.student_id = auth.uid() and ssr.is_active = true
  union
  select ssr.school_id from school_student_relationships ssr
    join parent_child_relationships pcr on pcr.child_id = ssr.student_id
    where pcr.parent_id = auth.uid() and ssr.is_active = true
$$;
revoke all on function public.user_school_ids() from public;
grant execute on function public.user_school_ids() to authenticated;

create table if not exists public.school_calendar_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  name text not null,
  color text not null,                       -- hex, e.g. #ef4444
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (school_id, name)
);
alter table public.school_calendar_categories enable row level security;
create policy "School admins manage calendar categories" on public.school_calendar_categories
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
create policy "School members read calendar categories" on public.school_calendar_categories
  for select to authenticated
  using (school_id in (select public.user_school_ids()));

create table if not exists public.school_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  category_id uuid references public.school_calendar_categories(id) on delete set null,
  title text not null,
  start_date date not null,
  end_date date not null,                    -- = start_date for single-day; supports ranges
  description text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
alter table public.school_calendar_entries enable row level security;
create index if not exists school_calendar_entries_school_dates_idx
  on public.school_calendar_entries (school_id, start_date, end_date);
create policy "School admins manage calendar entries" on public.school_calendar_entries
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
create policy "School members read calendar entries" on public.school_calendar_entries
  for select to authenticated
  using (school_id in (select public.user_school_ids()));

-- Seed default categories (admin can add more / recolor later).
insert into public.school_calendar_categories (school_id, name, color)
select sa.id, d.name, d.color
from public.school_accounts sa
cross join (values
  ('No School / Holiday', '#ef4444'),
  ('Parent-Teacher Conference', '#8b5cf6'),
  ('Exam', '#f59e0b'),
  ('Event', '#10b981')
) as d(name, color)
on conflict (school_id, name) do nothing;
