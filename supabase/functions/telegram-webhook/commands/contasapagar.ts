/**
 * Pendentes - Visão unificada de contas a pagar
 * 
 * Mostra:
 * - Faturas de cartão de crédito (saldo negativo)
 * - Despesas pendentes (efetivada = false) de contas NÃO-cartão
 * 
 * Comandos: /pendentes, /contasapagar, /agenda
 */

import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /pendentes - Lista tudo que precisa pagar
 */
export async function handlePendentesCommand(
    supabase: any,
    chatId: number,
    userId: string
): Promise<void> {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. BUSCAR FATURAS DE CARTÃO (saldo negativo)
        const { data: creditCards, error: cardsError } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual, dia_vencimento')
            .eq('user_id', userId)
            .eq('tipo', 'cartao_credito')
            .eq('ativo', true)
            .lt('saldo_atual', 0);

        if (cardsError) {
            console.error('Erro ao buscar cartões:', cardsError);
        }

        // 2. BUSCAR DESPESAS PENDENTES (não de cartão)
        const { data: pendingBills, error: billsError } = await supabase
            .from('transactions')
            .select(`
                id,
                descricao,
                valor,
                data_transacao,
                conta_origem_id,
                account:accounts!transactions_conta_origem_id_fkey(id, nome, tipo)
            `)
            .eq('user_id', userId)
            .eq('tipo', 'despesa')
            .eq('efetivada', false)
            .order('data_transacao', { ascending: true })
            .limit(20);

        if (billsError) {
            console.error('Erro ao buscar pendências:', billsError);
            await sendTelegramMessage(chatId, '❌ Erro ao buscar pendências.');
            return;
        }

        // Filtrar: remover transações de cartão de crédito
        // Verificamos tanto o tipo da conta quanto se o nome contém "cartão"
        const filteredBills = pendingBills?.filter((bill: any) => {
            const accountTipo = bill.account?.tipo;
            const accountNome = bill.account?.nome?.toLowerCase() || '';
            const isCard = accountTipo === 'cartao_credito' ||
                accountTipo === 'cartao' ||  // Suporte a ambos os formatos
                accountNome.includes('cartão') ||
                accountNome.includes('cartao');

            return !isCard;
        }) || [];

        // Verificar se há algo para mostrar
        const hasInvoices = creditCards && creditCards.length > 0;
        const hasBills = filteredBills.length > 0;

        if (!hasInvoices && !hasBills) {
            await sendTelegramMessage(chatId,
                '✅ *Parabéns!*\n\n' +
                'Você não tem pendências financeiras! 🎉\n\n' +
                '_Todas as suas contas estão em dia._',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // MONTAR MENSAGEM
        let message = '📋 *Pendências Financeiras*\n\n';
        const inlineKeyboard: Array<Array<{ text: string; callback_data: string }>> = [];
        let totalPendente = 0;

        // === SEÇÃO: FATURAS DE CARTÃO ===
        if (hasInvoices) {
            message += '💳 *FATURAS DE CARTÃO*\n';

            creditCards!.forEach((card: any) => {
                const valor = Math.abs(Number(card.saldo_atual));
                totalPendente += valor;

                // Calcular data de vencimento
                let dueDate = '';
                let statusEmoji = '🔵';

                if (card.dia_vencimento) {
                    const thisMonth = new Date();
                    const dueDay = card.dia_vencimento;
                    let dueMonth = thisMonth.getMonth();
                    let dueYear = thisMonth.getFullYear();

                    // Se já passou o dia do vencimento, é do próximo mês
                    if (thisMonth.getDate() > dueDay) {
                        dueMonth++;
                        if (dueMonth > 11) {
                            dueMonth = 0;
                            dueYear++;
                        }
                    }

                    const dueDateObj = new Date(dueYear, dueMonth, dueDay);
                    dueDate = dueDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    // Status de urgência
                    const daysUntil = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysUntil < 0) statusEmoji = '⚫';
                    else if (daysUntil === 0) statusEmoji = '🔴';
                    else if (daysUntil <= 3) statusEmoji = '🟡';
                }

                message += `${statusEmoji} *${card.nome}*\n`;
                message += `   💰 ${formatCurrency(valor)}`;
                if (dueDate) message += ` • 📅 vence ${dueDate}`;
                message += '\n';

                // Botão para pagar fatura (usa o fluxo existente)
                inlineKeyboard.push([{
                    text: `💳 Pagar: ${card.nome.substring(0, 25)}`,
                    callback_data: `pay_${card.id}`
                }]);
            });

            message += '\n';
        }

        // === SEÇÃO: OUTRAS PENDÊNCIAS ===
        if (hasBills) {
            message += '📝 *OUTRAS PENDÊNCIAS*\n';

            filteredBills.forEach((bill: any) => {
                const billDate = new Date(bill.data_transacao + 'T00:00:00');
                const dateStr = billDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const valor = Number(bill.valor);
                totalPendente += valor;

                // Status de urgência
                let statusEmoji = '🔵';
                if (bill.data_transacao === todayStr) {
                    statusEmoji = '🔴';
                } else if (bill.data_transacao < todayStr) {
                    statusEmoji = '⚫';
                } else {
                    const daysUntil = Math.ceil((billDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysUntil <= 3) statusEmoji = '🟡';
                }

                message += `${statusEmoji} *${bill.descricao}*\n`;
                message += `   💰 ${formatCurrency(valor)} • 📅 ${dateStr}`;
                if (bill.account?.nome) {
                    message += ` • ${bill.account.nome}`;
                }
                message += '\n';

                // Botão para marcar como pago
                inlineKeyboard.push([{
                    text: `✅ Pagar: ${bill.descricao.substring(0, 20)}${bill.descricao.length > 20 ? '...' : ''}`,
                    callback_data: `pay_bill_${bill.id}`
                }]);
            });
        }

        // === TOTAL ===
        message += '\n━━━━━━━━━━━━━━━━\n';
        message += `💰 *Total Pendente:* ${formatCurrency(totalPendente)}\n\n`;
        message += '_Legenda:_ ⚫ Atrasada • 🔴 Hoje • 🟡 3 dias • 🔵 Futura';

        await sendTelegramMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
        });

    } catch (error) {
        console.error('Erro em handlePendentesCommand:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar pendências.');
    }
}

/**
 * Callback handler para pagar uma conta pendente
 * Chamado quando usuário clica no botão "✅ Pagar"
 */
export async function handlePayBillCallback(
    supabase: any,
    chatId: number,
    userId: string,
    transactionId: string,
    messageId?: number
): Promise<void> {
    try {
        // Buscar a transação
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select(`
                id,
                descricao,
                valor,
                conta_origem_id,
                efetivada,
                account:accounts!transactions_conta_origem_id_fkey(id, nome, saldo_atual)
            `)
            .eq('id', transactionId)
            .eq('user_id', userId)
            .single();

        if (txError || !transaction) {
            await sendTelegramMessage(chatId, '❌ Conta não encontrada ou já foi processada.');
            return;
        }

        if (transaction.efetivada) {
            await sendTelegramMessage(chatId, '⚠️ Esta conta já foi paga anteriormente.');
            return;
        }

        // Marcar como efetivada
        const { error: updateError } = await supabase
            .from('transactions')
            .update({ efetivada: true })
            .eq('id', transactionId);

        if (updateError) {
            console.error('Erro ao marcar transação como paga:', updateError);
            await sendTelegramMessage(chatId, '❌ Erro ao processar pagamento.');
            return;
        }

        // Debitar da conta (se houver conta associada)
        if (transaction.conta_origem_id && transaction.account) {
            const newBalance = Number(transaction.account.saldo_atual) - Number(transaction.valor);

            await supabase
                .from('accounts')
                .update({ saldo_atual: newBalance })
                .eq('id', transaction.conta_origem_id);
        }

        // Enviar confirmação
        const message = `✅ *Conta Paga!*\n\n` +
            `📌 *${transaction.descricao}*\n` +
            `💰 ${formatCurrency(transaction.valor)}\n` +
            `${transaction.account?.nome ? `💳 Debitado de: ${transaction.account.nome}` : ''}\n\n` +
            `_Use /pendentes para ver as pendências restantes._`;

        // Editar a mensagem original para mostrar confirmação
        if (messageId) {
            try {
                const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
                await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });
            } catch {
                await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
            }
        } else {
            await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
        }

    } catch (error) {
        console.error('Erro em handlePayBillCallback:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao processar pagamento.');
    }
}

// Alias para manter compatibilidade
export const handleContasAPagarCommand = handlePendentesCommand;
