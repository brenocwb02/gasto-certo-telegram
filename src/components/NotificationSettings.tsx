import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Clock } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useToast } from "@/hooks/use-toast";

export function NotificationSettings() {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (field: string, value: boolean) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      await updatePreferences({ [field]: value });
      toast({
        title: "Preferência atualizada",
        description: "Suas configurações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar preferências.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = async (time: string) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      await updatePreferences({ preferred_time: time });
      toast({
        title: "Horário atualizado",
        description: "Horário preferencial salvo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar horário.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
        </CardTitle>
        <CardDescription>
          Configure quando e como você quer receber notificações sobre suas finanças
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canais de Notificação */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Canais de Notificação</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <Label htmlFor="telegram_enabled">Telegram</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações pelo Telegram Bot
                </p>
              </div>
            </div>
            <Switch
              id="telegram_enabled"
              checked={preferences.telegram_enabled}
              onCheckedChange={(checked) => handleToggle('telegram_enabled', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-purple-500" />
              <div>
                <Label htmlFor="email_enabled">E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações por e-mail
                </p>
              </div>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        <Separator />

        {/* Tipos de Notificação */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Tipos de Notificação</h4>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily_summary">Resumo Diário</Label>
              <p className="text-sm text-muted-foreground">
                Resumo das transações do dia
              </p>
            </div>
            <Switch
              id="daily_summary"
              checked={preferences.daily_summary}
              onCheckedChange={(checked) => handleToggle('daily_summary', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly_summary">Resumo Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Resumo financeiro da semana
              </p>
            </div>
            <Switch
              id="weekly_summary"
              checked={preferences.weekly_summary}
              onCheckedChange={(checked) => handleToggle('weekly_summary', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="monthly_summary">Resumo Mensal</Label>
              <p className="text-sm text-muted-foreground">
                Resumo completo do mês
              </p>
            </div>
            <Switch
              id="monthly_summary"
              checked={preferences.monthly_summary}
              onCheckedChange={(checked) => handleToggle('monthly_summary', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="spending_alerts">Alertas de Gastos</Label>
              <p className="text-sm text-muted-foreground">
                Aviso quando gastos excedem o normal
              </p>
            </div>
            <Switch
              id="spending_alerts"
              checked={preferences.spending_alerts}
              onCheckedChange={(checked) => handleToggle('spending_alerts', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="budget_alerts">Alertas de Orçamento</Label>
              <p className="text-sm text-muted-foreground">
                Aviso quando ultrapassar orçamento
              </p>
            </div>
            <Switch
              id="budget_alerts"
              checked={preferences.budget_alerts}
              onCheckedChange={(checked) => handleToggle('budget_alerts', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="goal_reminders">Lembretes de Metas</Label>
              <p className="text-sm text-muted-foreground">
                Progresso e lembretes das suas metas
              </p>
            </div>
            <Switch
              id="goal_reminders"
              checked={preferences.goal_reminders}
              onCheckedChange={(checked) => handleToggle('goal_reminders', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="bill_reminders">Lembretes de Contas</Label>
              <p className="text-sm text-muted-foreground">
                Aviso de contas próximas do vencimento
              </p>
            </div>
            <Switch
              id="bill_reminders"
              checked={preferences.bill_reminders}
              onCheckedChange={(checked) => handleToggle('bill_reminders', checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        <Separator />

        {/* Horário Preferencial */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horário Preferencial
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="preferred_time">Hora de envio das notificações</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Escolha o melhor horário para receber seus resumos diários
              </p>
              <Input
                id="preferred_time"
                type="time"
                value={preferences.preferred_time}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {isSaving && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Salvando...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
