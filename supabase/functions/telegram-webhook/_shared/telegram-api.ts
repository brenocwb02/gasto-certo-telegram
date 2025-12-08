// Funções de comunicação com a API do Telegram

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

/**
 * Envia uma mensagem para o Telegram.
 */
export async function sendTelegramMessage(chatId: number, text: string, options: any = {}): Promise<any> {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const body = {
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
            ...options
        };
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            console.error("Erro na API do Telegram:", await response.json());
            return null;
        }
        const data = await response.json();
        return data.result;
    } catch (e) {
        console.error("Falha ao enviar mensagem para o Telegram:", e);
        return null;
    }
}

/**
 * Edita uma mensagem existente no Telegram.
 */
export async function editTelegramMessage(chatId: number, messageId: number, text: string, options: any = {}): Promise<void> {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
    try {
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: 'Markdown',
                ...options
            })
        });
    } catch (e) {
        console.error("Falha ao editar mensagem do Telegram:", e);
    }
}

/**
 * Responde a um callback query do Telegram.
 */
export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    try {
        await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text
            })
        });
    } catch (e) {
        console.error("Falha ao responder callback query:", e);
    }
}

/**
 * Envia uma foto para o Telegram.
 */
export async function sendTelegramPhoto(chatId: number, photoUrl: string, caption?: string): Promise<any> {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    try {
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photoUrl,
                caption,
                parse_mode: 'Markdown'
            })
        });
        if (!response.ok) {
            console.error("Erro ao enviar foto:", await response.json());
            return null;
        }
        const data = await response.json();
        return data.result;
    } catch (e) {
        console.error("Falha ao enviar foto para o Telegram:", e);
        return null;
    }
}
