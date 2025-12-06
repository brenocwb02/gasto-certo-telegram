import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
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
import { startOfMonth, endOfMonth } from "date-fns";

const Transactions = () => {
  const { currentGroup } = useFamily();
  const { transactions: allTransactions, loading, deleteTransaction } = useTransactions(currentGroup?.id);
  const { accounts } = useAccounts(currentGroup?.id);
  const { categories } = useCategories(currentGroup?.id);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [accountFilter, setAccountFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<string>("mes");
  const [showFilters, setShowFilters] = useState(false);

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
    if (dateFilter === "mes") {
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

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("todos");
    setCategoryFilter("todos");
    setAccountFilter("todos");
    setDateFilter("mes");
  };

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
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find((c) => c.id === categoryId);
    return category?.nome || "Categoria não encontrada";
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return "Conta não encontrada";
    const account = accounts.find((a) => a.id === accountId);
    return account?.nome || "Conta não encontrada";
  };

  const hasActiveFilters = searchTerm || typeFilter !== "todos" || categoryFilter !== "todos" || accountFilter !== "todos" || dateFilter !== "mes";

  return (
    <>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transações</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {currentGroup ? `Visualizando: ${currentGroup.name}` : "Suas transações pessoais"}
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
                groupId={currentGroup?.id}
              />
            </DialogContent>
          </Dialog>
        </div>

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
                  <p className="text-sm text-muted-foreground">Saldo</p>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {getCategoryName(transaction.categoria_id)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getAccountName(transaction.conta_origem_id)}
                        {transaction.tipo === "transferencia" &&
                          transaction.conta_destino_id &&
                          ` → ${getAccountName(transaction.conta_destino_id)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-semibold",
                        transaction.tipo === "receita" && "text-success",
                        transaction.tipo === "despesa" && "text-expense",
                        transaction.tipo === "transferencia" && "text-warning"
                      )}
                    >
                      {transaction.tipo === "receita"
                        ? "+"
                        : transaction.tipo === "despesa"
                          ? "-"
                          : ""}
                      {formatAmount(Number(transaction.valor))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.data_transacao)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelected(transaction);
                          setDeleteOpen(true);
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
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
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Transactions;
