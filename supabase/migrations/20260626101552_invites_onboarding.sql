-- Invite-based onboarding: teacher & parent invites with hashed, single-use, expiring tokens.
-- Students are NOT invited under the new model (admin-provisioned directly); only
-- 'teacher' and 'parent' are invitable roles here.
create table if not exists public.invites (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  role             public.user_role not null,
  school_id        uuid not null references public.school_accounts(id) on delete cascade,
  invited_by       uuid not null references auth.users(id),
  token_hash       text not null unique,                -- SHA-256 of the raw token; raw is never stored
  status           text not null default 'pending'
                     check (status in ('pending','accepted','revoked')),
  child_ids        uuid[] null,                         -- student user_ids to link when role='parent'
  expires_at       timestamptz not null,
  accepted_at      timestamptz null,
  accepted_user_id uuid null references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint invites_role_invitable check (role in ('teacher','parent'))
);

alter table public.invites enable row level security;

-- Admins may LIST their school's invites (token_hash is one-way; never selected by UI).
drop policy if exists "School admins read own invites" on public.invites;
create policy "School admins read own invites" on public.invites
  for select to authenticated
  using (public.is_school_admin_of(auth.uid(), school_id));

-- All writes happen via edge functions using the service role (bypasses RLS).
-- No insert/update/delete policies are granted to authenticated/anon.
-- "expired" is derived (status='pending' AND expires_at < now()), not stored.

create index if not exists idx_invites_school_status on public.invites (school_id, status);
create index if not exists idx_invites_email on public.invites (lower(email));
