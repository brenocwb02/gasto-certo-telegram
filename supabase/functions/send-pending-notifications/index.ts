// supabase/functions/send-pending-notifications/index.ts
import { serve } from "[https://deno.land/std@0.168.0/http/server.ts](https://deno.land/std@0.168.0/http/server.ts)";
import { createClient } from "[https://esm.sh/@supabase/supabase-js@2](https://esm.sh/@supabase/supabase-js@2)";
import { corsHeaders } from "../_shared/cors.ts";

async function sendTelegramMessage(chatId: number, text: string) {
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  return response.ok;
}

serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Buscar notificações pendentes
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('scheduled_notifications')
      .select(`
        id,
        message_content,
        user:profiles!user_id(telegram_chat_id)
      `)
      .eq('status', 'pendente')
      .limit(50);

    if (fetchError) throw fetchError;
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma notificação pendente." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const updates = [];

    // 2. Loop e envio
    for (const notification of notifications) {
      const chat_id = (notification.user as any)?.telegram_chat_id;
      
      if (chat_id) {
        const success = await sendTelegramMessage(chat_id, notification.message_content);
        updates.push({
          id: notification.id,
          status: success ? 'enviado' : 'falhou',
          updated_at: new Date().toISOString()
        });
      } else {
        updates.push({ id: notification.id, status: 'falhou', updated_at: new Date().toISOString() });
      }
    }
    
    // 3. Atualizar status em lote
    if (updates.length > 0) {
      const { error: updateError } = await supabaseAdmin.from('scheduled_notifications').upsert(updates);
      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true, sent_count: updates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
