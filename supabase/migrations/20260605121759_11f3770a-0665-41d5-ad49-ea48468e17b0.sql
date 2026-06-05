
CREATE TABLE IF NOT EXISTS public.auth_email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  link_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_email_send_log_email_created_idx
  ON public.auth_email_send_log (email, created_at DESC);

GRANT ALL ON public.auth_email_send_log TO service_role;
-- Intentionally no grants to anon/authenticated.

ALTER TABLE public.auth_email_send_log ENABLE ROW LEVEL SECURITY;
-- No policies -> blocked for everyone except service_role (which bypasses RLS).
