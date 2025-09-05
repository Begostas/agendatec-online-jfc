-- Script para remover dados antigos de forma segura
-- Evita o aviso de "operação destrutiva" do Supabase

-- PASSO 1: Verificar quantos registros serão removidos
SELECT 
    COUNT(*) as total_registros_antigos,
    MIN("data") as data_mais_antiga,
    MAX("data") as data_mais_recente_antiga
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE;

-- PASSO 2: Visualizar alguns registros que serão removidos (opcional)
SELECT 
    id, nome, "data", "horaInicio", "horaFim"
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE
ORDER BY "data" DESC
LIMIT 5;

-- PASSO 3A: OPÇÃO SEGURA - Remover 1 registro por vez (recomendado)
-- Execute este comando várias vezes até não haver mais registros antigos
DELETE FROM public.agendamentos 
WHERE id = (
    SELECT id 
    FROM public.agendamentos 
    WHERE "data" < CURRENT_DATE 
    LIMIT 1
);

-- Verificar se ainda há registros antigos
SELECT COUNT(*) as registros_antigos_restantes
FROM public.agendamentos 
WHERE "data" < CURRENT_DATE;

-- PASSO 3B: ALTERNATIVA - Remover por data específica
-- Substitua '2024-01-01' pela data limite desejada
-- DELETE FROM public.agendamentos WHERE "data" = '2024-01-01';

-- PASSO 3C: ALTERNATIVA - Remover em lotes pequenos
-- DELETE FROM public.agendamentos 
-- WHERE id IN (
--     SELECT id 
--     FROM public.agendamentos 
--     WHERE "data" < CURRENT_DATE 
--     LIMIT 10
-- );

-- PASSO 4: Verificação final
SELECT 
    COUNT(*) as total_agendamentos_restantes,
    COUNT(CASE WHEN "data" >= CURRENT_DATE THEN 1 END) as agendamentos_futuros,
    COUNT(CASE WHEN "data" < CURRENT_DATE THEN 1 END) as agendamentos_antigos_restantes
FROM public.agendamentos;

-- PASSO 5: Verificar se a migração foi bem-sucedida
SELECT 
    'agendamentos' as tabela,
    COUNT(*) as total_registros
FROM public.agendamentos
UNION ALL
SELECT 
    'historico_agendamentos' as tabela,
    COUNT(*) as total_registros
FROM public.historico_agendamentos;

/*
INSTRUÇÕES DE USO:

1. Execute o PASSO 1 para ver quantos registros serão removidos
2. Execute o PASSO 2 para visualizar alguns registros (opcional)
3. Escolha uma das opções do PASSO 3:
   - 3A: Mais segura, remove 1 por vez
   - 3B: Remove por data específica
   - 3C: Remove em lotes pequenos
4. Execute os PASSOS 4 e 5 para verificar o resultado

DICA: A opção 3A é a mais segura e não deve gerar avisos de operação destrutiva.
*/