import { useLicense } from '@/hooks/useLicense';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LicenseGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requirePremium?: boolean;
}

export function LicenseGuard({ children, fallback, requirePremium = false }: LicenseGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { license, loading: licenseLoading, error, isLicenseValid } = useLicense();

  // Se ainda carregando autenticação ou licença
  if (authLoading || licenseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando licença...</span>
        </div>
      </div>
    );
  }

  // Se não logado
  if (!user) {
    return fallback || <div>Acesso negado</div>;
  }

  // Se erro ao carregar licença
  if (error) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Erro ao verificar licença: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Se tem licença mas ela é inválida
  if (license && !isLicenseValid) {
    return fallback || (
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <ShieldAlert className="h-5 w-5" />
            Licença Necessária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sua licença não está ativa ou expirou.
          </p>
          <Badge variant="outline" className="text-warning border-warning">
            {license.status}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Se requer Premium, tratar ausência de licença como plano gratuito
  if (requirePremium && (!license || license.plano === 'gratuito')) {
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
            {license ? 'Plano Gratuito' : 'Sem plano (Gratuito)'}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Licença válida - mostrar conteúdo
  return <>{children}</>;
}

export function LicenseStatus() {
  const { license, loading, error, isLicenseValid } = useLicense();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <ShieldAlert className="h-3 w-3 text-warning" />
        <span className="text-warning">Licença Inválida</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!isLicenseValid) return 'text-warning';
    return 'text-success';
  };

  const getStatusIcon = () => {
    if (!isLicenseValid) return <ShieldAlert className="h-3 w-3" />;
    return <ShieldCheck className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (!isLicenseValid) return 'Inativa';
    if (license.tipo === 'vitalicia') return 'Vitalícia';
    return 'Ativa';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}