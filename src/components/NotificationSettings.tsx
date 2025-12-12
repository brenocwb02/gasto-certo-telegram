import { Bell, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export const NotificationSettings = () => {
  const { permission, requestPermission, sendLocalNotification } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked && permission !== 'granted') {
      await requestPermission();
    }
  };

  const handleTest = () => {
    console.log('Botão de teste clicado');
    // toast.info('Iniciando teste...'); // Feedback imediato
    sendLocalNotification(
      'Teste de Notificação',
      'Se você está vendo isso, as notificações estão funcionando corretamente! 🎉'
    );
  };

  return (
    <Card className="financial-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Bell className="h-5 w-5 text-yellow-500" />
          </div>
          Notificações
        </CardTitle>
        <CardDescription className="text-base">
          Gerencie como e quando você quer ser notificado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Notificações Push</Label>
            <p className="text-sm text-muted-foreground">
              Receba alertas no seu dispositivo quando houver novidades
            </p>
          </div>
          <Switch
            checked={permission === 'granted'}
            onCheckedChange={handleToggle}
            aria-label="Ativar notificações push"
          />
        </div>

        {permission === 'granted' && (
          <div className="bg-gradient-to-br from-yellow-500/10 to-transparent p-5 rounded-xl border border-yellow-500/20">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <span className="text-yellow-600">📲</span>
              Área de Teste
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Clique no botão abaixo para verificar se seu dispositivo está recebendo as notificações corretamente.
            </p>
            <Button
              variant="secondary"
              onClick={handleTest}
              className="w-full sm:w-auto"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Enviar Notificação de Teste
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            Notificações estão bloqueadas pelo navegador. Por favor, habilite nas configurações do site (ícone de cadeado na barra de endereços).
          </div>
        )}
      </CardContent>
    </Card>
  );
};
