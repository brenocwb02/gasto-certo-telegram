import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Edit, Trash2, ChevronLeft, ChevronRight, Settings, Sparkles } from "lucide-react";
import { useBudgets } from "@/hooks/useBudgets";
import { useDefaultBudgets } from "@/hooks/useDefaultBudgets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DefaultBudgetForm } from "@/components/forms/DefaultBudgetForm";
import { MonthlyBudgetOverrideForm } from "@/components/forms/MonthlyBudgetOverrideForm";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

import { useFamily } from "@/hooks/useFamily";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BudgetDetailsDialog } from "@/components/budget/BudgetDetailsDialog";

const Budget = () => {
  const { currentGroup } = useFamily();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { budgets, loading, refetchBudgets } = useBudgets(currentMonth, currentGroup?.id);
  const { defaultBudgets, loading: loadingDefaults, refetchDefaultBudgets, deleteDefaultBudget } = useDefaultBudgets(currentGroup?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDefaultBudget, setEditingDefaultBudget] = useState<any>(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedBudgetForOverride, setSelectedBudgetForOverride] = useState<any>(null);
  const [selectedBudgetForDetails, setSelectedBudgetForDetails] = useState<any>(null);
  const { toast } = useToast();

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
    setEditingDefaultBudget(null);
    refetchDefaultBudgets();
    refetchBudgets();
  };

  const handleOverrideSuccess = () => {
    setOverrideDialogOpen(false);
    setSelectedBudgetForOverride(null);
    refetchBudgets();
  };

  const handleEditDefaultBudget = (budget: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDefaultBudget(budget);
    setDialogOpen(true);
  };

  const handleDeleteDefaultBudget = async (budgetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este orçamento padrão? Isso removerá o orçamento de todos os meses.")) return;

    try {
      await deleteDefaultBudget(budgetId);
      toast({
        title: "Orçamento padrão excluído",
        description: "O orçamento foi removido de todos os meses.",
      });
      refetchBudgets();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o orçamento.",
        variant: "destructive",
      });
    }
  };

  const handleAdjustMonth = (budget: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBudgetForOverride(budget);
    setOverrideDialogOpen(true);
  };

  const handleCardClick = (budget: any) => {
    setSelectedBudgetForDetails(budget);
  };

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const isCurrentMonth = isSameMonth(currentMonth, new Date());
  const existingCategoryIds = defaultBudgets.map(b => b.category_id);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamento</h1>
          <p className="text-muted-foreground">Defina orçamentos padrão e acompanhe seus gastos.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDefaultBudget(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento Padrão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDefaultBudget ? 'Editar Orçamento Padrão' : 'Novo Orçamento Padrão'}</DialogTitle>
            </DialogHeader>
            <DefaultBudgetForm
              budget={editingDefaultBudget}
              onSuccess={handleSuccess}
              groupId={currentGroup?.id}
              existingCategoryIds={existingCategoryIds}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center min-w-[200px]">
          <h2 className="text-xl font-semibold capitalize">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          {isCurrentMonth && (
            <Badge variant="secondary" className="mt-1">Mês Atual</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="monthly">
            <PiggyBank className="h-4 w-4 mr-2" />
            Orçamento Mensal
          </TabsTrigger>
          <TabsTrigger value="defaults">
            <Settings className="h-4 w-4 mr-2" />
            Orçamentos Padrão
          </TabsTrigger>
        </TabsList>

        {/* Tab: Orçamento Mensal */}
        <TabsContent value="monthly">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum orçamento definido</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando orçamentos padrão que serão aplicados automaticamente a todos os meses.
                </p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingDefaultBudget(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Orçamento Padrão
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget: any) => {
                const spent = budget.spent || 0;
                const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const remaining = budget.amount - spent;
                const isOverBudget = progress > 100;
                const isNearLimit = progress > 80 && progress <= 100;
                const isDefault = budget.is_default;

                return (
                  <Card
                    key={budget.category_id}
                    className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
                    onClick={() => handleCardClick(budget)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.category_color || '#6366f1' }} />
                          {budget.category_name || 'Categoria não encontrada'}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {isDefault ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              Padrão
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Ajustado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-lg font-bold">{formatCurrency(budget.amount)}</span>
                        {isCurrentMonth && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleAdjustMonth(budget, e)}
                            className="text-xs hover:bg-background/80"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Ajustar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span className={`font-medium ${isOverBudget ? 'text-destructive' :
                            isNearLimit ? 'text-orange-500' :
                              'text-muted-foreground'
                            }`}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(progress, 100)}
                          className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' :
                            isNearLimit ? '[&>div]:bg-orange-500' :
                              '[&>div]:bg-primary'
                            }`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Gasto: <span className="font-medium">{formatCurrency(spent)}</span></span>
                        <span className={remaining >= 0 ? '' : 'text-destructive font-medium'}>
                          {remaining >= 0 ? 'Restante: ' : 'Excesso: '}
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                      {isOverBudget && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          ⚠️ Orçamento ultrapassado em {formatCurrency(spent - budget.amount)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Orçamentos Padrão */}
        <TabsContent value="defaults">
          {loadingDefaults ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : defaultBudgets.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum orçamento padrão</h3>
                <p className="text-muted-foreground mb-4">
                  Crie orçamentos padrão para que sejam aplicados automaticamente a todos os meses.
                </p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingDefaultBudget(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Orçamento Padrão
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {defaultBudgets.map((budget) => (
                <Card key={budget.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.category_color || '#6366f1' }} />
                        {budget.category_name || 'Categoria'}
                      </CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditDefaultBudget(budget, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteDefaultBudget(budget.id, e)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(budget.amount)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aplicado automaticamente a todos os meses
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para ajuste mensal */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Orçamento do Mês</DialogTitle>
          </DialogHeader>
          {selectedBudgetForOverride && (
            <MonthlyBudgetOverrideForm
              categoryId={selectedBudgetForOverride.category_id}
              categoryName={selectedBudgetForOverride.category_name}
              categoryColor={selectedBudgetForOverride.category_color}
              defaultAmount={selectedBudgetForOverride.default_amount || selectedBudgetForOverride.amount}
              currentOverrideId={selectedBudgetForOverride.is_default ? undefined : selectedBudgetForOverride.id}
              currentOverrideAmount={selectedBudgetForOverride.is_default ? undefined : selectedBudgetForOverride.amount}
              month={currentMonth}
              onSuccess={handleOverrideSuccess}
              groupId={currentGroup?.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes (Drill-down) */}
      <BudgetDetailsDialog
        isOpen={!!selectedBudgetForDetails}
        onClose={() => setSelectedBudgetForDetails(null)}
        budget={selectedBudgetForDetails}
        currentMonth={currentMonth}
        groupId={currentGroup?.id}
      />
    </>
  );
};

export default Budget;
