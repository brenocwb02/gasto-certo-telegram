import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link, Copy, Shield, Bot, User } from "lucide-react";
import { useProfile } from "@/hooks/useSupabaseData";
import { useLicense } from "@/hooks/useLicense";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationSettings } from "@/components/NotificationSettings";

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, loading: profileLoading } = useProfile();
  const { license, loading: licenseLoading } = useLicense();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Configurações | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Configure sua conta do Boas Contas: vincule o Telegram, gerencie licença e ajuste preferências.");
    }
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/settings");
  }, []);

  const copyLicenseCode = () => {
    if (license?.codigo) {
      navigator.clipboard.writeText(license.codigo);
      toast({
        title: "Código copiado!",
        description: "Código de licença copiado para a área de transferência.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 animate-fade-in max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
            <p className="text-muted-foreground text-lg">Gerencie sua conta e preferências do sistema</p>
          </div>

          <div className="space-y-6">

          {/* Profile Information */}
          <Card className="financial-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                Informações da Conta
              </CardTitle>
              <CardDescription className="text-base">
                Seus dados básicos de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {profileLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-11 bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-11 bg-muted rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Nome</Label>
                    <Input value={profile?.nome || ""} disabled className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">E-mail</Label>
                    <Input value={user?.email || ""} disabled className="h-11" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Information */}
          <Card className="financial-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-success/10">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                Licença
              </CardTitle>
              <CardDescription className="text-base">
                Informações sobre sua licença do Boas Contas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {licenseLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-11 bg-muted rounded"></div>
                  </div>
                </div>
              ) : license ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Código da Licença</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={license.codigo} 
                        disabled 
                        className="font-mono h-11 flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={copyLicenseCode}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Status</Label>
                      <div>
                        <Badge 
                          variant={license.status === 'ativo' ? 'default' : 'secondary'}
                          className="text-sm px-3 py-1"
                        >
                          {license.status === 'ativo' ? '✓ Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tipo</Label>
                      <div>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {license.tipo === 'vitalicia' ? '∞ Vitalícia' : license.tipo}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma licença encontrada.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telegram Integration */}
          <Card className="financial-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Bot className="h-5 w-5 text-blue-500" />
                </div>
                Integração com Telegram
              </CardTitle>
              <CardDescription className="text-base">
                Configure o @BoasContasBot para registrar transações por mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile?.telegram_id && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-success/10 to-success/5 border-2 border-success/30 rounded-xl">
                  <div className="p-2 rounded-lg bg-success/20">
                    <Link className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-success">Telegram Conectado!</p>
                    <p className="text-sm text-muted-foreground">Seu bot está pronto para uso</p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border-2 border-primary/20">
                <h4 className="font-bold mb-5 text-lg flex items-center gap-2">
                  <span className="text-primary">📱</span>
                  Como conectar em 3 passos:
                </h4>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md">
                      1
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold mb-1">Copie seu código de licença</p>
                      <p className="text-sm text-muted-foreground">Use o botão "Copiar" na seção de Licença acima</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-2">Abra o bot no Telegram</p>
                      <Button 
                        size="lg"
                        className="w-full sm:w-auto shadow-sm"
                        onClick={() => window.open('https://t.me/BoasContasBot', '_blank')}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Abrir @BoasContasBot
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md">
                      3
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold mb-2">Vincule sua conta</p>
                      <div className="bg-background/80 p-3 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Envie este comando:</p>
                        <code className="bg-muted px-3 py-2 rounded text-sm font-mono block">
                          /start {license?.codigo || 'SEU_CODIGO'}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Commands */}
          <Card className="financial-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Comandos do Bot</CardTitle>
              <CardDescription className="text-base">
                Lista de comandos disponíveis no bot do Telegram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-card-hover hover:shadow-sm transition-all">
                    <code className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold">/saldo</code>
                    <p className="text-muted-foreground mt-2 text-sm">Ver saldo de todas as contas</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card-hover hover:shadow-sm transition-all">
                    <code className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold">/extrato</code>
                    <p className="text-muted-foreground mt-2 text-sm">Ver últimas transações</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card-hover hover:shadow-sm transition-all">
                    <code className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold">/resumo</code>
                    <p className="text-muted-foreground mt-2 text-sm">Resumo financeiro do mês</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card-hover hover:shadow-sm transition-all">
                    <code className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold">/categorias</code>
                    <p className="text-muted-foreground mt-2 text-sm">Listar categorias</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-gradient-to-br from-accent/10 to-transparent p-5 rounded-xl border border-accent/20">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <span className="text-accent">💬</span>
                    Registrar Transações via Mensagem:
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envie mensagens de texto ou áudio para registrar transações automaticamente
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-success font-bold">✓</span>
                      <p className="text-sm"><span className="font-semibold">Despesa:</span> "Gastei 50 reais no supermercado"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-success font-bold">✓</span>
                      <p className="text-sm"><span className="font-semibold">Receita:</span> "Recebi 100 de freelance"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-success font-bold">✓</span>
                      <p className="text-sm"><span className="font-semibold">Transferência:</span> "Transferi 200 da carteira para conta corrente"</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <NotificationSettings />
          </div>
        </main>
      </div>
    </div>
  );
};
export default Settings;