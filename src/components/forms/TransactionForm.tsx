import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTransactions, useAccounts, useCategories } from '@/hooks/useSupabaseData';
import { Loader2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client"; // Importar supabase

const transactionSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  tipo: z.enum(['receita', 'despesa', 'transferencia']),
  categoria_id: z.string().optional().nullable(), // Tornar opcional, mas validar em onSubmit
  conta_origem_id: z.string().min(1, 'Conta é obrigatória'),
  conta_destino_id: z.string().optional().nullable(),
  data_transacao: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
}).refine(data => data.tipo === 'transferencia' || data.categoria_id, {
    message: "Categoria é obrigatória para Receitas/Despesas",
    path: ['categoria_id'],
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  // When editing, pass the current transaction values
  initialData?: {
    id?: string;
    descricao?: string;
    valor?: number | string;
    tipo?: 'receita' | 'despesa' | 'transferencia';
    categoria_id?: string | null;
    conta_origem_id?: string | null;
    conta_destino_id?: string | null;
    data_transacao?: string; // ISO date
    observacoes?: string | null;
  };
}

export function TransactionForm({ onSuccess, onCancel, mode = 'create', initialData }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addTransaction, updateTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      descricao: initialData?.descricao ?? '',
      valor: initialData?.valor !== undefined ? String(initialData.valor) : '',
      tipo: initialData?.tipo ?? 'despesa',
      categoria_id: (initialData?.categoria_id as string) ?? undefined,
      conta_origem_id: (initialData?.conta_origem_id as string) ?? '',
      conta_destino_id: (initialData?.conta_destino_id as string) ?? undefined,
      data_transacao: initialData?.data_transacao ?? new Date().toISOString().split('T')[0],
      observacoes: (initialData?.observacoes as string) ?? '',
    },
  });

  const watchedType = form.watch('tipo');
  const watchedCategoryId = form.watch('categoria_id');

  // Função para limpar e extrair a primeira palavra-chave da descrição (primeira palavra)
  const getKeywordFromDescription = (description: string) => {
    // Tenta pegar a primeira palavra ou token significativo
    // Ex: "Ifood" de "Ifood 50.00"
    const match = description.trim().toLowerCase().match(/(\w+)/);
    return match ? match[1] : null;
  };

  const handleAutoLearn = async (newCategoryId: string, newDescription: string) => {
    // A lógica de auto-aprendizado deve se concentrar na primeira palavra da descrição
    if (watchedType === 'transferencia') return;

    const keyword = getKeywordFromDescription(newDescription);
    if (!keyword) return;

    // Busca a categoria para evitar adicionar a mesma palavra
    const targetCategory = categories.find(c => c.id === newCategoryId);
    const existingKeywords = targetCategory?.keywords || [];
    
    // Se a palavra-chave (em lowercase) já estiver na lista, não faz nada
    if (existingKeywords.map(k => k.toLowerCase()).includes(keyword)) {
        return;
    }
    
    try {
        // Chama a função RPC de auto-aprendizado para adicionar a nova palavra-chave
        const { error } = await supabase.rpc('auto_learn_category', {
            p_category_id: newCategoryId,
            p_new_keyword: keyword,
            p_user_id: supabase.auth.currentUser?.id,
        });

        if (error) {
            console.error("Erro no auto-aprendizado RPC:", error);
            return;
        }
        
        toast({
            title: "Aprendizado de Categoria",
            description: `A palavra-chave "${keyword}" foi adicionada à categoria para futuras classificações.`,
            variant: "secondary"
        });

    } catch (error) {
        console.error("Erro inesperado no auto-aprendizado:", error);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      const categoryChanged = initialData?.categoria_id !== data.categoria_id;
      
      const transactionPayload = {
          descricao: data.descricao,
          valor: parseFloat(data.valor),
          tipo: data.tipo,
          categoria_id: data.categoria_id || null,
          conta_origem_id: data.conta_origem_id,
          conta_destino_id: data.conta_destino_id || null,
          data_transacao: data.data_transacao,
          observacoes: data.observacoes || null,
      };

      if (mode === 'edit' && initialData?.id) {
        await updateTransaction(initialData.id, transactionPayload);

        toast({
          title: 'Transação atualizada',
          description: 'As alterações foram salvas com sucesso.',
        });
        
        // Se a categoria foi alterada e a transação não é transferência, tenta auto-aprender
        if (categoryChanged && data.categoria_id && data.tipo !== 'transferencia') {
            handleAutoLearn(data.categoria_id, data.descricao);
        }

      } else {
        await addTransaction({
          ...transactionPayload,
          anexos: [],
          tags: null,
          data_vencimento: null,
          origem: 'web',
        });

        toast({
          title: 'Transação criada',
          description: 'A transação foi registrada com sucesso.',
        });

        // Tenta auto-aprender após a criação se não for transferência
        if (data.categoria_id && data.tipo !== 'transferencia') {
            handleAutoLearn(data.categoria_id, data.descricao);
        }

        form.reset();
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar transação',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.tipo === watchedType || watchedType === 'transferencia'
  );

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'edit' ? (
            <>Editar Transação</>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nova Transação
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Almoço no restaurante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
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
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((category) => (
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
                name="data_transacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conta_origem_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchedType === 'transferencia' ? 'Conta Origem' : 'Conta'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.nome} - R$ {Number(account.saldo_atual).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedType === 'transferencia' && (
                <FormField
                  control={form.control}
                  name="conta_destino_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta Destino</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta destino" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.nome} - R$ {Number(account.saldo_atual).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a transação..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Transação
              </Button>
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
