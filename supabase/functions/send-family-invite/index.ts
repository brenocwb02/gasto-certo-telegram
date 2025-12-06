import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { inviteId, groupName, inviterName } = await req.json();

    if (!inviteId) {
      return new Response(
        JSON.stringify({ error: 'inviteId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar dados do convite
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .select(`
        *,
        family_groups!inner(name, description),
        inviter:profiles!family_invites_invited_by_fkey(nome)
      `)
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se convite ainda está pendente
    if (invite.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Convite já foi processado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se convite não expirou
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Convite expirado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar dados do email
    const siteUrl = Deno.env.get('SITE_URL') || 'https://dnpwlpxugkzomqczijwy.supabase.co';
    const inviteUrl = `${siteUrl}/familia?invite=${invite.token}`;
    const inviterNameData = invite.inviter?.nome || 'Um membro da família';
    const groupNameData = invite.family_groups?.name || 'Grupo Familiar';

    // Por enquanto, retornar sucesso com URL do convite (sem envio de email)
    // O envio de email via Resend pode ser ativado quando configurado corretamente
    console.log('Convite preparado:', { inviteUrl, inviterNameData, groupNameData });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite criado com sucesso',
        inviteUrl: inviteUrl,
        note: 'Email não enviado - use o link diretamente'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro ao processar convite familiar:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
