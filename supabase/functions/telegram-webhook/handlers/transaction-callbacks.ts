import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';
import { gerarTecladoSubcategorias } from '../_shared/parsers/transaction.ts';
import { formatCurrency } from '../_shared/formatters.ts';
import { getUserTelegramContext } from '../utils/context.ts';
import { getRandomSuccessMessage, getEmojiForCategory, getCategoryComment } from '../_shared/ux-helpers.ts';
import { processCelebrations } from '../_shared/sticker-helper.ts';
import { generateNudge } from '../_shared/nudges.ts';
import { checkBudgetThreshold } from '../_shared/budget-alerts.ts';

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
            group_id: contextGroupId,
            valor: pending.valor,
            descricao: pending.descricao,
            tipo: pending.tipo,
            categoria_id: categoriaId,
            conta_origem_id: accountId,
            conta_destino_id: null,
            origem: 'telegram',
            parcelas: pending.parcelas || 1,
            is_installment: pending.is_installment || false
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
        if (pending.parcelas && pending.parcelas > 1) {
            confirmMsg += `*Parcelas:* ${pending.parcelas}x de ${formatCurrency((pending.valor || 0) / pending.parcelas)}\n`;
        }
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
            confirmMsg += `\n🏠 *Família* (todos veem)`;
        }

        // 🧠 NUDGE COMPORTAMENTAL
        // Verificar se devemos mostrar reflexão antes de confirmar
        let confirmButtonText = "✅ Confirmar";

        console.info(`[Nudge Check] tipo=${pending.tipo}, categoriaId=${categoriaId}, valor=${pending.valor}`);

        if (pending.tipo === 'despesa' && categoriaId) {
            console.info(`[Nudge Check] Chamando generateNudge para userId=${userId}`);
            const nudge = await generateNudge(supabase, userId, categoriaId, pending.valor);
            console.info(`[Nudge Check] Resultado:`, nudge ? 'NUDGE ENCONTRADO' : 'null');
            if (nudge) {
                confirmMsg += `\n\n🤔 *Momento de Reflexão*\n${nudge.message}`;
                confirmButtonText = nudge.severity === 'danger'
                    ? "⚠️ Confirmar Mesmo Assim"
                    : "✅ Confirmar";
            }
        }

        const keyboard = {
            inline_keyboard: [
                [
                    { text: confirmButtonText, callback_data: `confirm_transaction:${sessionData.id}` },
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

        // Buscar tipo da conta para determinar efetivada
        const { data: accountInfo } = await supabase
            .from('accounts')
            .select('tipo')
            .eq('id', transactionData.conta_origem_id)
            .single();

        const isCardAccount = accountInfo?.tipo === 'cartao_credito' || accountInfo?.tipo === 'cartao';
        const today = new Date().toISOString().split('T')[0];
        const transactionDate = transactionData.data_transacao || today;

        // Lógica de efetivada:
        // - Cartão de crédito: SEMPRE true (compra já aconteceu, vai para fatura)
        // - Outras contas: true se data <= hoje, false se data futura
        const shouldBeEffective = isCardAccount || transactionDate <= today;

        const parcelas = transactionData.parcelas || 1;
        const isInstallment = parcelas > 1;
        const installGroupId = isInstallment ? crypto.randomUUID() : null; // parcela_id common to all
        const installmentValue = isInstallment ? (transactionData.valor / parcelas) : transactionData.valor;
        const baseDate = transactionDate ? new Date(transactionDate) : new Date();

        if (isInstallment) {
            for (let i = 0; i < parcelas; i++) {
                const recurrenceDate = new Date(baseDate);
                recurrenceDate.setMonth(baseDate.getMonth() + i);

                const dbData = {
                    user_id: transactionData.user_id,
                    group_id: transactionData.group_id || null,
                    valor: installmentValue,
                    descricao: `${transactionData.descricao} (${i + 1}/${parcelas})`,
                    tipo: transactionData.tipo,
                    categoria_id: transactionData.categoria_id || null,
                    conta_origem_id: transactionData.conta_origem_id || null,
                    conta_destino_id: transactionData.conta_destino_id || null,
                    origem: transactionData.origem || 'telegram',
                    data_transacao: recurrenceDate.toISOString().split('T')[0],
                    // Parcela atual: efetivada se for cartão (sempre true) ou se for hoje
                    // Parcelas futuras: efetivada se cartão, senão false
                    efetivada: isCardAccount ? true : (i === 0 && shouldBeEffective),
                    tags: [`installment_group:${installGroupId}`],
                    parcela_atual: i + 1,
                    total_parcelas: parcelas,
                    parcela_id: installGroupId
                };

                const { error: transactionError } = await supabase.from('transactions').insert(dbData);
                if (transactionError) {
                    if (transactionError.code === 'P0001') {
                        await editTelegramMessage(chatId, messageId, `🔒 *Limite Atingido na parcela ${i + 1}*\n\nFaça upgrade para continuar.`);
                        await supabase.from('telegram_sessions').delete().eq('id', sessionId);
                        return;
                    }
                    console.error('Erro ao inserir parcela:', transactionError);
                }
            }
        } else {
            // Single Transaction
            const dbData = {
                user_id: transactionData.user_id,
                group_id: transactionData.group_id || null,
                valor: transactionData.valor,
                descricao: transactionData.descricao,
                tipo: transactionData.tipo,
                categoria_id: transactionData.categoria_id || null,
                conta_origem_id: transactionData.conta_origem_id || null,
                conta_destino_id: transactionData.conta_destino_id || null,
                origem: transactionData.origem || 'telegram',
                data_transacao: transactionData.data_transacao || new Date().toISOString().split('T')[0],
                efetivada: shouldBeEffective, // Cartão = sempre true, outras = true se hoje ou passado
            };

            const { error: transactionError } = await supabase.from('transactions').insert(dbData);

            if (transactionError) {
                // Check for Custom Plan Limit Error (P0001)
                if (transactionError.code === 'P0001') {
                    const upgradeMsg = `🔒 *Limite do Plano Gratuito Atingido*\n\n` +
                        `Você já atingiu o limite de **30 transações mensais**.\n\n` +
                        `Para continuar registrando, faça um upgrade para o **Plano Premium**! 🚀\n\n` +
                        `/planos - Ver opções`;
                    await editTelegramMessage(chatId, messageId, upgradeMsg);
                    // Clear session to avoid stuck state
                    await supabase.from('telegram_sessions').delete().eq('id', sessionId);
                    return;
                }
                throw transactionError;
            }
        }

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

        // ⚠️ Verificar se orçamento atingiu 80%+ e enviar alerta
        if (transactionData.tipo === 'despesa' && transactionData.categoria_id) {
            const budgetAlert = await checkBudgetThreshold(
                supabase,
                transactionData.user_id,
                transactionData.categoria_id,
                transactionData.valor
            );
            if (budgetAlert) {
                // Enviar alerta como mensagem separada
                await sendTelegramMessage(chatId, budgetAlert.message);
            }
        }

    } else if (action === 'cancel_transaction') {
        await editTelegramMessage(chatId, messageId, "❌ Registo cancelado.");
    }

    await supabase.from('telegram_sessions').delete().eq('id', sessionId);
}

/**
 * Handle 'select_category_' callback (Parent Category)
 */
export async function handleSelectCategoryCallback(
    supabase: any,
    chatId: number,
    userId: string,
    messageId: number,
    data: string,
    telegramId: string
): Promise<void> {
    const categoryId = data.replace('select_category_', '');

    try {
        // Buscar sessão
        const { data: session } = await supabase
            .from('telegram_sessions')
            .select('contexto')
            .eq('telegram_id', telegramId)
            .single();

        if (!session?.contexto?.waiting_for || session.contexto.waiting_for !== 'category' || !session.contexto.pending_transaction) {
            await editTelegramMessage(chatId, messageId, '❌ Sessão expirada.');
            return;
        }

        const pending = session.contexto.pending_transaction;

        // Se for "Outros", finalizar direto ou categorizar como Outros
        if (categoryId === 'outros') {
            // Buscar categoria Outros no banco
            const { data: catOutros } = await supabase
                .from('categories')
                .select('id, nome')
                .eq('user_id', userId)
                .ilike('nome', 'outros')
                .limit(1)
                .single();

            // Atualizar contexto e ir para confirmação
            pending.categoria_id = catOutros?.id || null;
            pending.categoria_nome = catOutros?.nome || 'Outros';
            pending.subcategoria_id = null;
            pending.subcategoria_nome = null;

            await updateSessionAndConfirm(supabase, chatId, userId, messageId, telegramId, pending, session.contexto);
            return;
        }

        // Buscar categoria selecionada
        const { data: categoria } = await supabase
            .from('categories')
            .select('id, nome')
            .eq('id', categoryId)
            .single();

        if (!categoria) {
            await editTelegramMessage(chatId, messageId, '❌ Categoria não encontrada.');
            return;
        }

        // Buscar subcategorias dessa categoria
        const { data: subcategorias } = await supabase
            .from('categories')
            .select('id, nome')
            .eq('parent_id', categoryId)
            .eq('user_id', userId);

        if (subcategorias && subcategorias.length > 0) {
            // Mostrar subcategorias
            const keyboard = gerarTecladoSubcategorias(subcategorias, categoryId);

            await editTelegramMessage(chatId, messageId, `📂 *Categoria: ${categoria.nome}*\nAgora escolha a subcategoria:`, { reply_markup: keyboard });
        } else {
            // Sem subcategorias, selecionar a própria categoria e confirmar
            pending.categoria_id = categoria.id;
            pending.categoria_nome = categoria.nome;
            pending.subcategoria_id = null;
            pending.subcategoria_nome = null;

            await updateSessionAndConfirm(supabase, chatId, userId, messageId, telegramId, pending, session.contexto);
        }

    } catch (e) {
        console.error('Erro select_category:', e);
    }
}

/**
 * Handle 'select_subcategory_' callback
 */
export async function handleSelectSubcategoryCallback(
    supabase: any,
    chatId: number,
    userId: string,
    messageId: number,
    data: string,
    telegramId: string
): Promise<void> {
    const subcategoryId = data.replace('select_subcategory_', '');

    try {
        const { data: session } = await supabase.from('telegram_sessions').select('contexto').eq('telegram_id', telegramId).single();
        if (!session?.contexto?.pending_transaction) return;

        const pending = session.contexto.pending_transaction;

        // Buscar subcategoria e pai
        const { data: subcat } = await supabase
            .from('categories')
            .select('id, nome, parent:categories!parent_id(id, nome)')
            .eq('id', subcategoryId)
            .single();

        if (subcat) {
            const parentObj = Array.isArray(subcat.parent) ? subcat.parent[0] : subcat.parent;
            const parentName = parentObj?.nome || 'Outros';

            pending.categoria_id = parentObj?.id || subcat.parent?.id; // Fallback messy but safe
            // Simplificando ID:
            pending.categoria_id = Array.isArray(subcat.parent) ? subcat.parent[0]?.id : subcat.parent?.id;

            pending.categoria_nome = parentName;
            pending.subcategoria_id = subcat.id;
            pending.subcategoria_nome = subcat.nome;

            await updateSessionAndConfirm(supabase, chatId, userId, messageId, telegramId, pending, session.contexto);
        }
    } catch (e) {
        console.error('Erro select_subcategory:', e);
    }
}

/**
 * Helper para atualizar sessão e mostrar confirmação final (reusa lógica)
 */
async function updateSessionAndConfirm(
    supabase: any,
    chatId: number,
    userId: string,
    messageId: number,
    telegramId: string,
    pending: any,
    currentContext: any
) {
    // Se ainda falta conta, perguntar conta
    // Mas se chegou aqui, provavelmente já passou pela validação de conta ou a conta foi identificada no parser
    // O fluxo em text.ts checka conta -> DEPOIS categoria.
    // Se o parser identificou conta mas não categoria, estamos aqui.
    // Então pending.conta_origem deve existir. Se não, idealmente deveríamos perguntar.

    // Atualizar pending na sessão (limpar waiting_for categoria)
    // Mas agora vamos proceder para confirmação. 
    // Para reaproveitar `handleSelectAccountCallback` (que monta a msg de confirmação),
    // podemos simular que a conta foi selecionada (se já tivermos ID) ou chamar uma função comum `showConfirmation`.
    // Como `handleSelectAccountCallback` é meio gordo e mistura seleção de conta com confirmação, vou refatorar a parte de exibição ou chamá-la.

    // MELHOR ABORDAGEM: Simular call para handleSelectAccountCallback passando o conta_origem já existente.
    // Isso garante que a lógica de "Prepare Transaction Complete" roda igual.
    // Mas `handleSelectAccountCallback` espera `data` = `select_account_ID`.

    if (pending.conta_origem) {
        // Atualizar o pending transaction na sessão antes de chamar
        await supabase.from('telegram_sessions').update({
            contexto: {
                ...currentContext,
                waiting_for: 'account', // Hack: mudar para account para o handler aceitar? Ou o handler aceita 'category'?
                pending_transaction: pending
            }
        }).eq('telegram_id', telegramId);

        // Precisamos ajustar handleSelectAccountCallback para aceitar waiting_for != 'account' SE quisermos reaproveitar?
        // Ou melhor duplicar a logica de 'Montar Confirmação'? Duplicar é mais seguro agora.

        // Vou forçar waiting_for='account' para passar na validação do handleSelectAccountCallback
        // (linha 30: if session.contexto.waiting_for !== 'account' return)

        // CHAMAR handleSelectAccountCallback
        await handleSelectAccountCallback(supabase, chatId, userId, messageId, `select_account_${pending.conta_origem}`, telegramId);
    } else {
        // Se não tem conta (caso raro se o fluxo foi: Parser -> Sem Categoria -> Select Categoria -> Mas conta era null?)
        // Se conta for null, handleTextMessage teria pego primeiro "Verificar se falta conta".
        // Então conta_origem já deve vir do parser se passou pelo if da conta.
    }
}
