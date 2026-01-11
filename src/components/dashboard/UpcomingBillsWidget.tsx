import { useEffect, useState } from "react";
import { DashboardCard, CardContent, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Bill {
    id: string;
    description: string;
    amount: number;
    date: string;
    isOverdue: boolean;
    isToday: boolean;
    daysUntil: number;
}

interface UpcomingBillsWidgetProps {
    groupId?: string;
}

export const UpcomingBillsWidget = ({ groupId }: UpcomingBillsWidgetProps) => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBills = async () => {
            setLoading(true);
            try {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];

                let query = supabase
                    .from('transactions')
                    .select('id, descricao, valor, data_transacao')
                    .eq('tipo', 'despesa')
                    .eq('efetivada', false)
                    .lte('data_transacao', nextWeekStr) // Up to 7 days away
                    .order('data_transacao', { ascending: true });

                if (groupId) {
                    query = query.eq('group_id', groupId);
                }

                const { data, error } = await query;

                if (!error && data) {
                    const mappedBills: Bill[] = data.map(item => {
                        const date = new Date(item.data_transacao);
                        const todayDate = new Date(todayStr); // Compare vs date string part only
                        const itemDateStr = item.data_transacao;

                        const timeDiff = new Date(itemDateStr).getTime() - todayDate.getTime();
                        const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

                        return {
                            id: item.id,
                            description: item.descricao,
                            amount: Number(item.valor),
                            date: item.data_transacao,
                            isOverdue: itemDateStr < todayStr,
                            isToday: itemDateStr === todayStr,
                            daysUntil
                        };
                    });

                    // Filter to only show relevant ones (overdue + next 7 days)
                    // The query already filters <= nextWeekStr.
                    // We might receive overdue ones if we didn't add gte todayStr. 
                    // Let's keep them if they are overdue, as "Upcoming" often implies "Need to pay".
                    // But user asked for "Próximos 7 dias". 
                    // I'll show overdue at top as urgent.

                    setBills(mappedBills);
                }
            } catch (err) {
                console.error("Error fetching bills:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, [groupId]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr); // Correct timezone handling often requires splitting/UTC
        // Simple distinct logic
        const parts = dateStr.split('-');
        return `${parts[2]}/${parts[1]}`;
    };

    if (loading) {
        return (
            <DashboardCard>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </DashboardCard>
        );
    }

    if (bills.length === 0) {
        return (
            <DashboardCard>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-violet-500" />
                        Contas a Pagar
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Tudo pago por enquanto</p>
                </CardContent>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-500" />
                    Contas a Pagar
                    <span className="text-xs font-normal text-muted-foreground ml-1">(7 dias)</span>
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                    <a href="/transactions">Ver todas</a>
                </Button>
            </CardHeader>
            <CardContent className="space-y-1">
                {bills.slice(0, 5).map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex flex-col items-center justify-center border font-medium text-xs shadow-sm",
                                bill.isOverdue
                                    ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900 dark:text-rose-400"
                                    : bill.isToday
                                        ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-900 dark:text-amber-400"
                                        : "bg-background border-muted text-muted-foreground"
                            )}>
                                <span className="font-bold text-sm block leading-none">{formatDate(bill.date).split('/')[0]}</span>
                                <span className="text-[10px] uppercase">{new Date(bill.date).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-tight line-clamp-1">{bill.description}</p>
                                <p className={cn(
                                    "text-xs mt-1",
                                    bill.isOverdue ? "text-rose-600 font-medium" :
                                        bill.isToday ? "text-amber-600 font-medium" : "text-muted-foreground"
                                )}>
                                    {bill.isOverdue ? `Venceu há ${Math.abs(bill.daysUntil)} dias` :
                                        bill.isToday ? "Vence hoje" :
                                            `Vence em ${bill.daysUntil} dias`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(bill.amount)}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                asChild
                            >
                                <a href={`/transactions?pay=${bill.id}`}>Pagar</a>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </DashboardCard>
    );
};
