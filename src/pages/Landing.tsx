import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "react-router-dom";
import {
  Heart,
  Users,
  Check,
  Star,
  MessageCircle,
  BrainCircuit,
  TrendingUp,
  User,
  ShieldCheck,
  Zap
} from "lucide-react";

const Landing = () => {
  const features = [{
    icon: MessageCircle,
    title: "Controle via Telegram",
    description: "Envie áudios ou textos como 'Gastei 50 no mercado' e a IA registra tudo em segundos.",
    color: "text-blue-500"
  }, {
    icon: Users,
    title: "Gestão Familiar Real",
    description: "Cada membro tem seu acesso. Defina quem pode ver ou editar o quê com permissões avançadas.",
    color: "text-green-500"
  }, {
    icon: BrainCircuit,
    title: "Inteligência Artificial",
    description: "Não perca tempo categorizando. Nossa IA entende seus gastos e organiza tudo automaticamente.",
    color: "text-purple-500"
  }, {
    icon: TrendingUp,
    title: "Metas e Relatórios",
    description: "Saiba exatamente para onde vai seu dinheiro e economize para realizar os sonhos da família.",
    color: "text-orange-500"
  }];

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [{
    name: "Gratuito",
    priceMonthly: "R$ 0",
    priceYearly: "R$ 0",
    period: "/mês",
    description: "7 dias completos, depois limite básico",
    icon: Star,
    features: [
      "🎁 7 dias: Tudo ilimitado!",
      "Após trial: 30 transações/mês",
      "1 conta",
      "5 categorias",
      "Telegram (Texto)",
      "2 usos de IA/mês"
    ],
    buttonText: "Testar 7 Dias Grátis",
    popular: false,
    highlight: false,
    trial: true
  }, {
    name: "Pessoal",
    priceMonthly: "R$ 14,90",
    priceYearly: "R$ 11,92",
    period: "/mês",
    yearlyTotal: "R$ 143/ano",
    yearlySavings: "2 meses grátis",
    description: "Para quem quer controle total sem limites",
    icon: User,
    features: [
      "Transações ilimitadas",
      "Contas ilimitadas",
      "Categorias ilimitadas",
      "Texto + Áudio + IA ilimitada",
      "Relatórios avançados",
      "Exportação (CSV/PDF)",
      "Suporte prioritário"
    ],
    buttonText: "Assinar Pessoal",
    popular: false,
    highlight: false
  }, {
    name: "Família",
    priceMonthly: "R$ 24,90",
    priceYearly: "R$ 19,92",
    period: "/mês",
    yearlyTotal: "R$ 239/ano",
    yearlySavings: "2 meses grátis",
    description: "A melhor opção para casais e famílias",
    icon: Users,
    features: [
      "Tudo do Pessoal, mais:",
      "Até 6 membros na família",
      "Grupo familiar no Telegram",
      "Orçamento compartilhado",
      "Visão de gastos por membro",
      "Permissões personalizadas",
      "Metas compartilhadas"
    ],
    buttonText: "Assinar Família",
    popular: true,
    highlight: true
  }];

  // Force Light Mode on Mount
  useEffect(() => {
    // Save previous preference
    const wasDark = document.documentElement.classList.contains('dark');

    // Force Light
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('light');
      if (wasDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  return <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20">
    {/* Header */}
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Boas Contas" className="h-10 w-10 animate-logo-pulse" />
          <span className="text-xl font-bold text-primary">Boas Contas</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#funcionalidades" className="text-sm hover:text-primary transition-colors">
            Funcionalidades
          </a>
          <a href="#planos" className="text-sm hover:text-primary transition-colors">
            Planos
          </a>
          <a href="#faq" className="text-sm hover:text-primary transition-colors">
            FAQ
          </a>
          <NavLink to="/auth">
            <Button variant="ghost">Entrar</Button>
          </NavLink>
          <NavLink to="/auth">
            <Button>Começar Grátis</Button>
          </NavLink>
        </nav>
      </div>
    </header>

    {/* Hero Section */}
    <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <Badge variant="outline" className="mb-6 px-4 py-1 border-primary/20 bg-primary/5 text-primary">
          <Zap className="w-3 h-3 mr-2 fill-primary" />
          Nova IA 2.0 disponível
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
          Simplifique o Controle Financeiro <br className="hidden md:block" />
          da sua <span className="text-primary">Família</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Registre gastos pelo <strong>Telegram</strong> em 5 segundos.
          Sem planilhas, sem complicação. A harmonia financeira que sua casa precisa.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <NavLink to="/auth">
            <Button size="lg" className="px-8 h-12 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              🎁 Testar 7 Dias Grátis
            </Button>
          </NavLink>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8"
            onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver Como Funciona
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center -space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-muted-foreground/50" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              +500
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Famílias organizadas e felizes usando o Zaq
          </p>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
    </section>

    {/* Telegram Feature Highlight */}
    <section className="py-20 border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">
              <MessageCircle className="w-3 h-3 mr-2" />
              Integração Exclusiva
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Controle suas finanças direto do <span className="text-blue-500">Telegram</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Esqueça os apps complicados. Com o Zaq, você conversa com suas finanças.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Envie uma mensagem natural</h3>
                  <p className="text-sm text-muted-foreground">"Gastei R$ 138 no mercado com o cartão Nubank"</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">IA entende tudo</h3>
                  <p className="text-sm text-muted-foreground">Identifica valor, categoria (Mercado) e conta (Nubank) automaticamente.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-slate-100/50 p-6 max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
              {/* Telegram Header Mockup */}
              <div className="absolute top-0 left-0 right-0 h-14 bg-[#0088cc] flex items-center px-4 gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <img src="/logo-icon.png" className="w-6 h-6" alt="Zaq" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">Zaq - Boas Contas</p>
                  <p className="text-white/70 text-[10px]">bot</p>
                </div>
              </div>

              <div className="space-y-4 mt-12">
                <div className="flex items-end justify-end">
                  <div className="bg-[#efffde] text-[#222] p-3 rounded-2xl rounded-tr-none max-w-[90%] shadow-sm border border-black/5">
                    <p className="text-sm">Gastei R$ 138 no mercado com o cartão Nubank</p>
                  </div>
                </div>
                <div className="flex items-end justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none max-w-[90%] space-y-2 shadow-md border border-slate-100 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <p className="font-bold text-sm text-green-600">Transação registrada!</p>
                    </div>
                    <div className="text-sm space-y-1.5 bg-slate-50 p-3 rounded-xl">
                      <p className="flex justify-between"><span>💰 Valor:</span> <span className="font-bold">R$ 138,00</span></p>
                      <p className="flex justify-between"><span>📂 Categoria:</span> <span className="font-bold">Mercado</span></p>
                      <p className="flex justify-between"><span>🏦 Conta:</span> <span className="font-bold">Nubank</span></p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">Seu saldo atual</p>
                      <p className="text-xs font-bold text-primary">R$ 1.312,00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-success/10 rounded-full blur-[100px]" />
          </div>
        </div>
      </div>
    </section>

    {/* Values Section (Christian Essence) */}
    <section className="py-20 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-6">
          Mais que números, um <span className="text-primary">Propósito</span>
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-12">
          O nome <strong>Boas Contas</strong> reflete nosso compromisso com a integridade.
          Acreditamos na <strong>mordomia cristã</strong>: cuidar bem dos recursos que Deus nos confiou para abençoar nossa família e o próximo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-background p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-xl mb-2">Transparência</h3>
            <p className="text-muted-foreground text-sm">"A verdade vos libertará". Finanças claras entre o casal evitam conflitos e fortalecem a união.</p>
          </div>
          <div className="bg-background p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-xl mb-2">Responsabilidade</h3>
            <p className="text-muted-foreground text-sm">Planejar não é falta de fé, é sabedoria. Cuide do futuro da sua família com zelo.</p>
          </div>
          <div className="bg-background p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-xl mb-2">Generosidade</h3>
            <p className="text-muted-foreground text-sm">Ao organizar suas contas, sobra mais para doar e ajudar quem precisa.</p>
          </div>
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section id="funcionalidades" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Tudo que sua família precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades poderosas, mas simples de usar. Projetado para a realidade das famílias brasileiras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-background flex items-center justify-center mb-4 shadow-sm ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing Section */}
    <section id="planos" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Planos Flexíveis</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Escolha o plano ideal para <span className="text-primary">sua fase</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Comece com 7 dias gratuitos completos. Sem contratos de fidelidade.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${billingPeriod === 'yearly' ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {billingPeriod === 'yearly' && (
              <Badge className="bg-green-500/10 text-green-600 border-green-200">
                2 meses grátis
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative flex flex-col ${plan.highlight ? 'border-primary shadow-xl scale-105 z-10' : 'border-border shadow-sm hover:shadow-md'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm shadow-lg">
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground h-10 flex items-center justify-center">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold">
                    {billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                  {billingPeriod === 'yearly' && plan.yearlyTotal && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.yearlyTotal}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-auto"
                  variant={plan.highlight ? "default" : "outline"}
                  asChild
                >
                  <NavLink to="/auth">{plan.buttonText}</NavLink>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center space-y-4">
          <p className="text-muted-foreground">
            Dúvidas sobre os planos? <a href="#" className="text-primary hover:underline">Fale com nosso time</a>
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Dados Criptografados</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-500" />
              <span>Garantia de 14 dias</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* FAQ Section */}
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Dúvidas?</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas <span className="text-primary">Frequentes</span>
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Preciso de cartão de crédito para testar?",
              a: "Não! Os 7 dias de trial são 100% gratuitos, sem necessidade de cartão. Você só adiciona forma de pagamento se decidir continuar após o trial."
            },
            {
              q: "Como funciona o controle pelo Telegram?",
              a: "Você vincula sua conta ao bot @BoasContasBot e envia mensagens naturais como 'Gastei R$ 50 no mercado'. Nossa IA entende automaticamente o valor, categoria e conta, registrando tudo em segundos."
            },
            {
              q: "O que acontece após os 7 dias grátis?",
              a: "Após o trial, você continua usando gratuitamente com limites básicos: 30 transações/mês, 1 conta e 5 categorias. Para recursos ilimitados, escolha um plano pago."
            },
            {
              q: "Quantas pessoas podem usar o plano Família?",
              a: "O plano Família permite até 6 membros, cada um com seu próprio acesso ao Telegram. O proprietário define permissões de quem pode ver ou editar transações."
            },
            {
              q: "Posso enviar áudios para registrar gastos?",
              a: "Sim! Nos planos Pessoal e Família, você pode enviar mensagens de voz. A IA transcreve e registra automaticamente. No plano gratuito (após trial), apenas texto."
            },
            {
              q: "Meus dados financeiros estão seguros?",
              a: "Absolutamente! Usamos Supabase com criptografia em trânsito e em repouso. Suas credenciais nunca são armazenadas, e você pode exportar ou deletar seus dados a qualquer momento."
            },
            {
              q: "Posso cancelar a qualquer momento?",
              a: "Sim! Sem fidelidade, sem burocracia. Cancele direto pelo app e seus dados ficam disponíveis no plano gratuito. Também oferecemos garantia de 14 dias com reembolso total."
            },
            {
              q: "O Boas Contas funciona offline?",
              a: "O Boas Contas precisa de internet para sincronizar, mas você pode usar o Telegram offline e as mensagens serão processadas quando reconectar."
            }
          ].map((faq, i) => (
            <details key={i} className="group bg-white rounded-lg border border-slate-200 shadow-sm">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-slate-800">
                {faq.q}
                <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-slate-500 text-sm">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>

    {/* Final CTA Section */}
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para transformar sua vida financeira?</h2>
        <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
          Junte-se a centenas de famílias que já simplificaram suas contas com o Zaq.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <NavLink to="/auth">
            <Button size="lg" variant="secondary" className="px-10 h-14 text-lg font-bold">
              🚀 Começar Agora Gratuitamente
            </Button>
          </NavLink>
        </div>
        <p className="mt-6 text-sm text-primary-foreground/60">Teste grátis por 7 dias. Sem cartão de crédito.</p>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t py-12 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo-icon.png" alt="Boas Contas" className="h-8 w-8" />
              <span className="font-bold text-xl">Boas Contas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transformando a relação das famílias com o dinheiro através de organização e propósito.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#funcionalidades" className="hover:text-primary">Funcionalidades</a></li>
              <li><a href="#planos" className="hover:text-primary">Planos</a></li>
              <li><NavLink to="/auth" className="hover:text-primary">Entrar</NavLink></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><NavLink to="/privacidade" className="hover:text-primary">Política de Privacidade</NavLink></li>
              <li><NavLink to="/termos" className="hover:text-primary">Termos de Uso</NavLink></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Valores</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Ferramenta baseada em princípios de mordomia, transparência e responsabilidade familiar.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          <p>© 2025 Boas Contas. Todos os direitos reservados.</p>
          <p className="mt-2 text-xs">
            Feito com <Heart className="h-3 w-3 inline text-red-500 mx-1" /> para famílias que querem crescer juntas.
          </p>
        </div>
      </div>
    </footer>
  </div>;
};

export default Landing;