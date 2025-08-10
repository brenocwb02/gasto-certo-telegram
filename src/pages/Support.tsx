import { useEffect } from "react";

const Support = () => {
  useEffect(() => {
    document.title = "Suporte | Gasto Certo";
  }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Suporte</h1>
      <p className="text-muted-foreground">Como podemos ajudar? (em breve)</p>
    </main>
  );
};
export default Support;
