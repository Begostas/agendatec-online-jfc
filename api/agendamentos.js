// API para gerenciar agendamentos
// Este arquivo será usado pelo Vercel para criar uma API serverless

// Importar o módulo de sistema de arquivos para persistência de dados
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de dados
const dataFilePath = path.join(process.cwd(), 'data', 'agendamentos.json');

// Função para garantir que o diretório de dados exista
function ensureDirectoryExists() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Função para ler os agendamentos do arquivo
function readAgendamentos() {
  ensureDirectoryExists();
  
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler agendamentos:', error);
    return [];
  }
}

// Função para salvar os agendamentos no arquivo
function saveAgendamentos(agendamentos) {
  ensureDirectoryExists();
  
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(agendamentos, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar agendamentos:', error);
    return false;
  }
}

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
      let agendamentos = readAgendamentos();
      
      // Limpar agendamentos antigos
      const agendamentosAtualizados = limparAgendamentosAntigos(agendamentos);
      
      // Se houver agendamentos antigos, salvar a lista atualizada
      if (agendamentosAtualizados.length < agendamentos.length) {
        saveAgendamentos(agendamentosAtualizados);
        agendamentos = agendamentosAtualizados;
      }
      
      return res.status(200).json(agendamentos);
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
      
      const salvou = saveAgendamentos(agendamentos);
      
      if (salvou) {
        return res.status(200).json({ success: true, message: 'Agendamentos salvos com sucesso' });
      } else {
        return res.status(500).json({ error: 'Erro ao salvar agendamentos' });
      }
    } catch (error) {
      console.error('Erro ao processar solicitação POST:', error);
      return res.status(500).json({ error: 'Erro ao salvar agendamentos' });
    }
  }
  
  // Método não suportado
  return res.status(405).json({ error: 'Método não permitido' });
};