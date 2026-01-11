import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
    // We can expose other Card props if needed
}

export function DashboardCard({ children, className }: DashboardCardProps) {
    return (
        <Card className={cn("border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl", className)}>
            {children}
        </Card>
    );
}

// Re-export subcomponents for convenience
export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter };
