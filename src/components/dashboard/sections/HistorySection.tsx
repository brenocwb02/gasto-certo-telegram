import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

interface HistorySectionProps {
  groupId?: string;
  limit?: number;
}

export function HistorySection({ groupId, limit = 8 }: HistorySectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Histórico
        </h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <a href="/transactions">
            Ver todas <ChevronRight className="h-3 w-3 ml-0.5" />
          </a>
        </Button>
      </div>
      <RecentTransactions limit={limit} groupId={groupId} />
    </section>
  );
}
