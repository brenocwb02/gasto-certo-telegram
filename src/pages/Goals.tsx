import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GoalForm } from "@/components/forms/GoalForm";
import { Plus, Edit, Trash2, Target, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useGoals } from "@/hooks/useSupabaseData";

interface Goal {
  id: string;
  titulo: string;
  descricao?: string;
  valor_meta: number;
  valor_atual: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  tipo_periodo: string;
  categoria_id?: string;
  categoria?: {
    nome: string;
    cor: string;
  };
}

export default function Goals() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { goals, loading, deleteGoal } = useGoals();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      ativa: { label: 'Ativa', variant: 'default' as const },
      concluida: { label: 'Concluída', variant: 'secondary' as const },
      cancelada: { label: 'Cancelada', variant: 'destructive' as const }
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDelete = async (goal: Goal) => {
    try {
      await deleteGoal(goal.id);
      toast({
        title: "Meta excluída",
        description: "A meta foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir meta",
        variant: "destructive",
      });
    }
  };

  const activeGoals = goals.filter(goal => goal.status === 'ativa');
  const completedGoals = goals.filter(goal => goal.status === 'concluida');

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
              <h1 className="text-3xl font-bold">Metas Financeiras</h1>
              <p className="text-muted-foreground">
                Defina e acompanhe suas metas de economia e gastos
              </p>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGoal(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingGoal ? 'Editar Meta' : 'Nova Meta'}
                  </DialogTitle>
                </DialogHeader>
                <GoalForm
                  goal={editingGoal}
                  onSuccess={() => {
                    setFormOpen(false);
                    setEditingGoal(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-2 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{activeGoals.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedGoals.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Economizado</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(goals.reduce((acc, goal) => acc + goal.valor_atual, 0))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {goals.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma meta criada</h3>
                    <p className="text-muted-foreground mb-4">
                      Comece definindo suas metas financeiras para acompanhar seu progresso
                    </p>
                    <Dialog open={formOpen} onOpenChange={setFormOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setEditingGoal(null)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeira Meta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Nova Meta</DialogTitle>
                        </DialogHeader>
                        <GoalForm
                          goal={null}
                          onSuccess={() => {
                            setFormOpen(false);
                            setEditingGoal(null);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {goals.map((goal) => {
                    const progress = calculateProgress(goal.valor_atual, goal.valor_meta);
                    const daysRemaining = getDaysRemaining(goal.data_fim);
                    const statusBadge = getStatusBadge(goal.status);

                    return (
                      <Card key={goal.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg leading-tight">{goal.titulo}</CardTitle>
                              {goal.descricao && (
                                <p className="text-sm text-muted-foreground mt-1">{goal.descricao}</p>
                              )}
                            </div>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Progress */}
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>Progresso</span>
                                <span className="font-medium">{progress.toFixed(1)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>

                            {/* Values */}
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Atual:</span>
                              <span className="font-medium">{formatCurrency(goal.valor_atual)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Meta:</span>
                              <span className="font-medium">{formatCurrency(goal.valor_meta)}</span>
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Até {formatDate(goal.data_fim)}</span>
                              {daysRemaining > 0 && goal.status === 'ativa' && (
                                <Badge variant="outline" className="text-xs">
                                  {daysRemaining} dias
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setEditingGoal(goal);
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
                                    <AlertDialogTitle>Excluir meta</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a meta "{goal.titulo}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(goal)}
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