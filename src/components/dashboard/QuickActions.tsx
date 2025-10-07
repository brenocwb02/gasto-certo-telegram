import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { useState } from "react";

export function QuickActions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receita' | 'despesa' | 'transferencia'>('despesa');

  const openTransactionDialog = (tipo: 'receita' | 'despesa' | 'transferencia') => {
    setTransactionType(tipo);
    setDialogOpen(true);
  };

  const quickActions = [
    {
      title: "Nova Receita",
      description: "Registrar entrada",
      icon: ArrowDownLeft,
      color: "success",
      action: () => openTransactionDialog('receita')
    },
    {
      title: "Nova Despesa", 
      description: "Registrar saída",
      icon: ArrowUpRight,
      color: "expense",
      action: () => openTransactionDialog('despesa')
    },
    {
      title: "Transferência",
      description: "Entre contas",
      icon: ArrowRightLeft,
      color: "warning",
      action: () => openTransactionDialog('transferencia')
    },
    {
      title: "Via Telegram",
      description: "Comando rápido",
      icon: MessageSquare,
      color: "primary",
      action: () => window.open('https://t.me/GastoCertoBot', '_blank')
    }
  ];

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 hover:bg-card-hover group transition-all duration-200"
              onClick={action.action}
            >
              <div className={`
                p-1.5 sm:p-2 rounded-lg transition-all duration-200 group-hover:scale-110
                ${action.color === "success" ? "bg-success/10 text-success" : ""}
                ${action.color === "expense" ? "bg-expense/10 text-expense" : ""}
                ${action.color === "warning" ? "bg-warning/10 text-warning" : ""}
                ${action.color === "primary" ? "bg-primary/10 text-primary" : ""}
              `}>
                <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="text-center">
                <p className="font-medium text-xs sm:text-sm">{action.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {transactionType === 'receita' ? 'Nova Receita' : 
                 transactionType === 'despesa' ? 'Nova Despesa' : 'Nova Transferência'}
              </DialogTitle>
            </DialogHeader>
            <TransactionForm 
              initialData={{ tipo: transactionType }}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}