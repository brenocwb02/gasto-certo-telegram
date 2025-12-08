// Types compartilhados para o telegram-webhook

export interface ParsedTransaction {
    tipo: 'despesa' | 'receita' | 'transferencia' | null;
    valor: number | null;
    descricao: string | null;
    conta_origem: string | null;
    conta_destino: string | null;
    categoria_id: string | null;
    subcategoria_id: string | null;
    categoria_nome: string | null;
    subcategoria_nome: string | null;
    categoria_sugerida: string | null;
    confianca: number;
    campos_faltantes: string[];
}

export interface AccountData {
    id: string;
    nome: string;
    tipo: string;
}

export interface CategoryData {
    id: string;
    nome: string;
    tipo: string;
    parent_id: string | null;
    keywords: string[] | null;
}

export interface TelegramContext {
    defaultContext: 'personal' | 'group';
    showConfirmation: boolean;
    alertAt80: boolean;
    alertAt90: boolean;
    groupId: string | null;
    groupName: string | null;
}

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
