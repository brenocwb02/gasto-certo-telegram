import { sendTelegramMessage } from '../_shared/telegram-api.ts';

/**
 * Comando /categorias - Lista todas as categorias e subcategorias
 */
export async function handleCategoriasCommand(supabase: any, userId: string, chatId: number): Promise<void> {
    try {
        console.log('Buscando categorias para userId:', userId);
        // Buscar todas as categorias do usuário
        const { data: categorias, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        console.log('Categorias encontradas:', categorias?.length, 'Erro:', catError);

        if (catError) {
            console.error('Erro ao buscar categorias:', catError);
            await sendTelegramMessage(chatId, '❌ Erro ao buscar categorias: ' + catError.message);
            return;
        }

        if (!categorias || categorias.length === 0) {
            await sendTelegramMessage(chatId, '📂 Você ainda não tem categorias cadastradas.\n\nUse o app web para criar suas categorias.');
            return;
        }

        // Separar categorias pai e subcategorias
        const parentCategories = categorias.filter((c: any) => !c.parent_id);
        const subCategories = categorias.filter((c: any) => c.parent_id);

        // Mapeamento de nomes de ícones para emojis
        const iconMap: Record<string, string> = {
            // Transporte
            'car': '🚗', 'bus': '🚌', 'train': '🚆', 'plane': '✈️', 'bike': '🚴', 'fuel': '⛽',
            // Alimentação
            'shopping-bag': '🛍️', 'shopping-cart': '🛒', 'utensils': '🍴', 'coffee': '☕', 'pizza': '🍕', 'apple': '🍎',
            // Lazer e Entretenimento
            'gamepad': '🎮', 'gamepad-2': '🎮', 'tv': '📺', 'film': '🎬', 'music': '🎵', 'headphones': '🎧', 'party-popper': '🎉', 'sparkles': '✨',
            // Finanças e Investimentos
            'trending-up': '📈', 'trending-down': '📉', 'banknote': '💵', 'wallet': '👛', 'credit-card': '💳', 'piggy-bank': '🐷', 'coins': '🪙', 'dollar-sign': '💲',
            // Saúde
            'heart': '❤️', 'heart-pulse': '💓', 'stethoscope': '🩺', 'pill': '💊', 'activity': '🏃', 'apple': '🍎', 'dumbbell': '🏋️',
            // Trabalho
            'laptop': '💻', 'briefcase': '💼', 'building': '🏢', 'calculator': '🧮', 'tie': '👔',
            // Casa / Moradia
            'home': '🏠', 'house': '🏠', 'bed': '🛏️', 'sofa': '🛋️', 'lamp': '💡', 'wrench': '🔧', 'hammer': '🔨', 'armchair': '🪑',
            // Educação
            'book': '📚', 'graduation-cap': '🎓', 'pencil': '✏️', 'school': '🏫', 'brain': '🧠',
            // Família
            'users': '👥', 'user': '👤', 'baby': '👶', 'users-round': '👨‍👩‍👧‍👦',
            // Vida Espiritual / Religião
            'church': '⛪', 'cross': '✝️', 'pray': '🙏', 'hands': '🛐',
            // Despesas Fixas / Contas
            'receipt': '🧾', 'file-text': '📄', 'clipboard': '📋', 'scroll': '📜',
            // Impostos e Taxas
            'landmark': '🏛️', 'scale': '⚖️', 'percent': '💹',
            // Relacionamentos
            'gift': '🎁', 'heart-handshake': '🤝', 'cake': '🎂', 'ring': '💍',
            // Reserva / Prevenção
            'shield': '🛡️', 'lock': '🔒', 'umbrella': '☂️', 'tool': '🛠️', 'archive': '📦',
            // Metas e Projetos
            'target': '🎯', 'flag': '🚩', 'check-circle': '✅', 'rocket': '🚀',
            // Artigos Residenciais
            'couch': '🛋️', 'refrigerator': '🧊', 'washing-machine': '🧺', 'microwave': '📻',
            // Outros gerais
            'star': '⭐', 'zap': '⚡', 'smile': '😊', 'shirt': '👕', 'scissors': '✂️',
            'package': '📦', 'phone': '📱', 'mail': '📧', 'calendar': '📅', 'clock': '⏰',
            'map-pin': '📍', 'globe': '🌍', 'sun': '☀️', 'moon': '🌙', 'cloud': '☁️',
            'tree': '🌳', 'flower': '🌸', 'dog': '🐕', 'cat': '🐱', 'paw-print': '🐾',
        };

        const getEmoji = (iconName: string | null): string => {
            if (!iconName) return '📁';
            // Se já é um emoji, retorna diretamente
            if (/\p{Emoji}/u.test(iconName)) return iconName;
            // Busca no mapa
            return iconMap[iconName.toLowerCase()] || '📁';
        };

        let message = '📂 *Suas Categorias*\n\n';

        for (const parent of parentCategories) {
            const icon = getEmoji(parent.icone);
            message += `${icon} *${parent.nome}*\n`;

            // Encontrar subcategorias deste pai
            const children = subCategories.filter((sub: any) => sub.parent_id === parent.id);
            if (children.length > 0) {
                for (const child of children) {
                    const childIcon = getEmoji(child.icone);
                    message += `   └ ${childIcon} ${child.nome}\n`;
                }
            }
            message += '\n';
        }

        // Categorias órfãs (sem pai, mas que são subcategorias - caso de inconsistência)
        const orphanSubs = subCategories.filter((sub: any) =>
            !parentCategories.some((p: any) => p.id === sub.parent_id)
        );
        if (orphanSubs.length > 0) {
            message += `📋 *Outras*\n`;
            for (const orphan of orphanSubs) {
                const icon = getEmoji(orphan.icone);
                message += `   └ ${icon} ${orphan.nome}\n`;
            }
        }

        message += `\n📊 Total: ${categorias.length} categorias`;
        message += `\n\n💡 _Gerencie suas categorias pelo app web_`;

        await sendTelegramMessage(chatId, message);
    } catch (error: any) {
        console.error('Erro no comando /categorias:', error);
        await sendTelegramMessage(chatId, '❌ Erro ao processar categorias: ' + (error?.message || 'erro desconhecido'));
    }
}
