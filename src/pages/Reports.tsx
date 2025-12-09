import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { useTransactions, useCategories } from "@/hooks/useSupabaseData";

import { useFamily } from "@/hooks/useFamily";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  // Calculate monthly data for trends
  const getMonthlyData = (): Array<{ receitas: number; despesas: number; month: string }> => {
    const monthlyData: Record<string, { receitas: number; despesas: number; month: string }> = {};
    const filteredTransactions = getFilteredTransactions();

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.data_transacao);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { receitas: 0, despesas: 0, month: monthKey };
      }

      if (transaction.tipo === 'receita') {
        monthlyData[monthKey].receitas += parseFloat(transaction.valor.toString());
      } else if (transaction.tipo === 'despesa') {
        monthlyData[monthKey].despesas += parseFloat(transaction.valor.toString());
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
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

  // Calculate summary statistics
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

    return { receitas, despesas, saldo, totalTransactions };
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();
  const summaryStats = getSummaryStats();

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
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
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summaryStats.receitas)}
                </div>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summaryStats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summaryStats.saldo)}
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
              </CardContent>
            </Card>
          </div>

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
              <Card>
                <CardHeader>
                  <CardTitle>Tendência Mensal</CardTitle>
                  <CardDescription>Receitas e despesas ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
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
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription>Distribuição dos gastos por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

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
                      <XAxis dataKey="month" />
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
        </main>
      </div>
    </div>
  );
};
export default Reports;
