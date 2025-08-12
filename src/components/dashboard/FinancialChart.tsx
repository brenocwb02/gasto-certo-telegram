import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { useFinancialStats } from "@/hooks/useSupabaseData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CategoryExpense {
  category_name: string;
  total: number;
  color: string;
  subcategories?: Array<{
    name: string;
    total: number;
  }>;
}

export function FinancialChart() {
  const { user } = useAuth();
  const { stats } = useFinancialStats();
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCategoryExpenses = async () => {
      try {
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // Buscar despesas por categoria principal
        const { data: expenses, error } = await supabase
          .from('transactions')
          .select(`
            valor,
            categories!inner(id, nome, cor, parent_id)
          `)
          .eq('user_id', user.id)
          .eq('tipo', 'despesa')
          .gte('data_transacao', firstDayOfMonth.toISOString().split('T')[0])
          .lte('data_transacao', lastDayOfMonth.toISOString().split('T')[0])
          .is('categories.parent_id', null);

        if (error) throw error;

        // Agrupar por categoria
        const categoryMap = new Map<string, { total: number; color: string; id: string }>();
        
        expenses?.forEach((expense: any) => {
          const categoryId = expense.categories.id;
          const categoryName = expense.categories.nome;
          const color = expense.categories.cor;
          const valor = Number(expense.valor);

          if (categoryMap.has(categoryName)) {
            categoryMap.get(categoryName)!.total += valor;
          } else {
            categoryMap.set(categoryName, { total: valor, color, id: categoryId });
          }
        });

        // Converter para array e ordenar
        const categoryArray: CategoryExpense[] = Array.from(categoryMap.entries())
          .map(([name, data]) => ({
            category_name: name,
            total: data.total,
            color: data.color
          }))
          .sort((a, b) => b.total - a.total);

        setCategoryExpenses(categoryArray);
      } catch (error) {
        console.error('Erro ao buscar despesas por categoria:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryExpenses();
  }, [user]);

  const totalCategoryExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.total, 0);
  const calculatePercentage = (value: number) => totalCategoryExpenses > 0 ? (value / totalCategoryExpenses) * 100 : 0;

  if (loading) {
    return (
      <Card className="financial-card col-span-2">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="financial-card col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Despesas por Categoria
          </CardTitle>
          <p className="text-sm text-muted-foreground">Mês atual</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">Total</p>
          <p className="text-lg font-bold text-expense">
            R$ {totalCategoryExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa encontrada este mês
            </p>
          ) : (
            <>
              {/* Category Chart */}
              <div className="space-y-3">
                {categoryExpenses.map((category, index) => (
                  <div 
                    key={category.category_name}
                    className="flex items-center gap-3 cursor-pointer hover:bg-card-hover p-2 rounded-lg transition-colors"
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.category_name ? null : category.category_name
                    )}
                  >
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category.category_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {calculatePercentage(category.total).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${calculatePercentage(category.total)}%`,
                            backgroundColor: category.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-lg font-semibold text-success">
                    R$ {stats.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-lg font-semibold text-expense">
                    R$ {stats.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-lg font-semibold ${stats.monthlySavings >= 0 ? 'text-success' : 'text-expense'}`}>
                    R$ {stats.monthlySavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}