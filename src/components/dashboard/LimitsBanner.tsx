import { useLimits } from "@/hooks/useLimits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LimitsBanner() {
    const {
        plan,
        transactionUsage,
        transactionLimit,
        isTransactionLimitReached,
        loading,
        isTrial,
        daysRemainingInTrial
    } = useLimits();

    const navigate = useNavigate();

    // Não mostrar se estiver carregando ou se não for plano gratuito
    if (loading || plan !== 'gratuito') {
        return null;
    }

    // Calcular porcentagem de uso
    const percentage = Math.min(100, Math.max(0, (transactionUsage / transactionLimit) * 100));

    // Determinar cor da barra baseada no uso
    let progressColor = "bg-primary";
    if (percentage > 75) progressColor = "bg-yellow-500";
    if (percentage >= 90) progressColor = "bg-red-500";

    return (
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                {isTrial ? (
                                    <>
                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                        Período de Teste ({daysRemainingInTrial} dias restantes)
                                    </>
                                ) : (
                                    <>
                                        <span className="text-muted-foreground">Plano Gratuito</span>
                                    </>
                                )}
                            </h3>
                        </div>
                        <span className={`text-sm font-medium ${isTransactionLimitReached ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {transactionUsage} / {transactionLimit} transações
                        </span>
                    </div>

                    <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />

                    <p className="text-xs text-muted-foreground mt-2">
                        {isTransactionLimitReached ? (
                            <span className="text-red-500 flex items-center gap-1 font-medium">
                                <AlertTriangle className="h-3 w-3" />
                                Você atingiu o limite mensal de transações.
                            </span>
                        ) : (
                            percentage > 80 ?
                                "Você está próximo do limite mensal." :
                                "Aproveite para organizar suas finanças!"
                        )}
                    </p>
                </div>

                <Button
                    onClick={() => navigate('/planos')}
                    className="w-full sm:w-auto whitespace-nowrap shrink-0"
                    variant={isTransactionLimitReached ? "destructive" : "default"}
                >
                    {isTransactionLimitReached ? "Desbloquear Agora" : "Fazer Upgrade"}
                </Button>
            </CardContent>
        </Card>
    );
}
