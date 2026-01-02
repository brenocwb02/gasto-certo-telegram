import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const overrideSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório").regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
});

interface MonthlyBudgetOverrideFormProps {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  defaultAmount: number;
  currentOverrideId?: string;
  currentOverrideAmount?: number;
  month: Date;
  onSuccess?: () => void;
  groupId?: string;
}

export function MonthlyBudgetOverrideForm({ 
  categoryId, 
  categoryName, 
  categoryColor,
  defaultAmount,
  currentOverrideId,
  currentOverrideAmount,
  month,
  onSuccess, 
  groupId 
}: MonthlyBudgetOverrideFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof overrideSchema>>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      amount: currentOverrideAmount?.toString() || defaultAmount.toString(),
    },
  });

  const monthLabel = format(month, "MMMM 'de' yyyy", { locale: ptBR });
  const monthDate = format(month, "yyyy-MM-01");

  const onSubmit = async (values: z.infer<typeof overrideSchema>) => {
    if (!user) return;
    setLoading(true);
    
    try {
      const amount = parseFloat(values.amount);

      if (currentOverrideId) {
        // Update existing override
        const { error } = await supabase
          .from("budgets")
          .update({ amount })
          .eq('id', currentOverrideId);

        if (error) throw error;

        toast({
          title: "Ajuste atualizado",
          description: `Orçamento de ${categoryName} ajustado para ${monthLabel}.`,
        });
      } else {
        // Create new override
        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          group_id: groupId || null,
          category_id: categoryId,
          amount,
          month: monthDate,
        });

        if (error) throw error;

        toast({
          title: "Ajuste criado",
          description: `Orçamento personalizado para ${monthLabel}.`,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar ajuste:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar o ajuste.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverride = async () => {
    if (!currentOverrideId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq('id', currentOverrideId);

      if (error) throw error;

      toast({
        title: "Ajuste removido",
        description: `Voltou a usar o orçamento padrão para ${categoryName}.`,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao remover ajuste:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o ajuste.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: categoryColor || '#6366f1' }} 
        />
        <span className="font-medium">{categoryName}</span>
        <span className="text-muted-foreground ml-auto text-sm">
          {monthLabel}
        </span>
      </div>

      <div className="text-sm text-muted-foreground">
        <span>Orçamento padrão: </span>
        <span className="font-medium text-foreground">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(defaultAmount)}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor para este mês</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : currentOverrideId ? "Atualizar Ajuste" : "Criar Ajuste"}
            </Button>
            
            {currentOverrideId && (
              <Button 
                type="button" 
                variant="outline" 
                disabled={loading}
                onClick={handleRemoveOverride}
              >
                Usar Padrão
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
