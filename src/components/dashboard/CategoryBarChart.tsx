import { DashboardCard, CardContent, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";
import { BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFinancialStats } from "@/hooks/useSupabaseData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryData {
    name: string;
    value: number;
    color: string;
}

export function CategoryBarChart({ groupId }: { groupId?: string }) {
    const { user } = useAuth();
    const [data, setData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const currentMonth = new Date();
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

                let query = supabase
                    .from('transactions')
                    .select(`
            valor,
            categoria_id,
            categories(id, nome, cor, parent_id)
          `)
                    .eq('tipo', 'despesa')
                    .not('categoria_id', 'is', null)
                    .gte('data_transacao', firstDay.toISOString().split('T')[0])
                    .lte('data_transacao', lastDay.toISOString().split('T')[0]);

                if (groupId) {
                    query = query.eq('group_id', groupId);
                } else {
                    query = query.eq('user_id', user.id);
                }

                const { data: expenses, error } = await query;
                if (error) throw error;

                // Processar dados... (mesma lógica do FinancialChart original, mas simplificada para Barras)
                // 1. Map de Categorias Pai
                const { data: allCategories } = await supabase
                    .from('categories')
                    .select('id, nome, cor, parent_id')
                    .eq('user_id', user.id);

                const categoryLookup = new Map(allCategories?.map(c => [c.id, c]) || []);
                const categoryMap = new Map<string, { total: number; color: string }>();

                expenses?.forEach((expense: any) => {
                    if (!expense.categories) return;
                    let cat = expense.categories;
                    const valor = Math.abs(Number(expense.valor));

                    // Resolver pai se for subcategoria
                    if (cat.parent_id) {
                        const parent = categoryLookup.get(cat.parent_id);
                        if (parent) cat = parent;
                    }

                    const name = cat.nome;
                    const color = cat.cor || '#6366f1';

                    const current = categoryMap.get(name) || { total: 0, color };
                    categoryMap.set(name, { total: current.total + valor, color });
                });

                const chartData = Array.from(categoryMap.entries())
                    .map(([name, val]) => ({
                        name,
                        value: val.total,
                        color: val.color
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 7); // Top 7 categorias para caber no gráfico

                setData(chartData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, groupId]);

    if (loading) {
        return (
            <DashboardCard className="h-full bg-card/50 backdrop-blur-sm border-muted/40">
                <CardContent className="flex items-center justify-center h-64">
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </DashboardCard>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold mb-1">{label}</p>
                    <p className="text-sm text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <DashboardCard className="h-full bg-card/40 backdrop-blur-xl border-white/5 flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-primary" />
                    Despesas por Categoria
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#ffffff" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                interval={0}
                                tickFormatter={(val) => val.length > 8 ? val.slice(0, 8) + '...' : val}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                tickFormatter={(val) => `R$${val / 1000}k`}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                        <BarChartIcon className="h-8 w-8 mb-2 opacity-20" />
                        Sem dados neste mês
                    </div>
                )}
            </CardContent>
        </DashboardCard>
    );
}
