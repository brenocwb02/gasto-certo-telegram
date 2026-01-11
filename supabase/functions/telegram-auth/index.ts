
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { initData } = await req.json();
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

        if (!initData || !botToken) {
            throw new Error('Missing initData or BOT_TOKEN');
        }

        // 1. Validate Telegram Data
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');

        // Sort keys
        const params: string[] = [];
        for (const [key, value] of urlParams.entries()) {
            params.push(`${key}=${value}`);
        }
        params.sort();
        const dataCheckString = params.join('\n');

        // Create Secret Key (HMAC-SHA256 of "WebAppData" with BotToken)
        const encoder = new TextEncoder();
        const secretKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode("WebAppData"),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const secretKeyBytes = await crypto.subtle.sign(
            "HMAC",
            secretKey,
            encoder.encode(botToken)
        );

        // Calculate Hash
        const signingKey = await crypto.subtle.importKey(
            "raw",
            secretKeyBytes,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const calculatedHashBytes = await crypto.subtle.sign(
            "HMAC",
            signingKey,
            encoder.encode(dataCheckString)
        );

        // Convert to hex
        const calculatedHash = new TextDecoder().decode(hexEncode(new Uint8Array(calculatedHashBytes)));

        if (calculatedHash !== hash) {
            return new Response(JSON.stringify({ error: 'Invalid hash' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Data is valid. Get User ID.
        // Parse user data from initData
        const userStr = urlParams.get('user');
        if (!userStr) {
            throw new Error('No user data in initData');
        }
        const telegramUser = JSON.parse(userStr);
        const telegramId = String(telegramUser.id);

        // 3. Find User in Postgres
        // We need Service Role to search profiles securely/globally
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Search profile by telegram_id
        // Note: We cast to text just in case, though profile column should be text based on previous file viewing
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('telegram_id', telegramId)
            .single();

        if (profileError || !profile) {
            console.log('User not linked:', telegramId);
            return new Response(JSON.stringify({ error: 'User not linked' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 4. Get Email to generate Magic Link
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);

        if (userError || !userData.user || !userData.user.email) {
            return new Response(JSON.stringify({ error: 'User email not found' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 5. Generate Magic Link (to get token_hash)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email,
        });

        if (linkError || !linkData.properties?.hashed_token) {
            console.error('Error generating link:', linkError);
            throw new Error('Failed to generate auth token');
        }

        // Return the token_hash. The client will use supabase.auth.verifyOtp({ token_hash, type: 'email' })
        // We return 'token' as the hashed_token. Wait, verifyOtp needs the token that was sent? 
        // Usually 'magiclink' sends a token. 'generateLink' returns properties.
        // properties.action_link contains 'token_hash=...'.
        // Actually, for PKCE flow or others, we might need the OTP code.
        // 'magiclink' type in generateLink returns hashed_token. Can verifyOtp use hashed_token?
        // Docs say: verifyOtp({ token_hash: '...', type: 'email' }). Yes.

        // CAUTION: We must return `hashed_token` or `action_link`?
        // The `action_link` has `token_hash`.
        // Let's extract it or pass it.

        return new Response(JSON.stringify({
            token_hash: linkData.properties.hashed_token,
            type: 'email' // to specify in verifyOtp
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
