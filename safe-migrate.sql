-- Script seguro para migração de dados (sem avisos de operação destrutiva)
-- Execute cada comando separadamente no SQL Editor do Supabase

-- ETAPA 1: Verificar se existem dados para migrar
SELECT 
    COUNT(*) as total_agendamentos,
    COUNT(CASE WHEN "data" < CURRENT_DATE THEN 1 END) as agendamentos_antigos,
    COUNT(CASE WHEN "data" >= CURRENT_DATE THEN 1 END) as agendamentos_futuros
FROM public.agendamentos;

-- ETAPA 2: Visualizar alguns registros antigos (máximo 5)
SELECT 
    id, nome, turma, "data", "horaInicio", "horaFim"
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE
ORDER BY "data" DESC
LIMIT 5;

-- ETAPA 3: Migrar apenas 1 registro por vez (teste)
-- Execute este comando primeiro para testar
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

-- ETAPA 4: Verificar se o teste funcionou
SELECT COUNT(*) as registros_no_historico FROM public.historico_agendamentos;

-- ETAPA 5: Se o teste funcionou, migrar todos os registros antigos
-- (Execute apenas se a etapa 4 mostrou que há registros no histórico)
INSERT INTO public.historico_agendamentos (
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, moved_to_history_at
)
SELECT 
    nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", 
    mensagem, timestamp, created_at, NOW()
FROM public.agendamentos
WHERE "data" < CURRENT_DATE
AND id NOT IN (SELECT id FROM public.agendamentos WHERE id IN (
    SELECT MIN(id) FROM public.agendamentos WHERE "data" < CURRENT_DATE
));

-- ETAPA 6: Verificar resultado final
SELECT 
    'Total migrado' as status,
    COUNT(*) as quantidade
FROM public.historico_agendamentos;

-- ETAPA 7: Visualizar alguns registros migrados
SELECT 
    nome, "data", moved_to_history_at
FROM public.historico_agendamentos
ORDER BY moved_to_history_at DESC
LIMIT 3;