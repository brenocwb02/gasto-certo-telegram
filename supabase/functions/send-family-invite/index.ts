import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
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

    // Template do email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite para Grupo Familiar - Zaq - Boas Contas</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .invite-card {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .group-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .group-description {
            color: #6b7280;
            margin-bottom: 15px;
          }
          .role-badge {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
          }
          .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.2s;
          }
          .cta-button:hover {
            background: #2563eb;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px;
            margin: 15px 0;
            color: #92400e;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Zaq - Boas Contas</div>
            <div class="subtitle">Controle financeiro familiar com propósito</div>
          </div>

          <div class="content">
            <h2>Olá! 👋</h2>
            <p><strong>${inviterNameData}</strong> convidou você para participar do grupo familiar <strong>"${groupNameData}"</strong> no Zaq - Boas Contas.</p>

            <div class="invite-card">
              <div class="group-name">${groupNameData}</div>
              ${invite.family_groups?.description ? `<div class="group-description">${invite.family_groups.description}</div>` : ''}
              <div>
                <span class="role-badge">${getRoleLabel(invite.role)}</span>
              </div>
            </div>

            <p>Compartilhe suas finanças de forma segura e organizada com sua família. No Zaq - Boas Contas, você pode:</p>
            <ul>
              <li>📊 Visualizar relatórios financeiros compartilhados</li>
              <li>💰 Acompanhar metas e orçamentos familiares</li>
              <li>🤖 Receber dicas personalizadas via Telegram</li>
              <li>📱 Controlar tudo pelo celular ou computador</li>
            </ul>

            <div style="text-align: center;">
              <a href="${inviteUrl}" class="cta-button">
                Aceitar Convite
              </a>
            </div>

            <div class="warning">
              ⚠️ <strong>Importante:</strong> Este convite expira em ${new Date(invite.expires_at).toLocaleDateString('pt-BR')}. 
              Se você não tem uma conta no Zaq - Boas Contas, será redirecionado para criar uma gratuitamente.
            </div>

            <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #3b82f6;">${inviteUrl}</p>
          </div>

          <div class="footer">
            <p>Este é um convite automático do Zaq - Boas Contas.</p>
            <p>Se você não esperava receber este convite, pode ignorar este email.</p>
            <p>© 2025 Zaq - Boas Contas. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email via Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    try {
      const emailResult = await resend.emails.send({
        from: 'Zaq - Boas Contas <onboarding@resend.dev>',
        to: [invite.email],
        subject: `Convite para o grupo ${groupNameData}`,
        html: emailHtml,
      });

      console.log('Email enviado com sucesso:', emailResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Convite enviado com sucesso',
          inviteUrl: inviteUrl,
          emailId: emailResult.data?.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar email',
          details: emailError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Erro ao enviar convite familiar:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getRoleLabel(role: string): string {
  switch (role) {
    case 'owner': return 'Proprietário';
    case 'admin': return 'Administrador';
    case 'member': return 'Membro';
    case 'viewer': return 'Visualizador';
    default: return role;
  }
}
