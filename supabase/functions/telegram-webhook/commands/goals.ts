/**
 * Goals Commands - Comandos de metas financeiras
 * /metas
 */

import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /metas - Mostra metas ativas do usuário
 */
export async function handleMetasCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    const { data: goals } = await supabase
        .from('goals')
        .select('titulo, valor_meta, valor_atual, data_fim')
        .eq('user_id', userId)
        .eq('status', 'ativa');

    if (!goals || goals.length === 0) {
        await sendTelegramMessage(chatId, '🎯 Você ainda não tem metas ativas.');
        return;
    }

    const list = goals.map((g: any) => {
        const progress = (parseFloat(g.valor_atual) / parseFloat(g.valor_meta)) * 100;
        const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
        return `🎯 *${g.titulo}*\n${progressBar} ${progress.toFixed(0)}%\n${formatCurrency(parseFloat(g.valor_atual))} / ${formatCurrency(parseFloat(g.valor_meta))}`;
    }).join('\n\n');

    await sendTelegramMessage(chatId, `🎯 *Suas Metas*\n\n${list}`, { parse_mode: 'Markdown' });
}
