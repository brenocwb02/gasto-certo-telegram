/**
 * =========================================================================
 * PATCH COMPLETO - MODELO 5 HÍBRIDO PARA TELEGRAM WEBHOOK
 * =========================================================================
 * 
 * Este arquivo contém TODOS os blocos de código que você deve adicionar
 * ao arquivo: supabase/functions/telegram-webhook/index.ts
 * 
 * INSTRUÇÕES:
 * 1. Abra o arquivo index.ts
 * 2. Procure por cada LOCALIZAÇÃO indicada abaixo (use Ctrl+F)
 * 3. Adicione o CÓDIGO correspondente
 * 
 * Tempo estimado: 10-15 minutos
 * =========================================================================
 */

// =========================================================================
// BLOCO 1: FUNÇÕES AUXILIARES DE CONTEXTO
// =========================================================================
// LOCALIZAÇÃO: Após a função `getTranscriptFromAudio` (procure linha ~262)
// PROCURE POR: "async function linkUserWithLicense"
// ADICIONE ANTES DESTA FUNÇÃO:

/**
 * MODELO 5 HÍBRIDO - Contexto Ativo
 */
async function getUserTelegramContext(supabase: any, userId: string): Promise<{
    defaultContext: 'personal' | 'group';
    showConfirmation: boolean;
    alertAt80: boolean;
    alertAt90: boolean;
    groupId: string | null;
    groupName: string | null;
}> {
    try {
        const { data, error } = await supabase.rpc('get_telegram_context', {
            p_user_id: userId
        });

        if (error || !data || data.length === 0) {
            console.log('Contexto não encontrado, usando padrão: personal');
            return {
                defaultContext: 'personal',
                showConfirmation: true,
                alertAt80: true,
                alertAt90: true,
                groupId: null,
                groupName: null
            };
        }

        const context = data[0];
        return {
            defaultContext: context.default_context || 'personal',
            showConfirmation: context.show_context_confirmation !== false,
            alertAt80: context.alert_at_80_percent !== false,
            alertAt90: context.alert_at_90_percent !== false,
            groupId: context.current_group_id || null,
            groupName: context.current_group_name || null
        };
    } catch (e) {
        console.error('Erro ao obter contexto:', e);
        return {
            defaultContext: 'personal',
            showConfirmation: true,
            alertAt80: true,
            alertAt90: true,
            groupId: null,
            groupName: null
        };
    }
}

async function setUserTelegramContext(
    supabase: any,
    userId: string,
    context: 'personal' | 'group'
): Promise<boolean> {
    try {
        const { error } = await supabase.rpc('set_telegram_context', {
            p_user_id: userId,
            p_context: context
        });
        if (error) {
            console.error('Erro ao definir contexto:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Erro ao definir contexto:', e);
        return false;
    }
}

function parseContextFromMessage(message: string): {
    forcedContext: 'personal' | 'group' | null;
    cleanMessage: string;
} {
    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage.startsWith('#p ') || lowerMessage.startsWith('#pessoal ')) {
        return {
            forcedContext: 'personal',
            cleanMessage: message.replace(/^#p(essoal)?\s+/i, '').trim()
        };
    }

    if (lowerMessage.startsWith('#g ') || lowerMessage.startsWith('#grupo ')) {
        return {
            forcedContext: 'group',
            cleanMessage: message.replace(/^#g(rupo)?\s+/i, '').trim()
        };
    }

    return {
        forcedContext: null,
        cleanMessage: message
    };
}

function formatTransactionConfirmation(params: {
    tipo: string;
    valor: number;
    descricao: string;
    categoria: string;
    context: 'personal' | 'group';
    groupName: string | null;
    usage?: number;
    limit?: number;
    showUsage?: boolean;
}): string {
    const { tipo, valor, descricao, categoria, context, groupName, usage, limit, showUsage } = params;

    const tipoEmoji = tipo === 'receita' ? '💚' : tipo === 'despesa' ? '💸' : '🔄';
    const tipoLabel = tipo === 'receita' ? 'Receita' : tipo === 'despesa' ? 'Despesa' : 'Transferência';

    const contextEmoji = context === 'group' ? '🏠' : '👤';
    const contextLabel = context === 'group'
        ? (groupName || 'Grupo Familiar')
        : 'Pessoal';
    const visibilityInfo = context === 'group'
        ? '\nOutras pessoas do grupo verão esta transação.'
        : '\n(só você vê)';

    let message = `✅ ${tipoLabel} registrada!\n\n`;
    message += `💰 Valor: ${formatCurrency(valor)}\n`;
    message += `📁 Categoria: ${categoria}\n`;
    message += `${contextEmoji} ${contextLabel}${visibilityInfo}`;

    if (context === 'personal' && showUsage && usage !== undefined && limit !== undefined) {
        const percentage = Math.round((usage / limit) * 100);
        message += `\n\n📊 Uso: ${usage}/${limit} transações (${percentage}%)`;

        if (limit - usage <= 10 && limit - usage > 0) {
            message += `\n⚠️ ${limit - usage} transações restantes este mês`;
        }
    }

    if (Math.random() < 0.2) {
        message += context === 'group'
            ? '\n\n💡 Dica: Use #p para registrar uma despesa pessoal'
            : '\n\n💡 Dica: Use #g para registrar no grupo familiar';
    }

    return message;
}

function shouldShowLimitAlert(
    usage: number,
    limit: number,
    alertAt80: boolean,
    alertAt90: boolean
): { show: boolean; message: string } {
    const percentage = (usage / limit) * 100;

    if (percentage >= 90 && alertAt90) {
        return {
            show: true,
            message: `⚠️ *ATENÇÃO: Limite de Transações Pessoais*\n\n` +
                `📊 Você usou ${usage} de ${limit} transações este mês (${Math.round(percentage)}%)\n` +
                `📅 Restam ${limit - usage} transações\n\n` +
                `💡 *Dica:* Transações do grupo são ILIMITADAS!\n` +
                `   Use /g para alternar para o grupo familiar.\n\n` +
                `💎 Ou faça upgrade para Individual (ilimitado) → /planos`
        };
    }

    if (percentage >= 80 && percentage < 90 && alertAt80) {
        return {
            show: true,
            message: `⚠️ Você está próximo do limite (${usage}/${limit} transações pessoais).\n\n` +
                `💡 Dica: Use /g para registrar no grupo (ilimitado).`
        };
    }

    return { show: false, message: '' };
}

// =========================================================================
// BLOCO 2: NOVOS COMANDOS NO SWITCH
// =========================================================================
// LOCALIZAÇÃO: Dentro da função `handleCommand`, após o case '/meuperfil'
// PROCURE POR: "case '/meuperfil':" (linha ~713)
// ADICIONE APÓS O BREAK deste case (após linha ~768):

    case '/contexto':
    case '/ctx': {
    const context = await getUserTelegramContext(supabase, userId);

    const message = `📌 *Escolha o contexto padrão*\n\n` +
        `Onde suas próximas transações serão registradas?\n\n` +
        `*Contexto atual:* ${context.defaultContext === 'personal' ? '👤 Pessoal' : '🏠 ' + (context.groupName || 'Grupo')}\n\n` +
        `${context.groupId ? '🏠 *Grupo:* Transações compartilhadas (ILIMITADAS)\n' : ''}` +
        `👤 *Pessoal:* Apenas você vê (75/mês para free)`;

    const keyboard: any = {
        inline_keyboard: [
            [{ text: context.defaultContext === 'personal' ? '✅ 👤 Pessoal' : '👤 Pessoal', callback_data: 'context_personal' }]
        ]
    };

    if (context.groupId) {
        keyboard.inline_keyboard.push([
            { text: context.defaultContext === 'group' ? `✅ 🏠 ${context.groupName}` : `🏠 ${context.groupName}`, callback_data: 'context_group' }
        ]);
    } else {
        keyboard.inline_keyboard.push([
            { text: '⚠️ Você não está em nenhum grupo', callback_data: 'context_no_group' }
        ]);
    }

    keyboard.inline_keyboard.push([{ text: '❌ Cancelar', callback_data: 'context_cancel' }]);

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
    break;
}

    case '/p': {
    await setUserTelegramContext(supabase, userId, 'personal');

    const { data: limits } = await supabase.rpc('check_transaction_limit', { user_id: userId });
    const usage = limits?.usage || 0;
    const limit = limits?.limit || 75;

    const message = `✅ *Contexto alterado!*\n\n` +
        `📌 Suas transações agora vão para:\n` +
        `👤 *Pessoal* (só você vê)\n\n` +
        `📊 Limite: ${usage}/${limit} transações este mês\n\n` +
        `💡 Para voltar ao grupo: /g`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    break;
}

    case '/g':
    case '/grupo': {
    const context = await getUserTelegramContext(supabase, userId);

    if (!context.groupId) {
        await sendTelegramMessage(
            chatId,
            '⚠️ Você não está em nenhum grupo familiar.\n\n' +
            '👥 Para criar ou entrar em um grupo, acesse:\n' +
            '🔗 [App Boas Contas](https://app.boascontas.com/familia)',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    await setUserTelegramContext(supabase, userId, 'group');

    const message = `✅ *Contexto alterado!*\n\n` +
        `📌 Suas transações agora vão para:\n` +
        `🏠 *${context.groupName}*\n\n` +
        `♾️ Transações do grupo: ILIMITADAS\n` +
        `👥 Todos do grupo verão suas transações\n\n` +
        `💡 Para voltar ao pessoal: /p`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
    break;
}

    case '/config': {
    const context = await getUserTelegramContext(supabase, userId);

    const message = `⚙️ *Configurações do Telegram*\n\n` +
        `📌 *Contexto Padrão:*\n` +
        `${context.defaultContext === 'personal' ? '● ' : '○ '}👤 Pessoal\n` +
        `${context.defaultContext === 'group' ? '● ' : '○ '}🏠 ${context.groupName || 'Grupo'}\n\n` +
        `🔔 *Avisos de Limite:*\n` +
        `${context.alertAt80 ? '✅' : '☐'} Avisar em 80% (60/75)\n` +
        `${context.alertAt90 ? '✅' : '☐'} Avisar em 90% (68/75)\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💡 *Sobre o contexto:*\n` +
        `• Transações do grupo: ILIMITADAS\n` +
        `• Transações pessoais: 75/mês (free)\n` +
        `• Use #p ou #g para mudar pontualmente`;

    const keyboard = {
        inline_keyboard: [
            [{ text: '📌 Trocar Contexto', callback_data: 'config_context' }],
            [{ text: '❌ Fechar', callback_data: 'config_close' }]
        ]
    };

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
    break;
}

// =========================================================================
// BLOCO 3: ATUALIZAR /START
// =========================================================================
// LOCALIZAÇÃO: Dentro do case '/start' (linha ~332)
// SUBSTITUIR a mensagem existente por:

const message = `🎉 *Bem-vindo ao Zaq - Boas Contas!*

🎯 Comandos disponíveis:

💰 *Finanças*
• Registre gastos naturalmente (ex: "Almoço 25 reais")
• /saldo - Ver saldo das contas
• /extrato - Últimas transações
• /resumo - Resumo do mês

🔄 *Contexto (Novo!)*
• /contexto - Escolher onde registrar (Pessoal/Grupo)
• /p - Alternar para Pessoal
• /g - Alternar para Grupo
• Use #p ou #g em mensagens

📊 *Análises Inteligentes*
• /perguntar [pergunta] - Pergunte sobre seus gastos
• /top_gastos - Top 5 categorias do mês
• /comparar_meses - Compare mês atual vs anterior
• /previsao - Previsão de gastos

✏️ *Edição*
• /editar_ultima - Editar última transação

🎯 *Metas e Orçamento*
• /metas - Ver progresso das metas
• /orcamento - Status do orçamento

⚙️ *Configurações*
• /config - Configurações do bot

💡 /ajuda - Ver este menu`;

// =========================================================================
// FIM DO PATCH - INSTRUÇÕES FINAIS
// =========================================================================

/**
 * APÓS ADICIONAR TODOS OS BLOCOS:
 * 
 * 1. Salve o arquivo index.ts
 * 2. Execute: npx supabase functions deploy telegram-webhook
 * 3. Teste os comandos:
 *    - /contexto
 *    - /p
 *    - /g
 *    - #p Almoço 25 reais
 *    - #g Mercado 200
 * 
 * OBSERVAÇÃO IMPORTANTE:
 * Este patch adiciona a ESTRUTURA dos comandos.
 * Para que a detecção de prefixos (#p, #g) funcione nas mensagens de texto,
 * você precisará atualizar a lógica de processamento de NLP.
 * 
 * Se precisar de ajuda com essa parte, me avise!
 */
