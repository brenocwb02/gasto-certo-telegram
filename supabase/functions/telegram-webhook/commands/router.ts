
import { handleAjudaCommand, handleUpdateMenuCommand } from './admin.ts';
import { handleFaturaCommand, handlePagarCommand, handleConfigCartaoCommand, handleProjecaoCommand } from '../handlers/credit-card.ts';
import { handleSaldoCommand, handleExtratoCommand, handleResumoCommand, handlePrevisaoCommand, handleTopGastosCommand, handleCompararMesesCommand, handleOrcamentoCommand, handleDividasCommand } from './financial.ts';
import { handleCategoriasCommand } from './categories.ts';
import { handleRecorrenteNovaCommand, handleRecorrentesCommand, handlePausarRecorrenteCommand } from './recurring.ts';
import { handleContasAPagarCommand, handlePendentesCommand } from './contasapagar.ts';
import { handleMeuPerfilCommand } from './profile.ts';
import { handleEditarUltimaCommand, handleDesfazerCommand } from './transactions.ts';
import { handleTutorialCommand, handleAppCommand } from './general.ts';
import { handlePerguntarCommand } from './ai.ts';
import { handleContextCommand, handlePersonalCommand, handleGroupCommand, handleConfigCommand } from '../utils/context.ts';
import { sendTelegramMessage } from '../_shared/telegram-api.ts';
import { unlinkUser } from '../utils/auth.ts';
import { handleMetasCommand } from './goals.ts';
import { handleOnboardingStart } from './onboarding.ts';


/**
 * Roteador central de comandos
 */
export async function handleCommand(supabase: any, command: string, userId: string, chatId: number, messageId?: number): Promise<void> {
    const [cmd, ...args] = command.split(' ');
    const argument = args.join(' ');

    switch (cmd.toLowerCase()) {
        case '/start':
            // Verificar fluxo de onboarding para novos usuários
            await handleOnboardingStart(supabase, chatId, userId);
            break;
        case '/ajuda':
        case '/help':
            await handleAjudaCommand(chatId);
            break;

        case '/contexto':
        case '/ctx':
            await handleContextCommand(supabase, userId, chatId);
            break;

        case '/p':
            await handlePersonalCommand(supabase, userId, chatId);
            break;

        case '/g':
        case '/grupo':
            await handleGroupCommand(supabase, userId, chatId);
            break;

        case '/config':
            await handleConfigCommand(supabase, userId, chatId);
            break;

        case '/faturas':
            await handleFaturaCommand(supabase, chatId, userId);
            break;

        case '/pagar':
            await handlePagarCommand(supabase, chatId, userId);
            break;

        case '/config_cartao':
        case '/configcartao':
            await handleConfigCartaoCommand(supabase, chatId, userId);
            break;

        case '/projecao':
        case '/projeção':
            await handleProjecaoCommand(supabase, chatId, userId);
            break;

        case '/categorias':
            await handleCategoriasCommand(supabase, userId, chatId);
            break;

        case '/saldo':
            await handleSaldoCommand(supabase, chatId, userId);
            break;

        case '/extrato':
            await handleExtratoCommand(supabase, chatId, userId);
            break;

        case '/resumo':
            await handleResumoCommand(supabase, chatId, userId);
            break;

        case '/previsao':
            await handlePrevisaoCommand(supabase, chatId, userId);
            break;

        case '/top_gastos':
        case '/topgastos':
            await handleTopGastosCommand(supabase, chatId, userId);
            break;

        case '/comparar_meses':
        case '/compararmeses':
            await handleCompararMesesCommand(supabase, chatId, userId);
            break;

        case '/orcamento':
            await handleOrcamentoCommand(supabase, chatId, userId);
            break;

        case '/dividas':
            await handleDividasCommand(supabase, chatId, userId);
            break;

        case '/editar_ultima':
        case '/editarultima':
            await handleEditarUltimaCommand(supabase, chatId, userId);
            await handleEditarUltimaCommand(supabase, chatId, userId);
            break;

        case '/desfazer':
        case '/d':
            await handleDesfazerCommand(supabase, chatId, userId);
            break;

        case '/recorrente_nova':
            await handleRecorrenteNovaCommand(chatId);
            break;

        case '/recorrentes':
            await handleRecorrentesCommand(supabase, chatId, userId);
            break;

        case '/pausar_recorrente':
            await handlePausarRecorrenteCommand(supabase, chatId, userId);
            break;

        case '/contasapagar':
        case '/contas_a_pagar':
        case '/pendentes':
            await handlePendentesCommand(supabase, chatId, userId);
            break;

        case '/tutorial':
            await handleTutorialCommand(chatId);
            break;

        case '/app':
        case '/tma':
            await handleAppCommand(chatId);
            break;

        case '/meuperfil':
            await handleMeuPerfilCommand(supabase, chatId, userId);
            break;

        case '/sair':
        case '/logout':
        case '/desvincular':
            const result = await unlinkUser(supabase, chatId, userId);
            await sendTelegramMessage(chatId, result.message, { parse_mode: 'Markdown' });
            break;

        case '/perguntar':
            if (!argument) {
                await sendTelegramMessage(chatId, '❓ Para perguntar, digite a pergunta após o comando.\n\nExemplo: `/perguntar quanto gastei com mercado mês passado?`', { parse_mode: 'Markdown' });
            } else {
                await handlePerguntarCommand(supabase, chatId, userId, argument);
            }
            break;

        case '/metas':
            await handleMetasCommand(supabase, chatId, userId);
            break;

        case '/sys_update_menu':
            await handleUpdateMenuCommand(chatId);
            break;

        case '/stop':
        case '/cancel':
        case '/cancelar':
            // Limpar sessão do usuário
            await supabase.from('telegram_sessions').update({ contexto: {}, status: 'idle' }).eq('user_id', userId);
            await sendTelegramMessage(chatId, '🛑 *Operação cancelada.* \n\nVocê pode iniciar uma nova operação a qualquer momento.', { parse_mode: 'Markdown' });
            break;

        default:
            // Comando não reconhecido (mas ignoramos para não poluir se for algo aleatório)
            // Opcional: Enviar mensagem de ajuda
            console.log(`Comando não reconhecido: ${cmd}`);
            break;
    }
}
