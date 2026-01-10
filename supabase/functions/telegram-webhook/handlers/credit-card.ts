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
            .select('id, nome, saldo_atual, dia_fechamento, dia_vencimento, parent_account_id')
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

        // Organizar Família de Cartões
        const parents = cards.filter((c: any) => !c.parent_account_id);
        const children = cards.filter((c: any) => c.parent_account_id);

        for (const parent of parents) {
            // Encontrar filhos deste pai
            const myChildren = children.filter((c: any) => c.parent_account_id === parent.id);

            // Calcular total consolidado (Lembrando: saldo negativo = dívida)
            let totalBalance = parent.saldo_atual || 0;
            myChildren.forEach((child: any) => totalBalance += (child.saldo_atual || 0));

            const fatura = Math.abs(totalBalance);
            const status = totalBalance < 0 ? '🔴' : '🟢';

            message += `${status} *${parent.nome}* (Total)\n`;
            message += `   Valor: ${formatCurrency(fatura)}\n`;
            message += `   Vencimento: dia ${parent.dia_vencimento || 'N/A'}\n`;

            // Detalhar composição se tiver filhos ou se o pai tiver gasto
            if (myChildren.length > 0) {
                // Mostrar o gasto do titular
                if (parent.saldo_atual !== 0) {
                    message += `   ├─ 👤 Titular: ${formatCurrency(Math.abs(parent.saldo_atual))}\n`;
                }

                // Mostrar gastos dos dependentes
                myChildren.forEach((child: any) => {
                    const childBalance = Math.abs(child.saldo_atual || 0);
                    if (childBalance > 0) {
                        message += `   └─ 👤 ${child.nome}: ${formatCurrency(childBalance)}\n`;
                    }
                });
            }
            message += `\n`;
        }

        message += `\n💡 Use /pagar para pagar uma fatura consolidada.`;

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
 * Comando /projecao - Mostra projeção de faturas para os próximos 6 meses
 */
export async function handleProjecaoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        // 1. Buscar cartões do usuário (somente pais)
        const { data: cards, error: cardsError } = await supabase
            .from('accounts')
            .select('id, nome, dia_vencimento, parent_account_id')
            .eq('user_id', userId)
            .eq('tipo', 'cartao')
            .eq('ativo', true)
            .is('parent_account_id', null); // Apenas cartões pais

        if (cardsError) throw cardsError;

        if (!cards || cards.length === 0) {
            await sendTelegramMessage(
                chatId,
                `📅 *Projeção de Faturas*\n\nVocê não tem cartões de crédito cadastrados.`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // 2. Gerar lista de meses para projeção (próximos 6 meses)
        const months: { start: Date; end: Date; label: string }[] = [];
        const now = new Date();

        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            months.push({
                start: new Date(date.getFullYear(), date.getMonth(), 1),
                end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
                label: `${monthNames[date.getMonth()]}/${String(date.getFullYear()).slice(-2)}`
            });
        }

        let fullMessage = '';

        // 3. Para cada cartão, buscar projeção
        for (const card of cards) {
            // Buscar IDs dos cartões filhos (adicionais)
            const { data: childCards } = await supabase
                .from('accounts')
                .select('id')
                .eq('parent_account_id', card.id);

            const allCardIds = [card.id, ...(childCards?.map((c: any) => c.id) || [])];

            let cardMessage = `💳 *${card.nome}* (venc. dia ${card.dia_vencimento || '?'})\n\n`;
            let hasData = false;

            for (let j = 0; j < months.length; j++) {
                const month = months[j];

                // Buscar transações deste mês para este cartão (despesas)
                const { data: transactions, error: txError } = await supabase
                    .from('transactions')
                    .select('valor, total_parcelas')
                    .in('conta_origem_id', allCardIds)
                    .eq('tipo', 'despesa')
                    .gte('data_transacao', month.start.toISOString().split('T')[0])
                    .lte('data_transacao', month.end.toISOString().split('T')[0]);

                if (txError) {
                    console.error('Erro ao buscar transações:', txError);
                    continue;
                }

                const total = transactions?.reduce((sum: number, t: any) => sum + Math.abs(t.valor || 0), 0) || 0;
                const parcelaCount = transactions?.filter((t: any) => t.total_parcelas && t.total_parcelas > 1).length || 0;

                if (total > 0) {
                    hasData = true;
                    const isCurrentMonth = j === 0;
                    const marker = isCurrentMonth ? '✅' : '';
                    const parcelaText = parcelaCount > 0 ? ` (${parcelaCount} ${parcelaCount === 1 ? 'parcela' : 'parcelas'})` : '';

                    cardMessage += `${month.label}:  ${formatCurrency(total)} ${marker}${parcelaText}\n`;
                }
            }

            if (!hasData) {
                cardMessage += `_Sem transações futuras previstas_\n`;
            }

            fullMessage += cardMessage + `\n`;
        }

        if (!fullMessage.trim()) {
            fullMessage = `📅 *Projeção de Faturas*\n\n_Nenhuma fatura futura encontrada._`;
        } else {
            fullMessage = `📅 *Projeção de Faturas*\n\n` + fullMessage;
            fullMessage += `\n💡 Use /faturas para detalhes do mês atual.`;
        }

        await sendTelegramMessage(chatId, fullMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Erro em /projecao:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao calcular projeção. Tente novamente.`
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
            .select('id, nome, saldo_atual, dia_vencimento, parent_account_id')
            .eq('user_id', userId)
            .eq('tipo', 'cartao')
            .eq('ativo', true);

        if (error) throw error;

        if (!cards || cards.length === 0) {
            await sendTelegramMessage(
                chatId,
                `✅ *Nenhuma fatura pendente!*\n\nTodos os seus cartões estão com saldo em dia.`
            );
            return;
        }

        // Organizar Família de Cartões para Pagamento
        const parents = cards.filter((c: any) => !c.parent_account_id);
        const children = cards.filter((c: any) => c.parent_account_id);

        const activeInvoices = [];

        for (const parent of parents) {
            const myChildren = children.filter((c: any) => c.parent_account_id === parent.id);
            let totalBalance = parent.saldo_atual || 0;
            myChildren.forEach((child: any) => totalBalance += (child.saldo_atual || 0));

            // Só mostrar se tiver dívida (saldo negativo)
            if (totalBalance < 0) {
                activeInvoices.push({
                    ...parent,
                    saldo_consolidado: totalBalance,
                    tem_dependentes: myChildren.length > 0
                });
            }
        }

        if (activeInvoices.length === 0) {
            await sendTelegramMessage(
                chatId,
                `✅ *Nenhuma fatura pendente!*\n\nTodos os seus cartões (e adicionais) estão em dia.`
            );
            return;
        }

        // Criar botões para cada cartão PAI com fatura consolidada
        const buttons = activeInvoices.map((card: any) => [{
            text: `💳 ${card.nome} - ${formatCurrency(Math.abs(card.saldo_consolidado))}`,
            callback_data: `pay_${card.id}`
        }]);

        buttons.push([{
            text: '❌ Cancelar',
            callback_data: 'pay_cancel'
        }]);

        await sendTelegramMessage(
            chatId,
            `💳 *Pagar Fatura Consolidada*\n\nSelecione o cartão que deseja pagar (inclui adicionais):`,
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

        // 💾 Salvar contexto do cartão selecionado na sessão

        await supabase.from('telegram_sessions').upsert({
            telegram_id: chatId.toString(),
            chat_id: chatId, // Coluna obrigatória adicionada!
            user_id: userId,
            contexto: {
                action: 'payment_flow',
                payment_card_id: cardId
            },
            updated_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' });

        const fatura = Math.abs(card.saldo_atual || 0);

        // Criar botões para cada conta disponível
        // Callback curto: pay_acc_{accountId}
        const buttons = accounts.map((account: any) => [{
            text: `${account.nome} (${formatCurrency(account.saldo_atual)})`,
            callback_data: `pay_acc_${account.id}`
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
        // 1. Buscar Cartão Pai
        const { data: card } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        // 2. Buscar Cartões Filhos (Adicionais)
        const { data: children } = await supabase
            .from('accounts')
            .select('id, nome, saldo_atual')
            .eq('parent_account_id', cardId)
            .eq('user_id', userId);

        // 3. Buscar Conta de Pagamento (Origem)
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

        // 4. Calcular Total Consolidado
        let totalFatura = Math.abs(card.saldo_atual || 0); // Começa com o pai
        let breakdownMsg = `   - ${card.nome}: ${formatCurrency(totalFatura)}\n`;

        if (children && children.length > 0) {
            children.forEach((child: any) => {
                const childDebt = Math.abs(child.saldo_atual || 0);
                totalFatura += childDebt;
                breakdownMsg += `   - ${child.nome}: ${formatCurrency(childDebt)}\n`;
            });
        }

        // 5. Verificar saldo suficiente na conta origem
        if (account.saldo_atual < totalFatura) {
            await sendTelegramMessage(
                chatId,
                `❌ *Saldo insuficiente*\n\n` +
                `Fatura Total: ${formatCurrency(totalFatura)}\n` +
                `Saldo em ${account.nome}: ${formatCurrency(account.saldo_atual)}\n` +
                `Faltam: ${formatCurrency(totalFatura - account.saldo_atual)}`
            );
            return;
        }

        // 6. Executar Pagamentos (Sequencial para simplificar sem RPC complexo)
        // A. Debitar Conta Origem (Total)
        await supabase.from('accounts').update({
            saldo_atual: account.saldo_atual - totalFatura
        }).eq('id', accountId);

        // B. Zerar Cartão Pai
        // Nota: saldo_atual de cartão é negativo qdo deve. Ao pagar, somamos o valor positivo.
        // Se saldo era -100 e pagamos 100, vira 0.
        // Como 'totalFatura' é a soma absoluta de todos, precisamos "injetar" dinheiro em cada cartão separadamente.

        // Pagar Pai
        const dividaPai = Math.abs(card.saldo_atual || 0);
        await supabase.from('accounts').update({
            saldo_atual: (card.saldo_atual || 0) + dividaPai
        }).eq('id', card.id);

        // C. Zerar Cartões Filhos
        if (children && children.length > 0) {
            for (const child of children) {
                const dividaFilho = Math.abs(child.saldo_atual || 0);
                if (dividaFilho > 0) {
                    await supabase.from('accounts').update({
                        saldo_atual: (child.saldo_atual || 0) + dividaFilho
                    }).eq('id', child.id);
                }
            }
        }

        // 7. Mensagem de Sucesso
        await sendTelegramMessage(
            chatId,
            `✅ *Fatura Paga com Sucesso!*\n\n` +
            `💸 **Valor Total:** ${formatCurrency(totalFatura)}\n` +
            `🏦 **Saiu de:** ${account.nome}\n\n` +
            `**Cartões Quitados:**\n` +
            breakdownMsg +
            `\n📊 Novo saldo ${account.nome}: ${formatCurrency(account.saldo_atual - totalFatura)}`
        );

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
