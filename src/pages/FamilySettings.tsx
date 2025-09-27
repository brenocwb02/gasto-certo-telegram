import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Mail, User, Loader2, CheckCircle, Trash2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FamilyGroup {
  id: string;
  owner_id: string;
  name: string;
}

interface FamilyMember {
  id: string;
  member_id: string;
  role: 'owner' | 'member';
  profiles: {
    nome: string;
    email: string;
  };
}

export default function FamilySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    document.title = "Família | Boas Contas";
    fetchFamilyData();
  }, [user]);

  const fetchFamilyData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // 1. Obter o grupo onde o usuário é o dono
      let { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      // Se não for dono, tentar buscar o grupo do qual é membro
      if (groupError || !groupData) {
        const { data: memberData } = await supabase
          .from('family_members')
          .select('group_id, family_groups(*)')
          .eq('member_id', user.id)
          .maybeSingle();

        if (memberData?.family_groups) {
          groupData = memberData.family_groups;
        }
      }

      if (groupData) {
        setGroup(groupData);

        // 2. Obter membros do grupo
        const { data: membersData, error: membersError } = await supabase
          .from('family_members')
          .select(`
            id,
            member_id,
            role,
            profiles (nome, user_id)
          `)
          .eq('group_id', groupData.id);

        if (membersError) throw membersError;

        // Adicionar email manualmente (não podemos buscar no RLS, mas é só um mock)
        const membersWithInfo: FamilyMember[] = (membersData || []).map(member => ({
          ...member,
          profiles: {
            nome: member.profiles?.nome || 'Usuário Desconhecido',
            email: member.member_id === user.id ? user.email || '' : 'Acesso Restrito' // Restringe o email de outros membros
          }
        }));
        
        setMembers(membersWithInfo);
      } else {
        // Usuário não está em nenhum grupo. Isso não deveria acontecer após a migração.
        console.warn("Usuário não está em nenhum grupo familiar.");
      }

    } catch (error) {
      console.error("Erro ao carregar dados familiares:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações familiares.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isOwner = group?.owner_id === user?.id;

  const handleInviteMember = async () => {
    if (!group || !isOwner || !newMemberEmail.trim()) return;

    setIsSendingInvite(true);
    
    // 1. Encontrar o ID do usuário pelo email (Busca apenas na auth.users)
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      primaryEmail: newMemberEmail
    });

    if (userError || userData.users.length === 0) {
      toast({
        title: "Erro",
        description: "Usuário com este e-mail não encontrado. Peça-o para se cadastrar.",
        variant: "destructive",
      });
      setIsSendingInvite(false);
      return;
    }

    const invitedUserId = userData.users[0].id;
    
    // 2. Tentar adicionar o novo membro ao grupo
    try {
      // Verifica se o usuário já é membro de outro grupo
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('group_id')
        .eq('member_id', invitedUserId)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Erro",
          description: "Este usuário já pertence a outro grupo familiar.",
          variant: "destructive",
        });
        setIsSendingInvite(false);
        return;
      }
      
      const { error } = await supabase
        .from('family_members')
        .insert({
          group_id: group.id,
          member_id: invitedUserId,
          role: 'member'
        });

      if (error) throw error;
      
      toast({
        title: "Membro Convidado",
        description: "O membro foi adicionado ao seu grupo familiar com sucesso.",
        variant: "success",
      });
      setNewMemberEmail('');
      fetchFamilyData(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao convidar membro:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro: " + (error instanceof Error ? error.message : 'Erro desconhecido'),
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!group || !isOwner || memberId === user?.id) {
      toast({
        title: "Erro",
        description: "Você não pode remover o dono do grupo.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Tem certeza que deseja remover este membro do grupo?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('group_id', group.id)
        .eq('member_id', memberId);

      if (error) throw error;

      toast({
        title: "Membro Removido",
        description: "O membro foi removido do grupo familiar.",
        variant: "success",
      });
      fetchFamilyData();
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Configurações Familiares
            </h1>
            <p className="text-muted-foreground">Gerencie o grupo e compartilhe suas finanças.</p>
          </div>

          <Separator />
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando grupo...</span>
            </div>
          ) : !group ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">
                  Erro: Não foi possível encontrar seu grupo familiar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Informações do Grupo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Detalhes do Grupo
                  </CardTitle>
                  <CardDescription>
                    O controle é compartilhado com todos os membros listados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="group-name">Nome do Grupo</Label>
                    <Input 
                      id="group-name"
                      value={group.name} 
                      disabled={!isOwner} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>ID do Grupo (Compartilhado)</Label>
                    <Input 
                      value={group.id} 
                      disabled 
                      className="mt-1 font-mono text-xs bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Este ID é usado para identificar o grupo (apenas para referência).
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Membros do Grupo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Membros ({members.length})
                  </CardTitle>
                  <CardDescription>
                    Membros podem ver e registrar transações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {members.map(member => (
                      <div 
                        key={member.member_id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {member.profiles.nome}
                              {member.role === 'owner' && (
                                <Badge variant="default" className="bg-primary/90 text-primary-foreground">
                                  Dono <Crown className="h-3 w-3 ml-1" />
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                          </div>
                        </div>
                        {isOwner && member.role !== 'owner' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMember(member.member_id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!isOwner && member.member_id === user?.id && (
                          <Badge variant="outline">Você</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Adicionar Novo Membro (Apenas para o Dono) */}
                  {isOwner && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="new-member-email">Convidar Novo Membro (por Email)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="new-member-email"
                            type="email"
                            placeholder="email@membro.com"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            disabled={isSendingInvite || loading}
                          />
                          <Button 
                            onClick={handleInviteMember}
                            disabled={!newMemberEmail.trim() || isSendingInvite || loading}
                          >
                            {isSendingInvite ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Convidando...
                              </>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" />
                                Convidar
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O e-mail deve corresponder a uma conta já cadastrada no Gasto Certo.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
