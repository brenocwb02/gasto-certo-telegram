/**
 * Módulo de UX/UI para o Chatbot
 * Foco em "Encantamento" (Delight), Variedade e Feedback Visual.
 */

// Conjunto de mensagens de sucesso para variar a resposta
const successMessages = [
    "✅ Despesa registrada!",
    "💸 Anotado! Menos um gasto para se preocupar.",
    "✅ Tudo certo! Já está no seu controle.",
    "📝 Registrado com sucesso.",
    "🚀 Boa! Organização é poder.",
    "👍 Feito! Gasto computado.",
    "✅ Prontinho! O que seria de nós sem organização?",
    "💾 Salvo no sistema!",
    "✅ Recebido e processado.",
    "🎯 Na mosca! Transação gravada."
];

// Comentários contextuais baseados na categoria (key: parte do nome da categoria)
const categoryComments: Record<string, string[]> = {
    'Alimentação': ["Bom apetite! 🍽️", "Hummm... parece bom! 😋", "Espero que esteja delicioso! 🍔"],
    'Restaurante': ["Bom jantar! 🍷", "Aproveite a experiência! 🍝"],
    'Supermercado': ["Abastecendo a despensa! 🛒", "Foco na lista de compras! 📝"],
    'Transporte': ["Vá com segurança! 🚗", "Boa viagem! 🛣️"],
    'Combustível': ["Tanque cheio, pé na estrada! ⛽"],
    'Investimento': ["O eu do futuro agradece! 📈", "O caminho da riqueza! 💰", "Dinheiro trabalhando pra você! 🚀"],
    'Lazer': ["Divirta-se, você merece! 🎉", "Momentos importam! 🎈"],
    'Saúde': ["Saúde em primeiro lugar! 🏥", "Cuide-se bem! ❤️"],
    'Educação': ["Investimento em você é o melhor! 📚", "Conhecimento é poder! 🧠"],
    'Casa': ["Lar doce lar! 🏠"],
    'Renda': ["Dinheiro na conta! 🤑", "A melhor notificação do dia! 💸", "Fruto do seu trabalho! 💪"],
    'Salário': ["Dia de glória! 🙌", "O esforço valeu a pena! 💼"]
};

/**
 * Retorna uma mensagem de sucesso aleatória
 */
export function getRandomSuccessMessage(): string {
    const randomIndex = Math.floor(Math.random() * successMessages.length);
    return successMessages[randomIndex];
}

/**
 * Retorna um comentário contextual aleatório baseado na categoria
 */
export function getCategoryComment(categoryName: string): string | null {
    if (!categoryName) return null;

    // Chance de 60% de mostrar um comentário (para não ficar chato)
    if (Math.random() > 0.6) return null;

    const normalizedCat = categoryName; // Ex: "Alimentação > Restaurante"

    // Tenta encontrar match com chaves
    for (const [key, comments] of Object.entries(categoryComments)) {
        if (normalizedCat.includes(key)) {
            const randomIndex = Math.floor(Math.random() * comments.length);
            return comments[randomIndex];
        }
    }

    return null;
}

/**
 * Gera uma barra de progresso visual em texto
 * Ex: [▓▓▓▓▓▓░░░░] 60%
 */
export function generateProgressBar(current: number, total: number, length = 10): string {
    if (total <= 0) return `[${'░'.repeat(length)}] 0%`; // Evita divisão por zero

    const percentage = Math.min(Math.max(current / total, 0), 1); // Clamp entre 0 e 1
    const filledLength = Math.round(length * percentage);
    const emptyLength = length - filledLength;

    const filledChar = '▓';
    const emptyChar = '░';

    // Se passou de 100%, usa cor de alerta visual (se suportado) ou muda caractere
    if (current > total) {
        return `[${'█'.repeat(length)}] ${Math.round((current / total) * 100)}% ⚠️`;
    }

    return `[${filledChar.repeat(filledLength)}${emptyChar.repeat(emptyLength)}] ${Math.round(percentage * 100)}%`;
}

/**
 * Retorna emoji baseado na categoria principal
 */
export function getEmojiForCategory(categoryName: string): string {
    if (categoryName.includes('Alimentação')) return '🍔';
    if (categoryName.includes('Transporte')) return '🚗';
    if (categoryName.includes('Casa')) return '🏠';
    if (categoryName.includes('Saúde')) return '💊';
    if (categoryName.includes('Lazer')) return '🎉';
    if (categoryName.includes('Educação')) return '📚';
    if (categoryName.includes('Compras')) return '🛍️';
    if (categoryName.includes('Investimento')) return '📈';
    if (categoryName.includes('Renda')) return '💰';
    return '📁';
}
