import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN não configurado');
    }

    // Get authorization header and extract JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Get bot information from Telegram API
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botInfoResponse.json();
    
    if (!botInfo.ok) {
      throw new Error('Erro ao obter informações do bot');
    }

    // Generate activation code for the user
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('codigo')
      .eq('user_id', user.id)
      .eq('status', 'ativo')
      .single();

    if (licenseError) {
      console.error('Erro ao buscar licença:', licenseError);
    }

    const activationCode = license?.codigo || `GC-${user.id.slice(0, 8).toUpperCase()}`;

    return new Response(JSON.stringify({
      success: true,
      botUsername: botInfo.result.username,
      userCode: activationCode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função telegram-bot-setup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
