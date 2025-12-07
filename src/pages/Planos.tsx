import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLimits } from "@/hooks/useLimits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
    Check,
    Star,
    Users,
    Crown,
    User,
    Loader2,
    ArrowLeft,
    Sparkles,
    Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Plan {
    id: string;
    name: string;
    price: number;
    priceDisplay: string;
    description: string;
    icon: any;
    features: string[];
    popular: boolean;
    highlight: boolean;
    stripePriceId: string; // We'll need to add Stripe Price IDs
}

// Stripe Price ID for Premium plan
const STRIPE_PREMIUM_PRICE_ID = "price_1SBpdyA3xmI9jS0uyz1HGGBW";

const plans: Plan[] = [
    {
        id: "gratuito",
        name: "Gratuito",
        price: 0,
        priceDisplay: "R$ 0",
        description: "Para testar e organizar suas finanças pessoais",
        icon: Star,
        features: [
            "75 transações/mês (100 no 1º mês)",
            "2 contas",
            "10 categorias",
            "Telegram (Texto + Áudio)",
            "20 créditos de IA/mês"
        ],
        popular: false,
        highlight: false,
        stripePriceId: ""
    },
    {
        id: "premium",
        name: "Premium",
        price: 29.90,
        priceDisplay: "R$ 29,90",
        description: "Controle total sem limites para você e sua família",
        icon: Crown,
        features: [
            "Transações ilimitadas",
            "Contas ilimitadas",
            "Categorias ilimitadas",
            "IA ilimitada",
            "Relatórios avançados",
            "Metas e orçamentos",
            "Integração Telegram com IA",
            "Suporte prioritário"
        ],
        popular: true,
        highlight: true,
        stripePriceId: STRIPE_PREMIUM_PRICE_ID
    }
];

const Planos = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { plan: currentPlan, transactionUsage, transactionLimit, isTrial } = useLimits();
    const [loading, setLoading] = useState<string | null>(null);

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
            // Call Supabase Edge Function to create Stripe Checkout Session
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    priceId: plan.stripePriceId,
                    planId: plan.id,
                    userId: user.id
                }
            });

            if (error) throw error;

            if (data?.url) {
                // Redirect to Stripe Checkout
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                            <p>
                                Você está usando o plano <strong>Gratuito</strong>.
                                {isTrial && ` Período de teste: ${transactionUsage}/${transactionLimit} transações.`}
                                {!isTrial && ` Este mês: ${transactionUsage}/${transactionLimit} transações.`}
                            </p>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <p>Gerencie sua assinatura ou faça upgrade para um plano superior.</p>
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
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlan;

                    return (
                        <Card
                            key={plan.id}
                            className={`relative flex flex-col ${plan.highlight
                                ? 'border-primary shadow-xl scale-105 z-10'
                                : 'border-border shadow-sm hover:shadow-md'
                                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm shadow-lg">
                                        Mais Popular
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

                            <CardHeader className="text-center pb-2">
                                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    <plan.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <CardDescription className="h-10 flex items-center justify-center">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <div className="text-center mb-6">
                                    <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                                    <span className="text-muted-foreground">/mês</span>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'
                                                }`} />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.highlight ? "default" : "outline"}
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={loading === plan.id || isCurrentPlan}
                                >
                                    {loading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isCurrentPlan ? 'Plano Atual' : plan.id === 'gratuito' ? 'Plano Gratuito' : 'Assinar Agora'}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* FAQ / Trust Signals */}
            <div className="mt-16 text-center space-y-4">
                <p className="text-muted-foreground">
                    Dúvidas sobre os planos? <a href="#" className="text-primary hover:underline">Fale com nosso time</a>
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Pagamento Seguro (Stripe)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Cancele quando quiser</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-500" />
                        <span>Garantia de 14 dias</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Planos;
