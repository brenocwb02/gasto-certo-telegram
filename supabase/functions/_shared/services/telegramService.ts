import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface TelegramMessage {
  chat: { id: number };
  text?: string;
  from?: { id: number };
}

interface UserProfile {
  user_id: string;
  nome: string;
  telegram_chat_id?: number;
}

async function getUserProfile(telegramChatId: number): Promise<UserProfile | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_chat_id', telegramChatId)
    .single();

  return data;
}

async function getFormattedUserContext(userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId);
  const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId);

  return {
    accounts: accounts?.map(a => a.nome) || [],
    categories: categories?.map(c => c.nome) || []
  };
}

export async function processTextMessage(message: TelegramMessage, userProfile: UserProfile): Promise<string> {
  try {
    const text = message.text || '';
    
    if (text.startsWith('/')) {
      return await handleCommand(text, message, userProfile);
    }

    // Process with NLP
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.functions.invoke('nlp-transaction', {
      body: { text, userId: userProfile.user_id }
    });

    if (error || data?.validation_errors?.length > 0) {
      return `❌ Erro: ${data?.validation_errors?.join(', ') || error?.message || 'Erro desconhecido'}`;
    }

    // Create transaction
    const transactionData = {
      user_id: userProfile.user_id,
      descricao: data.descricao,
      tipo: data.tipo,
      valor: data.valor,
      categoria_id: data.categoria_id,
      conta_origem_id: data.conta_origem_id,
      conta_destino_id: data.conta_destino_id,
      data_transacao: new Date().toISOString().split('T')[0],
      origem: 'telegram'
    };

    const { error: insertError } = await supabase
      .from('transactions')
      .insert([transactionData]);

    if (insertError) {
      return `❌ Erro ao salvar: ${insertError.message}`;
    }

    return `✅ Transação registrada!\n\n💰 ${data.tipo === 'receita' ? 'Receita' : 'Despesa'}: R$ ${data.valor.toFixed(2)}\n📝 ${data.descricao}\n🏦 Conta: ${data.conta}\n📂 Categoria: ${data.categoria}`;

  } catch (error) {
    const err = error as Error;
    console.error('Error processing text message:', err);
    return `❌ Erro: ${err.message}`;
  }
}

export async function handleCommand(command: string, message: TelegramMessage, userProfile: UserProfile): Promise<string> {
  const cmd = command.toLowerCase().split(' ')[0];
  
  if (cmd === '/start') {
    return `👋 Olá ${userProfile.nome}! Você está conectado ao Gasto Certo.\n\nEnvie suas transações naturalmente, exemplo:\n"gastei 50 no mercado"`;
  }
  
  if (cmd === '/ajuda') {
    return `🆘 Como usar:\n\n1️⃣ Despesa: "gastei 50 no mercado"\n2️⃣ Receita: "recebi 1000 de salário"\n3️⃣ Transferência: "transferi 200 da carteira para conta"\n\n📊 Use /saldo para ver seu saldo`;
  }
  
  if (cmd === '/saldo') {
    const context = await getFormattedUserContext(userProfile.user_id);
    return `💰 Suas contas:\n${context.accounts.join('\n') || 'Nenhuma conta cadastrada'}`;
  }
  
  return '❓ Comando desconhecido. Use /ajuda para ver os comandos disponíveis.';
}

export async function processTelegramUpdate(payload: any) {
  const message = payload.message;
  
  if (!message?.chat?.id) {
    return { success: false, message: 'Invalid message format' };
  }

  const userProfile = await getUserProfile(message.chat.id);
  
  if (!userProfile) {
    return { 
      success: false, 
      message: 'Usuário não encontrado. Use /start no bot para conectar sua conta.',
      chatId: message.chat.id 
    };
  }

  const response = await processTextMessage(message, userProfile);
  
  return {
    success: true,
    message: response,
    chatId: message.chat.id
  };
}
