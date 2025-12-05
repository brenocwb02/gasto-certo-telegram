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
}

export function Sidebar({ className, onClose }: SidebarProps) {
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

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex", className)}>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <NavLink
          to="/"
          onClick={handleLinkClick}
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Home className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Boas Contas</span>
        </NavLink>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Home className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/transactions"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Receipt className="h-5 w-5" />
                <span className="sr-only">Transações</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Transações</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/accounts"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Banknote className="h-5 w-5" />
                <span className="sr-only">Contas</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Contas</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/categories"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Folders className="h-5 w-5" />
                <span className="sr-only">Categorias</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Categorias</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/orcamento"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Calculator className="h-5 w-5" />
                <span className="sr-only">Orçamento</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Orçamento</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/reports"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <PieChart className="h-5 w-5" />
                <span className="sr-only">Relatórios</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Relatórios</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/goals"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Target className="h-5 w-5" />
                <span className="sr-only">Metas</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Metas</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/patrimonio"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Wallet className="h-5 w-5" />
                <span className="sr-only">Patrimônio</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Patrimônio</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/recorrentes"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Repeat className="h-5 w-5" />
                <span className="sr-only">Recorrentes</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Recorrentes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/familia"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Users className="h-5 w-5" />
                <span className="sr-only">Família</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Família</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/planos"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Crown className="h-5 w-5" />
                <span className="sr-only">Planos</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Planos</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/support"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <LifeBuoy className="h-5 w-5" />
                <span className="sr-only">Suporte</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Suporte</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/settings"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configurações</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Configurações</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground md:h-8 md:w-8"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sair</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
