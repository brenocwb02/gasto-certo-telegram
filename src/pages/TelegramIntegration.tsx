import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import { useLicense } from '@/hooks/useLicense';
import { useToast } from '@/hooks/use-toast';
import { Bot, CheckCircle, XCircle, ExternalLink, Copy, QrCode } from 'lucide-react';

export default function TelegramIntegration() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { config, loading: configLoading, saveConfig, deactivateBot } = useTelegramBot();
  const { getLicenseInfo } = useLicense();
  const { toast } = useToast();
  
  const licenseInfo = getLicenseInfo();
  const isLicenseValid = licenseInfo?.isValid || false;

  const handleSaveBot = async () => {
    if (!botToken.trim() || !botUsername.trim()) {
      toast({
        title: 'Erro',
        description: 'Token e username do bot são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (!isLicenseValid) {
      toast({
        title: 'Licença Inválida',
        description: 'Você precisa de uma licença ativa para usar a integração com Telegram',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const success = await saveConfig(botToken, botUsername);
    
    if (success) {
      toast({
        title: 'Bot Configurado',
        description: 'Seu bot do Telegram foi configurado com sucesso!',
      });
      setBotToken('');
      setBotUsername('');
    }
    setLoading(false);
  };

  const handleDeactivateBot = async () => {
    const success = await deactivateBot();
    
    if (success) {
      toast({
        title: 'Bot Desativado',
        description: 'A integração com Telegram foi desativada.',
      });
    }
  };

  const generateLinkCode = () => {
    return licenseInfo?.codigo || 'SEM-LICENCA';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Código copiado para a área de transferência.',
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
                <h1 className="text-3xl font-bold">Integração com Telegram</h1>
                <p className="text-muted-foreground">
                  Configure seu próprio bot para registrar transações via Telegram
                </p>
              </div>
            </div>

            {/* License Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Status da Licença
                  {isLicenseValid ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={isLicenseValid ? 'default' : 'destructive'}>
                      {licenseInfo?.tipo || 'Sem Licença'}
                    </Badge>
                    {licenseInfo?.daysUntilExpiration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Expira em {licenseInfo.daysUntilExpiration} dias
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Código de Vinculação:</p>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {generateLinkCode()}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generateLinkCode())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bot Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isLicenseValid && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você precisa de uma licença ativa para configurar a integração com Telegram.
                    </AlertDescription>
                  </Alert>
                )}

                {config && config.is_active ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Bot Ativo</h3>
                        <p className="text-sm text-muted-foreground">
                          @{config.bot_username}
                        </p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={handleDeactivateBot}
                      disabled={configLoading}
                    >
                      Desativar Bot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="botToken">Token do Bot</Label>
                        <Input
                          id="botToken"
                          type="password"
                          placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          disabled={!isLicenseValid}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="botUsername">Username do Bot</Label>
                        <Input
                          id="botUsername"
                          placeholder="meu_bot_financeiro"
                          value={botUsername}
                          onChange={(e) => setBotUsername(e.target.value)}
                          disabled={!isLicenseValid}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSaveBot}
                      disabled={loading || !isLicenseValid}
                      className="w-full md:w-auto"
                    >
                      {loading ? 'Configurando...' : 'Salvar Configuração'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tutorial */}
            <Card>
              <CardHeader>
                <CardTitle>Como Configurar Seu Bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Crie seu bot no Telegram</p>
                      <p className="text-sm text-muted-foreground">
                        Abra o Telegram e procure por @BotFather. Envie /newbot e siga as instruções.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.open('https://t.me/BotFather', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir BotFather
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Copie o token do bot</p>
                      <p className="text-sm text-muted-foreground">
                        O BotFather fornecerá um token como: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Configure o bot aqui</p>
                      <p className="text-sm text-muted-foreground">
                        Cole o token e username do bot nos campos acima e clique em "Salvar Configuração".
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Vincule sua conta</p>
                      <p className="text-sm text-muted-foreground">
                        No Telegram, envie /start {generateLinkCode()} para seu bot para vincular sua conta.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Após configurar, você poderá enviar mensagens como "Gastei 15 reais com almoço" 
                    e o bot automaticamente registrará a transação no sistema.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Available Commands */}
            <Card>
              <CardHeader>
                <CardTitle>Comandos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">/saldo</code>
                    <p className="text-sm text-muted-foreground">Ver saldo atual de todas as contas</p>
                  </div>
                  
                  <div className="space-y-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">/extrato</code>
                    <p className="text-sm text-muted-foreground">Ver últimas transações</p>
                  </div>
                  
                  <div className="space-y-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">/resumo</code>
                    <p className="text-sm text-muted-foreground">Resumo financeiro do mês</p>
                  </div>
                  
                  <div className="space-y-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">/categorias</code>
                    <p className="text-sm text-muted-foreground">Listar categorias disponíveis</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div>
                  <h4 className="font-medium mb-2">Registro Automático de Transações</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Você pode enviar mensagens naturais como:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>"Gastei 25 reais com almoço"</li>
                    <li>"Recebi 1000 reais de salário"</li>
                    <li>"Transferi 100 reais para poupança"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}