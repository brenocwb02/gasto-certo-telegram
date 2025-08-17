// supabase/functions/telegram-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Função auxiliar para enviar mensagens de volta para o Telegram.
 * @param chatId O ID do chat para onde enviar a mensagem.
 * @param text O texto da mensagem (suporta Markdown).
 * @param options Opções extras, como teclados inline.
 */
async function sendTelegramMessage(chatId: number, text: string, options: object = {}) {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`
  try {
    // Adiciona parse_mode Markdown por padrão se não for especificado
    const body = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...options,
    };
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("Erro na API do Telegram:", await response.json());
    }
  } catch (e) {
    console.error("Falha ao enviar mensagem para o Telegram:", e);
  }
}

/**
 * Vincula a conta de um utilizador do Telegram à sua licença no "Boas Contas".
 * @param supabase Cliente Supabase.
 * @param telegramChatId ID do chat do Telegram.
 * @param licenseCode Código da licença fornecido pelo utilizador.
 * @returns Um objeto com o resultado da operação.
 */
async function linkUserWithLicense(supabase: SupabaseClient, telegramChatId: number, licenseCode: string): Promise<{ success: boolean; message: string }> {
  console.log(`Tentando vincular a licença ${licenseCode} ao chat ${telegramChatId}`)
  
  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('user_id, status')
    .eq('codigo', licenseCode)
    .single()

  if (licenseError || !license || license.status !== 'ativo') {
    console.error('Licença não encontrada ou inativa:', licenseError)
    return { success: false, message: '❌ Código de licença inválido, expirado ou não encontrado.' };
  }

  // Verifica se este chat já está vinculado
  const { data: existingIntegration, error: existingError } = await supabase
    .from('telegram_integration')
    .select('user_id')
    .eq('telegram_chat_id', telegramChatId)
    .single();

  if (existingIntegration) {
    if (existingIntegration.user_id === license.user_id) {
      return { success: true, message: '✅ Este chat já está vinculado à sua conta.' };
    } else {
      return { success: false, message: '⚠️ Este chat do Telegram já está vinculado a outra conta.' };
    }
  }

  // Cria o vínculo
  const { error: insertError } = await supabase
    .from('telegram_integration')
    .insert({ user_id: license.user_id, telegram_chat_id: telegramChatId });

  if (insertError) {
    console.error('Erro ao vincular a conta:', insertError)
    return { success: false, message: '❌ Ocorreu um erro ao vincular a sua conta. Tente novamente.' };
  }
  
  return { success: true, message: '✅ Conta vinculada com sucesso! Agora você pode registrar transações ou usar /ajuda para ver os comandos.' };
}

/**
 * Função principal do webhook que processa todas as mensagens e comandos.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const message = body.message || body.callback_query?.message;
    const text = (body.message?.text || body.callback_query?.data || "").trim();
    const chatId = message?.chat?.id;

    if (!chatId || !text) {
      return new Response('Payload inválido', { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Lógica de Comandos ---
    if (text.startsWith('/start')) {
      const licenseCode = text.split(' ')[1]
      if (!licenseCode) {
        await sendTelegramMessage(chatId, 'Para começar, use o comando `/start SEU_CODIGO_DE_VINCULACAO` que você encontra na página de Telegram no site.')
      } else {
        const result = await linkUserWithLicense(supabaseAdmin, chatId, licenseCode)
        await sendTelegramMessage(chatId, result.message)
      }
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // A partir daqui, o utilizador precisa estar vinculado
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('telegram_integration')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .single()

    if (integrationError || !integration) {
      await sendTelegramMessage(chatId, 'Sua conta do Telegram não está vinculada. Use `/start SEU_CODIGO_DE_VINCULACAO` para começar.')
      return new Response('Utilizador não vinculado', { status: 401, headers: corsHeaders });
    }
    
    const userId = integration.user_id;

    // --- Tratamento de Comandos Específicos ---
    if (text.toLowerCase() === '/saldo') {
      // TODO: Implementar a lógica para buscar e enviar o saldo do utilizador
      await sendTelegramMessage(chatId, "Comando /saldo em desenvolvimento!");
    } else if (text.toLowerCase() === '/resumo') {
      // TODO: Implementar a lógica para buscar e enviar o resumo do utilizador
      await sendTelegramMessage(chatId, "Comando /resumo em desenvolvimento!");
    } else if (text.toLowerCase() === '/metas') {
      // TODO: Implementar a lógica para buscar e enviar as metas do utilizador
      await sendTelegramMessage(chatId, "Comando /metas em desenvolvimento!");
    } else if (text.toLowerCase() === '/ajuda') {
       const helpMessage = `
👋 *Bem-vindo ao Boas Contas!*

*Para registrar um lançamento, basta enviar uma mensagem como:*
• \`gastei 50 no mercado com Nubank\`
• \`recebi 3000 de salario no Itau\`
• \`transferi 200 do Itau para o Mercado Pago\`

*Comandos disponíveis:*
• \`/resumo\` – Resumo financeiro do mês.
• \`/saldo\` – Saldo de todas as contas e faturas.
• \`/metas\` – Acompanhe suas metas.
• \`/ajuda\` – Ver esta mensagem novamente.
      `;
      await sendTelegramMessage(chatId, helpMessage);
    } else {
      // --- Se não for um comando, é um lançamento ---
      await sendTelegramMessage(chatId, "🧠 Analisando sua mensagem...");

      const { data: nlpData, error: nlpError } = await supabaseAdmin.functions.invoke('nlp-transaction', {
          body: { text, userId },
      })

      if (nlpError || !nlpData) {
        console.error("Erro na função NLP:", nlpError);
        await sendTelegramMessage(chatId, "Desculpe, não consegui processar sua mensagem agora. Tente novamente mais tarde.");
        throw new Error('Erro ao processar mensagem com NLP.')
      }
      
      const { valor, descricao, tipo, categoria, subcategoria, conta, conta_origem, conta_destino } = nlpData;

      if (!valor || !descricao || !tipo) {
          await sendTelegramMessage(chatId, "Não consegui entender os detalhes da transação. Tente ser mais específico, como 'gastei 50 reais no almoço'.")
          return new Response('OK', { status: 200, headers: corsHeaders })
      }

      // Encontrar IDs correspondentes para conta e categoria
      const { data: accountData } = await supabaseAdmin.from('accounts').select('id').eq('user_id', userId).eq('nome', conta || conta_origem).single();
      const { data: categoryData } = await supabaseAdmin.from('categories').select('id').eq('user_id', userId).eq('nome', categoria).single();

      if (!accountData) {
        await sendTelegramMessage(chatId, `A conta "${conta || conta_origem}" não foi encontrada. Verifique o nome e tente novamente.`);
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // Inserir a transação
      const { error: transactionError } = await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          conta_origem_id: accountData.id,
          valor,
          descricao,
          tipo,
          categoria_id: categoryData?.id || null,
          origem: 'telegram'
      })

      if (transactionError) throw transactionError;

      await sendTelegramMessage(chatId, `✅ Transação registrada!\n*${descricao}*: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})
