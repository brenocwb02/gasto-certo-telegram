import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useCategories";

const defaultBudgetSchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório").regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
});

interface DefaultBudgetFormProps {
  budget?: {
    id: string;
    category_id: string;
    amount: number;
  } | null;
  onSuccess?: () => void;
  groupId?: string;
  existingCategoryIds?: string[];
}

export function DefaultBudgetForm({ budget, onSuccess, groupId, existingCategoryIds = [] }: DefaultBudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories } = useCategories(groupId);

  const form = useForm<z.infer<typeof defaultBudgetSchema>>({
    resolver: zodResolver(defaultBudgetSchema),
    defaultValues: {
      category_id: budget?.category_id || "",
      amount: budget?.amount?.toString() || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof defaultBudgetSchema>) => {
    if (!user) return;
    setLoading(true);
    
    try {
      const budgetData = {
        user_id: user.id,
        group_id: groupId || null,
        category_id: values.category_id,
        amount: parseFloat(values.amount),
      };

      if (budget) {
        // Update existing default budget
        const { error } = await supabase
          .from("default_budgets")
          .update({ amount: budgetData.amount })
          .eq('id', budget.id);

        if (error) throw error;

        toast({
          title: "Orçamento padrão atualizado",
          description: "O orçamento padrão foi atualizado com sucesso.",
        });
      } else {
        // Create new default budget
        const { error } = await supabase.from("default_budgets").insert(budgetData);

        if (error) {
          if (error.code === '23505') {
            throw new Error("Já existe um orçamento padrão para esta categoria.");
          }
          throw error;
        }

        toast({
          title: "Orçamento padrão criado",
          description: "O orçamento será aplicado automaticamente a todos os meses.",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar orçamento padrão:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter expense categories and exclude already budgeted ones (unless editing)
  const availableCategories = categories.filter(c => 
    c.tipo === 'despesa' && 
    (budget?.category_id === c.id || !existingCategoryIds.includes(c.id))
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!!budget}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria de despesa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.filter(cat => cat.id && cat.id.trim() !== '').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.cor || '#6366f1' }} 
                        />
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Mensal Padrão</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Este valor será aplicado automaticamente a todos os meses.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : budget ? "Atualizar Orçamento Padrão" : "Criar Orçamento Padrão"}
        </Button>
      </form>
    </Form>
  );
}
