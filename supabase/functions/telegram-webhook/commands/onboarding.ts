
import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';
import { handleAjudaCommand } from './admin.ts';

/**
 * Inicia o Wizard de Onboarding
 */
export async function handleOnboardingStart(supabase: any, chatId: number, userId: string): Promise<void> {
    // Verificar se realmente é novo (dupla checagem opcional, mas boa p/ segurança)
    const { count: accountCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (accountCount && accountCount > 0) {
        // Já tem conta, manda pro menu normal
        await handleAjudaCommand(chatId);
        return;
    }

    // Passo 1: Boas Vindas + Criar Conta
    const message = `👋 *Bem-vindo ao Zaq!* 🤖\n\n` +
        `Vi que é sua primeira vez aqui. Para começarmos, precisamos configurar onde seu dinheiro fica.\n\n` +
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
                { text: "⏩ Pular Introdução", callback_data: "onboarding_skip" }
            ]
        ]
    };

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
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

    // 1. Pular
    if (data === 'onboarding_skip') {
        await editTelegramMessage(chatId, messageId, "✅ Introdução pulada. Divirta-se!");
        await handleAjudaCommand(chatId);
        return;
    }

    // 2. Criar Conta (Nubank, Itau, etc)
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

        // Sucesso: Ir para passo da Transação
        const message = `✅ *Conta "${accountName}" criada!*\n\n` +
            `Agora, vamos registrar um gasto de teste para você ver como é fácil.\n\n` +
            `*O que você comprou hoje?*`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: "☕ Café (R$ 5,00)", callback_data: `onboarding_trans_cafe_${account.id}` }
                ],
                [
                    { text: "🍔 Almoço (R$ 25,00)", callback_data: `onboarding_trans_almoco_${account.id}` }
                ],
                [
                    { text: "🚗 Uber (R$ 15,00)", callback_data: `onboarding_trans_uber_${account.id}` }
                ],
                [
                    { text: "🏁 Concluir (Sem gasto)", callback_data: "onboarding_finish" }
                ]
            ]
        };

        await editTelegramMessage(chatId, messageId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
        return;
    }

    // 3. Criar Transação Exemplo
    if (data.startsWith('onboarding_trans_')) {
        // Formato: onboarding_trans_TYPE_ACCOUNTID
        // Ex: onboarding_trans_cafe_uuid-123-uuid
        const parts = data.replace('onboarding_trans_', '').split('_');
        const itemType = parts[0]; // cafe, almoco, uber
        // Account ID pode ter hifens, então juntamos o resto
        const accountId = parts.slice(1).join('_');

        let description = "Café";
        let amount = 5.00;
        let categoryName = "Alimentação";

        switch (itemType) {
            case 'cafe': description = "Cafézinho"; amount = 5.00; categoryName = "Alimentação"; break;
            case 'almoco': description = "Almoço"; amount = 25.00; categoryName = "Alimentação"; break;
            case 'uber': description = "Uber"; amount = 15.00; categoryName = "Transporte"; break;
        }

        // Buscar ou Criar Categoria
        // Simplificação: Vamos pegar qualquer categoria desse nome ou criar uma "Geral"
        // Idealmente o sistema já tem categorias padrão

        // Inserir Transação
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

        // Finalizar
        const finishMessage = `🎉 *Parabéns! Você concluiu o tutorial.*\n\n` +
            `📝 Registramos um *${description}* de *R$ ${amount.toFixed(2).replace('.', ',')}* para você.\n\n` +
            `👉 *Dica de Ouro:* Você não precisa de botões! Apenas digite:\n` +
            `_"Gastei 50 no mercado"_\n` +
            `_"Recebi 100 de pix"_\n\n` +
            `Agora, explore o menu principal:`;

        await editTelegramMessage(chatId, messageId, finishMessage);
        await handleAjudaCommand(chatId);
    }

    if (data === 'onboarding_finish') {
        await editTelegramMessage(chatId, messageId, "✅ Configuração inicial concluída!");
        await handleAjudaCommand(chatId);
    }
}
