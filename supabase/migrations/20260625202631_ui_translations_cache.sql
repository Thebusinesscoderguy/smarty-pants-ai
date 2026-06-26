-- Persistent translation memory for UI strings (whole-app runtime translator).
-- Translate each (language, source) once; reuse forever across users/pages/reloads.
create table if not exists public.ui_translations (
  target_language text not null,
  source_text text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  primary key (target_language, source_text)
);
-- Written only by the translate-text edge function (service role). Readable by all
-- authenticated + anon clients (UI strings are non-sensitive) for fast warm reads.
alter table public.ui_translations enable row level security;
create policy "Anyone can read ui translations" on public.ui_translations
  for select to anon, authenticated using (true);

comment on table public.ui_translations is 'Translation memory for the runtime UI translator (domTranslator). Keyed by (target_language, source_text).';
