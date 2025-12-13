/**
 * MODELO 5 HÍBRIDO - FUNÇÕES AUXILIARES PARA TELEGRAM
 * 
 * Adicione estas funções ao arquivo:
 * supabase/functions/telegram-webhook/index.ts
 * 
 * Posição recomendada: Após as funções auxiliares existentes (linha ~260)
 */

// ============================================================================
// CONTEXTO ATIVO - MODELO 5 HÍBRIDO
// ============================================================================

/**
 * Obtém o contexto ativo do usuário no Telegram
 */
export async function getUserTelegramContext(supabase: any, userId: string): Promise<{
    defaultContext: 'personal' | 'group';
    showConfirmation: boolean;
    groupId: string | null;
    groupName: string | null;
}> {
    const { data, error } = await supabase.rpc('get_telegram_context', {
        p_user_id: userId
    });

    if (error || !data || data.length === 0) {
        console.log('Contexto não encontrado, usando padrão: personal');
        return {
            defaultContext: 'personal',
            showConfirmation: true,
            groupId: null,
            groupName: null
        };
    }

    const context = data[0];
    return {
        defaultContext: context.default_context || 'personal',
        showConfirmation: context.show_context_confirmation !== false,
        groupId: context.current_group_id || null,
        groupName: context.current_group_name || null
    };
}

/**
 * Define o contexto padrão do usuário no Telegram
 */
export async function setUserTelegramContext(
    supabase: any,
    userId: string,
    context: 'personal' | 'group'
): Promise<boolean> {
    const { data, error } = await supabase.rpc('set_telegram_context', {
        p_user_id: userId,
        p_context: context
    });

    if (error) {
        console.error('Erro ao definir contexto:', error);
        return false;
    }

    return data === true;
}

/**
 * Detecta prefixos de contexto na mensagem (#p ou #g)
 * Retorna o contexto forçado (se houver) e a mensagem limpa
 */
export function parseContextFromMessage(message: string): {
    forcedContext: 'personal' | 'group' | null;
    cleanMessage: string;
} {
    const lowerMessage = message.toLowerCase().trim();

    // Detectar #p ou #pessoal
    if (lowerMessage.startsWith('#p ') || lowerMessage.startsWith('#pessoal ')) {
        return {
            forcedContext: 'personal',
            cleanMessage: message.replace(/^#p(essoal)?\s+/i, '').trim()
        };
    }

    // Detectar #g ou #grupo
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

/**
 * Obtém o group_id correto baseado no contexto
 * Retorna null para contexto pessoal, UUID do grupo para contexto group
 */
export async function resolveGroupIdFromContext(
    supabase: any,
    userId: string,
    context: 'personal' | 'group',
    userGroupId: string | null
): Promise<string | null> {
    if (context === 'personal') {
        return null; // Transação pessoal
    }

    // Contexto é 'group' - verificar se usuário tem grupo
    if (userGroupId) {
        return userGroupId;
    }

    // Usuário não tem grupo, mas pediu contexto group
    // Buscar grupo do usuário
    const { data: memberData } = await supabase
        .from('family_members')
        .select('group_id')
        .eq('member_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();

    return memberData?.group_id || null;
}

/**
 * Gera mensagem de confirmação com indicador de contexto
 */
export function formatTransactionConfirmation(params: {
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

    // Indicador de contexto
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

    // Mostrar uso apenas para transações pessoais
    if (context === 'personal' && showUsage && usage !== undefined && limit !== undefined) {
        const percentage = Math.round((usage / limit) * 100);
        message += `\n\n📊 Uso: ${usage}/${limit} transações (${percentage}%)`;

        if (limit - usage <= 10 && limit - usage > 0) {
            message += `\n⚠️ ${limit - usage} transações restantes este mês`;
        }
    }

    // Dica sobre prefixos (mostrar aleatoriamente ~20% das vezes)
    if (Math.random() < 0.2) {
        message += context === 'group'
            ? '\n\n💡 Dica: Use #p para registrar uma despesa pessoal'
            : '\n\n💡 Dica: Use #g para registrar no grupo familiar';
    }

    return message;
}

/**
 * Calcula se deve mostrar alerta de limite
 */
export function shouldShowLimitAlert(
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
                `📅 Restam ${limit - usage} transações até ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}\n\n` +
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

// ============================================================================
// NOVOS COMANDOS - MODELO 5 HÍBRIDO
// ============================================================================

/**
 * Comando /contexto - Explica o novo modelo
 */
export async function handleContextCommand(supabase: any, userId: string, chatId: number): Promise<void> {
    const message = `📌 *Mudança na Visibilidade*\n\n` +
        `Agora ficou mais fácil! Você não precisa mais ficar trocando de contexto.\n\n` +
        `🔒 *Pessoal:* Basta registrar em uma conta marcada como "Pessoal" (ex: seu Nubank).\n` +
        `🏠 *Família:* Basta registrar em uma conta marcada como "Família" (ex: Conta Conjunta).\n\n` +
        `⚙️ *Como configurar?*\n` +
        `Acesse o App e edite suas contas para escolher quem pode ver as transações.\n\n` +
        `💡 _Todas as transações mostram automaticamente se são Pessoais ou Familiares._`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /p - Alternar para contexto pessoal
 */
/**
 * Comando /p - Atalho informativo
 */
export async function handlePersonalCommand(supabase: any, userId: string, chatId: number): Promise<void> {
    const message = `👤 *Modo Pessoal*\n\n` +
        `Não é mais necessário usar /p!\n\n` +
        `Basta escolher uma conta **Pessoal** na hora de registrar o gasto, e ele será privado automaticamente.`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /g - Alternar para contexto grupo
 */
/**
 * Comando /g - Atalho informativo
 */
export async function handleGroupCommand(supabase: any, userId: string, chatId: number): Promise<void> {
    const message = `🏠 *Modo Família*\n\n` +
        `Não é mais necessário usar /g!\n\n` +
        `Basta escolher uma conta **Familiar** (ou criar uma nova) que todos do grupo verão automaticamente.`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /config - Configurações do bot
 */
export async function handleConfigCommand(supabase: any, userId: string, chatId: number): Promise<void> {
    const context = await getUserTelegramContext(supabase, userId);

    const message = `⚙️ *Configurações do Telegram*\n\n` +
        `📌 *Contexto Padrão:*\n` +
        `${context.defaultContext === 'personal' ? '● ' : '○ '}👤 Pessoal\n` +
        `${context.defaultContext === 'group' ? '● ' : '○ '}🏠 ${context.groupName || 'Grupo'}\n\n` +
        `💬 *Modo de Confirmação:*\n` +
        `${context.showConfirmation ? '● ' : '○ '}Sempre mostrar onde foi registrado\n\n` +
        `🔔 *Avisos de Limite:*\n` +
        `✅ Avisar em 80% (60/75)\n` +
        `✅ Avisar em 90% (68/75)\n\n` +
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
}
