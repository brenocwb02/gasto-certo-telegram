import { TrendingUp, Wallet, CreditCard, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useNetWorthHistory } from '@/hooks/useNetWorthHistory';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { Progress } from '@/components/ui/progress';

export default function NetWorth() {
  const { data, loading, refetch } = useNetWorth();
  const { history: netWorthHistory, loading: historyLoading } = useNetWorthHistory();

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patrimônio Líquido</h1>
          <p className="text-muted-foreground">Visão consolidada do seu patrimônio</p>
        </div>
        <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Card Principal - Patrimônio Líquido */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Patrimônio Líquido Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-64" />
          ) : data ? (
            <>
              <div className="text-5xl font-bold">
                {data.netWorth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              {data.monthlyChange !== 0 && (
                <div className={`flex items-center gap-2 mt-4 text-sm ${data.monthlyChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {data.monthlyChange >= 0 ? '+' : ''}
                    {data.monthlyChange.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-muted-foreground">no último mês</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Atualizado em {new Date(data.calculatedAt).toLocaleString('pt-BR')}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Erro ao carregar dados</p>
          )}
        </CardContent>
      </Card>

      {/* Evolution Chart */}
      <NetWorthChart data={netWorthHistory} loading={historyLoading} />

      {/* Breakdown do Patrimônio */}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos (Contas)</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {data.breakdown.cash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <Progress
                  value={(data.breakdown.cash / (data.breakdown.cash + data.breakdown.debts)) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((data.breakdown.cash / (data.breakdown.cash + data.breakdown.debts)) * 100).toFixed(1)}% do patrimônio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dívidas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {data.breakdown.debts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <Progress
                  value={(data.breakdown.debts / (data.breakdown.cash + data.breakdown.debts)) * 100}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((data.breakdown.debts / (data.breakdown.cash + data.breakdown.debts)) * 100).toFixed(1)}% do patrimônio
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análise */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Patrimonial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Composição</h3>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Ativos (Contas):</span>
                    <span className="font-medium text-success">+{data.breakdown.cash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Dívidas:</span>
                    <span className="font-medium text-destructive">-{data.breakdown.debts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </p>
                  <div className="border-t pt-2 mt-2">
                    <p className="flex justify-between font-bold">
                      <span>Patrimônio Líquido:</span>
                      <span className={data.netWorth >= 0 ? 'text-success' : 'text-destructive'}>
                        {data.netWorth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {data.breakdown.debts > 0 && (
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                  <h3 className="font-semibold text-destructive mb-2">⚠️ Atenção às Dívidas</h3>
                  <p className="text-sm text-muted-foreground">
                    Você possui {data.breakdown.debts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em dívidas.
                    Considere priorizar o pagamento para aumentar seu patrimônio líquido.
                  </p>
                </div>
              )}

              {data.netWorth > 0 && data.breakdown.debts === 0 && (
                <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                  <h3 className="font-semibold text-success mb-2">✅ Parabéns!</h3>
                  <p className="text-sm text-muted-foreground">
                    Você está livre de dívidas e possui um patrimônio líquido positivo. Continue assim!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>

  );
}
