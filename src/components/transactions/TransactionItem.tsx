
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const icon = getTransactionIcon(transaction.tipo);
    const categoryName = getCategoryName(transaction.categoria_id);
    const accountName = getAccountName(transaction.conta_origem_id);
    const amount = formatAmount(Number(transaction.valor));
    const date = formatDate(transaction.data_transacao);

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
                    <p className="text-xs text-muted-foreground text-right">
                        {date}
                    </p>
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
