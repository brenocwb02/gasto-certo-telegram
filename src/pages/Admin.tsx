import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, DollarSign, TrendingUp, Shield, Search, RefreshCw, Calendar, MessageSquare, Crown, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading, stats, users, auditLogs, fetchUsers, updateLicense } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [newPlano, setNewPlano] = useState('');
  const [newStatus, setNewStatus] = useState('ativo');
  const [newTipo, setNewTipo] = useState('mensal');
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Redirecionar se não autenticado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Acesso negado
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        <Button onClick={() => window.history.back()}>Voltar</Button>
      </div>
    );
  }

  const handleSearch = () => {
    fetchUsers(searchTerm || undefined);
  };

  const handleUpdateLicense = async () => {
    if (!selectedUser || !newPlano) return;

    setIsUpdating(true);
    try {
      await updateLicense(selectedUser.user_id, newPlano, newStatus, newTipo);
      toast.success('Licença atualizada com sucesso!');
      setDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Erro ao atualizar licença');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditDialog = (user: typeof users[0]) => {
    setSelectedUser(user);
    setNewPlano(user.license_plano);
    setNewStatus(user.license_status === 'sem_licenca' ? 'ativo' : user.license_status);
    setNewTipo(user.license_tipo === 'N/A' ? 'mensal' : user.license_tipo);
    setDialogOpen(true);
  };

  const getPlanoBadge = (plano: string) => {
    switch (plano) {
      case 'premium':
        return <Badge className="bg-amber-500">Premium</Badge>;
      case 'familia':
      case 'familia_plus':
        return <Badge className="bg-purple-500">Família</Badge>;
      case 'gratuito':
      default:
        return <Badge variant="secondary">Gratuito</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'expirado':
        return <Badge variant="destructive">Expirado</Badge>;
      case 'cancelado':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">Sem Licença</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">Gerencie usuários, licenças e monitore métricas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.new_users_7d || 0} nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversion_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {(stats?.premium_users || 0) + (stats?.familia_users || 0)} assinantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Planos</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">Free: {stats?.free_users || 0}</span>
              <span className="text-amber-500">Premium: {stats?.premium_users || 0}</span>
              <span className="text-purple-500">Família: {stats?.familia_users || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie licenças dos usuários</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button onClick={() => { setSearchTerm(''); fetchUsers(); }} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Users Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Telegram</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.nome}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.telegram_connected ? (
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-muted-foreground/30" />
                            )}
                          </TableCell>
                          <TableCell>{getPlanoBadge(user.license_plano)}</TableCell>
                          <TableCell>{getStatusBadge(user.license_status)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {user.license_tipo === 'N/A' ? '-' : user.license_tipo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>Histórico de ações administrativas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.table_name || '-'}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {log.query_details ? JSON.stringify(log.query_details) : '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit License Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Licença</DialogTitle>
            <DialogDescription>
              {selectedUser?.nome} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plano</label>
              <Select value={newPlano} onValueChange={setNewPlano}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="familia_plus">Família Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={newTipo} onValueChange={setNewTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="vitalicia">Vitalícia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateLicense} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
