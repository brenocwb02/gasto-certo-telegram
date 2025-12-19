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
        .limit(15);

    if (!transactions || transactions.length === 0) {
        await sendTelegramMessage(chatId, '📭 Nenhuma transação encontrada.');
        return;
    }

    let currentDate = '';
    let list = '';
    const today = new Date().toLocaleDateString('pt-BR');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');

    for (const t of transactions) {
        const dateRaw = new Date(t.data_transacao + 'T12:00:00'); // Fix TZ
        const dateStr = dateRaw.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const fullDateStr = dateRaw.toLocaleDateString('pt-BR'); // Para comparação

        // Cabeçalho de Data
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

        // Formato Monospace para alinhar e destacar
        // Ex: 🔴 R$ 50,00 - Mercado
        list += `${icon} \`${valorFmt}\` • ${t.descricao}\n`;
        list += `   _${cat} • ${conta}_\n`; // Detalhe menor
    }

    await sendTelegramMessage(chatId, `📋 *Extrato Recente*\n${list}`, { parse_mode: 'Markdown' });
}

/**
 * Comando /resumo - Mostra visão 360° completa das finanças
 * Inspirado no formato: Saldos + Faturas + Dívidas + Saldo Líquido
 */
export async function handleResumoCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    try {
        // ============================================================================
        // 1. BUSCAR SALDOS DE TODAS AS CONTAS
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
        // 2. BUSCAR FATURAS PRÓXIMAS (próximo vencimento)
        // ============================================================================
        const hoje = new Date();
        const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

        const { data: creditCards } = await supabase
            .from('accounts')
            .select('id, nome, dia_vencimento, saldo_atual')
            .eq('user_id', userId)
            .eq('tipo', 'cartao_credito')
            .eq('ativo', true)
            .order('dia_vencimento');

        // Calcular próximas faturas
        const faturasProximas: any[] = [];
        creditCards?.forEach((card: any) => {
            if (card.dia_vencimento && card.saldo_atual < 0) {
                const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), card.dia_vencimento);
                if (vencimento < hoje) {
                    vencimento.setMonth(vencimento.getMonth() + 1);
                }

                const diasAteVenc = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

                faturasProximas.push({
                    nome: card.nome,
                    valor: Math.abs(card.saldo_atual),
                    vencimento: vencimento,
                    diasRestantes: diasAteVenc
                });
            }
        });

        // ============================================================================
        // 3. CALCULAR DÍVIDA TOTAL DOS CARTÕES
        // ============================================================================
        const dividaTotal = creditCards?.reduce((sum: number, card: any) => {
            const saldo = parseFloat(card.saldo_atual || 0);
            return saldo < 0 ? sum + Math.abs(saldo) : sum;
        }, 0) || 0;

        // ============================================================================
        // 4. CALCULAR SALDO LÍQUIDO
        // ============================================================================
        const saldoLiquido = totalDisponivel - dividaTotal;

        // ============================================================================
        // MONTAR MENSAGEM
        // ============================================================================
        let message = `📊 *RESUMO FINANCEIRO*\n\n`;

        // Saldos Atuais
        message += `🏦 *Saldos Atuais*\n`;
        if (accounts && accounts.length > 0) {
            accounts.forEach((acc: any) => {
                const saldo = parseFloat(acc.saldo_atual || 0);
                message += `• ${acc.nome}: ${formatCurrency(saldo)}\n`;
            });
        } else {
            message += `_Nenhuma conta cadastrada_\n`;
        }

        // Faturas Próximas
        message += `\n💳 *Faturas (Próximo Venc.)*\n`;
        if (faturasProximas.length > 0) {
            faturasProximas.slice(0, 3).forEach((fatura: any) => {
                const dataVenc = fatura.vencimento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                message += `• ${fatura.nome}: ${formatCurrency(fatura.valor)} (${dataVenc})\n`;
            });
        } else {
            message += `_Nenhuma fatura pendente_\n`;
        }

        // Dívida Total
        message += `\n💸 *Dívida Total dos Cartões*\n`;
        message += `${formatCurrency(dividaTotal)}\n`;

        // Separador visual
        message += `\n═══════════════\n`;

        // Saldo Final
        message += `📊 *RESUMO GERAL*\n`;
        message += `Total Disponível: ${formatCurrency(totalDisponivel)}\n`;
        message += `(-) Dívidas: ${formatCurrency(dividaTotal)}\n`;
        message += `═══════════════\n`;

        const emoji = saldoLiquido >= 0 ? '💰' : '⚠️';
        const status = saldoLiquido >= 0 ? '(no azul)' : '(no vermelho)';
        message += `${emoji} *Saldo Líquido: ${formatCurrency(saldoLiquido)}* ${status}`;

        // Alerta se negativo
        if (saldoLiquido < 0) {
            message += `\n\n⚠️ _Atenção: Suas dívidas superam seu saldo disponível!_`;
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
        const firstDay = new Date();
        firstDay.setDate(1);
        const month = firstDay.toISOString().split('T')[0];

        const { data: budgets } = await supabase.rpc('get_budgets_with_spent', { p_month: month });

        if (!budgets || budgets.length === 0) {
            await sendTelegramMessage(chatId, '📊 *Orçamento do Mês*\n\n📭 Você ainda não definiu orçamentos.\n\n💡 Acesse o app para criar seus orçamentos: https://app.boascontas.com/orcamento');
            return;
        }

        let totalBudget = 0;
        let totalSpent = 0;

        const list = budgets.map((b: any) => {
            const budget = parseFloat(b.amount);
            const spent = parseFloat(b.spent);
            const remaining = budget - spent;
            const percent = budget > 0 ? ((spent / budget) * 100).toFixed(0) : '0';

            totalBudget += budget;
            totalSpent += spent;

            const icon = spent > budget ? '🔴' : spent > budget * 0.8 ? '🟡' : '🟢';
            const bar = '█'.repeat(Math.min(10, Math.floor((spent / budget) * 10))) + '░'.repeat(Math.max(0, 10 - Math.floor((spent / budget) * 10)));

            return `${icon} *${b.category_name}*\n${bar} ${percent}%\n${formatCurrency(spent)} / ${formatCurrency(budget)}\n${remaining >= 0 ? '✅' : '⚠️'} Restante: ${formatCurrency(Math.abs(remaining))}`;
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
