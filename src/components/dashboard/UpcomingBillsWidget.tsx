
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, ArrowRight } from "lucide-react";
import { useTransactions, useAccounts } from "@/hooks/useSupabaseData";
import { format, addDays, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
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

            <TransactionForm
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                transaction={selectedTransaction}
                onSuccess={() => {
                    refetchTransactions();
                    setIsEditDialogOpen(false);
                }}
            />

            <PayInvoiceDialog
                isOpen={isPayInvoiceOpen}
                onClose={() => setIsPayInvoiceOpen(false)}
                invoice={selectedInvoice}
            />
        </>
    );
}

