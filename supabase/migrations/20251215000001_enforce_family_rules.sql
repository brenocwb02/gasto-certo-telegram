-- Migration: Enforce Family Anti-Abuse Rules
-- Date: 2025-12-15 (Phase 2)

-- 1. Enforce Personal Account Limit (Max 2 for Members)
-- We reuse the existing function logic but wrap it in a trigger
CREATE OR REPLACE FUNCTION public.trigger_check_personal_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
    v_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Only check for Personal accounts
    IF NEW.visibility != 'personal' THEN
        RETURN NEW;
    END IF;

    -- Check if user is a 'member' (not owner) in any active family group
    SELECT role INTO v_role
    FROM public.family_members
    WHERE member_id = NEW.user_id 
    AND status = 'active'
    LIMIT 1;

    -- If user is a MEMBER, enforce limit
    IF v_role = 'member' THEN
        v_limit := 2;
        
        SELECT count(*) INTO v_count
        FROM public.accounts
        WHERE user_id = NEW.user_id 
        AND visibility = 'personal'
        AND ativo = true;

        IF v_count >= v_limit THEN
            RAISE EXCEPTION 'Membros do Plano Família só podem ter 2 contas pessoais. Use as contas compartilhadas do grupo!' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_personal_account_limit_trigger ON public.accounts;
CREATE TRIGGER check_personal_account_limit_trigger
    BEFORE INSERT ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_personal_account_limit();


-- 2. Enforce Family Size Limit (Max 4 Members)
CREATE OR REPLACE FUNCTION public.trigger_check_family_size_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
    v_limit INTEGER := 4; -- 1 Owner + 3 Members
BEGIN
    -- Count current ACTIVE members in the group
    SELECT count(*) INTO v_count
    FROM public.family_members
    WHERE group_id = NEW.group_id
    AND status = 'active';

    IF v_count >= v_limit THEN
        RAISE EXCEPTION 'O grupo familiar atingiu o limite de 4 membros.' USING ERRCODE = 'P0002';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to Invites (Prevent sending invite if full)
DROP TRIGGER IF EXISTS check_family_size_on_invite ON public.family_invites;
CREATE TRIGGER check_family_size_on_invite
    BEFORE INSERT ON public.family_invites
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_family_size_limit();

-- Apply to Members (Prevent accepting join if full)
DROP TRIGGER IF EXISTS check_family_size_on_join ON public.family_members;
CREATE TRIGGER check_family_size_on_join
    BEFORE INSERT ON public.family_members
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_family_size_limit();
