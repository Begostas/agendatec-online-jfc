// Configuração direta do Supabase para uso no navegador
const SUPABASE_URL = 'https://nlcbvdlvkmomrtmrdrqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2J2ZGx2a21vbXJ0bXJkcnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODM1NjksImV4cCI6MjA3MDA1OTU2OX0.Ql9FUmGU-pDrSVdHXQiQC_sOpEjPQyLJR5_n9KlhJ68';

// Criar cliente Supabase usando createClient do pacote @supabase/supabase-js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseClient = supabase; // Manter compatibilidade com código existente

// Função para remover agendamentos com mais de 15 dias
async function removerAgendamentosAntigos() {
    const hoje = new Date();
    const limite = new Date(hoje.setDate(hoje.getDate() - 15)).toISOString().split('T')[0];

    const { error } = await supabaseClient
        .from('agendamentos')
        .delete()
        .lt('data', limite);

    if (error) {
        console.error('Erro ao remover agendamentos antigos:', error.message);
    } else {
        console.log('Agendamentos com mais de 15 dias removidos.');
    }
}

// Executa ao carregar
removerAgendamentosAntigos();
