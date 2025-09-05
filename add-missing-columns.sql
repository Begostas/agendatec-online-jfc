-- Script para adicionar as colunas faltantes na tabela historico_agendamentos
-- Execute este script no SQL Editor do Supabase

-- Adicionar as colunas que estão faltando
ALTER TABLE public.historico_agendamentos 
ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT 'Nome não informado',
ADD COLUMN IF NOT EXISTS turma VARCHAR(100) NOT NULL DEFAULT 'Turma não informada',
ADD COLUMN IF NOT EXISTS contato VARCHAR(255) NOT NULL DEFAULT 'Contato não informado',
ADD COLUMN IF NOT EXISTS equipamentos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "data" DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS "horaInicio" TIME NOT NULL DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS "horaFim" TIME NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS mensagem TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS moved_to_history_at TIMESTAMPTZ DEFAULT NOW();

-- Remover os valores padrão após adicionar as colunas
ALTER TABLE public.historico_agendamentos 
ALTER COLUMN nome DROP DEFAULT,
ALTER COLUMN turma DROP DEFAULT,
ALTER COLUMN contato DROP DEFAULT,
ALTER COLUMN equipamentos DROP DEFAULT,
ALTER COLUMN "data" DROP DEFAULT,
ALTER COLUMN "horaInicio" DROP DEFAULT,
ALTER COLUMN "horaFim" DROP DEFAULT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_data ON public.historico_agendamentos("data");
CREATE INDEX IF NOT EXISTS idx_historico_timestamp ON public.historico_agendamentos(timestamp);
CREATE INDEX IF NOT EXISTS idx_historico_moved_at ON public.historico_agendamentos(moved_to_history_at);

-- Verificar se todas as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'historico_agendamentos'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Testar uma inserção para verificar se está funcionando
-- INSERT INTO public.historico_agendamentos 
-- (nome, turma, contato, equipamentos, "data", "horaInicio", "horaFim", mensagem)
-- VALUES 
-- ('Teste', 'Teste', 'teste@teste.com', ARRAY['Teste'], CURRENT_DATE, '08:00', '09:00', 'Teste de funcionamento');

-- Verificar se a inserção funcionou
-- SELECT * FROM public.historico_agendamentos WHERE nome = 'Teste';

-- Remover o teste
-- DELETE FROM public.historico_agendamentos WHERE nome = 'Teste';