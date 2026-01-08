import { useState, useEffect } from "react";
import { useLimits } from "@/hooks/useLimits";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, Calendar, X, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function CollapsibleLimitsBanner() {
  const {
    plan,
    loading,
    isTrial,
    isTrialActive,
    daysRemainingInTrial
  } = useLimits();

  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('limitsBannerCollapsed');
    return saved === 'true';
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    const saved = localStorage.getItem('limitsBannerDismissed');
    const dismissedDate = saved ? new Date(saved) : null;
    // Re-show after 7 days
    if (dismissedDate) {
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceDismissed < 7;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('limitsBannerCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Não mostrar se estiver carregando, plano pago, ou dispensado
  if (loading || plan !== 'gratuito' || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('limitsBannerDismissed', new Date().toISOString());
  };

  // Trial ATIVO
  if (isTrialActive && isTrial) {
    return (
      <div 
        className={cn(
          "mb-4 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20 dark:border-yellow-800/50 transition-all duration-300",
          isCollapsed ? "py-2 px-3" : "p-3"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="h-4 w-4 text-yellow-600 shrink-0" />
            <span className="font-medium text-sm text-yellow-800 dark:text-yellow-200 truncate">
              Trial: {daysRemainingInTrial} {daysRemainingInTrial === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {!isCollapsed && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
                onClick={() => navigate('/planos')}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Ver Planos
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-yellow-600 hover:text-yellow-800"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-yellow-600 hover:text-yellow-800"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 pl-6">
            Acesso completo a todas as funcionalidades. Aproveite!
          </p>
        )}
      </div>
    );
  }

  // Trial EXPIRADO
  return (
    <div 
      className={cn(
        "mb-4 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-800/50 transition-all duration-300",
        isCollapsed ? "py-2 px-3" : "p-3"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Lock className="h-4 w-4 text-red-600 shrink-0" />
          <span className="font-medium text-sm text-red-800 dark:text-red-200 truncate">
            Trial expirado
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {!isCollapsed && (
            <Button
              size="sm"
              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={() => navigate('/planos')}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Escolher Plano
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-600 hover:text-red-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      {!isCollapsed && (
        <p className="text-xs text-red-700 dark:text-red-300 mt-2 pl-6">
          Seus dados estão seguros. Escolha um plano para continuar registrando.
        </p>
      )}
    </div>
  );
}
