import { sendTelegramMessage } from '../_shared/telegram-api.ts';

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

/**
 * Comando /ajuda, /start, /help - Já existe em admin.ts mas idealmente ficaria aqui se fosse generico
 * admin.ts lida com start por causa do vinculo de licença.
 */
