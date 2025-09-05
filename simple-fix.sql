-- Script simples para corrigir o problema da tabela historico_agendamentos
-- Execute linha por linha no SQL Editor do Supabase

-- 1. Primeiro, vamos ver se a tabela existe e suas colunas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'historico_agendamentos' 
AND table_schema = 'public';

-- 2. Se a consulta acima não retornar resultados, a tabela não existe
-- Execute este comando para criar a tabela:
CREATE TABLE public.historico_agendamentos (
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

-- 3. Habilitar RLS
ALTER TABLE public.historico_agendamentos ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas
CREATE POLICY "Permitir leitura pública histórico" ON public.historico_agendamentos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção histórico" ON public.historico_agendamentos FOR INSERT WITH CHECK (true);

-- 5. Testar se funcionou
SELECT 'Tabela criada com sucesso!' as status;

-- 6. Verificar as colunas novamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'historico_agendamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;