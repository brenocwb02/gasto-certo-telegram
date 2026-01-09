/**
 * Financial Commands - Comandos de relatórios financeiros
 * /saldo, /extrato, /resumo, /previsao, /top_gastos, /comparar_meses, /orcamento, /dividas
 */

import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { formatCurrency } from '../_shared/formatters.ts';

/**
 * Comando /saldo - Mostra saldos das contas
 */
export async function handleSaldoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    const { data: accounts } = await supabase
        .from('accounts')
        .select('nome, saldo_atual, tipo')
        .eq('user_id', userId)
        .eq('ativo', true);

    if (!accounts || accounts.length === 0) {
        await sendTelegramMessage(chatId, '📭 Você ainda não tem contas cadastradas.');
        return;
    }

    const total = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.saldo_atual || 0), 0);
    const accountsList = accounts
        .map((acc: any) => `  • ${acc.nome}: ${formatCurrency(parseFloat(acc.saldo_atual || 0))}`)
        .join('\n');

    const message = `💰 *Seus Saldos*\n\n${accountsList}\n\n━━━━━━━━━━━━━━━━\n*Total:* ${formatCurrency(total)}`;
    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /extrato - Mostra últimas transações
 */
export async function handleExtratoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    const { data: transactions } = await supabase
        .from('transactions')
        .select(`
      *,
      category:categories(nome, cor),
      account:accounts!transactions_conta_origem_id_fkey(nome)
    `)
        .eq('user_id', userId)
        .order('data_transacao', { ascending: false })
        .limit(10);

    if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhuma transação encontrada.');
        return;
    }

    let currentDate = '';
    let list = '';
    const today = new Date().toLocaleDateString('pt-BR');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');

    // Botões de exclusão inline
    const inlineKeyboard: Array<Array<{ text: string; callback_data: string }>> = [];
    let buttonRow: Array<{ text: string; callback_data: string }> = [];

    for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const dateRaw = new Date(t.data_transacao + 'T12:00:00');
        const dateStr = dateRaw.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const fullDateStr = dateRaw.toLocaleDateString('pt-BR');

        if (fullDateStr !== currentDate) {
            currentDate = fullDateStr;
            let label = `📅 ${dateStr}`;
            if (fullDateStr === today) label = '📅 Hoje';
            if (fullDateStr === yesterday) label = '📅 Ontem';
            list += `\n*${label}*\n`;
        }

        const icon = t.tipo === 'receita' ? '🟢' : '🔴';
        const valorFmt = formatCurrency(parseFloat(t.valor));
        const cat = t.category?.nome || 'Outros';
        const conta = t.account?.nome || '';
        const num = i + 1;

        list += `${num}. ${icon} \`${valorFmt}\` • ${t.descricao}\n`;
        list += `   _${cat} • ${conta}_\n`;

        // Botão de excluir (5 por linha)
        buttonRow.push({ text: `🗑️ ${num}`, callback_data: `del_tx_${t.id}` });
        if (buttonRow.length === 5 || i === transactions.length - 1) {
            inlineKeyboard.push(buttonRow);
            buttonRow = [];
        }
    }

    const message = `📋 *Extrato Recente*\n${list}\n_Clique no número para excluir._`;
    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard }
    });
}

/**
 * Comando /resumo - Mostra visão 360° completa das finanças
 * Inspirado no formato: Saldos + Faturas + Dívidas + Saldo Líquido
 */
export async function handleResumoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        // ============================================================================
        // 1. DADOS DO MÊS (Fluxo de Caixa)
        // ============================================================================
        const { data: monthFlow } = await supabase
            .from('transactions')
            .select('tipo, valor')
            .eq('user_id', userId)
            .gte('data_transacao', firstDay.toISOString().split('T')[0]);

        let receitasMes = 0;
        let despesasMes = 0;

        monthFlow?.forEach((t: any) => {
            if (t.tipo === 'receita') receitasMes += parseFloat(t.valor);
            if (t.tipo === 'despesa') despesasMes += parseFloat(t.valor);
        });

        const saldoMes = receitasMes - despesasMes;

        // ============================================================================
        // 2. SALDOS DE CONTAS (Patrimônio)
        // ============================================================================
        const { data: accounts } = await supabase
            .from('accounts')
            .select('nome, saldo_atual, tipo')
            .eq('user_id', userId)
            .eq('ativo', true)
            .order('nome');

        const totalDisponivel = accounts?.reduce((sum: number, acc: any) =>
            sum + parseFloat(acc.saldo_atual || 0), 0) || 0;

        // ============================================================================
        // 3. FATURAS & DÍVIDAS (AGRUPADAS)
        // ============================================================================
        // Usar a mesma lista de contas para buscar faturas, permitindo flexibilidade
        // Se for tipo 'cartao_credito' OU (saldo negativo E nome contiver "Cartão")
        const creditCards = accounts?.filter((acc: any) =>
            acc.tipo === 'cartao_credito' ||
            (parseFloat(acc.saldo_atual) < 0 && acc.nome.toLowerCase().includes('cartão')) ||
            (parseFloat(acc.saldo_atual) < 0 && acc.nome.toLowerCase().includes('cartao'))
        ) || [];

        const gruposFaturas: { [key: string]: number } = {};

        creditCards.forEach((card: any) => {
            const saldo = parseFloat(card.saldo_atual || 0);
            if (saldo < 0) {
                const valor = Math.abs(saldo);

                // Lógica de Agrupamento: 
                // Se começa com "Cartão X", agrupa por "Cartão X".
                const parts = card.nome.split(' ');
                let groupName = card.nome;

                if (parts.length >= 2) {
                    if (parts[0].toLowerCase() === 'cartão' || parts[0].toLowerCase() === 'cartao') {
                        groupName = `${parts[0]} ${parts[1]}`;
                    }
                }

                gruposFaturas[groupName] = (gruposFaturas[groupName] || 0) + valor;
            }
        });

        const dividaTotal = Object.values(gruposFaturas).reduce((sum, val) => sum + val, 0);

        // Saldo Disponível Real: Soma apenas contas positivas (ativos)
        // Dívida Total = Soma de saldos < 0 (considerados dívida)
        // Patrimônio Líquido = Disponível - Dívida.

        const ativosReais = accounts?.reduce((sum: number, acc: any) => {
            const saldo = parseFloat(acc.saldo_atual || 0);
            return saldo > 0 ? sum + saldo : sum; // Só soma positivo
        }, 0) || 0;

        const saldoLiquido = ativosReais - dividaTotal;

        // ============================================================================
        // 4. MONTAR MENSAGEM
        // ============================================================================
        let message = `📊 *Resumo de ${capitalizedMonth}*\n\n`;

        // Fluxo
        message += `💵 *Fluxo do Mês*\n`;
        message += `🟢 Receitas: \`${formatCurrency(receitasMes)}\`\n`;
        message += `🔴 Despesas: \`${formatCurrency(despesasMes)}\`\n`;
        message += `👉 Saldo: *${formatCurrency(saldoMes)}*\n\n`;

        // Saldos (Atuais - Todos)
        message += `🏦 *Saldos Atuais*\n`;

        if (accounts && accounts.length > 0) {
            accounts.forEach((acc: any) => {
                const saldo = parseFloat(acc.saldo_atual || 0);
                const emoji = saldo < 0 ? '🔴' : '🔵'; // Vermelho se negativo, Azul se positivo
                message += `${emoji} ${acc.nome}: \`${formatCurrency(saldo)}\`\n`;
            });
        } else {
            message += `_Nenhuma conta cadastrada_\n`;
        }

        // Faturas (Só mostra se tiver dívida)
        if (dividaTotal > 0) {
            message += `\n💳 *Faturas Crédito*\n`;

            // Iterar sobre os grupos criados
            Object.entries(gruposFaturas).forEach(([nomeGrupo, valor]) => {
                message += `🔸 ${nomeGrupo}: \`${formatCurrency(valor)}\`\n`;
            });

            message += `📉 *Total Faturas: ${formatCurrency(dividaTotal)}*\n`;
        }

        message += `\n━━━━━━━━━━━━━━━━\n`;

        // Resumo Geral
        const emojiLiq = saldoLiquido >= 0 ? '✅' : '⚠️';
        message += `💰 *Patrimônio Líquido*\n`;
        message += `(Ativos - Passivos)\n`;
        message += `${emojiLiq} *${formatCurrency(saldoLiquido)}*`;

        if (saldoLiquido < 0) {
            message += `\n\n👮‍♂️ _Cuidado! Você deve mais do que tem._`;
        }

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Erro em /resumo:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao gerar resumo. Tente novamente.');
    }
}

/**
 * Comando /previsao - Mostra projeção de gastos
 */
export async function handlePrevisaoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const currentDay = now.getDate();
        const daysRemaining = daysInMonth - currentDay;

        // Buscar gastos do mês atual
        const { data: transactions } = await supabase
            .from('transactions')
            .select('tipo, valor')
            .eq('user_id', userId)
            .eq('tipo', 'despesa')
            .gte('data_transacao', firstDay.toISOString().split('T')[0])
            .lte('data_transacao', now.toISOString().split('T')[0]);

        const totalGasto = transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
        const mediaDiaria = currentDay > 0 ? totalGasto / currentDay : 0;
        const previsaoTotal = mediaDiaria * daysInMonth;
        const previsaoRestante = mediaDiaria * daysRemaining;

        // Buscar receitas do mês
        const { data: receitas } = await supabase
            .from('transactions')
            .select('valor')
            .eq('user_id', userId)
            .eq('tipo', 'receita')
            .gte('data_transacao', firstDay.toISOString().split('T')[0])
            .lte('data_transacao', lastDay.toISOString().split('T')[0]);

        const totalReceita = receitas?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
        const saldoProjetado = totalReceita - previsaoTotal;

        const statusEmoji = saldoProjetado >= 0 ? '✅' : '⚠️';
        const statusMessage = saldoProjetado >= 0
            ? `Você deve terminar o mês com ${formatCurrency(saldoProjetado)} positivo!`
            : `Atenção! Você pode terminar o mês com ${formatCurrency(Math.abs(saldoProjetado))} negativo.`;

        const message = `📈 *Previsão de Gastos*\n\n` +
            `📅 Dia ${currentDay} de ${daysInMonth} (${daysRemaining} dias restantes)\n\n` +
            `💸 *Gastos até agora:* ${formatCurrency(totalGasto)}\n` +
            `📊 *Média diária:* ${formatCurrency(mediaDiaria)}\n\n` +
            `🔮 *Projeção para o mês:*\n` +
            `   Total previsto: ${formatCurrency(previsaoTotal)}\n` +
            `   Ainda vai gastar: ~${formatCurrency(previsaoRestante)}\n\n` +
            `💰 *Receitas do mês:* ${formatCurrency(totalReceita)}\n` +
            `${statusEmoji} *Saldo projetado:* ${formatCurrency(saldoProjetado)}\n\n` +
            `${statusMessage}`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro em /previsao:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao calcular previsão. Tente novamente.');
    }
}

/**
 * Comando /top_gastos - Mostra top 5 categorias de gastos
 */
export async function handleTopGastosCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    const firstDay = new Date();
    firstDay.setDate(1);
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

    const { data: transactions } = await supabase
        .from('transactions')
        .select('valor, category:categories(nome)')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data_transacao', firstDay.toISOString().split('T')[0])
        .lte('data_transacao', lastDay.toISOString().split('T')[0]);

    if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhum gasto registrado este mês.');
        return;
    }

    const grouped = transactions.reduce((acc: any, t: any) => {
        const cat = t.category?.nome || 'Sem categoria';
        acc[cat] = (acc[cat] || 0) + parseFloat(t.valor);
        return acc;
    }, {});

    const sorted = Object.entries(grouped)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5);

    const list = sorted.map(([cat, val]: any, i: number) =>
        `${i + 1}. *${cat}*: ${formatCurrency(val)}`
    ).join('\n');

    await sendTelegramMessage(chatId, `🔥 *Top 5 Gastos deste Mês*\n\n${list}`, { parse_mode: 'Markdown' });
}

/**
 * Comando /comparar_meses - Compara gastos com mês anterior
 */
export async function handleCompararMesesCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [thisMonthData, lastMonthData] = await Promise.all([
        supabase.from('transactions').select('valor').eq('user_id', userId).eq('tipo', 'despesa')
            .gte('data_transacao', thisMonth.toISOString().split('T')[0]),
        supabase.from('transactions').select('valor').eq('user_id', userId).eq('tipo', 'despesa')
            .gte('data_transacao', lastMonth.toISOString().split('T')[0])
            .lt('data_transacao', thisMonth.toISOString().split('T')[0])
    ]);

    const thisTotal = thisMonthData.data?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
    const lastTotal = lastMonthData.data?.reduce((sum: number, t: any) => sum + parseFloat(t.valor), 0) || 0;
    const diff = thisTotal - lastTotal;
    const diffPercent = lastTotal > 0 ? ((diff / lastTotal) * 100).toFixed(1) : '0';

    const icon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
    const trend = diff > 0 ? 'aumentaram' : diff < 0 ? 'diminuíram' : 'permaneceram iguais';

    const message = `📊 *Comparativo de Gastos*\n\n📅 Mês Anterior: ${formatCurrency(lastTotal)}\n📅 Mês Atual: ${formatCurrency(thisTotal)}\n\n${icon} Seus gastos ${trend} ${diffPercent}%\n(${diff >= 0 ? '+' : ''}${formatCurrency(Math.abs(diff))})`;
    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /orcamento - Mostra orçamentos do mês
 */
export async function handleOrcamentoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;

        // Buscar group_id do usuário (se pertencer a um grupo familiar)
        const { data: familyMember } = await supabase
            .from('family_members')
            .select('group_id')
            .eq('member_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        const groupId = familyMember?.group_id;

        // Buscar orçamentos padrão (pessoais OU do grupo)
        let budgetQuery = supabase
            .from('default_budgets')
            .select('id, amount, category_id, category:categories(id, nome, cor)');

        if (groupId) {
            // Se está em grupo, buscar orçamentos do grupo
            budgetQuery = budgetQuery.or(`user_id.eq.${userId},group_id.eq.${groupId}`);
        } else {
            // Senão, buscar apenas pessoais
            budgetQuery = budgetQuery.eq('user_id', userId);
        }

        const { data: defaultBudgets, error: budgetError } = await budgetQuery;

        if (budgetError) {
            console.error('Erro ao buscar orçamentos:', budgetError);
            await sendTelegramMessage(chatId, '❌ Erro ao carregar orçamentos.');
            return;
        }

        if (!defaultBudgets || defaultBudgets.length === 0) {
            await sendTelegramMessage(chatId, '📊 *Orçamento do Mês*\n\n📭 Você ainda não definiu orçamentos padrão.\n\n💡 Acesse o app para criar seus orçamentos:\nhttps://www.boascontas.com.br/orcamento');
            return;
        }

        // Buscar transações do mês para calcular gasto por categoria
        const { data: transactions } = await supabase
            .from('transactions')
            .select('valor, categoria_id')
            .eq('user_id', userId)
            .eq('tipo', 'despesa')
            .gte('data_transacao', monthStart)
            .lte('data_transacao', monthEnd);

        // Buscar subcategorias de cada categoria principal
        const categoryIds = defaultBudgets.map((b: any) => b.category_id);
        const { data: subcategories } = await supabase
            .from('categories')
            .select('id, parent_id')
            .in('parent_id', categoryIds);

        // Mapear subcategorias para categorias pai
        const subcatMap: Record<string, string> = {};
        subcategories?.forEach((sub: any) => {
            subcatMap[sub.id] = sub.parent_id;
        });

        // Calcular gasto por categoria principal (incluindo subcategorias)
        const spentByCategory: Record<string, number> = {};
        transactions?.forEach((tx: any) => {
            // Se é subcategoria, mapear para pai
            const parentId = subcatMap[tx.categoria_id] || tx.categoria_id;
            if (parentId) {
                spentByCategory[parentId] = (spentByCategory[parentId] || 0) + parseFloat(tx.valor);
            }
        });

        let totalBudget = 0;
        let totalSpent = 0;

        const list = defaultBudgets.map((b: any) => {
            const budget = parseFloat(b.amount);
            const spent = spentByCategory[b.category_id] || 0;
            const remaining = budget - spent;
            const percent = budget > 0 ? ((spent / budget) * 100).toFixed(0) : '0';

            totalBudget += budget;
            totalSpent += spent;

            const icon = spent > budget ? '🔴' : spent > budget * 0.8 ? '🟡' : '🟢';
            const bar = '█'.repeat(Math.min(10, Math.floor((spent / budget) * 10))) + '░'.repeat(Math.max(0, 10 - Math.floor((spent / budget) * 10)));
            const categoryName = (b.category as any)?.nome || 'Categoria';

            return `${icon} *${categoryName}*\n${bar} ${percent}%\n${formatCurrency(spent)} / ${formatCurrency(budget)}\n${remaining >= 0 ? '✅' : '⚠️'} Restante: ${formatCurrency(Math.abs(remaining))}`;
        }).join('\n\n');

        const totalPercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : '0';
        const totalRemaining = totalBudget - totalSpent;

        const message = `📊 *Orçamento de ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n💰 *Total Orçado:* ${formatCurrency(totalBudget)}\n💸 *Total Gasto:* ${formatCurrency(totalSpent)} (${totalPercent}%)\n${totalRemaining >= 0 ? '✅' : '⚠️'} *Saldo:* ${formatCurrency(Math.abs(totalRemaining))}`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro ao buscar orçamento:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar orçamento.');
    }
}

/**
 * Comando /dividas - Mostra dívidas do usuário
 */
export async function handleDividasCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        const { data: debts } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('ativo', true)
            .or('tipo.eq.cartao_credito,debt_type.not.is.null')
            .order('saldo_atual', { ascending: false });

        if (!debts || debts.length === 0) {
            await sendTelegramMessage(chatId, '✅ *Parabéns!*\n\nVocê não tem dívidas cadastradas no momento! 🎉');
            return;
        }

        let totalDebt = 0;
        const list = debts.map((debt: any) => {
            const balance = Math.abs(parseFloat(debt.saldo_atual || 0));
            totalDebt += balance;

            let details = `💳 *${debt.nome}*\n   Saldo: ${formatCurrency(balance)}`;

            if (debt.tipo === 'cartao_credito') {
                details += `\n   Limite: ${formatCurrency(parseFloat(debt.limite_credito || 0))}`;
                if (debt.dia_vencimento) {
                    details += `\n   Vencimento: dia ${debt.dia_vencimento}`;
                }
            }

            if (debt.monthly_payment) {
                details += `\n   Parcela: ${formatCurrency(parseFloat(debt.monthly_payment))}`;
            }

            if (debt.remaining_installments) {
                details += `\n   Faltam: ${debt.remaining_installments} parcelas`;
            }

            return details;
        }).join('\n\n');

        const message = `💳 *Suas Dívidas*\n\n${list}\n\n━━━━━━━━━━━━━━━━\n⚠️ *Total de Dívidas:* ${formatCurrency(totalDebt)}`;

        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Erro ao buscar dívidas:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao carregar dívidas.');
    }
}
