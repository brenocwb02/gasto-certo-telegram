import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
    to?: string; // Rota específica ou null para usar history.back()
    label?: string;
    variant?: "default" | "ghost" | "outline" | "link" | "destructive" | "secondary";
    className?: string;
}

export function BackButton({
    to,
    label = "Voltar",
    variant = "ghost",
    className
}: BackButtonProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <Button
            variant={variant}
            onClick={handleBack}
            className={className}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {label}
        </Button>
    );
}
