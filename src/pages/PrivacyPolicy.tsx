import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail, Users, Database } from 'lucide-react';

export default function PrivacyPolicy() {
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
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Política de Privacidade</h1>
                            <p className="text-muted-foreground">
                                Última atualização: 06 de dezembro de 2024
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Quick Summary */}
                <Card className="mb-6 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Resumo Executivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm">
                            <strong>Gasto Certo</strong> leva sua privacidade a sério. Esta política explica:
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-1">
                            <li>Quais dados coletamos e por quê</li>
                            <li>Como protegemos suas informações financeiras</li>
                            <li>Seus direitos sob a Lei Geral de Proteção de Dados (LGPD)</li>
                            <li>Como exercer controle sobre seus dados</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* 1. Controlador de Dados */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            1. Controlador de Dados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">
                            <strong>Razão Social:</strong> [Seu Nome ou Nome da Empresa] <br />
                            <strong>CNPJ/CPF:</strong> [Seu CNPJ ou CPF] <br />
                            <strong>Endereço:</strong> [Seu Endereço Completo] <br />
                            <strong>Email:</strong> contato@gastocerto.com.br
                        </p>
                        <p className="text-sm text-muted-foreground">
                            O controlador de dados é a pessoa ou empresa responsável pelas decisões
                            sobre o tratamento dos seus dados pessoais.
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Encarregado de Dados (DPO) */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            2. Encarregado de Proteção de Dados (DPO)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">
                            Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:
                        </p>
                        <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm font-medium">
                                📧 Email: <a href="mailto:privacidade@gastocerto.com.br" className="text-primary hover:underline">
                                    privacidade@gastocerto.com.br
                                </a>
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Responderemos sua solicitação em até 15 dias úteis
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Separator className="my-6" />

                {/* 3. Dados Coletados */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            3. Quais Dados Coletamos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-sm mb-2">3.1. Dados de Cadastro</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li>Nome completo</li>
                                <li>Endereço de email</li>
                                <li>Telefone (opcional)</li>
                                <li>Senha (criptografada)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">3.2. Dados Financeiros</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li>Transações financeiras (receitas e despesas)</li>
                                <li>Contas bancárias e cartões (apenas nomes, não números reais)</li>
                                <li>Categorias de gastos personalizadas</li>
                                <li>Orçamentos e metas financeiras</li>
                                <li>Investimentos e patrimônio declarado</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                                ⚠️ Importante: NÃO armazenamos senhas bancárias, números de cartão de crédito
                                ou credenciais de acesso a instituições financeiras.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">3.3. Dados de Uso</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li>Informações de navegação (páginas visitadas, tempo de uso)</li>
                                <li>Endereço IP e localização aproximada</li>
                                <li>Tipo de dispositivo e navegador</li>
                                <li>Logs de interação com o aplicativo</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">3.4. Integração com Telegram (Opcional)</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li>ID do chat do Telegram</li>
                                <li>Nome de usuário do Telegram</li>
                                <li>Mensagens enviadas ao bot para registro de transações</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Finalidade */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>4. Para Que Usamos Seus Dados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <h3 className="font-semibold text-sm mb-2">📊 Funcionalidades Principais:</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li>Fornecer o serviço de controle financeiro pessoal</li>
                                <li>Gerar relatórios e análises de gastos</li>
                                <li>Enviar notificações sobre orçamentos e metas</li>
                                <li>Sincronizar dados entre dispositivos</li>
                                <li>Permitir compartilhamento com grupo familiar (se habilitado)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">🔧 Melhorias e Suporte:</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li>Melhorar a experiência do usuário</li>
                                <li>Fornecer suporte técnico</li>
                                <li>Detectar e prevenir fraudes ou abusos</li>
                                <li>Cumprir obrigações legais</li>
                            </ul>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                ✅ Não Vendemos Seus Dados
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Seus dados financeiros são exclusivamente seus. Não compartilhamos,
                                vendemos ou divulgamos suas informações para terceiros com fins comerciais.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Base Legal */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>5. Base Legal (LGPD Art. 7º)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm">Tratamos seus dados com base em:</p>
                        <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                            <li><strong>Consentimento:</strong> Você aceita nossos termos ao criar uma conta</li>
                            <li><strong>Execução de Contrato:</strong> Para fornecer o serviço contratado</li>
                            <li><strong>Interesses Legítimos:</strong> Melhorias do serviço e prevenção de fraudes</li>
                            <li><strong>Cumprimento Legal:</strong> Quando exigido por lei ou autoridades</li>
                        </ul>
                    </CardContent>
                </Card>

                <Separator className="my-6" />

                {/* 6. Segurança */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            6. Como Protegemos Seus Dados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">
                            Implementamos medidas técnicas e organizacionais para proteger seus dados:
                        </p>

                        <div className="grid gap-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Shield className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">Criptografia SSL/TLS</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Todas as comunicações são criptografadas (HTTPS)
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Lock className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">Criptografia em Repouso</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Dados armazenados em servidores criptografados
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Eye className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">Row Level Security (RLS)</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Você só vê seus próprios dados. Outros usuários não têm acesso.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold">Auditoria de Acesso</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Registramos todos os acessos administrativos aos dados
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900 mt-4">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                ⚠️ Sua Responsabilidade
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                Mantenha sua senha segura e não a compartilhe. Use senhas fortes e
                                únicas para o Gasto Certo.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 7. Compartilhamento */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>7. Compartilhamento de Dados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">Compartilhamos seus dados apenas nas seguintes situações:</p>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">7.1. Com Seu Consentimento:</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li><strong>Grupo Familiar:</strong> Dados marcados como "do grupo" são visíveis para membros do seu grupo familiar</li>
                                <li><strong>Integrações:</strong> Se você conectar serviços de terceiros (ex: Telegram)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">7.2. Prestadores de Serviço:</h3>
                            <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                                <li><strong>Supabase:</strong> Infraestrutura de banco de dados e autenticação</li>
                                <li><strong>Google AI:</strong> Processamento de linguagem natural (apenas para funcionalidades de IA, se habilitadas)</li>
                                <li><strong>Stripe:</strong> Processamento de pagamentos (não armazena dados financeiros pessoais, apenas assinatura)</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-2">
                                Todos os prestadores são obrigados contratualmente a proteger seus dados.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm mb-2">7.3. Cumprimento Legal:</h3>
                            <p className="text-sm text-muted-foreground">
                                Podemos divulgar dados se exigido por lei, ordem judicial ou autoridades competentes.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Separator className="my-6" />

                {/* 8. Seus Direitos (LGPD) */}
                <Card className="mb-6 border-primary">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Shield className="h-5 w-5" />
                            8. Seus Direitos sob a LGPD (Art. 18)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <p className="text-sm">
                            A Lei Geral de Proteção de Dados garante que você tem os seguintes direitos:
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Confirmação e Acesso</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Confirmar se tratamos seus dados e acessá-los a qualquer momento
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Como exercer: Acesse "Configurações" no aplicativo
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Correção</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Corrigir dados incompletos, inexatos ou desatualizados
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Como exercer: Edite diretamente em "Configurações" → "Perfil"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Anonimização, Bloqueio ou Eliminação</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Solicitar a eliminação de dados desnecessários ou tratados em desconformidade
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Como exercer: Email para privacidade@gastocerto.com.br
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Portabilidade</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Receber seus dados em formato estruturado e interoperável (JSON)
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Como exercer: "Configurações" → "Privacidade" → "Exportar Dados"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Eliminação Total (Direito ao Esquecimento)</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Solicitar a exclusão de todos os seus dados
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Como exercer: "Configurações" → "Privacidade" → "Solicitar DeleteExclusão de Conta"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Informação sobre Compartilhamento</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Saber com quais entidades públicas e privadas compartilhamos dados
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Ver seção 7 desta política
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-primary">✅</div>
                                <div>
                                    <h4 className="text-sm font-semibold">Revogação do Consentimento</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Revogar o consentimento a qualquer momento
                                    </p>
                                    <p className="text-xs text-primary mt-1">
                                        Email para privacidade@gastocerto.com.br
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900 mt-4">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                💡 Prazo de Resposta
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Responderemos suas solicitações em até <strong>15 dias úteis</strong>,
                                conforme estabelecido pela LGPD.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 9. Retenção */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>9. Por Quanto Tempo Guardamos Seus Dados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">Retemos seus dados pelo tempo necessário para:</p>
                        <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                            <li>Fornecer o serviço enquanto sua conta estiver ativa</li>
                            <li>Cumprir obrigações legais (ex: dados fiscais por 5 anos)</li>
                            <li>Resolver disputas e fazer cumprir nossos acordos</li>
                        </ul>

                        <div className="bg-muted p-4 rounded-lg mt-4">
                            <h4 className="text-sm font-semibold mb-2">Após Exclusão da Conta:</h4>
                            <ul className="list-disc pl-6 text-xs space-y-1 text-muted-foreground">
                                <li>Dados transacionais: anonimizados imediatamente</li>
                                <li>Backups: removidos em até 90 dias</li>
                                <li>Logs de auditoria: retidos por 5 anos (requisito legal)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* 10. Cookies */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>10. Cookies e Tecnologias Similares</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm">Utilizamos cookies para:</p>
                        <ul className="list-disc pl-6 text-sm space-y-1 text-muted-foreground">
                            <li><strong>Essenciais:</strong> Manter sua sessão ativa (login)</li>
                            <li><strong>Funcionais:</strong> Lembrar suas preferências</li>
                            <li><strong>Analíticos:</strong> Entender como você usa o app (anônimo)</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                            Você pode gerenciar cookies nas configurações do seu navegador.
                        </p>
                    </CardContent>
                </Card>

                {/* 11. Alterações */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>11. Alterações nesta Política</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Podemos atualizar esta política periodicamente. Quando fizermos alterações
                            significativas, notificaremos você por email ou através de um aviso no aplicativo.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            A data da última atualização está sempre no início deste documento.
                        </p>
                    </CardContent>
                </Card>

                {/* 12. Contato */}
                <Card className="mb-6 border-primary">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            12. Entre em Contato
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-6">
                        <p className="text-sm">
                            Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer
                            seus direitos, entre em contato:
                        </p>

                        <div className="grid gap-3">
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium">📧 Email de Privacidade</p>
                                <a href="mailto:privacidade@gastocerto.com.br" className="text-primary hover:underline">
                                    privacidade@gastocerto.com.br
                                </a>
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium">💬 Suporte Geral</p>
                                <a href="mailto:contato@gastocerto.com.br" className="text-primary hover:underline">
                                    contato@gastocerto.com.br
                                </a>
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900 mt-4">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                ✅ Você Tem Controle
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Seus dados financeiros são seus. Você pode acessá-los, exportá-los ou
                                excluí-los a qualquer momento.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <Button onClick={() => window.print()} variant="secondary">
                        Imprimir Política
                    </Button>
                </div>
            </div>
        </div>
    );
}
