-- Add 'efetivada' column to transactions table
ALTER TABLE transactions
ADD COLUMN efetivada BOOLEAN NOT NULL DEFAULT TRUE;

-- Add 'gerar_pendente' column to recurring_transactions table
ALTER TABLE recurring_transactions
ADD COLUMN gerar_pendente BOOLEAN NOT NULL DEFAULT FALSE;

-- Update the create_recurring_transaction function to include the new parameter
CREATE OR REPLACE FUNCTION create_recurring_transaction(
    p_title TEXT,
    p_amount DECIMAL,
    p_type TEXT,
    p_frequency TEXT,
    p_start_date DATE,
    p_description TEXT DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_account_id UUID DEFAULT NULL,
    p_group_id UUID DEFAULT NULL,
    p_day_of_month INTEGER DEFAULT NULL,
    p_day_of_week INTEGER DEFAULT NULL,
    p_gerar_pendente BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO recurring_transactions (
        user_id,
        title,
        description,
        amount,
        type,
        frequency,
        start_date,
        end_date,
        category_id,
        account_id,
        group_id,
        day_of_month,
        day_of_week,
        gerar_pendente
    ) VALUES (
        v_user_id,
        p_title,
        p_description,
        p_amount,
        p_type,
        p_frequency,
        p_start_date,
        p_end_date,
        p_category_id,
        p_account_id,
        p_group_id,
        p_day_of_month,
        p_day_of_week,
        p_gerar_pendente
    )
    RETURNING row_to_json(recurring_transactions.*) INTO v_result;

    RETURN v_result;
END;
$$;
