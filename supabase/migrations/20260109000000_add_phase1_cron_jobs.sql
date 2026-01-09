-- =================================================================
-- NOVOS CRON JOBS - FASE 1 QUICK WINS
-- Alertas de Vencimento + Insight Semanal
-- =================================================================

-- 1. Agendar Lembretes de Vencimento (Todo dia às 06:00 UTC = 03:00 BRT)
-- Envia lembretes para contas que vencem em 0, 1 ou 3 dias
SELECT cron.schedule(
    'due-date-reminders-daily',
    '0 6 * * *',
    $$
    SELECT net.http_post(
        url:='https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/due-date-reminders',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucHdscHh1Z2t6b21xY3ppand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4ODYyNiwiZXhwIjoyMDcwMjY0NjI2fQ.YI2HUjO6WlWUsWxW9EKHVlwpqB3tNiWHPhnUnpXxBCM'
        ),
        body:='{}'::jsonb
    );
    $$
);

-- 2. Agendar Insight Semanal (Toda segunda às 08:00 UTC = 05:00 BRT)
-- Envia resumo semanal para todos os usuários
SELECT cron.schedule(
    'weekly-summary-monday',
    '0 8 * * 1',
    $$
    SELECT net.http_post(
        url:='https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/weekly-summary',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucHdscHh1Z2t6b21xY3ppand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4ODYyNiwiZXhwIjoyMDcwMjY0NjI2fQ.YI2HUjO6WlWUsWxW9EKHVlwpqB3tNiWHPhnUnpXxBCM'
        ),
        body:='{}'::jsonb
    );
    $$
);

-- Para verificar os jobs, execute:
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
