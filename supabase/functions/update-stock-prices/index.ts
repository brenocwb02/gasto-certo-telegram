import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Função para buscar cotação da API Brapi (API brasileira gratuita)
async function fetchStockPrice(ticker: string): Promise<number | null> {
  try {
    // Adicionar .SA se o ticker não tiver sufixo (padrão B3)
    const formattedTicker = ticker.includes('.') ? ticker : `${ticker}.SA`;
    
    console.log(`[UPDATE-PRICES] Buscando cotação para ${ticker} (formatado: ${formattedTicker})`);
    
    const response = await fetch(`https://brapi.dev/api/quote/${formattedTicker}?token=demo`);
    
    if (!response.ok) {
      console.error(`[UPDATE-PRICES] API retornou status ${response.status} para ${formattedTicker}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[UPDATE-PRICES] Resposta da API para ${formattedTicker}:`, JSON.stringify(data));
    
    if (data.results && data.results.length > 0) {
      const price = data.results[0].regularMarketPrice;
      console.log(`[UPDATE-PRICES] Preço encontrado para ${ticker}: R$ ${price}`);
      return price;
    }
    
    console.warn(`[UPDATE-PRICES] Nenhum resultado encontrado para ${formattedTicker}`);
    return null;
  } catch (error) {
    console.error(`[UPDATE-PRICES] Erro ao buscar ${ticker}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[UPDATE-PRICES] Iniciando atualização de preços');

    // Buscar todos os tickers únicos
    const { data: investments, error } = await supabase
      .from('investments')
      .select('ticker')
      .gt('quantity', 0);

    if (error) throw error;

    const uniqueTickers = [...new Set(investments?.map(i => i.ticker) || [])];
    console.log('[UPDATE-PRICES] Tickers a atualizar:', uniqueTickers);

    let updated = 0;
    let failed = 0;

    // Atualizar preços
    for (const ticker of uniqueTickers) {
      const price = await fetchStockPrice(ticker);
      
      if (price !== null) {
        const { error: updateError } = await supabase
          .from('investments')
          .update({ 
            current_price: price,
            last_price_update: new Date().toISOString()
          })
          .eq('ticker', ticker);

        if (updateError) {
          console.error(`[UPDATE-PRICES] Erro ao atualizar ${ticker}:`, updateError);
          failed++;
        } else {
          console.log(`[UPDATE-PRICES] ${ticker}: R$ ${price}`);
          updated++;
        }
      } else {
        console.warn(`[UPDATE-PRICES] Preço não encontrado para ${ticker}`);
        failed++;
      }

      // Rate limiting - aguarda 1 segundo entre chamadas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const result = {
      success: true,
      updated,
      failed,
      total: uniqueTickers.length,
      timestamp: new Date().toISOString()
    };

    console.log('[UPDATE-PRICES] Finalizado:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[UPDATE-PRICES] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
