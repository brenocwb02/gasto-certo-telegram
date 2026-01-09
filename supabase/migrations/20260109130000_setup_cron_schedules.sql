-- Migration: Setup pg_cron schedules for automated notifications
-- Enables proactive reminders for due dates and weekly summaries

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule: Due Date Reminders - Run daily at 11:00 UTC (08:00 BRT)
-- Checks for bills due today, tomorrow, or in 3 days
SELECT cron.schedule(
    'due-date-reminders-daily',
    '0 11 * * *',  -- Every day at 11:00 UTC (08:00 BRT)
    $$
    SELECT extensions.http_post(
        url := 'https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/due-date-reminders'::text,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);

-- Schedule: Weekly Summary - Run every Monday at 11:00 UTC (08:00 BRT)
-- Sends weekly financial summary to all users
SELECT cron.schedule(
    'weekly-summary-monday',
    '0 11 * * 1',  -- Every Monday at 11:00 UTC (08:00 BRT)
    $$
    SELECT extensions.http_post(
        url := 'https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/weekly-summary'::text,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);

-- Create a view to monitor cron jobs
CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    active
FROM cron.job
WHERE jobname IN ('due-date-reminders-daily', 'weekly-summary-monday');

-- Grant access to view cron jobs
GRANT SELECT ON public.cron_job_status TO authenticated;

COMMENT ON VIEW public.cron_job_status IS 'Monitor scheduled notification jobs';
