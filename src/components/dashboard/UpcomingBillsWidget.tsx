
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, ArrowRight } from "lucide-react";
import { useTransactions } from "@/hooks/useSupabaseData";
import { format, addDays, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { cn, parseLocalDate } from "@/lib/utils";

interface UpcomingBillsWidgetProps {
    groupId?: string | null;
}

export function UpcomingBillsWidget({ groupId }: UpcomingBillsWidgetProps) {
    const { transactions, loading, refetchTransactions } = useTransactions(groupId || undefined);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Filter logic: Expenses, Not Paid, Due within next 7 days (or overdue)
    // We include overdue just in case, or maybe stricly "Next 7 days"?
    // Let's stick to "Next 7 days" + Today.
    const upcomingBills = useMemo(() => {
        if (!transactions) return [];

        const today = startOfDay(new Date());
        const next7Days = endOfDay(addDays(today, 7));

        return transactions
            .filter((t: any) => {
                if (t.tipo !== 'despesa') return false;
                if (t.efetivada) return false;

                // Use parseLocalDate to avoid timezone issues
                const date = parseLocalDate(t.data_transacao);

                // Check if date is today or in the future, up to 7 days
                // Also check if it's overdue? Usually "Contas a Pagar" implies overdue too.
                // Let's show overdue + next 7 days.
                return isBefore(date, next7Days); // Include overdue by just checking end boundary?
                // Wait, if it's very old, do we show it? Maybe limit to last 30 days overdue?
                // Simplest: Date <= next7days && Date >= today? 
                // Or Date <= next7days (implies showing all overdue). 
                // Let's show all overdue + next 7 days to be safe, high visibility.
            })
            .sort((a, b) => {
                const dateA = parseLocalDate(a.data_transacao);
                const dateB = parseLocalDate(b.data_transacao);
                return dateA.getTime() - dateB.getTime();
            });
    }, [transactions]);

    // Total value calculation
    const totalDue = upcomingBills.reduce((acc, curr) => acc + Number(curr.valor), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleEdit = (transaction: any) => {
        setSelectedTransaction(transaction);
        setIsEditDialogOpen(true);
    };

    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
                        Contas a Pagar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-12 bg-muted rounded animate-pulse" />
                    <div className="h-12 bg-muted rounded animate-pulse" />
                </CardContent>
            </Card>
        )
    }

    // Empty state
    if (upcomingBills.length === 0) {
        return (
            <Card className="h-full border-l-4 border-l-success bg-gradient-to-r from-background to-green-50/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
                        Contas a Pagar
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3 text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="font-medium">Tudo em dia!</p>
                    <p className="text-sm text-muted-foreground">Nenhuma conta pendente para os próximos 7 dias.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="h-full border-l-4 border-l-warning shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-warning" />
                            Contas a Pagar
                        </CardTitle>
                        <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20">
                            {upcomingBills.length} pendentes
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total para os próximos 7 dias
                    </p>
                    <p className="text-2xl font-bold text-expense">
                        {formatCurrency(totalDue)}
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                        {upcomingBills.slice(0, 5).map(bill => {
                            const date = parseLocalDate(bill.data_transacao);
                            const isOverdue = isBefore(date, startOfDay(new Date()));
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={bill.id}
                                    className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                                    onClick={() => handleEdit(bill)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn(
                                            "flex flex-col items-center justify-center w-10 h-10 rounded-md shrink-0 border",
                                            isOverdue ? "bg-red-50 border-red-100 text-red-600" :
                                                isToday ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-background border-border text-muted-foreground"
                                        )}>
                                            <span className="text-[10px] uppercase font-bold">{format(date, 'MMM', { locale: ptBR })}</span>
                                            <span className="text-sm font-bold">{format(date, 'dd')}</span>
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium text-sm truncate">{bill.descricao}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {bill.categoria_id ? 'Categoria' : 'Sem categoria'} • {isOverdue ? 'Vencida' : isToday ? 'Vence hoje' : 'A vencer'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm text-expense">{formatCurrency(Number(bill.valor))}</p>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute right-2">
                                            <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {upcomingBills.length > 5 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8">
                            Ver mais {upcomingBills.length - 5} contas
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Conta</DialogTitle>
                    </DialogHeader>
                    {selectedTransaction && (
                        <TransactionForm
                            mode="edit"
                            initialData={selectedTransaction}
                            groupId={groupId || undefined}
                            onRefetch={refetchTransactions}
                            onSuccess={() => {
                                setIsEditDialogOpen(false);
                                setSelectedTransaction(null);
                            }}
                            onCancel={() => {
                                setIsEditDialogOpen(false);
                                setSelectedTransaction(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
