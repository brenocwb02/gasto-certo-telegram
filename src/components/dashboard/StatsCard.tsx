import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
  trend?: number;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  className,
  trend 
}: StatsCardProps) {
  return (
    <div className={cn("financial-card group", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "text-sm font-medium flex items-center gap-1",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-expense",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
          "bg-primary/10 text-primary"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tendência</span>
            <div className="flex items-center gap-1">
              <div className={cn(
                "h-2 w-12 rounded-full overflow-hidden bg-muted"
              )}>
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 rounded-full",
                    trend > 0 ? "bg-success" : "bg-expense"
                  )}
                  style={{ width: `${Math.abs(trend)}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-success" : "text-expense"
              )}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}