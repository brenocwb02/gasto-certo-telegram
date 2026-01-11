import { useEffect, useState } from "react";
import { DashboardCard, CardContent, CardHeader, CardTitle } from "./DashboardCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Alert {
    id: string;
    type: 'overdue' | 'upcoming' | 'budget' | 'negative';
    title: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    actionLabel?: string;
    actionHref?: string;
}

interface AlertsWidgetProps {
    groupId?: string;
    totalBalance?: number;
}

export const AlertsWidget = ({ groupId, totalBalance = 0 }: AlertsWidgetProps) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            setLoading(true);
            const newAlerts: Alert[] = [];

            try {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];

                // Check for negative balance
                if (totalBalance < 0) {
                    newAlerts.push({
                        id: 'negative-balance',
                        type: 'negative',
                        title: 'Saldo Negativo',
                        description: 'Priorize o pagamento de dívidas',
                        urgency: 'high',
                        actionLabel: 'Ver Contas',
                        actionHref: '/accounts',
                    });
                }

                // Fetch upcoming bills (un-effectuated transactions with future/today date)
                // Using efetivada = false instead of pago = false
                let billsQuery = supabase
                    .from('transactions')
                    .select('id, descricao, valor, data_transacao')
                    .eq('tipo', 'despesa')
                    .eq('efetivada', false)
                    .gte('data_transacao', todayStr)
                    .lte('data_transacao', nextWeekStr)
                    .order('data_transacao', { ascending: true })
                    .limit(5);

                if (groupId) {
                    billsQuery = billsQuery.eq('group_id', groupId);
                }

                const { data: bills, error: billsError } = await billsQuery;

                if (!billsError && bills) {
                    bills.forEach((bill) => {
                        const billDate = new Date(bill.data_transacao);
                        const isToday = bill.data_transacao === todayStr;
                        const isTomorrow = new Date(bill.data_transacao).getTime() === new Date(todayStr).getTime() + 86400000;

                        newAlerts.push({
                            id: `bill-${bill.id}`,
                            type: 'upcoming',
                            title: bill.descricao || 'Conta a Pagar',
                            description: isToday
                                ? 'Vence HOJE!'
                                : isTomorrow
                                    ? 'Vence amanhã'
                                    : `Vence em ${billDate.toLocaleDateString('pt-BR')}`,
                            urgency: isToday ? 'high' : isTomorrow ? 'medium' : 'low',
                            actionLabel: 'Pagar',
                            actionHref: '/transactions',
                        });
                    });
                }

                // Check for overdue bills
                let overdueQuery = supabase
                    .from('transactions')
                    .select('id, descricao, valor, data_transacao')
                    .eq('tipo', 'despesa')
                    .eq('efetivada', false)
                    .lt('data_transacao', todayStr)
                    .order('data_transacao', { ascending: true })
                    .limit(3);

                if (groupId) {
                    overdueQuery = overdueQuery.eq('group_id', groupId);
                }

                const { data: overdue, error: overdueError } = await overdueQuery;

                if (!overdueError && overdue) {
                    overdue.forEach((bill) => {
                        newAlerts.unshift({
                            id: `overdue-${bill.id}`,
                            type: 'overdue',
                            title: bill.descricao || 'Conta Vencida',
                            description: `Venceu em ${new Date(bill.data_transacao).toLocaleDateString('pt-BR')}`,
                            urgency: 'high',
                            actionLabel: 'Regularizar',
                            actionHref: '/transactions',
                        });
                    });
                }

            } catch (err) {
                console.error('Error fetching alerts:', err);
            } finally {
                setAlerts(newAlerts);
                setLoading(false);
            }
        };

        fetchAlerts();
    }, [groupId, totalBalance]);

    const getUrgencyStyles = (urgency: Alert['urgency']) => {
        switch (urgency) {
            case 'high':
                return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
            case 'medium':
                return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'low':
                return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        }
    };

    const getIcon = (type: Alert['type']) => {
        switch (type) {
            case 'overdue':
                return <AlertCircle className="h-4 w-4" />;
            case 'negative':
                return <AlertTriangle className="h-4 w-4" />;
            case 'upcoming':
                return <Calendar className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const highUrgencyCount = alerts.filter(a => a.urgency === 'high').length;

    if (loading) {
        return (
            <DashboardCard>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </CardContent>
            </DashboardCard>
        );
    }

    if (alerts.length === 0) {
        return (
            <DashboardCard>
                <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Tudo em dia! 🎉</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Nenhum alerta no momento</p>
                </CardContent>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Atenção
                    {highUrgencyCount > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 text-xs">
                            {highUrgencyCount} urgente{highUrgencyCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {alerts.slice(0, 4).map((alert) => (
                    <div
                        key={alert.id}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                            getUrgencyStyles(alert.urgency)
                        )}
                    >
                        <div className="shrink-0">
                            {getIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{alert.title}</p>
                            <p className="text-xs opacity-80">{alert.description}</p>
                        </div>
                        {alert.actionHref && (
                            <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs" asChild>
                                <a href={alert.actionHref}>
                                    {alert.actionLabel} <ChevronRight className="h-3 w-3 ml-1" />
                                </a>
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </DashboardCard>
    );
};
