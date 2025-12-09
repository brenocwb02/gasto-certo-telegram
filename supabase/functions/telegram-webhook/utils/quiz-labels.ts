/**
 * Quiz Labels - Funções auxiliares para labels do quiz financeiro
 */

export function getEmergencyFundLabel(value: string): string {
    const labels: Record<string, string> = {
        'none': 'Nada',
        'less_than_1_month': 'Menos de 1 mês',
        '1_to_3_months': '1-3 meses',
        '3_to_6_months': '3-6 meses',
        'more_than_6_months': 'Mais de 6 meses'
    };
    return labels[value] || value;
}

export function getDebtSituationLabel(value: string): string {
    const labels: Record<string, string> = {
        'no_debt': 'Sem dívidas',
        'low_debt': 'Dívidas baixas',
        'moderate_debt': 'Dívidas moderadas',
        'high_debt': 'Dívidas altas',
        'overwhelming_debt': 'Dívidas esmagadoras'
    };
    return labels[value] || value;
}

export function getSavingsRateLabel(value: string): string {
    const labels: Record<string, string> = {
        'negative': 'Negativo',
        '0_to_5_percent': '0-5%',
        '5_to_10_percent': '5-10%',
        '10_to_20_percent': '10-20%',
        'more_than_20_percent': 'Mais de 20%'
    };
    return labels[value] || value;
}

export function getInvestmentKnowledgeLabel(value: string): string {
    const labels: Record<string, string> = {
        'beginner': 'Iniciante',
        'basic': 'Básico',
        'intermediate': 'Intermediário',
        'advanced': 'Avançado',
        'expert': 'Especialista'
    };
    return labels[value] || value;
}

export function getFinancialGoalsLabel(value: string): string {
    const labels: Record<string, string> = {
        'survival': 'Sobrevivência',
        'stability': 'Estabilidade',
        'growth': 'Crescimento',
        'wealth_building': 'Construção de Riqueza',
        'legacy': 'Legado'
    };
    return labels[value] || value;
}

export function getBudgetControlLabel(value: string): string {
    const labels: Record<string, string> = {
        'no_budget': 'Sem orçamento',
        'informal': 'Informal',
        'basic_tracking': 'Controle básico',
        'detailed_budget': 'Orçamento detalhado',
        'advanced_planning': 'Planejamento avançado'
    };
    return labels[value] || value;
}

export function getInsuranceCoverageLabel(value: string): string {
    const labels: Record<string, string> = {
        'none': 'Nenhuma',
        'basic': 'Básica',
        'adequate': 'Adequada',
        'comprehensive': 'Abrangente',
        'excellent': 'Excelente'
    };
    return labels[value] || value;
}

export function getRetirementPlanningLabel(value: string): string {
    const labels: Record<string, string> = {
        'not_started': 'Não começou',
        'thinking_about_it': 'Pensando',
        'basic_plan': 'Plano básico',
        'detailed_plan': 'Plano detalhado',
        'expert_level': 'Nível especialista'
    };
    return labels[value] || value;
}
