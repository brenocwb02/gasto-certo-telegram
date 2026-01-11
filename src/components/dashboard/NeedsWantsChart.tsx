import { DashboardCard, CardContent, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Target } from "lucide-react";

const data = [
    { name: 'Necessidades', value: 65, color: '#3b82f6' }, // Blue-500
    { name: 'Desejos', value: 25, color: '#8b5cf6' }, // Violet-500
    { name: 'Investimentos', value: 10, color: '#10b981' }, // Emerald-500
];

export function NeedsWantsChart() {
    return (
        <DashboardCard className="col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Target className="h-5 w-5 text-blue-500" />
                    Necessidades vs Desejos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#0f172a' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </DashboardCard>
    );
}
