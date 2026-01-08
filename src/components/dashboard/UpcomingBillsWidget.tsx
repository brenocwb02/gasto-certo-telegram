
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, ArrowRight } from "lucide-react";
import { useTransactions, useAccounts } from "@/hooks/useSupabaseData";
import { format, addDays, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { cn, parseLocalDate } from "@/lib/utils";

interface UpcomingBillsWidgetProps {
    groupId?: string | null;
}

import { PayInvoiceDialog } from "./PayInvoiceDialog";

export function UpcomingBillsWidget({ groupId }: UpcomingBillsWidgetProps) {
    const { transactions, loading, refetchTransactions } = useTransactions(groupId || undefined);
    const { accounts } = useAccounts(groupId || undefined);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // State for Payment Dialog
    const [isPayInvoiceOpen, setIsPayInvoiceOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // ... (rest of the code)

    const handlePayInvoice = (e: React.MouseEvent, invoice: any) => {
        e.stopPropagation();
        setSelectedInvoice(invoice);
        setIsPayInvoiceOpen(true);
    };

    const creditCardAccountIds = useMemo(() => {
        return new Set(accounts.filter(a => a.tipo === 'cartao').map(a => a.id));
    }, [accounts]);

    // Filter logic: Expenses, Not Paid, Due within next 7 days (or overdue)
    // EXCLUDE credit card transactions - they should appear as invoices, not individual bills
    const upcomingBills = useMemo(() => {
        if (!transactions) return [];

        const today = startOfDay(new Date());
        const next7Days = endOfDay(addDays(today, 7));

        return transactions
            .filter((t: any) => {
                if (t.tipo !== 'despesa') return false;
                if (t.efetivada) return false;

                // SKIP credit card transactions - they are part of invoices, not individual bills
                if (t.conta_origem_id && creditCardAccountIds.has(t.conta_origem_id)) {
                    return false;
                }

                // Use parseLocalDate to avoid timezone issues
                const date = parseLocalDate(t.data_transacao);

                // Check if date is today or in the future, up to 7 days
                // Also show overdue bills
                return isBefore(date, next7Days);
            })
            .sort((a, b) => {
                const dateA = parseLocalDate(a.data_transacao);
                const dateB = parseLocalDate(b.data_transacao);
                return dateA.getTime() - dateB.getTime();
            });
    }, [transactions, creditCardAccountIds]);

    // Calculate credit card invoices (virtual entries)
    // Only PRINCIPAL cards get an invoice (cards without parent_account_id)
    // Invoice includes transactions from principal + all its additional cards
    const creditCardInvoices = useMemo(() => {
        // Principal cards = cards without a parent (parent_account_id is null/undefined)
        const principalCards = accounts.filter((a: any) =>
            a.tipo === 'cartao' && !a.parent_account_id
        );

        // Additional cards grouped by their parent
        const additionalCardsByParent = new Map<string, string[]>();
        accounts.forEach((a: any) => {
            if (a.tipo === 'cartao' && a.parent_account_id) {
                const existing = additionalCardsByParent.get(a.parent_account_id) || [];
                existing.push(a.id);
                additionalCardsByParent.set(a.parent_account_id, existing);
            }
        });

        return principalCards.map(card => {
            // Get IDs of this card + all its additional cards
            const additionalCardIds = additionalCardsByParent.get(card.id) || [];
            const allCardIds = [card.id, ...additionalCardIds];

            // Get all transactions for principal + additional cards that are not yet paid
            const cardTransactions = transactions?.filter((t: any) =>
                allCardIds.includes(t.conta_origem_id) &&
                t.tipo === 'despesa' &&
                !t.efetivada
            ) || [];

            const total = cardTransactions.reduce((sum, t: any) => sum + Number(t.valor), 0);

            if (total === 0) return null;

            // Calculate due date based on closing and payment days
            // Universal rule: due date is first dia_vencimento AFTER the closing date
            const now = new Date();
            const closingDay = Number(card.dia_fechamento) || 28;
            const dueDay = Number(card.dia_vencimento) || 10;
            const currentDay = now.getDate();

            let closingMonth, closingYear;

            // Determine which closing date is relevant (current cycle)
            if (currentDay <= closingDay) {
                // We are BEFORE or ON closing day = invoice closes THIS month
                closingMonth = now.getMonth();
                closingYear = now.getFullYear();
            } else {
                // We are AFTER closing day = current cycle closes NEXT month
                closingMonth = now.getMonth() + 1;
                closingYear = now.getFullYear();
            }

            // Now calculate due date based on dueDay vs closingDay
            let dueMonth = closingMonth;
            let dueYear = closingYear;

            if (dueDay > closingDay) {
                // Due date is in the SAME month as closing (Nubank-style)
                // Ex: closing 4, due 10 → same month
                dueMonth = closingMonth;
                dueYear = closingYear;
            } else {
                // Due date is in the NEXT month after closing (Santander-style)
                // Ex: closing 28, due 10 → next month
                dueMonth = closingMonth + 1;
                dueYear = closingYear;
            }

            // Handle year overflow
            if (dueMonth > 11) {
                dueMonth = dueMonth - 12;
                dueYear = dueYear + 1;
            }

            const dueDate = new Date(dueYear, dueMonth, dueDay);

            return {
                id: `invoice-${card.id}`,
                descricao: `Fatura ${card.nome}`,
                valor: total,
                data_transacao: dueDate.toISOString().split('T')[0],
                tipo: 'fatura',
                isInvoice: true,
                cardId: card.id,
                cardName: card.nome,
                transactionCount: cardTransactions.length
            };
        }).filter(Boolean);
    }, [accounts, transactions]);

    // Combine regular bills with invoice entries
    const allBills = useMemo(() => {
        const combined = [...upcomingBills, ...creditCardInvoices].filter(Boolean) as any[];
        return combined.sort((a, b) => {
            const dateA = parseLocalDate(a.data_transacao);
            const dateB = parseLocalDate(b.data_transacao);
            return dateA.getTime() - dateB.getTime();
        });
    }, [upcomingBills, creditCardInvoices]);

    // Total value calculation (now includes invoices)
    void allBills.reduce((acc, curr) => acc + Number(curr?.valor || 0), 0);

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
    if (allBills.length === 0) {
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

    // ... (rest of filtering logic)

    return (
        <>
            <Card className="h-full border-l-4 border-l-warning shadow-sm animate-fade-in relative overflow-hidden">
                {/* ... (header code) ... */}
                <CardContent className="space-y-3">
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                        {allBills.slice(0, 5).map((bill: any) => {
                            const date = parseLocalDate(bill.data_transacao);
                            const isOverdue = isBefore(date, startOfDay(new Date()));
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isInvoice = bill.isInvoice;

                            return (
                                <div
                                    key={bill.id}
                                    className={cn(
                                        "flex flex-col p-2 rounded-lg border transition-colors cursor-pointer group",
                                        isInvoice
                                            ? "border-purple-200 bg-purple-50/50 hover:bg-purple-100/50"
                                            : "border-transparent hover:border-border hover:bg-muted/50"
                                    )}
                                    // Only open edit dialog for regular transactions, not invoices
                                    // Invoice click could maybe show details in future, now does nothing/expands
                                    onClick={() => !isInvoice && handleEdit(bill)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={cn(
                                                "flex flex-col items-center justify-center w-10 h-10 rounded-md shrink-0 border",
                                                isInvoice ? "bg-purple-100 border-purple-200 text-purple-600" :
                                                    isOverdue ? "bg-red-50 border-red-100 text-red-600" :
                                                        isToday ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-background border-border text-muted-foreground"
                                            )}>
                                                <span className="text-[10px] uppercase font-bold">{format(date, 'MMM', { locale: ptBR })}</span>
                                                <span className="text-sm font-bold">{format(date, 'dd')}</span>
                                            </div>
                                            <div className="truncate">
                                                <p className="font-medium text-sm truncate">{bill.descricao}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {isInvoice ? `${bill.transactionCount} compras` : (bill.categoria_id ? 'Categoria' : 'Sem categoria')} • {isOverdue ? 'Vencida' : isToday ? 'Vence hoje' : 'A vencer'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={cn(
                                                "font-bold text-sm whitespace-nowrap",
                                                isInvoice ? "text-purple-700" : "text-expense"
                                            )}>
                                                {formatCurrency(Number(bill.valor))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons for Invoice */}
                                    {isInvoice && (
                                        <div className="mt-2 flex justify-end pt-2 border-t border-purple-100">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                                                onClick={(e) => handlePayInvoice(e, bill)}
                                            >
                                                Pagar Fatura
                                                <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {/* ... (rest of render) ... */}
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

            <PayInvoiceDialog
                isOpen={isPayInvoiceOpen}
                onClose={() => setIsPayInvoiceOpen(false)}
                invoice={selectedInvoice}
                groupId={groupId}
            />
        </>
    );
}

