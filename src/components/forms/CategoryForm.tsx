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
  groupId?: string;
}

export function CategoryForm({ category, parentCategories = [], onSuccess, groupId }: CategoryFormProps) {
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
        group_id: groupId || null,
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

      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar a categoria.";
      // Tratamento específico para erro de duplicidade (Supabase retorna código 23505 geralmente, ou mensagem específica)

      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredParentCategories = parentCategories
    .filter(pCat => pCat.tipo === watchedType)
    .filter(pCat => !category || pCat.id !== category.id);

  // Mapeamento de ícones com emoji e descrição em português
  const iconOptions: { value: string; emoji: string; label: string }[] = [
    // Alimentação
    { value: 'shopping-cart', emoji: '🛒', label: 'Alimentação' },
    { value: 'utensils', emoji: '🍴', label: 'Restaurante' },
    { value: 'coffee', emoji: '☕', label: 'Café/Lanche' },
    { value: 'pizza', emoji: '🍕', label: 'Fast Food' },
    // Transporte
    { value: 'car', emoji: '🚗', label: 'Transporte' },
    { value: 'fuel', emoji: '⛽', label: 'Combustível' },
    { value: 'bus', emoji: '🚌', label: 'Ônibus' },
    { value: 'plane', emoji: '✈️', label: 'Viagem' },
    // Moradia
    { value: 'home', emoji: '🏠', label: 'Moradia' },
    { value: 'lamp', emoji: '💡', label: 'Luz/Energia' },
    { value: 'wrench', emoji: '🔧', label: 'Manutenção' },
    { value: 'couch', emoji: '🛋️', label: 'Móveis' },
    // Finanças
    { value: 'banknote', emoji: '💵', label: 'Salário' },
    { value: 'trending-up', emoji: '📈', label: 'Investimentos' },
    { value: 'credit-card', emoji: '💳', label: 'Cartão' },
    { value: 'piggy-bank', emoji: '🐷', label: 'Poupança' },
    // Despesas Fixas
    { value: 'receipt', emoji: '🧾', label: 'Contas/Despesas Fixas' },
    { value: 'landmark', emoji: '🏛️', label: 'Impostos/Taxas' },
    // Saúde
    { value: 'heart', emoji: '❤️', label: 'Saúde' },
    { value: 'pill', emoji: '💊', label: 'Farmácia' },
    { value: 'activity', emoji: '🏃', label: 'Academia' },
    // Educação
    { value: 'graduation-cap', emoji: '🎓', label: 'Educação' },
    { value: 'book', emoji: '📚', label: 'Livros/Cursos' },
    // Trabalho
    { value: 'laptop', emoji: '💻', label: 'Trabalho/Freelance' },
    { value: 'briefcase', emoji: '💼', label: 'Negócios' },
    { value: 'tie', emoji: '👔', label: 'Despesas Pessoais' },
    // Lazer
    { value: 'gamepad-2', emoji: '🎮', label: 'Lazer/Jogos' },
    { value: 'party-popper', emoji: '🎉', label: 'Entretenimento' },
    { value: 'music', emoji: '🎵', label: 'Música' },
    { value: 'film', emoji: '🎬', label: 'Cinema/Streaming' },
    // Família
    { value: 'users', emoji: '👥', label: 'Família' },
    { value: 'baby', emoji: '👶', label: 'Filhos' },
    // Vida Espiritual
    { value: 'hands', emoji: '🛐', label: 'Vida Espiritual' },
    { value: 'church', emoji: '⛪', label: 'Igreja/Dízimo' },
    // Relacionamentos
    { value: 'gift', emoji: '🎁', label: 'Presentes' },
    { value: 'cake', emoji: '🎂', label: 'Festas' },
    // Metas e Projetos
    { value: 'target', emoji: '🎯', label: 'Metas' },
    { value: 'rocket', emoji: '🚀', label: 'Projetos' },
    // Reserva
    { value: 'shield', emoji: '🛡️', label: 'Reserva/Prevenção' },
    { value: 'tool', emoji: '🛠️', label: 'Reparos' },
    // Vestuário
    { value: 'shirt', emoji: '👕', label: 'Roupas' },
    // Outros
    { value: 'phone', emoji: '📱', label: 'Telefone' },
    { value: 'shopping-bag', emoji: '🛍️', label: 'Compras' },
    { value: 'star', emoji: '⭐', label: 'Outros' },
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
              <Select onValueChange={field.onChange} value={field.value}>
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
          render={({ field }) => {
            const selectedIcon = iconOptions.find(i => i.value === field.value);
            return (
              <FormItem>
                <FormLabel>Ícone</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ícone">
                        {selectedIcon ? (
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{selectedIcon.emoji}</span>
                            <span>{selectedIcon.label}</span>
                          </span>
                        ) : "Selecione um ícone"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{icon.emoji}</span>
                          <span>{icon.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
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
