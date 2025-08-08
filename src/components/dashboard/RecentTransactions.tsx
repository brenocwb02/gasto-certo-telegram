import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  account: string;
  date: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salário Empresa XYZ",
    amount: 5000.00,
    type: "income",
    category: "Salário",
    account: "Nubank",
    date: "2024-01-15"
  },
  {
    id: "2", 
    description: "Supermercado Extra",
    amount: -89.50,
    type: "expense",
    category: "Alimentação",
    account: "Nubank",
    date: "2024-01-14"
  },
  {
    id: "3",
    description: "Transferência Poupança",
    amount: -500.00,
    type: "transfer",
    category: "Transferência",
    account: "Nubank → Itaú",
    date: "2024-01-13"
  },
  {
    id: "4",
    description: "Freelance Design",
    amount: 800.00,
    type: "income", 
    category: "Freelance",
    account: "Nubank",
    date: "2024-01-12"
  },
  {
    id: "5",
    description: "Netflix",
    amount: -29.90,
    type: "expense",
    category: "Assinaturas",
    account: "Nubank",
    date: "2024-01-11"
  }
];

export function RecentTransactions() {
  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "expense":
        return <ArrowUpRight className="h-4 w-4 text-expense" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-warning" />;
      default:
        return null;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        <Button variant="outline" size="sm">
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockTransactions.map((transaction) => (
          <div 
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-card-hover transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5"
                  >
                    {transaction.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {transaction.account}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  transaction.type === "income" && "text-success",
                  transaction.type === "expense" && "text-expense",
                  transaction.type === "transfer" && "text-warning"
                )}>
                  {transaction.type === "income" ? "+" : ""}
                  {formatAmount(transaction.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.date)}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}