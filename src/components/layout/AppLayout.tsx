import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop/Tablet Sidebar - Visible on sm+ */}
      <Sidebar />

      {/* Mobile Sidebar - Visible on xs via Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-auto border-r-0">
          <Sidebar
            className="flex static h-full w-14 border-r-0"
            onClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
