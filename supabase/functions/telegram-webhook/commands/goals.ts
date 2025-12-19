import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /metas - Lista as metas ativas e seu progresso
 */
export async function handleMetasCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: goals, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'ativa')
            .order('data_fim', { ascending: true });

        if (error) throw error;

        if (!goals || goals.length === 0) {
            await sendTelegramMessage(chatId, '🎯 *Suas Metas*\n\nVocê ainda não tem metas ativas cadastrada.\n\n💡 Crie uma meta pelo app para acompanhar seu progresso!');
            return;
        }

        const list = goals.map((g: any) => {
            const current = parseFloat(g.valor_atual || 0);
            const target = parseFloat(g.valor_meta || 0);
            const percent = target > 0 ? ((current / target) * 100).toFixed(0) : '0';

            // Progress bar
            const filled = Math.min(10, Math.floor((current / target) * 10));
            const empty = Math.max(0, 10 - filled);
            const bar = '▓'.repeat(filled) + '░'.repeat(empty);

            const daysLeft = g.data_fim ? Math.ceil((new Date(g.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const daysText = daysLeft > 0 ? `${daysLeft} dias restantes` : 'Vence hoje!';

            return `🎯 *${g.titulo}*\n${bar} ${percent}%\n${formatCurrency(current)} de ${formatCurrency(target)}\n📅 ${daysText}`;
        }).join('\n\n');

        await sendTelegramMessage(chatId, `🎯 *Progresso das Metas*\n\n${list}`, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Erro em /metas:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao buscar metas.');
    }
}
