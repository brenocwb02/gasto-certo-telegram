import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface License {
  id: string;
  user_id: string;
  codigo: string;
  status: 'ativo' | 'expirado' | 'cancelado';
  tipo: 'vitalicia' | 'mensal' | 'anual';
  data_ativacao: string | null;
  data_expiracao: string | null;
  created_at: string;
  updated_at: string;
}

export function useLicense() {
  const { user } = useAuth();
  const [license, setLicense] = useState<License | null>(null);
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
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'ativo')
          .single();

        if (supabaseError) {
          console.error('Erro ao buscar licença:', supabaseError);
          setError('Erro ao verificar licença');
          return;
        }

        setLicense(data as License);
      } catch (err) {
        console.error('Erro inesperado:', err);
        setError('Erro inesperado ao verificar licença');
      } finally {
        setLoading(false);
      }
    };

    fetchLicense();
  }, [user]);

  const isLicenseValid = () => {
    if (!license) return false;
    if (license.status !== 'ativo') return false;
    
    // Para licenças vitalícias, sempre válidas se ativas
    if (license.tipo === 'vitalicia') return true;
    
    // Para outras licenças, verificar data de expiração
    if (license.data_expiracao) {
      const now = new Date();
      const expiration = new Date(license.data_expiracao);
      return now <= expiration;
    }
    
    return true;
  };

  const getLicenseInfo = () => {
    if (!license) return null;
    
    return {
      ...license,
      isValid: isLicenseValid(),
      daysUntilExpiration: license.data_expiracao 
        ? Math.ceil((new Date(license.data_expiracao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null
    };
  };

  return {
    license,
    loading,
    error,
    isLicenseValid: isLicenseValid(),
    getLicenseInfo
  };
}