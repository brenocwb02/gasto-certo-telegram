import { AlertTriangle, TrendingUp, Bell, ChevronRight, FileText } from "lucide-react";
import { DashboardCard, CardHeader, CardTitle, CardContent } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";

interface ActionCenterWidgetProps {
    groupId?: string;
}

export const ActionCenterWidget = ({ groupId }: ActionCenterWidgetProps) => {
    // Mock Data based on reference
    const notifications = [
        {
            id: 1,
            title: "Contas a Pagar",
            description: "Fatura Cartão Santander - Breno",
            meta: "Vence em 15/01",
            icon: FileText,
            color: "text-violet-600",
            bg: "bg-violet-100 dark:bg-violet-900/20"
        },
        {
            id: 2,
            title: "Aviso de Alertas",
            description: "Meta alimentação em 85%",
            meta: "Revisar gastos",
            icon: Bell, // Usando Icone de User do exemplo
            color: "text-slate-600",
            bg: "bg-slate-100 dark:bg-slate-800"
        }
    ];

    return (
        <DashboardCard className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Atenção no Mês
                    <AlertTriangle className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                {notifications.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                        {/* Icon Box */}
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                            <item.icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                            <span className="text-[10px] text-slate-400 font-medium">{item.meta}</span>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                ))}

                <Button variant="ghost" className="w-full text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700 h-8">
                    Ver todos alertas
                </Button>
            </CardContent>
        </DashboardCard>
    );
};
