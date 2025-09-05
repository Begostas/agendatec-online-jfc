-- Script para Adicionar Políticas RLS na Tabela historico_agendamentos
-- Este é o problema! Sem políticas RLS, o Supabase bloqueia o acesso aos dados

-- ========================================
-- VERIFICAR ESTADO ATUAL
-- ========================================

-- Ver se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'historico_agendamentos';

-- Ver políticas existentes (provavelmente nenhuma)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'historico_agendamentos';

-- ========================================
-- HABILITAR RLS (se não estiver habilitado)
-- ========================================

ALTER TABLE public.historico_agendamentos ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CRIAR POLÍTICAS NECESSÁRIAS
-- ========================================

-- Política para permitir leitura pública (SELECT)
CREATE POLICY "Permitir leitura pública histórico" 
ON public.historico_agendamentos
FOR SELECT 
USING (true);

-- Política para permitir inserção pública (INSERT)
CREATE POLICY "Permitir inserção pública histórico" 
ON public.historico_agendamentos
FOR INSERT 
WITH CHECK (true);

-- Política para permitir atualização pública (UPDATE)
CREATE POLICY "Permitir atualização pública histórico" 
ON public.historico_agendamentos
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Política para permitir exclusão pública (DELETE)
CREATE POLICY "Permitir exclusão pública histórico" 
ON public.historico_agendamentos
FOR DELETE 
USING (true);

-- ========================================
-- VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ========================================

-- Ver políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'historico_agendamentos'
ORDER BY policyname;

-- ========================================
-- TESTAR ACESSO APÓS CRIAR POLÍTICAS
-- ========================================

-- Contar registros (deve funcionar agora)
SELECT COUNT(*) as total_registros FROM public.historico_agendamentos;

-- Ver alguns registros
SELECT 
    nome, 
    turma, 
    "data", 
    "horaInicio", 
    "horaFim"
FROM public.historico_agendamentos 
ORDER BY "data" DESC 
LIMIT 5;

-- ========================================
-- INSERIR DADOS DE TESTE (OPCIONAL)
-- ========================================

-- Se a tabela estiver vazia, inserir dados de teste
-- (descomente se necessário)
/*
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
VALUES 
(
    'Teste Política',
    '3º Ano A',
    'teste@escola.com',
    ARRAY['Projetor', 'Notebook'],
    '2025-01-01',
    '08:00',
    '09:00',
    'Teste após criar políticas RLS',
    NOW(),
    NOW(),
    NOW()
);
*/

/*
========================================
EXPLICAÇÃO DO PROBLEMA:
========================================

O Supabase usa Row Level Security (RLS) por padrão.
Sem políticas RLS, mesmo com dados na tabela, 
o acesso é BLOQUEADO para usuários anônimos.

Isso explica por que:
- A tabela tem dados
- Mas o JavaScript não consegue acessá-los
- E retorna "Nenhum agendamento no histórico"

Após executar este script:
- As políticas RLS serão criadas
- O acesso público será permitido
- O histórico funcionará no site

========================================
INSTRUÇÕES:
========================================

1. Execute este script no Supabase SQL Editor
2. Verifique se as políticas foram criadas
3. Teste o acesso aos dados
4. Acesse o site e clique em "Atualizar Histórico"
5. O histórico deve aparecer funcionando!
*/