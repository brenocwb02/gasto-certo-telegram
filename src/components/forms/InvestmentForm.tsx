import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInvestments } from '@/hooks/useInvestments';

const investmentSchema = z.object({
  ticker: z.string().min(1, 'Ticker é obrigatório').toUpperCase(),
  transaction_type: z.enum(['compra', 'venda', 'provento']),
  quantity: z.string().optional(),
  price: z.string().optional(),
  total_value: z.string().min(1, 'Valor total é obrigatório'),
  transaction_date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentFormProps {
  onSuccess?: () => void;
}

export const InvestmentForm = ({ onSuccess }: InvestmentFormProps) => {
  const { addTransaction } = useInvestments();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'compra',
    },
  });

  const transactionType = watch('transaction_type');

  const onSubmit = async (data: InvestmentFormData) => {
    setIsSubmitting(true);
    try {
      await addTransaction({
        ticker: data.ticker,
        transaction_type: data.transaction_type,
        quantity: data.quantity ? parseFloat(data.quantity) : null,
        price: data.price ? parseFloat(data.price) : null,
        total_value: parseFloat(data.total_value),
        transaction_date: data.transaction_date,
        notes: data.notes || null,
        investment_id: null,
      });

      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transaction_type">Tipo de Operação</Label>
        <Select
          value={transactionType}
          onValueChange={(value) => setValue('transaction_type', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compra">Compra</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="provento">Provento</SelectItem>
          </SelectContent>
        </Select>
        {errors.transaction_type && (
          <p className="text-sm text-destructive">{errors.transaction_type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticker">Ticker</Label>
        <Input
          id="ticker"
          placeholder="Ex: PETR4, ITSA4"
          {...register('ticker')}
          className="uppercase"
        />
        {errors.ticker && (
          <p className="text-sm text-destructive">{errors.ticker.message}</p>
        )}
      </div>

      {transactionType !== 'provento' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              step="1"
              placeholder="Ex: 100"
              {...register('quantity')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço Unitário (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="Ex: 28.50"
              {...register('price')}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="total_value">
          {transactionType === 'provento' ? 'Valor Recebido (R$)' : 'Valor Total (R$)'}
        </Label>
        <Input
          id="total_value"
          type="number"
          step="0.01"
          placeholder="Ex: 2850.00"
          {...register('total_value')}
        />
        {errors.total_value && (
          <p className="text-sm text-destructive">{errors.total_value.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_date">Data</Label>
        <Input
          id="transaction_date"
          type="date"
          {...register('transaction_date')}
        />
        {errors.transaction_date && (
          <p className="text-sm text-destructive">{errors.transaction_date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Notas sobre esta operação..."
          {...register('notes')}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Registrando...' : 'Registrar Operação'}
        </Button>
      </div>
    </form>
  );
};
