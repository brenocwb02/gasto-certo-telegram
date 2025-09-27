import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* O componente Sidebar já lida com a sua visibilidade em mobile através de um Sheet,
          portanto não precisamos de lógica extra para mostrá-lo/escondê-lo aqui. */}
      <Sidebar />

      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
