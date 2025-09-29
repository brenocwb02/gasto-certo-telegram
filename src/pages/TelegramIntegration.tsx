import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, ExternalLink, MessageSquare, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLicense } from "@/hooks/useLicense";

export default function TelegramIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getLicenseInfo } = useLicense();
  const [integrationCode, setIntegrationCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const licenseInfo = getLicenseInfo();
  const isPremium = licenseInfo?.plano === 'premium';

  useEffect(() => {
    if (user) {
      fetchIntegrationDetails();
    }
  }, [user]);

  const fetchIntegrationDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot-setup');

      if (error) throw error;

      if (data?.userCode) {
        setIntegrationCode(data.userCode);
      }
      if (data?.botUsername) {
        setBotUsername(data.botUsername);
      }

    } catch (error: any) {
      console.error("Erro ao carregar detalhes da integração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da integração. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Integração com Telegram</h1>
                <p className="text-muted-foreground">
                  Conecte-se ao nosso bot oficial para registrar transações via mensagem.
                </p>
              </div>
            </div>

            {!isPremium && (
              <Alert className="border-warning bg-warning/10">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Funcionalidade Premium:</strong> A adição de transações via Telegram é exclusiva do plano Premium. 
                  <a href="/license" className="ml-1 text-primary underline">Faça upgrade aqui</a>.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Como conectar ao bot
                </CardTitle>
                <CardDescription>
                  Siga os passos abaixo para vincular sua conta ao nosso bot oficial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Conecte sua conta com um clique</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Clique no botão abaixo para abrir o Telegram e vincular sua conta automaticamente.
                        </p>
                        {botUsername && integrationCode ? (
                          <Button 
                            onClick={() => window.open(`https://t.me/${botUsername}?start=${integrationCode}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Conectar com Telegram com 1 Clique
                          </Button>
                        ) : (
                          <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Carregando...
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Comece a usar!</h3>
                        <p className="text-sm text-muted-foreground">
                          Após a confirmação, você pode enviar mensagens como "Gastei 25 reais no almoço" 
                          ou usar comandos como /saldo, /resumo e /metas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isPremium && (
              <Card>
                <CardHeader>
                  <CardTitle>Comandos disponíveis</CardTitle>
                  <CardDescription>
                    Lista de comandos que você pode usar no bot após fazer a conexão.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <code className="text-sm font-mono">/saldo</code>
                          <p className="text-xs text-muted-foreground">Ver saldo das contas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <code className="text-sm font-mono">/resumo</code>
                          <p className="text-xs text-muted-foreground">Resumo financeiro do mês</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <code className="text-sm font-mono">/metas</code>
                          <p className="text-xs text-muted-foreground">Ver progresso das metas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <code className="text-sm font-mono">/ajuda</code>
                          <p className="text-xs text-muted-foreground">Lista completa de comandos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


