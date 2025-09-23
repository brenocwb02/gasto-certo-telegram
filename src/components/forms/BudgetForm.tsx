import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const budgetSchema = z.object({
  category_id: z.string().min(1, "Selecione uma categoria"),
  amount: z.string().min(1, "Informe o valor do orçamento"),
  month: z.string().min(1, "Informe o mês"),
});

interface BudgetFormProps {
  budget?: {
    id: string;
    category_id: string;
    amount: number;
    month: string;
    category: {
      nome: string;
      cor: string;
      tipo: string;
    };
  } | null;
  onSuccess: () => void;
}

interface Category {
  id: string;
  nome: string;
  cor: string;
  tipo: string;
}

export function BudgetForm({ budget, onSuccess }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: budget?.category_id || "",
      amount: budget?.amount?.toString() || "",
      month: budget?.month || new Date().toISOString().slice(0, 7) + '-01',
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('tipo', 'despesa')
        .order('nome');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof budgetSchema>) => {
    if (!user) return;

    try {
      setLoading(true);

      const budgetData = {
        user_id: user.id,
        category_id: values.category_id,
        amount: parseFloat(values.amount.replace(',', '.')),
        month: values.month,
      };

      let error;

      if (budget) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', budget.id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('budgets')
          .insert([budgetData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: budget ? "Orçamento atualizado" : "Orçamento criado",
        description: budget 
          ? "O orçamento foi atualizado com sucesso."
          : "O orçamento foi criado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      
      let errorMessage = "Erro ao salvar orçamento";
      if (error?.code === '23505') {
        errorMessage = "Já existe um orçamento para esta categoria neste mês";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMonthName = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Generate month options (current month and next 11 months)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthValue = date.toISOString().slice(0, 7) + '-01';
      options.push({
        value: monthValue,
        label: formatMonthName(monthValue)
      });
    }
    
    return options;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.cor }}
                        />
                        {category.nome}
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
              <FormLabel>Valor do Orçamento</FormLabel>
              <FormControl>
                <Input
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mês</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {generateMonthOptions().map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Salvando..." : budget ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}