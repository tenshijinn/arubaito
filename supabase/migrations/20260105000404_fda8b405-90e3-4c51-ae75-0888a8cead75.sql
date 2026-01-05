-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role (required for cron)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule job/task RSS ingestion every hour at minute 0
SELECT cron.schedule(
  'ingest-jobs-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hmdxufttehhpyyqoaosz.supabase.co/functions/v1/cron-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZHh1ZnR0ZWhocHl5cW9hb3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjcyODksImV4cCI6MjA3NjI0MzI4OX0.9uKemTAf70ymld9Y-CFle3zcRJgZPQMD4w5ba6bjkzQ"}'::jsonb,
    body := '{"action": "ingest_jobs"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule mentions ingestion every 30 minutes
SELECT cron.schedule(
  'ingest-mentions-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hmdxufttehhpyyqoaosz.supabase.co/functions/v1/cron-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZHh1ZnR0ZWhocHl5cW9hb3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NjcyODksImV4cCI6MjA3NjI0MzI4OX0.9uKemTAf70ymld9Y-CFle3zcRJgZPQMD4w5ba6bjkzQ"}'::jsonb,
    body := '{"action": "ingest_mentions"}'::jsonb
  ) AS request_id;
  $$
);