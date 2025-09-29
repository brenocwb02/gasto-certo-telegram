import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

// Define schema for form validation
const formSchema = z.object({
  category_id: z.string().min(1, { message: "Category is required." }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  period: z.enum(["monthly", "weekly", "daily"]),
});

type BudgetFormData = z.infer<typeof formSchema>;
type Budget = Database["public"]["Tables"]["budgets"]["Row"];

interface BudgetFormProps {
  budget?: Budget | null;
  onSave?: () => void;
}

// The async function to save the budget
const createOrUpdateBudget = async ({
  values,
  user_id,
  budget_id,
}: {
  values: BudgetFormData;
  user_id: string;
  budget_id?: number | null;
}) => {
  const dataToUpsert = {
    id: budget_id || undefined,
    user_id: user_id,
    category_id: parseInt(values.category_id, 10),
    amount: values.amount,
    period: values.period,
  };

  const { error } = await supabase.from("budgets").upsert(dataToUpsert);

  if (error) {
    throw new Error(error.message);
  }
};

export function BudgetForm({ budget, onSave }: BudgetFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading: isLoadingCategories } = useSupabaseData(
    "categories",
    "id, name"
  );

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: budget?.category_id?.toString() || "",
      amount: budget?.amount || 0,
      period: budget?.period || "monthly",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createOrUpdateBudget,
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Orçamento salvo com sucesso.",
      });
      // This is the magic! It tells React Query to refetch the budgets.
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.id] });
      onSave?.(); // Closes the modal/dialog
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: BudgetFormData) {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar um orçamento.",
        variant: "destructive",
      });
      return;
    }
    mutate({ values, user_id: user.id, budget_id: budget?.id });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger disabled={isLoadingCategories}>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
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
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input type="number" placeholder="150.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Salvando..." : "Salvar Orçamento"}
        </Button>
      </form>
    </Form>
  );
}
