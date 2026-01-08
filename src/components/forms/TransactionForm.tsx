import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useTransactions, useAccounts, useCategories } from '@/hooks/useSupabaseData';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { useLimits } from '@/hooks/useLimits';
import { Loader2, Plus, Repeat, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addDays, addWeeks, addMonths, addYears, parseISO, format } from 'date-fns';

const transactionSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  tipo: z.enum(['receita', 'despesa', 'transferencia']),
  categoria_id: z.string().optional().nullable(),
  conta_origem_id: z.string().min(1, 'Conta é obrigatória'),
  conta_destino_id: z.string().optional().nullable(),
  data_transacao: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
  efetivada: z.boolean().default(true),
  is_recurring: z.boolean().default(false),
  frequency: z.enum(['diaria', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual']).optional(),
  end_date: z.string().optional(),
  is_installment: z.boolean().default(false),
  installment_count: z.string().optional(),
}).refine(data => data.tipo === 'transferencia' || data.categoria_id, {
  message: "Categoria é obrigatória para Receitas/Despesas",
  path: ['categoria_id'],
}).refine(data => !data.is_recurring || data.frequency, {
  message: "Frequência é obrigatória para transações recorrentes",
  path: ['frequency'],
}).refine(data => !data.is_installment || (data.installment_count && parseInt(data.installment_count) >= 2), {
  message: "Número de parcelas deve ser pelo menos 2",
  path: ['installment_count'],
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onRefetch?: () => void;
  mode?: 'create' | 'edit';
  initialData?: {
    id?: string;
    descricao?: string;
    valor?: number | string;
    tipo?: 'receita' | 'despesa' | 'transferencia';
    categoria_id?: string | null;
    conta_origem_id?: string | null;
    conta_destino_id?: string | null;
    data_transacao?: string;
    observacoes?: string | null;
    efetivada?: boolean; // Support editing status if available
  };
  groupId?: string;
}

export function TransactionForm({ onSuccess, onCancel, onRefetch, mode = 'create', initialData, groupId }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addTransaction, updateTransaction } = useTransactions(groupId);
  const { createRecurringTransaction } = useRecurringTransactions();
  const { accounts } = useAccounts(groupId);
  const { categories } = useCategories(groupId);
  const { isTransactionLimitReached } = useLimits();

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
      efetivada: initialData?.efetivada ?? true,
      is_recurring: false,
      frequency: 'mensal',
      end_date: undefined,
      is_installment: false,
      installment_count: '2',
    },
  });

  const watchedType = form.watch('tipo');
  const watchedIsRecurring = form.watch('is_recurring');
  const watchedEfetivada = form.watch('efetivada');
  const watchedIsInstallment = form.watch('is_installment');

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      const transactionPayload = {
        descricao: data.descricao,
        valor: parseFloat(data.valor),
        tipo: data.tipo,
        categoria_id: data.categoria_id || null,
        conta_origem_id: data.conta_origem_id,
        conta_destino_id: data.conta_destino_id || null,
        data_transacao: data.data_transacao,
        observacoes: data.observacoes || null,
        efetivada: data.efetivada,
      };

      if (mode === 'edit' && initialData?.id) {
        await updateTransaction(initialData.id, transactionPayload);
        toast({ title: 'Transação atualizada', description: 'As alterações foram salvas com sucesso.' });
      } else {
        // Check if this is an installment purchase
        if (data.is_installment && data.installment_count) {
          const totalInstallments = parseInt(data.installment_count);
          const installmentValue = parseFloat(data.valor) / totalInstallments;
          const startDate = parseISO(data.data_transacao);

          // Generate a unique ID for this installment group to allow bulk deletion later
          const installGroupId = crypto.randomUUID();

          // Get account details to check for credit card closing date
          const selectedAccount = accounts.find(a => a.id === data.conta_origem_id);
          const closingDay = selectedAccount?.dia_fechamento;
          const dueDay = selectedAccount?.dia_vencimento;

          // Smart Date Logic:
          // If credit card AND purchase date >= closing date, the "financial effect" starts next month.
          // However, we preserve data_transacao as the purchase date for history.
          // We can use data_vencimento to indicate when it will be paid.

          let baseDate = startDate;
          let isPostClosing = false;

          if (selectedAccount?.tipo === 'cartao' && closingDay) {
            const purchaseDay = startDate.getDate();
            if (purchaseDay >= closingDay) {
              isPostClosing = true;
              // If bought after closing, the first payment is skipped one month effectively?
              // Example: Closes 25th, Due 5th.
              // Buy 20th Jan -> Closes 25th Jan -> Due 5th Feb. (0 month shift in terms of "next due date" relative to purchase month? No, it's next month).
              // Buy 26th Jan -> Closes 25th Feb -> Due 5th Mar. (1 month shift).
              // "startDate" is Jan 26. "addMonths(Start, 0)" is Jan 26.
              // We want the "Reference Month" for the first installment to be March? Or Feb?
              // Usually systems treat the "Date" of the installment as the "Due Date" or "Competence Date".
              // If I map it to "Competence", Jan 26 purchase -> Feb Competence.
              // Let's shift the DATE of the installments if post-closing, effectively moving them to the "Billable Month".

              // SHIFT STRATEGY:
              // If post-closing, we add 1 month to the calculation base for ALL installments?
              // Yes, because 1/10 will fall in Mar, 2/10 in Apr.
              baseDate = addMonths(startDate, 1);
            }
          }

          // Create N transactions, one for each installment
          for (let i = 0; i < totalInstallments; i++) {
            // If post-closing, i=0 starts at baseDate (Purchase+1mo).
            // If normal, i=0 starts at baseDate (Purchase).
            // Actually, usually 1st installment is next month anyway?
            // "Parcelado em 2x": 1st Invoice, 2nd Invoice.
            // If I buy Jan 20 (Open Jan Invoice), 1/2 is Jan Invoice (Pay Feb), 2/2 is Feb Invoice (Pay Mar).
            // rule: i starts at 0.

            const installmentDate = addMonths(baseDate, i);

            // Calculate specific due date if we have account info
            if (dueDay) {
              // Due date is in the month following the *invoice* month?
              // Simplification: automatic due date is hard without complex calendar logic, 
              // but we can try to set data_vencimento if we want.
              // For now, let's keep it simple: relying on the installmentDate (transacao) 
              // falling into the correct month bucket.
            }

            await addTransaction({
              descricao: `${data.descricao} (${i + 1}/${totalInstallments})`,
              valor: installmentValue,
              tipo: data.tipo,
              categoria_id: data.categoria_id || null,
              conta_origem_id: data.conta_origem_id,
              conta_destino_id: null,
              data_transacao: format(installmentDate, 'yyyy-MM-dd'),
              observacoes: `Parcela ${i + 1} de ${totalInstallments}${isPostClosing ? ' (Fechamento virado)' : ''}`,
              efetivada: false, // Installments are always future/pending by default
              anexos: null,
              tags: [`installment_group:${installGroupId}`],
              data_vencimento: null,
              origem: 'web',
              parent_transaction_id: null,
              group_id: null,
            } as any);
          }

          toast({
            title: 'Parcelas criadas!',
            description: `${totalInstallments} parcelas de R$ ${installmentValue.toFixed(2)} foram registradas.`,
          });
        } else {
          // Regular single transaction
          await addTransaction({
            ...transactionPayload,
            anexos: [],
            tags: null,
            data_vencimento: null,
            origem: 'web',
            installment_number: 1,
            installment_total: 1,
            parent_transaction_id: null,
            group_id: null,
          });

          // 2. If recurring, create the rule
          if (data.is_recurring && data.frequency) {
            const currentDate = parseISO(data.data_transacao);
            let nextDate = currentDate;

            // Calculate start date for recurrence (next occurrence)
            switch (data.frequency) {
              case 'diaria': nextDate = addDays(currentDate, 1); break;
              case 'semanal': nextDate = addWeeks(currentDate, 1); break;
              case 'mensal': nextDate = addMonths(currentDate, 1); break;
              case 'trimestral': nextDate = addMonths(currentDate, 3); break;
              case 'semestral': nextDate = addMonths(currentDate, 6); break;
              case 'anual': nextDate = addYears(currentDate, 1); break;
            }

            const startDateStr = format(nextDate, 'yyyy-MM-dd');

            await createRecurringTransaction({
              title: data.descricao,
              description: `Recorrência gerada via Nova Transação: ${data.descricao}`,
              amount: parseFloat(data.valor),
              type: data.tipo as 'receita' | 'despesa',
              frequency: data.frequency,
              start_date: startDateStr,
              end_date: data.end_date,
              category_id: data.categoria_id || undefined,
              account_id: data.conta_origem_id,
              group_id: groupId,
              gerar_pendente: !data.efetivada // If current is pending, future ones should be too
            });

            toast({
              title: 'Recorrência criada!',
              description: `Próximo lançamento agendado para ${format(nextDate, 'dd/MM/yyyy')}.`
            });
          } else {
            toast({ title: 'Transação criada', description: 'A transação foi registrada com sucesso.' });
          }
        }

        form.reset();
      }

      onRefetch?.();
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

  const filteredCategories = categories.filter(cat => cat.tipo === watchedType || watchedType === 'transferencia');
  const parentCategories = filteredCategories.filter(cat => !cat.parent_id);
  const subcategories = filteredCategories.filter(cat => cat.parent_id);
  const hierarchicalCategories = parentCategories.flatMap(parent => {
    const children = subcategories.filter(sub => sub.parent_id === parent.id);
    return [
      { ...parent, isParent: true, displayName: parent.nome, hasChildren: children.length > 0 },
      ...children.map(child => ({ ...child, isParent: false, displayName: `    └ ${child.nome}`, hasChildren: false }))
    ];
  });

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'edit' ? <>Editar Transação</> : <><Plus className="h-5 w-5" /> Nova Transação</>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ... Existing fields ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Input placeholder="Ex: Almoço" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="0,00" type="number" step="0.01" min="0" {...field} /></FormControl>
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
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {hierarchicalCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} disabled={cat.isParent && cat.hasChildren} className={cat.isParent ? 'font-semibold' : 'pl-4 text-muted-foreground'}>
                            {cat.displayName}
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
                    <FormControl><Input type="date" {...field} /></FormControl>
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
                    <FormLabel>{watchedType === 'transferencia' ? 'Conta Origem' : 'Conta'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.nome} - R$ {Number(acc.saldo_atual).toFixed(2)}</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.nome} - R$ {Number(acc.saldo_atual).toFixed(2)}</SelectItem>
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
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea placeholder="Detalhes..." className="min-h-[80px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Status Field (Always Visible) --- */}
            <div className="space-y-4 pt-2 border-t mt-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Situação da Transação</FormLabel>
                  <FormDescription>
                    {watchedEfetivada ? "A transação será debitada do saldo imediatamente." : "Será lançada como pendente (Contas a Pagar/Receber)."}
                  </FormDescription>
                </div>
                <FormField
                  control={form.control}
                  name="efetivada"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <span className="text-sm font-medium">{field.value ? "Pago / Recebido" : "Pendente"}</span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* --- Recurrence Field (Create Mode Only) --- */}
            {mode === 'create' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Repeat className="h-4 w-4" /> Repetir transação?
                      </FormLabel>
                      <FormDescription>
                        Criar uma regra de recorrência automática.
                      </FormDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="is_recurring"
                      render={({ field }) => (
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      )}
                    />
                  </div>

                  {watchedIsRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="semanal">Semanal</SelectItem>
                                <SelectItem value="mensal">Mensal</SelectItem>
                                <SelectItem value="anual">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Final (Opcional)</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- Installment Field (Create Mode Only) --- */}
            {mode === 'create' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Parcelar no cartão?
                      </FormLabel>
                      <FormDescription>
                        Dividir em múltiplas parcelas mensais.
                      </FormDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="is_installment"
                      render={({ field }) => (
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Disable recurrence if enabling installment
                              if (checked) {
                                form.setValue('is_recurring', false);
                              }
                            }}
                          />
                        </FormControl>
                      )}
                    />
                  </div>

                  {watchedIsInstallment && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name="installment_count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Parcelas</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                                  <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center text-sm text-muted-foreground pt-6">
                        {form.watch('installment_count') && form.watch('valor') && (
                          <span>
                            {form.watch('installment_count')}x de R$ {(parseFloat(form.watch('valor') || '0') / parseInt(form.watch('installment_count') || '1')).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* -------------------------------- */}

            {mode === 'create' && isTransactionLimitReached && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center justify-between">
                <span>Limite de transações atingido.</span>
                <Button variant="link" className="text-destructive underline h-auto p-0" asChild><a href="/planos">Upgrade</a></Button>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || (mode === 'create' && isTransactionLimitReached)} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' && isTransactionLimitReached ? 'Limite Atingido' : 'Salvar Transação'}
              </Button>
              {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
