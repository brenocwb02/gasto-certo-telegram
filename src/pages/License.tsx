import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useLicense } from '@/hooks/useLicense';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Crown, 
  Calendar,
  User,
  Mail,
  MessageSquare,
  Users,
  CreditCard,
  Target,
  BarChart3,
  Bot,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function License() {
  const { user } = useAuth();
  const { license, loading, error, isLicenseValid, getLicenseInfo } = useLicense();

  useEffect(() => {
    document.title = 'Licença - Gasto Certo';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Carregando informações da licença...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="border-destructive bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-6 w-6" />
                    Erro ao Carregar Licença
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar Novamente
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const licenseInfo = getLicenseInfo();
  const isPremium = licenseInfo?.plano === 'premium';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header />
        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Planos e Licenças</h1>
                <p className="text-muted-foreground">
                  Gerencie sua licença e veja os recursos disponíveis.
                </p>
              </div>
            </div>

            {/* Status Atual */}
            <Card className={isPremium ? "border-success bg-success/5" : "border-warning bg-warning/5"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isPremium ? (
                    <Crown className="h-5 w-5 text-success" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-warning" />
                  )}
                  Sua Licença Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Badge variant={isPremium ? "default" : "outline"} className={isPremium ? "bg-success text-success-foreground" : "text-warning border-warning"}>
                      {isPremium ? "Premium" : "Gratuito"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Código: {license?.codigo || "N/A"}
                    </p>
                    {licenseInfo?.data_ativacao && (
                      <p className="text-sm text-muted-foreground">
                        Ativo desde: {new Date(licenseInfo.data_ativacao).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-success">
                      {isPremium ? "Premium" : "Gratuito"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isPremium ? "Recursos completos" : "Recursos limitados"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparação de Planos */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Plano Gratuito */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Plano Gratuito
                  </CardTitle>
                  <div className="text-3xl font-bold">R$ 0</div>
                  <p className="text-sm text-muted-foreground">Para sempre</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Dashboard financeiro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Registro manual de transações</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">1 conta bancária</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">5 categorias personalizadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Relatórios avançados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Metas financeiras</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Integração Telegram (NLP)</span>
                    </div>
                  </div>
                  {!isPremium && (
                    <Badge variant="secondary" className="w-fit">Plano Atual</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Plano Premium */}
              <Card className="relative border-primary">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Plano Premium
                  </CardTitle>
                  <div className="text-3xl font-bold text-primary">R$ 29,90</div>
                  <p className="text-sm text-muted-foreground">Por mês</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Tudo do plano gratuito</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Contas ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Categorias ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Relatórios avançados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Metas e orçamentos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">Integração Telegram com IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">Suporte prioritário</span>
                    </div>
                  </div>
                  {isPremium ? (
                    <Badge variant="default" className="w-fit bg-success text-success-foreground">Plano Atual</Badge>
                  ) : (
                    <Button className="w-full" onClick={() => window.open('/support', '_self')}>
                      Fazer Upgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Funcionalidades Detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Funcionalidade</th>
                        <th className="text-center p-3">Gratuito</th>
                        <th className="text-center p-3">Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Dashboard Financeiro
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-4 w-4 text-success mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-4 w-4 text-success mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Contas Bancárias
                        </td>
                        <td className="text-center p-3 text-muted-foreground">1 conta</td>
                        <td className="text-center p-3 text-success font-medium">Ilimitadas</td>
                      </tr>
                      <tr>
                        <td className="p-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Categorias
                        </td>
                        <td className="text-center p-3 text-muted-foreground">5 categorias</td>
                        <td className="text-center p-3 text-success font-medium">Ilimitadas</td>
                      </tr>
                      <tr>
                        <td className="p-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Relatórios e Metas
                        </td>
                        <td className="text-center p-3">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-4 w-4 text-success mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Telegram com IA
                        </td>
                        <td className="text-center p-3">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-4 w-4 text-success mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Conta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">ID do Usuário</p>
                      <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suporte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Precisa de Ajuda?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está sempre pronta para ajudar você a aproveitar ao máximo o Gasto Certo.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.open('/support', '_self')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contatar Suporte
                  </Button>
                  <Button variant="outline" onClick={() => window.open('/support', '_self')}>
                    <Users className="h-4 w-4 mr-2" />
                    FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}