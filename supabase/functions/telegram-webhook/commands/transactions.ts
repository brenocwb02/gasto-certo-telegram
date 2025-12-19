import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /editar_ultima - Edita a última transação registrada
 */
export async function handleEditarUltimaCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    const { data: lastTransaction } = await supabase
        .from('transactions')
        .select(`
        *,
        category:categories(nome),
        account:accounts!transactions_conta_origem_id_fkey(nome)
      `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!lastTransaction) {
        await sendTelegramMessage(chatId, '📭 Você ainda não tem transações para editar.');
        return;
    }

    // Salvar ID da transação na sessão
    await supabase
        .from('telegram_sessions')
        .upsert({
            user_id: userId,
            telegram_id: chatId.toString(),
            chat_id: chatId.toString(),
            contexto: { editing_transaction_id: lastTransaction.id }
        }, { onConflict: 'user_id,telegram_id' });

    const date = new Date(lastTransaction.data_transacao).toLocaleDateString('pt-BR');
    const message = `✏️ *Editar Transação*\n\n📝 ${lastTransaction.descricao}\n💰 ${formatCurrency(parseFloat(lastTransaction.valor))}\n📁 ${lastTransaction.category?.nome || 'Sem categoria'}\n🏦 ${lastTransaction.account?.nome || 'Sem conta'}\n📅 ${date}\n\nO que deseja editar?`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✏️ Descrição', callback_data: 'edit_description' },
                { text: '💰 Valor', callback_data: 'edit_amount' }
            ],
            [
                { text: '📁 Categoria', callback_data: 'edit_category' },
                { text: '🏦 Conta', callback_data: 'edit_account' }
            ],
            [
                { text: '📅 Data', callback_data: 'edit_date' },
                { text: '🗑️ Deletar', callback_data: 'edit_delete' }
            ],
            [
                { text: '❌ Cancelar', callback_data: 'edit_cancel' }
            ]
        ]
    };

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

/**
 * Comando /desfazer - Remove a última transação criada
 */
export async function handleDesfazerCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    // 1. Buscar última transação
    const { data: lastTransaction } = await supabase
        .from('transactions')
        .select(`
        *,
        category:categories(nome),
        account:accounts!transactions_conta_origem_id_fkey(nome)
      `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!lastTransaction) {
        await sendTelegramMessage(chatId, '📭 Nenhuma transação recente para desfazer.');
        return;
    }

    // 2. Apagar transação
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', lastTransaction.id);

    if (error) {
        console.error('Erro ao deletar transação:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao desfazer transação.');
        return;
    }

    // 3. Confirmar para o usuário
    const date = new Date(lastTransaction.data_transacao).toLocaleDateString('pt-BR');
    const message = `🗑️ *Transação Desfeita!*\n\n` +
        `Apaguei: ${lastTransaction.descricao}\n` +
        `Valor: ${formatCurrency(parseFloat(lastTransaction.valor))}\n` +
        `Conta: ${lastTransaction.account?.nome || '?'}`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}
