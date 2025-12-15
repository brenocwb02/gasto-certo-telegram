
import { createClient } from '@supabase/supabase-js'

const PROJECT_REF = 'dnpwlpxugkzomqczijwy'
const PAT = 'sbp_0fa7deef58931d7c66ac8fd4cf85fe4f148218bc'

async function main() {
    console.log('Fetching Service Role Key...')

    // 1. Get Service Role Key from Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
        headers: {
            'Authorization': `Bearer ${PAT}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch keys: ${response.status} ${response.statusText}`)
    }

    const keys = await response.json()
    console.log('Available keys:', keys.map((k: any) => ({ name: k.name, tags: k.tags })))
    const serviceKey = keys.find((k: any) => k.name === 'service_role')?.api_key

    if (!serviceKey) {
        console.error('Service role key not found!')
        process.exit(1)
    }

    console.log('Service Key found. Connecting to Supabase...')

    // 2. Connect with Service Role Key
    const supabase = createClient(`https://${PROJECT_REF}.supabase.co`, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    // 3. Define the SQL to run
    // We combine both migrations here for efficiency
    const sql = `
  -- DISABLE AUTO CATEGORIES
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (user_id, nome)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
    
    INSERT INTO public.licenses (user_id, codigo, status, tipo, data_ativacao)
    VALUES (NEW.id, 'TRIAL-' || substr(NEW.id::text, 1, 8), 'ativo', 'vitalicia', now());
    
    INSERT INTO public.accounts (user_id, nome, tipo, saldo_inicial, saldo_atual, cor) VALUES
    (NEW.id, 'Carteira', 'dinheiro', 0, 0, '#10b981'),
    (NEW.id, 'Conta Corrente', 'corrente', 0, 0, '#3b82f6');
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- DELETE ALL CATEGORIES RPC
  CREATE OR REPLACE FUNCTION public.delete_all_categories()
  RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    DELETE FROM public.categories 
    WHERE user_id = auth.uid();
  END;
  $$;

  GRANT EXECUTE ON FUNCTION public.delete_all_categories() TO authenticated;
  
  COMMENT ON FUNCTION public.delete_all_categories IS 'Deletes all categories for the calling user.';
  `

    console.log('Executing SQL...')

    // 4. Run SQL via RPC (if available) or raw query?
    // Supabase JS client doesn't support raw SQL on the client usually, 
    // UNLESS we use the Postgres connection or an Edge Function.
    // BUT, we can use the Management API 'query' endpoint! 

    // Wait, Management API has a /query endpoint? No.
    // We can use the 'postgres' generic query if enabled, OR we can use the MCP tool concept...
    // Actually, the easiest way with the PAT/Service Key is using the Postgres connection string if we had the password.
    // But we don't have the DB password.

    // Alternative: Use the rest API to call a function? No, we need to creating functions.
    // The MCP tool `mcp_supabase-mcp-server_execute_sql` failed before.

    // Let's try the `v1/projects/{ref}/query` endpoint if it exists? 
    // Explicitly it's `POST https://api.supabase.com/v1/projects/{ref}/sql`

    const sqlResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PAT}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    })

    if (!sqlResponse.ok) {
        const text = await sqlResponse.text()
        console.error('Failed to execute SQL:', text)
        process.exit(1)
    }

    console.log('SQL Executed Successfully!')
    console.log(await sqlResponse.text())
}

main().catch(console.error)
