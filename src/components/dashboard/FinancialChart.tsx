import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

// Mock data for demonstration
const mockChartData = {
  months: ["Out", "Nov", "Dez", "Jan"],
  income: [4500, 5200, 4800, 5000],
  expenses: [3200, 3800, 4100, 3600],
  savings: [1300, 1400, 700, 1400]
};

export function FinancialChart() {
  const maxValue = Math.max(...mockChartData.income, ...mockChartData.expenses);
  
  const calculatePercentage = (value: number) => (value / maxValue) * 100;
  
  const totalIncome = mockChartData.income[mockChartData.income.length - 1];
  const totalExpenses = mockChartData.expenses[mockChartData.expenses.length - 1];
  const netBalance = totalIncome - totalExpenses;
  const previousNet = mockChartData.income[mockChartData.income.length - 2] - mockChartData.expenses[mockChartData.expenses.length - 2];
  const trend = ((netBalance - previousNet) / previousNet) * 100;

  return (
    <Card className="financial-card col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="text-lg font-semibold">Visão Financeira</CardTitle>
          <p className="text-sm text-muted-foreground">Últimos 4 meses</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={trend > 0 ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart Bars */}
          <div className="flex items-end justify-between gap-4 h-48">
            {mockChartData.months.map((month, index) => (
              <div key={month} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex flex-col justify-end h-40 w-full gap-1">
                  {/* Income Bar */}
                  <div 
                    className="bg-success rounded-t-md min-h-[4px] w-full transition-all duration-1000 hover:opacity-80 relative group"
                    style={{ 
                      height: `${calculatePercentage(mockChartData.income[index])}%` 
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-success text-success-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      R$ {mockChartData.income[index].toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  {/* Expenses Bar */}
                  <div 
                    className="bg-expense rounded-b-md min-h-[4px] w-full transition-all duration-1000 hover:opacity-80 relative group"
                    style={{ 
                      height: `${calculatePercentage(mockChartData.expenses[index])}%` 
                    }}
                  >
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-expense text-expense-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      R$ {mockChartData.expenses[index].toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <span className="text-xs font-medium text-muted-foreground">
                  {month}
                </span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm text-muted-foreground">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-expense rounded-full"></div>
              <span className="text-sm text-muted-foreground">Despesas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-muted-foreground">Economia</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}