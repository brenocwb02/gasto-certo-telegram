import { ReactNode, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface WidgetSection {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  badge?: string;
}

interface DashboardWidgetAccordionProps {
  sections: WidgetSection[];
  defaultOpen?: string[];
  className?: string;
}

export function DashboardWidgetAccordion({
  sections,
  defaultOpen = [],
  className,
}: DashboardWidgetAccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className={cn("space-y-2", className)}
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          className="border rounded-lg bg-card/50 overflow-hidden data-[state=open]:shadow-sm transition-shadow"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="text-primary">{section.icon}</span>
              <span>{section.title}</span>
              {section.badge && (
                <span className="ml-auto mr-2 text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {section.badge}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0">
            {section.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
