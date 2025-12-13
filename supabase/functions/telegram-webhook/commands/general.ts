import { sendTelegramMessage } from '../_shared/telegram-api.ts';

/**
 * Comando /tutorial - Mostra link do tutorial
 */
export async function handleTutorialCommand(chatId: number): Promise<void> {
    const message = `🎓 *Tutorial do Zaq - Boas Contas*\n\n📱 *Acesse o tutorial completo:*\n🔗 [Abrir Tutorial](https://app.boascontas.com/onboarding)\n\n*Resumo rápido:*\n\n💰 *Transações:*\n• "Gastei R$ 50 no mercado"\n• "Recebi R$ 1000 de salário"\n• "Transferi R$ 200 da conta para carteira"\n\n🤖 *Comandos úteis:*\n• /saldo - Ver saldo das contas\n• /extrato - Últimas transações\n• /metas - Progresso das metas\n• /perguntar - Faça perguntas sobre gastos\n\n👥 *Gestão Familiar:*\n• Convide membros da família\n• Controle permissões\n• Compartilhe finanças\n\n🎯 *Metas e Orçamento:*\n• Defina objetivos financeiros\n• Acompanhe progresso\n• Planeje o futuro\n\n📊 *Relatórios Inteligentes:*\n• Gráficos de evolução\n• Análises de padrões\n• IA para insights\n\n💡 *Dica:* Complete o tutorial no app para uma experiência completa!`;
    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}

/**
 * Comando /ajuda, /start, /help - Já existe em admin.ts mas idealmente ficaria aqui se fosse generico
 * admin.ts lida com start por causa do vinculo de licença.
 */
