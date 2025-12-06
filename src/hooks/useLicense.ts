import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LicenseInfo {
  codigo: string;
  status: string;
  tipo: string;
  plano: string;
  data_ativacao: string | null;
  data_expiracao: string | null;
}

export function useLicense() {
  const { user } = useAuth();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLicense(null);
      setLoading(false);
      return;
    }

    const fetchLicense = async () => {
      try {
        setLoading(true);
        const { data, error: licenseError } = await supabase
          .from('licenses')
          .select('codigo, status, tipo, plano, data_ativacao, data_expiracao')
          .eq('user_id', user.id)
          .eq('status', 'ativo')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (licenseError) throw licenseError;
        setLicense(data);
      } catch (err) {
        console.error('Error fetching license:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar licença');
      } finally {
        setLoading(false);
      }
    };

    fetchLicense();
  }, [user]);

  const isActive = license?.status === 'ativo';
  const isPremium = license?.plano === 'premium' || license?.plano === 'familia' || license?.plano === 'familia_plus';
  const isLifetime = license?.tipo === 'vitalicia';

  return {
    license,
    loading,
    error,
    isActive,
    isPremium,
    isLifetime,
  };
}
