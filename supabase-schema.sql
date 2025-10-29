-- Schema para o banco de dados Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    contato VARCHAR(255) NOT NULL,
    equipamentos TEXT[] NOT NULL, -- Array de equipamentos
    data DATE NOT NULL,
    "horaInicio" TIME NOT NULL,
    "horaFim" TIME NOT NULL,
    mensagem TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_equipamentos ON agendamentos USING GIN(equipamentos);
CREATE INDEX IF NOT EXISTS idx_agendamentos_timestamp ON agendamentos(timestamp);

-- Habilitar RLS (Row Level Security)
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura pública" ON agendamentos
    FOR SELECT USING (true);

-- Política para permitir inserção pública
CREATE POLICY "Permitir inserção pública" ON agendamentos
    FOR INSERT WITH CHECK (true);

-- Política para permitir atualização pública (opcional)
CREATE POLICY "Permitir atualização pública" ON agendamentos
    FOR UPDATE USING (true);

-- Política para permitir exclusão pública (para limpeza automática)
CREATE POLICY "Permitir exclusão pública" ON agendamentos
    FOR DELETE USING (true);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO agendamentos (nome, turma, contato, equipamentos, data, "horaInicio", "horaFim", mensagem) VALUES
('Professor Exemplo', '9º Ano', 'professor@escola.com', ARRAY['Sala de Informática'], CURRENT_DATE + INTERVAL '1 day', '08:00', '10:00', 'Aula de programação'),
('Maria Silva', '7º Ano', 'maria@escola.com', ARRAY['Lousa 1'], CURRENT_DATE + INTERVAL '2 days', '13:00', '15:00', 'Aula de matemática'),
('João Santos', '8º Ano', 'joao@escola.com', ARRAY['Caixa de som', 'Microfone'], CURRENT_DATE + INTERVAL '3 days', '09:00', '11:00', 'Apresentação de trabalho')
ON CONFLICT DO NOTHING;

-- Criar tabela de histórico de agendamentos
CREATE TABLE IF NOT EXISTS historico_agendamentos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    contato VARCHAR(255) NOT NULL,
    equipamentos TEXT[] NOT NULL,
    data DATE NOT NULL,
    "horaInicio" TIME NOT NULL,
    "horaFim" TIME NOT NULL,
    mensagem TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    moved_to_history_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para a tabela de histórico
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_historico_timestamp ON historico_agendamentos(timestamp);
CREATE INDEX IF NOT EXISTS idx_historico_moved_at ON historico_agendamentos(moved_to_history_at);

-- Habilitar RLS para histórico
ALTER TABLE historico_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para histórico (apenas leitura pública)
CREATE POLICY "Permitir leitura pública histórico" ON historico_agendamentos
    FOR SELECT USING (true);

-- Política para permitir inserção no histórico (para migração automática)
CREATE POLICY "Permitir inserção histórico" ON historico_agendamentos
    FOR INSERT WITH CHECK (true);

-- Comentários sobre a estrutura
COMMENT ON TABLE agendamentos IS 'Tabela para armazenar agendamentos de equipamentos escolares';
COMMENT ON TABLE historico_agendamentos IS 'Tabela para armazenar histórico de agendamentos passados';
COMMENT ON COLUMN agendamentos.equipamentos IS 'Array de equipamentos agendados (Sala de Informática, Lousa 1, Lousa 2, Caixa de som, Microfone)';
COMMENT ON COLUMN agendamentos.data IS 'Data do agendamento';
COMMENT ON COLUMN agendamentos."horaInicio" IS 'Hora de início do agendamento';
COMMENT ON COLUMN agendamentos."horaFim" IS 'Hora de término do agendamento';
COMMENT ON COLUMN agendamentos.timestamp IS 'Timestamp de quando o agendamento foi criado';
COMMENT ON COLUMN historico_agendamentos.moved_to_history_at IS 'Timestamp de quando o agendamento foi movido para o histórico';

-- Habilitar Realtime para a tabela de agendamentos
ALTER PUBLICATION supabase_realtime ADD TABLE agendamentos;