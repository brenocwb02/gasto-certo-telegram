-- Migration: Security Hardening (RLS) e Fix de Exposição de Dados
-- Data: 2025-12-13

-- 1. Ativar RLS nas tabelas principais se ainda não estiver ativo
ALTER TABLE IF EXISTS "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."telegram_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."categories" ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que o service_role (usado pelo Edge Function) tenha acesso total
-- Isso é crucial para o Webhook funcionar pois ele roda como service_role em background muitas vezes
-- SE JÁ EXISTIREM POLÍTICAS, ELAS DEVEM SER REVISADAS. Aqui criamos políticas permissivas APENAS para service_role.

-- Policy: Profiles (Service Role Full Access)
DROP POLICY IF EXISTS "Service Role Full Access Profiles" ON "public"."profiles";
CREATE POLICY "Service Role Full Access Profiles" ON "public"."profiles"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Telegram Sessions (Service Role Full Access)
DROP POLICY IF EXISTS "Service Role Full Access Sessions" ON "public"."telegram_sessions";
CREATE POLICY "Service Role Full Access Sessions" ON "public"."telegram_sessions"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Transactions (Service Role Full Access)
DROP POLICY IF EXISTS "Service Role Full Access Transactions" ON "public"."transactions";
CREATE POLICY "Service Role Full Access Transactions" ON "public"."transactions"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Accounts (Service Role Full Access)
DROP POLICY IF EXISTS "Service Role Full Access Accounts" ON "public"."accounts";
CREATE POLICY "Service Role Full Access Accounts" ON "public"."accounts"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Restringir acesso público (Anon) - NINGUÉM não autenticado deve ver nada
-- As políticas padrão "deny all" do RLS já cuidam disso se não houver policy "anon",
-- mas garantimos revogando acesso explícito se houver.
REVOKE ALL ON "public"."telegram_sessions" FROM anon;
REVOKE ALL ON "public"."transactions" FROM anon;

-- 4. Funções de Banco de Dados: Definir search_path para segurança (evitar hijacking)
-- Exemplo genérico para funções comuns (ajustar conforme nomes reais do projeto)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS FROM service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS FROM authenticated;

-- Hardening específico para funções RPC se existirem (exemplo)
-- ALTER FUNCTION "public"."alguma_funcao" SET search_path = public;
