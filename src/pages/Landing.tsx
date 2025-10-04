import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "react-router-dom";
import { Heart, Users, BarChart3, Calendar, PiggyBank, FileText, CreditCard, Smartphone, Check, Star, Crown } from "lucide-react";
const Landing = () => {
  const features = [{
    icon: PiggyBank,
    title: "Controle de Receitas e Despesas",
    description: "Organize entradas e saídas com categorias personalizadas para sua família.",
    color: "text-blue-500"
  }, {
    icon: Users,
    title: "Gestão Colaborativa",
    description: "Todos os membros da família participam do controle financeiro em tempo real.",
    color: "text-green-500"
  }, {
    icon: BarChart3,
    title: "Metas Financeiras",
    description: "Defina e acompanhe objetivos de poupança, quitação de dívidas e investimentos.",
    color: "text-orange-500"
  }, {
    icon: Smartphone,
    title: "Alertas Inteligentes",
    description: "Receba lembretes de vencimento de contas e progresso das suas metas.",
    color: "text-purple-500"
  }, {
    icon: FileText,
    title: "Relatórios e Dashboards",
    description: "Visualize seu progresso financeiro com gráficos claros e intuitivos.",
    color: "text-teal-500"
  }, {
    icon: CreditCard,
    title: "Gestão de Cartões",
    description: "Controle cartões de crédito, parcelamentos e limite disponível.",
    color: "text-indigo-500"
  }, {
    icon: Calendar,
    title: "Planejamento Anual",
    description: "Organize suas finanças com visão de longo prazo e metas anuais.",
    color: "text-pink-500"
  }, {
    icon: Heart,
    title: "Valores Cristãos",
    description: "Ferramenta baseada em princípios bíblicos de mordomia e responsabilidade.",
    color: "text-red-500"
  }];
  const plans = [{
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar a organizar suas finanças",
    icon: Star,
    features: ["Controle básico de receitas e despesas", "1 usuário", "Relatórios simples", "Suporte por email", "Até 50 transações por mês"],
    buttonText: "Começar Grátis",
    popular: false
  }, {
    name: "Premium",
    price: "R$ 29,90",
    period: "/mês",
    description: "Solução completa para sua família",
    icon: Crown,
    features: ["Controle completo de receitas e despesas", "Até 5 usuários", "Metas financeiras ilimitadas", "Relatórios avançados com gráficos", "Alertas inteligentes", "Gestão de cartões e parcelamentos", "Transações ilimitadas", "Suporte prioritário"],
    buttonText: "Escolher Premium",
    popular: true
  }, {
    name: "Família Plus",
    price: "R$ 49,90",
    period: "/mês",
    description: "Para famílias que querem o máximo controle",
    icon: Users,
    features: ["Tudo do Premium, mais:", "Usuários ilimitados", "Dashboard compartilhado avançado", "Planejamento financeiro anual", "Exportação de dados", "Integração com bancos (em breve)", "Suporte VIP com WhatsApp", "Consultorias mensais gratuitas"],
    buttonText: "Escolher Família Plus",
    popular: false
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Zaq</h1>
              <p className="text-xs text-muted-foreground">Boas Contas</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#planos" className="text-sm hover:text-primary transition-colors">
              Planos
            </a>
            <a href="#sobre" className="text-sm hover:text-primary transition-colors">
              Sobre
            </a>
            <NavLink to="/auth">
              <Button>Entrar</Button>
            </NavLink>
            <NavLink to="/auth">
              <Button variant="outline">Começar Grátis</Button>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm text-primary font-medium">Inspirado em valores cristãos</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Zaq - <span className="text-primary">Boas Contas</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Controle financeiro familiar com <span className="text-primary font-semibold">propósito</span>
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Transforme a relação da sua família com o dinheiro. Organize receitas, 
            despesas e metas com uma ferramenta simples, prática e baseada em 
            valores cristãos. <strong>Zaq</strong> é seu assistente financeiro pessoal, 
            inspirado em Zaqueu da Bíblia - alguém que transformou sua relação com o dinheiro.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <NavLink to="/auth">
              <Button size="lg" className="px-8">
                Começar Grátis →
              </Button>
            </NavLink>
            <Button variant="outline" size="lg">
              Ver Demonstração
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-background -mr-2"></div>
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-background -mr-2"></div>
                <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-background"></div>
              </div>
              <span>+500 famílias organizadas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tudo que sua família precisa para{" "}
              <span className="text-primary">organizar as finanças</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa e intuitiva que transforma o controle financeiro em um hábito familiar 
              saudável e baseado em propósito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className={`h-12 w-12 mx-auto ${feature.color}`} />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar suas <span className="text-primary">finanças familiares</span>?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de famílias que já organizaram suas finanças e conquistaram seus sonhos 
            com o Zac - Boas Contas.
          </p>
          <Button size="lg" asChild>
            <NavLink to="/auth">Falar com Especialista</NavLink>
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">📊 Planos e Preços</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Escolha o plano ideal para <span className="text-primary">sua família</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece gratuitamente e evolua conforme suas necessidades. Todos os planos incluem suporte e 
              atualizações constantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Mais Popular
                  </Badge>}
                <CardHeader className="text-center">
                  <plan.icon className={`h-12 w-12 mx-auto mb-4 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>)}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <NavLink to="/auth">{plan.buttonText}</NavLink>
                  </Button>
                </CardContent>
              </Card>)}
          </div>

          <div className="text-center mt-12">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span>Todos os planos incluem 14 dias grátis</span>
              </div>
              <span>•</span>
              <span>Cancele quando quiser</span>
              <span>•</span>
              <span>Sem taxas ocultas</span>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Segurança bancária</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Dados criptografados</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Suporte brasileiro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">Zaq</h3>
                  <p className="text-xs text-muted-foreground">Boas Contas</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformando a relação das famílias com o dinheiro através de valores cristãos e 
                organização financeira.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Feito com <Heart className="h-3 w-3 inline text-red-500" /> para famílias cristãs
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-primary">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-primary">Planos e Preços</a></li>
                <li><a href="#" className="hover:text-primary">Demonstração</a></li>
                <li><a href="#" className="hover:text-primary">Atualizações</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary">Tutoriais</a></li>
                <li><a href="#" className="hover:text-primary">FAQ</a></li>
                <li><a href="#" className="hover:text-primary">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Entre em Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✉️ contato@zacboascontas.com.br</li>
                <li>📱 WhatsApp Suporte</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Zaq - Boas Contas. Todos os direitos reservados.</p>
            <div className="flex justify-center gap-4 mt-2">
              <a href="#" className="hover:text-primary">Privacidade</a>
              <a href="#" className="hover:text-primary">Termos</a>
              <a href="#" className="hover:text-primary">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;