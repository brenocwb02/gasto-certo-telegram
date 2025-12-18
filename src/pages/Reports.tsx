import { useEffect, useState, useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight, PiggyBank, AlertTriangle, ChevronRight, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTransactions, useCategories } from "@/hooks/useSupabaseData";
import { getCategoryColor, FALLBACK_COLORS } from "@/lib/categoryColors";
import { exportTransactionsToCSV, exportDREToCSV, exportToPDF } from "@/lib/exportUtils";

import { useFamily } from "@/hooks/useFamily";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="bg-popover border text-popover-foreground rounded-lg p-3 shadow-xl max-w-[250px] z-50">
        <p className="font-bold text-sm mb-1">{data.name}</p>
        <p className="text-lg font-bold text-primary mb-2">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}
        </p>

        {data.subcategories && data.subcategories.length > 0 && (
          <div className="space-y-1 border-t pt-2 mt-1">
            <p className="text-xs text-muted-foreground font-semibold mb-1 uppercase tracking-wider">Detalhamento</p>
            {data.subcategories.map((sub: any, index: number) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground truncate mr-2 flex-1">{sub.name}</span>
                <span className="font-medium whitespace-nowrap">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { currentGroup } = useFamily();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedCategory, setSelectedCategory] = useState<{
    name: string;
    value: number;
    subcategories: Array<{ name: string; value: number }>;
    color: string;
  } | null>(null);
  const { transactions, loading } = useTransactions(currentGroup?.id);
  const { categories } = useCategories(currentGroup?.id);

  useEffect(() => {
    document.title = "Relatórios | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Relatórios e análises financeiras detalhadas do Boas Contas: gráficos, tendências e insights dos seus gastos.");
    }
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/reports");
  }, []);

  const formatCurrency = (value: number | undefined | null) => {
    const safeValue = value || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safeValue);
  };

  // Filter transactions by period
  const getFilteredTransactions = () => {
    if (!transactions) return [];

    const now = new Date();
    let startDate;

    switch (selectedPeriod) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return transactions.filter(t => new Date(t.data_transacao) >= startDate);
  };

  // Calculate data for trends (monthly or daily)
  const getMonthlyData = () => {
    const filteredTransactions = getFilteredTransactions();
    const dataMap = new Map<string, { receitas: number; despesas: number; date: string }>();

    // Determine start and end dates based on selection
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let granularity: 'day' | 'month' = 'month';

    if (selectedPeriod === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      granularity = 'day';
    } else if (selectedPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      granularity = 'day';
    } else if (selectedPeriod === 'quarter') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Last 3 months including current
      granularity = 'month';
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      granularity = 'month';
    }



    // Simplified: Just fill from startDate to now (or end of period)
    const loopDate = new Date(startDate);
    const finalDate = selectedPeriod === 'year' ? new Date(now.getFullYear(), 11, 31) : now;

    while (loopDate <= finalDate) {
      let key = '';
      if (granularity === 'day') {
        key = loopDate.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        key = `${loopDate.getFullYear()}-${String(loopDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }

      dataMap.set(key, { receitas: 0, despesas: 0, date: key });

      if (granularity === 'day') loopDate.setDate(loopDate.getDate() + 1);
      else loopDate.setMonth(loopDate.getMonth() + 1);
    }

    // Fill with actual data
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.data_transacao);
      let key = '';

      if (granularity === 'day') {
        key = date.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (dataMap.has(key)) {
        const entry = dataMap.get(key)!;
        if (transaction.tipo === 'receita') {
          entry.receitas += parseFloat(transaction.valor.toString());
        } else if (transaction.tipo === 'despesa') {
          entry.despesas += parseFloat(transaction.valor.toString());
        }
      }
    });

    return Array.from(dataMap.values());
  };

  // Calculate category data for pie chart with subcategory breakdown
  const getCategoryData = (): Array<{
    name: string;
    value: number;
    subcategories: Array<{ name: string; value: number }>;
  }> => {
    const filteredTransactions = getFilteredTransactions();

    // Mapear categorias pai
    const parentCategoryMap = new Map<string, {
      parentId: string | null;
      parentName: string;
      total: number;
      subcategories: Map<string, number>;
    }>();

    filteredTransactions.forEach(transaction => {
      if (transaction.tipo !== 'despesa') return;

      const category = categories.find(c => c.id === transaction.categoria_id);
      if (!category) {
        // Sem categoria
        if (!parentCategoryMap.has('sem-categoria')) {
          parentCategoryMap.set('sem-categoria', {
            parentId: null,
            parentName: 'Sem categoria',
            total: 0,
            subcategories: new Map()
          });
        }
        const entry = parentCategoryMap.get('sem-categoria')!;
        entry.total += parseFloat(transaction.valor.toString());
        return;
      }

      // Se é subcategoria, buscar categoria pai
      const parentCategory = category.parent_id
        ? categories.find(c => c.id === category.parent_id)
        : category;

      const parentId = parentCategory?.id || category.id;
      const parentName = parentCategory?.nome || category.nome;
      const subcatName = category.parent_id ? category.nome : null;

      if (!parentCategoryMap.has(parentId)) {
        parentCategoryMap.set(parentId, {
          parentId,
          parentName,
          total: 0,
          subcategories: new Map()
        });
      }

      const entry = parentCategoryMap.get(parentId)!;
      const valor = parseFloat(transaction.valor.toString());
      entry.total += valor;

      if (subcatName) {
        entry.subcategories.set(
          subcatName,
          (entry.subcategories.get(subcatName) || 0) + valor
        );
      }
    });

    // Converter para array e ordenar por valor
    return Array.from(parentCategoryMap.values())
      .map(entry => ({
        name: entry.parentName,
        value: entry.total,
        subcategories: Array.from(entry.subcategories.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Memoizar cálculos pesados para evitar re-renderizações desnecessárias
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const now = new Date();
    let startDate;
    switch (selectedPeriod) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return transactions.filter(t => new Date(t.data_transacao) >= startDate);
  }, [transactions, selectedPeriod]);

  const categoryData = useMemo(() => getCategoryData(), [filteredTransactions, categories]);
  const totalCategoryExpenses = useMemo(() => categoryData.reduce((acc, item) => acc + item.value, 0), [categoryData]);

  // Calculate summary statistics with comparison to previous period
  const getSummaryStats = () => {
    const filteredTransactions = getFilteredTransactions();

    const receitas = filteredTransactions
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);

    const despesas = filteredTransactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);

    const saldo = receitas - despesas;
    const totalTransactions = filteredTransactions.length;

    // Calculate savings rate
    const taxaPoupanca = receitas > 0 ? ((saldo / receitas) * 100) : 0;

    // Get previous period for comparison
    const now = new Date();
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (selectedPeriod === 'month') {
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (selectedPeriod === 'quarter') {
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      prevEndDate = new Date(now.getFullYear(), now.getMonth() - 3, 0);
    } else {
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
    }

    const prevTransactions = transactions?.filter(t => {
      const date = new Date(t.data_transacao);
      return date >= prevStartDate && date <= prevEndDate;
    }) || [];

    const prevReceitas = prevTransactions
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);

    const prevDespesas = prevTransactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);

    // Calculate variations
    const variacaoReceitas = prevReceitas > 0 ? ((receitas - prevReceitas) / prevReceitas * 100) : 0;
    const variacaoDespesas = prevDespesas > 0 ? ((despesas - prevDespesas) / prevDespesas * 100) : 0;
    const prevSaldo = prevReceitas - prevDespesas;
    const variacaoSaldo = prevSaldo !== 0 ? ((saldo - prevSaldo) / Math.abs(prevSaldo) * 100) : 0;

    return {
      receitas,
      despesas,
      saldo,
      totalTransactions,
      taxaPoupanca,
      variacaoReceitas,
      variacaoDespesas,
      variacaoSaldo,
      prevReceitas,
      prevDespesas
    };
  };

  const monthlyData = useMemo(() => getMonthlyData(), [filteredTransactions, selectedPeriod]);
  const summaryStats = useMemo(() => getSummaryStats(), [filteredTransactions]);

  // Usa paleta semântica para cores baseadas no nome da categoria
  const getColorForCategory = (categoryName: string, index: number): string => {
    return getCategoryColor(categoryName, index);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e insights das suas finanças</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Últimos 3 meses</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const transactionsForExport = filteredTransactions.map(t => ({
                  data_transacao: t.data_transacao,
                  descricao: t.descricao || '',
                  categoria: categories.find(c => c.id === t.categoria_id)?.nome || 'Sem categoria',
                  valor: Number(t.valor),
                  tipo: t.tipo as 'receita' | 'despesa'
                }));
                exportTransactionsToCSV(transactionsForExport, 'transacoes');
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Transações (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const periodLabel = selectedPeriod === 'week' ? 'Última Semana' :
                  selectedPeriod === 'month' ? 'Este Mês' :
                    selectedPeriod === 'quarter' ? 'Últimos 3 Meses' : 'Este Ano';
                exportDREToCSV({
                  periodo: periodLabel,
                  totalReceitas: summaryStats.receitas,
                  totalDespesas: summaryStats.despesas,
                  saldo: summaryStats.saldo,
                  taxaPoupanca: summaryStats.taxaPoupanca,
                  categorias: categoryData.map(c => ({
                    nome: c.name,
                    valor: c.value,
                    percentual: totalCategoryExpenses > 0 ? (c.value / totalCategoryExpenses * 100) : 0
                  }))
                });
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar DRE (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const periodLabel = selectedPeriod === 'week' ? 'Última Semana' :
                  selectedPeriod === 'month' ? 'Este Mês' :
                    selectedPeriod === 'quarter' ? 'Últimos 3 Meses' : 'Este Ano';
                exportToPDF({
                  periodo: periodLabel,
                  totalReceitas: summaryStats.receitas,
                  totalDespesas: summaryStats.despesas,
                  saldo: summaryStats.saldo,
                  taxaPoupanca: summaryStats.taxaPoupanca,
                  categorias: categoryData.map(c => ({
                    nome: c.name,
                    valor: c.value,
                    percentual: totalCategoryExpenses > 0 ? (c.value / totalCategoryExpenses * 100) : 0
                  }))
                });
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar Relatório (PDF)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryStats.receitas)}
            </div>
            {summaryStats.prevReceitas > 0 && (
              <div className={`flex items-center text-xs mt-1 ${summaryStats.variacaoReceitas >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {summaryStats.variacaoReceitas >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(summaryStats.variacaoReceitas).toFixed(1)}% vs período anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryStats.despesas)}
            </div>
            {summaryStats.prevDespesas > 0 && (
              <div className={`flex items-center text-xs mt-1 ${summaryStats.variacaoDespesas <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {summaryStats.variacaoDespesas >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(summaryStats.variacaoDespesas).toFixed(1)}% vs período anterior
                {summaryStats.variacaoDespesas > 10 && <AlertTriangle className="h-3 w-3 ml-1 text-orange-500" />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryStats.saldo)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Receitas - Despesas
            </div>
          </CardContent>
        </Card>

        <Card className={summaryStats.taxaPoupanca >= 20 ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : summaryStats.taxaPoupanca < 0 ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <PiggyBank className={`h-4 w-4 ${summaryStats.taxaPoupanca >= 20 ? 'text-green-600' : summaryStats.taxaPoupanca < 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.taxaPoupanca >= 20 ? 'text-green-600' : summaryStats.taxaPoupanca < 0 ? 'text-red-500' : 'text-foreground'}`}>
              {summaryStats.taxaPoupanca.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {summaryStats.taxaPoupanca >= 20 ? '✅ Meta atingida (≥20%)' : summaryStats.taxaPoupanca >= 10 ? '🟡 Quase lá (meta: 20%)' : summaryStats.taxaPoupanca >= 0 ? '⚠️ Abaixo da meta' : '🔴 Gastando mais que ganha'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalTransactions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              no período selecionado
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Simplificado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            DRE Simplificado
          </CardTitle>
          <CardDescription>Demonstrativo de Resultado do Período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-green-600">RECEITAS TOTAIS</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(summaryStats.receitas)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-red-500">
              <span className="font-medium">(-) Despesas Totais</span>
              <span className="font-bold text-lg">{formatCurrency(summaryStats.despesas)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-3">
              <span className="font-bold text-lg">= RESULTADO DO PERÍODO</span>
              <span className={`font-bold text-2xl ${summaryStats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summaryStats.saldo)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Taxa de Poupança</div>
                <div className={`text-xl font-bold ${summaryStats.taxaPoupanca >= 20 ? 'text-green-600' : summaryStats.taxaPoupanca >= 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {summaryStats.taxaPoupanca.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Meta Recomendada</div>
                <div className="text-xl font-bold text-muted-foreground">20%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Tendência Mensal</CardTitle>
              <CardDescription>Receitas e despesas ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value + 'T00:00:00');
                      if (value.length > 7) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                    }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Receitas"
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Despesas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição dos gastos por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColorForCategory(entry.name, index)} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {categoryData.slice(0, 5).map((category, index) => (
                    <div
                      key={index}
                      className={`space-y-2 p-2 -mx-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${selectedCategory?.name === category.name ? 'bg-muted ring-2 ring-primary/20' : ''}`}
                      onClick={() => setSelectedCategory({
                        ...category,
                        color: getColorForCategory(category.name, index)
                      })}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: getColorForCategory(category.name, index) }} />
                          <span className="font-medium text-foreground">{category.name}</span>
                          {category.subcategories.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {category.subcategories.length} subcategorias
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{formatCurrency(category.value)}</span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {totalCategoryExpenses > 0 ? ((category.value / totalCategoryExpenses) * 100).toFixed(1) : 0}%
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${totalCategoryExpenses > 0 ? (category.value / totalCategoryExpenses * 100) : 0}%`,
                            backgroundColor: getColorForCategory(category.name, index)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {categoryData.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      E mais {categoryData.length - 5} categorias menores...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subcategory Drill-Down */}
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <Card className="md:col-span-2 border-2" style={{ borderColor: selectedCategory.color + '40' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Subcategorias de {selectedCategory.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedCategory.subcategories.length} subcategorias • Total: {formatCurrency(selectedCategory.value)}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mini Pie Chart for subcategories */}
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={selectedCategory.subcategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {selectedCategory.subcategories.map((_entry, index) => (
                            <Cell
                              key={`subcell-${index}`}
                              fill={`${selectedCategory.color}${Math.max(40, 100 - index * 20).toString(16)}`}
                              strokeWidth={0}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Subcategory list */}
                  <div className="space-y-3">
                    {selectedCategory.subcategories.map((subcat, index) => {
                      const percentage = selectedCategory.value > 0
                        ? (subcat.value / selectedCategory.value * 100)
                        : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{subcat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{formatCurrency(subcat.value)}</span>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: `${selectedCategory.color}${Math.max(60, 100 - index * 15).toString(16)}`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message when category has no subcategories */}
          {selectedCategory && selectedCategory.subcategories.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="py-8 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: selectedCategory.color }} />
                  <p className="font-medium">{selectedCategory.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Esta categoria não possui subcategorias cadastradas.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="mt-2">
                    <X className="h-4 w-4 mr-1" /> Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Comparison Bar Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Comparativo Mensal</CardTitle>
              <CardDescription>Receitas vs Despesas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value + 'T00:00:00');
                      if (value.length > 7) return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                    }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="receitas" fill="#22c55e" name="Receitas" />
                  <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && monthlyData.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground">
              Não há transações no período selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
export default Reports;
