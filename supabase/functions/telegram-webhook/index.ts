import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TelegramUpdate {
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
    };
    text?: string;
    voice?: {
      file_id: string;
      duration: number;
    };
  };
}

interface UserProfile {
  user_id: string;
  nome: string;
  telegram_id: string;
}

interface License {
  user_id: string;
  codigo: string;
  status: string;
  tipo: string;
}

// Helper function to send Telegram message
async function sendTelegramMessage(chatId: number, text: string, parseMode = 'Markdown') {
  const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return response.json();
}

// Helper function to get user profile by telegram_id
async function getUserProfile(telegramId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, nome, telegram_id')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// Helper function to check license validity
async function checkLicense(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('licenses')
    .select('status, tipo, data_expiracao')
    .eq('user_id', userId)
    .eq('status', 'ativo')
    .single();

  if (error || !data) {
    return false;
  }

  // For vitalicia licenses, always valid if active
  if (data.tipo === 'vitalicia') return true;

  // For other licenses, check expiration
  if (data.data_expiracao) {
    const now = new Date();
    const expiration = new Date(data.data_expiracao);
    return now <= expiration;
  }

  return true;
}

// Helper function to link user with license code
async function linkUserWithLicense(telegramId: string, licenseCode: string): Promise<boolean> {
  try {
    // Find license by code
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('user_id, codigo, status')
      .eq('codigo', licenseCode)
      .eq('status', 'ativo')
      .single();

    if (licenseError || !license) {
      console.error('License not found:', licenseError);
      return false;
    }

    // Update profile with telegram_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ telegram_id: telegramId })
      .eq('user_id', license.user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking user with license:', error);
    return false;
  }
}

// Helper function to get user accounts
async function getUserAccounts(userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('ativo', true);

  return error ? [] : data;
}

// Helper function to get user categories
async function getUserCategories(userId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  return error ? [] : data;
}

// Helper function to get recent transactions
async function getRecentTransactions(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categoria:categories(nome),
      conta_origem:accounts!conta_origem_id(nome),
      conta_destino:accounts!conta_destino_id(nome)
    `)
    .eq('user_id', userId)
    .order('data_transacao', { ascending: false })
    .limit(limit);

  return error ? [] : data;
}

// Helper function to parse transaction from message
function parseTransactionMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Extract amount
  const amountMatch = message.match(/(\d+(?:,\d{2})?)/);
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[1].replace(',', '.'));
  
  // Determine transaction type
  let tipo = 'despesa';
  if (lowerMessage.includes('recebi') || lowerMessage.includes('ganhei') || lowerMessage.includes('salário')) {
    tipo = 'receita';
  } else if (lowerMessage.includes('transferi') || lowerMessage.includes('transfer')) {
    tipo = 'transferencia';
  }
  
  // Extract description (everything except the amount)
  const description = message.replace(amountMatch[0], '').replace(/reais?|r\$|\$/, '').trim();
  
  return {
    tipo,
    valor: amount,
    descricao: description || 'Transação via Telegram',
    data_transacao: new Date().toISOString().split('T')[0],
  };
}

// Helper function to create transaction
async function createTransaction(userId: string, transactionData: any) {
  // Get user's first account as default
  const accounts = await getUserAccounts(userId);
  if (accounts.length === 0) {
    throw new Error('Nenhuma conta encontrada');
  }

  const defaultAccount = accounts[0];
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      ...transactionData,
      user_id: userId,
      conta_origem_id: defaultAccount.id,
      origem: 'telegram',
    }]);

  if (error) {
    throw error;
  }

  return data;
}

// Process different commands
async function processCommand(command: string, args: string[], userProfile: UserProfile, chatId: number) {
  const userId = userProfile.user_id;

  switch (command) {
    case '/saldo': {
      const accounts = await getUserAccounts(userId);
      if (accounts.length === 0) {
        await sendTelegramMessage(chatId, '❌ Nenhuma conta cadastrada.');
        return;
      }

      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.saldo_atual), 0);
      let message = `💰 *Saldo das Contas*\n\n`;
      
      accounts.forEach(account => {
        const balance = parseFloat(account.saldo_atual);
        message += `${account.nome}: R$ ${balance.toFixed(2)}\n`;
      });
      
      message += `\n*Total: R$ ${totalBalance.toFixed(2)}*`;
      await sendTelegramMessage(chatId, message);
      break;
    }

    case '/extrato': {
      const transactions = await getRecentTransactions(userId, 10);
      if (transactions.length === 0) {
        await sendTelegramMessage(chatId, '❌ Nenhuma transação encontrada.');
        return;
      }

      let message = `📊 *Últimas Transações*\n\n`;
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.data_transacao).toLocaleDateString('pt-BR');
        const type = transaction.tipo === 'receita' ? '💚' : '❤️';
        const value = parseFloat(transaction.valor);
        message += `${type} ${transaction.descricao}\n`;
        message += `R$ ${value.toFixed(2)} - ${date}\n\n`;
      });

      await sendTelegramMessage(chatId, message);
      break;
    }

    case '/resumo': {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data: monthTransactions } = await supabase
        .from('transactions')
        .select('tipo, valor')
        .eq('user_id', userId)
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

      const receitas = monthTransactions?.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;
      const despesas = monthTransactions?.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;
      const saldo = receitas - despesas;

      const message = `📈 *Resumo do Mês*\n\n` +
        `💚 Receitas: R$ ${receitas.toFixed(2)}\n` +
        `❤️ Despesas: R$ ${despesas.toFixed(2)}\n` +
        `💰 Saldo: R$ ${saldo.toFixed(2)}`;

      await sendTelegramMessage(chatId, message);
      break;
    }

    case '/categorias': {
      const categories = await getUserCategories(userId);
      if (categories.length === 0) {
        await sendTelegramMessage(chatId, '❌ Nenhuma categoria cadastrada.');
        return;
      }

      let message = `📁 *Categorias*\n\n`;
      
      categories.forEach(category => {
        const type = category.tipo === 'receita' ? '💚' : '❤️';
        message += `${type} ${category.nome}\n`;
      });

      await sendTelegramMessage(chatId, message);
      break;
    }

    default:
      await sendTelegramMessage(chatId, 
        '❓ Comando não reconhecido.\n\n' +
        '*Comandos disponíveis:*\n' +
        '/saldo - Ver saldo das contas\n' +
        '/extrato - Ver últimas transações\n' +
        '/resumo - Resumo do mês\n' +
        '/categorias - Listar categorias\n\n' +
        'Ou envie uma mensagem como: "Gastei 50 reais no supermercado"'
      );
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    
    if (!update.message) {
      return new Response('No message', { status: 200 });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const telegramId = message.from.id.toString();
    const messageText = message.text || '';

    console.log('Received message:', { chatId, telegramId, messageText });

    // Handle /start command with license code
    if (messageText.startsWith('/start ')) {
      const licenseCode = messageText.split(' ')[1];
      
      if (!licenseCode) {
        await sendTelegramMessage(chatId, 
          '❌ Código de licença não fornecido.\n\n' +
          'Use: /start CODIGO_DA_LICENCA'
        );
        return new Response('OK', { status: 200 });
      }

      const linked = await linkUserWithLicense(telegramId, licenseCode);
      
      if (linked) {
        await sendTelegramMessage(chatId, 
          '✅ *Conta vinculada com sucesso!*\n\n' +
          'Agora você pode usar o bot para:\n' +
          '• Ver saldos com /saldo\n' +
          '• Ver extrato com /extrato\n' +
          '• Ver resumo com /resumo\n' +
          '• Registrar transações enviando mensagens\n\n' +
          '*Exemplo:* "Gastei 50 reais no supermercado"'
        );
      } else {
        await sendTelegramMessage(chatId, 
          '❌ Código de licença inválido ou expirado.\n\n' +
          'Verifique o código nas configurações do app.'
        );
      }
      
      return new Response('OK', { status: 200 });
    }

    // Get user profile
    const userProfile = await getUserProfile(telegramId);
    
    if (!userProfile) {
      await sendTelegramMessage(chatId, 
        '❌ Conta não vinculada.\n\n' +
        'Use /start CODIGO_DA_LICENCA para vincular sua conta.\n' +
        'Encontre seu código nas configurações do app.'
      );
      return new Response('OK', { status: 200 });
    }

    // Check license validity
    const hasValidLicense = await checkLicense(userProfile.user_id);
    
    if (!hasValidLicense) {
      await sendTelegramMessage(chatId, 
        '❌ Licença inválida ou expirada.\n\n' +
        'Verifique sua licença no app.'
      );
      return new Response('OK', { status: 200 });
    }

    // Handle voice messages
    if (message.voice) {
      // TODO: Implement voice message transcription using OpenAI Whisper
      await sendTelegramMessage(chatId, 
        '🎤 Mensagens de voz serão implementadas em breve.\n' +
        'Por enquanto, use texto para registrar transações.'
      );
      return new Response('OK', { status: 200 });
    }

    // Handle commands
    if (messageText.startsWith('/')) {
      const [command, ...args] = messageText.split(' ');
      await processCommand(command, args, userProfile, chatId);
      return new Response('OK', { status: 200 });
    }

    // Handle transaction messages
    const transactionData = parseTransactionMessage(messageText);
    
    if (transactionData) {
      try {
        await createTransaction(userProfile.user_id, transactionData);
        
        const typeEmoji = transactionData.tipo === 'receita' ? '💚' : '❤️';
        await sendTelegramMessage(chatId, 
          `${typeEmoji} *Transação registrada!*\n\n` +
          `${transactionData.descricao}\n` +
          `R$ ${transactionData.valor.toFixed(2)}`
        );
      } catch (error) {
        console.error('Error creating transaction:', error);
        await sendTelegramMessage(chatId, 
          '❌ Erro ao registrar transação.\n' +
          'Tente novamente ou verifique suas contas no app.'
        );
      }
    } else {
      await sendTelegramMessage(chatId, 
        '❓ Não consegui entender a transação.\n\n' +
        '*Exemplo:* "Gastei 50 reais no supermercado"\n' +
        '*Exemplo:* "Recebi 100 de freelance"\n\n' +
        'Ou use os comandos disponíveis como /saldo'
      );
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error', { status: 500 });
  }
});