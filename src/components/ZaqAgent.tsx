import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, BookOpen, Sparkles } from "lucide-react";

interface ZaqAgentProps {
  onChat?: () => void;
  showWelcome?: boolean;
  className?: string;
}

export function ZaqAgent({ onChat, showWelcome = false, className = "" }: ZaqAgentProps) {
  return (
    <Card className={`bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          Zaq - Seu Assistente Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showWelcome && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Olá! Sou o <strong>Zaq</strong>, seu assistente financeiro pessoal. 
              Inspirado em Zaqueu da Bíblia, estou aqui para ajudar sua família 
              a ter "boas contas" - finanças saudáveis e com propósito.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              <span>Baseado em princípios bíblicos de mordomia</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Como posso ajudar hoje?</p>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={onChat}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Conversar sobre finanças
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              <Heart className="h-4 w-4 mr-2" />
              Dicas de economia familiar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Princípios bíblicos de mordomia
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-primary/10">
          <p className="text-xs text-muted-foreground text-center">
            "Quem é fiel no pouco, também é fiel no muito" - Lucas 16:10
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
