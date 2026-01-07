
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MoreHorizontal, CalendarClock, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, parseLocalDate } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionItemProps {
    transaction: any; // Using any for now to match existing loose typing, ideally should be a strict type
    onEdit: (transaction: any) => void;
    onDelete: (transaction: any) => void;
    getCategoryName: (id: string | null) => string;
    getAccountName: (id: string | null) => string;
}

export function TransactionItem({
    transaction,
    onEdit,
    onDelete,
    getCategoryName,
    getAccountName,
}: TransactionItemProps) {
    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "receita":
                return <ArrowDownLeft className="h-4 w-4 text-success" />;
            case "despesa":
                return <ArrowUpRight className="h-4 w-4 text-expense" />;
            case "transferencia":
                return <ArrowRightLeft className="h-4 w-4 text-warning" />;
            default:
                return null;
        }
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Math.abs(amount));
    };

    const formatDate = (dateStr: string) => {
        return parseLocalDate(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Extract installment info from description pattern like "(1/10)"
    const parseInstallment = (descricao: string): { current: number; total: number } | null => {
        const match = descricao.match(/\((\d+)\/(\d+)\)$/);
        if (match) {
            return { current: parseInt(match[1]), total: parseInt(match[2]) };
        }
        return null;
    };

    const icon = getTransactionIcon(transaction.tipo);
    const categoryName = getCategoryName(transaction.categoria_id);
    const accountName = getAccountName(transaction.conta_origem_id);
    const amount = formatAmount(Number(transaction.valor));
    const date = formatDate(transaction.data_transacao);
    const installmentInfo = parseInstallment(transaction.descricao || '');

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border hover:bg-card-hover transition-colors group gap-3 relative">
            {/* Mobile Top Row / Desktop Left Side */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 rounded-lg bg-muted shrink-0">
                    {icon}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate pr-6 sm:pr-0">
                        {transaction.descricao}
                    </p>

                    {/* Mobile: Category + Account on second line */}
                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                        {!transaction.efetivada && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] h-5 px-1.5 gap-1">
                                <CalendarClock className="h-3 w-3" />
                            </Badge>
                        )}
                        {installmentInfo && installmentInfo.total > 1 && (
                            <Badge variant="outline" className="text-purple-600 border-purple-600 text-[10px] h-5 px-1.5 gap-1">
                                <CreditCard className="h-3 w-3" /> {installmentInfo.current}/{installmentInfo.total}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                            {categoryName}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {accountName}
                        </span>
                    </div>

                    {/* Desktop: Tags below description (existing behavior) or keep cleaner? 
              Let's keep the existing behavior for desktop but hidden on mobile in this specific div 
              actually let's render it conditionally based on breakpoints if needed, 
              but flex-wrap works well.
          */}
                    <div className="hidden sm:flex items-center gap-2 mt-1">
                        {!transaction.efetivada && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-[10px] h-5 px-1.5 gap-1">
                                <CalendarClock className="h-3 w-3" /> Pendente
                            </Badge>
                        )}
                        {installmentInfo && installmentInfo.total > 1 && (
                            <Badge variant="outline" className="text-purple-600 border-purple-600 text-[10px] h-5 px-1.5 gap-1">
                                <CreditCard className="h-3 w-3" /> Parcela {installmentInfo.current}/{installmentInfo.total}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {categoryName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {accountName}
                            {transaction.tipo === 'transferencia' && transaction.conta_destino_id &&
                                ` → ${getAccountName(transaction.conta_destino_id)}`
                            }
                        </span>
                    </div>
                </div>

                {/* Mobile: Value & Date absolute properly or just flex'd?
            Let's use a flex row for the mobile top part if we want value next to description?
            No, the plan is 2-3 rows.
            Let's stick to the request: "Icon | Desc | Tags | Value" on desktop.
            On Mobile:
            Row 1: Icon + Desc + Menu
            Row 2: Tags + Value/Date?
        */}
            </div>

            {/* Right Side / Mobile Bottom Row */}
            <div className="flex sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0 pl-[44px] sm:pl-0">
                {/* Mobile: Tags were handled above.
             Here we handle Value and Date.
         */}
                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-end w-full">
                        {/* Mobile: Account Name if we didn't put it up top? No, let's keep it clean. */}
                        <p
                            className={cn(
                                "font-semibold text-sm sm:text-base ml-auto sm:ml-0",
                                transaction.tipo === "receita" && "text-success",
                                transaction.tipo === "despesa" && "text-expense",
                                transaction.tipo === "transferencia" && "text-warning"
                            )}
                        >
                            {transaction.tipo === "receita"
                                ? "+"
                                : transaction.tipo === "despesa"
                                    ? "-"
                                    : ""}
                            {amount}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 justify-end mt-1">
                        {transaction.created_by_profile && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1">
                                            <Avatar className="h-4 w-4 border border-border">
                                                <AvatarImage src={transaction.created_by_profile.avatar_url} />
                                                <AvatarFallback className="text-[8px]">
                                                    {transaction.created_by_profile.nome?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                                                {transaction.created_by_profile.nome.split(' ')[0]}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Registrado por {transaction.created_by_profile.nome}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <p className="text-xs text-muted-foreground text-right border-l border-border pl-2 ml-1">
                            {date}
                        </p>
                    </div>
                </div>

                {/* Actions Menu */}
                <div className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(transaction)}
                            >
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
