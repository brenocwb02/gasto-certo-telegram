import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Initialize Google AI client
const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);

async function getUserProfile(telegramChatId) {
  const { data: userProfile, error } = await supabase
    .from('telegram_integration')
    .select('user_id, users(id, name)')
    .eq('telegram_chat_id', telegramChatId)
    .single();

  if (error || !userProfile) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return userProfile;
}

async function getFormattedUserContext(userId) {
    const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', userId);

    const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('user_id', userId);

    if (categoriesError || accountsError) {
        console.error('Error fetching context:', categoriesError || accountsError);
        return 'Contexto indisponível.';
    }

    const categoriesText = categories.map(c => `${c.name} (id: ${c.id})`).join(', ');
    const accountsText = accounts.map(a => `${a.name} (id: ${a.id})`).join(', ');

    return `Categorias do usuário: ${categoriesText}. Contas do usuário: ${accountsText}.`;
}

export async function processTextMessage(message, userProfile) {
    const text = message.text;
    const userContext = await getFormattedUserContext(userProfile.user_id);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
        Você é um assistente financeiro especialista. Analise o texto do usuário para registrar uma transação.
        O texto é: "${text}".
        
        Seu objetivo é extrair as seguintes informações e retornar um objeto JSON:
        - "description": (string) Uma descrição clara da transação.
        - "amount": (number) O valor da transação. Se for um gasto, deve ser negativo. Se for uma receita, positivo.
        - "category_id": (number) O ID da categoria correspondente.
        - "account_id": (number) O ID da conta correspondente.
        - "date": (string) A data da transação no formato AAAA-MM-DD. Se não for especificada, use a data de hoje.

        Aqui está o contexto das categorias e contas do usuário para te ajudar a escolher os IDs corretos:
        ${userContext}

        Regras importantes:
        1. Se você não conseguir determinar alguma informação com certeza, use o valor 'null' para o campo correspondente no JSON.
        2. O valor 'amount' DEVE ser negativo para despesas.
        3. A data DEVE estar no formato AAAA-MM-DD. A data de hoje é ${new Date().toISOString().split('T')[0]}.
        4. NÃO invente categorias ou contas. Use apenas as fornecidas no contexto. Se o usuário mencionar uma que não existe, use 'null' para o ID e adicione um campo "unrecognized_category" ou "unrecognized_account" ao JSON com o nome que o usuário mencionou.

        Retorne APENAS o objeto JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, '').trim();
        const transactionData = JSON.parse(jsonText);

        const { error } = await supabase.from('transactions').insert([{
            ...transactionData,
            user_id: userProfile.user_id,
        }]);

        if (error) {
            console.error('Error inserting transaction:', error);
            return 'Não consegui registrar a transação. Tente novamente.';
        }

        return `✅ Transação registrada: ${transactionData.description} - R$ ${Math.abs(transactionData.amount)}`;

    } catch (e) {
        console.error('Error with Generative AI or JSON parsing:', e);
        return 'Tive um problema para entender sua mensagem. Pode tentar de outra forma?';
    }
}

export async function handleCommand(command, message, userProfile) {
    // Logic for commands like /saldo, /resumo etc. can be built out here.
    return `Comando '${command}' recebido! Esta funcionalidade ainda está em construção.`;
}

export async function processTelegramUpdate(payload) {
    const message = payload.message;
    if (!message || !message.chat || !message.chat.id) {
        console.log('Update is not a message, ignoring.');
        return new Response('ok');
    }
    
    const chatId = message.chat.id;
    const userProfile = await getUserProfile(chatId);

    if (!userProfile) {
        await supabase.functions.invoke('send-telegram-message', {
            body: { chat_id: chatId, text: 'Olá! Não encontrei sua conta. Por favor, integre seu Telegram através do app Zac - Boas Contas.' }
        });
        return new Response('ok');
    }

    let responseText;

    if (message.text) {
        if (message.text.startsWith('/')) {
            const command = message.text.split(' ')[0];
            responseText = await handleCommand(command, message, userProfile);
        } else {
            responseText = await processTextMessage(message, userProfile);
        }
    } else {
        responseText = 'Desculpe, só consigo processar mensagens de texto no momento.';
    }

    await supabase.functions.invoke('send-telegram-message', {
        body: { chat_id: chatId, text: responseText }
    });

    return new Response('ok');
}
