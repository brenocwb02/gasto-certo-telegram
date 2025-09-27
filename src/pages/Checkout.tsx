import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Crown, CheckCircle, XCircle, Loader2, ArrowRight, Star } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useSubscription } from '../hooks/useSubscription';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const CheckoutPage = () => {
  const { toast } = useToast();
  const { subscriptionInfo, loading, isPremium, createCheckout, openCustomerPortal } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await createCheckout();
    } catch (error) {
      toast({
        title: 'Erro no Checkout',
        description: 'Não foi possível iniciar o processo de pagamento.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o portal do cliente.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex flex-col sm:pl-14">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando informações da assinatura...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Planos do Boas Contas</h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano ideal para transformar sua vida financeira
              </p>
            </div>

            {/* Current Subscription Status */}
            {isPremium && (
              <Card className="border-success bg-success/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="h-6 w-6 text-success" />
                      <div>
                        <h3 className="font-semibold text-success">Você já é Premium!</h3>
                        <p className="text-sm text-muted-foreground">
                          Aproveite todos os recursos disponíveis.
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleCustomerPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Gerenciar Assinatura
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plans Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <Card className="relative">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Plano Gratuito</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold">R$ 0</div>
                    <p className="text-muted-foreground">Para sempre</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Dashboard financeiro básico</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Registro manual de transações</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>1 conta bancária</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>5 categorias personalizadas</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Relatórios avançados</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Metas e orçamentos</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Integração Telegram com IA</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full" disabled>
                    Plano Atual
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative border-primary shadow-lg">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Star className="h-4 w-4 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Crown className="h-6 w-6 text-primary" />
                    Plano Premium
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">R$ 29,90</div>
                    <p className="text-muted-foreground">Por mês</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>Tudo do plano gratuito</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Contas bancárias ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Categorias ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Relatórios avançados</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Metas e orçamentos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Integração Telegram com IA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Suporte prioritário</span>
                    </div>
                  </div>
                  
                  {isPremium ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleCustomerPortal}
                      disabled={portalLoading}
                    >
                      {portalLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Gerenciar Assinatura
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCheckout} 
                      disabled={checkoutLoading} 
                      className="w-full text-lg py-6"
                    >
                      {checkoutLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-5 w-5 mr-2" />
                      )}
                      Fazer Upgrade Agora
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Features Details */}
            <Card>
              <CardHeader>
                <CardTitle>Por que escolher o Premium?</CardTitle>
                <CardDescription>
                  Descubra como o plano Premium pode transformar sua gestão financeira
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Crown className="h-6 w-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Controle Total</h3>
                        <p className="text-sm text-muted-foreground">
                          Gerencie quantas contas e categorias precisar, sem limitações.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="h-6 w-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Inteligência Artificial</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicione transações via Telegram usando linguagem natural.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Relatórios Avançados</h3>
                        <p className="text-sm text-muted-foreground">
                          Visualize tendências e padrões com gráficos detalhados.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ArrowRight className="h-6 w-6 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">Metas Inteligentes</h3>
                        <p className="text-sm text-muted-foreground">
                          Defina objetivos financeiros e acompanhe seu progresso.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Perguntas Frequentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h4>
                  <p className="text-sm text-muted-foreground">
                    Sim! Você pode cancelar sua assinatura a qualquer momento através do seu painel de controle.
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Como funciona a integração com Telegram?</h4>
                  <p className="text-sm text-muted-foreground">
                    Com o plano Premium, você pode registrar transações enviando mensagens como "Gastei 50 reais no supermercado" diretamente para nosso bot.
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Meus dados estão seguros?</h4>
                  <p className="text-sm text-muted-foreground">
                    Absolutely! Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança para proteger suas informações financeiras.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CheckoutPage;

