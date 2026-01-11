import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MoreHorizontal, CalendarClock, CreditCard } from "lucide-react";
import { cn, parseLocalDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DashboardCard, CardContent } from "@/components/dashboard/DashboardCard";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionListProps {
    transactions: any[];
    loading: boolean;
    onEdit: (t: any) => void;
    onDelete: (t: any) => void;
    getCategoryName: (id: string | null) => string;
    getAccountName: (id: string | null) => string;
}

export function TransactionList({
    transactions,
    loading,
    onEdit,
    onDelete,
    getCategoryName,
    getAccountName
}: TransactionListProps) {

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Math.abs(amount));
    };

    const formatDate = (dateStr: string) => {
        const date = parseLocalDate(dateStr);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = new Date(today.setDate(today.getDate() - 1)).toDateString() === date.toDateString();

        if (isToday) return 'Hoje';
        if (isYesterday) return 'Ontem';

        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
        });
    };

    const formatTime = (dateStr: string) => {
        const date = parseLocalDate(dateStr);
        return date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    };

    const parseInstallment = (descricao: string): { current: number; total: number } | null => {
        const match = descricao.match(/\((\d+)\/(\d+)\)$/);
        if (match) {
            return { current: parseInt(match[1]), total: parseInt(match[2]) };
        }
        return null;
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "receita":
                return <div className="p-2.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"><ArrowDownLeft className="h-5 w-5" /></div>;
            case "despesa":
                return <div className="p-2.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"><ArrowUpRight className="h-5 w-5" /></div>;
            case "transferencia":
                return <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><ArrowRightLeft className="h-5 w-5" /></div>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="space-y-2 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/20 rounded-xl mt-4 border border-dashed text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                <p className="text-sm">Tente mudar o mês ou ajustar os filtros</p>
            </div>
        );
    }

    return (
        <DashboardCard className="border-none shadow-sm bg-card mt-4 overflow-hidden">
            <CardContent className="p-0">
                {/* Header Row (Optional, looks nice) */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-xs font-medium text-muted-foreground hidden md:grid">
                    <div className="col-span-5">Descrição</div>
                    <div className="col-span-2">Categoria</div>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-2 text-right">Valor</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-border/50">
                    {transactions.map((t) => {
                        const installmentInfo = parseInstallment(t.descricao || '');
                        const categoryName = getCategoryName(t.categoria_id);
                        const accountName = getAccountName(t.conta_origem_id);

                        return (
                            <div
                                key={t.id}
                                className="group flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 hover:bg-muted/30 transition-colors items-center relative cursor-pointer"
                                role="button"
                                onClick={() => onEdit(t)}
                            >
                                {/* 1. Icon & Description & Mobile Main */}
                                <div className="col-span-12 md:col-span-5 flex items-center gap-4 w-full">
                                    {getTransactionIcon(t.tipo)}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-foreground truncate text-base mb-1">
                                            {t.descricao}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-muted-foreground hidden md:inline-block">
                                                {accountName}
                                            </span>
                                            <Badge variant="secondary" className="md:hidden text-[10px] h-5 px-1.5 font-normal">
                                                {categoryName}
                                            </Badge>
                                            {/* Mobile Account Name */}
                                            <span className="md:hidden text-[10px] text-muted-foreground border-l pl-2">
                                                {accountName}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Mobile Value (Right aligned) */}
                                    <div className="md:hidden text-right">
                                        <p className={cn(
                                            "font-semibold text-base",
                                            t.tipo === 'receita' && "text-green-600",
                                            t.tipo === 'despesa' && "text-red-600",
                                            t.tipo === 'transferencia' && "text-blue-600"
                                        )}>
                                            {t.tipo === 'despesa' ? '-' : '+'}
                                            {formatAmount(Number(t.valor))}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDate(t.data_transacao)}</p>
                                    </div>
                                </div>

                                {/* 2. Category (Desktop) */}
                                <div className="col-span-2 hidden md:flex items-center">
                                    <Badge variant="secondary" className="font-normal bg-muted/50 hover:bg-muted text-muted-foreground">
                                        {categoryName}
                                    </Badge>
                                </div>

                                {/* 3. Date (Desktop) */}
                                <div className="col-span-2 hidden md:flex flex-col text-sm text-muted-foreground">
                                    <span>{formatDate(t.data_transacao)}</span>
                                    <span className="text-xs opacity-70">{formatTime(t.data_transacao)}</span>
                                </div>

                                {/* 4. Value (Desktop) */}
                                <div className="col-span-2 hidden md:flex justify-end">
                                    <p className={cn(
                                        "font-bold text-base",
                                        t.tipo === 'receita' && "text-green-600 dark:text-green-400",
                                        t.tipo === 'despesa' && "text-red-600 dark:text-red-400",
                                        t.tipo === 'transferencia' && "text-blue-600 dark:text-blue-400"
                                    )}>
                                        {t.tipo === 'despesa' ? '-' : '+'}
                                        {formatAmount(Number(t.valor))}
                                    </p>
                                </div>

                                {/* 5. Actions */}
                                <div className="col-span-1 flex justify-end absolute right-2 top-2 md:relative md:right-auto md:top-auto">
                                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(t)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(t)}>
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Badges Bar (Installments, Pending) */}
                                <div className="col-span-12 flex items-center gap-2 mt-[-5px] md:mt-0 pl-[56px] md:pl-0">
                                    {!t.efetivada && (
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] h-5 px-1.5 gap-1 shadow-none">
                                            <CalendarClock className="h-3 w-3" /> Pendente
                                        </Badge>
                                    )}
                                    {installmentInfo && installmentInfo.total > 1 && (
                                        <Badge variant="outline" className="text-purple-600 border-purple-600 text-[10px] h-5 px-1.5 gap-1 shadow-none">
                                            <CreditCard className="h-3 w-3" /> {installmentInfo.current}/{installmentInfo.total}
                                        </Badge>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </DashboardCard>
    );
}
