import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";

export default function TelegramIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrationCode, setIntegrationCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIntegrationDetails();
    }
  }, [user]);

  const fetchIntegrationDetails = async () => {
    setLoading(true);
    try {
      // Chamar uma Supabase Function para obter os detalhes de integração
      const { data, error } = await supabase.functions.invoke('telegram-bot-setup', {
        method: 'GET',
      });

      if (error) throw error;

      if (data.userCode) {
        setIntegrationCode(data.userCode);
      }
      if (data.botUsername) {
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

  const copyToClipboard = () => {
    if (integrationCode) {
      // A document.execCommand é usada para contornar restrições de iframe
      const textArea = document.createElement("textarea");
      textArea.value = integrationCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast({
          title: "Copiado!",
          description: "O código de ativação foi copiado para a área de transferência.",
        });
        setTimeout(() => setCopied(false), 2000); // Resetar ícone após 2 segundos
      } catch (err) {
        console.error('Falha ao copiar texto: ', err);
        toast({
            title: "Erro ao copiar",
            description: "Não foi possível copiar o código.",
            variant: "destructive"
        });
      }
      document.body.removeChild(textArea);
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Telegram</CardTitle>
              <CardDescription>
                Conecte sua conta Gasto Certo ao nosso bot do Telegram para adicionar despesas usando apenas texto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Passo 1: Inicie uma conversa com o nosso bot</h3>
                    {botUsername ? (
                      <a 
                        href={`https://t.me/${botUsername}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 inline-block"
                      >
                        <Button>Abrir @{botUsername} no Telegram</Button>
                      </a>
                    ) : (
                        <p className="text-sm text-destructive mt-2">Não foi possível carregar o nome do bot. Tente recarregar a página.</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold">Passo 2: Envie seu código de ativação</h3>
                    <p className="text-sm text-muted-foreground">
                      Copie o código abaixo e envie como uma mensagem para o bot para vincular sua conta.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <Input
                            id="integration-code"
                            readOnly
                            value={integrationCode || "Gerando seu código..."}
                            className="font-mono text-lg"
                        />
                        <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!integrationCode}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

