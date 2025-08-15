// supabase/functions/nlp-transaction/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
// @ts-ignore
import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm'

// This is a smaller, faster model suitable for edge functions.
const MODEL_ID = "gemma-2b-it-q4f16_1-MLC"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text) {
      throw new Error('O texto da mensagem é obrigatório.')
    }

    // Initialize the ML engine
    const engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress) => console.log('Carregando modelo de NLP:', progress),
    });

    const categoriesPrompt = `
      Você é um assistente financeiro inteligente. Sua tarefa é extrair informações de uma mensagem do usuário para registrar uma transação financeira.
      As categorias de despesa disponíveis são: Alimentação, Transporte, Moradia, Lazer, Saúde, Compras, Educação, Contas.
      As categorias de receita disponíveis são: Salário, Freelance, Investimentos, Presente, Outras.

      Analise a seguinte mensagem do usuário e retorne APENAS um objeto JSON com os seguintes campos:
      - "valor": o valor numérico da transação.
      - "descricao": uma breve descrição clara e objetiva da transação.
      - "tipo": deve ser "despesa" ou "receita".
      - "categoria": deve ser uma das categorias listadas. Se não for claro, use "Outras".

      Se não for possível extrair todas as informações, retorne um JSON com os campos que conseguiu e os outros como null.

      Mensagem do usuário: "${text}"
    `;

    console.log("Enviando prompt para o modelo de linguagem...");
    const reply = await engine.chat.completions.create({
      messages: [{ role: 'user', content: categoriesPrompt }],
      max_tokens: 200,
      temperature: 0.1, // Lower temperature for more deterministic results
      response_format: { type: 'json_object' },
    });

    const assistantResponse = reply.choices[0].message.content || '{}';
    console.log("Resposta do modelo:", assistantResponse);

    // Clean the response to ensure it's a valid JSON
    const jsonResponse = assistantResponse.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(jsonResponse);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função nlp-transaction:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
