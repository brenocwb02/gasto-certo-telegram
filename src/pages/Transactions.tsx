import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTransactions, useAccounts, useCategories } from "@/hooks/useSupabaseData";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { toast } from "@/hooks/use-toast";
import { useFamily } from "@/hooks/useFamily";
import { startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from "date-fns";

// Modular Components
import { TransactionStats } from "@/components/transactions/TransactionStats";
import { TransactionControlBar } from "@/components/transactions/TransactionControlBar";
import { TransactionList } from "@/components/transactions/TransactionList";

const Transactions = () => {
  const { currentGroup } = useFamily();
  const { transactions: allTransactions, loading, deleteTransaction, deleteTransactionsByTag, refetchTransactions } = useTransactions(currentGroup?.id);
  const { accounts } = useAccounts(currentGroup?.id);
  const { categories = [] } = useCategories(currentGroup?.id);
  const [searchParams] = useSearchParams();

  // --- STATE MANAGEMENT ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [accountFilter, setAccountFilter] = useState<string>(searchParams.get("accountId") || "todos");

  // Actions
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  // Sync initial account filter
  useEffect(() => {
    const accId = searchParams.get("accountId");
    if (accId) setAccountFilter(accId);
  }, [searchParams]);

  // --- HANDLERS ---
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("todos");
    setCategoryFilter("todos");
    setAccountFilter("todos");
    // Optionally reset date to today? No, keeps context.
  };

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "todos" || categoryFilter !== "todos" || accountFilter !== "todos";

  // --- FILTERING LOGIC ---
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // 1. Month Filter (Primary)
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    // Check if account is active and credit card logic is needed (skipped for simplicity in this version V2, sticking to strict Calendar Month for consistency with the requested UI)
    // If user wants Invoice View, we might need a toggle later. For now: Calendar Month.
    filtered = filtered.filter(t => {
      const tDate = new Date(t.data_transacao);
      // Simple month check using date-fns or comparison
      return isSameMonth(tDate, currentDate) && tDate.getFullYear() === currentDate.getFullYear();
    });

    // 2. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.descricao.toLowerCase().includes(lower) ||
        t.valor.toString().includes(lower)
      );
    }

    // 3. Type
    if (typeFilter !== "todos") {
      filtered = filtered.filter(t => t.tipo === typeFilter);
    }

    // 4. Category
    if (categoryFilter !== "todos") {
      filtered = filtered.filter(t => t.categoria_id === categoryFilter);
    }

    // 5. Account
    if (accountFilter !== "todos") {
      filtered = filtered.filter(t => t.conta_origem_id === accountFilter || t.conta_destino_id === accountFilter);
    }

    // Sort by date desc
    return filtered.sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());

  }, [allTransactions, currentDate, searchTerm, typeFilter, categoryFilter, accountFilter]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const val = Number(t.valor);
      if (t.tipo === 'receita') acc.receitas += val;
      if (t.tipo === 'despesa') acc.despesas += val;
      return acc;
    }, { receitas: 0, despesas: 0 });
  }, [filteredTransactions]);

  const saldo = stats.receitas - stats.despesas;

  // --- ACTIONS ---
  const handleEdit = (t: any) => {
    setSelected(t);
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(selected.id);
      toast({ title: "Sucesso", description: "Transação excluída." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir." });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setSelected(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selected) return;
    const groupTag = selected.tags?.find((t: string) => t.startsWith('installment_group:'));
    if (!groupTag) return;

    setIsDeleting(true);
    try {
      if (deleteTransactionsByTag) await deleteTransactionsByTag(groupTag);
      toast({ title: "Sucesso", description: "Parcelamento excluído." });
    } catch {
      toast({ title: "Erro", description: "Erro ao excluir parcelas." });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  // Helpers for Lists
  const getCategoryName = (id: string | null) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.nome : 'Sem categoria';
  };

  const getAccountName = (id: string | null) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.nome : 'Conta desconhecida';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas entradas e saídas.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" /> Nova Transação
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

      {/* Stats Cards */}
      <TransactionStats
        receitas={stats.receitas}
        despesas={stats.despesas}
        saldo={saldo}
        loading={loading}
      />

      {/* Controls (Search + Month + Filter) */}
      <div className="p-1">
        <TransactionControlBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          categories={categories}
          accounts={accounts}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* List */}
      <TransactionList
        transactions={filteredTransactions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(t) => { setSelected(t); setDeleteOpen(true); }}
        getCategoryName={getCategoryName}
        getAccountName={getAccountName}
      />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
          {selected && (
            <TransactionForm
              mode="edit"
              initialData={selected}
              groupId={currentGroup?.id}
              onSuccess={() => { setEditOpen(false); setSelected(null); }}
              onCancel={() => { setEditOpen(false); setSelected(null); }}
              onRefetch={refetchTransactions}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.tags?.some((t: string) => t.startsWith('installment_group:'))
                ? "Esta transação faz parte de um parcelamento. Como deseja excluir?"
                : "Tem certeza? Esta ação é irreversível."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {selected?.tags?.some((t: string) => t.startsWith('installment_group:')) && (
              <Button variant="destructive" onClick={handleDeleteGroup} disabled={isDeleting}>
                Excluir Parcelamento (Todas)
              </Button>
            )}
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Excluir Apenas Esta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Transactions;
