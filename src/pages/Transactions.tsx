import { useEffect } from "react";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { useFamily } from "@/hooks/useFamily";

const Transactions = () => {
  const { currentGroup } = useFamily();

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
    <>
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transações</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {currentGroup ? `Visualizando: ${currentGroup.name}` : 'Suas transações pessoais'}
          </p>
        </div>
      </div>

      <RecentTransactions
        showViewAllButton={false}
        title="Todas as Transações"
        limit={50}
        groupId={currentGroup?.id}
      />
    </>
  );
};

export default Transactions;
