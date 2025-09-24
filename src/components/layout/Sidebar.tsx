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
  Bot,
  KeyRound,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <NavLink
          to="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Home className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Gasto Certo</span>
        </NavLink>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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
                to="/reports"
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Target className="h-5 w-5" />
                <span className="sr-only">Metas</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Metas</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/telegram-integration"
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <Bot className="h-5 w-5" />
                <span className="sr-only">Integração Telegram</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Integração Telegram</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/license"
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
                  }`
                }
              >
                <KeyRound className="h-5 w-5" />
                <span className="sr-only">Licença</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">Licença</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/support"
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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
                className={({ isActive }) =>
                  `flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    isActive ? "bg-accent text-accent-foreground" : ""
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

