
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { getBankBrand } from "@/lib/bank-brands";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CreditCardWidgetProps {
    account: any;
    compact?: boolean; // For dashboard vs full list
}

export function CreditCardWidget({ account, compact = false }: CreditCardWidgetProps) {
    const brand = getBankBrand(account.nome || "", account.banco || "");

    // Calculations
    const limit = Number(account.limite) || 0;
    const balance = Number(account.saldo_atual) || 0; // Negative usually

    // Balance is usually negative for debt. 
    // Spent = |balance| (if negative)
    // Available = Limit + Balance (since balance is negative)
    // Example: Limit 1000, Balance -200. Available = 800. Spent = 200.
    // Example: Limit 1000, Balance +100 (overpaid). Available = 1100. Spent = -100 (Credit).

    const usedAmount = balance < 0 ? Math.abs(balance) : 0;
    const availableLimit = limit + balance;

    const percentage = limit > 0 ? (usedAmount / limit) * 100 : 0;

    // Status Colors
    let statusColor = "bg-green-500";
    let statusText = "text-green-600";

    if (percentage > 90) {
        statusColor = "bg-red-500";
        statusText = "text-red-600";
    } else if (percentage > 70) {
        statusColor = "bg-yellow-500";
        statusText = "text-yellow-600";
    } else if (percentage > 50) {
        statusColor = "bg-blue-500"; // Blue for standard usage
        statusText = "text-blue-600";
    }

    // Invoice Status (Mock logic based on closing day if available)
    // Assuming simple logic for now: If we are past closing day, it's "Closed" or "Closing Soon"
    const today = new Date();
    const currentDay = today.getDate();
    const closingDay = Number(account.dia_fechamento);
    const dueDay = Number(account.dia_vencimento);

    let invoiceStatus = "Aberta";
    let invoiceBadgeColor = "bg-blue-100 text-blue-700";

    if (closingDay && dueDay) {
        if (currentDay >= closingDay && currentDay < dueDay) {
            invoiceStatus = "Fechada";
            invoiceBadgeColor = "bg-red-100 text-red-700";
        } else if (currentDay === dueDay) {
            invoiceStatus = "Vence Hoje";
            invoiceBadgeColor = "bg-red-500 text-white animate-pulse";
        }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <Card className={cn(
            "overflow-hidden transition-all hover:shadow-md border-t-4",
            compact ? "min-w-[280px]" : "w-full"
        )} style={{ borderTopColor: brand.primaryColor }}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: brand.primaryColor, color: brand.secondaryColor }}
                    >
                        {account.banco ? account.banco[0].toUpperCase() : <CreditCard className="h-5 w-5" />}
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">{account.nome}</CardTitle>
                        <p className="text-xs text-muted-foreground">{brand.name}</p>
                    </div>
                </div>
                {closingDay && (
                    <Badge variant="secondary" className={cn("text-[10px] uppercase", invoiceBadgeColor)}>
                        {invoiceStatus}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Limit Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Limite Usado</span>
                        <span className={cn("font-bold", statusText)}>{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} indicatorClassName={statusColor} className="h-2" />
                </div>

                {/* Values Grid */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                        <p className="text-xs text-muted-foreground">Em Aberto</p>
                        <p className="text-lg font-bold text-foreground">
                            {formatCurrency(usedAmount)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Disponível</p>
                        <p className={cn("text-lg font-bold", availableLimit < 0 ? "text-red-500" : "text-green-600")}>
                            {formatCurrency(availableLimit)}
                        </p>
                    </div>
                </div>

                {/* Footer / Actions */}
                {!compact && (
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                            <Link to={`/transactions?accountId=${account.id}`}>Ver Fatura</Link>
                        </Button>
                        {invoiceStatus === 'Fechada' && (
                            <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white">
                                Pagar
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
