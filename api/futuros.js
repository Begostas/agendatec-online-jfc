// API endpoint para retornar agendamentos futuros em formato JSON
import { createClient } from '@supabase/supabase-js';

// Função para converter data para o fuso horário America/Cuiaba (UTC-4)
function toLocalDate(date) {
    if (!date) return new Date();
    // As datas do Supabase já vêm em UTC, então apenas aplicamos o offset direto
    const data = new Date(date);
    const offset = -4; // UTC-4 para America/Cuiaba
    return new Date(data.getTime() + (3600000 * offset));
}

const supabaseUrl = 'https://nlcbvdlvkmomrtmrdrqb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2J2ZGx2a21vbXJ0bXJkcnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODM1NjksImV4cCI6MjA3MDA1OTU2OX0.Ql9FUmGU-pDrSVdHXQiQC_sOpEjPQyLJR5_n9KlhJ68';

if (!supabaseUrl || !supabaseKey) {
    console.error('Configurações do Supabase não encontradas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // Data atual para filtrar apenas agendamentos futuros
        const hojeLocal = toLocalDate(new Date());
        const hoje = hojeLocal.toISOString().split('T')[0];

        // Buscar agendamentos futuros ordenados por data e hora
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('*')
            .gte('data', hoje)
            .order('data', { ascending: true })
            .order('horaInicio', { ascending: true });

        if (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                details: error.message 
            });
        }

        // Processar dados para incluir informações úteis
        const agendamentosProcessados = agendamentos.map(agendamento => {
            const dataObj = toLocalDate(new Date(agendamento.data + 'T00:00:00'));
            const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
            const dataFormatada = dataObj.toLocaleDateString('pt-BR');
            
            return {
                id: agendamento.id,
                nome: agendamento.nome,
                turma: agendamento.turma,
                contato: agendamento.contato,
                equipamentos: agendamento.equipamentos,
                data: agendamento.data,
                dataFormatada: dataFormatada,
                diaSemana: diaSemana,
                horaInicio: agendamento.horaInicio,
                horaFim: agendamento.horaFim,
                mensagem: agendamento.mensagem,
                timestamp: agendamento.timestamp
            };
        });

        // Estatísticas adicionais
        const estatisticas = {
            total: agendamentosProcessados.length,
            proximoAgendamento: agendamentosProcessados.length > 0 ? agendamentosProcessados[0] : null,
            equipamentosMaisUsados: calcularEquipamentosMaisUsados(agendamentosProcessados),
            agendamentosPorDia: agruparPorDia(agendamentosProcessados)
        };

        return res.status(200).json({
            success: true,
            data: agendamentosProcessados,
            estatisticas: estatisticas,
            timestamp: toLocalDate(new Date()).toISOString()
        });

    } catch (error) {
        console.error('Erro inesperado:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
}

// Função auxiliar para calcular equipamentos mais usados
function calcularEquipamentosMaisUsados(agendamentos) {
    const contadorEquipamentos = {};
    
    agendamentos.forEach(agendamento => {
        agendamento.equipamentos.forEach(equipamento => {
            contadorEquipamentos[equipamento] = (contadorEquipamentos[equipamento] || 0) + 1;
        });
    });

    return Object.entries(contadorEquipamentos)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([equipamento, count]) => ({ equipamento, count }));
}

// Função auxiliar para agrupar agendamentos por dia
function agruparPorDia(agendamentos) {
    const agrupados = {};
    
    agendamentos.forEach(agendamento => {
        const data = agendamento.data;
        if (!agrupados[data]) {
            agrupados[data] = [];
        }
        agrupados[data].push(agendamento);
    });

    return agrupados;
}