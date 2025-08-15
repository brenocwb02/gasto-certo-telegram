-- supabase/migrations/20250815000000_create_telegram_integration.sql
-- This table will store the link between a Gasto Certo user and their Telegram chat.
CREATE TABLE IF NOT EXISTS public.telegram_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.telegram_integration ENABLE ROW LEVEL SECURITY;

-- Create policies for the new table
CREATE POLICY "Users can manage their own telegram integration"
ON public.telegram_integration
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_integration_user_id ON public.telegram_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integration_chat_id ON public.telegram_integration(telegram_chat_id);

-- Add a column to profiles to store the chat_id, linking it to the user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE;
