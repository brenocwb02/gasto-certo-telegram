import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';
import { getUserTelegramContext } from '../utils/context.ts';
import { getRandomSuccessMessage, getEmojiForCategory, getCategoryComment } from '../_shared/ux-helpers.ts';
import { processCelebrations } from '../_shared/sticker-helper.ts';

/**
 * Handle 'select_account_' callback
 */
export async function handleSelectAccountCallback(
    supabase: any,
    chatId: number,
    userId: string,
    messageId: number,
    data: string,
    telegramId: string
): Promise<void> {
    const accountId = data.replace('select_account_', '');

    try {
        // Buscar sessão com transação pendente pelo telegram_id
        const { data: session, error: sessionErr } = await supabase
            .from('telegram_sessions')
            .select('contexto')
            .eq('telegram_id', telegramId)
            .single();

        if (!session?.contexto?.waiting_for || session.contexto.waiting_for !== 'account' || !session.contexto.pending_transaction) {
            await editTelegramMessage(chatId, messageId, '❌ Sessão expirada. Envie a transação novamente.');
            return;
        }

        const pending = session.contexto.pending_transaction;

        // Buscar nome e visibilidade da conta
        const { data: conta } = await supabase
            .from('accounts')
            .select('nome, visibility')
            .eq('id', accountId)
            .single();

        // Usar categoria encontrada pelo parser ou buscar por sugestão hardcoded
        let categoriaId: string | null = pending.subcategoria_id || pending.categoria_id || null;
        let categoriaNome = pending.categoria_nome || 'Outros';
        let subcategoriaNome = pending.subcategoria_nome || null;

        // Se o parser não encontrou, tentar pela sugestão hardcoded
        if (!categoriaId && pending.categoria_sugerida) {
            const categoriaParts = pending.categoria_sugerida.split('>').map((s: string) => s.trim());
            const categoriaFilho = categoriaParts[categoriaParts.length - 1];

            // Buscar categoria com parent para montar hierarquia
            const { data: categorias } = await supabase
                .from('categories')
                .select('id, nome, parent:categories!parent_id(nome)')
                .eq('user_id', userId)
                .ilike('nome', `%${categoriaFilho}%`)
                .limit(1);

            if (categorias && categorias.length > 0) {
                categoriaId = categorias[0].id;
                // Montar nome hierárquico se tiver parent
                const parentData = categorias[0].parent as unknown;
                if (parentData && Array.isArray(parentData) && parentData.length > 0) {
                    categoriaNome = (parentData[0] as { nome: string }).nome;
                    subcategoriaNome = categorias[0].nome;
                } else if (parentData && typeof parentData === 'object' && 'nome' in (parentData as object)) {
                    categoriaNome = (parentData as { nome: string }).nome;
                    subcategoriaNome = categorias[0].nome;
                } else {
                    categoriaNome = categorias[0].nome;
                    subcategoriaNome = null;
                }
            }
        }

        // Buscar contexto
        // Contexto agora é definido pela conta, não pelo usuário
        const contextGroupId = (conta?.visibility === 'family') ? (session.contexto.group_id || null) : null;

        // Preparar transação completa
        const transactionData = {
            user_id: userId,
            user_id: userId,
            group_id: contextGroupId,
            valor: pending.valor,
            descricao: pending.descricao,
            tipo: pending.tipo,
            categoria_id: categoriaId,
            conta_origem_id: accountId,
            conta_destino_id: null,
            origem: 'telegram'
        };

        // Atualizar sessão com dados completos
        const { data: sessionData, error: sessionError } = await supabase
            .from('telegram_sessions')
            .update({
                contexto: transactionData,
                status: 'ativo'
            })
            .eq('telegram_id', telegramId)
            .select('id')
            .single();

        if (sessionError) throw sessionError;

        // Montar confirmação no novo formato
        const tipoLabel = pending.tipo === 'receita' ? 'Receita' : pending.tipo === 'despesa' ? 'Despesa' : 'Transferência';

        let confirmMsg = `✅ *Confirmar registro?*\n\n`;
        confirmMsg += `*Tipo:* ${tipoLabel}\n`;
        confirmMsg += `*Descrição:* ${pending.descricao}\n`;
        confirmMsg += `*Valor:* ${formatCurrency(pending.valor)}\n`;
        confirmMsg += `*Conta:* ${conta?.nome || 'Conta'}\n`;

        // Exibir Categoria e Subcategoria separadamente
        if (subcategoriaNome) {
            confirmMsg += `*Categoria:* 🍴 ${categoriaNome}\n`;
            confirmMsg += `*Subcategoria:* ${subcategoriaNome}\n`;
        } else {
            confirmMsg += `*Categoria:* ${categoriaNome}\n`;
        }

        // Indicador de Visibilidade baseado na Conta
        if (conta?.visibility === 'personal') {
            confirmMsg += `\n👤 *Pessoal* (só você vê)`;
        } else {
            // Default é família/grupo se não for explicitamente pessoal
            // Se tiver nome do grupo na sessão ou contexto, poderia mostrar, mas "Família" é genérico o suficiente
            confirmMsg += `\n🏠 *Família* (todos veem)`;
        }

        const keyboard = {
            inline_keyboard: [
                [
                    { text: "✅ Confirmar", callback_data: `confirm_transaction:${sessionData.id}` },
                    { text: "❌ Cancelar", callback_data: `cancel_transaction:${sessionData.id}` }
                ]
            ]
        };

        await editTelegramMessage(chatId, messageId, confirmMsg, { reply_markup: keyboard });

    } catch (e) {
        console.error('Erro ao selecionar conta:', e);
        await editTelegramMessage(chatId, messageId, '❌ Erro ao processar. Tente novamente.');
    }
}


/**
 * Handle 'confirm_transaction' and 'cancel_transaction'
 */
export async function handleConfirmTransactionCallback(
    supabase: any,
    chatId: number,
    userId: string,
    messageId: number,
    action: string,
    sessionId: string
): Promise<void> {

    const { data: session } = await supabase.from('telegram_sessions').select('contexto').eq('id', sessionId).single();

    if (!session || !session.contexto) {
        await editTelegramMessage(chatId, messageId, "Esta confirmação expirou.");
        return;
    }

    if (action === 'confirm_transaction') {
        const transactionData = session.contexto;

        // Limpar campos que não existem na tabela transactions (caso existam metadados)
        const dbData = { ...transactionData };
        delete dbData.categoria_nome; // Garantia
        delete dbData.conta_nome; // Garantia

        const { error: transactionError } = await supabase.from('transactions').insert(dbData);
        if (transactionError) throw transactionError;

        // Buscar nomes para montar mensagem bonita
        const { data: catData } = await supabase.from('categories').select('nome').eq('id', transactionData.categoria_id).single();
        const { data: accData } = await supabase.from('accounts').select('nome').eq('id', transactionData.conta_origem_id).single();

        const catNome = catData?.nome || 'Outros';
        const accNome = accData?.nome || 'Conta';
        const valorFmt = formatCurrency(transactionData.valor);

        // Montar mensagem de Sucesso com UX Delight
        let successMsg = "";

        // 1. Título Variável
        if (transactionData.tipo === 'receita') {
            successMsg += `💰 *Receita Recebida!* 🚀\n`;
        } else if (transactionData.tipo === 'transferencia') {
            successMsg += `🔄 *Transferência Realizada* ✅\n`;
        } else {
            successMsg += `*${getRandomSuccessMessage()}*\n`;
        }

        // 2. Resumo da Transação
        const catEmoji = getEmojiForCategory(catNome);
        successMsg += `\n💎 *${valorFmt}* em ${catEmoji} *${catNome}*`;
        if (transactionData.descricao) {
            successMsg += `\n📍 _${transactionData.descricao}_`;
        }

        // 3. Informação da Conta
        successMsg += `\n💳 ${accNome}`;

        // 4. Comentário Inteligente
        const comment = getCategoryComment(catNome);
        if (comment && transactionData.tipo === 'despesa') {
            successMsg += `\n\n_${comment}_`;
        }

        await editTelegramMessage(chatId, messageId, successMsg);

        // 🎉 Processar celebrações (stickers) após sucesso
        await processCelebrations(transactionData.user_id, chatId);

    } else if (action === 'cancel_transaction') {
        await editTelegramMessage(chatId, messageId, "❌ Registo cancelado.");
    }

    await supabase.from('telegram_sessions').delete().eq('id', sessionId);
}
