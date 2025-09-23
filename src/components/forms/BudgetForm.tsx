import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

const budgetSchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  month: z.string().min(1, "Mês é obrigatório"),
});

interface BudgetFormProps {
  onSuccess?: () => void;
}

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories } = useCategories();

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: "",
      amount: "",
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
    },
  });

  const onSubmit = async (values: z.infer<typeof budgetSchema>) => {
    if (!user) return;
    setLoading(true);
    try {
      const budgetData = {
        user_id: user.id,
        category_id: values.category_id,
        amount: parseFloat(values.amount),
        month: `${values.month}-01`, // Garante que é o primeiro dia do mês
      };

      const { error } = await supabase.from("budgets").insert(budgetData);

      if (error) {
        if (error.code === '23505') { // unique_violation
          throw new Error("Já existe um orçamento para esta categoria neste mês.");
        }
        throw error;
      }

      toast({
        title: "Orçamento criado",
        description: "Seu novo orçamento foi criado com sucesso.",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = categories.filter(c => c.tipo === 'despesa');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mês do Orçamento</FormLabel>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria de despesa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
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
              <FormLabel>Valor Orçado</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Criar Orçamento"}
        </Button>
      </form>
    </Form>
  );
}

