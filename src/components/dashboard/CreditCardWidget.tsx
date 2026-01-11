import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PayInvoiceDialog } from "./PayInvoiceDialog";
import { useCardInvoice } from "@/hooks/useCardInvoice";
import { ModernCreditCard } from "./ModernCreditCard";
import { getBankBrand } from "@/lib/bank-brands";
import { cn } from "@/lib/utils";
import { Receipt, Edit, CreditCard } from "lucide-react";

interface CreditCardWidgetProps {
    account: any;
    compact?: boolean; // For dashboard vs full list
    groupId?: string | null;
    allAccounts?: any[];
    onUpdate?: () => void;
    onEdit?: () => void;
}

export function CreditCardWidget({ account, compact = false, groupId, allAccounts = [], onUpdate, onEdit }: CreditCardWidgetProps) {
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

    // Fetch consolidated invoice amount
    const { invoiceAmount } = useCardInvoice(account);
    const brand = getBankBrand(account.nome || "", account.banco || "");

    // Check if this is an additional card
    const isAdditionalCard = !!account.parent_account_id;

    // Calculations
    const limit = Number(account.limite_credito) || 0; // Use limite_credito from DB

    // Aggregated Balance Logic (Total Debt)
    // If this is a principal card, we should include the balance of its additional cards
    // to reflect the TRUE total invoice status.
    let aggregatedBalance = Number(account.saldo_atual) || 0;

    if (!isAdditionalCard && allAccounts.length > 0) {
        const childCards = allAccounts.filter(a => a.parent_account_id === account.id);
        const childBalanceSum = childCards.reduce((sum, child) => sum + (Number(child.saldo_atual) || 0), 0);
        aggregatedBalance += childBalanceSum;
    }

    const totalDebt = aggregatedBalance; // Total outstanding debt (usually negative)

    // Available limit logic
    // Available = Limit - |Total Debt| (assuming debt is negative)
    // If debt is positive (credit), Available = Limit + Credit
    const availableLimit = limit + totalDebt;

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="relative group cursor-pointer" onClick={() => setIsPayDialogOpen(true)}>
                <ModernCreditCard
                    account={account}
                    brandOverride={brand}
                    invoiceAmount={invoiceAmount}
                    compact={compact}
                />
                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
                    <Button variant="secondary" className="shadow-lg font-bold">
                        {invoiceAmount > 0 ? "Pagar Fatura" : "Ver Detalhes"}
                    </Button>
                </div>
            </div>

            {/* Action Links - Show in both compact and full mode */}
            <div className={cn("flex justify-between items-center px-1 mx-auto w-full", compact ? "max-w-[280px]" : "max-w-[360px]")}>
                <Link to={`/invoices/${account.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    Ver extrato completo
                </Link>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Limite Disponível</p>
                    <p className={cn("text-sm font-semibold", availableLimit < 0 ? "text-red-500" : "text-green-600")}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(availableLimit)}
                    </p>
                </div>
            </div>

            {/* Pay Invoice Dialog */}
            <PayInvoiceDialog
                isOpen={isPayDialogOpen}
                onClose={() => setIsPayDialogOpen(false)}
                groupId={groupId}
                invoice={{
                    id: `invoice-${account.id}`,
                    cardId: account.id,
                    cardName: account.nome,
                    valor: invoiceAmount,
                    transactionCount: 0,
                    data_transacao: new Date().toISOString().split('T')[0]
                }}
                onSuccess={onUpdate}
            />
        </div>
    );
}
