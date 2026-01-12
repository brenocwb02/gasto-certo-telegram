import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Lock, CreditCard, AlertCircle } from 'lucide-react';

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Termos de Serviço</h1>
                            <p className="text-muted-foreground">
                                Última atualização: {new Date().toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">

                {/* Intro Card */}
                <Card className="mb-6 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            1. Aceitação dos Termos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">
                            Ao acessar e usar o <strong>Boas Contas</strong> ("Serviço"), você concorda em cumprir estes Termos de Serviço. Se você não concordar com algum destes termos, não poderá usar o Serviço.
                        </p>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            2. Descrição do Serviço
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            O Boas Contas é uma plataforma de gestão financeira pessoal que utiliza inteligência artificial e automação via Telegram para auxiliar no controle de despesas e orçamento.
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Reservamo-nos o direito de modificar, suspender ou descontinuar o Serviço a qualquer momento, com ou sem aviso prévio.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            3. Contas e Segurança
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Para usar o Serviço, você deve criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades que ocorrem sob sua conta.
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                ⚠️ Importante
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            4. Planos e Assinaturas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Alguns recursos do Serviço podem exigir uma assinatura paga. Ao assinar, você concorda em pagar as taxas aplicáveis conforme descrito no momento da compra.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            As assinaturas são renovadas automaticamente, a menos que sejam canceladas antes do final do período atual.
                        </p>
                    </CardContent>
                </Card>

                <Card className="mb-6 border-primary">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <AlertCircle className="h-5 w-5" />
                            5. Responsabilidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <p className="text-sm text-muted-foreground">
                            O Boas Contas é uma ferramenta de auxílio e não fornece aconselhamento financeiro profissional. Não nos responsabilizamos por quaisquer decisões financeiras tomadas com base nas informações fornecidas pelo Serviço.
                        </p>
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <Button onClick={() => window.print()} variant="secondary">
                        Imprimir Termos
                    </Button>
                </div>
            </div>
        </div>
    );
}
