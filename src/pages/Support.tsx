import { useState, useEffect } from "react";
import { DashboardCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Mail,
  Book,
  HelpCircle,
  Send,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  Smartphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Support = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Suporte | Boas Contas";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Central de ajuda do Boas Contas: FAQ, tutoriais, documentação e canais de suporte."
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Mensagem enviada!",
        description: "Nossa equipe entrará em contato em breve.",
      });
      setFormData({
        name: "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const faqs = [
    {
      question: "Como funciona o plano gratuito?",
      answer: "O plano gratuito permite até 75 transações por mês (100 no primeiro mês), 2 contas, 10 categorias e acesso ao bot do Telegram com reconhecimento de texto e áudio. Além disso, você tem 20 créditos de IA por mês para análises automáticas.",
    },
    {
      question: "Como vincular minha conta ao Telegram?",
      answer: "Vá em Configurações, copie seu código de assinatura e envie o comando /start [SEU_CODIGO] para o @BoasContasBot no Telegram. A vinculação é instantânea!",
    },
    {
      question: "Posso usar o Boas Contas em família?",
      answer: "Sim! Com os planos Família (até 5 usuários) e Família Plus (até 10 usuários), você pode criar um grupo familiar, convidar membros e compartilhar orçamentos, contas e transações com controle de permissões.",
    },
    {
      question: "Como criar transações recorrentes?",
      answer: "Acesse a página de Transações Recorrentes no menu lateral. Clique em 'Nova Recorrente', defina a frequência (diária, semanal, mensal ou anual), valor, categoria e as transações serão criadas automaticamente nas datas certas.",
    },
    {
      question: "Como funciona o reconhecimento de voz?",
      answer: "Envie um áudio para o @BoasContasBot no Telegram descrevendo sua transação. Por exemplo: 'Gastei 50 reais no supermercado'. O sistema irá transcrever, identificar o valor, tipo e categoria automaticamente!",
    },
    {
      question: "Posso exportar meus dados?",
      answer: "Sim! Usuários dos planos Premium e Família podem exportar suas transações e relatórios em formato CSV ou PDF na página de Relatórios.",
    },
    {
      question: "Como cancelar minha assinatura?",
      answer: "Você pode cancelar a qualquer momento através do Portal de Cobrança (acesse em Planos > Gerenciar Assinatura). Não há multas ou taxas de cancelamento.",
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim! Utilizamos criptografia de ponta a ponta, armazenamento seguro no Supabase e seguimos as melhores práticas de segurança. Além disso, você tem controle total sobre seus dados e pode deletá-los a qualquer momento.",
    },
  ];

  const resources = [
    {
      icon: Video,
      title: "Tutoriais em Vídeo",
      description: "Aprenda a usar todas as funcionalidades",
      link: "#",
      badge: "Em breve",
    },
    {
      icon: FileText,
      title: "Documentação",
      description: "Guias detalhados e passo a passo",
      link: "#",
      badge: "Em breve",
    },
    {
      icon: Book,
      title: "Blog",
      description: "Dicas de educação financeira",
      link: "#",
      badge: "Em breve",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Central de Ajuda</h1>
        <p className="text-muted-foreground text-lg">
          Estamos aqui para ajudar você a aproveitar ao máximo o Boas Contas
        </p>
      </div>

      {/* Status Banner */}
      <DashboardCard className="border-success/50 bg-success/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="font-semibold">Todos os sistemas operacionais</p>
              <p className="text-sm text-muted-foreground">
                Última verificação: {new Date().toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </CardContent>
      </DashboardCard>

      {/* Contact Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <MessageCircle className="h-8 w-8 text-primary" />
                <Badge variant="outline">Mais rápido</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Telegram</h3>
                <p className="text-sm text-muted-foreground">
                  Suporte via bot do Telegram
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open("https://t.me/BoasContasBot", "_blank")}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Abrir @BoasContasBot
              </Button>
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Mail className="h-8 w-8 text-primary" />
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">E-mail</h3>
                <p className="text-sm text-muted-foreground">
                  Resposta em até 24h úteis
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open("mailto:suporte@boascontas.com", "_blank")}
              >
                <Mail className="h-4 w-4 mr-2" />
                suporte@boascontas.com
              </Button>
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <MessageCircle className="h-8 w-8 text-success" />
                <Badge variant="secondary">Premium</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-lg">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Exclusivo para planos Família+
                </p>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <MessageCircle className="h-4 w-4 mr-2" />
                Aguarde upgrade
              </Button>
            </div>
          </CardContent>
        </DashboardCard>
      </div>

      {/* FAQ Section */}
      <DashboardCard>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Perguntas Frequentes</CardTitle>
          </div>
          <CardDescription>
            Respostas para as dúvidas mais comuns sobre o Boas Contas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </DashboardCard>

      {/* Resources */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recursos de Aprendizado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <DashboardCard key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-primary" />
                      {resource.badge && (
                        <Badge variant="secondary">{resource.badge}</Badge>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resource.description}
                      </p>
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar
                    </Button>
                  </div>
                </CardContent>
              </DashboardCard>
            );
          })}
        </div>
      </div>

      {/* Contact Form */}
      <DashboardCard>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <CardTitle>Envie uma Mensagem</CardTitle>
          </div>
          <CardDescription>
            Não encontrou o que procurava? Entre em contato conosco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Como podemos ajudar?"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível..."
                rows={6}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </DashboardCard>

      {/* Support Hours */}
      <DashboardCard>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Horário de Atendimento</h3>
              <p className="text-sm text-muted-foreground">
                Segunda a Sexta: 9h às 18h (horário de Brasília)
              </p>
              <p className="text-sm text-muted-foreground">
                Sábados, Domingos e Feriados: Suporte por e-mail
              </p>
            </div>
          </div>
        </CardContent>
      </DashboardCard>

      {/* Tips */}
      <DashboardCard className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold">💡 Dicas para um atendimento mais rápido</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Descreva seu problema com o máximo de detalhes</li>
                <li>Inclua screenshots se possível (pode enviar por e-mail)</li>
                <li>Informe qual dispositivo e navegador está usando</li>
                <li>Se for erro técnico, copie a mensagem de erro exata</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </DashboardCard>
    </div>
  );
};

export default Support;
