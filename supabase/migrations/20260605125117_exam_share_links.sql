-- Shared-link access for exams.
-- Adds an opt-in, per-test share token so a teacher can copy a link that lets a
-- student take an exam without being individually assigned. Access via the link
-- is gated by both an explicit flag (link_sharing_enabled) and the unguessable
-- token, so it never weakens the default assignment-only model.

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS link_sharing_enabled boolean NOT NULL DEFAULT false;

-- Each test gets a distinct token (existing rows are backfilled by the DEFAULT).
CREATE UNIQUE INDEX IF NOT EXISTS tests_share_token_key
  ON public.tests (share_token);
