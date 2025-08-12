import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
  parent_id: string | null;
  subcategories?: Category[];
}

export default function Categories() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;

      // Organizar categorias hierarquicamente
      const parentCategories = (data || []).filter(cat => !cat.parent_id);
      const childCategories = (data || []).filter(cat => cat.parent_id);

      const organizedCategories = parentCategories.map(parent => ({
        ...parent,
        subcategories: childCategories.filter(child => child.parent_id === parent.id)
      }));

      setCategories(organizedCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });

      fetchCategories();
      setDeletingCategory(null);
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

  const getParentCategories = (tipo: string) => {
    return categories.filter(cat => cat.tipo === tipo && !cat.parent_id);
  };

  const renderCategory = (category: Category, isSubcategory = false) => (
    <div key={category.id} className={`${isSubcategory ? 'ml-6' : ''}`}>
      <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-3">
          {!isSubcategory && category.subcategories && category.subcategories.length > 0 && (
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
          )}
          
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: category.cor }}
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

      {/* Subcategorias */}
      {!isSubcategory && expandedCategories.has(category.id) && category.subcategories && (
        <div className="mt-2 space-y-2">
          {category.subcategories.map(sub => renderCategory(sub, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Categorias</h1>
                <p className="text-muted-foreground">
                  Gerencie suas categorias e subcategorias de transações
                </p>
              </div>

              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCategory(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </DialogTitle>
                  </DialogHeader>
                  <CategoryForm
                    category={editingCategory}
                    parentCategories={getParentCategories(editingCategory?.tipo || 'despesa')}
                    onSuccess={() => {
                      setFormOpen(false);
                      setEditingCategory(null);
                      fetchCategories();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando categorias...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {['receita', 'despesa'].map((tipo) => (
                  <Card key={tipo}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${tipo === 'receita' ? 'bg-success' : 'bg-expense'}`} />
                        {tipo === 'receita' ? 'Receitas' : 'Despesas'}
                        <Badge variant="outline">
                          {categories.filter(cat => cat.tipo === tipo).length} categorias
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categories
                          .filter(cat => cat.tipo === tipo)
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
          </div>
        </main>
      </div>
    </div>
  );
}