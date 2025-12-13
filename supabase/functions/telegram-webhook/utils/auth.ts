
/**
 * Link user telegram ID to a profile using a license code
 */
export async function linkUserWithLicense(supabaseAdmin: any, chatId: number, licenseCode: string): Promise<{ success: boolean; message: string }> {
    try {
        // 1. Verificar licença
        // Tenta buscar por 'code' ou 'license_key' (ajustar conforme schema real)
        const { data: license, error: licenseError } = await supabaseAdmin
            .from('licenses')
            .select('user_id, status')
            .eq('key', licenseCode) // Tentando 'key' que é comum, se falhar, ajustar.
            .single();

        if (licenseError || !license) {
            // Tentar buscar na tabela 'subscriptions' se 'licenses' não existir?
            // Ou assumir que o código falhou.
            console.error("Erro ao buscar licença:", licenseError);
            return { success: false, message: '❌ Código de licença inválido ou expirado.' };
        }

        if (license.status !== 'active') {
            // Opcional: permitir vincular mesmo se expirada?
        }

        // 2. Vincular
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ telegram_chat_id: chatId })
            .eq('user_id', license.user_id);

        if (updateError) {
            console.error("Erro ao vincular profile:", updateError);
            return { success: false, message: '❌ Erro ao vincular sua conta.' };
        }

        return {
            success: true,
            message: '✅ *Conta vinculada com sucesso!*\n\nAgora você pode registrar seus gastos por aqui.'
        };

    } catch (e) {
        console.error("Erro em linkUserWithLicense:", e);
        return { success: false, message: '❌ Erro interno ao processar licença.' };
    }
}
