import { useEffect } from "react";

const Settings = () => {
  useEffect(() => {
    document.title = "Configurações | Gasto Certo";
  }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="text-muted-foreground">Ajustes da aplicação (em breve).</p>
    </main>
  );
};
export default Settings;
