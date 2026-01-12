
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Rocket, PenTool, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface WelcomeWizardProps {
    onComplete?: () => void;
}

export function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkCategories();
    }, [user]);

    const checkCategories = async () => {
        if (!user) return;
        try {
            const { count, error } = await supabase
                .from('categories')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (error) throw error;

            // Se não tem categorias, abre o wizard
            if (count === 0) {
                // Pequeno delay para não ser invasivo demais logo no render
                setTimeout(() => setOpen(true), 1000);
            }
        } catch (error) {
            console.error('Erro ao verificar categorias:', error);
        } finally {
            setChecking(false);
        }
    };

    const handleAutoSetup = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .rpc('seed_default_categories', { p_user_id: user.id });

            if (error) throw error;

            toast({
                title: "Tudo pronto! 🚀",
                description: "Categorias e contas padrão foram criadas com sucesso.",
            });

            // Invalidar queries para atualizar a UI
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

            setOpen(false);
            onComplete?.();
        } catch (error) {
            console.error('Erro no setup automático:', error);
            toast({
                title: "Erro",
                description: "Não foi possível criar as categorias.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManualSetup = () => {
        setOpen(false);
        onComplete?.();
        toast({
            title: "Modo Manual",
            description: "Sem problemas! Você pode criar suas categorias quando quiser.",
        });
    };

    if (checking) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Boas-vindas ao Boas Contas! 👋</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Para começar, como você prefere organizar suas finanças?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-4">
                    <button
                        onClick={handleAutoSetup}
                        disabled={loading}
                        className="flex items-start gap-4 p-4 rounded-lg border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                    >
                        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Configuração Automática</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Criamos para você as categorias essenciais (Alimentação, Casa, Transporte...) e contas padrão.
                                <span className="block mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Recomendado para começar rápido
                                </span>
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={handleManualSetup}
                        disabled={loading}
                        className="flex items-start gap-4 p-4 rounded-lg border-2 border-muted hover:border-foreground/20 hover:bg-muted/50 transition-all text-left"
                    >
                        <div className="p-2 bg-muted rounded-full">
                            <PenTool className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Configuração Manual</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Quero começar do zero e criar minhas próprias categorias e contas uma por uma.
                            </p>
                        </div>
                    </button>
                </div>

                <DialogFooter className="sm:justify-center">
                    <p className="text-xs text-muted-foreground text-center">
                        Você poderá alterar tudo isso depois nas configurações.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
