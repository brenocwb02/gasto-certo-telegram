-- Add Telegram fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT,
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Create telegram_sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  ultimo_comando TEXT,
  contexto JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on telegram_sessions
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for telegram_sessions
CREATE POLICY "Users can manage their own telegram sessions" 
ON public.telegram_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_telegram_sessions_updated_at
BEFORE UPDATE ON public.telegram_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update accounts table with credit card fields (if not exists)
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS closing_day INTEGER,
ADD COLUMN IF NOT EXISTS due_day INTEGER,
ADD COLUMN IF NOT EXISTS parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON public.accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_user ON public.telegram_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_telegram_id ON public.telegram_sessions(telegram_id);