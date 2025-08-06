// Configuração direta do Supabase para uso no navegador
const SUPABASE_URL = 'https://nlcbvdlvkmomrtmrdrqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2J2ZGx2a21vbXJ0bXJkcnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODM1NjksImV4cCI6MjA3MDA1OTU2OX0.Ql9FUmGU-pDrSVdHXQiQC_sOpEjPQyLJR5_n9KlhJ68';

// Cria o cliente Supabase global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Teste de conexão (aparece no console)
supabaseClient.from('agendamentos').select('*').limit(1)
    .then(({ data, error }) => {
        if (error) console.error('Erro ao conectar no Supabase:', error.message);
        else console.log('Conexão com Supabase OK. Primeira linha:', data);
    });
