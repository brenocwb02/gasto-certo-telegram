import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Link, Copy, Shield, Bot, User } from "lucide-react";
import { useProfile } from "@/hooks/useSupabaseData";
import { useLicense } from "@/hooks/useLicense";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const { license, loading: licenseLoading } = useLicense();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Configurações | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Configure sua conta do Gasto Certo: vincule o Telegram, gerencie licença e ajuste preferências.");
    }
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/settings");
  }, []);

  useEffect(() => {
    if (profile?.telegram_id) {
      setTelegramId(profile.telegram_id);
    }
  }, [profile]);

  const copyLicenseCode = () => {
    if (license?.codigo) {
      navigator.clipboard.writeText(license.codigo);
      toast({
        title: "Código copiado!",
        description: "Código de licença copiado para a área de transferência.",
      });
    }
  };

  const saveTelegramId = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ telegram_id: telegramId || null })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Telegram vinculado",
        description: "ID do Telegram foi salvo com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar Telegram ID:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o ID do Telegram.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={false} />
      </div>
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações da Conta
              </CardTitle>
              <CardDescription>
                Seus dados básicos de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={profile?.nome || ""} disabled />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Licença
              </CardTitle>
              <CardDescription>
                Informações sobre sua licença do Gasto Certo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {licenseLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              ) : license ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Código da Licença</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input 
                          value={license.codigo} 
                          disabled 
                          className="font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={copyLicenseCode}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant={license.status === 'ativo' ? 'default' : 'secondary'}
                        >
                          {license.status === 'ativo' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Tipo</Label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {license.tipo === 'vitalicia' ? 'Vitalícia' : license.tipo}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma licença encontrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Telegram Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                Integração com Telegram
              </CardTitle>
              <CardDescription>
                Configure o bot do Telegram para registrar transações por mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Como conectar:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Copie seu código de licença acima</li>
                  <li>Abra o Telegram e busque por: <strong>@GastoCertoBot</strong></li>
                  <li>Inicie uma conversa com: <strong>/start {license?.codigo}</strong></li>
                  <li>O bot confirmará a vinculação da sua conta</li>
                </ol>
              </div>
              
              <div>
                <Label>ID do Telegram (preenchido automaticamente)</Label>
                <div className="flex space-x-2 mt-1">
                  <Input 
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Será preenchido automaticamente após conectar"
                  />
                  <Button 
                    onClick={saveTelegramId}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>

              {profile?.telegram_id && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Link className="h-4 w-4" />
                  <span>Telegram conectado com sucesso!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bot Commands */}
          <Card>
            <CardHeader>
              <CardTitle>Comandos do Bot</CardTitle>
              <CardDescription>
                Lista de comandos disponíveis no bot do Telegram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <code className="bg-muted px-2 py-1 rounded">/saldo</code>
                    <p className="text-muted-foreground mt-1">Ver saldo de todas as contas</p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded">/extrato</code>
                    <p className="text-muted-foreground mt-1">Ver últimas transações</p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded">/resumo</code>
                    <p className="text-muted-foreground mt-1">Resumo financeiro do mês</p>
                  </div>
                  <div>
                    <code className="bg-muted px-2 py-1 rounded">/categorias</code>
                    <p className="text-muted-foreground mt-1">Listar categorias</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Registrar Transações:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Envie mensagens de texto ou áudio para registrar transações automaticamente:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Exemplo:</strong> "Gastei 50 reais no supermercado"</p>
                    <p><strong>Exemplo:</strong> "Recebi 100 de freelance"</p>
                    <p><strong>Exemplo:</strong> "Transferi 200 da carteira para conta corrente"</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
export default Settings;
