// API para gerenciar agendamentos com Supabase
// Este arquivo será usado pelo Vercel para criar uma API serverless

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Variáveis de ambiente do Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para limpar agendamentos antigos (mais de 15 dias)
async function limparAgendamentosAntigos() {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 15);
    
    try {
        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .lt('data', dataLimite.toISOString().split('T')[0]);
        
        if (error) {
            console.error('Erro ao limpar agendamentos antigos:', error);
        }
    } catch (error) {
        console.error('Erro ao limpar agendamentos antigos:', error);
    }
}

// Handler da API
export default async function handler(req, res) {
  // Configurar CORS para permitir acesso de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Responder imediatamente às solicitações OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Verificar se o Supabase está configurado
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }
  
  // Tratar solicitações GET (obter agendamentos)
  if (req.method === 'GET') {
    try {
      // Limpar agendamentos antigos
      await limparAgendamentosAntigos();
      
      // Buscar agendamentos do Supabase
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return res.status(500).json({ error: 'Erro ao obter agendamentos' });
      }
      
      return res.status(200).json(data || []);
    } catch (error) {
      console.error('Erro ao processar solicitação GET:', error);
      return res.status(500).json({ error: 'Erro ao obter agendamentos' });
    }
  }
  
  // Tratar solicitações POST (criar agendamento)
  if (req.method === 'POST') {
    try {
      const novoAgendamento = req.body;
      
      // Adicionar timestamp
      novoAgendamento.timestamp = new Date().toISOString();
      
      // Inserir no Supabase
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([novoAgendamento])
        .select();
      
      if (error) {
        console.error('Erro ao criar agendamento:', error);
        return res.status(500).json({ error: 'Erro ao criar agendamento' });
      }
      
      // Limpar agendamentos antigos
      await limparAgendamentosAntigos();
      
      return res.status(201).json({ 
        message: 'Agendamento criado com sucesso',
        agendamento: data[0] 
      });
    } catch (error) {
      console.error('Erro ao processar solicitação POST:', error);
      return res.status(500).json({ error: 'Erro ao salvar agendamentos' });
    }
  }
  
  // Método não suportado
  return res.status(405).json({ error: 'Método não permitido' });
}