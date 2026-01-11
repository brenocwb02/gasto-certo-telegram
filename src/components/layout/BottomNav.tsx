
import { Home, List, PlusCircle, Wallet, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from './Sidebar';

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const isTma = document.body.classList.contains('tma-mode'); // Simple check or use hook

    // Only show in TMA mode
    // We can also use a CSS class to control visibility if we want to support mobile web later
    // For now, let's force it visible if 'tma-mode' class is present on body, 
    // but since this is a React component, we might need a state listener or just CSS mechanism.
    // A CSS mechanism is safer to avoid hydration mismatches if checking body class directly.

    // Actually, we can just render it and hide it with CSS unless .tma-mode is present.

    const navItems = [
        { icon: Home, label: 'Início', path: '/dashboard' },
        { icon: List, label: 'Extrato', path: '/transactions' },
        { icon: PlusCircle, label: 'Nova', path: '/transactions?new=true', highlight: true },
        { icon: Wallet, label: 'Contas', path: '/accounts' },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 hidden tma-block">
            <style>{`
        .tma-block { display: none; }
        .tma-mode .tma-block { display: flex; }
      `}</style>

            <nav className="flex items-center justify-around w-full h-16 px-2 pb-safe-area-inset-bottom">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            location.pathname === item.path
                                ? "text-primary font-medium"
                                : "text-muted-foreground hover:text-primary transition-colors"
                        )}
                    >
                        {item.highlight ? (
                            <div className="p-2 rounded-full bg-primary text-primary-foreground shadow-sm mb-1 transform -translate-y-2">
                                <item.icon size={24} />
                            </div>
                        ) : (
                            <item.icon size={20} />
                        )}
                        {!item.highlight && <span className="text-[10px]">{item.label}</span>}
                    </button>
                ))}

                {/* Menu (Sidebar Trigger for TMA) */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary transition-colors">
                            <Menu size={20} />
                            <span className="text-[10px]">Mais</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[80vw]">
                        <Sidebar
                            className="flex static h-full border-r-0"
                            onClose={() => { }} // No-op
                            isExpanded={true}
                        />
                    </SheetContent>
                </Sheet>
            </nav>
        </div>
    );
}
