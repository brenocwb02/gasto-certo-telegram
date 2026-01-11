import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";

export function CreditCardOverview() {
    // Mock data based on reference image
    const cardData = {
        name: "Santander",
        lastDigits: "8888",
        limitUsed: 888.00,
        limitTotal: 8988.00,
        percentage: 10
    };

    return (
        <DashboardCard className="p-5 h-[160px] flex flex-col justify-between group hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-lg">
                        S
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{cardData.name}</h3>
                        <p className="text-xs text-slate-500">Santander</p>
                    </div>
                </div>
                <div className="flex items-center text-slate-900 dark:text-slate-100 font-semibold text-sm">
                    R$ {cardData.limitTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <ChevronRight className="h-4 w-4 ml-1 text-slate-400" />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <div className="text-xs text-slate-500">
                        Limite Usado
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            R$ {cardData.limitUsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-rose-500">{cardData.percentage}%</span>
                        <span className="text-xs text-slate-400 ml-1">Disponível</span>
                        {/* Na imagem parece que 90% é o disponivel, invertendo logica pra bater visualmente */}
                        <p className="text-xs text-slate-400">R$ {(cardData.limitTotal - cardData.limitUsed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <Progress value={cardData.percentage} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-emerald-500" />
            </div>
        </DashboardCard>
    );
}
