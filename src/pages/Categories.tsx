import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Lock } from "lucide-react";
import { useCategories } from "@/hooks/useSupabaseData";
import { useFamily } from "@/hooks/useFamily";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLimits } from "@/hooks/useLimits";

interface Category {
  id: string;
  nome: string;
  tipo: string;
  cor: string | null;
  icone: string | null;
  parent_id: string | null;
  subcategories?: Category[];
  keywords: string[] | null;
}

export default function Categories() {
  const { currentGroup } = useFamily();
  const { categories: flatCategories, loading, refetchCategories } = useCategories(currentGroup?.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const { plan } = useLimits();

  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const isCategoryLimitReached = plan === 'gratuito' && flatCategories.length >= 10;

  // Organizar categorias hierarquicamente sempre que flatCategories mudar
  useEffect(() => {
    const parentCategories = flatCategories.filter(cat => !cat.parent_id);
    const childCategories = flatCategories.filter(cat => cat.parent_id);

    const organizedCategories: Category[] = parentCategories.map(parent => ({
      ...parent,
      cor: parent.cor || null,
      subcategories: childCategories.filter(child => child.parent_id === parent.id).map(child => ({
        ...child,
        cor: child.cor || null,
        keywords: child.keywords || []
      })),
      keywords: parent.keywords || []
    }));

    setCategories(organizedCategories);
  }, [flatCategories]);

  const handleDelete = async (category: Category) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive",
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  const renderCategory = (category: Category, isSubcategory = false) => (
    <div key={category.id} className={`${isSubcategory ? 'ml-6' : ''}`}>
      <div className="flex flex-col p-4 bg-card border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isSubcategory && category.subcategories && category.subcategories.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategory(category.id)}
                className="p-1 h-6 w-6"
              >
                {expandedCategories.has(category.id) ?
                  <ChevronDown className="h-4 w-4" /> :
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            ) : <div className="w-6 h-6 p-1"></div>}

            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.cor || '#6366f1' }}
            />

            <div>
              <h3 className="font-medium">{category.nome}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={category.tipo === 'receita' ? 'default' : 'secondary'}>
                  {category.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </Badge>
                {category.subcategories && category.subcategories.length > 0 && (
                  <Badge variant="outline">
                    {category.subcategories.length} subcategoria{category.subcategories.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingCategory(category);
                setFormOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a categoria "{category.nome}"?
                    {category.subcategories && category.subcategories.length > 0 &&
                      ` Isso também excluirá ${category.subcategories.length} subcategoria(s).`
                    }
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(category)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {category.keywords && category.keywords.length > 0 && (
          <div className="w-full flex flex-wrap gap-1 mt-2 pl-10">
            {category.keywords.map(keyword => (
              <Badge key={keyword} variant="outline" className="font-normal">{keyword}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Subcategorias */}
      {!isSubcategory && expandedCategories.has(category.id) && category.subcategories && (
        <div className="mt-2 space-y-2">
          {category.subcategories.map(sub => renderCategory(sub, true))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Categorias</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentGroup ? `Visualizando: ${currentGroup.name}` : 'Suas categorias pessoais'}
          </p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCategory(null)}>
              {isCategoryLimitReached ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>

            {!editingCategory && isCategoryLimitReached ? (
              <div className="space-y-4 py-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex gap-3">
                  <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-400">Limite de Categorias Atingido</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      O plano Gratuito permite apenas 10 categorias. Faça upgrade para criar categorias ilimitadas.
                    </p>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <a href="/planos">Ver Planos Premium</a>
                </Button>
              </div>
            ) : (
              <CategoryForm
                category={editingCategory}
                parentCategories={getParentCategories()}
                onSuccess={() => {
                  setFormOpen(false);
                  setEditingCategory(null);
                  refetchCategories(); // Atualiza a lista após salvar
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {['despesa', 'receita'].map((tipo) => (
            <Card key={tipo}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${tipo === 'receita' ? 'bg-success' : 'bg-expense'}`} />
                  {tipo === 'receita' ? 'Receitas' : 'Despesas'}
                  <Badge variant="outline">
                    {categories.filter(cat => cat.tipo === tipo && !cat.parent_id).length} categorias
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories
                    .filter(cat => cat.tipo === tipo && !cat.parent_id)
                    .map(category => renderCategory(category))}

                  {categories.filter(cat => cat.tipo === tipo).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma categoria de {tipo} encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
