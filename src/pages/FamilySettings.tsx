import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users, 
  Plus, 
  Mail, 
  Crown, 
  Shield, 
  User, 
  Eye, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useFamily } from "@/hooks/useFamily";
import { useToast } from "@/hooks/use-toast";

export default function FamilySettings() {
  const { toast } = useToast();
  const {
    groups,
    currentGroup,
    members,
    invites,
    loading,
    error,
    createFamilyGroup,
    inviteFamilyMember,
    acceptFamilyInvite,
    removeFamilyMember,
    updateMemberRole,
    cancelInvite,
    selectGroup,
    isGroupAdmin,
    isGroupOwner
  } = useFamily();
  
  // Estados para modais
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  
  // Estados para formulários
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    document.title = "Família | Boas Contas";
    
    // Processar convite da URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    
    if (inviteToken) {
      setInviteCode(inviteToken);
      setShowInviteCode(true);
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', '/familia');
    }
  }, []);

  // Criar novo grupo familiar
  const handleCreateFamilyGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const result = await createFamilyGroup(newGroupName.trim());
      
      toast({
        title: "Sucesso!",
        description: result.message,
      });
      
      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreateGroup(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar grupo familiar",
        variant: "destructive",
      });
    }
  };

  // Convidar membro para o grupo
  const handleInviteFamilyMember = async () => {
    if (!currentGroup || !inviteEmail.trim()) return;

    try {
      const result = await inviteFamilyMember(currentGroup.id, inviteEmail.trim(), inviteRole);
      
      toast({
        title: "Convite enviado!",
        description: result.message,
      });
      
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteMember(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao enviar convite",
        variant: "destructive",
      });
    }
  };

  // Aceitar convite familiar
  const handleAcceptFamilyInvite = async () => {
    if (!inviteCode.trim()) return;

    try {
      const result = await acceptFamilyInvite(inviteCode.trim());
      
      toast({
        title: "Convite aceito!",
        description: result.message,
      });
      
      setInviteCode("");
      setShowInviteCode(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao aceitar convite",
        variant: "destructive",
      });
    }
  };

  // Remover membro do grupo
  const handleRemoveFamilyMember = async (memberId: string) => {
    if (!currentGroup) return;

    try {
      await removeFamilyMember(memberId);
      
      toast({
        title: "Membro removido",
        description: "Membro removido do grupo com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive",
      });
    }
  };

  // Atualizar role do membro
  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!currentGroup) return;

    try {
      await updateMemberRole(memberId, newRole);
      
      toast({
        title: "Role atualizada",
        description: "Role do membro atualizada com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar role do membro",
        variant: "destructive",
      });
    }
  };

  // Cancelar convite
  const handleCancelInvite = async (inviteId: string) => {
    if (!currentGroup) return;

    try {
      await cancelInvite(inviteId);
      
      toast({
        title: "Convite cancelado",
        description: "Convite cancelado com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar convite",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member': return <User className="h-4 w-4 text-green-500" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'suspended': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col sm:pl-14">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando grupos familiares...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-7 w-7 text-primary" />
                Configurações Familiares
              </h1>
              <p className="text-muted-foreground">Gerencie o grupo e compartilhe suas finanças.</p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showInviteCode} onOpenChange={setShowInviteCode}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Aceitar Convite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aceitar Convite Familiar</DialogTitle>
                    <DialogDescription>
                      Digite o código do convite que você recebeu por email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inviteCode">Código do Convite</Label>
                      <Input
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="FAM_XXXXXXXXXXXX"
                      />
                    </div>
                    <Button onClick={handleAcceptFamilyInvite} className="w-full">
                      Aceitar Convite
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Grupo Familiar</DialogTitle>
                    <DialogDescription>
                      Crie um novo grupo familiar para compartilhar finanças.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">Nome do Grupo</Label>
                      <Input
                        id="groupName"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Ex: Família Silva"
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupDescription">Descrição (opcional)</Label>
                      <Textarea
                        id="groupDescription"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        placeholder="Ex: Grupo familiar para controle financeiro"
                      />
                    </div>
                    <Button onClick={handleCreateFamilyGroup} className="w-full">
                      Criar Grupo
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

          {groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo familiar encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie um grupo familiar ou aceite um convite para começar a compartilhar suas finanças.
                </p>
                <Button onClick={() => setShowCreateGroup(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="groups" className="space-y-4">
              <TabsList>
                <TabsTrigger value="groups">Grupos</TabsTrigger>
                <TabsTrigger value="members">Membros</TabsTrigger>
                <TabsTrigger value="invites">Convites</TabsTrigger>
              </TabsList>

              <TabsContent value="groups" className="space-y-4">
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <Card 
                      key={group.id} 
                      className={`cursor-pointer transition-colors ${
                        currentGroup?.id === group.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectGroup(group)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {group.name}
                              {isGroupOwner(group.id) && (
                                <Badge variant="secondary">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Proprietário
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{group.description}</CardDescription>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                {currentGroup ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Membros do Grupo: {currentGroup.name}
                      </h3>
                      {isGroupAdmin(currentGroup.id) && (
                        <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Convidar Membro
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Convidar Membro</DialogTitle>
                              <DialogDescription>
                                Envie um convite por email para adicionar um novo membro ao grupo.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="inviteEmail">Email</Label>
                                <Input
                                  id="inviteEmail"
                                  type="email"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="exemplo@email.com"
                                />
                              </div>
                              <div>
                                <Label htmlFor="inviteRole">Permissão</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Membro</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="viewer">Visualizador</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleInviteFamilyMember} className="w-full">
                                Enviar Convite
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="grid gap-4">
                      {members.map((member) => (
                        <Card key={member.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {member.profile?.nome || 'Usuário'}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {getRoleIcon(member.role)}
                                    <span>{getRoleLabel(member.role)}</span>
                                    <span>•</span>
                                    {getStatusIcon(member.status)}
                                    <span>{getStatusLabel(member.status)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {isGroupAdmin(currentGroup.id) && member.role !== 'owner' && (
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => handleUpdateMemberRole(member.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="member">Membro</SelectItem>
                                      <SelectItem value="viewer">Visualizador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveFamilyMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Selecione um grupo</h3>
                      <p className="text-muted-foreground text-center">
                        Selecione um grupo familiar para ver os membros.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="invites" className="space-y-4">
                {currentGroup ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Convites do Grupo: {currentGroup.name}
                    </h3>

                    <div className="grid gap-4">
                      {invites.map((invite) => (
                        <Card key={invite.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{invite.email}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {getRoleIcon(invite.role)}
                                    <span>{getRoleLabel(invite.role)}</span>
                                    <span>•</span>
                                    {getStatusIcon(invite.status)}
                                    <span>{getStatusLabel(invite.status)}</span>
                                    <span>•</span>
                                    <span>
                                      Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {isGroupAdmin(currentGroup.id) && invite.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelInvite(invite.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {invites.length === 0 && (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-8">
                            <Mail className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Nenhum convite pendente</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Selecione um grupo</h3>
                      <p className="text-muted-foreground text-center">
                        Selecione um grupo familiar para ver os convites.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
