/**
 * Admin Commands - Comandos administrativos
 * /start, /ajuda, /help
 */

import { sendTelegramMessage } from '../_shared/telegram-api.ts';

/**
 * Mostra o menu de ajuda com todos os comandos disponíveis
 */
export async function handleAjudaCommand(chatId: number): Promise<void> {
    const message = `🤖 *Menu Zaq - Boas Contas*

📝 *Registro Rápido*
Apenas digite: "Almoço 25 reais" ou envie áudio!

💳 *Cartões de Crédito*
/faturas - Faturas pendentes
/pagar - Pagar fatura agora
/config\\_cartao - Automatizar pagamentos

👤 *Contexto & Família*
/contexto - Escolher (Pessoal vs Grupo)
/p - Mudar para Pessoal
/g - Mudar para Grupo

📊 *Relatórios*
/saldo - Saldos atuais
/extrato - Últimas transações
/resumo - Balanço do mês
/top\\_gastos - Onde você gastou mais
/comparar\\_meses - Evolução de gastos

🎯 *Planejamento*
/metas - Suas metas
/previsao - Projeção de gastos
/recorrentes - Contas fixas

⚙️ *Outros*
/ajuda - Este menu
/editar\\_ultima - Corrigir erro

🌐 *Acesse o app web:*
📱 https://app.boascontas.com`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Mensagem de boas-vindas para usuários não vinculados
 */
export async function handleStartUnlinkedCommand(chatId: number): Promise<void> {
    const message = `👋 *Bem-vindo ao Zaq - Boas Contas!*

Para vincular sua conta, use o comando:
\`/start SEU_CODIGO_DE_LICENCA\`

📍 Você encontra seu código na aba "Licença" do aplicativo web.

❓ Use /ajuda para ver todos os comandos disponíveis.`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Mensagem de conta não vinculada
 */
export async function sendUnlinkedMessage(chatId: number): Promise<void> {
    await sendTelegramMessage(chatId, '🔗 *Sua conta não está vinculada*\n\nUse:\n`/start SEU_CODIGO_DE_LICENCA`', { parse_mode: 'Markdown' });
}
