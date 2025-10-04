import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é uma chamada autorizada (cron job ou manual)
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar a função SQL para gerar transações recorrentes
    const { data, error } = await supabase.rpc('generate_recurring_transactions');

    if (error) {
      console.error('Erro ao gerar transações recorrentes:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          message: 'Erro ao processar transações recorrentes'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Transações recorrentes processadas:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transações recorrentes processadas com sucesso',
        generated_count: data.generated_count,
        error_count: data.error_count,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro interno na função generate-recurring-bills:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Falha ao processar transações recorrentes'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
