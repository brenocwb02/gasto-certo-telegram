import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions, useAccounts, useCategories } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentTransactions() {
  const { transactions, loading } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "receita":
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "despesa":
        return <ArrowUpRight className="h-4 w-4 text-expense" />;
      case "transferencia":
        return <ArrowRightLeft className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    const category = categories.find(c => c.id === categoryId);
    return category?.nome || 'Categoria não encontrada';
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return 'Conta não encontrada';
    const account = accounts.find(a => a.id === accountId);
    return account?.nome || 'Conta não encontrada';
  };

  return (
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        <Button variant="outline" size="sm">
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma transação encontrada</p>
            <p className="text-xs mt-1">Crie sua primeira transação para começar</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-card-hover transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getTransactionIcon(transaction.tipo)}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {transaction.descricao}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5"
                    >
                      {getCategoryName(transaction.categoria_id)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getAccountName(transaction.conta_origem_id)}
                      {transaction.tipo === 'transferencia' && transaction.conta_destino_id && 
                        ` → ${getAccountName(transaction.conta_destino_id)}`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn(
                    "font-semibold",
                    transaction.tipo === "receita" && "text-success",
                    transaction.tipo === "despesa" && "text-expense",
                    transaction.tipo === "transferencia" && "text-warning"
                  )}>
                    {transaction.tipo === "receita" ? "+" : transaction.tipo === "despesa" ? "-" : ""}
                    {formatAmount(Number(transaction.valor))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.data_transacao)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}