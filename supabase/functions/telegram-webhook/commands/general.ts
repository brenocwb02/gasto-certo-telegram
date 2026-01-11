import { sendTelegramMessage } from '../_shared/telegram-api.ts';

/**
 * Comando /app - Abre o Mini App
 */
export async function handleAppCommand(chatId: number): Promise<void> {
    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.boascontas.com.br';

    // Ensure URL is HTTPS
    const webAppUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;

    const message = `🚀 *Boas Contas App*
    
Clique no botão abaixo para abrir o app completo sem sair do Telegram.`;

    await sendTelegramMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: "📲 Abrir App", web_app: { url: webAppUrl } }
            ]]
        }
    });
}

/**
 * Comando /tutorial - Mostra link do tutorial
 */
export async function handleTutorialCommand(chatId: number): Promise<void> {
    const message = `🎓 *Tutorial do Zaq - Boas Contas*

📱 *Acesse o tutorial completo:*
🔗 [Abrir Tutorial](https://www.boascontas.com.br/onboarding)

*Resumo rápido:*

💰 *Transações:*
• "Gastei R$ 50 no mercado"
• "Recebi R$ 1000 de salário"
• "Transferi R$ 200 da conta para carteira"

🤖 *Comandos úteis:*
• /saldo - Ver saldo das contas
• /extrato - Últimas transações
• /metas - Progresso das metas
• /perguntar - Faça perguntas sobre gastos

👥 *Gestão Familiar:*
• Convide membros da família
• Controle permissões
• Compartilhe finanças

🎯 *Metas e Orçamento:*
• Defina objetivos financeiros
• Acompanhe progresso
• Planeje o futuro

📊 *Relatórios Inteligentes:*
• Gráficos de evolução
• Análises de padrões
• IA para insights

💡 *Dica:* Complete o tutorial no app para uma experiência completa!`;
    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}
