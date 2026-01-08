import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Receipt,
  Banknote,
  PieChart,
  Target,
  Folders,
  Settings,
  LifeBuoy,
  Crown,
  LogOut,
  Calculator,
  Users,
  Repeat,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, onClose, isExpanded = false, onToggle }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const menuItems = [
    { to: "/", icon: Home, label: "Dashboard", end: true },
    { to: "/transactions", icon: Receipt, label: "Transações" },
    { to: "/accounts", icon: Banknote, label: "Contas" },
    { to: "/categories", icon: Folders, label: "Categorias" },
    { to: "/orcamento", icon: Calculator, label: "Orçamento" },
    { to: "/reports", icon: PieChart, label: "Relatórios" },
    { to: "/goals", icon: Target, label: "Metas" },
    { to: "/patrimonio", icon: Wallet, label: "Patrimônio" },
  ];

  const bottomItems = [
    { to: "/recorrentes", icon: Repeat, label: "Recorrentes" },
    { to: "/familia", icon: Users, label: "Família" },
    { to: "/planos", icon: Crown, label: "Planos" },
    { to: "/support", icon: LifeBuoy, label: "Suporte" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  const renderLink = (item: any) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={handleLinkClick}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          isExpanded ? "justify-start w-full" : "justify-center h-9 w-9 p-0 md:h-8 md:w-8"
        )
      }
    >

      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span
        className={cn(
          "truncate transition-all duration-300",
          isExpanded
            ? "opacity-100 max-w-[200px]"
            : "opacity-0 max-w-0 w-0 hidden"
        )}
      >
        {item.label}
      </span>
    </NavLink>
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 flex flex-col border-r bg-background transition-all duration-300",
        isExpanded ? "w-64" : "w-14",
        className
      )}
    >
      {/* Header / Logo */}
      <div className={cn("flex items-center h-14 border-b px-3", isExpanded ? "justify-between" : "justify-center")}>
        <NavLink
          to="/"
          onClick={handleLinkClick}
          className={cn(
            "group flex items-center justify-center gap-2 rounded-lg transition-all",
            isExpanded ? "h-10 px-2" : "h-10 w-10"
          )}
        >
          <img src="/logo-icon.png" alt="Boas Contas" className="h-8 w-8 flex-shrink-0 animate-logo-pulse" />
          <span
            className={cn(
              "whitespace-nowrap font-bold text-primary transition-all duration-300 overflow-hidden",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            Boas Contas
          </span>
        </NavLink>

        {/* Mobile Close Button (if needed, though standard sheet handles it) or Desktop Toggle */}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={onToggle}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto py-4 px-2 no-scrollbar">
        <TooltipProvider delayDuration={0}>
          {menuItems.map((item) => {
            // Only use tooltip if collapsed
            if (!isExpanded) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    {renderLink(item)}
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return renderLink(item);
          })}
        </TooltipProvider>

        <div className="mt-auto pt-4 border-t space-y-2">
          <TooltipProvider delayDuration={0}>
            {bottomItems.map((item) => {
              if (!isExpanded) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{renderLink(item)}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }
              return renderLink(item);
            })}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-3 transition-all duration-300 hover:text-foreground text-muted-foreground px-3",
                    isExpanded ? "w-full justify-start" : "justify-center h-9 w-9 p-0 md:h-8 md:w-8 mx-auto"
                  )}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "truncate transition-all duration-300",
                      isExpanded
                        ? "opacity-100 max-w-[200px]"
                        : "opacity-0 max-w-0 w-0 hidden"
                    )}
                  >
                    Sair
                  </span>
                </Button>
              </TooltipTrigger>
              {!isExpanded && <TooltipContent side="right">Sair</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </nav>
    </aside>
  );
}
