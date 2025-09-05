-- Script com Sintaxe Corrigida para Migração
-- Resolve o erro de sintaxe na linha do INSERT

-- ========================================
-- PASSO 1: VERIFICAÇÃO INICIAL
-- ========================================

-- Verificar registros antigos disponíveis
SELECT 
    id, nome, "data", "horaInicio", "horaFim"
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE 
LIMIT 1;

-- ========================================
-- PASSO 2: MIGRAÇÃO CORRIGIDA (SINTAXE ADEQUADA)
-- ========================================

-- Comando INSERT corrigido - sem erro de sintaxe
INSERT INTO public.historico_agendamentos (
    nome, 
    turma, 
    contato, 
    equipamentos, 
    "data", 
    "horaInicio", 
    "horaFim", 
    mensagem, 
    timestamp, 
    created_at, 
    moved_to_history_at
)
SELECT 
    nome, 
    turma, 
    contato, 
    equipamentos, 
    "data", 
    "horaInicio", 
    "horaFim", 
    mensagem, 
    timestamp, 
    created_at, 
    NOW()
FROM public.agendamentos
WHERE "data" < CURRENT_DATE
LIMIT 1;

-- ========================================
-- PASSO 3: VERIFICAR SE A MIGRAÇÃO FUNCIONOU
-- ========================================

-- Verificar se o registro foi inserido no histórico
SELECT 
    COUNT(*) as total_no_historico,
    MAX(moved_to_history_at) as ultima_migracao
FROM public.historico_agendamentos;

-- ========================================
-- PASSO 4: REMOÇÃO SEGURA
-- ========================================

-- Remover o registro que foi migrado
DELETE FROM public.agendamentos 
WHERE id = (
    SELECT id 
    FROM public.agendamentos 
    WHERE "data" < CURRENT_DATE 
    LIMIT 1
);

-- ========================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar quantos registros antigos ainda restam
SELECT 
    COUNT(*) as registros_antigos_restantes
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE;

-- Verificar o estado das duas tabelas
SELECT 
    'agendamentos' as tabela,
    COUNT(*) as total_registros
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total_registros
FROM public.historico_agendamentos;

-- ========================================
-- ALTERNATIVA: MIGRAÇÃO POR ID ESPECÍFICO
-- ========================================

-- Se souber o ID específico, use este comando (substitua 123 pelo ID real):
/*
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE id = 123;

-- Depois remover o registro específico:
DELETE FROM public.agendamentos WHERE id = 123;
*/

-- ========================================
-- COMANDOS DE VERIFICAÇÃO DETALHADA
-- ========================================

-- Ver estrutura da tabela historico_agendamentos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'historico_agendamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver estrutura da tabela agendamentos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/*
========================================
INSTRUÇÕES DE USO:
========================================

1. Execute o PASSO 1 para ver se há registros antigos
2. Execute o PASSO 2 para migrar 1 registro
3. Execute o PASSO 3 para verificar se funcionou
4. Execute o PASSO 4 para remover o registro migrado
5. Execute o PASSO 5 para verificar o resultado
6. Repita os passos 1-5 até não haver mais registros antigos

ERRO CORRIGIDO:
- Removido o "(2)" que estava causando erro de sintaxe
- Formatação melhorada para legibilidade
- Adicionadas verificações de estrutura das tabelas

Este script deve executar sem erros de sintaxe.
*/