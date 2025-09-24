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
import { useCategories } from "@/hooks/useSupabaseData";

const budgetSchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório").regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
  month: z.object({
    month: z.string().min(1, "Mês é obrigatório"),
    year: z.string().min(1, "Ano é obrigatório"),
  }),
});

interface BudgetFormProps {
  onSuccess?: () => void;
}

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories } = useCategories();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: "",
      amount: "",
      month: {
        month: String(currentMonth).padStart(2, '0'),
        year: String(currentYear)
      },
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
        month: `${values.month.year}-${values.month.month}-01`,
      };

      const { error } = await supabase.from("budgets").insert(budgetData);

      if (error) {
        if (error.code === '23505') { // unique_violation
          throw new Error("Já existe um orçamento para esta categoria neste mês.");
        }
        console.error("Supabase error:", error);
        throw error;
      }

      toast({
        title: "Orçamento criado",
        description: "Seu novo orçamento foi criado com sucesso.",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
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

  const months = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];
  const years = [currentYear, currentYear + 1];


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mês do Orçamento</FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={(value) => field.onChange({ ...field.value, month: value })} defaultValue={field.value.month}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                 <Select onValueChange={(value) => field.onChange({ ...field.value, year: value })} defaultValue={field.value.year}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
                  {expenseCategories.filter(cat => cat.id && cat.id.trim() !== '').map((cat) => (
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

