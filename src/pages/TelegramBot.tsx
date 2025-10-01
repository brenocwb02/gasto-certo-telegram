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
import { useTelegramIntegration } from '@/hooks/useTelegramIntegration';
import { Bot, CheckCircle, ExternalLink, AlertTriangle, Trash2 } from 'lucide-react';

export default function TelegramBot() {
  const [botToken, setBotToken] = useState('');
  const { config, loading, error, validateAndSaveBot, sendTestMessage, deactivateBot } = useTelegramIntegration();

  const handleSaveBot = async () => {
    if (!botToken.trim()) return;
    
    const success = await validateAndSaveBot(botToken);
    if (success) {
      setBotToken('');
    }
  };

  const handleSendTest = async () => {
    await sendTestMessage();
  };

  const handleDeactivate = async () => {
    if (confirm('Tem certeza que deseja desativar a integração com Telegram?')) {
      await deactivateBot();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-14 sm:pl-14">
        <Header />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Configuração do Bot Telegram</h1>
                <p className="text-muted-foreground">
                  Configure seu próprio bot do Telegram para integração personalizada.
                </p>
              </div>
            </div>

            {/* Current Bot Status */}
            {config && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Bot Ativo
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="default">Ativo</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bot @{config.bot_username} configurado
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSendTest}
                        disabled={loading}
                      >
                        Enviar Teste
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeactivate}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desativar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bot Configuration Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {config ? 'Alterar Bot' : 'Configurar Novo Bot'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-token">Token do Bot</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bot-token"
                      type="password"
                      placeholder="000000000:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      disabled={loading}
                    />
                    <Button 
                      onClick={handleSaveBot}
                      disabled={!botToken.trim() || loading}
                    >
                      {loading ? 'Validando...' : 'Configurar'}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    Para criar um bot personalizado, fale com @BotFather no Telegram e siga as instruções.
                    Você receberá um token único que deve ser colado acima.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Como Criar Seu Bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Abra o @BotFather no Telegram</p>
                      <p className="text-sm text-muted-foreground">
                        Clique no botão abaixo para abrir o Telegram e encontrar o @BotFather.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.open('https://t.me/BotFather', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir @BotFather
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Envie o comando /newbot</p>
                      <p className="text-sm text-muted-foreground">
                        O BotFather irá guiá-lo através do processo de criação do bot.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Copie o token</p>
                      <p className="text-sm text-muted-foreground">
                        Após criar o bot, você receberá um token. Copie e cole no campo acima.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}