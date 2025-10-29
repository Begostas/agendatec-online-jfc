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

// Configuração do Supabase Realtime para sincronização em tempo real
let realtimeChannel = null;

function iniciarSincronizacaoRealtime() {
    // Remove canal anterior se existir
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    // Cria novo canal para monitorar a tabela agendamentos
    realtimeChannel = supabase
        .channel('agendamentos-changes')
        .on(
            'postgres_changes',
            {
                event: '*', // Monitora INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'agendamentos'
            },
            async (payload) => {
                console.log('Alteração detectada na tabela agendamentos:', payload);
                
                // Atualiza a tabela automaticamente
                await atualizarDadosRealtime(payload);
            }
        )
        .subscribe((status) => {
            console.log('Status do Realtime:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Sincronização em tempo real ativada com sucesso!');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Erro na conexão Realtime');
                // Tenta reconectar após 5 segundos
                setTimeout(iniciarSincronizacaoRealtime, 5000);
            }
        });
}

// Função para atualizar os dados quando ocorrer alterações
async function atualizarDadosRealtime(payload) {
    try {
        const { eventType } = payload;
        console.log(`Evento Realtime: ${eventType}`);
        
        // Verifica se a função de carregamento existe
        if (typeof carregarAgendamentos === 'function') {
            // Recarrega os agendamentos
            await carregarAgendamentos();
            console.log('Tabela de agendamentos atualizada via Realtime');
        } else {
            console.log('Função carregarAgendamentos não encontrada. Atualizando via evento de documento.');
            // Dispara um evento personalizado para notificar outras partes da aplicação
            const evento = new CustomEvent('agendamentos-atualizados', { detail: payload });
            document.dispatchEvent(evento);
        }
    } catch (error) {
        console.error('Erro ao atualizar dados em tempo real:', error);
    }
}

// Função para limpar conexões Realtime ao sair da página
function limparRealtimeConnections() {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        console.log('🔌 Conexão Realtime encerrada');
    }
}

// Adiciona listeners para gerenciar o ciclo de vida da conexão Realtime
window.addEventListener('beforeunload', limparRealtimeConnections);
window.addEventListener('unload', limparRealtimeConnections);

// Reconecta quando a página volta a ficar visível
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && realtimeChannel) {
        // Verifica se o canal está desconectado
        if (realtimeChannel.state !== 'joined') {
            console.log('🔄 Reconectando Realtime...');
            iniciarSincronizacaoRealtime();
        }
    }
});

// Executa ao carregar
removerAgendamentosAntigos();

// Inicia a sincronização em tempo real após um breve delay
setTimeout(iniciarSincronizacaoRealtime, 1000);
