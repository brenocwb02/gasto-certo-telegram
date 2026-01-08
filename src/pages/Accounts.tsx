import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, CreditCard, PiggyBank, Edit, Lock, Trash2 } from "lucide-react";
import { useAccounts } from "@/hooks/useSupabaseData";
import { useFamily } from "@/hooks/useFamily";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AccountForm } from "@/components/forms/AccountForm";
import { useLimits } from "@/hooks/useLimits";
import { useToast } from "@/hooks/use-toast";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";

const Accounts = () => {
  const { currentGroup } = useFamily();
  const { accounts, loading, error, getTotalBalance, deleteAccount, refetchAccounts } = useAccounts(currentGroup?.id);
  const { plan } = useLimits();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const isAccountLimitReached = plan === 'gratuito' && accounts.length >= 2;

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast({
        title: "Conta excluída",
        description: "A conta foi desativada com sucesso.",
      });
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: err instanceof Error ? err.message : "Erro ao excluir conta",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    document.title = "Contas | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Gerencie suas contas financeiras no Boas Contas: carteira, conta corrente, poupança e investimentos.");
    }
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/accounts");
  }, []);

  const getAccountIcon = (tipo: string) => {
    switch (tipo) {
      case 'dinheiro': return <Wallet className="h-5 w-5" />;
      case 'corrente': return <CreditCard className="h-5 w-5" />;
      case 'poupanca': return <PiggyBank className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    // Força atualização da lista após criar/editar conta
    refetchAccounts();
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentGroup ? `Visualizando: ${currentGroup.name}` : 'Suas contas pessoais'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAccount(null)}>
              {isAccountLimitReached ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
              <DialogDescription>
                {editingAccount ? 'Edite os dados da sua conta' : 'Adicione uma nova conta para organizar suas finanças'}
              </DialogDescription>
            </DialogHeader>

            {!editingAccount && isAccountLimitReached ? (
              <div className="space-y-4 py-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex gap-3">
                  <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-400">Limite de Contas Atingido</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      O plano Gratuito permite apenas 2 contas. Faça upgrade para criar contas ilimitadas.
                    </p>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <a href="/planos">Ver Planos Premium</a>
                </Button>
              </div>
            ) : (
              <AccountForm
                account={editingAccount}
                onSuccess={handleCloseDialog}
                groupId={currentGroup?.id}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Saldo Total</CardTitle>
          <CardDescription>Soma de todas as suas contas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(getTotalBalance())}
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione sua primeira conta para começar a controlar suas finanças
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingAccount(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Conta
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            if (account.tipo === 'cartao') {
              return (
                <div key={account.id} className="relative group">
                  <CreditCardWidget
                    account={account}
                    groupId={currentGroup?.id}
                    allAccounts={accounts}
                    onUpdate={refetchAccounts}
                  />
                  <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-1 border shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a conta "{account.nome}"?
                            Esta ação irá desativar a conta, mas suas transações serão mantidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAccount(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            }

            return (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {getAccountIcon(account.tipo)}
                    <CardTitle className="text-sm font-medium">{account.nome}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a conta "{account.nome}"?
                            Esta ação irá desativar a conta, mas suas transações serão mantidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAccount(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: account.cor || undefined }}>
                    {formatCurrency(account.saldo_atual)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo inicial: {formatCurrency(account.saldo_inicial)}
                  </p>
                  {account.banco && (
                    <Badge variant="outline" className="mt-2">
                      {account.banco}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar contas: {error}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
export default Accounts;
