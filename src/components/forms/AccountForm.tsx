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

const accountSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(["dinheiro", "corrente", "poupanca", "investimento"]),
  banco: z.string().optional(),
  saldo_inicial: z.string().min(1, "Saldo inicial é obrigatório"),
  cor: z.string().min(1, "Cor é obrigatória"),
});

interface AccountFormProps {
  account?: any;
  onSuccess?: () => void;
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      nome: account?.nome || "",
      tipo: account?.tipo || "corrente",
      banco: account?.banco || "",
      saldo_inicial: account?.saldo_inicial?.toString() || "0",
      cor: account?.cor || "#10b981",
    },
  });

  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const saldoInicial = parseFloat(values.saldo_inicial);
      
      const accountData = {
        nome: values.nome,
        tipo: values.tipo,
        banco: values.banco || null,
        saldo_inicial: saldoInicial,
        saldo_atual: account ? account.saldo_atual : saldoInicial,
        cor: values.cor,
        user_id: user.id,
      };

      if (account) {
        // Update existing account
        const { error } = await supabase
          .from("accounts")
          .update(accountData)
          .eq("id", account.id);

        if (error) throw error;

        toast({
          title: "Conta atualizada",
          description: "A conta foi atualizada com sucesso.",
        });
      } else {
        // Create new account
        const { error } = await supabase
          .from("accounts")
          .insert([accountData]);

        if (error) throw error;

        toast({
          title: "Conta criada",
          description: "A nova conta foi criada com sucesso.",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a conta. Tente novamente.",
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
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Carteira, Conta Corrente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="banco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nubank, Bradesco..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="saldo_inicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial</FormLabel>
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
          name="cor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input type="color" className="w-16 h-10" {...field} />
                  <Input 
                    placeholder="#10b981" 
                    {...field} 
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : account ? "Atualizar Conta" : "Criar Conta"}
        </Button>
      </form>
    </Form>
  );
}