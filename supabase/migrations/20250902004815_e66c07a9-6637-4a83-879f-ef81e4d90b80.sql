-- Add Telegram integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT,
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Create telegram_integration table for linking users to Telegram chats
CREATE TABLE IF NOT EXISTS public.telegram_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on telegram_integration
ALTER TABLE public.telegram_integration ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for telegram_integration
CREATE POLICY "Users can manage their own telegram integration" 
ON public.telegram_integration 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on telegram_integration
CREATE TRIGGER update_telegram_integration_updated_at
  BEFORE UPDATE ON public.telegram_integration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();