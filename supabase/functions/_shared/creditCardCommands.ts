/**
 * Módulo de Comandos de Cartão de Crédito para Telegram
 * 
 * Este arquivo contém os handlers para os comandos:
 * - /pagar - Pagar fatura de cartão
 * - /faturas - Listar faturas pendentes
 * - /config_cartao - Configurar automação
 * - /ativar_auto - Ativar pagamento automático
 * - /desativar_auto - Desativar pagamento automático
 * 
 * Para integrar ao telegram-webhook/index.ts:
 * 1. Importar este módulo
 * 2. Adicionar os handlers no switch de comandos
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Envia mensagem ao Telegram
 */
export async function sendTelegramMessage(
    chatId: number,
    text: string,
    options: any = {}
): Promise<any> {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
            ...options
        })
    });
    return response.json();
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Comando: /faturas
 * Lista todas as faturas pendentes do usuário
 */
export async function handleFaturasCommand(
    supabase: any,
    chatId: number,
    userId: string
): Promise<void> {
    try {
        // Buscar faturas pendentes
        const { data: invoices, error } = await supabase
            .rpc('get_pending_invoices', { p_user_id: userId });

        if (error) throw error;

        if (!invoices || invoices.length === 0) {
            await sendTelegramMessage(
                chatId,
                `✅ *Parabéns!*\n\n` +
                `Você não tem faturas de cartão pendentes no momento.\n\n` +
                `💡 Use /config_cartao para automatizar futuros pagamentos.`
            );
            return;
        }

        // Montar mensagem
        let message = `💳 *Suas Faturas Pendentes*\n\n`;

        for (const invoice of invoices) {
            const fatura = invoice.invoice_amount;
            const dias = invoice.days_until_due;
            const autoIcon = invoice.has_auto_payment ? '🤖' : '📲';
            const saldoIcon = invoice.has_sufficient_balance ? '✅' : '⚠️';

            message += `${autoIcon} *${invoice.account_name}*\n`;
            message += `💰 ${formatCurrency(fatura)}\n`;
            message += `📅 Vence em: ${dias} dia(s) (dia ${invoice.due_date})\n`;

            if (invoice.has_auto_payment) {
                message += `🏦 Pagar de: ${invoice.payment_account_name}\n`;
                message += `${saldoIcon} Saldo: ${invoice.has_sufficient_balance ? 'Suficiente' : 'Insuficiente'}\n`;
            }

            message += `\n`;
        }

        message += `\n📲 *Comandos Disponíveis:*\n`;
        message += `• /pagar - Pagar uma fatura\n`;
        message += `• /config_cartao - Configurar automação\n`;

        await sendTelegramMessage(chatId, message);

    } catch (error) {
        console.error('Erro em /faturas:', error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao buscar faturas.\nTente novamente ou use o aplicativo.`
        );
    }
}

/**
 * Comando: /pagar
 * Permite ao usuário selecionar e pagar uma fatura
 */
export async function handlePagarCommand(
    supabase: any,
    chatId: number,
    userId: string
): Promise<void> {
    try {
        // Buscar faturas pendentes
        const { data: invoices, error } = await supabase
            .rpc('get_pending_invoices', { p_user_id: userId });

        if (error) throw error;

        if (!invoices || invoices.length === 0) {
            await sendTelegramMessage(
                chatId,
                `✅ Você não tem faturas pendentes para pagar!`
            );
            return;
        }

        // Criar botões inline para cada fatura
        const buttons = invoices.map((invoice: any) => [{
            text: `${invoice.account_name} - ${formatCurrency(invoice.invoice_amount)}`,
            callback_data: `pay_${invoice.account_id}`
        }]);

        buttons.push([{
            text: '❌ Cancelar',
            callback_data: 'pay_cancel'
        }]);

        await sendTelegramMessage(
            chatId,
            `💳 *Selecione qual fatura pagar:*\n\n` +
            `Suas faturas pendentes estão listadas abaixo.\n` +
            `Clique em uma para confirmar o pagamento.`,
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
            `❌ Erro ao listar faturas.\nTente novamente.`
        );
    }
}

/**
 * Callback: Processar pagamento selecionado
 * Chamado quando usuário clica em um botão de pagamento
 */
export async function handlePaymentCallback(
    supabase: any,
    chatId: number,
    userId: string,
    accountId: string
): Promise<void> {
    try {
        // Enviar mensagem de processamento
        const processingMsg = await sendTelegramMessage(
            chatId,
            `⏳ Processando pagamento...`
        );

        // Buscar informações do cartão
        const { data: card } = await supabase
            .from('accounts')
            .select(`
        id,
        nome,
        saldo_atual,
        credit_card_settings!credit_card_settings_account_id_fkey!inner(default_payment_account_id)
      `)
            .eq('id', accountId)
            .single();

        const settings = Array.isArray(card.credit_card_settings) ? card.credit_card_settings[0] : card.credit_card_settings;

        if (!card || !settings?.default_payment_account_id) {
            await sendTelegramMessage(
                chatId,
                `❌ *Erro*\n\nConta de pagamento não configurada.\n` +
                `Use /config_cartao para configurar.`
            );
            return;
        }

        const fatura = Math.abs(card.saldo_atual);
        const paymentAccountId = settings.default_payment_account_id;

        // Processar pagamento via RPC
        const { data: result, error } = await supabase
            .rpc('process_invoice_payment', {
                p_card_account_id: accountId,
                p_payment_account_id: paymentAccountId,
                p_amount: null // Pagar fatura completa
            });

        if (error) throw error;

        if (result.success) {
            // Sucesso
            await sendTelegramMessage(
                chatId,
                `✅ *Pagamento Realizado!*\n\n` +
                `💳 ${card.nome}\n` +
                `💰 Valor: ${formatCurrency(result.amount_paid)}\n` +
                `🏦 De: ${result.payment_account_name}\n\n` +
                `📊 *Novo Saldo*\n` +
                `• ${result.payment_account_name}: ${formatCurrency(result.new_payment_balance)}\n` +
                `• ${card.nome}: ${formatCurrency(result.new_card_balance)}\n\n` +
                `✓ Pagamento concluído com sucesso!`
            );
        } else {
            // Falha - saldo insuficiente
            await sendTelegramMessage(
                chatId,
                `⚠️ *Saldo Insuficiente*\n\n` +
                `💰 Fatura: ${formatCurrency(result.required)}\n` +
                `🏦 Disponível: ${formatCurrency(result.available)}\n` +
                `❌ Faltam: ${formatCurrency(result.missing)}\n\n` +
                `Por favor, adicione saldo em ${result.payment_account_name} e tente novamente.`
            );
        }

    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao processar pagamento.\n\nDetalhe técnico: ${errorMsg}`
        );
    }
}

/**
 * Comando: /config_cartao
 * Mostra interface de configuração de automação
 */
export async function handleConfigCartaoCommand(
    supabase: any,
    chatId: number,
    userId: string
): Promise<void> {
    try {
        // Buscar cartões do usuário
        const { data: cards, error } = await supabase
            .from('accounts')
            .select(`
        id,
        nome,
        dia_vencimento,
        credit_card_settings!credit_card_settings_account_id_fkey(
          auto_payment,
          default_payment_account_id,
          send_reminder,
          reminder_days_before
        )
      `)
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
        const buttons = cards.map(card => [{
            text: `⚙️ ${card.nome}`,
            callback_data: `config_${card.id}`
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
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        await sendTelegramMessage(
            chatId,
            `❌ Erro ao carregar configurações.\n\nDetalhe técnico: ${errorMsg}`
        );
    }
}

/**
 * Callback: Mostrar configurações de um cartão específico
 */
export async function handleCardConfigCallback(
    supabase: any,
    chatId: number,
    userId: string,
    accountId: string
): Promise<void> {
    try {
        // Buscar informações do cartão
        const { data: card } = await supabase
            .from('accounts')
            .select(`
        id,
        nome,
        dia_vencimento,
        credit_card_settings!credit_card_settings_account_id_fkey!inner(
          auto_payment,
          default_payment_account_id,
          send_reminder,
          reminder_days_before,
          payment_account:accounts!credit_card_settings_default_payment_account_id_fkey(nome)
        )
      `)
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (!card) {
            await sendTelegramMessage(chatId, `❌ Cartão não encontrado.`);
            return;
        }

        const settings = Array.isArray(card.credit_card_settings) ? card.credit_card_settings[0] : card.credit_card_settings;
        const autoIcon = settings.auto_payment ? '✅' : '❌';
        const reminderIcon = settings.send_reminder ? '🔔' : '🔕';

        let message = `⚙️ *Configurações: ${card.nome}*\n\n`;
        message += `📅 Vencimento: Dia ${card.dia_vencimento}\n\n`;
        message += `*Status Atual:*\n`;
        message += `${autoIcon} Pagamento Automático: ${settings.auto_payment ? 'ATIVADO' : 'DESATIVADO'}\n`;

        if (settings.auto_payment) {
            message += `🏦 Pagar de: ${settings.payment_account?.nome || 'Não configurada'}\n`;
        }

        message += `${reminderIcon} Lembretes: ${settings.send_reminder ? 'ATIVADOS' : 'DESATIVADOS'}\n`;

        if (settings.send_reminder) {
            message += `⏰ Avisar: ${settings.reminder_days_before} dias antes\n`;
        }

        // Botões de ação
        const buttons = [];

        if (settings.auto_payment) {
            buttons.push([{
                text: '🔴 Desativar Automático',
                callback_data: `auto_off_${accountId}`
            }]);
        } else {
            buttons.push([{
                text: '🟢 Ativar Automático',
                callback_data: `auto_on_${accountId}`
            }]);
        }

        buttons.push([{
            text: '🔙 Voltar',
            callback_data: 'config_back'
        }]);

        await sendTelegramMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });

    } catch (error) {
        console.error('Erro ao mostrar config:', error);
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        await sendTelegramMessage(chatId, `❌ Erro ao carregar configurações.\n\nDetalhe técnico: ${errorMsg}`);
    }
}

/**
 * Callback: Ativar pagamento automático
 */
export async function handleActivateAutoPayment(
    supabase: any,
    chatId: number,
    userId: string,
    accountId: string
): Promise<void> {
    try {
        // Atualizar configuração
        const { error } = await supabase
            .from('credit_card_settings')
            .update({ auto_payment: true })
            .eq('account_id', accountId)
            .eq('user_id', userId);

        if (error) throw error;

        await sendTelegramMessage(
            chatId,
            `✅ *Pagamento Automático Ativado!*\n\n` +
            `A partir de agora, a fatura deste cartão será paga automaticamente no vencimento.\n\n` +
            `⚠️ *Importante:* Certifique-se de ter saldo suficiente na conta de pagamento.\n\n` +
            `Você receberá lembretes 3 dias antes do vencimento.`
        );

    } catch (error) {
        console.error('Erro ao ativar auto payment:', error);
        await sendTelegramMessage(chatId, `❌ Erro ao ativar pagamento automático.`);
    }
}

/**
 * Callback: Desativar pagamento automático
 */
export async function handleDeactivateAutoPayment(
    supabase: any,
    chatId: number,
    userId: string,
    accountId: string
): Promise<void> {
    try {
        // Atualizar configuração
        const { error } = await supabase
            .from('credit_card_settings')
            .update({ auto_payment: false })
            .eq('account_id', accountId)
            .eq('user_id', userId);

        if (error) throw error;

        await sendTelegramMessage(
            chatId,
            `🔴 *Pagamento Automático Desativado*\n\n` +
            `Você voltará a receber apenas lembretes de vencimento.\n\n` +
            `Use /pagar para pagar manualmente quando quiser.`
        );

    } catch (error) {
        console.error('Erro ao desativar auto payment:', error);
        await sendTelegramMessage(chatId, `❌ Erro ao desativar pagamento automático.`);
    }
}
