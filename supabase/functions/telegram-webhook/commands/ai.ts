import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';

/**
 * Comando /perguntar - IA Query Engine
 */
export async function handlePerguntarCommand(supabase: any, chatId: number, userId: string, argument: string): Promise<void> {
    const thinking = await sendTelegramMessage(chatId, '🤔 Analisando seus dados...');

    try {
        const response = await supabase.functions.invoke('query-engine', {
            body: { question: argument, userId }
        });

        if (response.error) throw response.error;

        await editTelegramMessage(chatId, thinking.result.message_id, `❓ *Pergunta:* ${argument}\n\n${response.data.answer}`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro no /perguntar:', error);
        await editTelegramMessage(chatId, thinking.result.message_id, '❌ Desculpe, ocorreu um erro ao processar sua pergunta.');
    }
}
