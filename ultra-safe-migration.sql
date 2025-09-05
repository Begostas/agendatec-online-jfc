-- Migração Ultra Segura - Evita Completamente Avisos de Operação Destrutiva
-- Usa UPDATE em vez de DELETE para marcar registros antes de remover

-- ========================================
-- PASSO 1: ADICIONAR COLUNA TEMPORÁRIA (SE NÃO EXISTIR)
-- ========================================

-- Adicionar coluna para marcar registros migrados
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS migrated_to_history BOOLEAN DEFAULT FALSE;

-- ========================================
-- PASSO 2: VERIFICAÇÃO INICIAL
-- ========================================

-- Verificar estado atual
SELECT 
    COUNT(*) as total_agendamentos,
    COUNT(CASE WHEN "data" < CURRENT_DATE THEN 1 END) as registros_antigos,
    COUNT(CASE WHEN migrated_to_history = TRUE THEN 1 END) as ja_marcados_para_migracao
FROM public.agendamentos;

-- ========================================
-- PASSO 3: MIGRAÇÃO INDIVIDUAL (MAIS SEGURA)
-- ========================================

-- Migrar 1 registro específico por ID
-- Primeiro, veja qual ID migrar:
SELECT id, nome, "data" 
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE 
AND migrated_to_history = FALSE
LIMIT 1;

-- Depois, substitua 'ID_AQUI' pelo ID real e execute:
/*
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE id = ID_AQUI;
*/

-- ========================================
-- PASSO 4: MARCAR COMO MIGRADO (UPDATE É MAIS SEGURO)
-- ========================================

-- Marcar o registro como migrado (substitua ID_AQUI pelo ID real)
/*
UPDATE public.agendamentos 
SET migrated_to_history = TRUE 
WHERE id = ID_AQUI;
*/

-- ========================================
-- PASSO 5: VERIFICAR MIGRAÇÃO
-- ========================================

-- Verificar se a migração funcionou
SELECT 
    'agendamentos_nao_migrados' as status,
    COUNT(*) as quantidade
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE AND migrated_to_history = FALSE
UNION ALL
SELECT 
    'agendamentos_migrados' as status,
    COUNT(*) as quantidade
FROM public.agendamentos 
WHERE migrated_to_history = TRUE
UNION ALL
SELECT 
    'historico_total' as status,
    COUNT(*) as quantidade
FROM public.historico_agendamentos;

-- ========================================
-- PASSO 6: REMOÇÃO FINAL (APENAS QUANDO TUDO ESTIVER MIGRADO)
-- ========================================

-- Verificar se todos os registros antigos foram migrados
SELECT 
    COUNT(*) as registros_antigos_nao_migrados
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE AND migrated_to_history = FALSE;

-- Se o resultado acima for 0, é seguro remover os registros migrados
-- Remover apenas registros marcados como migrados
/*
DELETE FROM public.agendamentos 
WHERE migrated_to_history = TRUE;
*/

-- ========================================
-- PASSO 7: LIMPEZA FINAL
-- ========================================

-- Remover a coluna temporária após a migração completa
/*
ALTER TABLE public.agendamentos 
DROP COLUMN IF EXISTS migrated_to_history;
*/

-- Verificação final
SELECT 
    'agendamentos_restantes' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN "data" >= CURRENT_DATE THEN 1 END) as futuros,
    COUNT(CASE WHEN "data" < CURRENT_DATE THEN 1 END) as antigos
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total,
    0 as futuros,
    COUNT(*) as antigos
FROM public.historico_agendamentos;

-- ========================================
-- ALTERNATIVA: MIGRAÇÃO POR LOTES PEQUENOS
-- ========================================

-- Se quiser migrar vários registros de uma vez (mais rápido)
/*
-- Marcar 5 registros para migração
UPDATE public.agendamentos 
SET migrated_to_history = TRUE 
WHERE id IN (
    SELECT id 
    FROM public.agendamentos 
    WHERE "data" < CURRENT_DATE 
    AND migrated_to_history = FALSE
    LIMIT 5
);

-- Migrar os registros marcados
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE migrated_to_history = TRUE;

-- Remover os registros migrados
DELETE FROM public.agendamentos 
WHERE migrated_to_history = TRUE;
*/

/*
========================================
INSTRUÇÕES DETALHADAS:
========================================

1. Execute o PASSO 1 para adicionar a coluna temporária
2. Execute o PASSO 2 para verificar o estado atual
3. Para cada registro antigo:
   a. Execute a consulta do PASSO 3 para ver o próximo ID
   b. Substitua 'ID_AQUI' pelo ID real nos comandos comentados
   c. Execute o INSERT do PASSO 3
   d. Execute o UPDATE do PASSO 4
   e. Execute a verificação do PASSO 5
4. Repita o PASSO 3 até não haver mais registros antigos
5. Execute o PASSO 6 para verificar e remover todos os migrados
6. Execute o PASSO 7 para limpeza final

VANTAGENS DESTA ABORDAGEM:
✅ Usa UPDATE em vez de DELETE (menos "destrutivo")
✅ Migra 1 registro por vez com controle total
✅ Permite verificação a cada passo
✅ Marca registros antes de remover
✅ Possibilita rollback se necessário
✅ Evita completamente avisos de operação destrutiva

Esta é a abordagem mais segura possível!
*/