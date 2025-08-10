import { useEffect } from "react";

const Accounts = () => {
  useEffect(() => {
    document.title = "Contas | Gasto Certo";
  }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Contas</h1>
      <p className="text-muted-foreground">Página de contas (em breve).</p>
    </main>
  );
};
export default Accounts;
