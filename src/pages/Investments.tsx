import { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestments } from '@/hooks/useInvestments';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InvestmentForm } from '@/components/forms/InvestmentForm';

export default function Investments() {
  const { investments, transactions, loading, getTotalValue, getTotalProfit, refetch } = useInvestments();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const totalValue = getTotalValue();
  const totalProfit = getTotalProfit();
  const profitPercentage = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Investimentos</h1>
            <p className="text-muted-foreground">Gerencie sua carteira de investimentos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Operação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Operação</DialogTitle>
                </DialogHeader>
                <InvestmentForm onSuccess={() => setShowAddDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investments.length} {investments.length === 1 ? 'ativo' : 'ativos'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro/Prejuízo</CardTitle>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operações</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{transactions.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total de transações</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Investimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Carteira</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum investimento cadastrado ainda.</p>
                <p className="text-sm mt-2">Clique em "Nova Operação" para começar!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço Médio</TableHead>
                    <TableHead className="text-right">Preço Atual</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Rentabilidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((inv) => {
                    const quantity = inv.quantity || 0;
                    const avgPrice = inv.average_price || 0;
                    const currentPrice = inv.current_price || avgPrice;
                    const totalValue = quantity * currentPrice;
                    const profit = totalValue - (quantity * avgPrice);
                    const profitPercent = avgPrice > 0 ? (profit / (quantity * avgPrice)) * 100 : 0;

                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.ticker}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{inv.asset_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{quantity.toFixed(0)}</TableCell>
                        <TableCell className="text-right">
                          {avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-right">
                          {currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={profit >= 0 ? 'text-success' : 'text-destructive'}>
                            {profit >= 0 ? '+' : ''}
                            {profitPercent.toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Operações</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma transação registrada ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{tx.ticker}</TableCell>
                      <TableCell>
                        <Badge variant={tx.transaction_type === 'compra' ? 'default' : tx.transaction_type === 'venda' ? 'secondary' : 'outline'}>
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{tx.quantity || '-'}</TableCell>
                      <TableCell className="text-right">
                        {tx.price ? tx.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
