import React, { useState, Suspense } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

const LayoutLoader = () => (
  <div className="flex items-center justify-center h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(() => {
    // Default to true (expanded) for new users/first load
    const saved = localStorage.getItem("sidebarExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleDesktopSidebar = () => {
    const newState = !isDesktopSidebarExpanded;
    setIsDesktopSidebarExpanded(newState);
    localStorage.setItem("sidebarExpanded", JSON.stringify(newState));
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop/Tablet Sidebar - Visible on sm+ */}
      <Sidebar
        className="hidden sm:flex"
        isExpanded={isDesktopSidebarExpanded}
        onToggle={toggleDesktopSidebar}
      />

      {/* Mobile Sidebar - Visible on xs via Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-auto border-r-0">
          <Sidebar
            className="flex static h-full border-r-0"
            onClose={() => setSidebarOpen(false)}
            isExpanded={true} // Always expanded on mobile
          />
        </SheetContent>
      </Sheet>

      <div
        className={`main-layout-content flex-1 flex flex-col transition-all duration-300 ${isDesktopSidebarExpanded ? 'sm:pl-64' : 'sm:pl-14'
          }`}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <Suspense fallback={<LayoutLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
