-- Server-only helper to check whether an email already has an auth account.
-- Used by invite/student provisioning edge functions to give clear errors and
-- avoid creating duplicate accounts. Locked down so clients cannot enumerate emails.
create or replace function public.email_has_account(_email text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(select 1 from auth.users where lower(email) = lower(_email));
$$;

revoke all on function public.email_has_account(text) from public, anon, authenticated;
grant execute on function public.email_has_account(text) to service_role;
