import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminStats {
  total_users: number;
  active_licenses: number;
  free_users: number;
  premium_users: number;
  familia_users: number;
  mrr: number;
  new_users_30d: number;
  new_users_7d: number;
  conversion_rate: number;
}

interface AdminUser {
  user_id: string;
  nome: string;
  email: string;
  created_at: string;
  telegram_connected: boolean;
  license_status: string;
  license_plano: string;
  license_tipo: string;
  license_expiracao: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  admin_user_id: string;
  affected_user_id: string | null;
  table_name: string | null;
  record_id: string | null;
  query_details: Record<string, unknown> | null;
  created_at: string;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Verificar se usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (err) {
        console.error('Erro ao verificar admin:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      setStats(data as unknown as AdminStats);
    } catch (err) {
      console.error('Erro ao buscar stats:', err);
      setError('Erro ao carregar estatísticas');
    }
  }, [isAdmin]);

  // Buscar usuários
  const fetchUsers = useCallback(async (search?: string, limit = 50, offset = 0) => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase.rpc('get_admin_users', {
        p_limit: limit,
        p_offset: offset,
        p_search: search
      });
      if (error) throw error;
      setUsers(data as unknown as AdminUser[]);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao carregar usuários');
    }
  }, [isAdmin]);

  // Buscar logs de auditoria
  const fetchAuditLogs = useCallback(async (limit = 50) => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAuditLogs(data as AuditLog[]);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
      setError('Erro ao carregar logs de auditoria');
    }
  }, [isAdmin]);

  // Atualizar licença de usuário
  const updateLicense = useCallback(async (
    userId: string,
    plano: string,
    status = 'ativo',
    tipo = 'mensal',
    dataExpiracao?: string
  ) => {
    if (!isAdmin) throw new Error('Acesso negado');

    const { data, error } = await supabase.rpc('admin_update_license', {
      p_user_id: userId,
      p_plano: plano,
      p_status: status,
      p_tipo: tipo,
      p_data_expiracao: dataExpiracao
    });

    if (error) throw error;
    
    // Recarregar dados
    await Promise.all([fetchStats(), fetchUsers()]);
    
    return data;
  }, [isAdmin, fetchStats, fetchUsers]);

  // Carregar dados iniciais quando admin confirmado
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      fetchAuditLogs();
    }
  }, [isAdmin, fetchStats, fetchUsers, fetchAuditLogs]);

  return {
    isAdmin,
    loading,
    error,
    stats,
    users,
    auditLogs,
    fetchStats,
    fetchUsers,
    fetchAuditLogs,
    updateLicense,
  };
}
