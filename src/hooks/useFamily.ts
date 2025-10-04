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
      if (data && data.length > 0) {
        setCurrentGroup(data[0]);
        await loadFamilyMembers(data[0].id);
        await loadFamilyInvites(data[0].id);
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
        .select(`
          *,
          profile:profiles!family_members_member_id_fkey(nome, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMembers(data || []);
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

      setInvites(data || []);
    } catch (err) {
      console.error('Erro ao carregar convites da família:', err);
      setError('Erro ao carregar convites da família');
    }
  };

  // Criar novo grupo familiar
  const createFamilyGroup = async (name: string, description?: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await supabase.rpc('create_family_group', {
        group_name: name,
        group_description: description
      });

      if (error) throw error;

      if (data.success) {
        await loadFamilyGroups();
        return { success: true, message: data.message, group_id: data.group_id };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Erro ao criar grupo familiar:', err);
      throw err;
    }
  };

  // Convidar membro para o grupo
  const inviteFamilyMember = async (groupId: string, email: string, role: string = 'member') => {
    try {
      const { data, error } = await supabase.rpc('invite_family_member', {
        group_id: groupId,
        email: email,
        role: role
      });

      if (error) throw error;

      if (data.success) {
        // Buscar o convite criado para enviar email
        const { data: invite, error: inviteError } = await supabase
          .from('family_invites')
          .select(`
            *,
            family_groups!inner(name, description),
            inviter:profiles!family_invites_invited_by_fkey(nome)
          `)
          .eq('token', data.token)
          .single();

        if (!inviteError && invite) {
          // Enviar email de convite
          try {
            await supabase.functions.invoke('send-family-invite', {
              body: {
                inviteId: invite.id,
                groupName: invite.family_groups.name,
                inviterName: invite.inviter?.nome
              }
            });
          } catch (emailError) {
            console.warn('Erro ao enviar email de convite:', emailError);
            // Não falhar o processo se o email não for enviado
          }
        }

        await loadFamilyInvites(groupId);
        return { success: true, message: data.message, token: data.token };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Erro ao convidar membro:', err);
      throw err;
    }
  };

  // Aceitar convite familiar
  const acceptFamilyInvite = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_family_invite', {
        invite_token: token
      });

      if (error) throw error;

      if (data.success) {
        await loadFamilyGroups();
        return { success: true, message: data.message, group_id: data.group_id };
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      throw err;
    }
  };

  // Remover membro do grupo
  const removeFamilyMember = async (memberId: string) => {
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

  // Selecionar grupo atual
  const selectGroup = async (group: FamilyGroup) => {
    setCurrentGroup(group);
    await loadFamilyMembers(group.id);
    await loadFamilyInvites(group.id);
  };

  // Verificar se usuário é admin do grupo
  const isGroupAdmin = (groupId: string) => {
    const member = members.find(m => m.group_id === groupId && m.member_id === user?.id);
    return member?.role === 'owner' || member?.role === 'admin';
  };

  // Verificar se usuário é owner do grupo
  const isGroupOwner = (groupId: string) => {
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
    selectGroup,
    isGroupAdmin,
    isGroupOwner,
    loadFamilyGroups,
    loadFamilyMembers,
    loadFamilyInvites
  };
}
