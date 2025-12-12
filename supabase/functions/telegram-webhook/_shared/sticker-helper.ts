/**
 * Helper de Stickers - "Micro-Celebrações" 🎉
 * 
 * Como obter file_ids:
 * 1. Encontre stickers no Telegram (packs populares: Pepe, Pusheen, etc)
 * 2. Envie para @idstickerbot
 * 3. Copie o file_id retornado
 * 4. Cole abaixo
 */

import { sendTelegramSticker, sendTelegramMessage } from './telegram-api.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// 🎨 IDs dos Stickers (SUBSTITUIR pelos seus file_ids reais)
export const STICKER_IDS = {
    // Exemplo de file_id real (trocar pelos seus):
    // THUMBS_UP: 'CAACAgIAAxkBAAEMqLZnW...',
    // FIRE: 'CAACAgIAAxkBAAEMqLhnW...',

    // Placeholders - SUBSTITUIR:
    THUMBS_UP: 'PLACEHOLDER_THUMBS_UP_FILE_ID',  // 👍 Para primeira transação do dia
    FIRE: 'PLACEHOLDER_FIRE_FILE_ID'              // 🔥 Para streak de 7 dias
};

/**
 * Celebra a primeira transação do dia
 */
export async function celebrateFirstTransactionOfDay(chatId: number) {
    // Apenas envia se o file_id foi configurado
    if (!STICKER_IDS.THUMBS_UP.startsWith('PLACEHOLDER')) {
        await sendTelegramSticker(chatId, STICKER_IDS.THUMBS_UP);
        await sendTelegramMessage(chatId, '🌅 *Primeira transação do dia!* Ótimo começo! 💪');
    }
}

/**
 * Celebra um streak de dias consecutivos
 */
export async function celebrateStreak(chatId: number, days: number) {
    // Apenas envia se o file_id foi configurado
    if (!STICKER_IDS.FIRE.startsWith('PLACEHOLDER')) {
        await sendTelegramSticker(chatId, STICKER_IDS.FIRE);
    }

    let message = '';
    if (days === 7) {
        message = '🔥 *7 DIAS CONSECUTIVOS!*\n\nVocê está criando um hábito incrível de organização financeira! Continue assim! 💪';
    } else if (days === 30) {
        message = '🔥🔥🔥 *30 DIAS! UM MÊS COMPLETO!*\n\nVocê é disciplina personificada! Parabéns! 🏆';
    } else {
        message = `🔥 *${days} dias consecutivos!* Continue assim!`;
    }

    await sendTelegramMessage(chatId, message);
}

/**
 * Verifica se a transação atual é a primeira do dia
 */
export async function isFirstTransactionOfDay(userId: string): Promise<boolean> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today)
        .order('created_at', { ascending: true })
        .limit(2);

    if (error) {
        console.error('Erro ao verificar primeira transação do dia:', error);
        return false;
    }

    // Se tem exatamente 1 transação hoje, esta é a primeira
    return data?.length === 1;
}

/**
 * Calcula o streak atual do usuário (dias consecutivos com pelo menos 1 transação)
 */
export async function calculateStreak(userId: string): Promise<number> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar transações dos últimos 60 dias, agrupadas por dia
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data, error } = await supabase
        .from('transactions')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        return 0;
    }

    // Agrupar por dia
    const daysWithTransactions = new Set<string>();
    data.forEach(t => {
        const day = t.created_at.split('T')[0];
        daysWithTransactions.add(day);
    });

    // Calcular streak contando dias consecutivos a partir de hoje
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 60; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (daysWithTransactions.has(dateStr)) {
            streak++;
        } else {
            // Quebrou o streak
            break;
        }
    }

    return streak;
}

/**
 * Processa celebrações pós-transação
 */
export async function processCelebrations(userId: string, chatId: number) {
    try {
        // 1. Verificar se é a primeira do dia
        const isFirst = await isFirstTransactionOfDay(userId);
        if (isFirst) {
            await celebrateFirstTransactionOfDay(chatId);
            return; // Só uma celebração por vez para não spammar
        }

        // 2. Verificar streak (apenas em marcos: 7, 30 dias)
        const streak = await calculateStreak(userId);
        if (streak === 7 || streak === 30) {
            await celebrateStreak(chatId, streak);
        }
    } catch (error) {
        console.error('Erro ao processar celebrações:', error);
        // Não falhar a transação se celebração falhar
    }
}
