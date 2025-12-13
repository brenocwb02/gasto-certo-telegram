import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLimits } from "@/hooks/useLimits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
    Check,
    X,
    Star,
    Users,
    User,
    Loader2,
    ArrowLeft,
    Sparkles,
    Shield,
    Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Plan {
    id: string;
    name: string;
    priceMonthly: number;
    priceYearly: number;
    priceMonthlyDisplay: string;
    priceYearlyDisplay: string;
    yearlyPerMonth: string;
    yearlySavings: string;
    description: string;
    tagline?: string;
    icon: any;
    features: { text: string; included: boolean }[];
    popular: boolean;
    highlight: boolean;
    stripePriceIdMonthly: string;
    stripePriceIdYearly: string;
}

const plans: Plan[] = [
    {
        id: "gratuito",
        name: "Trial",
        priceMonthly: 0,
        priceYearly: 0,
        priceMonthlyDisplay: "R$ 0",
        priceYearlyDisplay: "R$ 0",
        yearlyPerMonth: "R$ 0",
        yearlySavings: "",
        description: "14 dias para criar o hábito financeiro",
        tagline: "Acesso completo por 14 dias",
        icon: Star,
        features: [
            { text: "Transações ilimitadas", included: true },
            { text: "Texto + Áudio + IA ilimitada", included: true },
            { text: "Contas e cartões ilimitados", included: true },
            { text: "Categorias ilimitadas", included: true },
            { text: "Acesso total ao sistema", included: true },
            { text: "Após 14 dias: modo leitura", included: true },
            { text: "Grupo familiar", included: false },
        ],
        popular: false,
        highlight: false,
        stripePriceIdMonthly: "",
        stripePriceIdYearly: ""
    },
    {
        id: "individual",
        name: "Individual",
        priceMonthly: 14.90,
        priceYearly: 143,
        priceMonthlyDisplay: "R$ 14,90",
        priceYearlyDisplay: "R$ 143",
        yearlyPerMonth: "R$ 11,92",
        yearlySavings: "Economize R$ 35,80",
        description: "Controle total, no seu ritmo",
        icon: User,
        features: [
            { text: "Transações ilimitadas", included: true },
            { text: "Texto + Áudio + IA ilimitada", included: true },
            { text: "Contas ilimitadas", included: true },
            { text: "Categorias ilimitadas", included: true },
            { text: "Transações recorrentes", included: true },
            { text: "Relatórios avançados", included: true },
            { text: "Exportação CSV/PDF", included: true },
            { text: "Metas financeiras", included: true },
            { text: "Orçamento por categoria", included: true },
            { text: "Suporte prioritário", included: true },
        ],
        popular: false,
        highlight: false,
        stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_INDIVIDUAL_MONTHLY || "",
        stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_INDIVIDUAL_YEARLY || ""
    },
    {
        id: "familia",
        name: "Família",
        priceMonthly: 24.90,
        priceYearly: 239,
        priceMonthlyDisplay: "R$ 24,90",
        priceYearlyDisplay: "R$ 239",
        yearlyPerMonth: "R$ 19,92",
        yearlySavings: "Economize R$ 59,80",
        description: "Finanças em família, de forma leve",
        tagline: "Mais Popular",
        icon: Users,
        features: [
            { text: "Tudo do plano Individual", included: true },
            { text: "Até 4 membros (1 titular + 3 convidados)", included: true },
            { text: "Grupo familiar no Telegram", included: true },
            { text: "Orçamento compartilhado", included: true },
            { text: "Visão de gastos por membro", included: true },
            { text: "Permissões (quem vê o quê)", included: true },
            { text: "Dashboard consolidado", included: true },
            { text: "Notificações por membro", included: true },
            { text: "Metas compartilhadas", included: true },
        ],
        popular: true,
        highlight: true,
        stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_FAMILIA_MONTHLY || "",
        stripePriceIdYearly: import.meta.env.VITE_STRIPE_PRICE_FAMILIA_YEARLY || ""
    }
];

const Planos = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { plan: currentPlan, transactionUsage, transactionLimit, isTrial, daysRemainingInTrial } = useLimits();
    const [loading, setLoading] = useState<string | null>(null);
    const [isYearly, setIsYearly] = useState(true); // Default to yearly for better conversion

    const handleSelectPlan = async (plan: Plan) => {
        if (!user) {
            toast({
                title: "Autenticação necessária",
                description: "Faça login para assinar um plano.",
                variant: "destructive"
            });
            navigate("/auth");
            return;
        }

        if (plan.id === "gratuito") {
            toast({
                title: "Você já está no plano gratuito",
                description: "Escolha um plano pago para desbloquear todos os recursos.",
            });
            return;
        }

        setLoading(plan.id);

        try {
            // If user already has an active subscription, redirect to portal for upgrade
            if (currentPlan && currentPlan !== 'gratuito') {
                const { data, error } = await supabase.functions.invoke('customer-portal');
                if (error) throw error;
                if (data?.url) {
                    toast({
                        title: "Redirecionando para o portal",
                        description: "Use o portal para alterar seu plano atual.",
                    });
                    window.location.href = data.url;
                }
                return;
            }

            const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    priceId,
                    planId: plan.id,
                    userId: user.id,
                    interval: isYearly ? 'yearly' : 'monthly'
                }
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("URL de checkout não retornada");
            }

        } catch (error) {
            console.error("Erro ao criar sessão de checkout:", error);
            toast({
                title: "Erro ao processar pagamento",
                description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setLoading('portal');
            const { data, error } = await supabase.functions.invoke('customer-portal');
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Erro ao abrir portal:", error);
            toast({
                title: "Erro ao abrir portal",
                description: "Não foi possível redirecionar para o portal de cobrança.",
                variant: "destructive"
            });
        } finally {
            setLoading(null);
        }
    };

    const getPlanDisplayName = () => {
        if (currentPlan === 'gratuito') return 'Gratuito';
        if (currentPlan === 'premium' || currentPlan === 'individual' || currentPlan === 'pessoal') return 'Individual';
        if (currentPlan === 'familia') return 'Família';
        return currentPlan;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Dashboard
                </Button>

                <div className="text-center space-y-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="w-3 h-3 mr-2" />
                        Escolha o Melhor para Você
                    </Badge>

                    <h1 className="text-4xl font-bold">
                        Planos e Preços
                    </h1>

                    <div className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {currentPlan === 'gratuito' ? (
                            <div className="space-y-2">
                                <p>
                                    Você está usando o plano <strong>Gratuito</strong>.
                                </p>
                                {isTrial && daysRemainingInTrial > 0 ? (
                                    <p className="text-primary font-medium">
                                        <Zap className="inline w-4 h-4 mr-1" />
                                        Trial ativo: {daysRemainingInTrial} dias restantes com acesso completo!
                                    </p>
                                ) : (
                                    <p>Este mês: {transactionUsage}/{transactionLimit} transações.</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <p>
                                    Você está no plano <strong>{getPlanDisplayName()}</strong>.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleManageSubscription}
                                    disabled={loading === 'portal'}
                                >
                                    {loading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Gerenciar Assinatura
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Toggle Mensal/Anual */}
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            Mensal
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={isYearly}
                            onCheckedChange={setIsYearly}
                        />
                        <div className="flex items-center gap-2">
                            <Label htmlFor="billing-toggle" className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                Anual
                            </Label>
                            {isYearly && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                    2 meses grátis
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlan ||
                        (plan.id === 'individual' && (currentPlan === 'premium' || currentPlan === 'pessoal'));

                    return (
                        <Card
                            key={plan.id}
                            className={`relative flex flex-col transition-all duration-300 ${plan.highlight
                                ? 'border-primary shadow-xl scale-[1.02] z-10'
                                : 'border-border shadow-sm hover:shadow-md hover:scale-[1.01]'
                                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm shadow-lg">
                                        ⭐ Mais Popular
                                    </Badge>
                                </div>
                            )}

                            {plan.id === 'gratuito' && plan.tagline && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-blue-500 text-white px-4 py-1 text-sm shadow-lg">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {plan.tagline}
                                    </Badge>
                                </div>
                            )}

                            {isCurrentPlan && (
                                <div className="absolute -top-4 right-4">
                                    <Badge className="bg-green-500 text-white px-3 py-1 text-sm shadow-lg">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Plano Atual
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-2 pt-8">
                                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    <plan.icon className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription className="h-12 flex items-center justify-center text-center">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <div className="text-center mb-6">
                                    {plan.id === 'gratuito' ? (
                                        <>
                                            <span className="text-4xl font-bold">R$ 0</span>
                                            <span className="text-muted-foreground">/sempre</span>
                                        </>
                                    ) : isYearly ? (
                                        <div className="space-y-1">
                                            <div>
                                                <span className="text-4xl font-bold">{plan.priceYearlyDisplay}</span>
                                                <span className="text-muted-foreground">/ano</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                ou <span className="font-medium">{plan.yearlyPerMonth}/mês</span>
                                            </p>
                                            <p className="text-sm text-green-600 font-medium">
                                                {plan.yearlySavings}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-bold">{plan.priceMonthlyDisplay}</span>
                                            <span className="text-muted-foreground">/mês</span>
                                        </>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            {feature.included ? (
                                                <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-primary' : 'text-green-500'}`} />
                                            ) : (
                                                <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                                            )}
                                            <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    variant={plan.highlight ? "default" : "outline"}
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={loading === plan.id || isCurrentPlan}
                                >
                                    {loading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isCurrentPlan
                                        ? 'Plano Atual'
                                        : plan.id === 'gratuito'
                                            ? 'Começar Grátis'
                                            : currentPlan && currentPlan !== 'gratuito'
                                                ? `Upgrade para ${plan.name}`
                                                : `Assinar ${plan.name}`
                                    }
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Trust Signals */}
            <div className="mt-16 text-center space-y-6">
                <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-500" />
                        <span>Pagamento Seguro (Stripe)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>Cancele quando quiser</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-green-500" />
                        <span>7 dias de garantia</span>
                    </div>
                </div>

                <p className="text-muted-foreground">
                    Dúvidas sobre os planos?{" "}
                    <a href="/support" className="text-primary hover:underline">
                        Fale com nosso time
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Planos;
