/**
 * Transcription Service - Transcrição de áudio usando Gemini AI
 */

import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

/**
 * Transcreve um áudio do Telegram usando a API do Gemini.
 */
export async function getTranscriptFromAudio(fileId: string): Promise<string> {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');

    if (!botToken || !googleApiKey) {
        throw new Error("As chaves de API do Telegram ou do Google AI não estão configuradas.");
    }

    // 1. Obter o caminho do ficheiro do Telegram
    const fileInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok) {
        throw new Error("Não foi possível obter informações do ficheiro de áudio do Telegram.");
    }

    const filePath = fileInfo.result.file_path;

    // 2. Descarregar o ficheiro de áudio
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const audioResponse = await fetch(fileUrl);
    const audioBlob = await audioResponse.blob();
    const audioArrayBuffer = await audioBlob.arrayBuffer();

    // 3. Converter para Base64
    const base64Audio = encodeBase64(audioArrayBuffer);

    // O Telegram geralmente envia áudio como OGG/Opus
    let mimeType = audioBlob.type;
    console.log('MIME type original do áudio:', mimeType);

    // Corrigir MIME types problemáticos
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
        mimeType = 'audio/ogg';
        console.log('MIME type corrigido para:', mimeType);
    }

    // Garantir que o MIME type é suportado pelo Gemini
    const supportedTypes = ['audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'];
    if (!supportedTypes.includes(mimeType)) {
        console.log(`MIME type ${mimeType} não suportado, usando audio/ogg como padrão`);
        mimeType = 'audio/ogg';
    }

    // 4. Chamar a API do Gemini para transcrição
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`;
    const prompt = "Transcreva este áudio em português:";

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Audio
                        }
                    }
                ]
            }
        ],
        safetySettings: [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
        ]
    };

    console.log('Enviando para o Gemini com MIME type:', mimeType, '(tamanho do áudio em bytes:', audioArrayBuffer.byteLength, ')');

    const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.json();
        console.error('Google AI API Error (Audio):', errorBody);
        throw new Error(`Erro ao transcrever áudio: ${errorBody.error.message}`);
    }

    const result = await geminiResponse.json();
    const transcript = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!transcript) {
        // Verifica se a resposta foi bloqueada por segurança
        if (result.candidates?.[0]?.finishReason === 'SAFETY') {
            console.error('Resposta bloqueada por configurações de segurança.', result.candidates[0].safetyRatings);
            throw new Error("A resposta da IA foi bloqueada por filtros de segurança.");
        }
        throw new Error("A IA não conseguiu transcrever o áudio.");
    }

    return transcript;
}
