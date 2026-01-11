import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DashboardCard, CardHeader, CardTitle, CardContent } from "@/components/dashboard/DashboardCard";
import { ArrowRightLeft } from "lucide-react";

const data = [
    { name: 'Sem 1', receitas: 4000, despesas: 2400 },
    { name: 'Sem 2', receitas: 3000, despesas: 1398 },
    { name: 'Sem 3', receitas: 2000, despesas: 9800 },
    { name: 'Sem 4', receitas: 2780, despesas: 3908 },
];

export const CashFlowChart = () => {
    return (
        <DashboardCard className="h-full shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-slate-500" />
                        Fluxo de Caixa
                    </CardTitle>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Últimos 30 dias</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748B' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} name="Receitas" />
                            <Bar dataKey="despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={30} name="Despesas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </DashboardCard>
    );
};
