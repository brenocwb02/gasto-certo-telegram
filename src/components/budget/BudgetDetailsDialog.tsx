import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Receipt } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

interface BudgetDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    budget: any;
    currentMonth: Date;
    groupId?: string;
}

export function BudgetDetailsDialog({ isOpen, onClose, budget, currentMonth, groupId }: BudgetDetailsDialogProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { categories } = useCategories(groupId);

    useEffect(() => {
        if (isOpen && budget) {
            fetchTransactions();
        }
    }, [isOpen, budget, categories]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // 1. Identificar todas as categorias (Pai + Filhas)
            const targetCategoryIds = [budget.category_id];

            // Adicionar filhas se houver
            if (categories.length > 0) {
                const childCategories = categories
                    .filter(c => c.parent_id === budget.category_id)
                    .map(c => c.id);
                targetCategoryIds.push(...childCategories);
            }

            // 2. Buscar transações (usando formato YYYY-MM-DD para evitar problemas de timezone)
            // Ajustar para pegar o mês completo com margem de segurança se necessário
            const startOfMonthStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), 'yyyy-MM-dd');
            // Para o fim do mês, pegamos o primeiro dia do próximo mês para fazer < (less than) ou lte o ultimo dia
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const endOfMonthStr = format(lastDay, 'yyyy-MM-dd');

            let query = supabase
                .from('transactions')
                .select('*')
                // Filtrar por data
                .gte('data_transacao', `${startOfMonthStr}T00:00:00`)
                .lte('data_transacao', `${endOfMonthStr}T23:59:59`)
                .eq('tipo', 'despesa')
                .order('data_transacao', { ascending: false });

            if (groupId) {
                query = query.eq('group_id', groupId);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    query = query.eq('user_id', user.id).is('group_id', null);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            // 3. Filtrar por categoria no frontend (mais seguro que .in com lista grande ou vazia)
            const filteredData = data?.filter((t: any) => targetCategoryIds.includes(t.categoria_id)) || [];

            // Buscar perfis separadamente
            if (filteredData.length > 0) {
                const userIds = [...new Set(filteredData.map((t: any) => t.user_id))];
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('user_id, nome, avatar_url')
                    .in('user_id', userIds);

                const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));

                const transactionsWithProfile = filteredData.map((t: any) => ({
                    ...t,
                    profile: profilesMap.get(t.user_id)
                }));

                setTransactions(transactionsWithProfile);
            } else {
                setTransactions([]);
            }

        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: budget?.category_color || '#6366f1' }} />
                        {budget?.category_name}
                    </DialogTitle>
                    <DialogDescription>
                        Detalhes dos gastos em {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium">Total Gasto</span>
                        <span className="text-xl font-bold">{formatCurrency(budget?.spent || 0)}</span>
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>Nenhuma transação encontrada.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-border">
                                                <AvatarImage src={t.profile?.avatar_url} />
                                                <AvatarFallback className="text-xs">
                                                    {t.profile?.nome?.substring(0, 2).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none mb-1">
                                                    {t.descricao}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(t.data_transacao), "dd 'de' MMM", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-medium text-destructive">
                                            - {formatCurrency(t.valor)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
