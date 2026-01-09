-- Create notification_logs table to handle deduplication of alerts
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups on deduplication key
CREATE INDEX IF NOT EXISTS idx_notification_logs_key ON public.notification_logs(key);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Service Role needs full access, authenticated users might read their own logs?)
-- For the Edge Function usage (Service Role), RLS is bypassed.
-- But for good measure, let's allow users to view their own logs if needed.
CREATE POLICY "Users can view their own notification logs"
    ON public.notification_logs
    FOR SELECT
    USING (auth.uid() = user_id);
