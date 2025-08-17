import { useEffect } from 'react';
import { useLicense } from '@/hooks/useLicense';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Crown, 
  Calendar,
  User,
  Key,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const License = () => {
  const { user } = useAuth();
  const { license, loading, error, isLicenseValid, getLicenseInfo } = useLicense();

  useEffect(() => {
    document.title = "Metas | Boas Contas";
  }, []);

  const licenseInfo = getLicenseInfo();

  if (loading) {
    return (
      <main className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">Carregando informações da licença...</h1>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-warning" />
            Erro na Licença
          </h1>
          <Card className="border-warning bg-warning/5">
            <CardContent className="pt-6">
              <p className="text-warning">{error}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!license) {
    return (
      <main className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-warning" />
            Licença não encontrada
          </h1>
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning">Nenhuma licença ativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Não foi encontrada nenhuma licença ativa para sua conta.
              </p>
              <Button variant="outline" className="w-full">
                Entrar em Contato com Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const getStatusBadge = () => {
    if (!isLicenseValid) {
      return (
        <Badge variant="outline" className="text-warning border-warning bg-warning/10">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Inativa
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-success border-success bg-success/10">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Ativa
      </Badge>
    );
  };

  const getTipoBadge = () => {
    const variants = {
      vitalicia: { variant: 'default' as const, icon: Crown, color: 'text-primary' },
      anual: { variant: 'secondary' as const, icon: Calendar, color: 'text-muted-foreground' },
      mensal: { variant: 'outline' as const, icon: Calendar, color: 'text-muted-foreground' }
    };
    
    const config = variants[license.tipo] || variants.vitalicia;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {license.tipo === 'vitalicia' ? 'Vitalícia' : 
         license.tipo === 'anual' ? 'Anual' : 'Mensal'}
      </Badge>
    );
  };

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Informações da Licença</h1>
        </div>

        <Card className="financial-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Licença Principal
              </CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Código da Licença
                </label>
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded-md">
                  {license.codigo}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo
                </label>
                <div>
                  {getTipoBadge()}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Data de Ativação
                </label>
                <p className="text-sm">
                  {license.data_ativacao 
                    ? format(new Date(license.data_ativacao), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Não informado'
                  }
                </p>
              </div>

              {license.data_expiracao && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Data de Expiração
                  </label>
                  <p className="text-sm">
                    {format(new Date(license.data_expiracao), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {licenseInfo?.daysUntilExpiration && licenseInfo.daysUntilExpiration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {licenseInfo.daysUntilExpiration} dias restantes
                    </p>
                  )}
                </div>
              )}
            </div>

            {license.tipo === 'vitalicia' && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-primary">
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">Licença Vitalícia</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesso completo e permanente a todas as funcionalidades do Gasto Certo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm">{user?.email}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                ID do Usuário
              </label>
              <p className="font-mono text-xs bg-muted px-3 py-2 rounded-md break-all">
                {user?.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Precisa de ajuda com sua licença? Entre em contato conosco.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Contatar Suporte
              </Button>
              <Button variant="outline" className="flex-1">
                FAQ sobre Licenças
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default License;
