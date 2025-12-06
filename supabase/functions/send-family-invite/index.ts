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
    // 🔒 CORREÇÃO DE SEGURANÇA: Validar autenticação JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado. Token de autorização necessário.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente Supabase com token do usuário para validação
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verificar se o token é válido e obter usuário autenticado
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error('[SECURITY] Tentativa de acesso não autenticada:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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

    // Buscar dados do convite (usando Service Role para acesso completo)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .select(`
        *,
        family_groups!inner(name, description, owner_id),
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

    // 🔒 CORREÇÃO DE SEGURANÇA: Verificar autorização
    // Apenas o criador do convite ou o dono do grupo podem acessar
    const isInviter = invite.invited_by === user.id;
    const isGroupOwner = invite.family_groups?.owner_id === user.id;

    if (!isInviter && !isGroupOwner) {
      console.error('[SECURITY] Tentativa de acesso não autorizado ao convite:', {
        userId: user.id,
        inviteId: inviteId
      });
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para acessar este convite' }),
        {
          status: 403,
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

    // 🔒 CORREÇÃO DE SEGURANÇA: Sanitizar logs - não expor token completo
    console.log('[SECURITY] Convite preparado:', {
      inviteId,
      groupName: groupNameData,
      inviterName: inviterNameData,
      // ✅ Não logar o token ou URL completa
      hasToken: !!invite.token
    });

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
    console.error('[SECURITY] Erro ao processar convite familiar:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
