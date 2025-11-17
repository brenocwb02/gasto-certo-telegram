import { useEffect, useState } from "react";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
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
  AlertCircle,
  QrCode,
  Copy
} from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useToast } from "../hooks/use-toast";

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
    // @ts-ignore
    inviteFamilyMember, // Mantendo as suas funções
    acceptFamilyInvite,
    // @ts-ignore
    removeFamilyMember,
    // @ts-ignore
    updateMemberRole,
    // @ts-ignore
    cancelInvite,
    // @ts-ignore
    deleteFamilyGroup,
    // @ts-ignore
    selectGroup, // Não será mais usado, mas mantemos para evitar erro
    isGroupAdmin,
    isGroupOwner
  } = useFamily();

  // !! ESTA É A NOVA TRAVA DE UI !!
  const hasGroup = groups.length > 0;

  // Estados para modais
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showGeneratedCode, setShowGeneratedCode] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // Estados para formulários
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    document.title = "Família | Boas Contas";

    // Processar convite da URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');

    if (inviteToken && !hasGroup) { // Só preenche se não tiver um grupo
      setInviteCode(inviteToken);
      setShowInviteCode(true);
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', '/familia');
    }
  }, [hasGroup]); // Adicionamos hasGroup como dependência

  // Criar novo grupo familiar
  const handleCreateFamilyGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      // @ts-ignore
      const result = await createFamilyGroup(newGroupName.trim());

      toast({
        title: "Sucesso!",
        description: result.message || "Grupo criado com sucesso.",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreateGroup(false);
    } catch (err) {
      toast({
        title: "Erro",
        // O erro 'USER_ALREADY_IN_GROUP' da sua SQL vai aparecer aqui
        description: err instanceof Error ? err.message : "Erro ao criar grupo familiar",
        variant: "destructive",
      });
    }
  };

  // Convidar membro para o grupo
  const handleInviteFamilyMember = async () => {
    if (!currentGroup || !inviteName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do familiar",
        variant: "destructive",
      });
      return;
    }

    try {
      // @ts-ignore
      const result = await inviteFamilyMember(currentGroup.id, inviteName.trim(), inviteRole);

      setGeneratedCode(result.token!);
      setShowInviteMember(false);
      setShowGeneratedCode(true);
      setInviteName("");
      setInviteRole("member");

      toast({
        title: "Convite criado!",
        description: result.message,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar convite",
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
        // @ts-ignore
        description: result.message || "Bem-vindo ao grupo!",
      });

      setInviteCode("");
      setShowInviteCode(false);
    } catch (err) {
      toast({
        title: "Erro",
        // O erro 'USER_ALREADY_IN_GROUP' da sua SQL vai aparecer aqui
        description: err instanceof Error ? err.message : "Erro ao aceitar convite",
        variant: "destructive",
      });
    }
  };

  // Deletar grupo familiar
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      // @ts-ignore
      const result = await deleteFamilyGroup(groupToDelete);

      toast({
        title: "Sucesso!",
        description: result.message,
      });

      setGroupToDelete(null);
      setShowDeleteGroup(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao deletar grupo",
        variant: "destructive",
      });
    }
  };

  // ... (handleRemoveFamilyMember, handleUpdateMemberRole, handleCancelInvite - permanecem iguais) ...
  // ... (getRoleIcon, getRoleLabel, getStatusIcon, getStatusLabel - permanecem iguais) ...
  // ... (handleRemoveFamilyMember)
    const handleRemoveFamilyMember = async (memberId: string) => {
    if (!currentGroup) return;

    try {
      // @ts-ignore
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

  // ... (handleUpdateMemberRole)
  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!currentGroup) return;

    try {
      // @ts-ignore
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

  // ... (handleCancelInvite)
  const handleCancelInvite = async (inviteId: string) => {
    if (!currentGroup) return;

    try {
      // @ts-ignore
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

  // ... (getRoleIcon, getRoleLabel, etc)
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

            {/* !! MODIFICAÇÃO #1: SÓ MOSTRAR BOTÕES SE NÃO TIVER GRUPO !! */}
            {!hasGroup && (
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
                        Digite o código do convite que você recebeu.
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
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* !! MODIFICAÇÃO #2: O NOME DESTA VARIÁVEL MUDOU !! */}
          {!hasGroup ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo familiar encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie um grupo familiar ou aceite um convite para começar a compartilhar suas finanças.
                </p>
                {/* Os botões de ação estão no topo da página agora */}
              </CardContent>
            </Card>
          ) : (
            // !! MODIFICAÇÃO #3: MUDAR defaultValue E REMOVER ABA "GRUPOS" !!
            <Tabs defaultValue="members" className="space-y-4">
              <TabsList>
                {/* <TabsTrigger value="groups">Grupos</TabsTrigger> -- REMOVIDO */}
                <TabsTrigger value="members">Membros</TabsTrigger>
                <TabsTrigger value="invites">Convites</TabsTrigger>
              </TabsList>

              {/* !! MODIFICAÇÃO #4: REMOVER CONTEÚDO DA ABA "GRUPOS" !! */}
              {/* <TabsContent value="groups" ... </TabsContent> -- BLOCO INTEIRO REMOVIDO */}

              <TabsContent value="members" className="space-y-4">
                {/* Esta lógica agora funciona, porque o `useFamily.ts` modificado
                  define `currentGroup` automaticamente.
                */}
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
                                Gere um código de convite para compartilhar com seu familiar
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="inviteName">Nome do familiar</Label>
                                <Input
                                  id="inviteName"
                                  type="text"
                                  value={inviteName}
                                  onChange={(e) => setInviteName(e.target.value)}
                                  placeholder="Ex: Maria Silva"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Este nome será usado apenas para identificar o convite
                                </p>
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
                                <QrCode className="h-4 w-4 mr-2" />
                                Gerar Código
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
                                  {/* @ts-ignore */}
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {/* @ts-ignore */}
                                    {member.profile?.nome || 'Usuário'}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {getRoleIcon(member.role)}
                                    <span>{getRoleLabel(member.role)}</span>
                                    <span>•</span>
                                    {/* @ts-ignore */}
                                    {getStatusIcon(member.status)}
                                    {/* @ts-ignore */}
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
                                  {/* @ts-ignore */}
                                  <p className="font-medium">{invite.email || invite.name}</p> 
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

          {/* Dialog para mostrar código gerado */}
          <Dialog open={showGeneratedCode} onOpenChange={setShowGeneratedCode}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convite Criado com Sucesso! 🎉</DialogTitle>
                <DialogDescription>
                  Compartilhe este código com seu familiar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Código do Convite</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedCode}
                      readOnly
                      className="font-mono text-xl font-bold text-center bg-muted"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        // navigator.clipboard.writeText(generatedCode); // Pode falhar em iframes
                        document.execCommand('copy', true, generatedCode); // Fallback
                        toast({
                          title: "Copiado!",
                          description: "Código copiado para a área de transferência",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertTitle>Como compartilhar</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>• Envie este código via WhatsApp, Telegram ou qualquer outro meio</p>
                    <p>• Seu familiar pode aceitar na página Família ou no bot do Telegram</p>
                    <p>• No Telegram, use: <code className="bg-background px-2 py-1 rounded font-mono">/entrar {generatedCode}</code></p>
                    <p className="text-muted-foreground">Válido por 30 dias</p>
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowGeneratedCode(false)}>
                  Entendi
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog de Confirmação de Deletar Grupo */}
          <Dialog open={showDeleteGroup} onOpenChange={setShowDeleteGroup}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deletar Grupo Familiar</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja deletar este grupo? Esta ação é permanente e não pode ser desfeita.
                  Todos os membros e convites serão removidos.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => {
                  setShowDeleteGroup(false);
                  setGroupToDelete(null);
                }}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteGroup}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Grupo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
