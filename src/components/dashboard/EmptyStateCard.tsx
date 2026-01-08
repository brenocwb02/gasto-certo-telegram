import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, ArrowRight } from "lucide-react";

interface EmptyStateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  className,
  variant = "default",
}: EmptyStateCardProps) {
  const ActionButton = () => {
    if (!actionLabel) return null;
    
    const buttonContent = (
      <>
        <Plus className="h-4 w-4 mr-1" />
        {actionLabel}
      </>
    );

    if (actionHref) {
      return (
        <Button size="sm" asChild>
          <a href={actionHref}>{buttonContent}</a>
        </Button>
      );
    }

    return (
      <Button size="sm" onClick={onAction}>
        {buttonContent}
      </Button>
    );
  };

  const SecondaryButton = () => {
    if (!secondaryActionLabel || !secondaryActionHref) return null;
    
    return (
      <Button size="sm" variant="ghost" asChild className="text-muted-foreground">
        <a href={secondaryActionHref}>
          {secondaryActionLabel}
          <ArrowRight className="h-3 w-3 ml-1" />
        </a>
      </Button>
    );
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-dashed", className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <ActionButton />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("text-center py-6 px-4", className)}>
        <div className="inline-flex p-3 rounded-full bg-muted/50 text-muted-foreground mb-3">
          {icon}
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center justify-center gap-2">
          <ActionButton />
          <SecondaryButton />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-10 px-6 text-center">
        <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
          {description}
        </p>
        <div className="flex items-center gap-3">
          <ActionButton />
          <SecondaryButton />
        </div>
      </CardContent>
    </Card>
  );
}
