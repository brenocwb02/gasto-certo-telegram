import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
const model = 'gemini-pro'; // CORREÇÃO: Usando o modelo 'gemini-pro' que é estável e compatível.

// Helper function to call Google AI API
async function callGoogleAi(prompt) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('A chave da API da Google AI não está configurada.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generation_config: {
          response_mime_type: "application/json",
        },
        // CORREÇÃO: Adicionando configurações de segurança para evitar bloqueios desnecessários.
        safetySettings: [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            }
        ]
      }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('Google AI API Error:', errorBody);
        throw new Error(errorBody.error.message);
    }

    const data = await response.json();
    // Adiciona log para depurar a resposta completa da IA
    console.log('Resposta completa da Google AI:', JSON.stringify(data, null, 2));

    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) {
        // Verifica se a resposta foi bloqueada por segurança
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
            console.error('Resposta bloqueada por configurações de segurança.', data.candidates[0].safetyRatings);
            throw new Error("A resposta da IA foi bloqueada por filtros de segurança.");
        }
        throw new Error("A resposta da IA não contém o texto JSON esperado.");
    }
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error('Erro ao chamar a API do Google AI:', error);
    throw new Error(`Erro na IA: ${error.message}`);
  }
}


serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { text, userId } = await req.json();

        if (!text || !userId) {
            return new Response(JSON.stringify({ error: 'Texto e ID do usuário são obrigatórios.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }
        
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Buscar contas e categorias do usuário
        const { data: accounts, error: accountsError } = await supabaseAdmin
            .from('accounts')
            .select('id, nome, tipo')
            .eq('user_id', userId);

        const { data: categories, error: categoriesError } = await supabaseAdmin
            .from('categories')
            .select('id, nome')
            .eq('user_id', userId);

        if (accountsError || categoriesError) {
            throw new Error('Erro ao buscar dados do usuário.');
        }

        const accountsList = accounts.map(a => a.nome).join(', ');
        const categoriesList = categories.map(c => c.nome).join(', ');

        // Construir o prompt para a IA
        const prompt = `
            Analise a frase a seguir e extraia as informações de uma transação financeira no formato JSON.
            Frase: "${text}"

            Siga estas regras estritamente:
            1.  **tipo**: Identifique se é 'receita', 'despesa' ou 'transferencia'. Se não for claro, assuma 'despesa'.
            2.  **valor**: Extraia o valor numérico. Deve ser um número, não texto.
            3.  **descricao**: Crie uma descrição curta e objetiva para a transação.
            4.  **conta**: Identifique a conta usada. O nome da conta DEVE ser um dos seguintes: [${accountsList}]. Se nenhuma conta for mencionada ou se a conta mencionada não estiver na lista, retorne um erro claro no campo 'validation_errors'.
            5.  **categoria**: Identifique a categoria. O nome da categoria DEVE ser um dos seguintes: [${categoriesList}]. Se nenhuma categoria for mencionada, deixe nulo. Se uma categoria for mencionada mas não estiver na lista, tente encontrar a mais próxima ou deixe nulo.
            6.  **conta_destino**: Apenas para 'transferencia', identifique a conta de destino. O nome DEVE ser um dos seguintes: [${accountsList}]. Se não for uma transferência, deixe nulo.
            7.  **validation_errors**: Use este array de strings para retornar mensagens de erro se alguma regra não for cumprida (ex: conta não encontrada, valor ausente). Se estiver tudo certo, retorne um array vazio [].

            Exemplo de JSON de saída para despesa:
            {
              "tipo": "despesa",
              "valor": 50.00,
              "descricao": "Almoço no restaurante",
              "conta": "Cartão Nubank",
              "categoria": "Alimentação",
              "conta_destino": null,
              "validation_errors": []
            }

            Exemplo de JSON de saída para transferência:
            {
              "tipo": "transferencia",
              "valor": 200.00,
              "descricao": "Transferência para João",
              "conta": "Itaú",
              "categoria": null,
              "conta_destino": "PicPay",
              "validation_errors": []
            }
            
            Exemplo de JSON de saída com erro:
            {
              "tipo": "despesa",
              "valor": 75.50,
              "descricao": "Compras no mercado",
              "conta": "Cartão American Express",
              "categoria": "Mercado",
              "conta_destino": null,
              "validation_errors": ["A conta 'Cartão American Express' não foi encontrada. Contas disponíveis: ${accountsList}"]
            }

            Agora, analise a frase e retorne o JSON.
        `;
        
        const extractedData = await callGoogleAi(prompt);
        
        if (extractedData.validation_errors && extractedData.validation_errors.length > 0) {
             return new Response(JSON.stringify(extractedData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }
        
        // Mapear nomes para IDs
        const account = accounts.find(a => a.nome.toLowerCase() === extractedData.conta?.toLowerCase());
        const category = categories.find(c => c.nome.toLowerCase() === extractedData.categoria?.toLowerCase());
        const destinationAccount = accounts.find(a => a.nome.toLowerCase() === extractedData.conta_destino?.toLowerCase());

        const responseData = {
          ...extractedData,
          conta_origem_id: account?.id ?? null,
          categoria_id: category?.id ?? null,
          conta_destino_id: destinationAccount?.id ?? null,
        };
        
        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

