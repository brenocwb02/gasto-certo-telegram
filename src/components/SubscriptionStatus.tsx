import { Crown, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLimits } from '@/hooks/useLimits';
import { useNavigate } from 'react-router-dom';

export const SubscriptionStatus = () => {
  const { loading, plan } = useLimits();
  const navigate = useNavigate();

  const isPremium = plan !== 'gratuito';

  const handleUpgrade = () => {
    navigate('/planos');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Verificando...</span>
      </div>
    );
  }

  if (isPremium) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white border-0">
        <Crown className="h-3 w-3 mr-1" />
        {plan === 'familia' ? 'Família' : plan === 'familia_plus' ? 'Família+' : 'Premium'}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-muted-foreground">
        <AlertCircle className="h-3 w-3 mr-1" />
        Gratuito
      </Badge>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleUpgrade}>
        Upgrade
      </Button>
    </div>
  );
};