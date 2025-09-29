import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { processTelegramUpdate } from '../_shared/services/telegramService.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    // A lógica principal agora está no telegramService
    return await processTelegramUpdate(payload);
  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

