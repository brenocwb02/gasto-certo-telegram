import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, CreditCard, PiggyBank, Trash2, Edit } from "lucide-react";
import { useAccounts } from "@/hooks/useSupabaseData";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AccountForm } from "@/components/forms/AccountForm";

const Accounts = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { accounts, loading, error, getTotalBalance } = useAccounts();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  useEffect(() => {
    document.title = "Contas | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Gerencie suas contas financeiras no Gasto Certo: carteira, conta corrente, poupança e investimentos.");
    }
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/accounts");
  }, []);

  const getAccountIcon = (tipo) => {
    switch (tipo) {
      case 'dinheiro': return <Wallet className="h-5 w-5" />;
      case 'corrente': return <CreditCard className="h-5 w-5" />;
      case 'poupanca': return <PiggyBank className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Contas</h1>
              <p className="text-muted-foreground">Gerencie suas contas e acompanhe seus saldos</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingAccount(null)}>
                  <Plus className="h-4 w-4 mr-2" />
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
                <AccountForm 
                  account={editingAccount} 
                  onSuccess={handleCloseDialog}
                />
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
              {accounts.map((account) => (
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" style={{ color: account.cor }}>
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
              ))}
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">Erro ao carregar contas: {error}</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};
export default Accounts;
