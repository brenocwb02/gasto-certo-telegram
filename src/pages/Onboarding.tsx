import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Users, 
  Wallet, 
  Target, 
  BarChart3,
  Smartphone,
  Heart,
  Star,
  Crown,
  TrendingUp,
  TrendingDown,
  Bot
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/use-toast";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
}

export default function Onboarding() {
  const { profile, updateOnboardingCompleted } = useProfile();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Bem-vindo ao Zaq!",
      description: "Sua jornada para boas contas começa aqui",
      icon: Heart,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Olá, {profile?.nome || 'Usuário'}! 👋</h3>
            <p className="text-muted-foreground">
              O Zaq é mais que um app de finanças - é uma ferramenta baseada em princípios cristãos 
              para ajudar sua família a ter boas contas e uma vida financeira saudável.
            </p>
          </div>
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm text-primary font-medium">
              "O que adianta ao homem ganhar o mundo inteiro e perder a sua alma?" - Marcos 8:36
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Controle Total",
      description: "Gerencie receitas, despesas e investimentos",
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Receitas</h4>
                  <p className="text-sm text-muted-foreground">Salários, vendas, etc.</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Despesas</h4>
                  <p className="text-sm text-muted-foreground">Compras, contas, etc.</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Dica:</h4>
            <p className="text-sm">
              Registre suas transações naturalmente: "Gastei R$ 50 no mercado" ou "Recebi R$ 1000 de salário"
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Gestão Familiar",
      description: "Compartilhe finanças com sua família",
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Trabalho em Equipe</h3>
            <p className="text-muted-foreground">
              Convide membros da família para participar do controle financeiro
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Crown className="h-5 w-5 text-yellow-500" />
              <div>
                <h4 className="font-medium">Proprietário</h4>
                <p className="text-sm text-muted-foreground">Controle total do grupo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Star className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Administrador</h4>
                <p className="text-sm text-muted-foreground">Pode convidar membros</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium">Membro</h4>
                <p className="text-sm text-muted-foreground">Adiciona transações</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Metas e Objetivos",
      description: "Defina e acompanhe suas metas financeiras",
      icon: Target,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sonhos em Ação</h3>
            <p className="text-muted-foreground">
              Transforme seus sonhos em metas mensuráveis
            </p>
          </div>
          
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Casa Própria</h4>
                <Badge variant="secondary">R$ 50.000 / R$ 200.000</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">25% concluído</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Fundo de Emergência</h4>
                <Badge variant="secondary">R$ 8.000 / R$ 15.000</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '53%' }}></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">53% concluído</p>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Telegram Bot",
      description: "Controle suas finanças pelo Telegram",
      icon: Smartphone,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Controle pelo Telegram</h3>
            <p className="text-muted-foreground">
              Registre transações diretamente pelo bot do Telegram
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm space-y-2">
            <div className="text-green-600">"Gastei R$ 50 no mercado"</div>
            <div className="text-blue-600">"Recebi R$ 1000 de salário"</div>
            <div className="text-purple-600">"Transferi R$ 200 da conta para carteira"</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🤖 Comandos Úteis:</h4>
            <ul className="text-sm space-y-1">
              <li>• <code>/saldo</code> - Ver saldo das contas</li>
              <li>• <code>/extrato</code> - Últimas transações</li>
              <li>• <code>/metas</code> - Progresso das metas</li>
              <li>• <code>/perguntar</code> - Faça perguntas sobre seus gastos</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Relatórios Inteligentes",
      description: "Visualize seu progresso financeiro",
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Insights Poderosos</h3>
            <p className="text-muted-foreground">
              Gráficos e análises para entender seus padrões de gastos
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold">Evolução</h4>
              <p className="text-sm text-muted-foreground">Patrimônio ao longo do tempo</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Comparativo</h4>
              <p className="text-sm text-muted-foreground">Orçado vs Realizado</p>
            </Card>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎯 IA Integrada:</h4>
            <p className="text-sm">
              Faça perguntas como "Quanto gastei com alimentação este mês?" e receba respostas inteligentes!
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateOnboardingCompleted(true);
      toast({
        title: "Onboarding concluído!",
        description: "Bem-vindo ao Zaq - Boas Contas! Redirecionando...",
      });
      // Force a full page reload and replace the history entry.
      // This is the most reliable way to ensure the app state is fully updated.
      window.location.replace('/');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao concluir onboarding",
        variant: "destructive",
      });
      setIsSubmitting(false); // Re-enable button on error
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Zaq - Boas Contas</span>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="flex items-center justify-center gap-2">
              <Icon className="h-6 w-6 text-primary" />
              {currentStepData.title}
            </CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStepData.content}
          
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              <Button variant="ghost" onClick={handleComplete} disabled={isSubmitting}>
                Pular Tutorial
              </Button>
            </div>
            
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Aguarde...' : currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Começar a Usar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

