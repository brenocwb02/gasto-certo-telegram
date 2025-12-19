import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useSupabaseData";

const goalSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  valor_meta: z.string().min(1, "Valor da meta é obrigatório"),
  valor_atual: z.string().optional(),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  tipo_periodo: z.enum(["mensal", "trimestral", "semestral", "anual", "unico"]),
  categoria_id: z.string().optional(),
  status: z.enum(["ativa", "pausada", "concluida"]),
});

interface GoalFormProps {
  goal?: any;
  onSuccess?: () => void;
  groupId?: string;
}

export function GoalForm({ goal, onSuccess, groupId }: GoalFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories } = useCategories();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      titulo: goal?.titulo || "",
      descricao: goal?.descricao || "",
      valor_meta: goal?.valor_meta?.toString() || "",
      valor_atual: goal?.valor_atual?.toString() || "0",
      data_inicio: goal?.data_inicio || new Date().toISOString().split('T')[0],
      data_fim: goal?.data_fim || "",
      tipo_periodo: goal?.tipo_periodo || "mensal",
      categoria_id: goal?.categoria_id || undefined,
      status: goal?.status || "ativa",
    },
  });

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const goalData = {
        titulo: values.titulo,
        descricao: values.descricao || null,
        valor_meta: parseFloat(values.valor_meta),
        valor_atual: parseFloat(values.valor_atual || "0"),
        data_inicio: values.data_inicio,
        data_fim: values.data_fim,
        tipo_periodo: values.tipo_periodo,
        categoria_id: values.categoria_id || null,
        status: values.status,
        user_id: user.id,
        group_id: groupId || null,
      };

      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from("goals")
          .update(goalData)
          .eq("id", goal.id);

        if (error) throw error;

        toast({
          title: "Meta atualizada",
          description: "A meta foi atualizada com sucesso.",
        });
      } else {
        // Create new goal
        const { error } = await supabase
          .from("goals")
          .insert([goalData]);

        if (error) throw error;

        toast({
          title: "Meta criada",
          description: "A nova meta foi criada com sucesso.",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a meta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Meta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Reserva de emergência, Viagem..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva sua meta..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor_meta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor da Meta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor_atual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Atual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Fim</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tipo_periodo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Período</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="unico">Único</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nome}
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : goal ? "Atualizar Meta" : "Criar Meta"}
        </Button>
      </form>
    </Form>
  );
}
