// CORREÇÃO: Harmonizando todas as importações da biblioteca padrão para a mesma versão (0.224.0)
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Converte valores do quiz em labels legíveis
 */
function getEmergencyFundLabel(value: string): string {
  const labels: Record<string, string> = {
    'none': 'Nada',
    'less_than_1_month': 'Menos de 1 mês',
    '1_to_3_months': '1-3 meses',
    '3_to_6_months': '3-6 meses',
    'more_than_6_months': 'Mais de 6 meses'
  };
  return labels[value] || value;
}

function getDebtSituationLabel(value: string): string {
  const labels: Record<string, string> = {
    'no_debt': 'Sem dívidas',
    'low_debt': 'Dívidas baixas',
    'moderate_debt': 'Dívidas moderadas',
    'high_debt': 'Dívidas altas',
    'overwhelming_debt': 'Dívidas esmagadoras'
  };
  return labels[value] || value;
}

function getSavingsRateLabel(value: string): string {
  const labels: Record<string, string> = {
    'negative': 'Negativo',
    '0_to_5_percent': '0-5%',
    '5_to_10_percent': '5-10%',
    '10_to_20_percent': '10-20%',
    'more_than_20_percent': 'Mais de 20%'
  };
  return labels[value] || value;
}

function getInvestmentKnowledgeLabel(value: string): string {
  const labels: Record<string, string> = {
    'beginner': 'Iniciante',
    'basic': 'Básico',
    'intermediate': 'Intermediário',
    'advanced': 'Avançado',
    'expert': 'Especialista'
  };
  return labels[value] || value;
}

function getFinancialGoalsLabel(value: string): string {
  const labels: Record<string, string> = {
    'survival': 'Sobrevivência',
    'stability': 'Estabilidade',
    'growth': 'Crescimento',
    'wealth_building': 'Construção de Riqueza',
    'legacy': 'Legado'
  };
  return labels[value] || value;
}

function getBudgetControlLabel(value: string): string {
  const labels: Record<string, string> = {
    'no_budget': 'Sem orçamento',
    'informal': 'Informal',
    'basic_tracking': 'Controle básico',
    'detailed_budget': 'Orçamento detalhado',
    'advanced_planning': 'Planejamento avançado'
  };
  return labels[value] || value;
}

function getInsuranceCoverageLabel(value: string): string {
  const labels: Record<string, string> = {
    'none': 'Nenhuma',
    'basic': 'Básica',
    'adequate': 'Adequada',
    'comprehensive': 'Abrangente',
    'excellent': 'Excelente'
  };
  return labels[value] || value;
}

function getRetirementPlanningLabel(value: string): string {
  const labels: Record<string, string> = {
    'not_started': 'Não começou',
    'thinking_about_it': 'Pensando',
    'basic_plan': 'Plano básico',
    'detailed_plan': 'Plano detalhado',
    'expert_level': 'Nível especialista'
  };
  return labels[value] || value;
}

// --- Funções Auxiliares ---
/**
 * Formata um número para a moeda BRL.
 */ function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
/**
 * Envia uma mensagem para o Telegram.
 */ async function sendTelegramMessage(chatId: number, text: string, options: any = {}): Promise<any> {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/sendMessage`;
  try {
    const body = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...options
    };
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
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
 */ async function editTelegramMessage(chatId: number, messageId: number, text: string, options: any = {}): Promise<void> {
  const telegramApiUrl = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}/editMessageText`;
  try {
    await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
        ...options
      })
    });
  } catch (e) {
    console.error("Falha ao editar mensagem do Telegram:", e);
  }
}
/**
 * Transcreve um áudio do Telegram usando a API do Gemini.
 */ async function getTranscriptFromAudio(fileId: string): Promise<string> {
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
  const base64Audio = encodeBase64(audioArrayBuffer);
  const mimeType = audioBlob.type || 'audio/ogg';
  // 4. Chamar a API do Gemini para transcrição
  // CORREÇÃO FINAL: Alterado o modelo para 'gemini-1.5-flash' que é o nome estável correto.
  const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`;
  const prompt = "Transcreva este áudio em português:";
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Audio
            }
          }
        ]
      }
    ],
    safetySettings: [
      {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE"
      },
      {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE"
      }
    ]
  };
  console.log('Enviando para o Gemini (sem dados de áudio):', JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: "..."
            }
          }
        ]
      }
    ]
  }));
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
    // Verifica se a resposta foi bloqueada por segurança
    if (result.candidates?.[0]?.finishReason === 'SAFETY') {
      console.error('Resposta bloqueada por configurações de segurança.', result.candidates[0].safetyRatings);
      throw new Error("A resposta da IA foi bloqueada por filtros de segurança.");
    }
    throw new Error("A IA não conseguiu transcrever o áudio.");
  }
  return transcript;
}
/**
 * Vincula a conta de um utilizador do Telegram à sua licença.
 */ async function linkUserWithLicense(supabase: any, telegramChatId: number, licenseCode: string): Promise<{success: boolean; message: string}> {
  console.log(`Tentando vincular a licença ${licenseCode} ao chat ${telegramChatId}`);
  const { data: license, error: licenseError } = await supabase.from('licenses').select('user_id, status').eq('codigo', licenseCode).single();
  if (licenseError || !license || license.status !== 'ativo') {
    console.error('Licença não encontrada ou inativa:', licenseError);
    return {
      success: false,
      message: '❌ Código de licença inválido, expirado ou não encontrado.'
    };
  }
  const { data: existingIntegration } = await supabase.from('telegram_integration').select('user_id').eq('telegram_chat_id', telegramChatId).single();
  if (existingIntegration) {
    if (existingIntegration.user_id === license.user_id) {
      return {
        success: true,
        message: '✅ Este chat já está vinculado à sua conta.'
      };
    } else {
      return {
        success: false,
        message: '⚠️ Este chat do Telegram já está vinculado a outra conta.'
      };
    }
  }
  const { error: insertError } = await supabase.from('telegram_integration').insert({
    user_id: license.user_id,
    telegram_chat_id: telegramChatId
  });
  if (insertError) {
    console.error('Erro ao vincular a conta:', insertError);
    return {
      success: false,
      message: '❌ Ocorreu um erro ao vincular a sua conta. Tente novamente.'
    };
  }
  await supabase.from('profiles').update({
    telegram_chat_id: telegramChatId
  }).eq('user_id', license.user_id);
  return {
    success: true,
    message: '✅ Conta vinculada com sucesso! Agora você pode usar todos os comandos:\n\n🔍 /saldo - Ver saldo das suas contas\n📊 /resumo - Resumo financeiro do mês\n🎯 /metas - Acompanhar suas metas\n❓ /ajuda - Ver lista completa de comandos\n\n💬 Ou simplesmente escreva como "Gastei 25 reais com almoço" que eu registro automaticamente!'
  };
}
// --- Funções de Manipulação de Comandos ---
async function handleCommand(supabase: any, command: string, userId: string, chatId: number, messageId?: number): Promise<void> {
  const [cmd, ...args] = command.split(' ');
  const argument = args.join(' ');

  switch (cmd.toLowerCase()) {
    case '/start': {
      const message = `🎉 *Bem-vindo ao Zaq - Boas Contas!*

🎯 Comandos disponíveis:

💰 *Finanças*
• Registre gastos naturalmente (ex: "Almoço 25 reais")
• /saldo - Ver saldo das contas
• /extrato - Últimas transações
• /resumo - Resumo do mês

📊 *Análises Inteligentes*
• /perguntar [pergunta] - Pergunte sobre seus gastos
• /top_gastos - Top 5 categorias do mês
• /comparar_meses - Compare mês atual vs anterior
• /previsao - Previsão de gastos

✏️ *Edição*
• /editar_ultima - Editar última transação

🎯 *Metas e Orçamento*
• /metas - Ver progresso das metas
• /orcamento - Status do orçamento

💡 /ajuda - Ver este menu`;
      
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/saldo': {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('nome, saldo_atual, tipo')
        .eq('user_id', userId)
        .eq('ativo', true);

      if (!accounts || accounts.length === 0) {
        await sendTelegramMessage(chatId, '📭 Você ainda não tem contas cadastradas.');
        return;
      }

      const total = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.saldo_atual || 0), 0);
      const accountsList = accounts
        .map((acc: any) => `  • ${acc.nome}: ${formatCurrency(parseFloat(acc.saldo_atual || 0))}`)
        .join('\n');

      const message = `💰 *Seus Saldos*\n\n${accountsList}\n\n━━━━━━━━━━━━━━━━\n*Total:* ${formatCurrency(total)}`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/extrato': {
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(nome, cor),
          account:accounts!transactions_conta_origem_id_fkey(nome)
        `)
        .eq('user_id', userId)
        .order('data_transacao', { ascending: false })
        .limit(10);

      if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhuma transação encontrada.');
        return;
      }

      const list = transactions.map((t: any) => {
        const icon = t.tipo === 'receita' ? '💚' : '💸';
        const date = new Date(t.data_transacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `${icon} ${date} - ${t.descricao}\n  ${formatCurrency(parseFloat(t.valor))} • ${t.category?.nome || 'Sem categoria'}`;
      }).join('\n\n');

      await sendTelegramMessage(chatId, `📋 *Últimas Transações*\n\n${list}`, { parse_mode: 'Markdown' });
      break;
    }

    case '/resumo': {
      const firstDay = new Date();
      firstDay.setDate(1);
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('tipo, valor')
        .eq('user_id', userId)
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

      const receitas = transactions?.filter((t: any) => t.tipo === 'receita')
        .reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const despesas = transactions?.filter((t: any) => t.tipo === 'despesa')
        .reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const saldo = receitas - despesas;

      const message = `📊 *Resumo do Mês*\n\n💚 Receitas: ${formatCurrency(receitas)}\n💸 Despesas: ${formatCurrency(despesas)}\n━━━━━━━━━━━━━━━━\n${saldo >= 0 ? '✅' : '⚠️'} Saldo: ${formatCurrency(saldo)}`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/metas': {
      const { data: goals } = await supabase
        .from('goals')
        .select('titulo, valor_meta, valor_atual, data_fim')
        .eq('user_id', userId)
        .eq('status', 'ativa');

      if (!goals || goals.length === 0) {
        await sendTelegramMessage(chatId, '🎯 Você ainda não tem metas ativas.');
        return;
      }

      const list = goals.map((g: any) => {
        const progress = (parseFloat(g.valor_atual) / parseFloat(g.valor_meta)) * 100;
        const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
        return `🎯 *${g.titulo}*\n${progressBar} ${progress.toFixed(0)}%\n${formatCurrency(parseFloat(g.valor_atual))} / ${formatCurrency(parseFloat(g.valor_meta))}`;
      }).join('\n\n');

      await sendTelegramMessage(chatId, `🎯 *Suas Metas*\n\n${list}`, { parse_mode: 'Markdown' });
      break;
    }

    case '/perguntar': {
      if (!argument) {
        await sendTelegramMessage(chatId, '❓ Use: /perguntar [sua pergunta]\n\nExemplos:\n• quanto gastei com iFood em setembro?\n• minhas receitas de freelance\n• quantas vezes gastei mais de 100 reais?');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Analisando seus dados...');

      try {
        const response = await supabase.functions.invoke('query-engine', {
          body: { question: argument, userId }
        });

        if (response.error) throw response.error;

        await editTelegramMessage(chatId, thinking.result.message_id, `❓ *Pergunta:* ${argument}\n\n${response.data.answer}`, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro no /perguntar:', error);
        await editTelegramMessage(chatId, thinking.result.message_id, '❌ Desculpe, ocorreu um erro ao processar sua pergunta.');
      }
      break;
    }

    case '/top_gastos': {
      const firstDay = new Date();
      firstDay.setDate(1);
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('valor, category:categories(nome)')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

      if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhum gasto registrado este mês.');
        return;
      }

      const grouped = transactions.reduce((acc: any, t: any) => {
        const cat = t.category?.nome || 'Sem categoria';
        acc[cat] = (acc[cat] || 0) + parseFloat(t.valor);
        return acc;
      }, {});

      const sorted = Object.entries(grouped)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5);

      const list = sorted.map(([cat, val]: any, i: number) => 
        `${i + 1}. *${cat}*: ${formatCurrency(val)}`
      ).join('\n');

      await sendTelegramMessage(chatId, `🔥 *Top 5 Gastos deste Mês*\n\n${list}`, { parse_mode: 'Markdown' });
      break;
    }

    case '/comparar_meses': {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [thisMonthData, lastMonthData] = await Promise.all([
        supabase.from('transactions').select('valor').eq('user_id', userId).eq('tipo', 'despesa')
          .gte('data_transacao', thisMonth.toISOString().split('T')[0]),
        supabase.from('transactions').select('valor').eq('user_id', userId).eq('tipo', 'despesa')
          .gte('data_transacao', lastMonth.toISOString().split('T')[0])
          .lt('data_transacao', thisMonth.toISOString().split('T')[0])
      ]);

      const thisTotal = thisMonthData.data?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const lastTotal = lastMonthData.data?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const diff = thisTotal - lastTotal;
      const diffPercent = lastTotal > 0 ? ((diff / lastTotal) * 100).toFixed(1) : '0';

      const icon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      const trend = diff > 0 ? 'aumentaram' : diff < 0 ? 'diminuíram' : 'permaneceram iguais';

      const message = `📊 *Comparativo de Gastos*\n\n📅 Mês Anterior: ${formatCurrency(lastTotal)}\n📅 Mês Atual: ${formatCurrency(thisTotal)}\n\n${icon} Seus gastos ${trend} ${diffPercent}%\n(${diff >= 0 ? '+' : ''}${formatCurrency(Math.abs(diff))})`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/previsao': {
      const firstDay = new Date();
      firstDay.setDate(1);
      const today = new Date();
      const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
      const daysPassed = today.getDate();

      const { data: transactions } = await supabase
        .from('transactions')
        .select('valor')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data_transacao', firstDay.toISOString().split('T')[0]);

      const totalSoFar = transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
      const dailyAverage = totalSoFar / daysPassed;
      const projection = dailyAverage * daysInMonth;

      const message = `🔮 *Previsão de Gastos*\n\n📊 Gasto até agora: ${formatCurrency(totalSoFar)}\n📈 Média diária: ${formatCurrency(dailyAverage)}\n\n💡 Projeção para o mês:\n*${formatCurrency(projection)}*\n\n(baseado em ${daysPassed} dias de ${daysInMonth})`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/editar_ultima': {
      const { data: lastTransaction } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(nome),
          account:accounts!transactions_conta_origem_id_fkey(nome)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastTransaction) {
        await sendTelegramMessage(chatId, '📭 Você ainda não tem transações para editar.');
        return;
      }

      // Salvar ID da transação na sessão
      await supabase
        .from('telegram_sessions')
        .upsert({
          user_id: userId,
          telegram_id: chatId.toString(),
          chat_id: chatId.toString(),
          contexto: { editing_transaction_id: lastTransaction.id }
        }, { onConflict: 'user_id,telegram_id' });

      const date = new Date(lastTransaction.data_transacao).toLocaleDateString('pt-BR');
      const message = `✏️ *Editar Transação*\n\n📝 ${lastTransaction.descricao}\n💰 ${formatCurrency(parseFloat(lastTransaction.valor))}\n📁 ${lastTransaction.category?.nome || 'Sem categoria'}\n🏦 ${lastTransaction.account?.nome || 'Sem conta'}\n📅 ${date}\n\nO que deseja editar?`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✏️ Descrição', callback_data: 'edit_description' },
            { text: '💰 Valor', callback_data: 'edit_amount' }
          ],
          [
            { text: '📁 Categoria', callback_data: 'edit_category' },
            { text: '🏦 Conta', callback_data: 'edit_account' }
          ],
          [
            { text: '📅 Data', callback_data: 'edit_date' },
            { text: '🗑️ Deletar', callback_data: 'edit_delete' }
          ],
          [
            { text: '❌ Cancelar', callback_data: 'edit_cancel' }
          ]
        ]
      };

      await sendTelegramMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      break;
    }

    case '/recorrente_nova': {
      const message = `🔄 *Nova Conta Recorrente*\n\nPara criar uma transação recorrente, envie uma mensagem no formato:\n\n*Exemplo:*\n"Aluguel de R$ 1.200,00 mensal no dia 5"\n"Salário de R$ 5.000,00 mensal"\n"Netflix de R$ 45,90 mensal"\n\n*Frequências disponíveis:*\n• Diária\n• Semanal\n• Mensal\n• Trimestral\n• Semestral\n• Anual\n\n*Para especificar dia:*\n• "mensal no dia 15"\n• "semanal na segunda"`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/recorrentes': {
      try {
        const { data: recurring, error } = await supabase
          .from('recurring_transactions')
          .select(`
            *,
            category:categories(nome, cor),
            account:accounts(nome)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('next_due_date', { ascending: true });

        if (error) throw error;

        if (!recurring || recurring.length === 0) {
          await sendTelegramMessage(chatId, '📋 *Contas Recorrentes*\n\nNenhuma transação recorrente ativa encontrada.\n\nUse /recorrente_nova para criar uma nova.');
          break;
        }

        let message = '📋 *Contas Recorrentes Ativas*\n\n';
        
        recurring.forEach((item, index) => {
          const emoji = item.type === 'receita' ? '💰' : '💸';
          const status = item.next_due_date <= new Date().toISOString().split('T')[0] ? '🔴' : '🟢';
          const frequency = item.frequency === 'diaria' ? 'Diária' :
                           item.frequency === 'semanal' ? 'Semanal' :
                           item.frequency === 'mensal' ? 'Mensal' :
                           item.frequency === 'trimestral' ? 'Trimestral' :
                           item.frequency === 'semestral' ? 'Semestral' : 'Anual';
          
          message += `${emoji} *${item.title}*\n`;
          message += `   ${formatCurrency(item.amount)} - ${frequency}\n`;
          message += `   ${status} Próxima: ${new Date(item.next_due_date).toLocaleDateString('pt-BR')}\n`;
          if (item.category) message += `   📂 ${item.category.nome}\n`;
          message += '\n';
        });

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar contas recorrentes:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar contas recorrentes.');
      }
      break;
    }

    case '/pausar_recorrente': {
      try {
        const { data: recurring, error } = await supabase
          .from('recurring_transactions')
          .select('id, title, is_active')
          .eq('user_id', userId)
          .order('title');

        if (error) throw error;

        if (!recurring || recurring.length === 0) {
          await sendTelegramMessage(chatId, '📋 *Pausar Conta Recorrente*\n\nNenhuma transação recorrente encontrada.');
          break;
        }

        const keyboard = {
          inline_keyboard: recurring.map(item => [{
            text: `${item.is_active ? '⏸️' : '▶️'} ${item.title}`,
            callback_data: `toggle_recurring_${item.id}`
          }])
        };

        await sendTelegramMessage(chatId, '📋 *Pausar/Reativar Conta Recorrente*\n\nSelecione uma transação:', { 
          reply_markup: keyboard 
        });
      } catch (error) {
        console.error('Erro ao buscar contas recorrentes:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar contas recorrentes.');
      }
      break;
    }

    case '/tutorial': {
      const message = `🎓 *Tutorial do Zaq - Boas Contas*\n\n📱 *Acesse o tutorial completo:*\n🔗 [Abrir Tutorial](https://app.boascontas.com/onboarding)\n\n*Resumo rápido:*\n\n💰 *Transações:*\n• "Gastei R$ 50 no mercado"\n• "Recebi R$ 1000 de salário"\n• "Transferi R$ 200 da conta para carteira"\n\n🤖 *Comandos úteis:*\n• /saldo - Ver saldo das contas\n• /extrato - Últimas transações\n• /metas - Progresso das metas\n• /perguntar - Faça perguntas sobre gastos\n\n👥 *Gestão Familiar:*\n• Convide membros da família\n• Controle permissões\n• Compartilhe finanças\n\n🎯 *Metas e Orçamento:*\n• Defina objetivos financeiros\n• Acompanhe progresso\n• Planeje o futuro\n\n📊 *Relatórios Inteligentes:*\n• Gráficos de evolução\n• Análises de padrões\n• IA para insights\n\n💡 *Dica:* Complete o tutorial no app para uma experiência completa!`;
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/meuperfil': {
      // Buscar perfil financeiro do usuário
      const { data: financialProfile, error: profileError } = await supabase
        .from('financial_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        await sendTelegramMessage(chatId, '❌ Erro ao buscar seu perfil financeiro. Tente novamente.');
        break;
      }

      if (!financialProfile) {
        const message = `📊 *Seu Perfil Financeiro*\n\n❌ Você ainda não completou o quiz de saúde financeira.\n\n🎯 *Para descobrir seu perfil:*\n🔗 [Fazer Quiz](https://app.boascontas.com/quiz-financeiro)\n\n*O quiz avalia:*\n• Fundo de emergência\n• Situação de dívidas\n• Taxa de poupança\n• Conhecimento em investimentos\n• Objetivos financeiros\n• Controle de orçamento\n• Cobertura de seguros\n• Planejamento de aposentadoria\n\n💡 *Benefícios:*\n• Score de saúde financeira (0-100)\n• Recomendações personalizadas\n• Estratégias de melhoria\n\n🎓 Complete o quiz para receber insights valiosos sobre suas finanças!`;
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
        break;
      }

      // Calcular nível de saúde financeira
      const score = financialProfile.financial_health_score;
      let healthLevel = '';
      let healthEmoji = '';
      
      if (score >= 80) {
        healthLevel = 'Excelente';
        healthEmoji = '🟢';
      } else if (score >= 60) {
        healthLevel = 'Bom';
        healthEmoji = '🔵';
      } else if (score >= 40) {
        healthLevel = 'Regular';
        healthEmoji = '🟡';
      } else if (score >= 20) {
        healthLevel = 'Precisa Melhorar';
        healthEmoji = '🟠';
      } else {
        healthLevel = 'Crítico';
        healthEmoji = '🔴';
      }

      // Processar recomendações
      let recommendations = [];
      try {
        recommendations = Array.isArray(financialProfile.recommendations) 
          ? financialProfile.recommendations 
          : JSON.parse(financialProfile.recommendations as string);
      } catch {
        recommendations = [];
      }

      const message = `📊 *Seu Perfil Financeiro*\n\n${healthEmoji} *Score de Saúde Financeira: ${score}/100 - ${healthLevel}*\n\n📈 *Progresso:*\n${'█'.repeat(Math.floor(score/10))}${'░'.repeat(10-Math.floor(score/10))} ${score}%\n\n🎯 *Suas Respostas:*\n• Fundo de Emergência: ${getEmergencyFundLabel(financialProfile.emergency_fund)}\n• Dívidas: ${getDebtSituationLabel(financialProfile.debt_situation)}\n• Poupança: ${getSavingsRateLabel(financialProfile.savings_rate)}\n• Investimentos: ${getInvestmentKnowledgeLabel(financialProfile.investment_knowledge)}\n• Objetivos: ${getFinancialGoalsLabel(financialProfile.financial_goals)}\n• Orçamento: ${getBudgetControlLabel(financialProfile.budget_control)}\n• Seguros: ${getInsuranceCoverageLabel(financialProfile.insurance_coverage)}\n• Aposentadoria: ${getRetirementPlanningLabel(financialProfile.retirement_planning)}\n\n💡 *Recomendações:*\n${recommendations.slice(0, 3).map((rec: string, i: number) => `${i+1}. ${rec}`).join('\n')}\n\n🔗 [Ver Perfil Completo](https://app.boascontas.com/quiz-financeiro)\n\n📅 *Última atualização:* ${new Date(financialProfile.completed_at).toLocaleDateString('pt-BR')}`;
      
      await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      break;
    }

    case '/comprar_ativo': {
      if (!argument) {
        await sendTelegramMessage(chatId, '📈 *Registrar Compra de Ativo*\n\nExemplos:\n• Comprei 10 ações PETR4 a R$ 35,50\n• Comprei 5 VALE3 por R$ 68,20\n• Comprei 100 ações ITSA4 a 12,50');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Processando compra...');
      
      try {
        const response = await supabase.functions.invoke('nlp-transaction', {
          body: { message: `COMPRA DE ATIVO: ${argument}`, userId }
        });

        if (response.error) throw response.error;

        const result = response.data;
        
        // Extrair dados da transação
        const ticker = result.description?.match(/[A-Z]{4}\d{1,2}/)?.[0];
        const quantidade = parseFloat(result.amount || 0);
        const preco = result.additionalInfo?.price || 0;
        
        if (!ticker || quantidade <= 0) {
          await editTelegramMessage(chatId, thinking.message_id, '❌ Não consegui identificar o ativo ou quantidade. Use o formato:\n"Comprei 10 ações PETR4 a R$ 35,50"');
          return;
        }

        // Inserir transação de investimento
        const { error: insertError } = await supabase
          .from('investment_transactions')
          .insert({
            user_id: userId,
            ticker: ticker,
            transaction_type: 'compra',
            quantity: quantidade,
            price: preco,
            total_value: quantidade * preco,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: argument
          });

        if (insertError) throw insertError;

        await editTelegramMessage(
          chatId, 
          thinking.message_id, 
          `✅ *Compra Registrada!*\n\n📈 ${ticker}\n💰 ${quantidade} ações\n💵 R$ ${preco.toFixed(2)} cada\n\n💎 Total: ${formatCurrency(quantidade * preco)}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Erro ao registrar compra:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao processar compra. Tente: "Comprei 10 ações PETR4 a R$ 35,50"');
      }
      break;
    }

    case '/vender_ativo': {
      if (!argument) {
        await sendTelegramMessage(chatId, '📉 *Registrar Venda de Ativo*\n\nExemplos:\n• Vendi 5 ações VALE3 a R$ 68,20\n• Vendi 10 PETR4 por R$ 37,00\n• Vendi 50 ações ITSA4 a 13,20');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Processando venda...');
      
      try {
        const response = await supabase.functions.invoke('nlp-transaction', {
          body: { message: `VENDA DE ATIVO: ${argument}`, userId }
        });

        if (response.error) throw response.error;

        const result = response.data;
        
        const ticker = result.description?.match(/[A-Z]{4}\d{1,2}/)?.[0];
        const quantidade = parseFloat(result.amount || 0);
        const preco = result.additionalInfo?.price || 0;
        
        if (!ticker || quantidade <= 0) {
          await editTelegramMessage(chatId, thinking.message_id, '❌ Não consegui identificar o ativo ou quantidade. Use o formato:\n"Vendi 5 ações VALE3 a R$ 68,20"');
          return;
        }

        const { error: insertError } = await supabase
          .from('investment_transactions')
          .insert({
            user_id: userId,
            ticker: ticker,
            transaction_type: 'venda',
            quantity: quantidade,
            price: preco,
            total_value: quantidade * preco,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: argument
          });

        if (insertError) throw insertError;

        await editTelegramMessage(
          chatId, 
          thinking.message_id, 
          `✅ *Venda Registrada!*\n\n📉 ${ticker}\n💰 ${quantidade} ações\n💵 R$ ${preco.toFixed(2)} cada\n\n💎 Total: ${formatCurrency(quantidade * preco)}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Erro ao registrar venda:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao processar venda. Tente: "Vendi 5 ações VALE3 a R$ 68,20"');
      }
      break;
    }

    case '/provento': {
      if (!argument) {
        await sendTelegramMessage(chatId, '💰 *Registrar Provento*\n\nExemplos:\n• Recebi R$ 12,50 de dividendos de ITSA4\n• Provento de R$ 25,00 de PETR4\n• Dividendo VALE3 R$ 8,75');
        return;
      }

      const thinking = await sendTelegramMessage(chatId, '🤔 Registrando provento...');
      
      try {
        const ticker = argument.match(/[A-Z]{4}\d{1,2}/)?.[0];
        const valorMatch = argument.match(/R?\$?\s*(\d+(?:[.,]\d{2})?)/);
        const valor = valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : 0;
        
        if (!ticker || valor <= 0) {
          await editTelegramMessage(chatId, thinking.message_id, '❌ Não consegui identificar o ativo ou valor. Use o formato:\n"Recebi R$ 12,50 de dividendos de ITSA4"');
          return;
        }

        const { error: insertError } = await supabase
          .from('investment_transactions')
          .insert({
            user_id: userId,
            ticker: ticker,
            transaction_type: 'provento',
            quantity: 0,
            price: 0,
            total_value: valor,
            transaction_date: new Date().toISOString().split('T')[0],
            notes: argument
          });

        if (insertError) throw insertError;

        await editTelegramMessage(
          chatId, 
          thinking.message_id, 
          `✅ *Provento Registrado!*\n\n💰 ${ticker}\n💵 ${formatCurrency(valor)}\n\n📅 ${new Date().toLocaleDateString('pt-BR')}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Erro ao registrar provento:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao processar provento. Tente: "Recebi R$ 12,50 de dividendos de ITSA4"');
      }
      break;
    }

    case '/carteira': {
      try {
        const { data: investments } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId)
          .gt('quantity', 0)
          .order('ticker');

        if (!investments || investments.length === 0) {
          await sendTelegramMessage(chatId, '📊 *Sua Carteira*\n\n📭 Você ainda não tem investimentos cadastrados.\n\nUse /comprar_ativo para registrar sua primeira compra!');
          return;
        }

        let totalValue = 0;
        let totalProfit = 0;
        const list = investments.map((inv: any) => {
          const currentValue = inv.quantity * inv.current_price;
          const costBasis = inv.quantity * inv.average_price;
          const profit = currentValue - costBasis;
          const profitPercent = ((profit / costBasis) * 100).toFixed(2);
          
          totalValue += currentValue;
          totalProfit += profit;
          
          const profitIcon = profit >= 0 ? '📈' : '📉';
          return `${profitIcon} *${inv.ticker}*\n   ${inv.quantity} ações × R$ ${inv.current_price.toFixed(2)}\n   PM: R$ ${inv.average_price.toFixed(2)} | ${profitPercent}%\n   ${formatCurrency(currentValue)}`;
        }).join('\n\n');

        const totalProfitPercent = totalValue > 0 ? ((totalProfit / (totalValue - totalProfit)) * 100).toFixed(2) : '0';
        
        const message = `📊 *Sua Carteira de Investimentos*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n💎 *Valor Total:* ${formatCurrency(totalValue)}\n${totalProfit >= 0 ? '📈' : '📉'} *Lucro:* ${formatCurrency(totalProfit)} (${totalProfitPercent}%)`;
        
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar carteira:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar carteira.');
      }
      break;
    }

    case '/patrimonio': {
      const thinking = await sendTelegramMessage(chatId, '🤔 Calculando patrimônio...');
      
      try {
        const response = await supabase.functions.invoke('calculate-net-worth');

        if (response.error) throw response.error;

        const data = response.data;
        const netWorth = data.netWorth || 0;
        const cash = data.breakdown?.cash || 0;
        const investments = data.breakdown?.investments || 0;
        const debts = data.breakdown?.debts || 0;

        const message = `💎 *Seu Patrimônio Líquido*\n\n━━━━━━━━━━━━━━━━\n💰 *Total:* ${formatCurrency(netWorth)}\n━━━━━━━━━━━━━━━━\n\n📊 *Composição:*\n\n💵 Contas: ${formatCurrency(cash)}\n📈 Investimentos: ${formatCurrency(investments)}\n💳 Dívidas: ${formatCurrency(debts)}\n\n📅 Atualizado em: ${new Date(data.calculatedAt).toLocaleString('pt-BR')}`;
        
        await editTelegramMessage(chatId, thinking.message_id, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao calcular patrimônio:', error);
        await editTelegramMessage(chatId, thinking.message_id, '❌ Erro ao calcular patrimônio. Tente novamente.');
      }
      break;
    }

    case '/dividas': {
      try {
        const { data: debts } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('ativo', true)
          .or('tipo.eq.cartao_credito,debt_type.not.is.null')
          .order('saldo_atual', { ascending: false });

        if (!debts || debts.length === 0) {
          await sendTelegramMessage(chatId, '✅ *Parabéns!*\n\nVocê não tem dívidas cadastradas no momento! 🎉');
          return;
        }

        let totalDebt = 0;
        const list = debts.map((debt: any) => {
          const balance = Math.abs(parseFloat(debt.saldo_atual || 0));
          totalDebt += balance;
          
          let details = `💳 *${debt.nome}*\n   Saldo: ${formatCurrency(balance)}`;
          
          if (debt.tipo === 'cartao_credito') {
            details += `\n   Limite: ${formatCurrency(parseFloat(debt.limite_credito || 0))}`;
            if (debt.dia_vencimento) {
              details += `\n   Vencimento: dia ${debt.dia_vencimento}`;
            }
          }
          
          if (debt.monthly_payment) {
            details += `\n   Parcela: ${formatCurrency(parseFloat(debt.monthly_payment))}`;
          }
          
          if (debt.remaining_installments) {
            details += `\n   Faltam: ${debt.remaining_installments} parcelas`;
          }
          
          return details;
        }).join('\n\n');

        const message = `💳 *Suas Dívidas*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n⚠️ *Total de Dívidas:* ${formatCurrency(totalDebt)}`;
        
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar dívidas:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar dívidas.');
      }
      break;
    }

    case '/orcamento': {
      try {
        const firstDay = new Date();
        firstDay.setDate(1);
        const month = firstDay.toISOString().split('T')[0];

        const { data: budgets } = await supabase.rpc('get_budgets_with_spent', { p_month: month });

        if (!budgets || budgets.length === 0) {
          await sendTelegramMessage(chatId, '📊 *Orçamento do Mês*\n\n📭 Você ainda não definiu orçamentos.\n\n💡 Acesse o app para criar seus orçamentos: https://app.boascontas.com/orcamento');
          return;
        }

        let totalBudget = 0;
        let totalSpent = 0;
        
        const list = budgets.map((b: any) => {
          const budget = parseFloat(b.amount);
          const spent = parseFloat(b.spent);
          const remaining = budget - spent;
          const percent = budget > 0 ? ((spent / budget) * 100).toFixed(0) : '0';
          
          totalBudget += budget;
          totalSpent += spent;
          
          const icon = spent > budget ? '🔴' : spent > budget * 0.8 ? '🟡' : '🟢';
          const bar = '█'.repeat(Math.min(10, Math.floor((spent / budget) * 10))) + '░'.repeat(Math.max(0, 10 - Math.floor((spent / budget) * 10)));
          
          return `${icon} *${b.category_name}*\n${bar} ${percent}%\n${formatCurrency(spent)} / ${formatCurrency(budget)}\n${remaining >= 0 ? '✅' : '⚠️'} Restante: ${formatCurrency(Math.abs(remaining))}`;
        }).join('\n\n');

        const totalPercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : '0';
        const totalRemaining = totalBudget - totalSpent;

        const message = `📊 *Orçamento de ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n💰 *Total Orçado:* ${formatCurrency(totalBudget)}\n💸 *Total Gasto:* ${formatCurrency(totalSpent)} (${totalPercent}%)\n${totalRemaining >= 0 ? '✅' : '⚠️'} *Saldo:* ${formatCurrency(Math.abs(totalRemaining))}`;
        
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar orçamento.');
      }
      break;
    }

    case '/ajuda':
    default: {
      // Dividido em múltiplas mensagens para evitar erro de parse
      const part1 = `💡 *Guia Completo de Comandos*

📊 *FINANÇAS BÁSICAS*
• Registro natural: "Gastei R$ 50 no mercado"
• /saldo - Ver saldo de todas as contas
• /extrato - Últimas 10 transações
• /resumo - Resumo financeiro do mês

💰 *INVESTIMENTOS*
• /comprar_ativo - Registrar compra de ativos
• /vender_ativo - Registrar venda de ativos
• /provento - Registrar dividendos recebidos
• /carteira - Ver seu portfólio completo
• /patrimonio - Patrimônio líquido total
• /dividas - Listar dívidas ativas`;

      const part2 = `🤖 *ANÁLISES INTELIGENTES*
• /perguntar [pergunta] - Pergunte sobre seus gastos
• /top_gastos - Top 5 categorias do mês
• /comparar_meses - Comparar mês atual vs anterior
• /previsao - Projeção de gastos do mês

✏️ *EDIÇÃO & GESTÃO*
• /editar_ultima - Editar última transação
• /orcamento - Ver status do orçamento

🔄 *CONTAS RECORRENTES*
• /recorrente_nova - Criar nova recorrência
• /recorrentes - Ver todas as recorrências ativas
• /pausar_recorrente - Pausar/reativar recorrência`;

      const part3 = `🎯 *METAS & PERFIL*
• /metas - Ver progresso das suas metas
• /meuperfil - Score de saúde financeira

🎓 *AJUDA*
• /tutorial - Tutorial completo
• /ajuda - Este menu

🌐 *Acesse o app web:*
📱 https://app.boascontas.com`;

      await sendTelegramMessage(chatId, part1, { parse_mode: 'Markdown' });
      await sendTelegramMessage(chatId, part2, { parse_mode: 'Markdown' });
      await sendTelegramMessage(chatId, part3, { parse_mode: 'Markdown' });
      break;
    }
  }
}
// --- Lógica Principal do Webhook ---
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Trata cliques em botões de confirmação e edição
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;

      // Buscar integração para pegar userId
      const { data: integration } = await supabaseAdmin.from('telegram_integration').select('user_id').eq('telegram_chat_id', chatId).single();
      if (!integration) {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }
      const userId = integration.user_id;

      // Ações de edição de transação
      if (data.startsWith('edit_')) {
        const { data: session } = await supabaseAdmin
          .from('telegram_sessions')
          .select('contexto')
          .eq('user_id', userId)
          .eq('telegram_id', callbackQuery.from.id.toString())
          .single();

        const transactionId = session?.contexto?.editing_transaction_id;
        
        if (!transactionId) {
          await editTelegramMessage(chatId, messageId, '❌ Sessão expirada. Use /editar_ultima novamente.');
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (data === 'edit_cancel') {
          await supabaseAdmin
            .from('telegram_sessions')
            .update({ contexto: {} })
            .eq('user_id', userId);
          await editTelegramMessage(chatId, messageId, '✅ Edição cancelada.');
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (data === 'edit_delete') {
          await supabaseAdmin.from('transactions').delete().eq('id', transactionId);
          await supabaseAdmin.from('telegram_sessions').update({ contexto: {} }).eq('user_id', userId);
          await editTelegramMessage(chatId, messageId, '🗑️ Transação deletada com sucesso!');
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        // Salvar campo a editar
        await supabaseAdmin
          .from('telegram_sessions')
          .update({ 
            contexto: { 
              editing_transaction_id: transactionId,
              editing_field: data.replace('edit_', '')
            }
          })
          .eq('user_id', userId);

        const fieldMessages: Record<string, string> = {
          edit_description: '✏️ Digite a nova descrição:',
          edit_amount: '💰 Digite o novo valor:',
          edit_category: '📁 Digite o nome da nova categoria:',
          edit_account: '🏦 Digite o nome da nova conta:',
          edit_date: '📅 Digite a nova data (DD/MM/AAAA):'
        };

        await editTelegramMessage(chatId, messageId, fieldMessages[data] || 'Digite o novo valor:');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Ações de toggle de transações recorrentes
      if (data.startsWith('toggle_recurring_')) {
        const recurringId = data.replace('toggle_recurring_', '');
        
        try {
          // Buscar transação recorrente
          const { data: recurring, error: fetchError } = await supabaseAdmin
            .from('recurring_transactions')
            .select('id, title, is_active')
            .eq('id', recurringId)
            .eq('user_id', userId)
            .single();

          if (fetchError || !recurring) {
            await editTelegramMessage(chatId, messageId, '❌ Transação recorrente não encontrada.');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          // Toggle do status
          const newStatus = !recurring.is_active;
          const { error: updateError } = await supabaseAdmin
            .from('recurring_transactions')
            .update({ is_active: newStatus })
            .eq('id', recurringId);

          if (updateError) {
            await editTelegramMessage(chatId, messageId, '❌ Erro ao alterar status da transação.');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
          }

          const statusText = newStatus ? 'ativada' : 'pausada';
          const emoji = newStatus ? '▶️' : '⏸️';
          
          await editTelegramMessage(chatId, messageId, `✅ Transação recorrente "${recurring.title}" foi ${statusText}!\n\n${emoji} Status: ${newStatus ? 'Ativa' : 'Pausada'}`);
          
        } catch (error) {
          console.error('Erro ao toggle transação recorrente:', error);
          await editTelegramMessage(chatId, messageId, '❌ Erro interno. Tente novamente.');
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: corsHeaders
        });
      }

      // Ações de confirmação de transações (sistema antigo)
      const [action, sessionId] = data.split(':');
      const { data: session } = await supabaseAdmin.from('telegram_sessions').select('contexto').eq('id', sessionId).single();
      if (!session || !session.contexto) {
        await editTelegramMessage(chatId, messageId, "Esta confirmação expirou.");
        return new Response('OK', {
          status: 200,
          headers: corsHeaders
        });
      }
      if (action === 'confirm_transaction') {
        const transactionData = session.contexto;
        const { error: transactionError } = await supabaseAdmin.from('transactions').insert(transactionData);
        if (transactionError) throw transactionError;
        await editTelegramMessage(chatId, messageId, `✅ Transação registada!\n*${transactionData.descricao}*: ${formatCurrency(transactionData.valor)}`);
      } else if (action === 'cancel_transaction') {
        await editTelegramMessage(chatId, messageId, "❌ Registo cancelado.");
      }
      await supabaseAdmin.from('telegram_sessions').delete().eq('id', sessionId);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }
    if (!body.message) {
      console.log("Evento do Telegram recebido não é uma mensagem. Ignorando.", body);
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }
    const message = body.message;
    const chatId = message.chat.id;
    let text = message.text ? message.text.trim() : null;
    const voice = message.voice;
    if (!text && !voice) {
      return new Response('Nenhuma mensagem de texto ou voz encontrada', {
        status: 200,
        headers: corsHeaders
      });
    }
    if (text && text.startsWith('/start')) {
      const licenseCode = text.split(' ')[1];
      if (!licenseCode) {
        await sendTelegramMessage(chatId, '👋 *Bem-vindo ao Zaq - Boas Contas!*\n\nPara vincular sua conta, use o comando:\n`/start SEU_CODIGO_DE_LICENCA`\n\n📍 Você encontra seu código na aba "Licença" do aplicativo web.\n\n❓ Use /ajuda para ver todos os comandos disponíveis.');
      } else {
        const result = await linkUserWithLicense(supabaseAdmin, chatId, licenseCode);
        await sendTelegramMessage(chatId, result.message);
      }
      return new Response('OK', {
        status: 200,
        headers: corsHeaders
      });
    }
    const { data: integration } = await supabaseAdmin.from('telegram_integration').select('user_id').eq('telegram_chat_id', chatId).single();
    if (!integration) {
      await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nUse:\n`/start SEU_CODIGO_DE_LICENCA`');
      return new Response('Utilizador não vinculado', {
        status: 401,
        headers: corsHeaders
      });
    }
    const userId = integration.user_id;

    // Verificar se está em modo de edição
    const { data: session } = await supabaseAdmin
      .from('telegram_sessions')
      .select('contexto')
      .eq('user_id', userId)
      .eq('telegram_id', message.from.id.toString())
      .single();

    if (session?.contexto?.editing_field && text) {
      const transactionId = session.contexto.editing_transaction_id;
      const field = session.contexto.editing_field;

      const { data: transaction } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (!transaction) {
        await sendTelegramMessage(chatId, '❌ Transação não encontrada.');
        await supabaseAdmin.from('telegram_sessions').update({ contexto: {} }).eq('user_id', userId);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      let updateData: any = {};

      try {
        switch (field) {
          case 'description':
            updateData.descricao = text;
            break;
          case 'amount':
            const amount = parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''));
            if (isNaN(amount)) throw new Error('Valor inválido');
            updateData.valor = amount;
            break;
          case 'category':
            const { data: category } = await supabaseAdmin
              .from('categories')
              .select('id')
              .eq('user_id', userId)
              .ilike('nome', `%${text}%`)
              .single();
            if (!category) throw new Error('Categoria não encontrada');
            updateData.categoria_id = category.id;
            break;
          case 'account':
            const { data: account } = await supabaseAdmin
              .from('accounts')
              .select('id')
              .eq('user_id', userId)
              .ilike('nome', `%${text}%`)
              .single();
            if (!account) throw new Error('Conta não encontrada');
            updateData.conta_origem_id = account.id;
            break;
          case 'date':
            const [day, month, year] = text.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (isNaN(date.getTime())) throw new Error('Data inválida');
            updateData.data_transacao = date.toISOString().split('T')[0];
            break;
        }

        await supabaseAdmin
          .from('transactions')
          .update(updateData)
          .eq('id', transactionId);

        await supabaseAdmin
          .from('telegram_sessions')
          .update({ contexto: {} })
          .eq('user_id', userId);

        await sendTelegramMessage(chatId, '✅ Transação atualizada com sucesso!');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        await sendTelegramMessage(chatId, `❌ Erro: ${errorMsg}\n\nTente novamente ou use /editar_ultima para recomeçar.`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
    }

    if (text && text.startsWith('/')) {
      await handleCommand(supabaseAdmin, text.toLowerCase(), userId, chatId);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Detectar perguntas em linguagem natural
    if (text) {
      const questionKeywords = ['quanto', 'quantos', 'quantas', 'qual', 'quais', 'onde', 'quando', 'como'];
      if (questionKeywords.some(kw => text.toLowerCase().startsWith(kw))) {
        const thinking = await sendTelegramMessage(chatId, '🤔 Deixe-me verificar...');
        
        try {
          const response = await supabaseAdmin.functions.invoke('query-engine', {
            body: { question: text, userId }
          });

          if (response.error) throw response.error;

          if (thinking?.message_id) {
            await editTelegramMessage(chatId, thinking.message_id, `❓ *Sua pergunta:* ${text}\n\n${response.data.answer}`);
          } else {
            await sendTelegramMessage(chatId, `❓ *Sua pergunta:* ${text}\n\n${response.data.answer}`, { parse_mode: 'Markdown' });
          }
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        } catch (error) {
          console.error('Erro ao processar pergunta:', error);
          const errorMsg = '❌ Desculpe, não consegui processar sua pergunta. Tente usar /perguntar [pergunta]';
          if (thinking?.message_id) {
            await editTelegramMessage(chatId, thinking.message_id, errorMsg);
          } else {
            await sendTelegramMessage(chatId, errorMsg);
          }
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
      }
    }

    // Processar como transação (voz ou texto)
    if (true) {
      const { data: license } = await supabaseAdmin.from('licenses').select('plano, status').eq('user_id', userId).eq('status', 'ativo').single();
      if (!license || license.plano !== 'premium') {
        await sendTelegramMessage(chatId, `🔒 *Funcionalidade Premium*\n\nOlá! A adição de transações pelo Telegram é uma funcionalidade exclusiva do plano Premium.\n\n✨ Com o Premium você terá:\n• Registro de transações por IA\n• Contas e categorias ilimitadas\n• Relatórios avançados\n• Metas e orçamentos\n\n📱 Visite nossa página de licenças para fazer upgrade e desbloquear todo o poder do Zaq - Boas Contas!\n\n🌐 Acesse: [Fazer Upgrade](${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/license)`);
        return new Response('Premium required', {
          status: 200,
          headers: corsHeaders
        });
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
        const errorMessage = transcriptionError instanceof Error ? transcriptionError.message : "Ocorreu um erro desconhecido na transcrição.";
        await sendTelegramMessage(chatId, `😥 Desculpe, não consegui transcrever o seu áudio.\n\n*Erro técnico:* \`${errorMessage}\``);
        return new Response('OK', {
          status: 200,
          headers: corsHeaders
        });
      }
      const { data: nlpData, error: nlpError } = await supabaseAdmin.functions.invoke('nlp-transaction', {
        body: {
          text,
          userId
        }
      });
      if (analyzingMessage?.message_id && !voice) {
        await editTelegramMessage(chatId, analyzingMessage.message_id, "✅ Análise concluída. A preparar confirmação...");
      }
      if (nlpError || !nlpData || nlpData.validation_errors && nlpData.validation_errors.length > 0) {
        const errorMsg = nlpData?.validation_errors?.join('\n') || "Não consegui entender sua mensagem.";
        await sendTelegramMessage(chatId, `❌ Problemas encontrados:\n${errorMsg}\n\nTente ser mais específico, como 'gastei 50 reais no almoço no Nubank'.`);
        return new Response('OK', {
          status: 200,
          headers: corsHeaders
        });
      }
      const { valor, descricao, tipo, categoria, conta, ...rest } = nlpData;
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
      const { data: sessionData, error: sessionError } = await supabaseAdmin.from('telegram_sessions').upsert({
        user_id: userId,
        telegram_id: message.from.id.toString(),
        chat_id: chatId.toString(),
        contexto: transactionData,
        status: 'ativo'
      }, {
        onConflict: 'telegram_id'
      }).select('id').single();
      if (sessionError) throw sessionError;
      let confirmationMessage = `✅ *Entendido! Registado.*\nPor favor, confirme se está tudo certo:\n\n`;
      confirmationMessage += `*Tipo:* ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}\n`;
      confirmationMessage += `*Descrição:* ${descricao}\n`;
      confirmationMessage += `*Valor:* ${formatCurrency(valor)}\n`;
      confirmationMessage += `*Conta:* ${conta}\n`;
      if (categoria) confirmationMessage += `*Categoria:* ${categoria}\n`;
      const inline_keyboard = [
        [
          {
            text: "✅ Confirmar",
            callback_data: `confirm_transaction:${sessionData.id}`
          },
          {
            text: "❌ Cancelar",
            callback_data: `cancel_transaction:${sessionData.id}`
          }
        ]
      ];
      await sendTelegramMessage(chatId, confirmationMessage, {
        reply_markup: {
          inline_keyboard
        }
      });
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
