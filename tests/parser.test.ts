
import { describe, it, expect } from 'vitest';
import {
    parseTransaction,
    extrairValor,
    identificarTipo,
    encontrarContaSimilar
} from '../supabase/functions/telegram-webhook/_shared/parsers/transaction';
import { AccountData, CategoryData } from '../supabase/functions/telegram-webhook/_shared/types';

// Mock Data
const mockAccounts: AccountData[] = [
    { id: '1', nome: 'Nubank', tipo: 'conta_corrente' },
    { id: '2', nome: 'Santander', tipo: 'conta_corrente' },
    { id: '3', nome: 'Cartão Nubank', tipo: 'cartao_credito' },
    { id: '4', nome: 'Carteira', tipo: 'dinheiro' }
];

const mockCategories: CategoryData[] = [
    { id: 'c1', nome: 'Alimentação', tipo: 'despesa', parent_id: null, keywords: [] },
    { id: 's1', nome: 'Mercado', tipo: 'despesa', parent_id: 'c1', keywords: ['mercado', 'compras'] },
    { id: 'c2', nome: 'Transporte', tipo: 'despesa', parent_id: null, keywords: [] },
    { id: 's2', nome: 'Uber', tipo: 'despesa', parent_id: 'c2', keywords: ['uber', '99'] }
];

describe('Transaction Parser', () => {

    describe('extrairValor', () => {
        it('should extract simple values', () => {
            expect(extrairValor('gastei 50 reais')).toBe(50);
            expect(extrairValor('50.50')).toBe(50.5);
        });

        it('should extract currency formatted values', () => {
            expect(extrairValor('R$ 1.250,00')).toBe(1250);
            expect(extrairValor('R$1250,50')).toBe(1250.5);
        });

        it('should return null for no value', () => {
            expect(extrairValor('gastei muito hoje')).toBe(null);
        });
    });

    describe('identificarTipo', () => {
        it('should identify expenses', () => {
            expect(identificarTipo('gastei 50')).toBe('despesa');
            expect(identificarTipo('comprei algo')).toBe('despesa');
            expect(identificarTipo('paguei conta')).toBe('despesa');
        });

        it('should identify income', () => {
            expect(identificarTipo('recebi 1000')).toBe('receita');
            expect(identificarTipo('caiu o salario')).toBe('receita');
        });

        it('should identify transfers', () => {
            expect(identificarTipo('transferi 500')).toBe('transferencia');
            expect(identificarTipo('passei um pix')).toBe('transferencia');
        });
    });

    describe('encontrarContaSimilar', () => {
        it('should find account by exact name', () => {
            const { conta, similaridade } = encontrarContaSimilar('nubank', mockAccounts);
            expect(conta?.nome).toBe('Nubank');
            expect(similaridade).toBe(100);
        });

        it('should find account by alias', () => {
            const { conta } = encontrarContaSimilar('roxinho', mockAccounts);
            expect(conta?.nome).toBe('Nubank');
        });

        it('should differentiate credit card', () => {
            // "cartão nubank" should match the credit card, not the checking account
            const { conta } = encontrarContaSimilar('cartão nubank', mockAccounts);
            expect(conta?.id).toBe('3');
        });
    });

    describe('parseTransaction (Integration)', () => {
        it('should parse a complete expense sentence', () => {
            const text = 'gastei 50 no mercado no nubank';
            const result = parseTransaction(text, mockAccounts, mockCategories);

            expect(result.valor).toBe(50);
            expect(result.tipo).toBe('despesa');
            // "nubank" could match Account 1 (Nubank) or 3 (Cartão Nubank) depending on logic,
            // but usually "no nubank" implies checking if not specified "cartão".
            expect(result.conta_origem).toBeTruthy();
            expect(result.categoria_nome).toBe('Alimentação'); // Parent of Mercado
            expect(result.subcategoria_nome).toBe('Mercado');
        });

        it('should parse "Uber 15.90 no cartão nubank"', () => {
            const text = 'Uber 15.90 no cartão nubank';
            const result = parseTransaction(text, mockAccounts, mockCategories);

            expect(result.valor).toBe(15.9);
            expect(result.conta_origem).toBe('3'); // Card
            expect(result.subcategoria_nome).toBe('Uber');
        });
    });

});
