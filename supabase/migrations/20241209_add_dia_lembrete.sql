-- Migration: add_dia_lembrete
-- Adiciona coluna para armazenar o dia do mês para lembrete de vencimento

ALTER TABLE accounts
  ADD COLUMN dia_lembrete INTEGER;
