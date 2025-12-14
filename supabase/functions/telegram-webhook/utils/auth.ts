/**
 * Link user telegram ID to a profile using a license code
 */
export async function linkUserWithLicense(supabaseAdmin: any, chatId: number, licenseCode: string): Promise<{ success: boolean; message: string }> {
    try {
        const cleanCode = licenseCode.trim().toUpperCase();
        console.log(`🔗 Tentando vincular chatId ${chatId} com código: "${cleanCode}" (original: "${licenseCode}")`);
        
        // 1. Verificar licença - usando coluna correta 'codigo'
        const { data: license, error: licenseError } = await supabaseAdmin
            .from('licenses')
            .select('user_id, status, codigo')
            .eq('codigo', cleanCode)
            .single();

        console.log(`🔍 Resultado da busca de licença:`, { license, licenseError });

        if (licenseError || !license) {
            console.error("❌ Erro ao buscar licença:", licenseError);
            return { success: false, message: '❌ Código de licença inválido ou expirado.\n\nVerifique o código em Configurações no app web.' };
        }

        console.log(`✅ Licença encontrada para user_id: ${license.user_id}, status: ${license.status}, codigo: ${license.codigo}`);

        // 2. Verificar se já existe outro usuário vinculado a este chatId
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('user_id, nome')
            .eq('telegram_chat_id', chatId)
            .single();

        if (existingProfile && existingProfile.user_id !== license.user_id) {
            console.log(`⚠️ Chat já vinculado a outro usuário: ${existingProfile.user_id}`);
            return { 
                success: false, 
                message: '⚠️ Este chat já está vinculado a outra conta.\n\nUse /desvincular primeiro.' 
            };
        }

        // 3. Vincular - atualiza AMBOS os campos (telegram_chat_id e telegram_id)
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                telegram_chat_id: chatId,
                telegram_id: chatId.toString()
            })
            .eq('user_id', license.user_id);

        if (updateError) {
            console.error("Erro ao vincular profile:", updateError);
            return { success: false, message: '❌ Erro ao vincular sua conta.' };
        }

        // 4. Criar/atualizar registro em telegram_integration
        const { error: integrationError } = await supabaseAdmin
            .from('telegram_integration')
            .upsert({
                user_id: license.user_id,
                telegram_chat_id: chatId,
                default_context: 'personal',
                show_context_confirmation: true,
                alert_at_80_percent: true,
                alert_at_90_percent: true
            }, { onConflict: 'user_id' });

        if (integrationError) {
            console.warn("Aviso: Erro ao criar telegram_integration:", integrationError);
            // Não falha o processo, apenas loga
        }

        console.log(`✅ Conta vinculada com sucesso para user_id: ${license.user_id}`);

        return {
            success: true,
            message: '✅ *Conta vinculada com sucesso!*\n\nAgora você pode registrar seus gastos por aqui.\n\nDigite /ajuda para ver os comandos.'
        };

    } catch (e) {
        console.error("Erro em linkUserWithLicense:", e);
        return { success: false, message: '❌ Erro interno ao processar licença.' };
    }
}

/**
 * Unlink user telegram ID from profile
 */
export async function unlinkUser(supabaseAdmin: any, chatId: number, userId: string): Promise<{ success: boolean; message: string }> {
    try {
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ telegram_chat_id: null })
            .eq('user_id', userId)
            .eq('telegram_chat_id', chatId); // Garantir que está desvinculando o chat correto

        if (updateError) {
            console.error("Erro ao desvincular profile:", updateError);
            return { success: false, message: '❌ Erro ao desvincular sua conta.' };
        }

        return {
            success: true,
            message: '👋 *Conta desvinculada!*\n\nVocê não receberá mais atualizações aqui. Para reconectar, use `/start SEU_CODIGO`.'
        };
    } catch (e) {
        console.error("Erro em unlinkUser:", e);
        return { success: false, message: '❌ Erro interno ao desvincular conta.' };
    }
}
