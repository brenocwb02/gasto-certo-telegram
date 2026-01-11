import { useMemo } from "react";
import { DashboardCard, CardContent, CardHeader, CardTitle } from "./DashboardCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions, useCategories } from "@/hooks/useSupabaseData";
import { startOfMonth, endOfMonth } from "date-fns";

// Mapping categories to 50/30/20 types based on common names
const NEEDS_KEYWORDS = [
    'moradia', 'aluguel', 'condomínio', 'condominio', 'luz', 'água', 'agua', 'gás', 'gas',
    'internet', 'telefone', 'celular', 'transporte', 'combustível', 'combustivel', 'uber',
    'alimentação', 'alimentacao', 'supermercado', 'mercado', 'feira', 'saúde', 'saude',
    'farmácia', 'farmacia', 'médico', 'medico', 'hospital', 'educação', 'educacao',
    'escola', 'faculdade', 'curso', 'seguro', 'iptu', 'ipva', 'imposto', 'conta',
    'mensalidade', 'plano de saúde', 'plano de saude', 'casa'
];

const SAVINGS_KEYWORDS = [
    'investimento', 'poupança', 'poupanca', 'reserva', 'emergência', 'emergencia',
    'ações', 'acoes', 'tesouro', 'cdb', 'fundo', 'previdência', 'previdencia',
    'aposentadoria', 'cripto', 'bitcoin', 'economia'
];

// Everything else is considered "wants/desires"

type SpendingType = 'needs' | 'wants' | 'savings';

function classifyCategory(categoryName: string): SpendingType {
    const lowerName = categoryName.toLowerCase();

    if (SAVINGS_KEYWORDS.some(kw => lowerName.includes(kw))) {
        return 'savings';
    }
    if (NEEDS_KEYWORDS.some(kw => lowerName.includes(kw))) {
        return 'needs';
    }
    return 'wants';
}

interface Rule503020WidgetProps {
    groupId?: string;
}

export function Rule503020Widget({ groupId }: Rule503020WidgetProps) {
    const now = new Date();
    const monthStart = startOfMonth(now).toISOString().split('T')[0];
    const monthEnd = endOfMonth(now).toISOString().split('T')[0];

    // Removido useCategories não usado explicitamente se não fosse necessário para mapeamento, mas aqui é usado.
    const { transactions, loading: transLoading } = useTransactions(groupId);
    const { categories, loading: catLoading } = useCategories(groupId);

    const loading = transLoading || catLoading;

    // Calculate spending by type
    const { data, analysis } = useMemo(() => {
        if (!transactions || !categories) {
            return {
                data: [
                    { name: 'Necessidades', value: 50, color: '#3b82f6', target: 50 },
                    { name: 'Desejos', value: 30, color: '#8b5cf6', target: 30 },
                    { name: 'Investimentos', value: 20, color: '#10b981', target: 20 },
                ],
                analysis: { savings: 0 }
            };
        }

        // Build category map
        const categoryMap = new Map(categories.map(c => [c.id, c]));

        // Filter current month expenses
        const monthlyExpenses = transactions.filter(t => {
            const tDate = t.data_transacao;
            return t.tipo === 'despesa' && tDate >= monthStart && tDate <= monthEnd;
        });

        // Filter current month income
        const monthlyIncome = transactions.filter(t => {
            const tDate = t.data_transacao;
            return t.tipo === 'receita' && tDate >= monthStart && tDate <= monthEnd;
        }).reduce((sum, t) => sum + Number(t.valor), 0);

        // Classify and sum
        let needs = 0;
        let wants = 0;
        let savings = 0;

        monthlyExpenses.forEach(t => {
            const category = categoryMap.get(t.categoria_id || '');
            let searchString = category?.nome || 'Outros';

            // Append parent/subcategory name to ensure we catch keywords in either hierarchy
            if (category?.parent_id) {
                const parent = categoryMap.get(category.parent_id);
                if (parent) {
                    searchString += ' ' + parent.nome;
                }
            }

            const type = classifyCategory(searchString);
            const amount = Number(t.valor);

            if (type === 'needs') needs += amount;
            else if (type === 'savings') savings += amount;
            else wants += amount;
        });

        const total = needs + wants + savings;

        // Calculate percentages
        const base = monthlyIncome > 0 ? monthlyIncome : (total > 0 ? total : 1);

        const needsPercent = Math.round((needs / base) * 100);
        const wantsPercent = Math.round((wants / base) * 100);
        const savingsPercent = Math.round((savings / base) * 100);

        return {
            data: [
                { name: 'Necessidades', value: needsPercent, color: '#3b82f6', target: 50 },
                { name: 'Desejos', value: wantsPercent, color: '#8b5cf6', target: 30 },
                { name: 'Investimentos', value: savingsPercent, color: '#10b981', target: 20 },
            ],
            analysis: { savings: savingsPercent }
        };
    }, [transactions, categories, monthStart, monthEnd]);

    if (loading) {
        return (
            <DashboardCard className="animate-pulse h-[140px]">
                <CardHeader className="pb-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-20 bg-muted rounded-lg" />
                </CardContent>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard>
            <CardHeader className="py-3 px-4 pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <div className="p-1 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Target className="h-3.5 w-3.5" />
                        </div>
                        Regra 50/30/20
                    </CardTitle>
                    <div className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium",
                        analysis.savings >= 20
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                        <TrendingUp className="h-3 w-3" />
                        {analysis.savings >= 20 ? "Equilibrado" : "Atenção"}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex flex-row items-center gap-4">
                    {/* LEFTSIDE: Chart */}
                    <div className="h-[90px] w-[90px] shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={45}
                                    paddingAngle={2}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `${value}%`}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderRadius: '8px',
                                        border: '1px solid hsl(var(--border))',
                                        fontSize: '12px',
                                        padding: '4px 8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-foreground leading-none">
                                    {analysis.savings}%
                                </span>
                                <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Inv.</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHTSIDE: Compact Legend */}
                    <div className="flex-1 space-y-2">
                        {data.map((item, index) => {
                            const isOver = item.name === 'Investimentos'
                                ? item.value < item.target
                                : item.value > item.target;

                            return (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-medium truncate">{item.name}</span>
                                    </div>

                                    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(item.value, 100)}%`,
                                                backgroundColor: item.color
                                            }}
                                        />
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-black/20 dark:bg-white/20 z-10"
                                            style={{ left: `${item.target}%` }}
                                        />
                                    </div>

                                    <div className="w-8 text-right text-xs font-bold">
                                        <span className={cn(isOver ? "text-red-500" : "")}>{item.value}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </DashboardCard>
    );
}
