import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NetWorthData {
  netWorth: number;
  breakdown: {
    cash: number;
    investments: number;
    debts: number;
  };
  monthlyChange: number;
  calculatedAt: string;
}

export const useNetWorth = () => {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNetWorth = async () => {
    setLoading(true);
    try {
      const { data: response, error: functionError } = await supabase.functions.invoke('calculate-net-worth');

      if (functionError) throw functionError;

      // Transform raw response to match NetWorthData interface
      const transformedData: NetWorthData = {
        netWorth: response.netWorth || 0,
        breakdown: {
          cash: response.totalAssets || 0, // Simplificação: assume totalAssets como cash por enquanto
          investments: response.assetsByType?.investimentos || 0,
          debts: response.totalLiabilities || 0
        },
        monthlyChange: 0, // Backend ainda não retorna histórico
        calculatedAt: new Date().toISOString()
      };

      setData(transformedData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro ao calcular patrimônio',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetWorth();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchNetWorth
  };
};
