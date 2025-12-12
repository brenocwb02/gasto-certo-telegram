import { ReactNode } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PublicLayoutProps {
    children: ReactNode;
    showBack?: boolean;
    backTo?: string;
    showHome?: boolean;
}

export function PublicLayout({
    children,
    showBack = true,
    backTo,
    showHome = true
}: PublicLayoutProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header simples */}
            <header className="border-b border-border py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {showBack && <BackButton to={backTo} />}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold">Z</span>
                            </div>
                            <span className="text-xl font-bold">Zaq - Boas Contas</span>
                        </div>
                    </div>

                    {showHome && (
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/")}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Início
                        </Button>
                    )}
                </div>
            </header>

            {/* Content */}
            <main>{children}</main>
        </div>
    );
}
