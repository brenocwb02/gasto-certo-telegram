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
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`;
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
async function editTelegramMessage(chatId: number, messageId: number, text: string) {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/editMessageText`;
  try {
    await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
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

  // 1. Obter o caminho do ficheiro do Telegram
  const fileInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const fileInfo = await fileInfoResponse.json();
  if (!fileInfo.ok) throw new Error("Não foi possível obter informações do ficheiro de áudio do Telegram.");
  const filePath = fileInfo.result.file_path;

  // 2. Descarregar o ficheiro de áudio
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const audioResponse = await fetch(fileUrl);
  const audioBlob = await audioResponse.blob();
  const audioArrayBuffer = await audioBlob.arrayBuffer();

  // 3. Converter para Base64
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioArrayBuffer)));
  const mimeType = audioBlob.type || 'audio/ogg';

  // 4. Chamar a API do Gemini para transcrição
  // CORRIGIDO: Usando o nome de modelo mais estável para evitar erros de endpoint.
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

  const { data: existingIntegration } = await supabase
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
          // Ajustado para 'cartao' caso a migração do enum da conta não tenha sido finalizada para 'cartao_credito'
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
• \`/tarefa DESCRIÇÃO\` – Cria uma nova tarefa.
• \`/tarefas\` – Lista as suas tarefas pendentes.
      `;
      await sendTelegramMessage(chatId, helpMessage);
      break;
    }
    default:
      await sendTelegramMessage(chatId, "Comando não reconhecido. Use /ajuda para ver a lista de comandos.");
  }
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

    // --- Tratamento de Callback (botões) ---
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const [action, sessionId] = callbackQuery.data.split(':');
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      const { data: session } = await supabaseAdmin
        .from('telegram_sessions')
        .select('contexto')
        .eq('id', sessionId)
        .single();
      
      if (!session || !session.contexto) {
        await editTelegramMessage(chatId, messageId, "Esta confirmação expirou.");
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      if (action === 'confirm_transaction') {
        const transactionData = session.contexto as any;
        const { error: transactionError } = await supabaseAdmin.from('transactions').insert(transactionData);
        if (transactionError) throw transactionError;

        await editTelegramMessage(chatId, messageId, `✅ Transação registada!\n*${transactionData.descricao}*: ${formatCurrency(transactionData.valor)}`);
      } else if (action === 'cancel_transaction') {
        await editTelegramMessage(chatId, messageId, "❌ Registo cancelado.");
      }

      // Limpa a sessão
      await supabaseAdmin.from('telegram_sessions').delete().eq('id', sessionId);
      
      return new Response('OK', { status: 200, headers: corsHeaders });
    }
    
    // --- Tratamento de Mensagens de Texto e Voz ---
    const message = body.message;
    if (!message || !message.chat?.id) {
        return new Response('Payload inválido', { status: 400, headers: corsHeaders });
    }
    
    const chatId = message.chat.id;
    let text = message.text ? message.text.trim() : null;
    const voice = message.voice;

    if (!text && !voice) {
        return new Response('Nenhuma mensagem de texto ou voz encontrada', { status: 200, headers: corsHeaders });
    }

    if (text && text.startsWith('/start')) {
      const licenseCode = text.split(' ')[1]
      if (!licenseCode) {
        await sendTelegramMessage(chatId, '👋 *Bem-vindo ao Gasto Certo!*\n\nPara vincular sua conta, use o comando:\n`/start SEU_CODIGO_DE_LICENCA`\n\n📍 Você encontra seu código na aba "Licença" do aplicativo web.\n\n❓ Use /ajuda para ver todos os comandos disponíveis.')
      } else {
        const result = await linkUserWithLicense(supabaseAdmin, chatId, licenseCode)
        await sendTelegramMessage(chatId, result.message)
      }
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const { data: integration } = await supabaseAdmin
      .from('telegram_integration')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!integration) {
      await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nUse:\n`/start SEU_CODIGO_DE_LICENCA`')
      return new Response('Utilizador não vinculado', { status: 401, headers: corsHeaders });
    }
    
    const userId = integration.user_id;

    if (text && text.startsWith('/')) {
      await handleCommand(supabaseAdmin, text.toLowerCase(), userId, chatId);
    } else {
      // Verificar se o usuário tem licença premium
      const { data: license } = await supabaseAdmin
        .from('licenses')
        .select('plano, status')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .single();

      if (!license || license.plano !== 'premium') {
        await sendTelegramMessage(chatId, `🔒 *Funcionalidade Premium*\n\nOlá! A adição de transações pelo Telegram é uma funcionalidade exclusiva do plano Premium.\n\n✨ Com o Premium você terá:\n• Registro de transações por IA\n• Contas e categorias ilimitadas\n• Relatórios avançados\n• Metas e orçamentos\n\n📱 Visite nossa página de licenças para fazer upgrade e desbloquear todo o poder do Gasto Certo!\n\n🌐 Acesse: [Fazer Upgrade](${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/license)`);
        return new Response('Premium required', { status: 200, headers: corsHeaders });
      }

      const analyzingMessage = await sendTelegramMessage(chatId, voice ? "🎤 Ouvindo e analisando seu áudio..." : "🧠 Analisando sua mensagem...");

      try {
        if (voice) {
          console.log('Iniciando transcrição do áudio...');
          text = await getTranscriptFromAudio(voice.file_id);
          if (analyzingMessage?.message_id) {
            await editTelegramMessage(chatId, analyzingMessage.message_id, `🗣️ *Você disse:* "${text}"\n\n🧠 Agora, estou a analisar o conteúdo...`);
          }
        }
      } catch (transcriptionError) {
          await sendTelegramMessage(chatId, `😥 Desculpe, não consegui transcrever o seu áudio. Tente novamente ou envie uma mensagem de texto.`);
          return new Response('OK', { status: 200, headers: corsHeaders });
      }
      
      const { data: nlpData, error: nlpError } = await supabaseAdmin.functions.invoke('nlp-transaction', {
          body: { text, userId },
      })

      if (analyzingMessage?.message_id && !voice) {
        await editTelegramMessage(chatId, analyzingMessage.message_id, "✅ Análise concluída. A preparar confirmação...");
      }

      if (nlpError || !nlpData || (nlpData.validation_errors && nlpData.validation_errors.length > 0)) {
        const errorMsg = nlpData?.validation_errors?.join('\n') || "Não consegui entender sua mensagem.";
        await sendTelegramMessage(chatId, `❌ Problemas encontrados:\n${errorMsg}\n\nTente ser mais específico, como 'gastei 50 reais no almoço no Nubank'.`)
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      
      const { valor, descricao, tipo, categoria, conta, ...rest } = nlpData;
      
      // Armazena a transação pendente na sessão
      const transactionData = {
        user_id: userId,
        valor,
        descricao,
        tipo,
        categoria_id: rest.categoria_id,
        conta_origem_id: rest.conta_origem_id,
        conta_destino_id: rest.conta_destino_id,
        origem: 'telegram'
      };

      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('telegram_sessions')
        .insert({ user_id: userId, telegram_id: message.from.id.toString(), chat_id: chatId.toString(), contexto: transactionData })
        .select('id')
        .single();
      
      if (sessionError) throw sessionError;
      
      // Cria a mensagem de confirmação
      let confirmationMessage = `✅ *Entendido! Registado.*\nPor favor, confirme se está tudo certo:\n\n`;
      confirmationMessage += `*Tipo:* ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}\n`;
      confirmationMessage += `*Descrição:* ${descricao}\n`;
      confirmationMessage += `*Valor:* ${formatCurrency(valor)}\n`;
      confirmationMessage += `*Conta:* ${conta}\n`;
      if (categoria) confirmationMessage += `*Categoria:* ${categoria}\n`;

      const inline_keyboard = [[
        { text: "✅ Confirmar", callback_data: `confirm_transaction:${sessionData.id}` },
        { text: "❌ Cancelar", callback_data: `cancel_transaction:${sessionData.id}` }
      ]];
      
      await sendTelegramMessage(chatId, confirmationMessage, { reply_markup: { inline_keyboard } });
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
