import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, PiggyBank } from "lucide-react";
import { useBudgets } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { Progress } from "@/components/ui/progress";

const Budget = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { budgets, loading, refetchBudgets } = useBudgets();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    document.title = "Orçamento | Boas Contas";
  }, []);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const handleSuccess = () => {
    setDialogOpen(false);
    refetchBudgets();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} />
      </div>
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Orçamento Mensal</h1>
              <p className="text-muted-foreground">Gerencie seus limites de gastos por categoria.</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Orçamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Orçamento</DialogTitle>
                </DialogHeader>
                <BudgetForm onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <p>Carregando orçamentos...</p>
          ) : budgets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum orçamento definido</h3>
                <p className="text-muted-foreground mb-4">
                  Comece definindo limites de gastos para suas categorias de despesa.
                </p>
                 <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Orçamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Orçamento</DialogTitle>
                    </DialogHeader>
                    <BudgetForm onSuccess={handleSuccess} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget: any) => {
                const spent = budget.spent || 0; 
                const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const remaining = budget.amount - spent;
                
                return (
                  <Card key={budget.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.categories.cor }} />
                          {budget.categories.nome}
                        </CardTitle>
                         <span className="text-sm font-bold">{formatCurrency(budget.amount)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <Progress value={progress} />
                       <div className="flex justify-between text-xs text-muted-foreground">
                           <span>Gasto: {formatCurrency(spent)}</span>
                           <span>Restante: {formatCurrency(remaining)}</span>
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Budget;

