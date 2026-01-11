import { DashboardCard, CardContent, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";
import { Plus, Wallet, Building, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { NavLink } from "react-router-dom";

interface AccountsGridProps {
    groupId?: string;
}

export function AccountsGrid({ groupId }: AccountsGridProps) {
    const { accounts, loading } = useAccounts(groupId);

    // Filtrar apenas contas ativas e ordenar por saldo (maior primeiro)
    const activeAccounts = accounts
        ?.filter(a => a.ativo)
        .sort((a, b) => Number(b.saldo_atual) - Number(a.saldo_atual))
        .slice(0, 6) || [];

    const getIcon = (type: string) => {
        switch (type) {
            case 'corrente': return Building;
            case 'investimento': return Wallet;
            case 'cartao_credito': return CreditCard;
            default: return Wallet;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'corrente': return "text-blue-500 bg-blue-500/10";
            case 'investimento': return "text-purple-500 bg-purple-500/10";
            case 'cartao_credito': return "text-orange-500 bg-orange-500/10";
            default: return "text-emerald-500 bg-emerald-500/10";
        }
    };

    if (loading) {
        return (
            <DashboardCard className="h-full bg-card/50 backdrop-blur-sm border-muted/40">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </CardContent>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard className="h-full bg-card/40 backdrop-blur-xl border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Minhas Contas</CardTitle>
                <NavLink to="/accounts">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </NavLink>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeAccounts.map((account) => {
                        const Icon = getIcon(account.tipo);
                        const colorClass = getColor(account.tipo);

                        return (
                            <div
                                key={account.id}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 hover:bg-black/30 transition-all cursor-pointer"
                            >
                                <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 group-hover:scale-110 transition-transform`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground truncate">
                                        {account.nome}
                                    </p>
                                    <p className={`text-sm font-bold truncate ${Number(account.saldo_atual) < 0 ? 'text-rose-500' : 'text-foreground'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(account.saldo_atual))}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Botão de Adicionar Fantasma se tiver poucas contas */}
                    {activeAccounts.length < 3 && (
                        <NavLink to="/accounts">
                            <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-muted-foreground hover:text-primary transition-all cursor-pointer h-full">
                                <Plus className="h-4 w-4" />
                                <span className="text-sm font-medium">Nova Conta</span>
                            </div>
                        </NavLink>
                    )}
                </div>
            </CardContent>
        </DashboardCard>
    );
}
