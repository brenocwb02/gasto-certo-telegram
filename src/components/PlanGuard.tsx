import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PlanGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requirePremium?: boolean;
}

export function PlanGuard({ children, fallback, requirePremium = false }: PlanGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscriptionInfo, loading: subscriptionLoading, error, isPremium } = useSubscription();

  // Se ainda carregando autenticação ou assinatura
  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando assinatura...</span>
        </div>
      </div>
    );
  }

  // Se não logado
  if (!user) {
    return fallback || <div>Acesso negado</div>;
  }

  // Se erro ao carregar assinatura
  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="flex items-center gap-2 pt-4">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">Erro ao verificar assinatura: {error}</span>
        </CardContent>
      </Card>
    );
  }

  // Se requer Premium e não tem
  if (requirePremium && !isPremium) {
    return fallback || (
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <ShieldAlert className="h-5 w-5" />
            Funcionalidade Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta funcionalidade está disponível apenas no plano Premium.
          </p>
          <Badge variant="outline" className="text-warning border-warning">
            {subscriptionInfo?.subscribed ? 'Plano Atual' : 'Plano Gratuito'}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Assinatura válida - mostrar conteúdo
  return <>{children}</>;
}

export function PlanStatus() {
  const { subscriptionInfo, loading, error, isPremium } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (error || !subscriptionInfo?.subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <ShieldAlert className="h-3 w-3 text-warning" />
        <span className="text-warning">Plano Gratuito</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${isPremium ? 'text-success' : 'text-warning'}`}>
      {isPremium ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
      <span>{isPremium ? 'Premium' : 'Básico'}</span>
    </div>
  );
}
