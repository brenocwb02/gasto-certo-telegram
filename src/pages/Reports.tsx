import { useEffect, useState, useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight, PiggyBank, AlertTriangle, ChevronRight, ChevronLeft, X, Download, FileSpreadsheet, FileText, Users } from "lucide-react";
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
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";

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
  const { currentGroup, members } = useFamily();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

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
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return transactions.filter(t => {
            // Fix timezone issues by comparing timestamps or using date-fns isWithinInterval
            const tDate = new Date(t.data_transacao);
            return isWithinInterval(tDate, {
              start: dateRange.from!,
              end: dateRange.to!
            });
          });
        }
        return transactions;
      default:
        startDate = new Date(now.getFullYear(), 0, 1); // fallback year
    }

    // Logic for standard periods
    if (selectedPeriod !== 'custom' && startDate) {
      return transactions.filter((t) => {
        const tDate = new Date(t.data_transacao);
        return tDate >= startDate;
      });
    }

    return transactions;
  };

  // Sync dateRange when period changes (optional DX improvement)
  useEffect(() => {
    const now = new Date();
    if (selectedPeriod === 'month') {
      setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
    } else if (selectedPeriod === 'last_month') {
      const lastMonth = subMonths(now, 1);
      setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
    }
  }, [selectedPeriod]);


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

  // Calcula gastos por membro da família
  const getMemberSpendingData = useMemo(() => {
    if (!members || members.length === 0) return [];

    const memberSpending = new Map<string, { name: string; value: number; avatar?: string }>();

    // Inicializa todos os membros ativos
    members.filter(m => m.status === 'active').forEach(member => {
      memberSpending.set(member.member_id, {
        name: member.profile?.nome || 'Membro',
        value: 0,
        avatar: member.profile?.avatar_url
      });
    });

    // Soma despesas por user_id
    filteredTransactions
      .filter(t => t.tipo === 'despesa')
      .forEach(t => {
        const userId = (t as any).user_id;
        if (userId && memberSpending.has(userId)) {
          const member = memberSpending.get(userId)!;
          member.value += parseFloat(t.valor.toString());
        }
      });

    // Converte para array e ordena por valor
    return Array.from(memberSpending.values())
      .filter(m => m.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, members]);

  const totalMemberExpenses = useMemo(() =>
    getMemberSpendingData.reduce((acc, m) => acc + m.value, 0),
    [getMemberSpendingData]
  );

  // Cores para membros
  const memberColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1'];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e insights das suas finanças</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          {selectedPeriod === 'custom' && (
            <div className="animate-in fade-in slide-in-from-right-2 w-full sm:w-auto">
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
                className="w-full sm:w-[260px]"
              />
            </div>
          )}

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="quarter">Últimos 3 Meses</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="custom">📅 Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => {
            const csv = exportTransactionsToCSV(getFilteredTransactions());
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_${selectedPeriod}.csv`;
            link.click();
          }} title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
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
      </div >

      {/* DRE Simplificado */}
      < Card >
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
      </Card >

      {
        loading ? (
          <div className="grid gap-6 md:grid-cols-2" >
            {
              [1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            }
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

            {/* Category Distribution (Main View) */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Despesas por Categoria
                </CardTitle>
                <CardDescription>
                  Clique em uma categoria para ver detalhes e subcategorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* 1. CHART SECTION */}
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
                          className="cursor-pointer outline-none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getColorForCategory(entry.name, index)}
                              strokeWidth={selectedCategory?.name === entry.name ? 2 : 0}
                              stroke={selectedCategory?.name === entry.name ? "var(--foreground)" : "none"}
                              className="transition-all duration-300 hover:opacity-80 active:scale-95"
                              onClick={() => setSelectedCategory({
                                ...entry,
                                subcategories: entry.subcategories || [],
                                color: getColorForCategory(entry.name, index)
                              } as any)}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 2. LIST SECTION */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {categoryData.slice(0, 5).map((item, index) => {
                      const percent = totalCategoryExpenses > 0 ? (item.value / totalCategoryExpenses) * 100 : 0;
                      const color = getColorForCategory(item.name, index);
                      const isSelected = selectedCategory?.name === item.name;

                      return (
                        <div
                          key={index}
                          className={`space-y-2 p-2 -mx-2 rounded-lg transition-all hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-muted/50 ring-1 ring-ring' : ''}`}
                          onClick={() => setSelectedCategory({
                            ...item,
                            subcategories: item.subcategories || [],
                            color: color
                          } as any)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                              <span className="font-medium text-foreground truncate max-w-[120px]" title={item.name}>
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{formatCurrency(item.value)}</span>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {percent.toFixed(1)}%
                              </span>
                              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${percent}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {categoryData.length === 0 && (
                      <div className="h-[200px] flex flex-col items-center justify-center text-center p-4">
                        <div className="bg-muted p-3 rounded-full mb-3">
                          <DollarSign className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Nenhuma despesa encontrada</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Não há registros para o período selecionado.
                        </p>
                      </div>
                    )}

                    {categoryData.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        E mais {categoryData.length - 5} categorias menores...
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subcategory Drill-Down (Duplicate Panel Restored) */}
            {selectedCategory && (
              <Card className="md:col-span-2 animate-in fade-in slide-in-from-top-4 border-l-4" style={{ borderLeftColor: selectedCategory.color }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <span style={{ color: selectedCategory.color }}>{selectedCategory.name}</span>
                    </CardTitle>
                    <CardDescription>Detalhamento de gastos nesta categoria</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                    <X className="h-4 w-4 mr-2" /> Fechar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                      selectedCategory.subcategories.map((sub, idx) => (
                        <div key={idx} className="flex flex-col p-3 border rounded-lg bg-card/50 hover:bg-muted/30 transition-colors">
                          <span className="text-sm text-muted-foreground truncate" title={sub.name}>{sub.name}</span>
                          <span className="text-lg font-bold mt-1">{formatCurrency(sub.value)}</span>
                          <div className="w-full bg-secondary h-1 mt-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-foreground/70"
                              style={{ width: `${(sub.value / selectedCategory.value) * 100}%`, backgroundColor: selectedCategory.color }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border-dashed border-2">
                        <p>Nenhuma subcategoria registrada para este grupo de despesas.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gastos por Membro da Família */}
            {getMemberSpendingData.length > 0 && members.length > 1 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Gastos por Membro da Família
                  </CardTitle>
                  <CardDescription>
                    Distribuição de despesas entre os membros do grupo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getMemberSpendingData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                          >
                            {getMemberSpendingData.map((_entry, index) => (
                              <Cell key={`member-${index}`} fill={memberColors[index % memberColors.length]} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      {getMemberSpendingData.map((member, index) => {
                        const percentage = totalMemberExpenses > 0
                          ? (member.value / totalMemberExpenses * 100)
                          : 0;
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                  style={{ backgroundColor: memberColors[index % memberColors.length] }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground">{member.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{formatCurrency(member.value)}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: memberColors[index % memberColors.length]
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-2 border-t mt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-muted-foreground">Total do Grupo</span>
                          <span className="font-bold text-lg">{formatCurrency(totalMemberExpenses)}</span>
                        </div>
                      </div>
                    </div>
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

      {
        !loading && monthlyData.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground">
                Não há transações no período selecionado.
              </p>
            </CardContent>
          </Card>
        )
      }
    </>
  );
};
export default Reports;
