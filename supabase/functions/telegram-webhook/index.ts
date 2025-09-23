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
  
  // Update telegram_chat_id in profiles
  await supabase
    .from('profiles')
    .update({ telegram_chat_id: telegramChatId })
    .eq('user_id', license.user_id);
  
  return { success: true, message: '✅ Conta vinculada com sucesso! Agora você pode usar todos os comandos:\n\n🔍 /saldo - Ver saldo das suas contas\n📊 /resumo - Resumo financeiro do mês\n🎯 /metas - Acompanhar suas metas\n❓ /ajuda - Ver lista completa de comandos\n\n💬 Ou simplesmente escreva como "Gastei 25 reais com almoço" que eu registro automaticamente!' };
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
        await sendTelegramMessage(chatId, '👋 *Bem-vindo ao Gasto Certo!*\n\nPara vincular sua conta, use o comando:\n`/start SEU_CODIGO_DE_LICENCA`\n\n📍 Você encontra seu código na aba "Licença" do aplicativo web.\n\n❓ Use /ajuda para ver todos os comandos disponíveis.')
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
      await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nPara começar a usar o bot, você precisa vincular sua conta usando:\n`/start SEU_CODIGO_DE_LICENCA`\n\n📍 Encontre seu código na aba "Licença" do aplicativo web.')
      return new Response('Utilizador não vinculado', { status: 401, headers: corsHeaders });
    }
    
    const userId = integration.user_id;

    // --- Tratamento de Comandos Específicos ---
    if (text.toLowerCase() === '/saldo') {
      // Get account balances
      const { data: accounts } = await supabaseAdmin
        .from('accounts')
        .select('nome, saldo_atual, tipo')
        .eq('user_id', userId)
        .eq('ativo', true);

      let saldoMessage = '💰 *Seus Saldos:*\n\n';
      if (accounts && accounts.length > 0) {
        accounts.forEach(account => {
          const emoji = account.tipo === 'cartao_credito' ? '💳' : account.tipo === 'poupanca' ? '🏦' : '💵';
          saldoMessage += `${emoji} *${account.nome}*: R$ ${account.saldo_atual.toFixed(2)}\n`;
        });
      } else {
        saldoMessage += 'Nenhuma conta encontrada.';
      }
      
        await sendTelegramMessage(chatId, saldoMessage);
    } else if (text.toLowerCase() === '/extrato') {
      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('data_transacao, descricao, valor, tipo')
        .eq('user_id', userId)
        .order('data_transacao', { ascending: false })
        .limit(10);
      
      let extratoMessage = '📄 *Últimas Transações:*\n\n';
      if (transactions && transactions.length > 0) {
        transactions.forEach(t => {
          const emoji = t.tipo === 'receita' ? '🟢' : '🔴';
          const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor);
          const data = new Date(t.data_transacao).toLocaleDateString('pt-BR');
          extratoMessage += `${emoji} *${t.descricao}* - ${valor} [${data}]\n`;
        });
      } else {
        extratoMessage += 'Nenhuma transação encontrada.';
      }    

      await sendTelegramMessage(chatId, saldoMessage);
    } else if (text.toLowerCase() === '/resumo') {
      // Get monthly summary
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('tipo, valor')
        .eq('user_id', userId)
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

      let receitas = 0;
      let despesas = 0;

      if (transactions) {
        transactions.forEach(t => {
          if (t.tipo === 'receita') receitas += Number(t.valor);
          if (t.tipo === 'despesa') despesas += Number(t.valor);
        });
      }

      const saldo = receitas - despesas;
      const resumoMessage = `📊 *Resumo do Mês:*\n\n💚 Receitas: R$ ${receitas.toFixed(2)}\n❌ Despesas: R$ ${despesas.toFixed(2)}\n💰 Saldo: R$ ${saldo.toFixed(2)}`;
      
      await sendTelegramMessage(chatId, resumoMessage);
    } else if (text.toLowerCase() === '/metas') {
      // Get active goals
      const { data: goals } = await supabaseAdmin
        .from('goals')
        .select('titulo, valor_meta, valor_atual')
        .eq('user_id', userId)
        .eq('status', 'ativa');

      let metasMessage = '🎯 *Suas Metas:*\n\n';
      if (goals && goals.length > 0) {
        goals.forEach(goal => {
          const progresso = (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100;
          metasMessage += `📈 *${goal.titulo}*\nMeta: R$ ${Number(goal.valor_meta).toFixed(2)}\nAtual: R$ ${Number(goal.valor_atual).toFixed(2)}\nProgresso: ${progresso.toFixed(1)}%\n\n`;
        });
      } else {
        metasMessage += 'Nenhuma meta ativa encontrada.';
      }
      
      await sendTelegramMessage(chatId, metasMessage);
    } else if (text.toLowerCase() === '/ajuda') {
       const helpMessage = `
👋 *Bem-vindo ao Boas Contas!*

Aqui está um guia completo das minhas funcionalidades.

---
*LANÇAMENTOS (LINGUAGEM NATURAL)*
---
Para registrar, basta enviar uma mensagem como se estivesse a conversar.
*Gastos:* \`gastei 50 no mercado com Cartão Nubank\`
*Receitas:* \`recebi 3000 de salario no Itau\`
*Transferências:* \`transferi 200 do Itau para o PicPay\`

---
*ANÁLISES E RELATÓRIOS*
---
• \`/resumo\` – Visão geral financeira do mês.
• \`/saldo\` – Saldos de todas as suas contas.
• \`/extrato\` – Mostra as últimas transações.
• \`/dashboard\` – Aceder ao dashboard web completo.

---
*PLANEJAMENTO*
---
• \`/metas\` – Veja o progresso das suas metas.

---
*PRODUTIVIDADE*
---
• \`/tarefa DESCRIÇÃO\` – Cria uma nova tarefa.
• \`/tarefas\` – Lista as suas tarefas pendentes.
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
      
      const { valor, descricao, tipo, categoria, categoria_id, conta, conta_origem_id, conta_destino_id, validation_errors, confidence } = nlpData;

      if (validation_errors && validation_errors.length > 0) {
          await sendTelegramMessage(chatId, `❌ Problemas encontrados:\n${validation_errors.join('\n')}\n\nTente ser mais específico, como 'gastei 50 reais no almoço no Nubank'.`)
          return new Response('OK', { status: 200, headers: corsHeaders })
      }

      if (confidence === 'low') {
        await sendTelegramMessage(chatId, "⚠️ Não tenho certeza se entendi corretamente. Tente ser mais específico com valor, conta e categoria.")
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      // Preparar dados da transação
      const transactionData: any = {
          user_id: userId,
          valor,
          descricao,
          tipo,
          origem: 'telegram'
      }

      if (tipo === 'transferencia') {
        if (!conta_origem_id || !conta_destino_id) {
          await sendTelegramMessage(chatId, "Para transferências, preciso saber a conta de origem e destino. Ex: 'transferi 100 do Nubank para a Carteira'")
          return new Response('OK', { status: 200, headers: corsHeaders })
        }
        transactionData.conta_origem_id = conta_origem_id
        transactionData.conta_destino_id = conta_destino_id
      } else {
        if (!conta_origem_id) {
          await sendTelegramMessage(chatId, `Não encontrei a conta "${conta}". Verifique se ela existe no seu app.`)
          return new Response('OK', { status: 200, headers: corsHeaders })
        }
        transactionData.conta_origem_id = conta_origem_id
      }

      if (categoria_id) {
        transactionData.categoria_id = categoria_id
      }

      // Inserir a transação
      const { error: transactionError } = await supabaseAdmin.from('transactions').insert(transactionData)

      if (transactionError) {
        console.error('Transaction error:', transactionError)
        throw transactionError
      }

      const confidenceEmoji = confidence === 'high' ? '✅' : '⚠️'
      const successMessage = `${confidenceEmoji} Transação registrada!\n*${descricao}*: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}`
      
      await sendTelegramMessage(chatId, successMessage)

      // Check for spending alerts
      if (tipo === 'despesa' && valor > 200) {
        await supabaseAdmin.functions.invoke('telegram-notifications', {
          body: { type: 'spending_alert', userId }
        })
      }
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
