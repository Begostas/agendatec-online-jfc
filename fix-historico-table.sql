-- Script para corrigir a tabela historico_agendamentos
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'historico_agendamentos';

-- PASSO 2: Se a tabela existir mas estiver com problemas, remova-a primeiro
-- ATENÇÃO: Só descomente a linha abaixo se você tiver certeza
-- DROP TABLE IF EXISTS public.historico_agendamentos CASCADE;

-- PASSO 3: Criar a tabela corretamente com aspas duplas
CREATE TABLE IF NOT EXISTS public.historico_agendamentos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    contato VARCHAR(255) NOT NULL,
    equipamentos TEXT[] NOT NULL,
    "data" DATE NOT NULL,
    "horaInicio" TIME NOT NULL,
    "horaFim" TIME NOT NULL,
    mensagem TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    moved_to_history_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSO 4: Criar índices
CREATE INDEX IF NOT EXISTS idx_historico_data ON public.historico_agendamentos("data");
CREATE INDEX IF NOT EXISTS idx_historico_timestamp ON public.historico_agendamentos(timestamp);
CREATE INDEX IF NOT EXISTS idx_historico_moved_at ON public.historico_agendamentos(moved_to_history_at);

-- PASSO 5: Habilitar RLS
ALTER TABLE public.historico_agendamentos ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Criar políticas de segurança
DROP POLICY IF EXISTS "Permitir leitura pública histórico" ON public.historico_agendamentos;
DROP POLICY IF EXISTS "Permitir inserção histórico" ON public.historico_agendamentos;

CREATE POLICY "Permitir leitura pública histórico" ON public.historico_agendamentos
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção histórico" ON public.historico_agendamentos
    FOR INSERT WITH CHECK (true);

-- PASSO 7: Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'historico_agendamentos'
ORDER BY ordinal_position;

-- PASSO 8: Testar uma inserção simples
-- INSERT INTO public.historico_agendamentos 
-- (nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", mensagem)
-- VALUES 
-- ('Teste', 'Teste', 'teste@teste.com', ARRAY['Teste'], CURRENT_DATE, '08:00', '09:00', 'Teste');

-- PASSO 9: Verificar se a inserção funcionou
-- SELECT * FROM public.historico_agendamentos WHERE nome = 'Teste';

-- PASSO 10: Remover o teste
-- DELETE FROM public.historico_agendamentos WHERE nome = 'Teste';