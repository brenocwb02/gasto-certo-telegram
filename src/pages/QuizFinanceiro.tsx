import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Shield,
  PiggyBank,
  TrendingUp,
  Target,
  Calculator,
  Umbrella,
  Clock,
  Award,
  Lightbulb
} from 'lucide-react';
import { useFinancialProfile } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';

interface QuizQuestion {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  options: {
    value: string;
    label: string;
    description: string;
  }[];
}

const QuizFinanceiro = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitFinancialProfile, getFinancialHealthLevel, getRecommendations, loading } = useFinancialProfile();

  const questions: QuizQuestion[] = [
    {
      id: 'emergency_fund',
      title: 'Fundo de Emergência',
      description: 'Quanto você tem reservado para emergências?',
      icon: <Shield className="h-6 w-6" />,
      options: [
        { value: 'none', label: 'Nada', description: 'Não tenho reserva de emergência' },
        { value: 'less_than_1_month', label: 'Menos de 1 mês', description: 'Tenho menos de 1 mês de gastos reservados' },
        { value: '1_to_3_months', label: '1-3 meses', description: 'Tenho de 1 a 3 meses de gastos reservados' },
        { value: '3_to_6_months', label: '3-6 meses', description: 'Tenho de 3 a 6 meses de gastos reservados' },
        { value: 'more_than_6_months', label: 'Mais de 6 meses', description: 'Tenho mais de 6 meses de gastos reservados' }
      ]
    },
    {
      id: 'debt_situation',
      title: 'Situação de Dívidas',
      description: 'Como está sua situação com dívidas?',
      icon: <Calculator className="h-6 w-6" />,
      options: [
        { value: 'no_debt', label: 'Sem dívidas', description: 'Não tenho dívidas' },
        { value: 'low_debt', label: 'Dívidas baixas', description: 'Tenho dívidas pequenas e controláveis' },
        { value: 'moderate_debt', label: 'Dívidas moderadas', description: 'Tenho dívidas moderadas, mas gerenciáveis' },
        { value: 'high_debt', label: 'Dívidas altas', description: 'Tenho dívidas significativas' },
        { value: 'overwhelming_debt', label: 'Dívidas esmagadoras', description: 'Minhas dívidas são muito altas' }
      ]
    },
    {
      id: 'savings_rate',
      title: 'Taxa de Poupança',
      description: 'Quanto você consegue poupar por mês?',
      icon: <PiggyBank className="h-6 w-6" />,
      options: [
        { value: 'negative', label: 'Negativo', description: 'Gasto mais do que ganho' },
        { value: '0_to_5_percent', label: '0-5%', description: 'Poupo de 0 a 5% da renda' },
        { value: '5_to_10_percent', label: '5-10%', description: 'Poupo de 5 a 10% da renda' },
        { value: '10_to_20_percent', label: '10-20%', description: 'Poupo de 10 a 20% da renda' },
        { value: 'more_than_20_percent', label: 'Mais de 20%', description: 'Poupo mais de 20% da renda' }
      ]
    },
    {
      id: 'investment_knowledge',
      title: 'Conhecimento em Investimentos',
      description: 'Como você avalia seu conhecimento sobre investimentos?',
      icon: <TrendingUp className="h-6 w-6" />,
      options: [
        { value: 'beginner', label: 'Iniciante', description: 'Não sei nada sobre investimentos' },
        { value: 'basic', label: 'Básico', description: 'Conheço o básico sobre investimentos' },
        { value: 'intermediate', label: 'Intermediário', description: 'Tenho conhecimento intermediário' },
        { value: 'advanced', label: 'Avançado', description: 'Tenho conhecimento avançado' },
        { value: 'expert', label: 'Especialista', description: 'Sou especialista em investimentos' }
      ]
    },
    {
      id: 'financial_goals',
      title: 'Objetivos Financeiros',
      description: 'Qual é seu principal objetivo financeiro?',
      icon: <Target className="h-6 w-6" />,
      options: [
        { value: 'survival', label: 'Sobrevivência', description: 'Conseguir pagar as contas básicas' },
        { value: 'stability', label: 'Estabilidade', description: 'Ter estabilidade financeira' },
        { value: 'growth', label: 'Crescimento', description: 'Crescer meu patrimônio' },
        { value: 'wealth_building', label: 'Construção de Riqueza', description: 'Construir riqueza significativa' },
        { value: 'legacy', label: 'Legado', description: 'Deixar um legado financeiro' }
      ]
    },
    {
      id: 'budget_control',
      title: 'Controle de Orçamento',
      description: 'Como você controla seus gastos?',
      icon: <Calculator className="h-6 w-6" />,
      options: [
        { value: 'no_budget', label: 'Sem orçamento', description: 'Não tenho controle de gastos' },
        { value: 'informal', label: 'Informal', description: 'Tenho uma ideia geral dos gastos' },
        { value: 'basic_tracking', label: 'Controle básico', description: 'Acompanho gastos básicos' },
        { value: 'detailed_budget', label: 'Orçamento detalhado', description: 'Tenho orçamento detalhado' },
        { value: 'advanced_planning', label: 'Planejamento avançado', description: 'Uso planejamento financeiro avançado' }
      ]
    },
    {
      id: 'insurance_coverage',
      title: 'Cobertura de Seguros',
      description: 'Como está sua cobertura de seguros?',
      icon: <Umbrella className="h-6 w-6" />,
      options: [
        { value: 'none', label: 'Nenhuma', description: 'Não tenho seguros' },
        { value: 'basic', label: 'Básica', description: 'Tenho seguros básicos' },
        { value: 'adequate', label: 'Adequada', description: 'Tenho cobertura adequada' },
        { value: 'comprehensive', label: 'Abrangente', description: 'Tenho cobertura abrangente' },
        { value: 'excellent', label: 'Excelente', description: 'Tenho excelente cobertura' }
      ]
    },
    {
      id: 'retirement_planning',
      title: 'Planejamento de Aposentadoria',
      description: 'Como está seu planejamento para aposentadoria?',
      icon: <Clock className="h-6 w-6" />,
      options: [
        { value: 'not_started', label: 'Não começou', description: 'Não pensei na aposentadoria' },
        { value: 'thinking_about_it', label: 'Pensando', description: 'Estou pensando sobre isso' },
        { value: 'basic_plan', label: 'Plano básico', description: 'Tenho um plano básico' },
        { value: 'detailed_plan', label: 'Plano detalhado', description: 'Tenho um plano detalhado' },
        { value: 'expert_level', label: 'Nível especialista', description: 'Tenho planejamento especializado' }
      ]
    }
  ];

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitFinancialProfile(answers as any);
      setShowResults(true);
      toast({
        title: "Quiz Concluído!",
        description: "Seu perfil financeiro foi salvo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar seu perfil financeiro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (showResults) {
    const score = 75; // Será calculado pelo backend
    const healthLevel = getFinancialHealthLevel(score);
    const recommendations = getRecommendations();

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-4xl mx-auto mb-4">
          <BackButton to="/dashboard" label="Voltar ao dashboard" />
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Award className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Quiz Concluído!</CardTitle>
              <CardDescription className="text-lg">
                Aqui está sua análise de saúde financeira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score */}
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${healthLevel.bgColor} ${healthLevel.color}`}>
                  <Heart className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Score: {score}/100 - {healthLevel.level}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Saúde Financeira</span>
                  <span>{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recomendações Personalizadas
                </h3>
                <div className="grid gap-3">
                  {recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center pt-6">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Ir para Dashboard
                </Button>
                <Button onClick={() => {
                  setShowResults(false);
                  setCurrentStep(0);
                  setAnswers({});
                }}>
                  Refazer Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              {currentQuestion.icon}
              <div>
                <CardTitle className="text-2xl">{currentQuestion.title}</CardTitle>
                <CardDescription className="text-base">
                  {currentQuestion.description}
                </CardDescription>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pergunta {currentStep + 1} de {questions.length}</span>
                <span>{Math.round(progress)}% concluído</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              className="space-y-4"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || loading}
              >
                {currentStep === questions.length - 1 ? (
                  <>
                    Concluir <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizFinanceiro;

