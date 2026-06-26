-- Phase 5: viewer language preference for message auto-translation.
alter table public.profiles
  add column if not exists preferred_language text;
