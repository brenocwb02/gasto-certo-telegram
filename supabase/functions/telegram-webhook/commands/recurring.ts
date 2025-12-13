import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /recorrente_nova - Instruções para criar nova recorrente
 */
export async function handleRecorrenteNovaCommand(chatId: number): Promise<void> {
    const message = `🔄 *Nova Conta Recorrente*\n\nPara criar uma transação recorrente, envie uma mensagem no formato:\n\n*Exemplo:*\n"Aluguel de R$ 1.200,00 mensal no dia 5"\n"Salário de R$ 5.000,00 mensal"\n"Netflix de R$ 45,90 mensal"\n\n*Frequências disponíveis:*\n• Diária\n• Semanal\n• Mensal\n• Trimestral\n• Semestral\n• Anual\n\n*Para especificar dia:*\n• "mensal no dia 15"\n• "semanal na segunda"`;
    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /recorrentes - Lista recorrentes ativas
 */
export async function handleRecorrentesCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: recurring, error } = await supabase
            .from('recurring_transactions')
            .select(`
            *,
            category:categories(nome, cor),
            account:accounts(nome)
          `)
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('next_due_date', { ascending: true });

        if (error) throw error;

        if (!recurring || recurring.length === 0) {
            await sendTelegramMessage(chatId, '📋 *Contas Recorrentes*\n\nNenhuma transação recorrente ativa encontrada.\n\nUse /recorrente_nova para criar uma nova.');
            return;
        }

        let message = '📋 *Contas Recorrentes Ativas*\n\n';

        recurring.forEach((item: any) => {
            const emoji = item.type === 'receita' ? '💰' : '💸';
            const status = item.next_due_date <= new Date().toISOString().split('T')[0] ? '🔴' : '🟢';
            const frequency = item.frequency === 'diaria' ? 'Diária' :
                item.frequency === 'semanal' ? 'Semanal' :
                    item.frequency === 'mensal' ? 'Mensal' :
                        item.frequency === 'trimestral' ? 'Trimestral' :
                            item.frequency === 'semestral' ? 'Semestral' : 'Anual';

            message += `${emoji} *${item.title}*\n`;
            message += `   ${formatCurrency(item.amount)} - ${frequency}\n`;
            message += `   ${status} Próxima: ${new Date(item.next_due_date).toLocaleDateString('pt-BR')}\n`;
            if (item.category) message += `   📂 ${item.category.nome}\n`;
            message += '\n';
        });

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro ao buscar contas recorrentes:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar contas recorrentes.');
    }
}

/**
 * Comando /pausar_recorrente - Menu para pausar
 */
export async function handlePausarRecorrenteCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: recurring, error } = await supabase
            .from('recurring_transactions')
            .select('id, title, is_active')
            .eq('user_id', userId)
            .order('title');

        if (error) throw error;

        if (!recurring || recurring.length === 0) {
            await sendTelegramMessage(chatId, '📋 *Pausar Conta Recorrente*\n\nNenhuma transação recorrente encontrada.');
            return;
        }

        const keyboard = {
            inline_keyboard: recurring.map((item: any) => [{
                text: `${item.is_active ? '⏸️' : '▶️'} ${item.title}`,
                callback_data: `toggle_recurring_${item.id}`
            }])
        };

        await sendTelegramMessage(chatId, '📋 *Pausar/Reativar Conta Recorrente*\n\nSelecione uma transação:', {
            reply_markup: keyboard
        });
    } catch (error) {
        console.error('Erro ao buscar contas recorrentes:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar contas recorrentes.');
    }
}
