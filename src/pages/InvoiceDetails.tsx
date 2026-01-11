
import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addMonths, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Lock, CreditCard, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/dashboard/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";

const InvoiceDetails = () => {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [card, setCard] = useState<any>(null);
    const [familyCards, setFamilyCards] = useState<any[]>([]); // Principal + Dependents
    const [transactions, setTransactions] = useState<any[]>([]);
    const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Data Directly (Card + Dependents + Transactions + Categories)
    const fetchData = useCallback(async () => {
        if (!cardId) return;

        setLoading(true);
        try {
            // A. Fetch Principal Card
            const { data: cardData, error: cardError } = await supabase
                .from('accounts')
                .select('*')
                .eq('id', cardId)
                .single();

            if (cardError) throw cardError;
            if (!cardData) throw new Error("Cartão não encontrado");

            // B. Fetch Dependents (Additional Cards)
            // Using 'parent_account_id' which is the standard in this app.
            const { data: dependentsData } = await supabase
                .from('accounts')
                .select('*')
                .eq('parent_account_id', cardId);

            const allCards = [cardData, ...(dependentsData || [])];
            setCard(cardData);
            setFamilyCards(allCards);

            const allCardIds = allCards.map(c => c.id);

            // C. Fetch Transactions for ALL Cards in the family
            // Construct OR filter for multiple IDs. 
            // .in() is cleaner: conta_origem_id.in.(id1,id2)
            const idsString = `(${allCardIds.join(',')})`;
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .or(`conta_origem_id.in.${idsString},conta_destino_id.in.${idsString}`)
                .order('data_transacao', { ascending: false });

            if (transError) throw transError;

            let transactionsWithProfiles = transData || [];

            // Hydrate Profiles Manually
            if (transactionsWithProfiles.length > 0) {
                const userIds = [...new Set(transactionsWithProfiles.map((t: any) => t.user_id))];
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('user_id, nome, avatar_url')
                    .in('user_id', userIds);

                if (profilesData) {
                    const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));
                    transactionsWithProfiles = transactionsWithProfiles.map((t: any) => ({
                        ...t,
                        created_by_profile: profilesMap.get(t.user_id) || null
                    }));
                }
            }

            setTransactions(transactionsWithProfiles);

            // D. Fetch Categories (Use Group ID if any, else User ID)
            let catQuery = supabase.from('categories').select('*');
            if (cardData.group_id) {
                catQuery = catQuery.eq('group_id', cardData.group_id);
            } else {
                catQuery = catQuery.eq('user_id', cardData.user_id).is('group_id', null);
            }

            const { data: catData, error: catError } = await catQuery;
            if (!catError && catData) {
                setCategories(catData);
            }


        } catch (err: any) {
            console.error("Error fetching invoice data:", err);
            setError(err.message || "Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }, [cardId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Delete Transaction - Shows confirmation dialog
    const handleDeleteTransaction = (transaction: any) => {
        setTransactionToDelete(transaction);
    };

    // Confirm Delete - Actually deletes the transaction
    const confirmDelete = async () => {
        if (!transactionToDelete) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionToDelete.id);

            if (error) throw error;

            toast({
                title: "Transação excluída",
                description: "A transação foi removida com sucesso.",
            });

            // Refresh data
            fetchData();
        } catch (err: any) {
            toast({
                title: "Erro ao excluir",
                description: err.message || "Não foi possível excluir a transação.",
                variant: "destructive",
            });
        } finally {
            setTransactionToDelete(null);
        }
    };


    const handleEdit = (transaction: any) => {
        setEditingTransaction(transaction);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        setEditingTransaction(null);
        fetchData();
    };


    const closingDay = card?.dia_fechamento || 1;
    const dueDay = card?.dia_vencimento || 10;

    // 2. State for Selected Invoice Month
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (card) {
            const today = new Date();
            let base = today;
            if (today.getDate() >= (card.dia_fechamento || 1)) {
                base = addMonths(today, 1);
            }
            if ((card.dia_vencimento || 10) < (card.dia_fechamento || 1)) {
                base = addMonths(base, 1);
            }
            setSelectedDate(base);
        }
    }, [card?.id]);


    // 3. Calculation of Cycle Dates
    const cycle = useMemo(() => {
        const cDay = card?.dia_fechamento || 1;
        const dDay = card?.dia_vencimento || 10;

        const due = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dDay);

        let closing = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), cDay);
        if (dDay < cDay) {
            closing = subMonths(closing, 1);
        }

        // Opening Date is Closing Date - 1 Month + 1 Day
        const previousClosing = subMonths(closing, 1);
        const opening = new Date(previousClosing);
        opening.setDate(previousClosing.getDate() + 1);

        return { opening, closing, due };
    }, [selectedDate, card]);

    // 4. Status Determination
    const status = useMemo(() => {
        const today = startOfDay(new Date());
        if (isAfter(today, cycle.closing)) return { label: "Fechada", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30", icon: Lock };
        if (isAfter(today, cycle.due)) return { label: "Atrasada", color: "text-red-600 bg-red-100 dark:bg-red-900/30", icon: AlertCircle };
        return { label: "Aberta", color: "text-green-600 bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 };
    }, [cycle]);

    // 5. Filter Transactions & Group by Card
    const { invoiceTransactions, groupedTransactions, totalsByCard } = useMemo(() => {
        if (!card) return { invoiceTransactions: [], groupedTransactions: {}, totalsByCard: {} };

        // Filter by Date
        const relevantTxs = transactions.filter(t => {
            const tDate = new Date(t.data_transacao);
            const start = startOfDay(cycle.opening);
            const end = endOfDay(cycle.closing);

            const inRange = (isAfter(tDate, start) || tDate.getTime() === start.getTime()) &&
                (isBefore(tDate, end) || tDate.getTime() === end.getTime());

            if (!inRange) return false;

            // Must belong to one of our family cards
            const isExpense = familyCards.some(c => c.id === t.conta_origem_id) && (t.tipo === 'despesa' || t.tipo === 'transferencia');
            const isPayment = familyCards.some(c => c.id === t.conta_destino_id) && t.tipo === 'transferencia';

            return isExpense || isPayment;
        }).sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());

        // Group by Card ID
        const groups: Record<string, any[]> = {};
        const cardTotals: Record<string, number> = {};

        // Initialize for all cards (so we show 0 if empty)
        familyCards.forEach(c => {
            groups[c.id] = [];
            cardTotals[c.id] = 0;
        });

        relevantTxs.forEach(t => {
            // Expenses: Charge to Origin
            // Payments: Credit to Destination
            let targetCardId = null;
            let amount = Number(t.valor);

            if (familyCards.some(c => c.id === t.conta_origem_id)) {
                targetCardId = t.conta_origem_id;
                // It's an expense on this card
            } else if (familyCards.some(c => c.id === t.conta_destino_id)) {
                targetCardId = t.conta_destino_id;
                amount = -amount; // Payment reduces invoice
            }

            if (targetCardId) {
                if (!groups[targetCardId]) groups[targetCardId] = [];
                groups[targetCardId].push(t);
                cardTotals[targetCardId] = (cardTotals[targetCardId] || 0) + amount;
            }
        });

        return { invoiceTransactions: relevantTxs, groupedTransactions: groups, totalsByCard: cardTotals };
    }, [transactions, familyCards, cycle]);

    // 6. Global Totals
    const globalTotal = useMemo(() => {
        return Object.values(totalsByCard).reduce((acc, curr) => acc + curr, 0);
    }, [totalsByCard]);

    // 7. Timeline Progress
    const timelineProgress = useMemo(() => {
        const totalDuration = cycle.due.getTime() - cycle.opening.getTime();
        const today = new Date().getTime();
        const elapsed = today - cycle.opening.getTime();
        const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        return percent;
    }, [cycle]);

    const handlePrevMonth = () => setSelectedDate(d => subMonths(d, 1));
    const handleNextMonth = () => setSelectedDate(d => addMonths(d, 1));

    // Helper: Get Category Name
    const getCategoryName = (id: string | null) => {
        return categories.find(c => c.id === id)?.nome || 'Sem categoria';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Consolidando faturas...</p>
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-lg text-red-500">{error || "Cartão não encontrado"}</p>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
            </div>
        );
    }

    const StatusIcon = status.icon;

    return (
        <>
            <div className="space-y-8 pb-20 animate-in fade-in transition-all duration-500">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{card.nome} {familyCards.length > 1 && <span className="text-sm font-normal text-muted-foreground ml-2">(Visão Consolidada)</span>}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            Fatura de {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Main Cards: Summary & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Financial Summary */}
                    <DashboardCard className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium text-muted-foreground flex justify-between items-center">
                                Fatura Total
                                <div className={cn("px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1", status.color)}>
                                    <StatusIcon className="h-3 w-3" /> {status.label}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(globalTotal)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Vencimento</span>
                                    <p className="text-lg font-semibold">{format(cycle.due, "dd/MM")}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Melhor Dia</span>
                                    <p className="text-lg font-semibold">{format(addMonths(cycle.closing, 0), "dd/MM")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </DashboardCard>

                    {/* Timeline Visual */}
                    <DashboardCard className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium">Ciclo da Fatura</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="relative">
                                <Progress value={timelineProgress} className="h-2" />
                                <div className="absolute top-4 left-0 -translate-x-1/2 flex flex-col items-center">
                                    <div className="h-3 w-3 rounded-full bg-muted-foreground outline outline-4 outline-background" />
                                    <span className="text-xs font-medium mt-1 text-muted-foreground">{format(cycle.opening, "dd/MM")}</span>
                                    <span className="text-[10px] text-muted-foreground">Abertura</span>
                                </div>
                                <div className="absolute top-4 flex flex-col items-center" style={{ left: `${((cycle.closing.getTime() - cycle.opening.getTime()) / (cycle.due.getTime() - cycle.opening.getTime())) * 100}%`, transform: 'translateX(-50%)' }}>
                                    <div className="h-3 w-3 rounded-full bg-amber-500 outline outline-4 outline-background" />
                                    <span className="text-xs font-bold mt-1 text-amber-600">{format(cycle.closing, "dd/MM")}</span>
                                    <span className="text-[10px] text-muted-foreground">Fechamento</span>
                                </div>
                                <div className="absolute top-4 right-0 translate-x-1/2 flex flex-col items-center">
                                    <div className="h-3 w-3 rounded-full bg-red-500 outline outline-4 outline-background" />
                                    <span className="text-xs font-bold mt-1 text-red-600">{format(cycle.due, "dd/MM")}</span>
                                    <span className="text-[10px] text-muted-foreground">Vencimento</span>
                                </div>
                            </div>
                            <div className="mt-12 p-3 bg-muted/40 rounded-lg text-sm text-center">
                                {status.label === 'Aberta'
                                    ? `Restam ${Math.max(0, Math.ceil((cycle.closing.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias para o fechamento.`
                                    : `Fatura fechada. Vence em ${Math.max(0, Math.ceil((cycle.due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias.`
                                }
                            </div>
                        </CardContent>
                    </DashboardCard>
                </div>

                {/* Breakdown by Holder (New Feature!) */}
                {familyCards.length > 1 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Resumo por Titular
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {familyCards.map(c => (
                                <DashboardCard key={c.id} className="bg-card hover:bg-muted/30 transition-colors">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {c.nome.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{c.nome}</p>
                                            <p className="text-xs text-muted-foreground">{c.id === cardId ? 'Titular' : 'Adicional'}</p>
                                        </div>
                                        <div className="ml-auto font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalsByCard[c.id] || 0)}
                                        </div>
                                    </CardContent>
                                </DashboardCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transactions List Grouped by Card */}
                <div className="space-y-6">
                    {familyCards.map(c => {
                        const txs = groupedTransactions[c.id] || [];
                        if (txs.length === 0 && c.id !== cardId) return null; // Skip empty dependent cards, but always show principal? Or skip all empty?
                        // Let's show even if empty to clearly indicate "No spend" for that person.

                        return (
                            <DashboardCard key={c.id}>
                                <CardHeader className="bg-muted/20 border-b pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <CardTitle className="text-base">{c.nome}</CardTitle>
                                                <CardDescription>{c.id === cardId ? 'Cartão Principal' : 'Cartão Adicional'}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalsByCard[c.id] || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 px-2 sm:px-6">
                                    {txs.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground text-sm">
                                            Nenhuma transação neste período.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {txs.map((t) => (
                                                <TransactionItem
                                                    key={t.id}
                                                    transaction={t}
                                                    onEdit={() => handleEdit(t)}
                                                    onDelete={() => handleDeleteTransaction(t)}
                                                    getCategoryName={getCategoryName}
                                                    getAccountName={(id) => c.nome}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </DashboardCard>
                        );
                    })}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir "{transactionToDelete?.descricao}"?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                        <DialogDescription>
                            Faça alterações na transação selecionada.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTransaction && (
                        <TransactionForm
                            mode="edit"
                            initialData={editingTransaction}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setIsEditDialogOpen(false)}
                            groupId={card?.group_id}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default InvoiceDetails;
