-- Phase 6: Conference Scheduler. Double-booking is impossible at the DB level via
-- a partial unique index on slot_id where status='booked'.
-- NOTE: superseded later this session by 20260626070812_feature6_drop_conference_booking
-- (the booking model was replaced by the School Calendar). Kept for an accurate,
-- replayable migration history.
create table if not exists public.conference_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.school_accounts(id) on delete cascade,
  teacher_id uuid not null references public.school_teachers(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'available' check (status in ('available','blocked')),
  created_at timestamptz not null default now()
);
alter table public.conference_slots enable row level security;
create index if not exists conference_slots_teacher_idx on public.conference_slots (teacher_id, start_time);

-- Teachers manage their own slots (email-matched identity).
create policy "Teachers manage own conference slots" on public.conference_slots
  for all to authenticated
  using (teacher_id in (
    select id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ))
  with check (teacher_id in (
    select id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ));
-- Anyone authenticated can see available slots (to book).
create policy "Authenticated view available conference slots" on public.conference_slots
  for select to authenticated using (status = 'available');

create table if not exists public.conference_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.conference_slots(id) on delete cascade,
  parent_id uuid not null default auth.uid(),
  student_id uuid,
  status text not null default 'booked' check (status in ('booked','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.conference_bookings enable row level security;
-- One active (booked) booking per slot → no double-booking, enforced by DB.
create unique index if not exists conference_bookings_one_active_per_slot
  on public.conference_bookings (slot_id) where status = 'booked';

-- Parents manage their own bookings.
create policy "Parents manage own conference bookings" on public.conference_bookings
  for all to authenticated
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());
-- Teachers see bookings made against their own slots.
create policy "Teachers view bookings for their slots" on public.conference_bookings
  for select to authenticated
  using (slot_id in (
    select cs.id from conference_slots cs
    join school_teachers t on t.id = cs.teacher_id
    where lower(t.email) = lower((auth.jwt() ->> 'email')) and t.is_active = true
  ));
