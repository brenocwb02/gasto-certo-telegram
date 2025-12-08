// Handlers de comandos e callbacks de cartão de crédito

import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /faturas - Mostra faturas dos cartões de crédito
 */
export async function handleFaturaCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: cards, error } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual, dia_fechamento, dia_vencimento')
            .eq('user_id', userId)
            .eq('tipo', 'cartao')
            .eq('ativo', true);

        if (error) throw error;

        if (!cards || cards.length === 0) {
            await sendTelegramMessage(
                chatId,
                `💳 *Faturas de Cartão*\n\nVocê não tem cartões de crédito cadastrados.`
            );
            return;
        }

        let message = `💳 *Faturas de Cartão de Crédito*\n\n`;

        for (const card of cards) {
            const fatura = Math.abs(card.saldo_atual || 0);
            const status = (card.saldo_atual || 0) < 0 ? '🔴' : '🟢';

            message += `${status} *${card.nome}*\n`;
            message += `   Fatura: ${formatCurrency(fatura)}\n`;
            message += `   Fechamento: dia ${card.dia_fechamento || 'N/A'}\n`;
            message += `   Vencimento: dia ${card.dia_vencimento || 'N/A'}\n\n`;
        }

        message += `\n💡 Use /pagar para pagar uma fatura.`;

        await sendTelegramMessage(chatId, message);

    } catch (error) {
        console.error('Erro em /faturas:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao buscar faturas. Tente novamente.`
        );
    }
}

/**
 * Comando /pagar - Inicia o processo de pagamento de fatura
 */
export async function handlePagarCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: cards, error } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual, dia_vencimento')
            .eq('user_id', userId)
            .eq('tipo', 'cartao')
            .eq('ativo', true)
            .lt('saldo_atual', 0);

        if (error) throw error;

        if (!cards || cards.length === 0) {
            await sendTelegramMessage(
                chatId,
                `✅ *Nenhuma fatura pendente!*\n\nTodos os seus cartões estão com saldo em dia.`
            );
            return;
        }

        // Criar botões para cada cartão com fatura
        const buttons = cards.map((card: any) => [{
            text: `💳 ${card.nome} - ${formatCurrency(Math.abs(card.saldo_atual))}`,
            callback_data: `pay_${card.id}`
        }]);

        buttons.push([{
            text: '❌ Cancelar',
            callback_data: 'pay_cancel'
        }]);

        await sendTelegramMessage(
            chatId,
            `💳 *Pagar Fatura*\n\nSelecione o cartão que deseja pagar:`,
            {
                reply_markup: {
                    inline_keyboard: buttons
                }
            }
        );

    } catch (error) {
        console.error('Erro em /pagar:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao buscar cartões. Tente novamente.`
        );
    }
}

/**
 * Comando /config_cartao - Configurar automação de pagamentos
 */
export async function handleConfigCartaoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: cards, error } = await supabase
            .from('accounts')
            .select('id, nome')
            .eq('user_id', userId)
            .eq('tipo', 'cartao')
            .eq('ativo', true);

        if (error) throw error;

        if (!cards || cards.length === 0) {
            await sendTelegramMessage(
                chatId,
                `ℹ️ Você não tem cartões de crédito cadastrados.\n\n` +
                `Cadastre um cartão no aplicativo para gerenciar faturas automaticamente.`
            );
            return;
        }

        // Criar botões para cada cartão
        const buttons = cards.map((card: any) => [{
            text: `⚙️ ${card.nome}`,
            callback_data: `config_card_${card.id}`
        }]);

        buttons.push([{
            text: '❌ Cancelar',
            callback_data: 'config_cancel'
        }]);

        await sendTelegramMessage(
            chatId,
            `⚙️ *Configurar Automação de Pagamento*\n\n` +
            `Selecione o cartão que deseja configurar:`,
            {
                reply_markup: {
                    inline_keyboard: buttons
                }
            }
        );

    } catch (error) {
        console.error('Erro em /config_cartao:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao buscar cartões. Tente novamente.`
        );
    }
}

/**
 * Processa callback de seleção de cartão para pagamento
 */
export async function handlePaymentCardSelection(
    supabase: any,
    chatId: number,
    userId: string,
    cardId: string
): Promise<void> {
    try {
        // Buscar dados do cartão
        const { data: card, error: cardError } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        if (cardError || !card) {
            await sendTelegramMessage(chatId, '❌ Cartão não encontrado.');
            return;
        }

        // Buscar contas para pagamento (não cartões, com saldo positivo)
        const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual')
            .eq('user_id', userId)
            .neq('tipo', 'cartao')
            .eq('ativo', true)
            .gt('saldo_atual', 0);

        if (accountsError || !accounts || accounts.length === 0) {
            await sendTelegramMessage(
                chatId,
                `❌ Nenhuma conta com saldo disponível para pagar a fatura.`
            );
            return;
        }

        const fatura = Math.abs(card.saldo_atual);

        // Criar botões para cada conta disponível
        const buttons = accounts.map((account: any) => [{
            text: `${account.nome} (${formatCurrency(account.saldo_atual)})`,
            callback_data: `confirm_pay_${cardId}_${account.id}`
        }]);

        buttons.push([{
            text: '❌ Cancelar',
            callback_data: 'pay_cancel'
        }]);

        await sendTelegramMessage(
            chatId,
            `💳 *Pagar fatura ${card.nome}*\n` +
            `💰 Valor: ${formatCurrency(fatura)}\n\n` +
            `Selecione a conta de origem:`,
            {
                reply_markup: {
                    inline_keyboard: buttons
                }
            }
        );

    } catch (error) {
        console.error('Erro no callback de pagamento:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao processar seleção. Tente novamente.`
        );
    }
}

/**
 * Confirma e executa o pagamento da fatura
 */
export async function confirmInvoicePayment(
    supabase: any,
    chatId: number,
    userId: string,
    cardId: string,
    accountId: string
): Promise<void> {
    try {
        // Buscar dados do cartão e conta
        const { data: card } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        const { data: account } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (!card || !account) {
            await sendTelegramMessage(chatId, '❌ Conta ou cartão não encontrado.');
            return;
        }

        const fatura = Math.abs(card.saldo_atual);

        // Verificar saldo suficiente
        if (account.saldo_atual < fatura) {
            await sendTelegramMessage(
                chatId,
                `❌ *Saldo insuficiente*\n\n` +
                `Fatura: ${formatCurrency(fatura)}\n` +
                `Saldo disponível: ${formatCurrency(account.saldo_atual)}\n` +
                `Faltam: ${formatCurrency(fatura - account.saldo_atual)}`
            );
            return;
        }

        // Tentar usar a função RPC do banco
        const { data: result, error: rpcError } = await supabase.rpc('process_invoice_payment', {
            p_card_account_id: cardId,
            p_payment_account_id: accountId,
            p_amount: fatura
        });

        if (rpcError) {
            console.error('Erro RPC:', rpcError);
            // Fallback: fazer manualmente se RPC falhar
            // Debitar da conta
            await supabase.from('accounts').update({
                saldo_atual: account.saldo_atual - fatura
            }).eq('id', accountId);

            // Creditar no cartão
            await supabase.from('accounts').update({
                saldo_atual: card.saldo_atual + fatura
            }).eq('id', cardId);

            await sendTelegramMessage(
                chatId,
                `✅ *Pagamento realizado!*\n\n` +
                `💳 Cartão: ${card.nome}\n` +
                `💰 Valor pago: ${formatCurrency(fatura)}\n` +
                `🏦 Conta: ${account.nome}\n` +
                `📊 Novo saldo: ${formatCurrency(account.saldo_atual - fatura)}`
            );
            return;
        }

        if (result?.success) {
            await sendTelegramMessage(
                chatId,
                `✅ *Pagamento realizado com sucesso!*\n\n` +
                `💳 Cartão: ${result.card_name}\n` +
                `💰 Valor pago: ${formatCurrency(result.amount_paid)}\n` +
                `🏦 Conta: ${result.payment_account_name}\n` +
                `📊 Saldo restante: ${formatCurrency(result.new_payment_balance)}`
            );
        } else {
            await sendTelegramMessage(
                chatId,
                `❌ *Pagamento não realizado*\n\n` +
                `Motivo: ${result?.error || 'Erro desconhecido'}`
            );
        }

    } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao processar pagamento. Tente novamente.`
        );
    }
}

/**
 * Mostra configurações de um cartão específico
 */
export async function handleCardConfigCallback(
    supabase: any,
    chatId: number,
    userId: string,
    cardId: string
): Promise<void> {
    try {
        // Buscar configuração atual
        const { data: settings } = await supabase
            .from('credit_card_settings')
            .select('*')
            .eq('account_id', cardId)
            .eq('user_id', userId)
            .single();

        // Buscar dados do cartão
        const { data: card } = await supabase
            .from('accounts')
            .select('nome')
            .eq('id', cardId)
            .single();

        if (!card) {
            await sendTelegramMessage(chatId, '❌ Cartão não encontrado.');
            return;
        }

        const autoPayment = settings?.auto_payment || false;
        const sendReminder = settings?.send_reminder !== false;
        const reminderDays = settings?.reminder_days_before || 3;

        const autoStatus = autoPayment ? '✅ Ativado' : '❌ Desativado';
        const reminderStatus = sendReminder ? '✅ Ativado' : '❌ Desativado';

        const message = `⚙️ *Configurações: ${card.nome}*\n\n` +
            `🤖 Pagamento Automático: ${autoStatus}\n` +
            `🔔 Lembrete: ${reminderStatus}\n` +
            `📅 Dias antes: ${reminderDays}\n\n` +
            `Selecione o que deseja alterar:`;

        const keyboard = {
            inline_keyboard: [
                [{
                    text: `${autoPayment ? '🔴 Desativar' : '🟢 Ativar'} Pagamento Auto`,
                    callback_data: `toggle_auto_${cardId}`
                }],
                [{
                    text: `${sendReminder ? '🔴 Desativar' : '🟢 Ativar'} Lembrete`,
                    callback_data: `toggle_reminder_${cardId}`
                }],
                [{ text: '❌ Fechar', callback_data: 'config_cancel' }]
            ]
        };

        await sendTelegramMessage(chatId, message, { reply_markup: keyboard });

    } catch (error) {
        console.error('Erro no callback de config:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao carregar configurações. Tente novamente.`
        );
    }
}

/**
 * Toggle pagamento automático
 */
export async function toggleCardAutoPayment(
    supabase: any,
    chatId: number,
    userId: string,
    cardId: string
): Promise<void> {
    try {
        // Buscar configuração atual
        const { data: settings } = await supabase
            .from('credit_card_settings')
            .select('auto_payment')
            .eq('account_id', cardId)
            .eq('user_id', userId)
            .single();

        const newValue = !(settings?.auto_payment);

        // Upsert configuração
        const { error } = await supabase
            .from('credit_card_settings')
            .upsert({
                account_id: cardId,
                user_id: userId,
                auto_payment: newValue,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'account_id'
            });

        if (error) throw error;

        const status = newValue ? '✅ ativado' : '❌ desativado';
        await sendTelegramMessage(
            chatId,
            `🤖 Pagamento automático ${status}!\n\n` +
            `${newValue ?
                '⚠️ Certifique-se de ter saldo suficiente na conta padrão no dia do vencimento.' :
                'Você receberá lembretes para pagar manualmente.'}`
        );

        // Recarregar menu de configuração
        await handleCardConfigCallback(supabase, chatId, userId, cardId);

    } catch (error) {
        console.error('Erro ao toggle auto payment:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao alterar configuração. Tente novamente.`
        );
    }
}

/**
 * Toggle lembrete de fatura
 */
export async function toggleCardReminder(
    supabase: any,
    chatId: number,
    userId: string,
    cardId: string
): Promise<void> {
    try {
        // Buscar configuração atual
        const { data: settings } = await supabase
            .from('credit_card_settings')
            .select('send_reminder')
            .eq('account_id', cardId)
            .eq('user_id', userId)
            .single();

        const newValue = !(settings?.send_reminder ?? true);

        // Upsert configuração
        const { error } = await supabase
            .from('credit_card_settings')
            .upsert({
                account_id: cardId,
                user_id: userId,
                send_reminder: newValue,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'account_id'
            });

        if (error) throw error;

        const status = newValue ? '✅ ativado' : '❌ desativado';
        await sendTelegramMessage(
            chatId,
            `🔔 Lembrete de fatura ${status}!`
        );

        // Recarregar menu de configuração
        await handleCardConfigCallback(supabase, chatId, userId, cardId);

    } catch (error) {
        console.error('Erro ao toggle reminder:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao alterar configuração. Tente novamente.`
        );
    }
}
