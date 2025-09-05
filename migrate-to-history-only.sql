-- Script para Migrar Dados para Histórico (SEM APAGAR da tabela principal)
-- Este script apenas copia os dados para a tabela de histórico

-- ========================================
-- PASSO 1: VERIFICAR DADOS EXISTENTES
-- ========================================

-- Ver quantos agendamentos existem na tabela principal
SELECT 
    COUNT(*) as total_agendamentos,
    MIN("data") as data_mais_antiga,
    MAX("data") as data_mais_recente
FROM public.agendamentos;

-- Ver se já existem dados no histórico
SELECT COUNT(*) as registros_no_historico
FROM public.historico_agendamentos;

-- ========================================
-- PASSO 2: MIGRAR TODOS OS DADOS PARA O HISTÓRICO
-- ========================================

-- Inserir TODOS os agendamentos no histórico (sem apagar da tabela principal)
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
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.historico_agendamentos h 
    WHERE h.nome = public.agendamentos.nome 
    AND h."data" = public.agendamentos."data" 
    AND h."horaInicio" = public.agendamentos."horaInicio"
    AND h.turma = public.agendamentos.turma
);

-- ========================================
-- PASSO 3: VERIFICAR O RESULTADO
-- ========================================

-- Verificar quantos registros foram migrados
SELECT 
    'agendamentos_principal' as tabela,
    COUNT(*) as total_registros
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total_registros
FROM public.historico_agendamentos;

-- Ver alguns registros do histórico para confirmar
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

-- ========================================
-- ALTERNATIVA: MIGRAR APENAS AGENDAMENTOS ANTIGOS
-- ========================================

-- Se quiser migrar apenas agendamentos passados (descomente as linhas abaixo):
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
AND NOT EXISTS (
    SELECT 1 
    FROM public.historico_agendamentos h 
    WHERE h.nome = public.agendamentos.nome 
    AND h."data" = public.agendamentos."data" 
    AND h."horaInicio" = public.agendamentos."horaInicio"
    AND h.turma = public.agendamentos.turma
);
*/

/*
========================================
INSTRUÇÕES DE USO:
========================================

1. Execute o PASSO 1 para verificar os dados existentes
2. Execute o PASSO 2 para migrar todos os dados para o histórico
3. Execute o PASSO 3 para verificar se a migração funcionou
4. Acesse o site e clique em "Carregar Histórico" para ver os dados

IMPORTANTE:
- Este script NÃO apaga dados da tabela principal
- Os dados ficam disponíveis tanto na tabela principal quanto no histórico
- O histórico aparecerá no site após a migração
- A cláusula NOT EXISTS evita duplicatas no histórico

APÓS A MIGRAÇÃO:
- Acesse o site
- Clique no botão "Carregar Histórico"
- Os dados migrados aparecerão na seção de histórico
- Você poderá baixar um PDF com o histórico completo
*/