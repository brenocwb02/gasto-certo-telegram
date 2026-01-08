import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; // Added import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Badge removed - unused
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// DropdownMenu removed - unused
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTransactions,
  useAccounts,
  useCategories,
} from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { toast } from "@/hooks/use-toast";
import { useFamily } from "@/hooks/useFamily";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import { TransactionItem } from "@/components/transactions/TransactionItem";

const Transactions = () => {
  const { currentGroup } = useFamily();
  const { transactions: allTransactions, loading, deleteTransaction, deleteTransactionsByTag, refetchTransactions } = useTransactions(currentGroup?.id);
  const { accounts } = useAccounts(currentGroup?.id);
  const { categories = [] } = useCategories(currentGroup?.id);

  const [searchParams] = useSearchParams(); // Added hook

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  // Initialize accountFilter from URL param "accountId" if present
  const [accountFilter, setAccountFilter] = useState<string>(searchParams.get("accountId") || "todos");
  const [dateFilter, setDateFilter] = useState<string>("mes");
  const [showFilters, setShowFilters] = useState(false);

  // Sync filter with URL params when they change
  useEffect(() => {
    const accId = searchParams.get("accountId");
    if (accId) {
      setAccountFilter(accId);
      // Opcional: Abrir os filtros automaticamente para o usuário ver
      setShowFilters(true);
    }
  }, [searchParams]);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    document.title = "Transações | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Gerencie suas transações financeiras: visualize, edite e organize suas receitas e despesas."
      );
    }
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((t) =>
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== "todos") {
      filtered = filtered.filter((t) => t.tipo === typeFilter);
    }

    // Category filter
    if (categoryFilter !== "todos") {
      filtered = filtered.filter((t) => t.categoria_id === categoryFilter);
    }

    // Account filter
    if (accountFilter !== "todos") {
      filtered = filtered.filter((t) =>
        t.conta_origem_id === accountFilter || t.conta_destino_id === accountFilter
      );
    }

    // Date filter
    const now = new Date();

    // Special handling for Credit Card Invoice Cycle
    const selectedAcc = accounts.find(a => a.id === accountFilter);
    const isCreditCard = selectedAcc?.tipo === 'cartao';
    const closingDay = Number(selectedAcc?.dia_fechamento);

    if (dateFilter === "mes" && isCreditCard && closingDay) {
      // Calculate Invoice Cycle
      // If today <= closingDay, current invoice closes this month.
      // Start: Previous Month (closingDay + 1)
      // End: This Month (closingDay)

      // If today > closingDay, current invoice closes next month.
      // Start: This Month (closingDay + 1)
      // End: Next Month (closingDay)

      // However, the "Month" filter usually implies "Show me transactions relevant to NOW".
      // Let's assume we want the "Open/Current" invoice relative to today.

      let start, end;
      const currentDay = now.getDate();

      if (currentDay <= closingDay) {
        // Cycle closes THIS month
        // Example: Closing 28. Today 15. Cycle: Last Month 29 to This Month 28.
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), closingDay, 23, 59, 59, 999));
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, closingDay + 1, 0, 0, 0, 0));
      } else {
        // Cycle closes NEXT month
        // Example: Closing 28. Today 29. Cycle: This Month 29 to Next Month 28.
        end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, closingDay, 23, 59, 59, 999));
        start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), closingDay + 1, 0, 0, 0, 0));
      }

      filtered = filtered.filter((t) => {
        const date = new Date(t.data_transacao);
        // Compare timestamps to handle timezone differences robustly
        return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
      });

    } else if (dateFilter === "mes") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      filtered = filtered.filter((t) => {
        const date = new Date(t.data_transacao);
        return date >= start && date <= end;
      });
    } else if (dateFilter === "7dias") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter((t) => new Date(t.data_transacao) >= sevenDaysAgo);
    } else if (dateFilter === "30dias") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filtered = filtered.filter((t) => new Date(t.data_transacao) >= thirtyDaysAgo);
    } else if (dateFilter === "6meses") {
      const start = startOfMonth(now);
      const end = addMonths(endOfMonth(now), 6);
      filtered = filtered.filter((t) => {
        const date = new Date(t.data_transacao);
        return date >= start && date <= end;
      });
    } else if (dateFilter === "12meses") {
      const start = startOfMonth(now);
      const end = addMonths(endOfMonth(now), 12);
      filtered = filtered.filter((t) => {
        const date = new Date(t.data_transacao);
        return date >= start && date <= end;
      });
    }

    return filtered;
  }, [allTransactions, searchTerm, typeFilter, categoryFilter, accountFilter, dateFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const receitas = filteredTransactions
      .filter((t) => t.tipo === "receita")
      .reduce((sum, t) => sum + Number(t.valor), 0);
    const despesas = filteredTransactions
      .filter((t) => t.tipo === "despesa")
      .reduce((sum, t) => sum + Number(t.valor), 0);
    const saldo = receitas - despesas;

    return { receitas, despesas, saldo, total: filteredTransactions.length };
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (transaction: any) => {
    setSelected(transaction);
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    setIsDeleting(true);
    try {
      // Check if it's part of a group (has a tag starting with installment_group:)
      const groupTag = selected.tags?.find((t: string) => t.startsWith('installment_group:'));

      // If user chose to delete all (we'll implement the UI choice in a moment, for now default to single unless logic added)
      // Actually, let's change the logic: If has group tag, we should ASK.
      // But for this step, let's assume we pass a flag or handle it in the UI.
      // Let's modify the dialog content below to include a choice.
      // For now, let's just use single delete here and add a "deleteAll" param or state?
      // Better: Let's create a separate function or modify this one to check a state.
      // Let's assume we added a checkbox state in the dialog.

      await deleteTransaction(selected.id);
      toast({ title: "Transação excluída", description: "A transação foi removida com sucesso." });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir transação",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selected) return;
    const groupTag = selected.tags?.find((t: string) => t.startsWith('installment_group:'));
    if (!groupTag || !deleteTransactionsByTag) return;

    setIsDeleting(true);
    try {
      await deleteTransactionsByTag(groupTag);
      toast({ title: "Transações excluídas", description: "Todas as parcelas foram removidas." });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir parcelas",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("todos");
    setCategoryFilter("todos");
    setAccountFilter("todos");
    setDateFilter("mes");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(amount));
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return "Categoria não encontrada";

    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      return parent ? `${parent.nome} / ${category.nome}` : category.nome;
    }

    return category.nome;
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return "Conta não encontrada";
    const account = accounts.find((a) => a.id === accountId);
    return account?.nome || "Conta não encontrada";
  };

  const hasActiveFilters = searchTerm || typeFilter !== "todos" || categoryFilter !== "todos" || accountFilter !== "todos" || dateFilter !== "mes";

  const selectedAccount = useMemo(() => {
    if (accountFilter === "todos") return null;
    return accounts.find((a) => a.id === accountFilter);
  }, [accountFilter, accounts]);

  return (
    <>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transações</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedAccount
                ? `Visualizando: ${selectedAccount.nome}`
                : (currentGroup ? `Visualizando: ${currentGroup.name}` : "Suas transações pessoais")}
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <TransactionForm
                onSuccess={() => setCreateOpen(false)}
                onCancel={() => setCreateOpen(false)}
                onRefetch={refetchTransactions}
                groupId={currentGroup?.id}
              />
            </DialogContent>
          </Dialog>
        </div>

        {selectedAccount && (
          <div className="bg-muted/50 p-4 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Saldo Atual da Conta</p>
                <p className={cn("text-2xl font-bold", selectedAccount.saldo_atual >= 0 ? "text-success" : "text-expense")}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAccount.saldo_atual)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Saldo Inicial: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAccount.saldo_inicial)}
                </p>
              </div>
            </div>
            {selectedAccount.tipo === 'cartao' && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Limite Disponível</p>
                <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(selectedAccount.limite) || 0) + Number(selectedAccount.saldo_atual))}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-2xl font-bold text-success">
                    {formatAmount(stats.receitas)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-success opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-2xl font-bold text-expense">
                    {formatAmount(stats.despesas)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-expense opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <p className={cn("text-2xl font-bold", stats.saldo >= 0 ? "text-success" : "text-expense")}>
                    {formatAmount(stats.saldo)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">transações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filtros</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? "Ocultar" : "Mostrar"} Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                      <SelectItem value="mes">Este mês</SelectItem>
                      <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                      <SelectItem value="6meses">Próximos 6 Meses</SelectItem>
                      <SelectItem value="12meses">Próximos 12 Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select value={accountFilter} onValueChange={setAccountFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? "Transação" : "Transações"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
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
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Nenhuma transação encontrada</p>
              <p className="text-sm mt-1">
                {hasActiveFilters
                  ? "Tente ajustar os filtros ou limpar para ver mais resultados"
                  : "Crie sua primeira transação para começar"}
              </p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={(t) => {
                  setSelected(t);
                  setDeleteOpen(true);
                }}
                getCategoryName={getCategoryName}
                getAccountName={getAccountName}
              />
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {selected && (
            <TransactionForm
              mode="edit"
              initialData={selected}
              groupId={currentGroup?.id}
              onRefetch={refetchTransactions}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selected?.tags?.some((t: string) => t.startsWith('installment_group:'))
                ? "Excluir Parcelamento?"
                : "Excluir transação"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.tags?.some((t: string) => t.startsWith('installment_group:'))
                ? "Esta transação faz parte de um parcelamento. Você deseja excluir apenas esta parcela ou todas as parcelas associadas?"
                : "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>

            {selected?.tags?.some((t: string) => t.startsWith('installment_group:')) && (
              <Button
                variant="destructive"
                onClick={handleDeleteGroup}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir Todas"}
              </Button>
            )}

            <AlertDialogAction
              className={selected?.tags?.some((t: string) => t.startsWith('installment_group:'))
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {selected?.tags?.some((t: string) => t.startsWith('installment_group:'))
                ? (isDeleting ? "Excluindo..." : "Apenas esta")
                : (isDeleting ? "Excluindo..." : "Excluir")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Transactions;
