import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useLicense } from '@/hooks/useLicense';
import { useToast } from '@/hooks/use-toast';
import { Bot, CheckCircle, XCircle, ExternalLink, Copy, QrCode, Info, ArrowRight } from 'lucide-react';

export default function TelegramSetup() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getLicenseInfo } = useLicense();
  const { toast } = useToast();
  
  const licenseInfo = getLicenseInfo();
  const isLicenseValid = licenseInfo?.isValid || false;
  const botUsername = "GastoCertoBot"; // Username do bot oficial

  const getLinkCode = () => {
    return licenseInfo?.codigo || 'SEM-LICENCA';
  };

  const copyToClipboard = (text: string) => {
    if (!text || text === 'SEM-LICENCA') {
       toast({
        title: 'Código Inválido',
        description: 'A sua licença não foi encontrada. Não é possível copiar o código.',
        variant: 'destructive',
      });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Comando copiado para a área de transferência.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Configuração do Telegram</h1>
                <p className="text-muted-foreground">
                  Configure a integração com nosso bot oficial do Telegram.
                </p>
              </div>
            </div>

            {/* Status da Licença */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Status da Licença
                  {isLicenseValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={isLicenseValid ? 'default' : 'destructive'}>
                      {licenseInfo?.tipo ? licenseInfo.tipo.charAt(0).toUpperCase() + licenseInfo.tipo.slice(1) : 'Sem Licença'}
                    </Badge>
                    {licenseInfo?.daysUntilExpiration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Expira em {licenseInfo.daysUntilExpiration} dias
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Seu Comando de Vinculação:</p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="px-3 py-2 bg-muted rounded-lg text-sm font-mono">
                        /start {getLinkCode()}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`/start ${getLinkCode()}`)}
                        disabled={!isLicenseValid}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passos para Configuração */}
            <Card>
              <CardHeader>
                <CardTitle>Como Configurar o Telegram</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Abra o Bot no Telegram</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Clique no botão abaixo para abrir nosso bot oficial no Telegram.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://t.me/${botUsername}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir @{botUsername}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Cole o Comando de Vinculação</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        No chat do bot, cole o comando de vinculação que aparece acima.
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="text-sm font-mono flex-1">/start {getLinkCode()}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`/start ${getLinkCode()}`)}
                          disabled={!isLicenseValid}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Comece a Usar!</h3>
                      <p className="text-sm text-muted-foreground">
                        Após a confirmação, você já pode registrar transações e usar todos os comandos disponíveis.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Dica:</strong> Use o comando /ajuda no bot a qualquer momento para ver a lista completa de comandos disponíveis.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Comandos Disponíveis */}
            <Card>
              <CardHeader>
                <CardTitle>Comandos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <code className="text-sm font-mono">/saldo</code>
                        <p className="text-xs text-muted-foreground">Ver saldo de todas as contas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <code className="text-sm font-mono">/resumo</code>
                        <p className="text-xs text-muted-foreground">Resumo financeiro do mês</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <code className="text-sm font-mono">/metas</code>
                        <p className="text-xs text-muted-foreground">Acompanhar suas metas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <Bot className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <code className="text-sm font-mono">/ajuda</code>
                        <p className="text-xs text-muted-foreground">Ver todos os comandos</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Registrar Transações:</strong> Você também pode registrar transações simplesmente escrevendo mensagens naturais como "Gastei 25 reais com almoço" ou "Recebi 3000 de salário".
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Opção para Bot Próprio */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração Avançada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Prefere usar seu próprio bot do Telegram? Configure um bot personalizado para máxima privacidade.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/telegram-bot', '_self')}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Configurar Bot Próprio
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}