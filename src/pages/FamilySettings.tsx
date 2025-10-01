import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FamilySettings() {
  useEffect(() => {
    document.title = "Família | Boas Contas";
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Configurações Familiares
            </h1>
            <p className="text-muted-foreground">Gerencie o grupo e compartilhe suas finanças.</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Funcionalidade em Desenvolvimento</AlertTitle>
            <AlertDescription>
              A funcionalidade de grupos familiares está sendo desenvolvida e estará disponível em breve. 
              Você poderá compartilhar contas e transações com membros da sua família.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Em Breve</CardTitle>
              <CardDescription>
                Funcionalidades planejadas para o gerenciamento familiar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Criar e gerenciar grupos familiares</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Convidar membros por e-mail</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Compartilhar contas e transações</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Controles de permissão por membro</span>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
