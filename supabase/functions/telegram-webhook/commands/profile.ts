import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import {
    getEmergencyFundLabel,
    getDebtSituationLabel,
    getSavingsRateLabel,
    getInvestmentKnowledgeLabel,
    getFinancialGoalsLabel,
    getBudgetControlLabel,
    getInsuranceCoverageLabel,
    getRetirementPlanningLabel
} from '../utils/quiz-labels.ts';

/**
 * Comando /meuperfil - Mostra perfil financeiro e score
 */
export async function handleMeuPerfilCommand(supabase: any, chatId: number, userId: string): Promise<void> {
    // Buscar perfil financeiro do usuário
    const { data: financialProfile, error: profileError } = await supabase
        .from('financial_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (profileError) {
        await sendTelegramMessage(chatId, '❌ Erro ao buscar seu perfil financeiro. Tente novamente.');
        return;
    }

    if (!financialProfile) {
        const message = `📊 *Seu Perfil Financeiro*\n\n❌ Você ainda não completou o quiz de saúde financeira.\n\n🎯 *Para descobrir seu perfil:*\n🔗 [Fazer Quiz](https://www.boascontas.com.br/quiz-financeiro)\n\n*O quiz avalia:*\n• Fundo de emergência\n• Situação de dívidas\n• Taxa de poupança\n• Conhecimento em investimentos\n• Objetivos financeiros\n• Controle de orçamento\n• Cobertura de seguros\n• Planejamento de aposentadoria\n\n💡 *Benefícios:*\n• Score de saúde financeira (0-100)\n• Recomendações personalizadas\n• Estratégias de melhoria\n\n🎓 Complete o quiz para receber insights valiosos sobre suas finanças!`;
        await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
    }

    // Calcular nível de saúde financeira
    const score = financialProfile.financial_health_score;
    let healthLevel = '';
    let healthEmoji = '';

    if (score >= 80) {
        healthLevel = 'Excelente';
        healthEmoji = '🟢';
    } else if (score >= 60) {
        healthLevel = 'Bom';
        healthEmoji = '🔵';
    } else if (score >= 40) {
        healthLevel = 'Regular';
        healthEmoji = '🟡';
    } else if (score >= 20) {
        healthLevel = 'Precisa Melhorar';
        healthEmoji = '🟠';
    } else {
        healthLevel = 'Crítico';
        healthEmoji = '🔴';
    }

    // Processar recomendações
    let recommendations = [];
    try {
        recommendations = Array.isArray(financialProfile.recommendations)
            ? financialProfile.recommendations
            : JSON.parse(financialProfile.recommendations as string);
    } catch {
        recommendations = [];
    }

    const message = `📊 *Seu Perfil Financeiro*\n\n${healthEmoji} *Score de Saúde Financeira: ${score}/100 - ${healthLevel}*\n\n📈 *Progresso:*\n${'█'.repeat(Math.floor(score / 10))}${'░'.repeat(10 - Math.floor(score / 10))} ${score}%\n\n🎯 *Suas Respostas:*\n• Fundo de Emergência: ${getEmergencyFundLabel(financialProfile.emergency_fund)}\n• Dívidas: ${getDebtSituationLabel(financialProfile.debt_situation)}\n• Poupança: ${getSavingsRateLabel(financialProfile.savings_rate)}\n• Investimentos: ${getInvestmentKnowledgeLabel(financialProfile.investment_knowledge)}\n• Objetivos: ${getFinancialGoalsLabel(financialProfile.financial_goals)}\n• Orçamento: ${getBudgetControlLabel(financialProfile.budget_control)}\n• Seguros: ${getInsuranceCoverageLabel(financialProfile.insurance_coverage)}\n• Aposentadoria: ${getRetirementPlanningLabel(financialProfile.retirement_planning)}\n\n💡 *Recomendações:*\n${recommendations.slice(0, 3).map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}\n\n🔗 [Ver Perfil Completo](https://www.boascontas.com.br/quiz-financeiro)\n\n📅 *Última atualização:* ${new Date(financialProfile.completed_at).toLocaleDateString('pt-BR')}`;

    await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
}
