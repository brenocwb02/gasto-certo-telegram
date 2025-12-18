/**
 * Paleta de cores semântica para categorias financeiras
 * Baseada em psicologia das cores e acessibilidade
 */

// Cores por tipo de categoria (case-insensitive match)
export const CATEGORY_COLORS: Record<string, string> = {
    // Alimentação
    'alimentação': '#f97316',
    'alimentacao': '#f97316',
    'comida': '#f97316',
    'restaurante': '#f97316',
    'supermercado': '#f97316',
    'lanches': '#fb923c',
    'delivery': '#fdba74',

    // Casa/Moradia
    'casa': '#3b82f6',
    'moradia': '#3b82f6',
    'aluguel': '#3b82f6',
    'condomínio': '#60a5fa',
    'condominio': '#60a5fa',

    // Transporte
    'transporte': '#64748b',
    'combustível': '#475569',
    'combustivel': '#475569',
    'uber': '#94a3b8',
    'estacionamento': '#94a3b8',

    // Lazer/Entretenimento
    'lazer': '#8b5cf6',
    'entretenimento': '#8b5cf6',
    'diversão': '#8b5cf6',
    'diversao': '#8b5cf6',
    'streaming': '#a78bfa',
    'jogos': '#a78bfa',

    // Saúde
    'saúde': '#10b981',
    'saude': '#10b981',
    'farmácia': '#34d399',
    'farmacia': '#34d399',
    'academia': '#34d399',
    'médico': '#6ee7b7',
    'medico': '#6ee7b7',

    // Educação
    'educação': '#6366f1',
    'educacao': '#6366f1',
    'cursos': '#818cf8',
    'livros': '#818cf8',
    'escola': '#6366f1',

    // Vestuário
    'vestuário': '#ec4899',
    'vestuario': '#ec4899',
    'roupas': '#ec4899',
    'calçados': '#f472b6',
    'calcados': '#f472b6',

    // Utilidades/Contas
    'utilidades': '#eab308',
    'contas': '#eab308',
    'luz': '#facc15',
    'água': '#fde047',
    'agua': '#fde047',
    'internet': '#facc15',
    'telefone': '#fde047',

    // Pets
    'pets': '#a16207',
    'animais': '#a16207',
    'veterinário': '#ca8a04',
    'veterinario': '#ca8a04',

    // Financeiro
    'financeiro': '#059669',
    'investimentos': '#059669',
    'poupança': '#10b981',
    'poupanca': '#10b981',
    'impostos': '#047857',
    'taxas': '#047857',

    // Presentes
    'presentes': '#dc2626',
    'doações': '#ef4444',
    'doacoes': '#ef4444',

    // Trabalho
    'trabalho': '#0891b2',
    'salário': '#22c55e',
    'salario': '#22c55e',
    'freelance': '#14b8a6',

    // Outros
    'outros': '#6b7280',
    'diversos': '#6b7280',
    'sem categoria': '#9ca3af',
};

// Paleta de fallback para categorias não mapeadas
export const FALLBACK_COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#eab308', // Yellow
    '#64748b', // Slate
    '#dc2626', // Red
    '#059669', // Green
    '#0891b2', // Cyan
    '#a16207', // Amber
];

/**
 * Obtém a cor para uma categoria
 * @param categoryName Nome da categoria
 * @param fallbackIndex Índice para cor de fallback (opcional)
 */
export function getCategoryColor(categoryName: string, fallbackIndex: number = 0): string {
    const normalizedName = categoryName.toLowerCase().trim();

    // Busca exata
    if (CATEGORY_COLORS[normalizedName]) {
        return CATEGORY_COLORS[normalizedName];
    }

    // Busca parcial (contém)
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return color;
        }
    }

    // Fallback usando índice
    return FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
}

/**
 * Cores fixas para tipos de transação
 */
export const TRANSACTION_COLORS = {
    receita: '#22c55e', // Green-500
    despesa: '#ef4444', // Red-500
    transferencia: '#3b82f6', // Blue-500
};

/**
 * Ajusta a opacidade de uma cor hex
 * @param hexColor Cor em formato hex
 * @param opacity Opacidade de 0 a 1
 */
export function adjustColorOpacity(hexColor: string, opacity: number): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Gera variações de uma cor para subcategorias
 * @param baseColor Cor base hex
 * @param count Número de variações
 */
export function generateColorVariations(baseColor: string, count: number): string[] {
    const variations: string[] = [];
    for (let i = 0; i < count; i++) {
        const opacity = Math.max(0.4, 1 - (i * 0.15));
        variations.push(adjustColorOpacity(baseColor, opacity));
    }
    return variations;
}
