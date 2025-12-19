
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';
import { getRandomSuccessMessage, getCategoryComment, getEmojiForCategory } from '../_shared/ux-helpers.ts';
import { processCelebrations } from '../_shared/sticker-helper.ts';
import { handleCommand } from '../commands/router.ts';
import { handleMenuCallback } from '../commands/admin.ts';
import { confirmInvoicePayment, handlePaymentCardSelection, handleCardConfigCallback, toggleCardAutoPayment, toggleCardReminder } from './credit-card.ts';
import { getUserTelegramContext, setUserTelegramContext } from '../utils/context.ts';
import { handleConfigCartaoCommand } from './credit-card.ts';
import { handleSelectAccountCallback, handleConfirmTransactionCallback } from './transaction-callbacks.ts';

/**
 * Handle all callback queries from inline keyboards
 */
export async function handleCallbackQuery(supabase: any, body: any): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    const callbackQuery = body.callback_query;
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    console.log(`[Callback] Recebido callback_data: "${data}"`);

    // Buscar perfil do usuário pelo telegram_chat_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .single();

    if (!profile) {
        return new Response('OK', { status: 200, headers: corsHeaders });
    }
    const userId = profile.user_id;

    // ============================================================================
    // HANDLERS DE MENU INTERATIVO
    // ============================================================================

    // Navegação entre menus
    if (data.startsWith('menu_')) {
        const menuType = data.replace('menu_', '');
        console.log(`[Menu Handler] Navegando para menu: ${menuType}`);
        await handleMenuCallback(chatId, messageId, menuType);
        await answerCallbackQuery(callbackQuery.id);
        console.log(`[Menu Handler] Menu ${menuType} exibido com sucesso`);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Ações diretas (executar comandos via botões)
    if (data.startsWith('action_')) {
        const action = data.replace('action_', '');
        console.log(`[Action Handler] Recebido action: ${action}`);

        // Mapa de ações para comandos
        const commandMap: Record<string, string> = {
            'faturas': '/faturas',
            'pagar': '/pagar',
            'config_cartao': '/config_cartao',
            'saldo': '/saldo',
            'resumo': '/resumo',
            'extrato': '/extrato',
            'top_gastos': '/top_gastos',
            'metas': '/metas',
            'recorrentes': '/recorrentes',
            'orcamento': '/orcamento',
            'dividas': '/dividas',
            'contexto': '/contexto',
            'editar_ultima': '/editar_ultima',
            'categorias': '/categorias'
        };

        const command = commandMap[action];
        console.log(`[Action Handler] Mapeado para comando: ${command}`);

        if (command) {
            // Responder callback primeiro
            console.log(`[Action Handler] Executando comando: ${command}`);
            await answerCallbackQuery(callbackQuery.id, { text: `Executando ${command}...` });

            // Executar comando
            await handleCommand(supabase, command, userId, chatId);
            console.log(`[Action Handler] Comando ${command} executado com sucesso`);
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        } else {
            console.log(`[Action Handler] ⚠️ Ação '${action}' não encontrada no commandMap`);
        }
    }

    // Cancelar configuração
    if (data === 'config_cancel') {
        await editTelegramMessage(chatId, messageId, '❌ Configuração cancelada.');
        await answerCallbackQuery(callbackQuery.id);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Toggle pagamento automático
    if (data.startsWith('toggle_autopay_')) {
        const cardId = data.replace('toggle_autopay_', '');
        console.log(`[Toggle AutoPay] Toggling autopay para cartão: ${cardId}`);

        const { data: card } = await supabase
            .from('accounts')
            .select('nome, auto_pagamento_ativo')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        if (!card) {
            await answerCallbackQuery(callbackQuery.id, { text: 'Cartão não encontrado' });
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        const novoStatus = !card.auto_pagamento_ativo;

        await supabase
            .from('accounts')
            .update({ auto_pagamento_ativo: novoStatus })
            .eq('id', cardId);

        await answerCallbackQuery(callbackQuery.id, {
            text: novoStatus ? '✅ Pagamento automático ativado!' : '❌ Pagamento automático desativado!'
        });

        // Retornar à tela de configuração atualizada
        await answerCallbackQuery(callbackQuery.id);

        // Simular callback de volta à tela de config
        const updatedCard = await supabase
            .from('accounts')
            .select('nome, auto_pagamento_ativo, dia_vencimento')
            .eq('id', cardId)
            .single();

        const autoPagAtivo = updatedCard.data?.auto_pagamento_ativo || false;
        const diaVencimento = updatedCard.data?.dia_vencimento || 'não configurado';

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: autoPagAtivo ? '✅ Pagamento Automático: ATIVO' : '❌ Pagamento Automático: INATIVO',
                        callback_data: `toggle_autopay_${cardId}`
                    }
                ],

                [
                    { text: '◀️ Voltar', callback_data: 'menu_invoices' }
                ]
            ]
        };

        await editTelegramMessage(
            chatId,
            messageId,
            `⚙️ *Configurações - ${updatedCard.data?.nome}*\n\n` +
            `Gerencie as automações deste cartão:\n\n` +
            `💳 *Pagamento Automático:*\n` +
            `   ${autoPagAtivo ? '✅ Ativado' : '❌ Desativado'}\n\n` +
            `🔔 *Dia de Vencimento:*\n` +
            ` Dia ${diaVencimento}\n\n` +
            `⚡ Clique no botão para ativar/desativar`,
            {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            }
        );

        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Configurar lembrete
    if (data.startsWith('set_reminder_')) {
        const cardId = data.replace('set_reminder_', '');
        console.log(`[Set Reminder] Configurando lembrete para cartão: ${cardId}`);

        await editTelegramMessage(
            chatId,
            messageId,
            `🔔 *Configurar Lembrete*\n\n` +
            `Digite o dia do mês (1-31) em que deseja receber o lembrete de vencimento:\n\n` +
            `Exemplo: \`5\` (para ser lembrado dia 5 de cada mês)\n\n` +
            `Ou envie \`cancelar\` para voltar.`
        );

        // Salvar contexto na sessão
        await supabase
            .from('telegram_sessions')
            .upsert({
                user_id: userId,
                telegram_id: callbackQuery.from.id.toString(),
                contexto: {
                    awaiting_reminder_day: true,
                    card_id: cardId
                }
            });

        await answerCallbackQuery(callbackQuery.id);
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }


    // Ações de edição de transação
    if (data.startsWith('edit_')) {
        const { data: session } = await supabase
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
            await supabase
                .from('telegram_sessions')
                .update({ contexto: {} })
                .eq('user_id', userId);
            await editTelegramMessage(chatId, messageId, '✅ Edição cancelada.');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (data === 'edit_delete') {
            await supabase.from('transactions').delete().eq('id', transactionId);
            await supabase.from('telegram_sessions').update({ contexto: {} }).eq('user_id', userId);
            await editTelegramMessage(chatId, messageId, '🗑️ Transação deletada com sucesso!');
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        // Salvar campo a editar
        await supabase
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
            const { data: recurring, error: fetchError } = await supabase
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
            const { error: updateError } = await supabase
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

    // Callbacks de contexto (Modelo 5 Híbrido)
    if (data === 'context_personal') {
        await setUserTelegramContext(supabase, userId, 'personal');
        await editTelegramMessage(chatId, messageId,
            '✅ Contexto alterado para 👤 Pessoal\n\nSuas próximas transações serão pessoais (75/mês para free).'
        );
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data === 'context_group') {
        await setUserTelegramContext(supabase, userId, 'group');
        const context = await getUserTelegramContext(supabase, userId);
        await editTelegramMessage(chatId, messageId,
            `✅ Contexto alterado para 🏠 ${context.groupName}\n\nSuas próximas transações serão compartilhadas (ILIMITADAS).`
        );
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data === 'context_cancel') {
        await editTelegramMessage(chatId, messageId, '❌ Operação cancelada.');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data === 'context_no_group') {
        await editTelegramMessage(chatId, messageId,
            '⚠️ Você não está em nenhum grupo.\n\n' +
            'Para criar ou entrar em um grupo familiar, acesse:\n' +
            '🔗 https://app.boascontas.com/familia'
        );
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data === 'config_context') {
        // Redirecionar para o comando /contexto
        const context = await getUserTelegramContext(supabase, userId);

        const message = `📌 *Escolha o contexto padrão*\n\n` +
            `Onde suas próximas transações serão registradas?\n\n` +
            `*Contexto atual:* ${context.defaultContext === 'personal' ? '👤 Pessoal' : '🏠 ' + (context.groupName || 'Grupo')}\n\n` +
            `${context.groupId ? '🏠 *Grupo:* Transações compartilhadas (ILIMITADAS)\n' : ''}` +
            `👤 *Pessoal:* Apenas você vê (75/mês para free)`;

        const keyboard: any = {
            inline_keyboard: [
                [{ text: context.defaultContext === 'personal' ? '✅ 👤 Pessoal' : '👤 Pessoal', callback_data: 'context_personal' }]
            ]
        };

        if (context.groupId) {
            keyboard.inline_keyboard.push([
                { text: context.defaultContext === 'group' ? `✅ 🏠 ${context.groupName}` : `🏠 ${context.groupName}`, callback_data: 'context_group' }
            ]);
        } else {
            keyboard.inline_keyboard.push([
                { text: '⚠️ Você não está em nenhum grupo', callback_data: 'context_no_group' }
            ]);
        }

        keyboard.inline_keyboard.push([{ text: '❌ Cancelar', callback_data: 'context_cancel' }]);

        await editTelegramMessage(chatId, messageId, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data === 'config_close') {
        await editTelegramMessage(chatId, messageId, '⚙️ Configurações fechadas.');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // --- Callbacks de Cartão de Crédito ---
    if (data.startsWith('pay_')) {
        const payload = data.replace('pay_', '');

        if (payload === 'cancel') {
            await editTelegramMessage(chatId, messageId, '❌ Pagamento cancelado.');
        }
        else if (payload.startsWith('acc_')) {
            // 🆕 Handler para confirmação de pagamento usando sessão
            const accountId = payload.replace('acc_', '');

            // Recuperar cardId da sessão
            // Tentar buscar tanto como string quanto number para garantir
            const { data: session } = await supabase
                .from('telegram_sessions')
                .select('contexto')
                .or(`telegram_id.eq.${chatId},telegram_id.eq.${chatId.toString()}`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (session?.contexto?.payment_card_id) {
                const cardId = session.contexto.payment_card_id;
                await confirmInvoicePayment(supabase, chatId, userId, cardId, accountId);
            } else {
                await editTelegramMessage(chatId, messageId, '❌ Sessão expirada. Por favor, inicie o pagamento novamente.');
            }
        }
        else {
            // Seleção inicial de cartão (payload é o cardId)
            await handlePaymentCardSelection(supabase, chatId, userId, payload);
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data.startsWith('config_')) {
        // Extrair ID do callback_data
        let cardId = null;
        if (data.startsWith('config_card_')) {
            cardId = data.replace('config_card_', '');
        } else {
            if (data !== 'config_cancel' && data !== 'config_back') {
                cardId = data.replace('config_', '');
            }
        }

        if (data === 'config_cancel') {
            await editTelegramMessage(chatId, messageId, '❌ Operação cancelada.');
        } else if (data === 'config_back') {
            await handleConfigCartaoCommand(supabase, chatId, userId);
        } else {
            if (cardId) {
                await handleCardConfigCallback(supabase, chatId, userId, cardId);
            }
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data.startsWith('auto_on_')) {
        const accountId = data.replace('auto_on_', '');
        try {
            await toggleCardAutoPayment(supabase, chatId, userId, accountId);
        } catch (e) {
            console.error("Erro ao ativar auto pagamento:", e);
            await editTelegramMessage(chatId, messageId, '⚠️ Funcionalidade indisponível no momento.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data.startsWith('auto_off_')) {
        const accountId = data.replace('auto_off_', '');
        try {
            await toggleCardAutoPayment(supabase, chatId, userId, accountId);
        } catch (e) {
            console.error("Erro ao desativar auto pagamento:", e);
            await editTelegramMessage(chatId, messageId, '⚠️ Funcionalidade indisponível no momento.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }
    // --- Fim Callbacks Cartão ---

    // --- Callbacks do Parser de Transações ---
    if (data.startsWith('select_account_')) {
        await handleSelectAccountCallback(supabase, chatId, userId, messageId, data, callbackQuery.from.id.toString());
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    if (data === 'cancel_transaction_parse') {
        // Limpar sessão pendente
        await supabase
            .from('telegram_sessions')
            .update({ contexto: {}, status: 'cancelado' })
            .eq('user_id', userId);

        await editTelegramMessage(chatId, messageId, '❌ Transação cancelada.');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Ações de confirmação de transações (sistema antigo e novo)
    if (data.includes(':')) {
        const [action, sessionId] = data.split(':');
        if (action === 'confirm_transaction' || action === 'cancel_transaction') {
            try {
                await handleConfirmTransactionCallback(supabase, chatId, userId, messageId, action, sessionId);
            } catch (error: any) {
                console.error(`Erro ao processar callback ${action}:`, error);
                const errorMsg = error.message || 'Erro desconhecido';
                await editTelegramMessage(chatId, messageId, `❌ Erro ao confirmar: ${errorMsg}`);
            }
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }
    }
    // Callback para confirmar pagamento (confirm_pay_cardId_accountId)
    if (data.startsWith('confirm_pay_')) {
        const parts = data.replace('confirm_pay_', '').split('_');
        const cardId = parts[0];
        const accountId = parts[1];
        try {
            await confirmInvoicePayment(supabase, chatId, userId, cardId, accountId);
        } catch (e) {
            console.error("Erro ao confirmar pagamento:", e);
            await editTelegramMessage(chatId, messageId, '❌ Erro ao processar pagamento.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Callback para abrir configurações de cartão específico
    if (data.startsWith('config_card_')) {
        const cardId = data.replace('config_card_', '');
        try {
            await handleCardConfigCallback(supabase, chatId, userId, cardId);
        } catch (e) {
            console.error("Erro ao abrir config de cartão:", e);
            await editTelegramMessage(chatId, messageId, '❌ Erro ao carregar configurações.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Callback para toggle pagamento automático
    if (data.startsWith('toggle_auto_')) {
        const cardId = data.replace('toggle_auto_', '');
        try {
            await toggleCardAutoPayment(supabase, chatId, userId, cardId);
        } catch (e) {
            console.error("Erro ao toggle auto payment:", e);
            await editTelegramMessage(chatId, messageId, '❌ Erro ao alterar configuração.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Callback para toggle lembrete
    if (data.startsWith('toggle_reminder_')) {
        const cardId = data.replace('toggle_reminder_', '');
        try {
            await toggleCardReminder(supabase, chatId, userId, cardId);
        } catch (e) {
            console.error("Erro ao toggle reminder:", e);
            await editTelegramMessage(chatId, messageId, '❌ Erro ao alterar configuração.');
        }
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
}
