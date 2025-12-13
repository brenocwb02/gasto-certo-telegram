-- Migration: Add visibility column to accounts table
-- This enables personal vs family visibility control per account

-- Add visibility column with default 'family' (maintains current behavior)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'family';

-- Add constraint to ensure valid values
ALTER TABLE accounts
ADD CONSTRAINT accounts_visibility_check 
CHECK (visibility IN ('personal', 'family'));

-- Update existing accounts to 'family' (explicit, though default handles it)
UPDATE accounts 
SET visibility = 'family' 
WHERE visibility IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.visibility IS 'Controls who can see transactions in this account: personal (only owner) or family (all group members)';
