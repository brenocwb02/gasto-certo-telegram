
import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';
import { handleAjudaCommand } from './admin.ts';

// Objetivos financeiros disponíveis
const FINANCIAL_GOALS = {
    economizar: { emoji: '💰', label: 'Economizar Dinheiro', response: 'guardar dinheiro' },
    controlar: { emoji: '📊', label: 'Controlar Gastos', response: 'ter controle dos seus gastos' },
    quitar_dividas: { emoji: '🎯', label: 'Quitar Dívidas', response: 'sair das dívidas' },
    realizar_sonho: { emoji: '🏠', label: 'Realizar um Sonho', response: 'realizar seu sonho' }
};

/**
 * Inicia o Wizard de Onboarding - PASSO 1: Boas Vindas
 */
export async function handleOnboardingStart(supabase: any, chatId: number, userId: string): Promise<void> {
    // Verificar se já tem nome cadastrado (usuário existente)
    const { data: profile } = await supabase
        .from('profiles')
        .select('nome, objetivo_financeiro')
        .eq('user_id', userId)
        .single();

    // Se já tem nome e objetivo, vai direto pro menu
    if (profile?.nome && profile?.objetivo_financeiro) {
        await handleAjudaCommand(chatId);
        return;
    }

    // Verificar se já tem contas (usuário antigo sem onboarding)
    const { count: accountCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (accountCount && accountCount > 0 && profile?.nome) {
        // Já tem contas e nome, pular para objetivo
        await showGoalSelection(supabase, chatId, userId, null);
        return;
    }

    // Marcar estado do onboarding
    await supabase
        .from('profiles')
        .update({ onboarding_step: 'awaiting_name' })
        .eq('user_id', userId);

    // Passo 1: Boas Vindas + Perguntar Nome
    const message = `👋 *Olá! Sou o Zaq!* 🤖\n\n` +
        `Sou seu assistente financeiro pessoal. Vou te ajudar a organizar suas finanças de forma simples e inteligente.\n\n` +
        `📝 *Como posso te chamar?*\n\n` +
        `_Digite seu nome abaixo:_`;

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

/**
 * Processa o nome digitado pelo usuário
 */
export async function handleOnboardingName(supabase: any, chatId: number, userId: string, name: string): Promise<void> {
    // Salvar nome no perfil
    await supabase
        .from('profiles')
        .update({
            nome: name.trim(),
            onboarding_step: 'awaiting_goal'
        })
        .eq('user_id', userId);

    // Mostrar seleção de objetivo
    await showGoalSelection(supabase, chatId, userId, name.trim());
}

/**
 * Mostra seleção de objetivo financeiro - PASSO 2
 */
async function showGoalSelection(supabase: any, chatId: number, userId: string, name: string | null): Promise<void> {
    const greeting = name ? `Prazer, *${name}*! 🎉` : `Ótimo!`;

    const message = `${greeting}\n\n` +
        `🎯 *Qual seu principal objetivo financeiro?*\n\n` +
        `_Escolha uma opção:_`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: "💰 Economizar", callback_data: "onboarding_goal_economizar" },
                { text: "📊 Controlar", callback_data: "onboarding_goal_controlar" }
            ],
            [
                { text: "🎯 Quitar Dívidas", callback_data: "onboarding_goal_quitar_dividas" },
                { text: "🏠 Realizar Sonho", callback_data: "onboarding_goal_realizar_sonho" }
            ]
        ]
    };

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

/**
 * Processa seleção de objetivo e vai para criação de conta - PASSO 3
 */
async function handleGoalSelection(supabase: any, chatId: number, userId: string, messageId: number, goal: string): Promise<void> {
    const goalInfo = FINANCIAL_GOALS[goal as keyof typeof FINANCIAL_GOALS];

    // Salvar objetivo
    await supabase
        .from('profiles')
        .update({
            objetivo_financeiro: goal,
            onboarding_step: 'awaiting_account'
        })
        .eq('user_id', userId);

    // Verificar se já tem conta
    const { count: accountCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (accountCount && accountCount > 0) {
        // Já tem conta, finalizar
        await handleOnboardingComplete(supabase, chatId, userId, messageId, goalInfo.response);
        return;
    }

    // Passo 3: Criar Conta
    const message = `${goalInfo.emoji} Vou te ajudar a *${goalInfo.response}*!\n\n` +
        `Agora, vamos configurar onde seu dinheiro fica.\n\n` +
        `*Qual sua conta principal?*`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: "💜 Nubank", callback_data: "onboarding_create_nubank" },
                { text: "🧡 Itaú", callback_data: "onboarding_create_itau" }
            ],
            [
                { text: "💵 Carteira Física", callback_data: "onboarding_create_wallet" },
                { text: "🏦 Outro", callback_data: "onboarding_create_other" }
            ],
            [
                { text: "⏩ Pular (Criar depois)", callback_data: "onboarding_skip_account" }
            ]
        ]
    };

    await editTelegramMessage(chatId, messageId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

/**
 * Finaliza onboarding com mensagem motivacional
 */
async function handleOnboardingComplete(supabase: any, chatId: number, userId: string, messageId: number | null, goalText: string): Promise<void> {
    // Buscar nome do usuário
    const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', userId)
        .single();

    const name = profile?.nome || 'amigo';

    // Marcar onboarding como completo
    await supabase
        .from('profiles')
        .update({ onboarding_step: 'completed' })
        .eq('user_id', userId);

    const message = `🎉 *Tudo pronto, ${name}!*\n\n` +
        `Vou te ajudar a ${goalText} de forma simples e inteligente.\n\n` +
        `💡 *Dica de Ouro:* Você não precisa de menus! Apenas digite:\n` +
        `• _"Gastei 50 no mercado"_\n` +
        `• _"Recebi 1000 de salário"_\n` +
        `• _"Transferi 200 pro Nubank"_\n\n` +
        `Ou grave um áudio! 🎤\n\n` +
        `Vamos começar?`;

    if (messageId) {
        await editTelegramMessage(chatId, messageId, message, { parse_mode: 'Markdown' });
    } else {
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    }

    // Mostrar menu principal
    await handleAjudaCommand(chatId);
}

/**
 * Lida com os callbacks do Onboarding
 */
export async function handleOnboardingCallback(
    supabase: any,
    chatId: number,
    userId: string,
    messageId: number,
    data: string
): Promise<void> {

    // 1. Seleção de Objetivo
    if (data.startsWith('onboarding_goal_')) {
        const goal = data.replace('onboarding_goal_', '');
        await handleGoalSelection(supabase, chatId, userId, messageId, goal);
        return;
    }

    // 2. Pular apenas a conta (já tem objetivo)
    if (data === 'onboarding_skip_account') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('objetivo_financeiro')
            .eq('user_id', userId)
            .single();

        const goalInfo = FINANCIAL_GOALS[profile?.objetivo_financeiro as keyof typeof FINANCIAL_GOALS];
        await handleOnboardingComplete(supabase, chatId, userId, messageId, goalInfo?.response || 'organizar suas finanças');
        return;
    }

    // 3. Pular tudo
    if (data === 'onboarding_skip') {
        await editTelegramMessage(chatId, messageId, "✅ Introdução pulada. Divirta-se!");
        await handleAjudaCommand(chatId);
        return;
    }

    // 4. Criar Conta (Nubank, Itau, etc)
    if (data.startsWith('onboarding_create_')) {
        const type = data.replace('onboarding_create_', '');
        let accountName = "Conta Principal";

        switch (type) {
            case 'nubank': accountName = "Nubank"; break;
            case 'itau': accountName = "Itaú"; break;
            case 'wallet': accountName = "Carteira"; break;
            case 'other': accountName = "Conta Corrente"; break;
        }

        // Criar conta no Supabase
        const { data: account, error } = await supabase
            .from('accounts')
            .insert({
                user_id: userId,
                nome: accountName,
                tipo: type === 'wallet' ? 'carteira' : 'corrente',
                saldo_inicial: 0
            })
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar conta onboarding:", error);
            await editTelegramMessage(chatId, messageId, "❌ Erro ao criar conta. Tente mais tarde.");
            return;
        }

        // Buscar objetivo do usuário
        const { data: profile } = await supabase
            .from('profiles')
            .select('objetivo_financeiro')
            .eq('user_id', userId)
            .single();

        const goalInfo = FINANCIAL_GOALS[profile?.objetivo_financeiro as keyof typeof FINANCIAL_GOALS];

        // Mensagem de sucesso com próximos passos
        const message = `✅ *Conta "${accountName}" criada!*\n\n` +
            `Agora você está pronto para controlar suas finanças! 🚀\n\n` +
            `💡 *Dica:* Experimente digitar:\n` +
            `_"Gastei 30 no almoço"_`;

        await editTelegramMessage(chatId, messageId, message, { parse_mode: 'Markdown' });
        await handleOnboardingComplete(supabase, chatId, userId, null, goalInfo?.response || 'organizar suas finanças');
        return;
    }

    // 5. Criar Transação Exemplo (mantido para compatibilidade)
    if (data.startsWith('onboarding_trans_')) {
        const parts = data.replace('onboarding_trans_', '').split('_');
        const itemType = parts[0];
        const accountId = parts.slice(1).join('_');

        let description = "Café";
        let amount = 5.00;

        switch (itemType) {
            case 'cafe': description = "Cafézinho"; amount = 5.00; break;
            case 'almoco': description = "Almoço"; amount = 25.00; break;
            case 'uber': description = "Uber"; amount = 15.00; break;
        }

        const { error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                account_id: accountId,
                descricao: description,
                valor: amount,
                tipo: 'despesa',
                data: new Date().toISOString(),
                efetuada: true
            });

        if (error) {
            console.error("Erro transacao onboarding:", error);
            await editTelegramMessage(chatId, messageId, "❌ Erro ao criar transação.");
            return;
        }

        const finishMessage = `🎉 *Parabéns! Você concluiu o tutorial.*\n\n` +
            `📝 Registramos um *${description}* de *R$ ${amount.toFixed(2).replace('.', ',')}* para você.\n\n` +
            `👉 *Dica:* Você não precisa de botões! Apenas digite:\n` +
            `_"Gastei 50 no mercado"_\n\n` +
            `Agora, explore o menu principal:`;

        await editTelegramMessage(chatId, messageId, finishMessage, { parse_mode: 'Markdown' });
        await handleAjudaCommand(chatId);
    }

    if (data === 'onboarding_finish') {
        await editTelegramMessage(chatId, messageId, "✅ Configuração inicial concluída!");
        await handleAjudaCommand(chatId);
    }
}
