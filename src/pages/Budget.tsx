import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Budget = Database["public"]["Tables"]["budgets"]["Row"] & {
  categories: { name: string } | null;
  spent: number;
};

export default function BudgetPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // This hook now uses the RPC function to get spent amount
  const { data: budgets, isLoading } = useSupabaseData<Budget>(
    "get_budgets_with_spent"
  );

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBudget(null);
    setDialogOpen(true);
  };

  const handleDelete = async (budgetId: number) => {
    const { error } = await supabase.from("budgets").delete().match({ id: budgetId });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Orçamento deletado." });
      queryClient.invalidateQueries({ queryKey: ["budgets", user?.id] });
      // Also invalidate the RPC function data
      queryClient.invalidateQueries({ queryKey: ["get_budgets_with_spent", user?.id] });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedBudget ? "Editar" : "Novo"} Orçamento</DialogTitle>
            </DialogHeader>
            <BudgetForm
              budget={selectedBudget}
              onSave={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Carregando orçamentos...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets?.map((budget) => {
            const spent = budget.spent || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - spent;
            return (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{budget.categories?.name}</CardTitle>
                      <CardDescription>
                        {formatCurrency(spent)} de {formatCurrency(budget.amount)}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá deletar permanentemente o seu orçamento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(budget.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={percentage} className="mb-2" />
                  <p className={`text-sm ${remaining < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {remaining >= 0 ? `${formatCurrency(remaining)} restantes` : `${formatCurrency(Math.abs(remaining))} acima`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
       { !isLoading && budgets?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum orçamento encontrado.</p>
            <p className="text-gray-400 mt-2">Crie seu primeiro orçamento para começar a organizar suas finanças.</p>
          </div>
        )}
    </div>
  );
}
