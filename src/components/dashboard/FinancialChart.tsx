import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
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

export function FinancialChart({ groupId }: { groupId?: string }) {
  const { user } = useAuth();
  const { stats } = useFinancialStats(groupId);
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

        // Buscar TODAS as despesas que têm categoria (incluindo subcategorias)
        let query = supabase
          .from('transactions')
          .select(`
            valor,
            categoria_id,
            categories(id, nome, cor, parent_id)
          `)
          .eq('tipo', 'despesa')
          .not('categoria_id', 'is', null)
          .gte('data_transacao', firstDayOfMonth.toISOString().split('T')[0])
          .lte('data_transacao', lastDayOfMonth.toISOString().split('T')[0]);

        if (groupId) {
          query = query.eq('group_id', groupId);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data: expenses, error } = await query;

        if (error) throw error;

        // Buscar todas as categorias para fazer lookup da categoria pai
        const { data: allCategories } = await supabase
          .from('categories')
          .select('id, nome, cor, parent_id')
          .eq('user_id', user.id);

        const categoryLookup = new Map(allCategories?.map(c => [c.id, c]) || []);

        // Agrupar por categoria PRINCIPAL (pai)
        const categoryMap = new Map<string, { total: number; color: string; id: string }>();

        expenses?.forEach((expense: any) => {
          if (!expense.categories) return;

          let category = expense.categories;
          const valor = Math.abs(Number(expense.valor));

          // Se é uma subcategoria, buscar a categoria pai
          if (category.parent_id) {
            const parentCategory = categoryLookup.get(category.parent_id);
            if (parentCategory) {
              category = parentCategory;
            }
          }

          const categoryName = category.nome;
          const color = category.cor || '#6366f1';

          if (categoryMap.has(categoryName)) {
            categoryMap.get(categoryName)!.total += valor;
          } else {
            categoryMap.set(categoryName, { total: valor, color, id: category.id });
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

    // Configurar realtime subscription para atualizar automaticamente
    const channel = supabase
      .channel(`category-expenses-${groupId || 'personal'}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          // Verificar se a mudança é relevante para este usuário/grupo
          const record = payload.new as any || payload.old as any;
          if (record && record.user_id === user.id) {
            // Refetch quando houver mudanças
            fetchCategoryExpenses();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId]);

  const totalCategoryExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.total, 0);
  const calculatePercentage = (value: number) => totalCategoryExpenses > 0 ? (value / totalCategoryExpenses) * 100 : 0;

  if (loading) {
    return (
      <Card className="financial-card">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="financial-card">
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
                {categoryExpenses.map((category) => (
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