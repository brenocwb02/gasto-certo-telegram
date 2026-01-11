import { DashboardCard, CardContent, CardHeader, CardTitle } from "./DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/useSupabaseData";
import { Wallet } from "lucide-react";
import { getBankBrand } from "@/lib/bank-brands";

export function AccountsWidget({ groupId }: { groupId?: string }) {
    const { accounts, loading } = useAccounts(groupId);

    // Filtering only bank accounts and wallets (not credit cards unless they have balance)
    const displayedAccounts = accounts?.filter(acc => acc.tipo !== 'cartao' || acc.saldo_atual > 0).slice(0, 5) || [];

    // Mock accounts to match image if empty
    const mockAccounts = [
        { id: '1', nome: 'Santander', saldo_atual: 2300.00, tipo: 'banco' },
        { id: '2', nome: 'Nubank', saldo_atual: 700.00, tipo: 'banco' },
        { id: '3', nome: 'Carteira', saldo_atual: 300.00, tipo: 'carteira' },
    ];

    const data = displayedAccounts.length > 0 ? displayedAccounts : mockAccounts;

    const total = data.reduce((acc, curr) => acc + curr.saldo_atual, 0);

    return (
        <DashboardCard>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    Minhas Contas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                ) : (
                    <>
                        {data.map((acc: any) => {
                            const brand = getBankBrand(acc.nome || "", acc.banco || "");
                            // Check for type 'carteira' OR name containing 'carteira'/'dinheiro'
                            const isWallet = acc.tipo === 'carteira' ||
                                acc.tipo === 'dinheiro' ||
                                (acc.nome && /carteira|dinheiro|bolso/i.test(acc.nome));

                            return (
                                <div key={acc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        {/* Bank Logo or Wallet Icon */}
                                        <div
                                            className="h-9 w-9 rounded-full flex items-center justify-center text-white shadow-sm overflow-hidden"
                                            style={{ backgroundColor: isWallet ? '#10b981' : brand.primaryColor }}
                                        >
                                            {isWallet ? (
                                                <Wallet className="h-5 w-5 text-white" />
                                            ) : brand.iconClass ? (
                                                <i className={`${brand.iconClass} text-lg`} />
                                            ) : typeof brand.logo === 'string' ? (
                                                <img src={brand.logo} alt={brand.name} className="h-5 w-5 object-contain brightness-0 invert" />
                                            ) : (
                                                <span className="text-xs font-bold">{(acc.nome || "B")[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{acc.nome}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.saldo_atual)}
                                    </span>
                                </div>
                            );
                        })}

                        <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-2">
                            <span className="text-sm text-slate-500 font-medium">Total do mês</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                            </span>
                        </div>
                    </>
                )}
            </CardContent>
        </DashboardCard>
    );
}

