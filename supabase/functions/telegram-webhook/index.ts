import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// --- Funções Auxiliares ---

/**
 * Formata um número para a moeda BRL.
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Envia uma mensagem para o Telegram.
 */
async function sendTelegramMessage(chatId: number, text: string, options: object = {}) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
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
      return null;
    }
    const data = await response.json();
    return data.result;
  } catch (e) {
    console.error("Falha ao enviar mensagem para o Telegram:", e);
    return null;
  }
}

/**
 * Edita uma mensagem existente no Telegram.
 */
async function editTelegramMessage(chatId: number, messageId: number, text: string, options: object = {}) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/editMessageText`;
  try {
    await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        ...options
      }),
    });
  } catch (e) {
    console.error("Falha ao editar mensagem do Telegram:", e);
  }
}

/**
 * Transcreve um áudio do Telegram usando a API do Gemini.
 */
async function getTranscriptFromAudio(fileId: string): Promise<string> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');

  if (!botToken || !googleApiKey) {
    throw new Error("As chaves de API do Telegram ou do Google AI não estão configuradas.");
  }

  const fileInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoResponse.json();
  if (!fileInfo.ok) throw new Error("Não foi possível obter informações do ficheiro de áudio do Telegram.");
  const filePath = fileInfo.result.file_path;

  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const audioResponse = await fetch(fileUrl);
  const audioBlob = await audioResponse.blob();
  const audioArrayBuffer = await audioBlob.arrayBuffer();

  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));
  const mimeType = audioBlob.type || 'audio/ogg';

  const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${googleApiKey}`;
  const prompt = "Transcreva este áudio em português:";

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Audio } }
      ]
    }]
  };

  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!geminiResponse.ok) {
    const errorBody = await geminiResponse.json();
    console.error('Google AI API Error (Audio):', errorBody);
    throw new Error(`Erro ao transcrever áudio: ${errorBody.error.message}`);
  }

  const result = await geminiResponse.json();
  const transcript = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!transcript) {
    throw new Error("A IA não conseguiu transcrever o áudio.");
  }

  return transcript;
}


/**
 * Vincula a conta de um utilizador do Telegram à sua licença.
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

  // Verifica se o chat já está em uso por outro user
  const { data: existingIntegration } = await supabase
    .from('telegram_integration')
    .select('user_id')
    .eq('telegram_chat_id', telegramChatId)
    .maybeSingle();

  if (existingIntegration) {
    if (existingIntegration.user_id === license.user_id) {
      return { success: true, message: '✅ Este chat já está vinculado à sua conta.' };
    } else {
      return { success: false, message: '⚠️ Este chat do Telegram já está vinculado a outra conta.' };
    }
  }

  const { error: insertError } = await supabase
    .from('telegram_integration')
    .insert({ user_id: license.user_id, telegram_chat_id: telegramChatId });

  if (insertError) {
    console.error('Erro ao vincular a conta:', insertError)
    return { success: false, message: '❌ Ocorreu um erro ao vincular a sua conta. Tente novamente.' };
  }
  
  await supabase
    .from('profiles')
    .update({ telegram_chat_id: telegramChatId })
    .eq('user_id', license.user_id);
  
  return { success: true, message: '✅ Conta vinculada com sucesso! Agora você pode usar todos os comandos:\n\n🔍 /saldo - Ver saldo das suas contas\n📊 /resumo - Resumo financeiro do mês\n🎯 /metas - Acompanhar suas metas\n❓ /ajuda - Ver lista completa de comandos\n\n💬 Ou simplesmente escreva como "Gastei 25 reais com almoço" que eu registro automaticamente!' };
}

// --- Funções de Manipulação de Comandos ---

async function handleCommand(supabase: SupabaseClient, command: string, userId: string, chatId: number) {
  switch (command) {
    case '/saldo': {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('nome, saldo_atual, tipo')
        .eq('user_id', userId)
        .eq('ativo', true);
      let saldoMessage = '💰 *Seus Saldos:*\n\n';
      if (accounts && accounts.length > 0) {
        accounts.forEach(account => {
          const emoji = account.tipo.includes('cartao') ? '💳' : account.tipo === 'poupanca' ? '🏦' : '💵';
          saldoMessage += `${emoji} *${account.nome}*: ${formatCurrency(account.saldo_atual)}\n`;
        });
      } else {
        saldoMessage += 'Nenhuma conta encontrada.';
      }
      await sendTelegramMessage(chatId, saldoMessage);
      break;
    }
    case '/extrato': {
        const { data: transactions } = await supabase
            .from('transactions')
            .select('data_transacao, descricao, valor, tipo')
            .eq('user_id', userId)
            .order('data_transacao', { ascending: false })
            .limit(10);
        
        let extratoMessage = '📄 *Últimas Transações:*\n\n';
        if (transactions && transactions.length > 0) {
            transactions.forEach(t => {
                const emoji = t.tipo === 'receita' ? '🟢' : '🔴';
                const valor = formatCurrency(t.valor);
                const data = new Date(t.data_transacao).toLocaleDateString('pt-BR');
                extratoMessage += `${emoji} *${t.descricao}* - ${valor} [${data}]\n`;
            });
        } else {
            extratoMessage += 'Nenhuma transação encontrada.';
        }
        await sendTelegramMessage(chatId, extratoMessage);
        break;
    }
    case '/resumo': {
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: transactions } = await supabase
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
      const resumoMessage = `📊 *Resumo do Mês:*\n\n💚 Receitas: ${formatCurrency(receitas)}\n❌ Despesas: ${formatCurrency(despesas)}\n💰 Saldo: ${formatCurrency(saldo)}`;
      await sendTelegramMessage(chatId, resumoMessage);
      break;
    }
    case '/metas': {
      const { data: goals } = await supabase
        .from('goals')
        .select('titulo, valor_meta, valor_atual')
        .eq('user_id', userId)
        .eq('status', 'ativa');

      let metasMessage = '🎯 *Suas Metas:*\n\n';
      if (goals && goals.length > 0) {
        goals.forEach(goal => {
          const progresso = (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100;
          metasMessage += `📈 *${goal.titulo}*\nMeta: ${formatCurrency(goal.valor_meta)}\nAtual: ${formatCurrency(goal.valor_atual)}\nProgresso: ${progresso.toFixed(1)}%\n\n`;
        });
      } else {
        metasMessage += 'Nenhuma meta ativa encontrada.';
      }
      await sendTelegramMessage(chatId, metasMessage);
      break;
    }
    case '/ajuda': {
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
*Voz:* Envie um áudio com o comando de lançamento.

---
*ANÁLISES E RELATÓRIOS*
---
• \`/resumo\` – Visão geral financeira do mês.
• \`/saldo\` – Saldos de todas as suas contas.
• \`/extrato\` – Mostra as últimas transações.
• \`/dashboard\` – Aceder ao dashboard web completo.

---
*PLANEAMENTO*
---
• \`/metas\` – Veja o progresso das suas metas.

---
*PRODUTIVIDADE*
---
• \`/ajuda\` – Mostra este guia.
      `;
      await sendTelegramMessage(chatId, helpMessage);
      break;
    }
    default:
      await sendTelegramMessage(chatId, "Comando não reconhecido. Use /ajuda para ver a lista de comandos.");
  }
}

/**
 * Lida com a seleção de botões inline para corrigir campos faltantes.
 */
async function handleMissingFieldSelection(supabase: SupabaseClient, callbackQuery: any, action: string, sessionId: string, userId: string, chatId: number, messageId: number) {
    const { data: sessionData, error: sessionError } = await supabase
        .from('telegram_sessions')
        .select('contexto')
        .eq('id', sessionId)
        .single();
    
    if (sessionError || !sessionData || !sessionData.contexto) {
        await editTelegramMessage(chatId, messageId, "Esta sessão de correção expirou.");
        return;
    }

    const transactionData = sessionData.contexto as any;
    const [actionType, valueId] = action.split('-');

    // 1. Atualiza o dado faltante no contexto da sessão
    let fieldToFix = '';
    if (actionType === 'fixContaOrigem') {
        transactionData.conta_origem_id = valueId;
        fieldToFix = 'Conta de Origem';
    } else if (actionType === 'fixCategoria') {
        transactionData.categoria_id = valueId;
        fieldToFix = 'Categoria';
    } else if (actionType === 'fixContaDestino') {
        transactionData.conta_destino_id = valueId;
        fieldToFix = 'Conta de Destino';
    }

    // 2. Tenta re-validar e obter o próximo passo
    await supabase.from('telegram_sessions').update({ contexto: transactionData }).eq('id', sessionId);
    
    // Simula a validação dos dados atuais para verificar o que ainda falta
    const validationResult = await validatePartialTransaction(supabase, userId, transactionData);
    
    // 3. Verifica se todos os campos estão preenchidos
    if (validationResult.isComplete) {
        // Todos os campos preenchidos, passa para a confirmação final
        await supabase.from('telegram_sessions').update({ contexto: validationResult.transactionData }).eq('id', sessionId);
        const confirmationMessage = await buildConfirmationMessage(validationResult.transactionData, supabase);
        
        await editTelegramMessage(chatId, messageId, confirmationMessage.message, { 
            reply_markup: { inline_keyboard: confirmationMessage.keyboard } 
        });
        
    } else {
        // Ainda faltam campos, continua o fluxo de perguntas
        const nextPrompt = await buildMissingFieldPrompt(validationResult.transactionData, validationResult.missingFields, supabase, sessionId);
        await editTelegramMessage(chatId, messageId, nextPrompt.message, { 
            reply_markup: { inline_keyboard: nextPrompt.keyboard } 
        });
    }

    await supabase.from('telegram_sessions').delete().eq('id', sessionId);
}


/**
 * Valida a transação parcial e retorna o que ainda falta.
 */
async function validatePartialTransaction(supabase: SupabaseClient, userId: string, data: any) {
    const missingFields: string[] = [];
    const transactionData = { ...data };

    if (!transactionData.conta_origem_id) missingFields.push('ContaOrigem');
    
    if (transactionData.tipo !== 'transferencia') {
        if (!transactionData.categoria_id) missingFields.push('Categoria');
    }

    if (transactionData.tipo === 'transferencia' && !transactionData.conta_destino_id) {
        missingFields.push('ContaDestino');
    }

    // Se todos os campos estiverem preenchidos, retorna isComplete=true
    return {
        isComplete: missingFields.length === 0,
        missingFields,
        transactionData,
    };
}


/**
 * Constrói o prompt e o teclado para o campo faltante.
 */
async function buildMissingFieldPrompt(data: any, missingFields: string[], supabase: SupabaseClient, sessionId: string) {
    const field = missingFields[0]; // Foca no primeiro campo faltante

    // 1. Obter opções do Supabase
    let options: Array<{ id: string; nome: string; emoji: string }> = [];
    let promptMessage = '';
    let actionPrefix = '';

    if (field === 'ContaOrigem' || field === 'ContaDestino') {
        promptMessage = `Por favor, selecione a **${field === 'ContaOrigem' ? 'Conta de Origem' : 'Conta de Destino'}** para a transação:`;
        actionPrefix = field === 'ContaOrigem' ? 'fixContaOrigem' : 'fixContaDestino';
        const { data: accounts } = await supabase.from('accounts').select('id, nome, tipo').eq('user_id', data.user_id).eq('ativo', true);
        options = accounts ? accounts.map(a => ({
            id: a.id,
            nome: a.nome,
            emoji: a.tipo.includes('cartao') ? '💳' : a.tipo === 'poupanca' ? '🏦' : '💵'
        })) : [];
    } else if (field === 'Categoria') {
        promptMessage = `Por favor, selecione a **Categoria** (${data.tipo}) para a transação:`;
        actionPrefix = 'fixCategoria';
        const { data: categories } = await supabase.from('categories').select('id, nome').eq('user_id', data.user_id).eq('tipo', data.tipo).order('nome');
        options = categories ? categories.map(c => ({
            id: c.id,
            nome: c.nome,
            emoji: '' // Emojis para categorias são opcionais, mas podem ser adicionados.
        })) : [];
    }

    // 2. Constrói o teclado inline
    const keyboard = options.map(opt => [{ 
        text: `${opt.emoji} ${opt.nome}`, 
        callback_data: `${actionPrefix}-${opt.id}:${sessionId}` 
    }]);

    return {
        message: `${promptMessage}\n\n*Transação Parcial:* ${data.descricao} - ${formatCurrency(data.valor)}`,
        keyboard
    };
}

/**
 * Constrói a mensagem final de confirmação com os botões Confirmar/Cancelar.
 */
async function buildConfirmationMessage(data: any, supabase: SupabaseClient) {
    const { data: category } = await supabase.from('categories').select('nome').eq('id', data.categoria_id).maybeSingle();
    const { data: accountOrigem } = await supabase.from('accounts').select('nome').eq('id', data.conta_origem_id).maybeSingle();
    const { data: accountDestino } = data.conta_destino_id ? await supabase.from('accounts').select('nome').eq('id', data.conta_destino_id).maybeSingle() : { data: null };
    
    let confirmationMessage = `✅ *Entendido! Por favor, confirme:*\n\n`;
    confirmationMessage += `*Tipo:* ${data.tipo.charAt(0).toUpperCase() + data.tipo.slice(1)}\n`;
    confirmationMessage += `*Descrição:* ${data.descricao}\n`;
    confirmationMessage += `*Valor:* ${formatCurrency(data.valor)}\n`;
    confirmationMessage += `*Conta Origem:* ${accountOrigem?.nome || 'N/A'}\n`;
    if (data.tipo !== 'transferencia') {
        confirmationMessage += `*Categoria:* ${category?.nome || 'N/A'}\n`;
    } else if (accountDestino?.nome) {
        confirmationMessage += `*Conta Destino:* ${accountDestino.nome}\n`;
    }
    if (data.installment_total > 1) {
        confirmationMessage += `*Parcelas:* ${data.installment_total}\n`;
    }

    const inline_keyboard = [[
        { text: "✅ Confirmar", callback_data: `confirm_transaction:${data.id}` },
        { text: "❌ Cancelar", callback_data: `cancel_transaction:${data.id}` }
    ]];
    
    return {
        message: confirmationMessage,
        keyboard: inline_keyboard
    };
}


// --- Lógica Principal do Webhook ---

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const message = body.message;
    const callbackQuery = body.callback_query;
    
    // --- Lógica de Callbacks (Botões Inline) ---
    if (callbackQuery) {
        const [actionData, sessionId] = callbackQuery.data.split(':');
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;

        // Recupera o user_id da integração
        const { data: integration } = await supabaseAdmin
          .from('telegram_integration')
          .select('user_id')
          .eq('telegram_chat_id', chatId)
          .single();
        
        if (!integration) {
            await editTelegramMessage(chatId, messageId, "Erro: Usuário não vinculado.");
            return new Response('OK', { status: 200, headers: corsHeaders });
        }
        const userId = integration.user_id;

        // Lógica de Confirmação Final ou Correção de Campo
        if (actionData === 'confirm_transaction' || actionData === 'cancel_transaction') {
            const { data: session } = await supabaseAdmin
                .from('telegram_sessions')
                .select('contexto')
                .eq('id', sessionId)
                .single();
            
            if (!session || !session.contexto) {
                await editTelegramMessage(chatId, messageId, "Esta sessão expirou.");
                return new Response('OK', { status: 200, headers: corsHeaders });
            }

            const transactionData = session.contexto as any;
            
            if (actionData === 'confirm_transaction') {
                const { error: transactionError } = await supabaseAdmin.from('transactions').insert({
                    ...transactionData,
                    user_id: userId,
                    origem: 'telegram',
                    valor: transactionData.valor,
                    installment_total: transactionData.installment_total || 1, // Garantir o campo
                });
                if (transactionError) throw transactionError;

                await editTelegramMessage(chatId, messageId, `✅ Transação registada!\n*${transactionData.descricao}*: ${formatCurrency(transactionData.valor)}`);
            } else {
                await editTelegramMessage(chatId, messageId, "❌ Registo cancelado.");
            }

            // Limpa a sessão após o uso
            await supabaseAdmin.from('telegram_sessions').delete().eq('id', sessionId);
        } else if (actionData.startsWith('fix')) {
            // Lógica de correção de campo faltante
            await handleMissingFieldSelection(supabaseAdmin, callbackQuery, actionData, sessionId, userId, chatId, messageId);
        }
        
        return new Response('OK', { status: 200, headers: corsHeaders });
    }
    
    // --- Tratamento de Mensagens de Texto e Voz ---
    if (!message || !message.chat?.id) {
        return new Response('Payload inválido', { status: 400, headers: corsHeaders });
    }
    
    const chatId = message.chat.id;
    let text = message.text ? message.text.trim() : null;
    const voice = message.voice;

    if (!text && !voice) {
        return new Response('Nenhuma mensagem de texto ou voz encontrada', { status: 200, headers: corsHeaders });
    }

    // Comando /start para vincular conta
    if (text && text.startsWith('/start')) {
        const licenseCode = text.split(' ')[1];
        if (!licenseCode) {
            await sendTelegramMessage(chatId, '👋 *Bem-vindo ao Gasto Certo!*\n\nPara vincular sua conta, use o comando:\n`/start SEU_CODIGO_DE_LICENCA`\n\n📍 Você encontra seu código na aba "Licença" do aplicativo web.\n\n❓ Use /ajuda para ver todos os comandos disponíveis.')
        } else {
            const result = await linkUserWithLicense(supabaseAdmin, chatId, licenseCode);
            await sendTelegramMessage(chatId, result.message);
        }
        return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const { data: integration } = await supabaseAdmin
      .from('telegram_integration')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (!integration) {
      await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nUse:\n`/start SEU_CODIGO_DE_LICENCA`')
      return new Response('Utilizador não vinculado', { status: 401, headers: corsHeaders });
    }
    
    const userId = integration.user_id;

    if (text && text.startsWith('/')) {
      await handleCommand(supabaseAdmin, text.toLowerCase(), userId, chatId);
    } else {
      // 1. Checagem de licença Premium e Transcrição (se for áudio)
      const { data: license } = await supabaseAdmin
          .from('licenses')
          .select('plano, status')
          .eq('user_id', userId)
          .eq('status', 'ativo')
          .maybeSingle();

      if (!license || license.plano !== 'premium') {
          await sendTelegramMessage(chatId, `🔒 *Funcionalidade Premium*\n\nOlá! A adição de transações pelo Telegram é uma funcionalidade exclusiva do plano Premium.\n\n🌐 Acesse: [Fazer Upgrade](${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/license)`);
          return new Response('Premium required', { status: 200, headers: corsHeaders });
      }

      const analyzingMessage = await sendTelegramMessage(chatId, voice ? "🎤 Ouvindo e analisando seu áudio..." : "🧠 Analisando sua mensagem...");

      try {
          if (voice) {
              text = await getTranscriptFromAudio(voice.file_id);
              if (analyzingMessage?.message_id) {
                  await editTelegramMessage(chatId, analyzingMessage.message_id, `🗣️ *Você disse:* "${text}"\n\n🧠 Agora, estou a analisar o conteúdo...`);
              }
          }
      } catch (transcriptionError) {
          await sendTelegramMessage(chatId, `😥 Desculpe, não consegui transcrever o seu áudio. Tente novamente ou envie uma mensagem de texto.`);
          return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // 2. Chama a função NLP
      const { data: nlpData, error: nlpError } = await supabaseAdmin.functions.invoke('nlp-transaction', {
          body: { text, userId },
      });

      if (analyzingMessage?.message_id) {
          await editTelegramMessage(chatId, analyzingMessage.message_id, "✅ Análise concluída. A preparar confirmação...");
      }
      
      if (nlpError || !nlpData) {
          await sendTelegramMessage(chatId, `❌ Erro ao processar: Não consegui entender sua mensagem.\n\nTente ser mais específico, como 'gastei 50 reais no almoço no Nubank'.`)
          return new Response('OK', { status: 200, headers: corsHeaders });
      }

      // 3. Lógica do Assistente de Campo Faltante
      const nlpResult = nlpData as any;
      const initialValidation = await validatePartialTransaction(supabaseAdmin, userId, {
          valor: nlpResult.valor,
          descricao: nlpResult.descricao,
          tipo: nlpResult.tipo,
          installment_total: nlpResult.installment_total,
          categoria_id: nlpResult.categoria_id,
          conta_origem_id: nlpResult.conta_origem_id,
          conta_destino_id: nlpResult.conta_destino_id,
      });
      
      // Salva a transação parcial e obtém o ID da sessão
      const { data: sessionData, error: sessionError } = await supabaseAdmin
          .from('telegram_sessions')
          .insert({ user_id: userId, telegram_id: message.from.id.toString(), chat_id: chatId.toString(), contexto: initialValidation.transactionData })
          .select('id')
          .single();
      
      if (sessionError) throw sessionError;
      const sessionId = sessionData.id;

      if (initialValidation.isComplete) {
          // 4A. Se completa, vai para a confirmação final
          const confirmationMessage = await buildConfirmationMessage(initialValidation.transactionData, supabaseAdmin);
          await sendTelegramMessage(chatId, confirmationMessage.message, { 
              reply_markup: { inline_keyboard: confirmationMessage.keyboard } 
          });
      } else {
          // 4B. Se faltar algo, inicia o diálogo guiado
          const nextPrompt = await buildMissingFieldPrompt(initialValidation.transactionData, initialValidation.missingFields, supabaseAdmin, sessionId);
          await sendTelegramMessage(chatId, nextPrompt.message, { 
              reply_markup: { inline_keyboard: nextPrompt.keyboard } 
          });
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
