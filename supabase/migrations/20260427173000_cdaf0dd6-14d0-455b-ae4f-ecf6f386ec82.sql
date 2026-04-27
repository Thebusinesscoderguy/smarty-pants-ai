-- Unschedule any prior version, then re-create.
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'exam-auto-submit-expired';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'exam-auto-submit-expired',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://twfzlbockonxopuindaw.supabase.co/functions/v1/exam-auto-submit-expired',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);