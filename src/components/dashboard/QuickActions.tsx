import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, MessageSquare } from "lucide-react";

const quickActions = [
  {
    title: "Nova Receita",
    description: "Registrar entrada",
    icon: ArrowDownLeft,
    color: "success",
    action: () => console.log("Nova receita")
  },
  {
    title: "Nova Despesa", 
    description: "Registrar saída",
    icon: ArrowUpRight,
    color: "expense",
    action: () => console.log("Nova despesa")
  },
  {
    title: "Transferência",
    description: "Entre contas",
    icon: ArrowRightLeft,
    color: "warning",
    action: () => console.log("Transferência")
  },
  {
    title: "Via Telegram",
    description: "Comando rápido",
    icon: MessageSquare,
    color: "primary",
    action: () => console.log("Telegram")
  }
];

export function QuickActions() {
  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-card-hover group transition-all duration-200"
              onClick={action.action}
            >
              <div className={`
                p-2 rounded-lg transition-all duration-200 group-hover:scale-110
                ${action.color === "success" ? "bg-success/10 text-success" : ""}
                ${action.color === "expense" ? "bg-expense/10 text-expense" : ""}
                ${action.color === "warning" ? "bg-warning/10 text-warning" : ""}
                ${action.color === "primary" ? "bg-primary/10 text-primary" : ""}
              `}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}