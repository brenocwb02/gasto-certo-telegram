import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Loader2, Crown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

// Carregue sua chave publicável do Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // O ID do preço do seu plano Premium no Stripe
      const priceId = 'price_xxxxxxxxxxxxxx'; // SUBSTITUA PELO SEU PRICE ID

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) throw error;

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (error) {
      toast({
        title: 'Erro no Checkout',
        description: 'Não foi possível iniciar o processo de pagamento.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                Upgrade para Premium
              </CardTitle>
              <CardDescription>
                Desbloqueie todos os recursos e tenha controle total sobre suas finanças.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold">R$ 29,90</p>
                <p className="text-muted-foreground">por mês</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">✔ Contas e categorias ilimitadas.</li>
                <li className="flex items-center gap-2">✔ Relatórios avançados.</li>
                <li className="flex items-center gap-2">✔ Integração com Telegram via IA.</li>
                <li className="flex items-center gap-2">✔ Suporte prioritário.</li>
              </ul>
              <Button onClick={handleCheckout} disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : 'Fazer Upgrade Agora'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default CheckoutPage;

