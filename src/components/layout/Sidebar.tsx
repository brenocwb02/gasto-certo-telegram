import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  Target, 
  Settings, 
  HelpCircle,
  DollarSign,
  Wallet,
  Shield,
  Bot,
  Tags,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
}

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    title: "Transações",
    icon: CreditCard,
    href: "/transactions"
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    href: "/reports"
  },
  {
    title: "Metas",
    icon: Target,
    href: "/goals"
  },
  {
    title: "Orçamento",
    icon: ClipboardList,
    href: "/orcamento"
  },
  {
    title: "Contas",
    icon: Wallet,
    href: "/accounts"
  },
  {
    title: "Categorias", 
    icon: Tags,
    href: "/categories"
  }
];

const bottomItems = [
  {
    title: "Licença",
    icon: Shield,
    href: "/license"
  },
  {
    title: "Telegram",
    icon: Bot,
    href: "/telegram"
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/settings"
  },
  {
    title: "Suporte",
    icon: HelpCircle,
    href: "/support"
  }
];

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  const location = useLocation();
  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border flex flex-col h-full",
      "w-64 lg:w-72 transition-all duration-300",
      !isOpen && "-translate-x-full lg:translate-x-0 lg:w-16",
      className
    )}>
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 primary-gradient rounded-xl flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary-foreground" />
          </div>
          {isOpen && (
            <div>
              <h2 className="font-bold text-sidebar-foreground">Gasto Certo</h2>
              <p className="text-xs text-muted-foreground">Versão 1.0</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={active ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  active && "primary-gradient text-primary-foreground shadow-md",
                  !isOpen && "justify-center px-0"
                )}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span className="truncate">{item.title}</span>}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                !isOpen && "justify-center px-0"
              )}
              asChild
            >
              <Link to={item.href}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span className="truncate">{item.title}</span>}
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Quick Stats - Only show when open */}
      {isOpen && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="stats-card space-y-3">
            <h3 className="font-semibold text-sm text-sidebar-foreground">Resumo Rápido</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Saldo Total</span>
                <span className="text-sm font-medium text-success">R$ 2.450,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Este mês</span>
                <span className="text-sm font-medium text-expense">-R$ 890,50</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

