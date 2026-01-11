import { useState } from "react";
import { DashboardCard, CardContent, CardHeader, CardTitle } from "./DashboardCard";
import { Button } from "@/components/ui/button";
import { useTransactions, useAccounts, useCategories } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MoreHorizontal, CalendarClock, CreditCard } from "lucide-react";
import { cn, parseLocalDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function RecentTransactions({ showViewAllButton = true, title = "Transações Recentes", limit = 5, groupId }: { showViewAllButton?: boolean; title?: string; limit?: number; groupId?: string }) {
  const { transactions: allTransactions, loading, deleteTransaction } = useTransactions(groupId);

  // Limit transactions for dashboard view
  const transactions = allTransactions.slice(0, limit);
  const { accounts } = useAccounts(groupId);
  const { categories } = useCategories(groupId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const handleEdit = (transaction: any) => {
    setSelected(transaction);
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(selected.id);
      toast({ title: 'Transação excluída', description: 'A transação foi removida com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir transação',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.nome : 'Categoria não encontrada';
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return 'Conta não encontrada';
    const account = accounts.find(a => a.id === accountId);
    return account?.nome || 'Conta não encontrada';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) return 'Hoje';
    if (isYesterday) return 'Ontem';

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const parseInstallment = (descricao: string): { current: number; total: number } | null => {
    const match = descricao.match(/\((\d+)\/(\d+)\)$/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return null;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "receita":
        return <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"><ArrowDownLeft className="h-4 w-4" /></div>;
      case "despesa":
        return <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"><ArrowUpRight className="h-4 w-4" /></div>;
      case "transferencia":
        return <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><ArrowRightLeft className="h-4 w-4" /></div>;
      default:
        return null;
    }
  };

  return (
    <DashboardCard className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b bg-muted/10">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {showViewAllButton && (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-2" asChild>
            <Link to="/transactions" className="flex items-center gap-1">
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="bg-muted/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6 opacity-50" />
            </div>
            <p>Nenhuma transação recente</p>
            <p className="text-xs mt-1">Suas movimentações aparecerão aqui</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map((t) => {
              const installmentInfo = parseInstallment(t.descricao || '');
              const categoryName = getCategoryName(t.categoria_id);
              const accountName = getAccountName(t.conta_origem_id);

              return (
                <div
                  key={t.id}
                  className="group flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleEdit(t)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-4">
                    {getTransactionIcon(t.tipo)}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate max-w-[180px] sm:max-w-xs leading-none mb-1.5 flex items-center gap-2">
                        {t.descricao}
                      </p>

                      {/* Badges Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {!t.efetivada && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] h-5 px-1.5 gap-1 shadow-none">
                            <CalendarClock className="h-3 w-3" />
                          </Badge>
                        )}
                        {installmentInfo && installmentInfo.total > 1 && (
                          <Badge variant="outline" className="text-purple-600 border-purple-600 text-[10px] h-5 px-1.5 gap-1 shadow-none">
                            <CreditCard className="h-3 w-3" /> {installmentInfo.current}/{installmentInfo.total}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground hover:bg-muted font-normal shadow-none">
                          {categoryName}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline-block border-l border-border pl-2">
                          {accountName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-2">
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold text-sm",
                        t.tipo === 'receita' && "text-green-600 dark:text-green-400",
                        t.tipo === 'despesa' && "text-red-600 dark:text-red-400",
                        t.tipo === 'transferencia' && "text-blue-600 dark:text-blue-400"
                      )}>
                        {t.tipo === 'despesa' ? '-' : '+'}
                        {formatAmount(Number(t.valor))}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(t.data_transacao)}
                      </p>
                    </div>

                    {/* Action Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(t)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                            setSelected(t);
                            setDeleteOpen(true);
                          }}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {selected && (
            <TransactionForm
              mode="edit"
              initialData={selected}
              groupId={groupId}
              onSuccess={() => {
                setEditOpen(false);
                setSelected(null);
              }}
              onCancel={() => {
                setEditOpen(false);
                setSelected(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardCard>
  );
}