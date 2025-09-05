-- Script para Debugar o Problema do Histórico
-- Verifica se há dados e se as políticas RLS estão corretas

-- ========================================
-- VERIFICAR DADOS NA TABELA
-- ========================================

-- Contar registros na tabela historico_agendamentos
SELECT COUNT(*) as total_registros FROM public.historico_agendamentos;

-- Ver alguns registros para verificar se existem
SELECT 
    id,
    nome, 
    turma, 
    "data", 
    "horaInicio", 
    "horaFim",
    created_at,
    moved_to_history_at
FROM public.historico_agendamentos 
ORDER BY "data" DESC 
LIMIT 5;

-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA
-- ========================================

-- Ver todas as colunas da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'historico_agendamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAR POLÍTICAS RLS
-- ========================================

-- Ver se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'historico_agendamentos';

-- Ver políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'historico_agendamentos';

-- ========================================
-- CORRIGIR POLÍTICAS RLS SE NECESSÁRIO
-- ========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir leitura pública histórico" ON public.historico_agendamentos;
DROP POLICY IF EXISTS "Permitir inserção histórico" ON public.historico_agendamentos;
DROP POLICY IF EXISTS "Permitir tudo histórico" ON public.historico_agendamentos;

-- Criar política permissiva para leitura
CREATE POLICY "Permitir leitura pública histórico" 
ON public.historico_agendamentos
FOR SELECT 
USING (true);

-- Criar política permissiva para inserção
CREATE POLICY "Permitir inserção histórico" 
ON public.historico_agendamentos
FOR INSERT 
WITH CHECK (true);

-- ========================================
-- TESTE DE INSERÇÃO
-- ========================================

-- Inserir um registro de teste
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
VALUES (
    'Teste Debug',
    'Teste Turma',
    'teste@debug.com',
    ARRAY['Teste Equipment'],
    CURRENT_DATE,
    '10:00',
    '11:00',
    'Teste de debug do histórico',
    NOW(),
    NOW(),
    NOW()
);

-- Verificar se o teste foi inserido
SELECT * FROM public.historico_agendamentos WHERE nome = 'Teste Debug';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Contar novamente após correções
SELECT COUNT(*) as total_final FROM public.historico_agendamentos;

-- Ver dados formatados como o JavaScript espera
SELECT 
    nome,
    turma,
    equipamentos,
    "data",
    "horaInicio",
    "horaFim",
    mensagem
FROM public.historico_agendamentos
ORDER BY "data" DESC, "horaInicio" DESC
LIMIT 10;

/*
========================================
INSTRUÇÕES:
========================================

1. Execute este script passo a passo no Supabase SQL Editor
2. Verifique se há dados na tabela
3. Verifique se as políticas RLS estão corretas
4. Execute as correções se necessário
5. Teste a inserção
6. Acesse o site e teste o botão "Atualizar Histórico"

Se ainda não funcionar, o problema pode ser:
- Conexão com Supabase
- Configuração das chaves de API
- Problema no JavaScript do frontend
*/