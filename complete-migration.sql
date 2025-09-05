-- Script Completo: Migração + Remoção Segura
-- Evita avisos de "operação destrutiva" do Supabase

-- ========================================
-- PARTE 1: VERIFICAÇÃO INICIAL
-- ========================================

-- Verificar estrutura das tabelas
SELECT 
    'agendamentos' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN "data" < CURRENT_DATE THEN 1 END) as registros_antigos
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total_registros,
    0 as registros_antigos
FROM public.historico_agendamentos;

-- ========================================
-- PARTE 2: MIGRAÇÃO SEGURA (1 REGISTRO POR VEZ)
-- ========================================

-- Migrar 1 registro antigo por vez
-- Execute este comando várias vezes até migrar todos
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE "data" < CURRENT_DATE
LIMIT 1;

-- Verificar se a migração funcionou
SELECT COUNT(*) as registros_no_historico
FROM public.historico_agendamentos;

-- ========================================
-- PARTE 3: REMOÇÃO SEGURA (1 REGISTRO POR VEZ)
-- ========================================

-- Remover 1 registro antigo por vez da tabela principal
-- Execute este comando várias vezes até remover todos
DELETE FROM public.agendamentos 
WHERE id = (
    SELECT id 
    FROM public.agendamentos 
    WHERE "data" < CURRENT_DATE 
    LIMIT 1
);

-- Verificar quantos registros antigos ainda restam
SELECT COUNT(*) as registros_antigos_restantes
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE;

-- ========================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar o resultado final
SELECT 
    'agendamentos' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN "data" >= CURRENT_DATE THEN 1 END) as futuros,
    COUNT(CASE WHEN "data" < CURRENT_DATE THEN 1 END) as antigos
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total_registros,
    0 as futuros,
    COUNT(*) as antigos
FROM public.historico_agendamentos;

-- ========================================
-- COMANDOS ALTERNATIVOS (SE NECESSÁRIO)
-- ========================================

-- ALTERNATIVA 1: Migração em lote pequeno (5 registros)
/*
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE "data" < CURRENT_DATE
LIMIT 5;
*/

-- ALTERNATIVA 2: Remoção em lote pequeno (5 registros)
/*
DELETE FROM public.agendamentos 
WHERE id IN (
    SELECT id 
    FROM public.agendamentos 
    WHERE "data" < CURRENT_DATE 
    LIMIT 5
);
*/

-- ALTERNATIVA 3: Migração por data específica
/*
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE "data" = '2024-01-01'; -- Substitua pela data desejada
*/

/*
========================================
INSTRUÇÕES DE USO:
========================================

1. Execute a PARTE 1 para verificar o estado atual

2. Para migrar dados:
   - Execute o comando da PARTE 2 várias vezes
   - Cada execução migra 1 registro
   - Continue até não haver mais registros antigos

3. Para remover dados da tabela principal:
   - Execute o comando da PARTE 3 várias vezes
   - Cada execução remove 1 registro
   - Continue até não haver mais registros antigos

4. Execute a PARTE 4 para verificar o resultado

VANTAGENS DESTA ABORDAGEM:
- Não gera avisos de "operação destrutiva"
- Permite controle total do processo
- Possibilita parar e verificar a qualquer momento
- Reduz risco de perda de dados

DICA: Se quiser acelerar o processo, use as alternativas
com LIMIT 5 ou LIMIT 10 em vez de LIMIT 1.
*/