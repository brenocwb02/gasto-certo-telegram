import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    const checkoutStatus = searchParams.get('checkout');

    useEffect(() => {
        if (checkoutStatus === 'success') {
            // Give backend time to process webhook
            setTimeout(() => {
                setStatus('success');
            }, 2000);
        } else if (checkoutStatus === 'cancelled') {
            setStatus('error');
        } else {
            setStatus('loading');
        }
    }, [checkoutStatus]);

    if (status === 'loading') {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-16">
                <Card>
                    <CardContent className="pt-6 text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <h2 className="text-2xl font-bold">Processando pagamento...</h2>
                        <p className="text-muted-foreground">
                            Aguarde enquanto confirmamos sua assinatura.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-16">
                <Card className="border-destructive">
                    <CardHeader className="text-center">
                        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
                        <CardDescription>
                            Você cancelou o processo de pagamento. Sem problemas!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-muted-foreground">
                            Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button variant="outline" onClick={() => navigate('/dashboard')}>
                                Voltar ao Dashboard
                            </Button>
                            <Button onClick={() => navigate('/planos')}>
                                Ver Planos Novamente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto px-4 py-16">
            <Card className="border-green-500">
                <CardHeader className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <CardTitle className="text-3xl">🎉 Bem-vindo ao Plano Premium!</CardTitle>
                    <CardDescription className="text-base">
                        Sua assinatura foi ativada com sucesso
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                            ✨ Você agora tem acesso a:
                        </h3>
                        <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                            <li>✅ Transações ilimitadas</li>
                            <li>✅ IA ilimitada</li>
                            <li>✅ Relatórios avançados</li>
                            <li>✅ Gerenciamento familiar completo</li>
                            <li>✅ Suporte prioritário</li>
                        </ul>
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            Um e-mail de confirmação foi enviado para você com todos os detalhes da assinatura.
                        </p>
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() => navigate('/dashboard')}
                        >
                            Começar a Usar
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CheckoutSuccess;
