-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing jobs with same name (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('nightly-auto-grade-homework');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-parent-digest');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Nightly AI grading at 02:00 UTC
SELECT cron.schedule(
  'nightly-auto-grade-homework',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://twfzlbockonxopuindaw.supabase.co/functions/v1/auto-grade-homework',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- Weekly parent digest, Fridays 16:00 UTC
SELECT cron.schedule(
  'weekly-parent-digest',
  '0 16 * * 5',
  $$
  SELECT net.http_post(
    url:='https://twfzlbockonxopuindaw.supabase.co/functions/v1/send-parent-weekly-digest',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);