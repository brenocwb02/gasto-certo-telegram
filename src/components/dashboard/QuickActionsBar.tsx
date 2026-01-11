import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard, CardContent } from "./DashboardCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { TrendingUp, TrendingDown, ArrowRightLeft, Plus } from "lucide-react";

interface QuickActionsBarProps {
    groupId?: string;
    disabled?: boolean;
}

export const QuickActionsBar = ({ groupId, disabled = false }: QuickActionsBarProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'receita' | 'despesa' | 'transferencia'>('despesa');

    const openTransactionDialog = (tipo: 'receita' | 'despesa' | 'transferencia') => {
        if (disabled) return;
        setTransactionType(tipo);
        setDialogOpen(true);
    };

    const actions = [
        {
            label: "Receita",
            icon: TrendingUp,
            type: 'receita' as const,
            color: "text-emerald-500",
            bgColor: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50",
        },
        {
            label: "Despesa",
            icon: TrendingDown,
            type: 'despesa' as const,
            color: "text-rose-500",
            bgColor: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50",
        },
        {
            label: "Transferir",
            icon: ArrowRightLeft,
            type: 'transferencia' as const,
            color: "text-blue-500",
            bgColor: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50",
        },
    ];

    return (
        <>
            <DashboardCard>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Ações Rápidas</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {actions.map((action) => (
                            <Button
                                key={action.type}
                                variant="ghost"
                                size="sm"
                                className={`flex flex-col items-center gap-1.5 h-auto py-3 ${action.bgColor} border-0`}
                                onClick={() => openTransactionDialog(action.type)}
                                disabled={disabled}
                            >
                                <action.icon className={`h-5 w-5 ${action.color}`} />
                                <span className="text-xs font-medium">{action.label}</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </DashboardCard>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <TransactionForm
                        initialData={{ tipo: transactionType }}
                        onSuccess={() => setDialogOpen(false)}
                        onCancel={() => setDialogOpen(false)}
                        groupId={groupId}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};
