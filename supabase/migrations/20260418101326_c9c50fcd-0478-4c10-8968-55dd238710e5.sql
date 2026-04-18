
SELECT cron.schedule(
  'send-principal-weekly-digest',
  '0 7 * * 1',
  $$SELECT net.http_post(
    url:='https://twfzlbockonxopuindaw.supabase.co/functions/v1/send-principal-weekly-digest',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);
