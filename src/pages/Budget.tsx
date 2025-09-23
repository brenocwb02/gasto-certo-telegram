import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { Plus, Edit, Trash2, PiggyBank, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  category_id: string;
  amount: number;
  month: string;
  category: {
    nome: string;
    cor: string;
    tipo: string;
  };
  spent: number;
}

export default function Budget() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user]);

  const fetchBudgets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth);

      if (budgetsError) throw budgetsError;

      // Fetch categories for budgets
      const categoryIds = (budgetsData || []).map(b => b.category_id);
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, nome, cor, tipo')
        .in('id', categoryIds);

      if (categoriesError) throw categoriesError;

      // For each budget, calculate spent amount and add category data
      const budgetsWithSpent = await Promise.all(
        (budgetsData || []).map(async (budget) => {
          const startOfMonth = new Date(currentMonth);
          const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

          const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('valor')
            .eq('user_id', user.id)
            .eq('categoria_id', budget.category_id)
            .eq('tipo', 'despesa')
            .gte('data_transacao', startOfMonth.toISOString().split('T')[0])
            .lte('data_transacao', endOfMonth.toISOString().split('T')[0]);

          if (transError) {
            console.error('Erro ao buscar transações:', transError);
            return { ...budget, spent: 0, category: { nome: '', cor: '', tipo: '' } };
          }

          const spent = transactions?.reduce((sum, t) => sum + Number(t.valor), 0) || 0;
          const category = categoriesData?.find(c => c.id === budget.category_id) || { nome: '', cor: '', tipo: '' };
          
          return {
            ...budget,
            category,
            spent
          };
        })
      );

      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar orçamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budget: Budget) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budget.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso.",
      });

      fetchBudgets();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir orçamento",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getStatusBadge = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) {
      return { label: 'Excedido', variant: 'destructive' as const, icon: AlertTriangle };
    }
    if (percentage >= 80) {
      return { label: 'Atenção', variant: 'secondary' as const, icon: TrendingDown };
    }
    return { label: 'No Limite', variant: 'default' as const, icon: TrendingUp };
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.spent > b.amount).length;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} />
      </div>
      
      <div className="lg:hidden">
        <Sidebar isOpen={false} />
      </div>

      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Orçamento Mensal</h1>
              <p className="text-muted-foreground">
                Gerencie seus limites de gastos por categoria - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingBudget(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Orçamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                  </DialogTitle>
                </DialogHeader>
                <BudgetForm
                  budget={editingBudget}
                  onSuccess={() => {
                    setFormOpen(false);
                    setEditingBudget(null);
                    fetchBudgets();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-2 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restante</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalBudget - totalSpent)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categorias</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overBudgetCount > 0 ? (
                        <span className="text-destructive">{overBudgetCount} excedidas</span>
                      ) : (
                        <span>{budgets.length} total</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {budgets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum orçamento definido</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece definindo limites de gastos para suas categorias de despesa
                    </p>
                    <Dialog open={formOpen} onOpenChange={setFormOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setEditingBudget(null)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Orçamento
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Novo Orçamento</DialogTitle>
                        </DialogHeader>
                        <BudgetForm
                          budget={null}
                          onSuccess={() => {
                            setFormOpen(false);
                            setEditingBudget(null);
                            fetchBudgets();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {budgets.map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100;
                    const status = getStatusBadge(budget.spent, budget.amount);
                    const StatusIcon = status.icon;

                    return (
                      <Card key={budget.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: budget.category.cor }}
                              />
                              <div>
                                <CardTitle className="text-lg">{budget.category.nome}</CardTitle>
                              </div>
                            </div>
                            <Badge variant={status.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Progress */}
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>Progresso</span>
                                <span className="font-medium">{percentage.toFixed(1)}%</span>
                              </div>
                              <Progress 
                                value={Math.min(percentage, 100)} 
                                className="h-2"
                              />
                            </div>

                            {/* Values */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Gasto:</span>
                                <span className="font-medium">{formatCurrency(budget.spent)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Orçamento:</span>
                                <span className="font-medium">{formatCurrency(budget.amount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Restante:</span>
                                <span className={`font-medium ${budget.amount - budget.spent < 0 ? 'text-destructive' : 'text-success'}`}>
                                  {formatCurrency(budget.amount - budget.spent)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setEditingBudget(budget);
                                  setFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o orçamento de "{budget.category.nome}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(budget)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}