import { Building2, CreditCard, Wallet, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  nome: string;
  tipo: string;
  saldo_atual: number;
  banco?: string | null;
  cor?: string | null;
  limite_credito?: number | null;
  parent_account_id?: string | null;
}

interface MoneyLocationSectionProps {
  accounts: Account[];
  loading: boolean;
  groupId?: string;
  onUpdate?: () => void;
}

export function MoneyLocationSection({
  accounts,
  loading,
  groupId,
  onUpdate,
}: MoneyLocationSectionProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Separate regular accounts from credit cards
  const regularAccounts = accounts.filter(
    (a) => a.tipo !== "cartao" && a.tipo !== "cartao_credito"
  );
  const creditCards = accounts.filter(
    (a) => (a.tipo === "cartao" || a.tipo === "cartao_credito") && !a.parent_account_id
  );

  // Filter credit cards with activity
  const activeCreditCards = creditCards.filter((card) => {
    const hasBalance = Math.abs(card.saldo_atual) > 0;
    const hasLimit = card.limite_credito && card.limite_credito > 0;
    return hasBalance || hasLimit;
  });

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Onde Está Meu Dinheiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Onde Está Meu Dinheiro
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Bank Accounts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Minhas Contas
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <a href="/accounts">
                Ver todas <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {regularAccounts.length === 0 ? (
              <EmptyStateCard
                icon={<Wallet className="h-5 w-5" />}
                title="Sem contas"
                description="Cadastre suas contas bancárias"
                actionLabel="Adicionar"
                actionHref="/accounts"
                variant="compact"
              />
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {regularAccounts.slice(0, 5).map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: acc.cor || "hsl(var(--primary))" }}
                      />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px]">{acc.nome}</p>
                        {acc.banco && (
                          <p className="text-xs text-muted-foreground">{acc.banco}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        acc.saldo_atual >= 0 ? "text-foreground" : "text-destructive"
                      )}
                    >
                      {formatCurrency(acc.saldo_atual)}
                    </span>
                  </div>
                ))}
                {regularAccounts.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{regularAccounts.length - 5} contas
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Credit Cards */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Cartões de Crédito
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
              <a href="/accounts">
                Gerenciar <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {activeCreditCards.length === 0 ? (
              <EmptyStateCard
                icon={<CreditCard className="h-5 w-5" />}
                title="Sem cartões ativos"
                description="Cadastre um cartão de crédito"
                actionLabel="Adicionar"
                actionHref="/accounts"
                variant="compact"
              />
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {activeCreditCards.slice(0, 3).map((card) => (
                  <CreditCardWidget
                    key={card.id}
                    account={card}
                    compact={true}
                    groupId={groupId}
                    allAccounts={accounts}
                    onUpdate={onUpdate}
                  />
                ))}
                {activeCreditCards.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{activeCreditCards.length - 3} cartões
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
