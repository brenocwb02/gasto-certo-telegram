/**
 * Admin Commands - Comandos administrativos e Menu Interativo
 * /start, /ajuda, /help + Sistema de Menus
 */

import { sendTelegramMessage, editTelegramMessage } from '../_shared/telegram-api.ts';

// ============================================================================
// MENU PRINCIPAL
// ============================================================================

/**
 * Mostra o menu principal interativo com botões inline
 */
export async function handleAjudaCommand(chatId: number): Promise<void> {
    const keyboard = {
        inline_keyboard: [
            [
                { text: "📝 Registrar", callback_data: "menu_register" },
                { text: "💳 Faturas", callback_data: "menu_invoices" }
            ],
            [
                { text: "📊 Relatórios", callback_data: "menu_reports" },
                { text: "🎯 Metas", callback_data: "menu_goals" }
            ],
            [
                { text: "👥 Família", callback_data: "menu_family" },
                { text: "⚙️ Config", callback_data: "menu_settings" }
            ]
        ]
    };

    const message = `🤖 *Menu Zaq - Boas Contas*\n\n` +
        `👋 Olá! O que deseja fazer?\n\n` +
        `Escolha uma opção abaixo:`;

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ============================================================================
// SUBMENUS
// ============================================================================

/**
 * Submenu: Registrar Despesa/Receita/Transferência
 */
function getRegisterMenu() {
    return {
        text: `📝 *Como Registrar Transações*\n\n` +
            `💬 Forma mais FÁCIL: *Digite ou envie áudio!*\n\n` +
            `📤 *Despesas:*\n` +
            `• "Almoço 25 no cartão Nubank"\n` +
            `• "Uber 15 via PIX"\n` +
            `• "Mercado 150 no débito Santander"\n\n` +
            `📥 *Receitas:*\n` +
            `• "Recebi 50 de freelance"\n` +
            `• "Salário 3500 caiu no Inter"\n` +
            `• "Vendi livro 30 via PIX"\n\n` +
            `🔄 *Transferências:*\n` +
            `• "Transferi 200 do Nubank pro Inter"\n` +
            `• "Passei 100 da carteira pro PIX"\n\n` +
            `🎤 *Ou grave um áudio* dizendo o que fez!\n\n` +
            `📍 *Contexto:*\n` +
            `Use #p para Pessoal ou #g para Grupo\n` +
            `Exemplo: "#p Café 5 reais"\n\n` +
            `💡 *Dica:* Você NÃO precisa digitar comandos!`,
        keyboard: {
            inline_keyboard: [
                [
                    { text: "◀️ Voltar", callback_data: "menu_main" },
                    { text: "🏠 Menu", callback_data: "menu_main" }
                ]
            ]
        }
    };
}

/**
 * Submenu: Faturas de Cartão
 */
function getInvoicesMenu() {
    return {
        text: `💳 *Gestão de Cartões*\n\n` +
            `Comandos disponíveis:\n\n` +
            `📋 /faturas\n` +
            `   Ver todas faturas pendentes\n\n` +
            `💰 /pagar\n` +
            `   Pagar fatura de um cartão\n\n` +
            `⚙️ /config_cartao\n` +
            `   Configurar pagamento automático\n` +
            `   e lembretes de vencimento\n\n` +
            `💡 *Dica:* Configure pagamento automático\n` +
            `   para nunca esquecer uma fatura!`,
        keyboard: {
            inline_keyboard: [
                [
                    { text: "📋 Ver Faturas", callback_data: "action_faturas" },
                    { text: "💰 Pagar", callback_data: "action_pagar" }
                ],
                [
                    { text: "⚙️ Configurar", callback_data: "action_config_cartao" }
                ],
                [
                    { text: "◀️ Voltar", callback_data: "menu_main" },
                    { text: "🏠 Menu", callback_data: "menu_main" }
                ]
            ]
        }
    };
}

/**
 * Submenu: Relatórios Financeiros
 */
function getReportsMenu() {
    return {
        text: `📊 *Análises e Relatórios*\n\n` +
            `Veja suas finanças em detalhes:\n\n` +
            `💰 /saldo\n` +
            `   Lista rápida de saldos\n\n` +
            `📊 /resumo\n` +
            `   Visão 360° completa:\n` +
            `   • Saldos + Faturas + Dívidas\n` +
            `   • Saldo Líquido Real\n\n` +
            `📝 /extrato\n` +
            `   Últimas 10 transações\n\n` +
            `🔥 /top_gastos\n` +
            `   Categorias que mais gastou\n\n` +
            `📅 /comparar_meses\n` +
            `   Evolução entre meses\n\n` +
            `🔮 /previsao\n` +
            `   Projeção de gastos\n\n` +
            `💡 Todos os dados atualizam em tempo real!`,
        keyboard: {
            inline_keyboard: [
                [
                    { text: "💰 Saldo", callback_data: "action_saldo" },
                    { text: "📊 Resumo", callback_data: "action_resumo" }
                ],
                [
                    { text: "📝 Extrato", callback_data: "action_extrato" },
                    { text: "🔥 Top", callback_data: "action_top_gastos" }
                ],
                [
                    { text: "◀️ Voltar", callback_data: "menu_main" },
                    { text: "🏠 Menu", callback_data: "menu_main" }
                ]
            ]
        }
    };
}

/**
 * Submenu: Metas e Planejamento
 */
function getGoalsMenu() {
    return {
        text: `🎯 *Planejamento Financeiro*\n\n` +
            `Organize seu futuro:\n\n` +
            `🎯 /metas\n` +
            `   Ver e gerenciar suas metas\n\n` +
            `🔁 /recorrentes\n` +
            `   Ver gastos e receitas fixas\n\n` +
            `📊 /orcamento\n` +
            `   Configurar orçamento por categoria\n\n` +
            `💰 /dividas\n` +
            `   Gerenciar dívidas e parcelas\n\n` +
            `💡 *Dica:* Defina metas realistas e\n` +
            `   acompanhe seu progresso!`,
        keyboard: {
            inline_keyboard: [
                [
                    { text: "🎯 Metas", callback_data: "action_metas" },
                    { text: "🔁 Recorrentes", callback_data: "action_recorrentes" }
                ],
                [
                    { text: "📊 Orçamento", callback_data: "action_orcamento" },
                    { text: "💰 Dívidas", callback_data: "action_dividas" }
                ],
                [
                    { text: "◀️ Voltar", callback_data: "menu_main" },
                    { text: "🏠 Menu", callback_data: "menu_main" }
                ]
            ]
        }
    };
}

/**
 * Submenu: Família e Contexto
 */
function getFamilyMenu() {
    return {
        text: `👥 *Gestão de Família e Contexto*\n\n` +
            `Gerencie gastos compartilhados:\n\n` +
            `🔄 /contexto\n` +
            `   Escolher: Pessoal ou Grupo\n\n` +
            `#️⃣ *Atalhos rápidos:*\n` +
            `   #p → Forçar Pessoal\n` +
            `   #g → Forçar Grupo\n\n` +
            `👨‍👩‍👧‍👦 *Família:*\n` +
            `   Use o app web para criar\n` +
            `   e gerenciar seu grupo familiar\n\n` +
            `💡 *Dica:* Membros do grupo veem\n` +
            `   apenas transações compartilhadas!`,
        keyboard: {
            inline_keyboard: [
                [
                    { text: "🔄 Contexto", callback_data: "action_contexto" }
                ],
                [
                    { text: "◀️ Voltar", callback_data: "menu_main" },
                    { text: "🏠 Menu", callback_data: "menu_main" }
                ]
            ]
        }
    };
}

/**
 * Submenu: Configurações e Outros
 */
function getSettingsMenu() {
    return {
        text: `⚙️ *Outras Funções*\n\n` +
            `Ferramentas úteis:\n\n` +
            `✏️ /editar_ultima\n` +
            `   Corrigir última transação\n\n` +
            `📋 /categorias\n` +
            `   Ver todas categorias\n\n` +
            `❓ /ajuda\n` +
            `   Este menu interativo\n\n` +
            `🌐 *App Web:*\n` +
            `   https://app.boascontas.com\n` +
            `   Acesse recursos avançados!\n\n` +
            `💡 *Dica:* Use o app web para\n` +
            `   gráficos detalhados e relatórios!`,
        keyboard: {
            inline_keyboard: [
                [
                    { text: "✏️ Editar", callback_data: "action_editar_ultima" },
                    { text: "📋 Categorias", callback_data: "action_categorias" }
                ],
                [
                    { text: "◀️ Voltar", callback_data: "menu_main" },
                    { text: "🏠 Menu", callback_data: "menu_main" }
                ]
            ]
        }
    };
}

// ============================================================================
// HANDLER DE CALLBACKS DE MENU
// ============================================================================

/**
 * Processa callbacks de navegação de menu
 */
export async function handleMenuCallback(
    chatId: number,
    messageId: number,
    menuType: string
): Promise<void> {
    const menus: Record<string, { text: string, keyboard: any }> = {
        main: {
            text: `🤖 *Menu Zaq - Boas Contas*\n\n` +
                `👋 Olá! O que deseja fazer?\n\n` +
                `Escolha uma opção abaixo:`,
            keyboard: {
                inline_keyboard: [
                    [
                        { text: "📝 Registrar", callback_data: "menu_register" },
                        { text: "💳 Faturas", callback_data: "menu_invoices" }
                    ],
                    [
                        { text: "📊 Relatórios", callback_data: "menu_reports" },
                        { text: "🎯 Metas", callback_data: "menu_goals" }
                    ],
                    [
                        { text: "👥 Família", callback_data: "menu_family" },
                        { text: "⚙️ Config", callback_data: "menu_settings" }
                    ]
                ]
            }
        },
        register: getRegisterMenu(),
        invoices: getInvoicesMenu(),
        reports: getReportsMenu(),
        goals: getGoalsMenu(),
        family: getFamilyMenu(),
        settings: getSettingsMenu()
    };

    const menu = menus[menuType];
    if (menu) {
        await editTelegramMessage(chatId, messageId, menu.text, {
            parse_mode: 'Markdown',
            reply_markup: menu.keyboard
        });
    }
}

// ============================================================================
// MENSAGENS DE BOAS-VINDAS
// ============================================================================

/**
 * Mensagem de boas-vindas para usuários não vinculados
 */
export async function handleStartUnlinkedCommand(chatId: number): Promise<void> {
    const message = `👋 *Bem-vindo ao Zaq - Boas Contas!*\n\n` +
        `Para vincular sua conta, use o comando:\n` +
        `\`/start SEU_CODIGO_DE_LICENCA\`\n\n` +
        `📍 Você encontra seu código na aba "Licença" do aplicativo web.\n\n` +
        `❓ Use /ajuda para ver todos os comandos disponíveis.`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Mensagem de conta não vinculada
 */
export async function sendUnlinkedMessage(chatId: number): Promise<void> {
    await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nUse:\n`/start SEU_CODIGO_DE_LICENCA`', { parse_mode: 'Markdown' });
}
