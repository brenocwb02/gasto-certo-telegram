import { Crown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

export const SubscriptionStatus = () => {
  const { subscriptionInfo, loading, isPremium, createCheckout } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    try {
      await createCheckout();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o checkout.',
        variant: 'destructive',
      });
    }
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
      <Badge variant="default" className="bg-success text-success-foreground">
        <Crown className="h-3 w-3 mr-1" />
        Premium
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        <AlertCircle className="h-3 w-3 mr-1" />
        Gratuito
      </Badge>
      <Button size="sm" onClick={handleUpgrade}>
        Upgrade
      </Button>
    </div>
  );
};