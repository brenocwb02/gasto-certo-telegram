import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Calendar, TrendingUp, Edit } from "lucide-react";
import { useGoals } from "@/hooks/useSupabaseData";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GoalForm } from "@/components/forms/GoalForm";

const Goals = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { goals, loading, error, refetchGoals } = useGoals();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  useEffect(() => {
    document.title = "Metas | Boas Contas";
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; variant: "default" | "secondary" | "outline" | "destructive" | null | undefined } } = {
      ativa: { label: "Ativa", variant: "default" },
      concluida: { label: "Concluída", variant: "outline" },
      pausada: { label: "Pausada", variant: "secondary" },
    };
    
    const config = statusConfig[status] || statusConfig.ativa;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSuccess = () => {
    handleCloseDialog();
    refetchGoals();
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} />
      </div>
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Metas Financeiras</h1>
              <p className="text-muted-foreground">Defina e acompanhe seus objetivos financeiros</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGoal(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
                  <DialogDescription>
                    {editingGoal ? 'Edite sua meta financeira' : 'Crie uma nova meta para alcançar seus objetivos'}
                  </DialogDescription>
                </DialogHeader>
                <GoalForm 
                  goal={editingGoal} 
                  onSuccess={handleSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>

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
          ) : goals.length === 0 ? (
            <Card className="text-center py-12">
               <CardHeader>
                  <CardTitle>Nenhuma meta cadastrada</CardTitle>
                   <CardDescription>
                       Defina suas primeiras metas para organizar seus objetivos financeiros
                   </CardDescription>
               </CardHeader>
              <CardContent>
                 <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                   <DialogTrigger asChild>
                     <Button onClick={() => setEditingGoal(null)}>
                       <Plus className="h-4 w-4 mr-2" />
                       Criar Primeira Meta
                     </Button>
                   </DialogTrigger>
                   <DialogContent>
                     <DialogHeader>
                       <DialogTitle>Nova Meta</DialogTitle>
                     </DialogHeader>
                     <GoalForm onSuccess={handleSuccess} />
                   </DialogContent>
                 </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const progress = getProgressPercentage(goal.valor_atual, goal.valor_meta);
                const isCompleted = progress >= 100;
                
                return (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{goal.titulo}</CardTitle>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(goal.status)}
                          <Badge variant="outline" className="text-xs">
                            {goal.tipo_periodo}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span className={isCompleted ? "text-green-600 font-semibold" : ""}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Atual:</span>
                          <span className="font-medium">{formatCurrency(goal.valor_atual)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Meta:</span>
                          <span className="font-medium">{formatCurrency(goal.valor_meta)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(goal.data_fim)}
                        </div>
                        {isCompleted && (
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Concluída!
                          </div>
                        )}
                      </div>

                      {goal.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {goal.descricao}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Erro ao carregar metas: {error}</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};
export default Goals;

