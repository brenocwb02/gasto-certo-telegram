import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

const Transactions = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.title = "Transações | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Transações financeiramente organizadas no Boas Contas: liste, edite e exclua suas transações."
      );
    }
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + "/transactions");
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Transações</h1>
          <RecentTransactions showViewAllButton={false} title="Transações" />
        </main>
      </div>
    </div>
  );
};

export default Transactions;
