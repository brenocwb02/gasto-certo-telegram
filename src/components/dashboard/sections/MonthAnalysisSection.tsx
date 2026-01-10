import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CashFlowForecast } from "@/components/dashboard/CashFlowForecast";

interface MonthAnalysisSectionProps {
  groupId?: string;
}

export function MonthAnalysisSection({ groupId }: MonthAnalysisSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Análise do Mês
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FinancialChart groupId={groupId} />
        <CashFlowForecast groupId={groupId} />
      </div>
    </section>
  );
}
