-- RPC: Check Personal Account Limit
-- Validates if a user (member) can create more personal accounts
-- Owner: Unlimited
-- Member: Max 2 personal accounts
-- Solo/Free: Unlimited (managed by subscription tier, not this RPC)

CREATE OR REPLACE FUNCTION check_personal_account_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_count INT;
  v_group_id UUID;
BEGIN
  -- 1. Check if user is in a family group and get role
  SELECT group_id, role INTO v_group_id, v_role
  FROM family_members
  WHERE member_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  -- 2. If not in a group, this specific limit doesn't apply (handled by plan tiers)
  IF v_group_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 3. Owner has no limits on personal accounts
  IF v_role = 'owner' THEN
    RETURN TRUE;
  END IF;
  
  -- 4. Count existing PERSONAL accounts for this member
  SELECT COUNT(*) INTO v_count
  FROM accounts
  WHERE user_id = p_user_id 
    AND visibility = 'personal'
    AND ativo = true;
  
  -- 5. Limit is 2 for members
  IF v_count >= 2 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
