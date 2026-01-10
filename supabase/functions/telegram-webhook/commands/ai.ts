import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';

/**
 * Comando /perguntar - IA Query Engine
 */
export async function handlePerguntarCommand(supabase: any, chatId: number, userId: string, argument: string): Promise<void> {
    // Envia mensagem inicial
    const thinking = await sendTelegramMessage(chatId, '🤔 Analisando seus dados...');

    if (!thinking) {
        console.error('Falha ao enviar mensagem de thinking');
        return;
    }

    // Lança a função query-engine em background (sem await no resultado final)
    // O Edge Function 'query-engine' deve ser responsável por enviar a resposta final ao usuário
    // Passamos o message_id para ele editar a mensagem "Analisando..."
    supabase.functions.invoke('query-engine', {
        body: {
            question: argument,
            userId,
            responseMethod: 'edit_message',
            chatId,
            messageId: thinking.message_id
        }
    }).then(({ error }: any) => {
        if (error) console.error('Erro ao invocar query-engine:', error);
    });

    // Retorna imediatamente para evitar timeout do Telegram
}
