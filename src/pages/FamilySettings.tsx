import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
// @ts-ignore
import { useFamily } from "../hooks/useFamily";
// @ts-ignore
import { useToast } from "../hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    inviteFamilyMember,
    acceptFamilyInvite,
    // @ts-ignore
    removeFamilyMember,
    // @ts-ignore
    updateMemberRole,
    // @ts-ignore
    cancelInvite,
    deleteFamilyGroup, // Precisamos disto
    // @ts-ignore
    selectGroup,
    isGroupAdmin,
    isGroupOwner
  } = useFamily();

  const hasGroup = groups.length > 0;

  // Estados para modais
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showGeneratedCode, setShowGeneratedCode] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [showDissolveGroup, setShowDissolveGroup] = useState(false);
  const [showMigrateData, setShowMigrateData] = useState(false);
  const [personalDataCount, setPersonalDataCount] = useState<any>(null);
  const [newlyCreatedGroupId, setNewlyCreatedGroupId] = useState<string | null>(null);

  // Estados para formulários
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    document.title = "Família | Boas Contas";

    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');

    if (inviteToken && !hasGroup) {
      setInviteCode(inviteToken);
      setShowInviteCode(true);
      window.history.replaceState({}, '', '/familia');
    }
  }, [hasGroup]);

  const checkPersonalData = async () => {
    try {
      const { data, error } = await supabase.rpc('count_personal_data');
      if (error) throw error;
      return data as { transactions: number; budgets: number; accounts: number; categories: number; total: number } | null;
    } catch (err) {
      console.error('Erro ao contar dados pessoais:', err);
      return null;
    }
  };

  // Migrar dados pessoais para o grupo
  const migratePersonalData = async (groupId: string) => {
    try {
      const { data, error } = await supabase.rpc('migrate_personal_data_to_group', {
        p_group_id: groupId
      });

      if (error) throw error;

      const result = (data as { total_migrated?: number } | null);
      const migratedCount = result?.total_migrated ?? 0;

      toast({
        title: "Dados migrados!",
        description: `${migratedCount} itens foram importados para o grupo.`,
      });

      setShowMigrateData(false);
      setPersonalDataCount(null);
      setNewlyCreatedGroupId(null);
    } catch (err) {
      console.error('Erro ao migrar dados:', err);
      toast({
        title: "Erro",
        description: "Erro ao migrar dados pessoais",
        variant: "destructive",
      });
    }
  };

  // Criar novo grupo familiar
  const handleCreateFamilyGroup = async () => {
    console.log('Iniciando criação de grupo:', { newGroupName, newGroupDescription });
    if (!newGroupName.trim()) {
      console.log('Nome do grupo vazio, abortando.');
      return;
    }

    try {
      console.log('Chamando createFamilyGroup...');
      // @ts-ignore
      const result = await createFamilyGroup(newGroupName.trim(), newGroupDescription.trim());
      console.log('Resultado createFamilyGroup:', result);

      // O ID pode vir como 'id' ou 'group_id' dependendo da implementação
      // @ts-ignore
      let createdGroupId = result.id || result.group_id || result.data?.id;

      // Se createdGroupId for um objeto (como vimos no log), pegamos o ID de dentro dele
      if (typeof createdGroupId === 'object' && createdGroupId !== null && createdGroupId.id) {
        createdGroupId = createdGroupId.id;
      }

      console.log('ID do grupo criado (FINAL):', createdGroupId);

      toast({
        title: "Sucesso!",
        description: result.message || "Grupo criado com sucesso.",
      });

      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreateGroup(false);

      // Verificar se usuário tem dados pessoais para migrar
      const personalData = await checkPersonalData();
      if (personalData && personalData.total > 0) {
        setPersonalDataCount(personalData);
        if (createdGroupId) {
          setNewlyCreatedGroupId(createdGroupId);
        } else {
          console.error('ERRO CRÍTICO: ID do grupo não encontrado no resultado!');
        }
        setShowMigrateData(true);
      }
    } catch (err) {
      console.error('Erro no handleCreateFamilyGroup:', err);
      toast({
        title: "Erro",
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
        description: err instanceof Error ? err.message : "Erro ao aceitar convite",
        variant: "destructive",
      });
    }
  };

  // Dissolver grupo mantendo dados
  const handleDissolveFamilyGroup = async () => {
    if (!currentGroup) return;

    try {
      const { error } = await supabase.rpc('dissolve_family_group', {
        p_group_id: currentGroup.id
      });

      if (error) throw error;

      toast({
        title: "Grupo dissolvido",
        description: "Grupo removido e dados convertidos para pessoais com sucesso.",
      });

      setShowDissolveGroup(false);
      // Recarregar a página para atualizar o estado
      window.location.reload();
    } catch (err) {
      console.error('Erro ao dissolver grupo:', err);
      toast({
        title: "Erro",
        description: "Erro ao dissolver grupo familiar",
        variant: "destructive",
      });
    }
  };

  // !! NOVA FUNÇÃO DELETAR !!
  // Deletar grupo familiar
  const handleDeleteGroup = async () => {
    if (!currentGroup) return;

    try {
      // @ts-ignore
      const result = await deleteFamilyGroup(currentGroup.id);

      toast({
        title: "Sucesso!",
        description: result.message, // A mensagem de sucesso vem do RPC
      });

      setShowDeleteGroup(false);
      // O hook 'useFamily' vai recarregar e o 'currentGroup'
      // vai-se tornar 'null', fazendo a UI voltar ao estado "Nenhum grupo".
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao apagar grupo",
        variant: "destructive",
      });
    }
  };

  // ... (handleRemoveFamilyMember, handleUpdateMemberRole, handleCancelInvite - permanecem iguais) ...
  // ... (getRoleIcon, getRoleLabel, getStatusIcon, getStatusLabel - permanecem iguais) ...
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando grupos familiares...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Configurações Familiares
          </h1>
          <p className="text-muted-foreground">Gerencie o grupo e compartilhe suas finanças.</p>
        </div>

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
                  {/* Anti-Abuse Warning */}
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">Importante saber</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                      No <strong>Boas Contas Família</strong>, todos os membros podem ver o{' '}
                      <strong>total dos gastos familiares por categoria</strong> para gerar{' '}
                      consciência financeira coletiva.
                      <br /><br />
                      Ninguém vê os detalhes pessoais de outros membros.
                    </AlertDescription>
                  </Alert>

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
                    Entendo e Aceito Participar
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

      {!hasGroup ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo familiar encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie um grupo familiar ou aceite um convite para começar a compartilhar suas finanças.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
          </TabsList>

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
                                // @ts-ignore
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

                {/* !! NOVA ZONA DE PERIGO ADICIONADA !! */}
                {isGroupOwner(currentGroup.id) && (
                  <Card className="border-destructive mt-6">
                    <CardHeader>
                      <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                      <CardDescription>
                        A ação abaixo é permanente e não pode ser desfeita.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Dialog open={showDeleteGroup} onOpenChange={setShowDeleteGroup}>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Apagar Grupo Familiar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tem a certeza absoluta?</DialogTitle>
                            <DialogDescription>
                              Esta ação não pode ser desfeita. Isto irá apagar permanentemente o grupo
                              <strong className="px-1">{currentGroup.name}</strong>
                              e todos os dados financeiros (transações, contas, orçamentos) associados a ele.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setShowDeleteGroup(false)}>
                              Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteGroup}>
                              Eu entendo, apagar o grupo
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showDissolveGroup} onOpenChange={setShowDissolveGroup}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full mt-4 border-orange-500 text-orange-600 hover:bg-orange-50">
                            <Shield className="h-4 w-4 mr-2" />
                            Dissolver Grupo (Manter Dados)
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Dissolver Grupo e Manter Dados?</DialogTitle>
                            <DialogDescription>
                              Esta ação irá excluir o grupo <strong className="px-1">{currentGroup.name}</strong>,
                              mas <strong>MANTERÁ</strong> todos os seus dados (transações, contas, orçamentos).
                              <br /><br />
                              Os dados voltarão a ser "pessoais" e vinculados apenas a você. Outros membros perderão o acesso.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => setShowDissolveGroup(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleDissolveFamilyGroup}>
                              Sim, dissolver e manter dados
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                )}

              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum grupo selecionado</h3>
                  <p className="text-muted-foreground text-center">
                    Ocorreu um erro ao carregar o seu grupo.
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
                  <h3 className="text-lg font-semibold mb-2">Nenhum grupo selecionado</h3>
                  <p className="text-muted-foreground text-center">
                    Ocorreu um erro ao carregar os convites do grupo.
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
                    try {
                      // Tentar a API moderna primeiro
                      // @ts-ignore
                      navigator.clipboard.writeText(generatedCode);
                    } catch (err) {
                      // Fallback para o método antigo (pode não funcionar em todos os browsers)
                      try {
                        // @ts-ignore
                        document.execCommand('copy', true, generatedCode);
                      } catch (e) {
                        console.error("Falha ao copiar para o clipboard");
                      }
                    }
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

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 border-green-500 text-green-600 hover:bg-green-50 p-2 h-auto flex flex-col items-center justify-center gap-1"
                onClick={() => {
                  const text = `Olá! Entre no meu grupo do Boas Contas com este código: ${generatedCode}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6" alt="WhatsApp" />
                <span className="text-xs">WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                className="flex-1 border-blue-400 text-blue-500 hover:bg-blue-50 p-2 h-auto flex flex-col items-center justify-center gap-1"
                onClick={() => {
                  const text = `Olá! Entre no meu grupo do Boas Contas com este código: ${generatedCode}`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent('https://boascontas.app.br')}&text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" className="w-6 h-6" alt="Telegram" />
                <span className="text-xs">Telegram</span>
              </Button>

              <Button
                variant="outline"
                className="flex-1 p-2 h-auto flex flex-col items-center justify-center gap-1"
                onClick={() => {
                  const subject = "Convite para o Boas Contas";
                  const body = `Olá!\n\nEstou te convidando para participar do meu controle financeiro familiar no app Boas Contas.\n\nUse este código para entrar: ${generatedCode}\n\nAcesse: https://boascontas.app.br`;
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                }}
              >
                <Mail className="w-6 h-6" />
                <span className="text-xs">E-mail</span>
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full mt-2"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                toast({
                  title: "Copiado!",
                  description: "Código copiado para a área de transferência",
                });
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Código Manualmente
            </Button>
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
      </Dialog >

      {/* Dialog para migrar dados pessoais */}
      < Dialog open={showMigrateData} onOpenChange={setShowMigrateData} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar dados pessoais? 📦</DialogTitle>
            <DialogDescription>
              Você possui dados pessoais que podem ser importados para o grupo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {personalDataCount && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Encontramos:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {personalDataCount.transactions > 0 && (
                    <div className="flex justify-between border rounded p-2">
                      <span>Transações:</span>
                      <span className="font-bold">{personalDataCount.transactions}</span>
                    </div>
                  )}
                  {personalDataCount.budgets > 0 && (
                    <div className="flex justify-between border rounded p-2">
                      <span>Orçamentos:</span>
                      <span className="font-bold">{personalDataCount.budgets}</span>
                    </div>
                  )}
                  {personalDataCount.accounts > 0 && (
                    <div className="flex justify-between border rounded p-2">
                      <span>Contas:</span>
                      <span className="font-bold">{personalDataCount.accounts}</span>
                    </div>
                  )}
                  {personalDataCount.categories > 0 && (
                    <div className="flex justify-between border rounded p-2">
                      <span>Categorias:</span>
                      <span className="font-bold">{personalDataCount.categories}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total: <strong>{personalDataCount.total}</strong> itens
                </p>
              </div>
            )}
            <Alert>
              <AlertTitle>O que isso faz?</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <p>• Seus dados pessoais serão movidos para o grupo</p>
                <p>• Todos os membros do grupo poderão visualizá-los</p>
                <p>• Você não perderá nenhum dado</p>
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMigrateData(false);
                setPersonalDataCount(null);
                setNewlyCreatedGroupId(null);
              }}
            >
              Não, obrigado
            </Button>
            <Button
              onClick={() => {
                if (newlyCreatedGroupId) {
                  migratePersonalData(newlyCreatedGroupId);
                }
              }}
            >
              Sim, importar dados
            </Button>
          </div>
        </DialogContent>
      </Dialog >
    </>
  );
}
