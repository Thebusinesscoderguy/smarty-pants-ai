-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily quest expiration function to run every day at midnight
SELECT cron.schedule(
  'mark-expired-daily-quests',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT
    net.http_post(
        url:='https://twfzlbockonxopuindaw.supabase.co/functions/v1/mark-expired-quests',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);