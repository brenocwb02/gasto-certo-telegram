/**
 * Comandos relacionados a Cartão de Crédito via Telegram
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Interface para configurações de cartão
interface CreditCardSettings {
  id: string;
  account_id: string;
  auto_payment: boolean;
  default_payment_account_id: string | null;
  send_reminder: boolean;
  reminder_days_before: number;
  allow_partial_payment: boolean;
  min_balance_warning: number;
}

interface CreditCardAccount {
  id: string;
  nome: string;
  saldo_atual: number;
  dia_fechamento: number;
  dia_vencimento: number;
}

// Função auxiliar para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Função auxiliar para enviar mensagem ao Telegram
async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: { parse_mode?: string; reply_markup?: any }
): Promise<void> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) throw new Error('Token do bot não configurado');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'Markdown',
      reply_markup: options?.reply_markup
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Erro ao enviar mensagem:', error);
    throw new Error('Falha ao enviar mensagem');
  }
}

// Criar cliente Supabase
function createSupabaseClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

/**
 * Comando /fatura - Mostra faturas dos cartões de crédito
 */
export async function handleFaturaCommand(userId: string, chatId: number): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: cards, error } = await supabase
      .from('accounts')
      .select('id, nome, saldo_atual, dia_fechamento, dia_vencimento')
      .eq('user_id', userId)
      .eq('tipo', 'cartao')
      .eq('ativo', true);

    if (error) throw error;

    if (!cards || cards.length === 0) {
      await sendTelegramMessage(
        chatId,
        `💳 *Faturas de Cartão*\n\nVocê não tem cartões de crédito cadastrados.`
      );
      return;
    }

    let message = `💳 *Faturas de Cartão de Crédito*\n\n`;

    for (const card of cards) {
      const fatura = Math.abs(card.saldo_atual);
      const status = card.saldo_atual < 0 ? '🔴' : '🟢';
      
      message += `${status} *${card.nome}*\n`;
      message += `   Fatura: ${formatCurrency(fatura)}\n`;
      message += `   Fechamento: dia ${card.dia_fechamento || 'N/A'}\n`;
      message += `   Vencimento: dia ${card.dia_vencimento || 'N/A'}\n\n`;
    }

    message += `\n💡 Use /pagar para pagar uma fatura.`;

    await sendTelegramMessage(chatId, message);

  } catch (error) {
    console.error('Erro em /fatura:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao buscar faturas: ${errorMsg}`
    );
  }
}

/**
 * Comando /pagar - Inicia o processo de pagamento de fatura
 */
export async function handlePagarCommand(userId: string, chatId: number): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: cards, error } = await supabase
      .from('accounts')
      .select('id, nome, saldo_atual, dia_fechamento, dia_vencimento')
      .eq('user_id', userId)
      .eq('tipo', 'cartao')
      .eq('ativo', true)
      .lt('saldo_atual', 0);

    if (error) throw error;

    if (!cards || cards.length === 0) {
      await sendTelegramMessage(
        chatId,
        `✅ *Nenhuma fatura pendente!*\n\nTodos os seus cartões estão com saldo em dia.`
      );
      return;
    }

    // Criar botões para cada cartão com fatura
    const buttons = (cards as CreditCardAccount[]).map((card) => [{
      text: `💳 ${card.nome} - ${formatCurrency(Math.abs(card.saldo_atual))}`,
      callback_data: `pay_${card.id}`
    }]);

    buttons.push([{
      text: '❌ Cancelar',
      callback_data: 'pay_cancel'
    }]);

    await sendTelegramMessage(
      chatId,
      `💳 *Pagar Fatura*\n\nSelecione o cartão que deseja pagar:`,
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );

  } catch (error) {
    console.error('Erro em /pagar:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao buscar cartões: ${errorMsg}`
    );
  }
}

/**
 * Processa callback de seleção de cartão para pagamento
 */
export async function handlePaymentCallback(
  userId: string,
  chatId: number,
  cardId: string
): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    // Buscar dados do cartão
    const { data: card, error: cardError } = await supabase
      .from('accounts')
      .select('id, nome, saldo_atual')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      await sendTelegramMessage(chatId, '❌ Cartão não encontrado.');
      return;
    }

    // Buscar contas para pagamento
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, nome, saldo_atual')
      .eq('user_id', userId)
      .neq('tipo', 'cartao')
      .eq('ativo', true)
      .gt('saldo_atual', 0);

    if (accountsError || !accounts || accounts.length === 0) {
      await sendTelegramMessage(
        chatId,
        `❌ Nenhuma conta com saldo disponível para pagar a fatura.`
      );
      return;
    }

    const fatura = Math.abs(card.saldo_atual);

    // Criar botões para cada conta disponível
    const buttons = accounts.map((account: { id: string; nome: string; saldo_atual: number }) => [{
      text: `${account.nome} (${formatCurrency(account.saldo_atual)})`,
      callback_data: `confirm_pay_${cardId}_${account.id}_${fatura}`
    }]);

    buttons.push([{
      text: '❌ Cancelar',
      callback_data: 'pay_cancel'
    }]);

    await sendTelegramMessage(
      chatId,
      `💳 *Pagar fatura ${card.nome}*\n` +
      `💰 Valor: ${formatCurrency(fatura)}\n\n` +
      `Selecione a conta de origem:`,
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );

  } catch (error) {
    console.error('Erro no callback de pagamento:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao processar seleção: ${errorMsg}`
    );
  }
}

/**
 * Confirma e executa o pagamento da fatura
 */
export async function confirmPayment(
  userId: string,
  chatId: number,
  cardId: string,
  accountId: string,
  amount: number
): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    // Executar pagamento via function do banco
    const { data: result, error } = await supabase.rpc('process_invoice_payment', {
      p_card_account_id: cardId,
      p_payment_account_id: accountId,
      p_amount: amount
    });

    if (error) throw error;

    if (result?.success) {
      await sendTelegramMessage(
        chatId,
        `✅ *Pagamento realizado com sucesso!*\n\n` +
        `💳 Cartão: ${result.card_name}\n` +
        `💰 Valor pago: ${formatCurrency(result.amount_paid)}\n` +
        `🏦 Conta: ${result.payment_account_name}\n` +
        `📊 Saldo restante na conta: ${formatCurrency(result.new_payment_balance)}\n` +
        `📊 Nova fatura: ${formatCurrency(Math.abs(result.new_card_balance))}`
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `❌ *Pagamento não realizado*\n\n` +
        `Motivo: ${result?.error || 'Saldo insuficiente'}\n` +
        `${result?.missing ? `Faltam: ${formatCurrency(result.missing)}` : ''}`
      );
    }

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao processar pagamento: ${errorMsg}`
    );
  }
}

/**
 * Comando /config_cartao - Configurar automação de pagamentos
 */
export async function handleConfigCartaoCommand(userId: string, chatId: number): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    const { data: cards, error } = await supabase
      .from('accounts')
      .select('id, nome')
      .eq('user_id', userId)
      .eq('tipo', 'cartao')
      .eq('ativo', true);

    if (error) throw error;

    if (!cards || cards.length === 0) {
      await sendTelegramMessage(
        chatId,
        `ℹ️ Você não tem cartões de crédito cadastrados.\n\n` +
        `Cadastre um cartão no aplicativo para gerenciar faturas automaticamente.`
      );
      return;
    }

    // Criar botões para cada cartão
    const buttons = cards.map((card: { id: string; nome: string }) => [{
      text: `⚙️ ${card.nome}`,
      callback_data: `config_${card.id}`
    }]);

    buttons.push([{
      text: '❌ Cancelar',
      callback_data: 'config_cancel'
    }]);

    await sendTelegramMessage(
      chatId,
      `⚙️ *Configurar Automação de Pagamento*\n\n` +
      `Selecione o cartão que deseja configurar:`,
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );

  } catch (error) {
    console.error('Erro em /config_cartao:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao buscar cartões: ${errorMsg}`
    );
  }
}

/**
 * Processa callback de configuração de cartão
 */
export async function handleConfigCallback(
  userId: string,
  chatId: number,
  cardId: string
): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    // Buscar configuração atual
    const { data: settings, error } = await supabase
      .from('credit_card_settings')
      .select('*')
      .eq('account_id', cardId)
      .eq('user_id', userId)
      .single();

    // Buscar dados do cartão
    const { data: card } = await supabase
      .from('accounts')
      .select('nome')
      .eq('id', cardId)
      .single();

    if (!card) {
      await sendTelegramMessage(chatId, '❌ Cartão não encontrado.');
      return;
    }

    const currentSettings: CreditCardSettings = settings || {
      id: '',
      account_id: cardId,
      auto_payment: false,
      default_payment_account_id: null,
      send_reminder: true,
      reminder_days_before: 3,
      allow_partial_payment: false,
      min_balance_warning: 0
    };

    const autoStatus = currentSettings.auto_payment ? '✅ Ativado' : '❌ Desativado';
    const reminderStatus = currentSettings.send_reminder ? '✅ Ativado' : '❌ Desativado';

    const message = `⚙️ *Configurações: ${card.nome}*\n\n` +
      `🤖 Pagamento Automático: ${autoStatus}\n` +
      `🔔 Lembrete: ${reminderStatus}\n` +
      `📅 Dias antes: ${currentSettings.reminder_days_before}\n\n` +
      `Selecione o que deseja alterar:`;

    const keyboard = {
      inline_keyboard: [
        [{ 
          text: `${currentSettings.auto_payment ? '🔴 Desativar' : '🟢 Ativar'} Pagamento Auto`, 
          callback_data: `toggle_auto_${cardId}` 
        }],
        [{ 
          text: `${currentSettings.send_reminder ? '🔴 Desativar' : '🟢 Ativar'} Lembrete`, 
          callback_data: `toggle_reminder_${cardId}` 
        }],
        [{ text: '🏦 Definir Conta Padrão', callback_data: `set_account_${cardId}` }],
        [{ text: '❌ Fechar', callback_data: 'config_cancel' }]
      ]
    };

    await sendTelegramMessage(chatId, message, { reply_markup: keyboard });

  } catch (error) {
    console.error('Erro no callback de config:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao carregar configurações: ${errorMsg}`
    );
  }
}

/**
 * Toggle pagamento automático
 */
export async function toggleAutoPayment(
  userId: string,
  chatId: number,
  cardId: string
): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    // Buscar configuração atual
    const { data: settings } = await supabase
      .from('credit_card_settings')
      .select('auto_payment')
      .eq('account_id', cardId)
      .eq('user_id', userId)
      .single();

    const newValue = !(settings?.auto_payment);

    // Upsert configuração
    const { error } = await supabase
      .from('credit_card_settings')
      .upsert({
        account_id: cardId,
        user_id: userId,
        auto_payment: newValue,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'account_id' 
      });

    if (error) throw error;

    const status = newValue ? '✅ ativado' : '❌ desativado';
    await sendTelegramMessage(
      chatId,
      `🤖 Pagamento automático ${status}!\n\n` +
      `${newValue ? 
        '⚠️ Certifique-se de ter saldo suficiente na conta padrão no dia do vencimento.' : 
        'Você receberá lembretes para pagar manualmente.'}`
    );

    // Recarregar menu de configuração
    await handleConfigCallback(userId, chatId, cardId);

  } catch (error) {
    console.error('Erro ao toggle auto payment:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao alterar configuração: ${errorMsg}`
    );
  }
}

/**
 * Toggle lembrete
 */
export async function toggleReminder(
  userId: string,
  chatId: number,
  cardId: string
): Promise<void> {
  const supabase = createSupabaseClient();
  
  try {
    // Buscar configuração atual
    const { data: settings } = await supabase
      .from('credit_card_settings')
      .select('send_reminder')
      .eq('account_id', cardId)
      .eq('user_id', userId)
      .single();

    const newValue = !(settings?.send_reminder ?? true);

    // Upsert configuração
    const { error } = await supabase
      .from('credit_card_settings')
      .upsert({
        account_id: cardId,
        user_id: userId,
        send_reminder: newValue,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'account_id' 
      });

    if (error) throw error;

    const status = newValue ? '✅ ativado' : '❌ desativado';
    await sendTelegramMessage(
      chatId,
      `🔔 Lembrete de fatura ${status}!`
    );

    // Recarregar menu de configuração
    await handleConfigCallback(userId, chatId, cardId);

  } catch (error) {
    console.error('Erro ao toggle reminder:', error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await sendTelegramMessage(
      chatId,
      `❌ Erro ao alterar configuração: ${errorMsg}`
    );
  }
}
