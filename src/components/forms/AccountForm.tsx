import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { banks } from "@/lib/bank-brands";

const accountSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(["dinheiro", "corrente", "poupanca", "investimento", "cartao"]),
  banco: z.string().optional(),
  saldo_inicial: z.string().min(1, "Saldo inicial é obrigatório"),
  limite_credito: z.string().optional(),
  dia_fechamento: z.string().optional(),
  dia_vencimento: z.string().optional(),
  cor: z.string().min(1, "Cor é obrigatória"),
  parent_account_id: z.string().optional(),
  visibility: z.enum(["family", "personal"]),
});

interface AccountFormProps {
  account?: any;
  onSuccess?: () => void;
  groupId?: string;
}

export function AccountForm({ account, onSuccess, groupId }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [parentCards, setParentCards] = useState<any[]>([]);
  const [showCustomBankInput, setShowCustomBankInput] = useState(false);
  const [customBankName, setCustomBankName] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      nome: account?.nome || "",
      tipo: account?.tipo || "corrente",
      banco: account?.banco || "",
      saldo_inicial: account?.saldo_inicial?.toString() || "0",
      limite_credito: account?.limite_credito?.toString() || "",
      dia_fechamento: account?.dia_fechamento?.toString() || "",
      dia_vencimento: account?.dia_vencimento?.toString() || "",
      cor: account?.cor || "#10b981",
      parent_account_id: account?.parent_account_id || undefined,
      visibility: account?.visibility || "family",
    },
  });

  const accountType = form.watch("tipo");

  // Fetch potential parent cards (only if current type is card)
  useEffect(() => {
    if (accountType === 'cartao' && user) {
      const fetchParentCards = async () => {
        let query = supabase
          .from('accounts')
          .select('id, nome')
          .eq('tipo', 'cartao')
          .is('parent_account_id', null) // Only main cards can be parents
          .neq('id', account?.id || ''); // Exclude self

        // Se tiver groupId, busca cartões do grupo, senão busca do usuário
        if (groupId) {
          query = query.eq('group_id', groupId);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data } = await query;
        if (data) setParentCards(data);
      };
      fetchParentCards();
    }
  }, [accountType, user, account, groupId]);

  const onSubmit = async (values: z.infer<typeof accountSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      // Validar limite de contas pessoais (apenas na criação)
      if (!account && values.visibility === 'personal') {
        const { data: canCreate, error: limitError } = await supabase
          .rpc('check_personal_account_limit', { p_user_id: user.id });

        if (limitError) {
          console.error('Erro ao verificar limites:', limitError);
          // Permite prosseguir em caso de erro no RPC para não bloquear user (fail open)
        } else if (canCreate === false) {
          toast({
            title: "Limite Atingido",
            description: "Membros do plano família podem ter no máximo 2 contas pessoais.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const saldoInicial = parseFloat(values.saldo_inicial);

      const accountData = {
        nome: values.nome,
        tipo: values.tipo,
        banco: values.banco || null,
        saldo_inicial: saldoInicial,
        saldo_atual: account ? account.saldo_atual : saldoInicial,
        limite_credito: values.limite_credito ? parseFloat(values.limite_credito) : null,
        dia_fechamento: values.dia_fechamento ? parseInt(values.dia_fechamento) : null,
        dia_vencimento: values.dia_vencimento ? parseInt(values.dia_vencimento) : null,
        cor: values.cor,
        parent_account_id: values.parent_account_id || null,
        visibility: values.visibility,
        user_id: user.id,
        group_id: groupId || null,
        ativo: true,
      };

      if (account) {
        // Update existing account
        const { error } = await supabase
          .from("accounts")
          .update(accountData)
          .eq("id", account.id);

        if (error) throw error;

        toast({
          title: "Conta atualizada",
          description: "A conta foi atualizada com sucesso.",
        });
      } else {
        // Create new account
        const { error } = await supabase
          .from("accounts")
          .insert([accountData]);

        if (error) throw error;

        toast({
          title: "Conta criada",
          description: "A nova conta foi criada com sucesso.",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Conta</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Carteira, Conta Corrente..." {...field} />
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
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quem vê transações desta conta?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="family">
                    🏠 Família (todos do grupo veem)
                  </SelectItem>
                  <SelectItem value="personal">
                    👤 Só eu (privado)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Transações nesta conta herdam esta visibilidade automaticamente.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {accountType === "cartao" && parentCards.length > 0 && (
          <FormField
            control={form.control}
            name="parent_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cartão Principal (Vincular Fatura)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cartão pai (Opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="undefined">Nenhum (Cartão Principal)</SelectItem>
                    {parentCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione apenas se este for um cartão adicional/dependente.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="banco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              {!showCustomBankInput ? (
                <>
                  <Select
                    onValueChange={(value) => {
                      if (value === "__outro__") {
                        setShowCustomBankInput(true);
                        field.onChange("");
                      } else if (value === "__none__") {
                        field.onChange("");
                      } else {
                        field.onChange(value);
                      }
                    }}
                    defaultValue={field.value || "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">Nenhum</span>
                      </SelectItem>
                      {banks.map((bank) => (
                        <SelectItem key={bank.name} value={bank.name}>
                          <span className="flex items-center gap-2">
                            {bank.iconClass ? (
                              <i className={`${bank.iconClass} text-base`} style={{ color: bank.primaryColor }} />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                style={{ backgroundColor: bank.primaryColor }}
                              >
                                {bank.name[0]}
                              </span>
                            )}
                            <span>{bank.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="__outro__">
                        <span className="flex items-center gap-2 text-blue-600">
                          ✏️ <span>Outro (digitar nome)</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="Digite o nome do banco..."
                      value={customBankName}
                      onChange={(e) => {
                        setCustomBankName(e.target.value);
                        field.onChange(e.target.value);
                      }}
                      className="flex-1"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomBankInput(false);
                      setCustomBankName("");
                      field.onChange("");
                    }}
                  >
                    ← Voltar
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="saldo_inicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {accountType === "cartao" ? "Saldo Inicial (Fatura)" : "Saldo Inicial"}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {accountType === "cartao" && (
          <>
            <FormField
              control={form.control}
              name="limite_credito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite do Cartão</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dia_fechamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Fechamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dia_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Vencimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 15"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="cor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input type="color" className="w-16 h-10" {...field} />
                  <Input
                    placeholder="#10b981"
                    {...field}
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : account ? "Atualizar Conta" : "Criar Conta"}
        </Button>
      </form>
    </Form>
  );
}