import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line
} from "recharts";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function CashFlowForecast({ groupId }: { groupId?: string }) {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [projection, setProjection] = useState({
        endBalance: 0,
        status: 'neutral' // 'positive' | 'negative' | 'neutral'
    });

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const lastDay = new Date(year, month + 1, 0).getDate();
                const today = now.getDate();

                // 1. Fetch transactions for current month
                let query = supabase
                    .from('transactions')
                    .select('data_transacao, valor, tipo')
                    .gte('data_transacao', new Date(year, month, 1).toISOString())
                    .lte('data_transacao', new Date(year, month + 1, 0).toISOString());

                if (groupId) {
                    query = query.eq('group_id', groupId);
                } else {
                    query = query.eq('user_id', user.id);
                }

                const { data: transactions } = await query;

                // 2. Process Data
                const chartData = [];
                let accumulatedBalance = 0;
                let totalExpenses = 0;
                let expensesCount = 0;

                // Create map of daily totals
                const dailyFlow = new Map();

                transactions?.forEach(t => {
                    const day = new Date(t.data_transacao + 'T12:00:00').getDate(); // Fix timezone offset
                    const val = Number(t.valor);

                    if (!dailyFlow.has(day)) dailyFlow.set(day, 0);

                    if (t.tipo === 'receita') {
                        dailyFlow.set(day, dailyFlow.get(day) + val);
                        accumulatedBalance += val; // Only for final balance calculation if starting from 0? 
                        // Actually usually we want *Cash Flow* (in/out) or *Balance*?
                        // "Previsão de Caixa" usually implies Balance. 
                        // But we don't know the starting balance of the month easily without previous history.
                        // Let's assume "Month Cash Flow" (Starting at 0).
                    } else {
                        dailyFlow.set(day, dailyFlow.get(day) - val);
                        accumulatedBalance -= val;
                        totalExpenses += val;
                        expensesCount++;
                    }
                });

                // Calculate Daily Avg Expense (only considers days passed)
                const avgDailyExpense = today > 0 ? (totalExpenses / today) : 0;

                // Build Line Data
                let currentDayBalance = 0;

                for (let i = 1; i <= lastDay; i++) {
                    const dayFlow = dailyFlow.get(i) || 0;

                    if (i <= today) {
                        // Historical
                        currentDayBalance += dayFlow;
                        chartData.push({
                            day: i,
                            actual: currentDayBalance,
                            projected: null, // Don't show projection line for past
                        });
                    } else {
                        // Projection
                        // We assume income stops (conservative) or avg income?
                        // Usually conservative: Expense continues, Income stops unless recurring.
                        // Let's subtract avgDailyExpense.

                        // Connect the line: The first projection point should start from last actual
                        const prevBalance = i === today + 1 ? currentDayBalance : chartData[i - 2].projected;
                        const projectedBalance = (prevBalance || 0) - avgDailyExpense;

                        chartData.push({
                            day: i,
                            actual: null,
                            projected: projectedBalance,
                        });
                    }
                }

                // Final Projection
                const finalVal = chartData[chartData.length - 1].projected || chartData[chartData.length - 1].actual;

                setData(chartData);
                setProjection({
                    endBalance: finalVal || 0,
                    status: (finalVal || 0) >= 0 ? 'positive' : 'negative'
                });

            } catch (error) {
                console.error('Error fetching cash flow:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, groupId]);

    if (loading) return null;

    return (
        <Card className="financial-card h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Fluxo de Caixa & Previsão Mensal
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Acompanhe seu saldo acumulado e a projeção até o fim do mês
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-muted-foreground mr-1">Projeção Final:</span>
                        <span className={`text-xl font-bold ${projection.status === 'positive' ? 'text-success' : 'text-expense'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projection.endBalance)}
                        </span>

                        <TooltipProvider>
                            <UITooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-xs">
                                        Baseado na sua média de gastos diária até agora. Considera que você continuará gastando o mesmo valor médio por dia e não terá novas receitas.
                                    </p>
                                </TooltipContent>
                            </UITooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[220px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(val) => `Dia ${val}`}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(val) => `R$ ${val / 1000}k`}
                        />
                        <Tooltip
                            formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                            labelFormatter={(label) => `Dia ${label}`}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            name="Realizado"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorActual)"
                            strokeWidth={3}
                        />
                        <Line
                            type="monotone"
                            dataKey="projected"
                            name="Projeção"
                            stroke="#f43f5e"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
