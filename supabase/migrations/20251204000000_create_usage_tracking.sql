-- Create table to track AI usage (credits)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature_type TEXT NOT NULL, -- 'transaction_parsing', 'chat', 'audio_transcription'
    tokens_used INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
    ON public.ai_usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only server-side functions should insert into this table, but for now we might need client insert if we call AI from client (unlikely, usually via Edge Function)
-- Assuming Edge Functions use service_role, they bypass RLS.

-- Function to check transaction limit
CREATE OR REPLACE FUNCTION public.check_transaction_limit(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_plan TEXT;
    tx_count INTEGER;
    limit_count INTEGER;
    user_created_at TIMESTAMP WITH TIME ZONE;
    is_trial_period BOOLEAN;
    start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user's plan
    SELECT plano INTO current_plan
    FROM public.licenses
    WHERE licenses.user_id = check_transaction_limit.user_id AND status = 'ativo';

    -- Default to free if no license found
    IF current_plan IS NULL THEN
        current_plan := 'gratuito';
    END IF;

    -- If not free, unlimited (or high limit)
    IF current_plan != 'gratuito' THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'limit', -1,
            'usage', 0,
            'plan', current_plan
        );
    END IF;

    -- Get user creation date for trial logic
    SELECT created_at INTO user_created_at
    FROM auth.users
    WHERE id = check_transaction_limit.user_id;

    -- Check if in first 30 days
    is_trial_period := (now() - user_created_at) < interval '30 days';

    -- Set limit based on trial status
    IF is_trial_period THEN
        limit_count := 100;
    ELSE
        limit_count := 75;
    END IF;

    -- Count transactions for current month
    start_of_month := date_trunc('month', now());
    
    SELECT count(*) INTO tx_count
    FROM public.transactions
    WHERE transactions.user_id = check_transaction_limit.user_id
    AND date >= start_of_month::date;

    RETURN jsonb_build_object(
        'allowed', tx_count < limit_count,
        'limit', limit_count,
        'usage', tx_count,
        'plan', current_plan,
        'is_trial', is_trial_period
    );
END;
$$;
