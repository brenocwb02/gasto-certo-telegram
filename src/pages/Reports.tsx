import { useEffect } from "react";

const Reports = () => {
  useEffect(() => {
    document.title = "Relatórios | Gasto Certo";
  }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>
      <p className="text-muted-foreground">Relatórios e análises (em breve).</p>
    </main>
  );
};
export default Reports;
