-- Script rápido para migrar dados antigos para o histórico
-- Execute este script no SQL Editor do Supabase

-- Migrar agendamentos com data anterior a hoje
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
WHERE "data" < CURRENT_DATE;

-- Verificar quantos registros foram migrados
SELECT 
    COUNT(*) as registros_migrados,
    'Dados migrados com sucesso!' as status
FROM public.historico_agendamentos;

-- Opcional: Remover os dados antigos da tabela principal
-- Descomente a linha abaixo apenas se você tiver certeza
-- DELETE FROM public.agendamentos WHERE "data" < CURRENT_DATE;