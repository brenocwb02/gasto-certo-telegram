import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, subMonths, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';

export function useCardInvoice(account: any) {
    const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Calculate Cycle
    const cycle = useMemo(() => {
        if (!account) return null;

        const closingDay = account.dia_fechamento || 1;
        const dueDay = account.dia_vencimento || 10;
        const today = new Date();

        // Determine the reference month for the "Current" invoice
        // If today is past closing, the "Current" open invoice is next month's
        // But usually users want to see the invoice they are currently building or the one about to close.

        let baseDate = today;

        // If today is past closing, we are in the "next" invoice territory for spending
        // e.g. Closing 5th. Today 6th. Current spending goes to next month's invoice.
        if (today.getDate() >= closingDay) {
            baseDate = addMonths(today, 1);
        }

        // Logic from InvoiceDetails.tsx for determining the "Invoice Month"
        // If due day is before closing day (e.g. Due 10th, Closing 28th), the invoice is referenced by Due Date month.
        // So if we are in the cycle ending Jan 28, the due date is Feb 10, so it's "Feb Invoice".
        if (dueDay < closingDay) {
            baseDate = addMonths(baseDate, 1);
        }

        // Now calculate the cycle dates based on this "Base Invoice Month"
        let due = new Date(baseDate.getFullYear(), baseDate.getMonth(), dueDay);
        // Closing is usually same month as Due, unless Due < Closing (which we handled by shifting Base, but wait...)

        // Let's stick strictly to InvoiceDetails logic which works:
        // InvoiceDetails:
        // const due = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dDay);
        // let closing = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), cDay);
        // if (dDay < cDay) { closing = subMonths(closing, 1); }
        // ...

        // So our 'baseDate' here effectively acts as 'selectedDate' (The Invoice Month)
        let closing = new Date(baseDate.getFullYear(), baseDate.getMonth(), closingDay);

        if (dueDay < closingDay) {
            closing = subMonths(closing, 1);
        }

        const previousClosing = subMonths(closing, 1);
        const opening = new Date(previousClosing);
        opening.setDate(previousClosing.getDate() + 1);

        return { opening, closing, due };
    }, [account]);

    useEffect(() => {
        if (!account || !cycle) return;

        const fetchInvoiceTotal = async () => {
            setLoading(true);
            try {
                // Determine which accounts to fetch (Principal + Dependents)
                const cardIds = [account.id];

                // If this is a principal card, fetch dependents
                if (!account.parent_account_id) {
                    const { data: dependents } = await supabase
                        .from('accounts')
                        .select('id')
                        .eq('parent_account_id', account.id);

                    if (dependents) {
                        cardIds.push(...dependents.map(d => d.id));
                    }
                }

                // Fetch transactions
                const idsString = `(${cardIds.join(',')})`;
                const { data: transactions, error } = await supabase
                    .from('transactions')
                    .select('valor, conta_origem_id, conta_destino_id, tipo, data_transacao')
                    .or(`conta_origem_id.in.${idsString},conta_destino_id.in.${idsString}`)
                    .gte('data_transacao', startOfDay(cycle.opening).toISOString())
                    .lte('data_transacao', endOfDay(cycle.closing).toISOString());

                if (error) throw error;

                // Sum Values
                let total = 0;
                (transactions || []).forEach(t => {
                    const val = Number(t.valor);
                    // Expense on card
                    if (cardIds.includes(t.conta_origem_id) && (t.tipo === 'despesa' || t.tipo === 'transferencia')) {
                        total += val;
                    }
                    // Payment/Credit to card
                    else if (cardIds.includes(t.conta_destino_id)) {
                        total -= val;
                    }
                });

                setInvoiceAmount(total);

            } catch (err) {
                console.error("Error fetching invoice total", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoiceTotal();
    }, [account?.id, cycle]);

    return { invoiceAmount, cycle, loading };
}
