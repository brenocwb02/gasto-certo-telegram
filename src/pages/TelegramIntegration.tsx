// src/pages/TelegramIntegration.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useLicense } from '@/hooks/useLicense';
import { useToast } from '@/hooks/use-toast';
import { Bot, CheckCircle, XCircle, ExternalLink, Copy, QrCode } from 'lucide-react';

export default function TelegramIntegration() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getLicenseInfo } = useLicense();
  const { toast } = useToast();
  
  const licenseInfo = getLicenseInfo();
  const isLicenseValid = licenseInfo?.isValid || false;
  const botUsername = "BoasContasBot"; // Defina o username do seu bot aqui

  useEffect(() => {
    document.title = "Integração Telegram | Boas Contas";
  }, []);

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
                <h1 className="text-3xl font-bold">Integração com Telegram</h1>
                <p className="text-muted-foreground">
                  Registe transações de forma rápida e fácil através de mensagens.
                </p>
              </div>
            </div>

            {/* License Status & Link Code */}
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
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
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
            
            {/* Tutorial */}
            <Card>
              <CardHeader>
                <CardTitle>Como Conectar a Sua Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Abra a conversa com o nosso bot</p>
                      <p className="text-sm text-muted-foreground">
                        Clique no botão abaixo para abrir o Telegram e encontrar o @{botUsername}.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.open(`https://t.me/${botUsername}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir @{botUsername}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Envie o seu comando de vinculação</p>
                      <p className="text-sm text-muted-foreground">
                        Copie o seu comando de vinculação (acima) e cole na conversa com o bot para ligar a sua conta.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Comece a usar!</p>
                      <p className="text-sm text-muted-foreground">
                        Após a confirmação, você já pode enviar mensagens como "Gastei 15 reais com almoço" 
                        e o bot irá registar a transação automaticamente.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    Use o comando /ajuda no bot a qualquer momento para ver a lista de comandos disponíveis.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
