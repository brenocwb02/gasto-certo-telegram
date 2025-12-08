// Funções de formatação genericas

/**
 * Formata um número para a moeda BRL.
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata uma data para o formato brasileiro.
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

/**
 * Formata data para exibição curta (ex: "Hoje", "Ontem", "07/12")
 */
export function formatDateShort(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    }
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    }).format(date);
}
