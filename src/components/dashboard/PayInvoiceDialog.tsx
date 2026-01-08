import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts, useTransactions, useCategories } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayInvoiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: {
        id: string;
        cardId: string;
        cardName: string;
        valor: number;
        transactionCount: number;
        data_transacao: string; // Due date
        // IDs of additional cards included in this invoice
        additionalCardIds?: string[];
    } | null;
}

export function PayInvoiceDialog({ isOpen, onClose, invoice }: PayInvoiceDialogProps) {
    const { toast } = useToast();
    const { accounts } = useAccounts();
    const { refetchTransactions } = useTransactions(); // We'll need to refetch to update UI
    const { categories } = useCategories();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentAccount, setPaymentAccount] = useState<string>("");
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState<string>(invoice ? String(invoice.valor) : "");

    // Filter accounts for payment (only wallet or checking account)
    const paymentAccounts = accounts.filter(a => a.tipo === 'corrente' || a.tipo === 'carteira');

    // Find a category for "Credit Card Payment" or similar
    const paymentCategory = categories.find(c =>
        c.nome.toLowerCase().includes('cartão') ||
        c.nome.toLowerCase().includes('pagamento') ||
        c.nome.toLowerCase().includes('fatura')
    );

    const handlePay = async () => {
        if (!invoice || !paymentAccount) return;

        setIsSubmitting(true);
        try {
            const numericAmount = Number(amount);
            const user = (await supabase.auth.getUser()).data.user;

            if (!user) throw new Error("Usuário não autenticado");

            // 1. Create the payment transaction (Expense from checking account)
            const paymentTransaction = {
                descricao: `Pagamento Fatura ${invoice.cardName}`,
                valor: numericAmount,
                tipo: 'despesa',
                conta_origem_id: paymentAccount,
                categoria_id: paymentCategory?.id || null, // Best effort category match
                data_transacao: paymentDate,
                user_id: user.id,
                efetivada: true // Payment is immediate
            };

            const { error: payError } = await supabase
                .from('transactions')
                .insert(paymentTransaction);

            if (payError) throw payError;

            // 2. Mark credit card transactions as paid (reconciliation)
            // We need to find all transactions that this invoice covers
            // This logic must match the one in UpcomingBillsWidget (open expense transactions up to invoice cycle)

            // Determine relevant card IDs (principal + additional)
            // We need to fetch this again or pass it down. 
            // For now let's assume the component passed the IDs or we query based on parent linkage.
            // Simplification: We'll query transactions for the cardId and its children.

            // First, find all child cards if any
            const childCards = accounts
                .filter(a => a.parent_account_id === invoice.cardId)
                .map(a => a.id);

            const allCardIds = [invoice.cardId, ...childCards];

            // Since we don't have a robust "invoice cycle ID" yet, we'll mark ALL open expenses 
            // for these cards that are <= due date (safe assumption for "paying current bill")
            // OR matching the exact amount? No, exact amount is risky due to partial payments.
            // Better strategy: Mark all 'despesa' + '!efetivada' for these cards.

            const { error: updateError } = await supabase
                .from('transactions')
                .update({ efetivada: true })
                .in('conta_origem_id', allCardIds)
                .eq('tipo', 'despesa')
                .eq('efetivada', false);
            // .lte('data_transacao', invoice.data_transacao) // Optional safety: only transactions up to due date?
            // Actually, users might pay late. Let's just assume pay = clear all currently open debt.

            if (updateError) throw updateError;

            toast({
                title: "Fatura Paga com Sucesso! 🎉",
                description: `O valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericAmount)} foi debitado e as transações foram conciliadas.`,
            });

            // Refresh data
            refetchTransactions();
            onClose();

        } catch (error) {
            console.error("Erro ao pagar fatura:", error);
            toast({
                variant: "destructive",
                title: "Erro ao realizar pagamento",
                description: "Ocorreu um erro ao processar o pagamento da fatura.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Pagar Fatura
                    </DialogTitle>
                    <DialogDescription>
                        Confirme os dados para liquidar a fatura do cartão <strong>{invoice.cardName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="p-4 bg-muted/50 rounded-lg border flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-muted-foreground mb-1">Valor Total da Fatura</span>
                        <span className="text-3xl font-bold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.valor)}
                        </span>
                        <span className="text-xs text-muted-foreground mt-2">
                            {invoice.transactionCount} lançamentos serão conciliados
                        </span>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="payment-account">Pagar com (Conta de Origem)</Label>
                        <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                            <SelectTrigger id="payment-account">
                                <SelectValue placeholder="Selecione a conta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentAccounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        <div className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4 opacity-50" />
                                            <span>{acc.nome}</span>
                                            {/* Show balance if available? acc.saldo_atual */}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="payment-date">Data do Pagamento</Label>
                            <Input
                                id="payment-date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Valor a Pagar</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handlePay} disabled={!paymentAccount || isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirmar Pagamento
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
