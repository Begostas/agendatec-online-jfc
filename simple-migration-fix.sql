-- Script Simples para Migrar Dados ao Histórico
-- Resolve o problema do histórico vazio no site

-- ========================================
-- VERIFICAR DADOS ATUAIS
-- ========================================

-- Ver quantos agendamentos existem
SELECT COUNT(*) as total_agendamentos FROM public.agendamentos;

-- Ver se há dados no histórico
SELECT COUNT(*) as total_historico FROM public.historico_agendamentos;

-- ========================================
-- MIGRAÇÃO SIMPLES - TODOS OS DADOS
-- ========================================

-- Migrar TODOS os agendamentos para o histórico (sem apagar da tabela principal)
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
FROM public.agendamentos;

-- ========================================
-- VERIFICAR RESULTADO
-- ========================================

-- Confirmar que os dados foram migrados
SELECT COUNT(*) as total_no_historico FROM public.historico_agendamentos;

-- Ver alguns registros migrados
SELECT nome, turma, "data", "horaInicio", "horaFim" 
FROM public.historico_agendamentos 
ORDER BY "data" DESC 
LIMIT 5;

/*
========================================
INSTRUÇÕES:
========================================

1. Execute os comandos SELECT primeiro para ver o estado atual
2. Execute o comando INSERT para migrar os dados
3. Execute os comandos de verificação
4. Acesse o site e clique em "Atualizar Histórico"
5. O histórico deve aparecer preenchido

NOTA: Este script não apaga dados da tabela principal.
Se você executar novamente, pode criar duplicatas no histórico.
*/