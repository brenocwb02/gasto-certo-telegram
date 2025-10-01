import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TagInput } from "@/components/ui/TagInput"; // Importar o novo componente

const categorySchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(["receita", "despesa"]),
  parent_id: z.string().optional().nullable(),
  cor: z.string().min(1, "Cor é obrigatória"),
  icone: z.string().min(1, "Ícone é obrigatório"),
  keywords: z.array(z.string()).optional(), // Tipo alterado para array de strings
});

interface CategoryFormProps {
  category?: any;
  parentCategories?: any[];
  onSuccess?: () => void;
}

export function CategoryForm({ category, parentCategories = [], onSuccess }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nome: category?.nome || "",
      tipo: category?.tipo || "despesa",
      parent_id: category?.parent_id || null,
      cor: category?.cor || "#6366f1",
      icone: category?.icone || "shopping-bag",
      // Converter de string separada por vírgulas (antigo) ou array (novo) para array
      keywords: Array.isArray(category?.keywords) ? category.keywords : [],
    },
  });

  const watchedType = form.watch("tipo");

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      // O TagInput já retorna um array de strings limpas e em lowercase
      const keywordsArray = values.keywords?.filter(Boolean) || [];

      const categoryData = {
        nome: values.nome,
        tipo: values.tipo,
        parent_id: values.parent_id || null,
        cor: values.cor,
        icone: values.icone,
        user_id: user.id,
        keywords: keywordsArray, // Já é um array
      };

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", category.id);

        if (error) throw error;

        toast({
          title: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from("categories")
          .insert([categoryData]);

        if (error) throw error;

        toast({
          title: "Categoria criada",
          description: "A nova categoria foi criada com sucesso.",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a categoria. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredParentCategories = parentCategories.filter(pCat => pCat.tipo === watchedType);

  const iconOptions = [
    "shopping-bag", "home", "car", "utensils", "heart", "gamepad-2", 
    "banknote", "laptop", "trending-up", "coffee", "shirt", "gas-pump",
    "plane", "book", "music", "camera", "phone", "graduation-cap"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Alimentação, Transporte..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {filteredParentCategories.length > 0 && (
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Pai (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma (Categoria principal)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredParentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="icone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ícone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ícone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input type="color" className="w-16 h-10 p-1" {...field} />
                  <Input 
                    placeholder="#6366f1" 
                    {...field} 
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Palavras-chave</FormLabel>
              <FormControl>
                <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Adicione palavras-chave (ex: mercado, ifood)"
                />
              </FormControl>
              <FormDescription>
                Palavras para ajudar o bot a categorizar automaticamente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : category ? "Atualizar Categoria" : "Criar Categoria"}
        </Button>
      </form>
    </Form>
  );
}
