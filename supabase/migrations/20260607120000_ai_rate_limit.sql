-- SECURITY (AI bill abuse / DoS): the anonymous AI endpoints (generate-study-plan,
-- generate-adaptive-question, generate-quests, check-open-answer) run with
-- verify_jwt = false so the public demo flow keeps working. That also means anyone
-- on the internet can call them and run up the AI bill. This adds a per-IP,
-- per-endpoint fixed-window rate limiter enforced server-side via an atomic RPC.
--
-- The table is only ever touched by the service role from edge functions, so RLS
-- is enabled with NO policies (which denies all anon/authenticated access; the
-- service role bypasses RLS).

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  endpoint     text        NOT NULL,
  ip           text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (endpoint, ip, window_start)
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Index to make periodic cleanup of old windows cheap.
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_window ON public.ai_rate_limits (window_start);

-- Atomically record a hit and report whether the caller is still within the limit.
-- Fixed-window buckets of _window_seconds (default 1 hour). Returns TRUE if the
-- request is allowed (i.e. the post-increment count is within _limit).
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  _endpoint       text,
  _ip             text,
  _limit          integer DEFAULT 3,
  _window_seconds integer DEFAULT 3600
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window_start timestamptz;
  _count        integer;
BEGIN
  -- Bucket "now" into a fixed window aligned to _window_seconds.
  _window_start := to_timestamp(
    floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds
  );

  INSERT INTO public.ai_rate_limits (endpoint, ip, window_start, count)
  VALUES (_endpoint, COALESCE(NULLIF(_ip, ''), 'unknown'), _window_start, 1)
  ON CONFLICT (endpoint, ip, window_start)
  DO UPDATE SET count = public.ai_rate_limits.count + 1
  RETURNING count INTO _count;

  RETURN _count <= _limit;
END;
$$;

-- Only the service role (used by edge functions) may call this.
REVOKE ALL ON FUNCTION public.check_ai_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit(text, text, integer, integer) TO service_role;
