import { useLimits } from "@/hooks/useLimits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Lock, ShieldCheck, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LimitsBanner() {
    const {
        plan,
        loading,
        isTrial,
        isTrialActive,
        daysRemainingInTrial
    } = useLimits();

    const navigate = useNavigate();

    // Não mostrar se estiver carregando ou se for plano pago
    if (loading || plan !== 'gratuito') {
        return null;
    }

    // Trial ATIVO - Contagem regressiva
    if (isTrialActive && isTrial) {
        return (
            <Card className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-sm">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-semibold text-base">
                                Trial Ativo — {daysRemainingInTrial} {daysRemainingInTrial === 1 ? 'dia' : 'dias'} restantes
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Aproveite! Você tem acesso completo a todas as funcionalidades.
                            Use esse tempo para criar o hábito financeiro.
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/planos')}
                        className="w-full sm:w-auto whitespace-nowrap shrink-0"
                        variant="outline"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Ver Planos
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Trial EXPIRADO - Bloqueio com mensagem empática
    return (
        <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-sm">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-5 w-5 text-red-500" />
                        <h3 className="font-semibold text-base">
                            Seus 14 dias terminaram!
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                        <ShieldCheck className="h-4 w-4 inline mr-1 text-green-500" />
                        <strong>Seus dados estão seguros.</strong> Você pode consultar tudo,
                        mas novos lançamentos estão bloqueados.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Para voltar a registrar gastos e receitas, escolha um plano.
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/planos')}
                    className="w-full sm:w-auto whitespace-nowrap shrink-0"
                    variant="default"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Escolher Plano
                </Button>
            </CardContent>
        </Card>
    );
}

