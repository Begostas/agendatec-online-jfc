// API para gerenciar agendamentos
// Este arquivo será usado pelo Vercel para criar uma API serverless

// NOTA: Vercel não permite escrita no sistema de arquivos
// Esta API funciona apenas como interface, os dados são gerenciados pelo localStorage no frontend

// Armazenamento em memória (temporário para esta sessão)
let agendamentosMemoria = [];

// Função para limpar agendamentos antigos (mais de 15 dias)
function limparAgendamentosAntigos(agendamentos) {
  const hoje = new Date();
  const quinzeDiasAtras = new Date(hoje);
  quinzeDiasAtras.setDate(hoje.getDate() - 15);
  
  return agendamentos.filter(agendamento => {
    const dataAgendamento = new Date(agendamento.data + 'T00:00:00');
    return dataAgendamento >= quinzeDiasAtras;
  });
}

// Handler da API
module.exports = async (req, res) => {
  // Configurar CORS para permitir acesso de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Responder imediatamente às solicitações OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Tratar solicitações GET (obter agendamentos)
  if (req.method === 'GET') {
    try {
      // Limpar agendamentos antigos
      agendamentosMemoria = limparAgendamentosAntigos(agendamentosMemoria);
      
      return res.status(200).json(agendamentosMemoria);
    } catch (error) {
      console.error('Erro ao processar solicitação GET:', error);
      return res.status(500).json({ error: 'Erro ao obter agendamentos' });
    }
  }
  
  // Tratar solicitações POST (salvar agendamentos)
  if (req.method === 'POST') {
    try {
      const agendamentos = req.body;
      
      if (!Array.isArray(agendamentos)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de agendamentos.' });
      }
      
      // Salvar em memória (temporário)
      agendamentosMemoria = agendamentos;
      
      return res.status(200).json({ success: true, message: 'Agendamentos salvos com sucesso' });
    } catch (error) {
      console.error('Erro ao processar solicitação POST:', error);
      return res.status(500).json({ error: 'Erro ao salvar agendamentos' });
    }
  }
  
  // Método não suportado
  return res.status(405).json({ error: 'Método não permitido' });
};