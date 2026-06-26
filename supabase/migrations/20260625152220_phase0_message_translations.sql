-- Phase 0: shared translation cache. Generic (message_id is any stable uuid:
-- a parent_teacher_messages id OR a school_news/announcement id), so no FK.
create table if not exists public.message_translations (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  target_language text not null,
  translated_text text not null,
  source_language text,
  created_at timestamptz not null default now(),
  unique (message_id, target_language)
);

create index if not exists message_translations_message_id_idx
  on public.message_translations (message_id);

-- RLS on, deny-all to clients: the cache is written and read only by the
-- translate-text edge function via the service role. Clients never touch it
-- directly (prevents leaking message text by guessing message_ids).
alter table public.message_translations enable row level security;

comment on table public.message_translations is
  'Read-through translation cache keyed by (message_id, target_language). Populated by translate-text edge fn (service role). message_id is a generic uuid: a parent_teacher_messages id or a school_news id.';
