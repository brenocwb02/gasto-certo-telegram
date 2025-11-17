import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FamilyGroup {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  group_id: string;
  member_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'suspended';
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  profile?: {
    nome: string;
    avatar_url?: string;
  };
}

export interface FamilyInvite {
  id: string;
  group_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export function useFamily() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar grupos familiares do usuário
  const loadFamilyGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          family_members!inner(
            member_id,
            role,
            status
          )
        `)
        .eq('family_members.member_id', user.id)
        .eq('family_members.status', 'active');

      if (error) throw error;

      setGroups(data || []);
      
      // Se há grupos, selecionar o primeiro como atual
      // Esta é a lógica principal do "Produto A". Perfeito!
      if (data && data.length > 0) {
        setCurrentGroup(data[0]);
        // Não precisamos de 'await' aqui, pois o useEffect [currentGroup] vai tratar disso
        // await loadFamilyMembers(data[0].id);
        // await loadFamilyInvites(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar grupos familiares:', err);
      setError('Erro ao carregar grupos familiares');
    } finally {
      setLoading(false);
    }
  };

  // Carregar membros do grupo atual
  const loadFamilyMembers = async (groupId: string) => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar perfis separadamente para evitar erros de relação
      if (data && data.length > 0) {
        const memberIds = data.map(m => m.member_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome, avatar_url')
          .in('user_id', memberIds);

        const membersWithProfiles = data.map(member => ({
          ...member,
          profile: profiles?.find(p => p.user_id === member.member_id)
        })) as FamilyMember[];

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error('Erro ao carregar membros da família:', err);
      setError('Erro ao carregar membros da família');
    }
  };

  // Carregar convites do grupo atual
  const loadFamilyInvites = async (groupId: string) => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvites((data || []) as FamilyInvite[]);
    } catch (err) {
      console.error('Erro ao carregar convites da família:', err);
      setError('Erro ao carregar convites da família');
    }
  };

  // Criar novo grupo familiar
  const createFamilyGroup = async (name: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // !! CORREÇÃO !!
      // A função RPC 'create_family_group' espera o p_user_id.
      // Estamos a enviá-lo a partir do 'user' do useAuth.
      const { data, error } = await supabase.rpc('create_family_group', {
        p_group_name: name,
        p_user_id: user.id // <-- ESTA LINHA FOI ADICIONADA
      });

      if (error) {
        // Se a trava for ativada, o erro 'USER_ALREADY_IN_GROUP' será capturado aqui
        throw error;
      }
      
      // Se a função RPC for bem-sucedida, ela já criou o grupo e adicionou o membro.
      // Apenas precisamos de recarregar os dados.
      await loadFamilyGroups();
      return { success: true, message: 'Grupo criado com sucesso!', group_id: data };
    } catch (err) {
      console.error('Erro ao criar grupo familiar:', err);
      throw err;
    }
  };

  // Convidar membro para o grupo
  const inviteFamilyMember = async (groupId: string, name: string, role: string = 'member') => {
    try {
      // Gerar token único e fácil de compartilhar
      const token = 'FAM_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      // Criar convite diretamente
      const { error: inviteError } = await supabase
        .from('family_invites')
        .insert({
          group_id: groupId,
          email: name + '@convite.local', // Email placeholder
          role,
          invited_by: user!.id,
          token,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          status: 'pending'
        });

      if (inviteError) throw inviteError;

      await loadFamilyInvites(groupId);
      return { success: true, message: 'Código de convite gerado! Compartilhe com seu familiar.', token };
    } catch (err) {
      console.error('Erro ao criar convite:', err);
      throw err;
    }
  };

  // Aceitar convite familiar
  const acceptFamilyInvite = async (token: string) => {
    if (!user) throw new Error('Usuário não autenticado'); // Precisa do user.id

    try {
      // !! CORREÇÃO !!
      // A função RPC 'accept_family_invite' espera o p_user_id.
      // Estamos a enviá-lo a partir do 'user' do useAuth.
      const { data, error } = await supabase.rpc('accept_family_invite', {
        invite_token: token,
        p_user_id: user.id // <-- ESTA LINHA FOI ADICIONADA
      });
      
      if (error) {
         // Se a trava for ativada, o erro 'USER_ALREADY_IN_GROUP' será capturado aqui
        throw error;
      }

      // Se a função RPC for bem-sucedida, já estamos no grupo.
      // Apenas precisamos de recarregar os dados.
      await loadFamilyGroups();
      // O 'data' é o objeto JSON que a função SQL retorna
      return { success: true, message: 'Convite aceito com sucesso!', group_id: data.group_id };
    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      throw err;
    }
  };

  // Remover membro do grupo
  const removeFamilyMember = async (memberId: string) => {
// ... (código original sem alteração) ...
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      if (currentGroup) {
        await loadFamilyMembers(currentGroup.id);
      }
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      throw err;
    }
  };

  // Atualizar role do membro
  const updateMemberRole = async (memberId: string, newRole: string) => {
// ... (código original sem alteração) ...
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      if (currentGroup) {
        await loadFamilyMembers(currentGroup.id);
      }
    } catch (err) {
      console.error('Erro ao atualizar role do membro:', err);
      throw err;
    }
  };

  // Cancelar convite
  const cancelInvite = async (inviteId: string) => {
// ... (código original sem alteração) ...
    try {
      const { error } = await supabase
        .from('family_invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId);

      if (error) throw error;

      if (currentGroup) {
        await loadFamilyInvites(currentGroup.id);
      }
    } catch (err) {
      console.error('Erro ao cancelar convite:', err);
      throw err;
    }
  };

  // Deletar grupo familiar
  const deleteFamilyGroup = async (groupId: string) => {
// ... (código original sem alteração) ...
    try {
      // Verificar se é o owner
      const group = groups.find(g => g.id === groupId);
      if (!group || group.owner_id !== user?.id) {
        throw new Error('Apenas o proprietário pode deletar o grupo');
      }

      // Deletar todos os membros primeiro
      const { error: membersError } = await supabase
        .from('family_members')
        .delete()
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Deletar todos os convites
      const { error: invitesError } = await supabase
        .from('family_invites')
        .delete()
        .eq('group_id', groupId);

      if (invitesError) throw invitesError;

      // Deletar o grupo
      const { error: groupError } = await supabase
        .from('family_groups')
        .delete()
        .eq('id', groupId);

      if (groupError) throw groupError;

      await loadFamilyGroups();
      return { success: true, message: 'Grupo deletado com sucesso!' };
    } catch (err) {
      console.error('Erro ao deletar grupo:', err);
      throw err;
    }
  };

  // Selecionar grupo atual
  const selectGroup = async (group: FamilyGroup) => {
    // !! MODIFICAÇÃO IMPORTANTE !!
    // Esta função não deve fazer nada, pois estamos no modo "1 Grupo".
    // A UI (FamilySettings.tsx) já foi modificada para não usar isto.
    console.warn("A troca de grupo está desabilitada (1 Conta = 1 Grupo).", group);
    // setCurrentGroup(group);
    // await loadFamilyMembers(group.id);
    // await loadFamilyInvites(group.id);
  };

  // Verificar se usuário é admin do grupo
  const isGroupAdmin = (groupId: string) => {
// ... (código original sem alteração) ...
    const member = members.find(m => m.group_id === groupId && m.member_id === user?.id);
    return member?.role === 'owner' || member?.role === 'admin';
  };

  // Verificar se usuário é owner do grupo
  const isGroupOwner = (groupId: string) => {
// ... (código original sem alteração) ...
    const member = members.find(m => m.group_id === groupId && m.member_id === user?.id);
    return member?.role === 'owner';
  };

  useEffect(() => {
    if (user) {
      loadFamilyGroups();
    }
  }, [user]);

  useEffect(() => {
    if (currentGroup) {
      loadFamilyMembers(currentGroup.id);
      loadFamilyInvites(currentGroup.id);
    } else {
      // Se não houver grupo (ex: usuário acabou de deletar o seu), limpar os dados
      setMembers([]);
      setInvites([]);
    }
  }, [currentGroup]);

  return {
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
    deleteFamilyGroup,
    selectGroup,
    isGroupAdmin,
    isGroupOwner,
    loadFamilyGroups,
    loadFamilyMembers,
    loadFamilyInvites
  };
}
