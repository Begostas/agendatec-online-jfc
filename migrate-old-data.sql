-- Script para migrar dados antigos da tabela agendamentos para historico_agendamentos
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Verificar quantos agendamentos antigos existem
SELECT COUNT(*) as total_agendamentos_antigos
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE;

-- PASSO 2: Visualizar os dados que serão migrados (opcional)
SELECT id, nome, turma, "data", "horaInicio", "horaFim"
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE
ORDER BY "data" DESC
LIMIT 10;

-- PASSO 3: Migrar os dados antigos para a tabela de histórico
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
    NOW() as moved_to_history_at
FROM public.agendamentos
WHERE "data" < CURRENT_DATE;

-- PASSO 4: Verificar se a migração foi bem-sucedida
SELECT COUNT(*) as total_no_historico
FROM public.historico_agendamentos;

-- PASSO 5: Remover os dados antigos da tabela principal (CUIDADO!)
-- Só execute este comando se você tiver certeza de que a migração funcionou
-- DELETE FROM public.agendamentos WHERE "data" < CURRENT_DATE;

-- PASSO 6: Verificar o resultado final
SELECT 
    'agendamentos' as tabela,
    COUNT(*) as total
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total
FROM public.historico_agendamentos;

-- PASSO 7: Visualizar alguns registros do histórico para confirmar
SELECT 
    nome, 
    turma, 
    "data", 
    "horaInicio", 
    "horaFim",
    moved_to_history_at
FROM public.historico_agendamentos
ORDER BY moved_to_history_at DESC
LIMIT 5;

-- OPCIONAL: Script para migrar TODOS os agendamentos (não apenas os antigos)
-- Descomente as linhas abaixo se quiser migrar todos os dados
/*
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos;
*/