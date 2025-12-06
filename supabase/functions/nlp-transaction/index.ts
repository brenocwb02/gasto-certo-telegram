import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
const model = 'gemini-2.5-flash'; // Modelo estável mais recente do Gemini

// Helper function to call Google AI API
async function callGoogleAi(prompt: string) {
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Erro na IA: ${errorMessage}`);
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
            .select(`
                id, 
                nome, 
                parent_id,
                parent:categories!parent_id(nome)
            `)
            .eq('user_id', userId);

        if (accountsError || categoriesError) {
            throw new Error('Erro ao buscar dados do usuário.');
        }

        const accountsList = accounts.map(a => a.nome).join(', ');

        // Criar lista de categorias incluindo hierarquia
        const categoriesList = categories
            .map(c => {
                if (c.parent) {
                    return `${c.parent.nome} > ${c.nome}`;
                }
                return c.nome;
            })
            .join(', ');

        // Construir o prompt melhorado para a IA
        const prompt = `Você é um assistente financeiro que extrai informações de transações.

Analise esta frase: "${text}"

Contas disponíveis: ${accountsList}
Categorias disponíveis: ${categoriesList}

Regras OBRIGATÓRIAS:
1. Tipo: identifique se é 'receita', 'despesa' ou 'transferencia'
2. Valor: extraia APENAS o número (ex: 50, 25.50)
3. Descrição: crie uma descrição curta. Se for vaga (ex: "gastei 10"), use algo como "Gasto diverso".
4. Conta: escolha UMA conta da lista de contas disponíveis. Se não mencionar conta, use a primeira da lista
5. Categoria: escolha UMA categoria da lista. Se a descrição for vaga e não houver contexto claro (ex: "gastei 10 reais"), procure por "Outros", "Geral" ou "Diversos". NÃO assuma "Alimentação" a menos que haja palavras relacionadas a comida/restaurante.
6. validation_errors: [] (vazio se tudo ok)

Retorne APENAS o JSON (sem markdown, sem explicações):
{
  "tipo": "despesa",
  "valor": 50.00,
  "descricao": "Compra no mercado",
  "conta": "Cartão Nubank",
  "categoria": "Alimentação",
  "conta_destino": null,
  "validation_errors": []
}`;

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
        console.error('Error in nlp-transaction function:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

