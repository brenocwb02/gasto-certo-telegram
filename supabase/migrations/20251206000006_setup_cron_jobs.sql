-- =================================================================
-- AGENDAMENTO DE TAREFAS AUTOMÁTICAS (CRON JOBS)
-- =================================================================

-- 1. Habilitar extensões necessárias para agendamento e chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Agendar Processamento de Pagamentos (Todo dia às 08:00 UTC)
-- URL do Projeto: https://dnpwlpxugkzomqczijwy.supabase.co
SELECT cron.schedule(
    'process-auto-payments-daily', -- Nome da tarefa
    '0 8 * * *',                   -- Horário: 08:00 todo dia
    $$
    SELECT net.http_post(
        url:='https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/process-auto-payments',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucHdscHh1Z2t6b21xY3ppand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4ODYyNiwiZXhwIjoyMDcwMjY0NjI2fQ.YI2HUjO6WlWUsWxW9EKHVlwpqB3tNiWHPhnUnpXxBCM' 
        ),
        body:='{}'::jsonb
    );
    $$
);

-- 3. Agendar Lembretes de Cartão (Todo dia às 09:00 UTC)
SELECT cron.schedule(
    'credit-card-reminders-daily', -- Nome da tarefa
    '0 9 * * *',                   -- Horário: 09:00 todo dia
    $$
    SELECT net.http_post(
        url:='https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/credit-card-reminders',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucHdscHh1Z2t6b21xY3ppand5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY4ODYyNiwiZXhwIjoyMDcwMjY0NjI2fQ.YI2HUjO6WlWUsWxW9EKHVlwpqB3tNiWHPhnUnpXxBCM'
        ),
        body:='{}'::jsonb
    );
    $$
);

-- Para verificar se foi agendado, execute depois:
-- SELECT * FROM cron.job;
