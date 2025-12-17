-- Migration: Create notification_logs table for tracking sent notifications
-- This prevents duplicate notifications being sent

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_key ON notification_logs(key);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role can insert notification logs"
  ON notification_logs FOR INSERT
  WITH CHECK (true);

-- Clean old logs (keep only last 30 days)
CREATE OR REPLACE FUNCTION clean_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notification_logs IS 'Tracks sent notifications to prevent duplicates';
