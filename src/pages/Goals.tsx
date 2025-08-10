import { useEffect } from "react";

const Goals = () => {
  useEffect(() => {
    document.title = "Metas | Gasto Certo";
  }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Metas</h1>
      <p className="text-muted-foreground">Gerencie suas metas (em breve).</p>
    </main>
  );
};
export default Goals;
