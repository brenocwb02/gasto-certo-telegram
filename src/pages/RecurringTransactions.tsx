import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Users
} from "lucide-react";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { useFamily } from "@/hooks/useFamily";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";

export default function RecurringTransactions() {
  const { toast } = useToast();
  const { currentGroup } = useFamily();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const {
    recurringTransactions,
    generationLogs,
    loading,
    error,
    createRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction,
    generateRecurringTransactions,
    getRecurringStats,
    getFrequencyLabel,
    isDueSoon,
    isOverdue
  } = useRecurringTransactions();

  // Estados para modais
  const [showCreateRecurring, setShowCreateRecurring] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Estados para formulário
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    type: "despesa" as "receita" | "despesa",
    frequency: "mensal" as "diaria" | "semanal" | "mensal" | "trimestral" | "semestral" | "anual",
    start_date: "",
    end_date: "",
    category_id: "",
    account_id: "",
    day_of_month: "",
    day_of_week: ""
  });

  useEffect(() => {
    document.title = "Contas Recorrentes | Boas Contas";
  }, []);

  // Criar transação recorrente
  const handleCreateRecurring = async () => {
    if (!formData.title.trim() || !formData.amount || !formData.start_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createRecurringTransaction({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: parseFloat(formData.amount),
        type: formData.type,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        category_id: formData.category_id || undefined,
        account_id: formData.account_id || undefined,
        group_id: currentGroup?.id,
        day_of_month: formData.day_of_month ? parseInt(formData.day_of_month) : undefined,
        day_of_week: formData.day_of_week ? parseInt(formData.day_of_week) : undefined
      });

      toast({
        title: "Sucesso!",
        description: result.message,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        amount: "",
        type: "despesa",
        frequency: "mensal",
        start_date: "",
        end_date: "",
        category_id: "",
        account_id: "",
        day_of_month: "",
        day_of_week: ""
      });
      setShowCreateRecurring(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar transação recorrente",
        variant: "destructive",
      });
    }
  };

  // Pausar/reativar transação
  const handleToggleRecurring = async (id: string, isActive: boolean) => {
    try {
      const result = await toggleRecurringTransaction(id, isActive);

      toast({
        title: "Sucesso!",
        description: result.message,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status da transação",
        variant: "destructive",
      });
    }
  };

  // Deletar transação
  const handleDeleteRecurring = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta transação recorrente?")) return;

    try {
      await deleteRecurringTransaction(id);

      toast({
        title: "Sucesso!",
        description: "Transação recorrente deletada",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao deletar transação",
        variant: "destructive",
      });
    }
  };

  // Gerar transações manualmente
  const handleGenerateRecurring = async () => {
    try {
      const result = await generateRecurringTransactions();

      toast({
        title: "Transações geradas!",
        description: `${result.generated_count} transações geradas com sucesso`,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao gerar transações",
        variant: "destructive",
      });
    }
  };

  const stats = getRecurringStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando contas recorrentes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Repeat className="h-7 w-7 text-primary" />
            Contas Recorrentes
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas transações automáticas e nunca mais esqueça uma conta.
            {currentGroup && (
              <span className="ml-2 text-sm">
                <Users className="h-4 w-4 inline mr-1" />
                Grupo: {currentGroup.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowStats(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </Button>

          <Button variant="outline" onClick={handleGenerateRecurring}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar Agora
          </Button>

          <Dialog open={showCreateRecurring} onOpenChange={setShowCreateRecurring}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Recorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Transação Recorrente</DialogTitle>
                <DialogDescription>
                  Configure uma transação que será gerada automaticamente.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Aluguel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Pagamento mensal do aluguel"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={formData.type} onValueChange={(value: "receita" | "despesa") => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequência *</Label>
                    <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start_date">Data Início *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                </div>

                {formData.frequency === 'mensal' && (
                  <div>
                    <Label htmlFor="day_of_month">Dia do Mês</Label>
                    <Input
                      id="day_of_month"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.day_of_month}
                      onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                      placeholder="Ex: 5 (dia 5 de cada mês)"
                    />
                  </div>
                )}

                {formData.frequency === 'semanal' && (
                  <div>
                    <Label htmlFor="day_of_week">Dia da Semana</Label>
                    <Select value={formData.day_of_week} onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Domingo</SelectItem>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                        <SelectItem value="6">Sábado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="account">Conta</Label>
                    <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="end_date">Data Fim (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateRecurring} className="w-full">
                  Criar Transação Recorrente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="logs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {recurringTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma transação recorrente encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie transações recorrentes para automatizar suas finanças.
                </p>
                <Button onClick={() => setShowCreateRecurring(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Recorrência
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recurringTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === 'receita'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                          }`}>
                          {transaction.type === 'receita' ? (
                            <TrendingUp className="h-6 w-6" />
                          ) : (
                            <TrendingDown className="h-6 w-6" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{transaction.title}</h3>
                            <Badge variant={transaction.is_active ? "default" : "secondary"}>
                              {transaction.is_active ? "Ativa" : "Pausada"}
                            </Badge>
                            {isOverdue(transaction.next_due_date) && (
                              <Badge variant="destructive">Atrasada</Badge>
                            )}
                            {isDueSoon(transaction.next_due_date) && !isOverdue(transaction.next_due_date) && (
                              <Badge variant="outline" className="text-orange-600">Próxima</Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {transaction.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium">
                                R$ {transaction.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Repeat className="h-4 w-4" />
                              <span>{getFrequencyLabel(transaction.frequency)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Próxima: {new Date(transaction.next_due_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {transaction.category && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: transaction.category.cor }}
                                />
                                <span>{transaction.category.nome}</span>
                              </div>
                            )}
                            {transaction.family_group && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{transaction.family_group.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRecurring(transaction.id, !transaction.is_active)}
                        >
                          {transaction.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRecurring(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4">
            {generationLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.status === 'success'
                        ? 'bg-green-100 text-green-600'
                        : log.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-600'
                        }`}>
                        {log.status === 'success' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : log.status === 'failed' ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium">
                          {(log as any).recurring_transaction?.title || 'Transação recorrente'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(log.generated_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {log.status === 'success' ? 'Sucesso' :
                              log.status === 'failed' ? 'Falhou' : 'Pulada'}
                          </span>
                          {log.error_message && (
                            <>
                              <span>•</span>
                              <span className="text-red-600">{log.error_message}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {generationLogs.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum log de geração encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Estatísticas */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estatísticas das Contas Recorrentes</DialogTitle>
            <DialogDescription>
              Resumo das suas transações recorrentes
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.paused}</div>
                <div className="text-sm text-muted-foreground">Pausadas</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${stats.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {Math.abs(stats.totalAmount).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </CardContent>
            </Card>
          </div>

          {stats.nextDue && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Próxima Transação</div>
                    <div className="text-sm text-muted-foreground">
                      {stats.nextDue.title} - {new Date(stats.nextDue.next_due_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}
