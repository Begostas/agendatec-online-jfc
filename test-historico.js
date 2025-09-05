// Script de Teste para Debug do Histórico
// Cole este código no Console do navegador (F12) para testar

console.log('=== TESTE DE DEBUG DO HISTÓRICO ===');

// Função para testar a conexão com Supabase
async function testarConexaoSupabase() {
    console.log('1. Testando conexão com Supabase...');
    
    try {
        // Testar se o cliente Supabase está disponível
        if (typeof supabaseClient === 'undefined') {
            console.error('❌ supabaseClient não está definido!');
            return false;
        }
        
        console.log('✅ supabaseClient está disponível');
        console.log('URL:', supabaseClient.supabaseUrl);
        
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
        return false;
    }
}

// Função para testar acesso à tabela historico_agendamentos
async function testarAcessoHistorico() {
    console.log('2. Testando acesso à tabela historico_agendamentos...');
    
    try {
        const { data, error, count } = await supabaseClient
            .from('historico_agendamentos')
            .select('*', { count: 'exact' })
            .limit(5);
        
        if (error) {
            console.error('❌ Erro ao acessar histórico:', error);
            console.error('Código do erro:', error.code);
            console.error('Mensagem:', error.message);
            console.error('Detalhes:', error.details);
            return false;
        }
        
        console.log('✅ Acesso à tabela bem-sucedido');
        console.log('Total de registros:', count);
        console.log('Primeiros 5 registros:', data);
        
        return { data, count };
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
        return false;
    }
}

// Função para testar a estrutura dos dados
function testarEstruturaDados(dados) {
    console.log('3. Testando estrutura dos dados...');
    
    if (!dados || dados.length === 0) {
        console.warn('⚠️ Nenhum dado encontrado no histórico');
        return false;
    }
    
    const primeiroRegistro = dados[0];
    console.log('Estrutura do primeiro registro:', primeiroRegistro);
    
    // Verificar campos obrigatórios
    const camposObrigatorios = ['nome', 'turma', 'data', 'horaInicio', 'horaFim'];
    const camposFaltando = [];
    
    camposObrigatorios.forEach(campo => {
        if (!(campo in primeiroRegistro)) {
            camposFaltando.push(campo);
        }
    });
    
    if (camposFaltando.length > 0) {
        console.error('❌ Campos faltando:', camposFaltando);
        return false;
    }
    
    console.log('✅ Estrutura dos dados está correta');
    return true;
}

// Função para simular o carregamento do histórico
async function simularCarregamentoHistorico() {
    console.log('4. Simulando carregamento do histórico...');
    
    try {
        const { data, error } = await supabaseClient
            .from('historico_agendamentos')
            .select('*')
            .order('"data"', { ascending: false })
            .order('"horaInicio"', { ascending: false });
        
        if (error) {
            console.error('❌ Erro na consulta:', error);
            return false;
        }
        
        console.log('✅ Consulta executada com sucesso');
        console.log('Dados retornados:', data);
        
        // Testar processamento dos dados como no script original
        if (data && data.length > 0) {
            console.log('5. Testando processamento dos dados...');
            
            data.forEach((ag, index) => {
                try {
                    const horaInicio = ag.horaInicio.substring(0, 5);
                    const horaFim = ag.horaFim.substring(0, 5);
                    const [ano, mes, dia] = ag.data.split('-');
                    const dataFormatada = `${dia}/${mes}/${ano}`;
                    
                    console.log(`Registro ${index + 1}:`, {
                        nome: ag.nome,
                        turma: ag.turma,
                        data: dataFormatada,
                        horario: `${horaInicio} - ${horaFim}`,
                        equipamentos: ag.equipamentos
                    });
                } catch (procError) {
                    console.error(`❌ Erro ao processar registro ${index + 1}:`, procError);
                    console.error('Dados do registro:', ag);
                }
            });
            
            console.log('✅ Processamento dos dados concluído');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro inesperado na simulação:', error);
        return false;
    }
}

// Função principal de teste
async function executarTestesCompletos() {
    console.log('🔍 Iniciando testes de debug do histórico...');
    console.log('==========================================');
    
    // Teste 1: Conexão
    const conexaoOk = await testarConexaoSupabase();
    if (!conexaoOk) {
        console.log('❌ Testes interrompidos - problema na conexão');
        return;
    }
    
    // Teste 2: Acesso aos dados
    const resultadoAcesso = await testarAcessoHistorico();
    if (!resultadoAcesso) {
        console.log('❌ Testes interrompidos - problema no acesso aos dados');
        return;
    }
    
    // Teste 3: Estrutura
    const estruturaOk = testarEstruturaDados(resultadoAcesso.data);
    if (!estruturaOk) {
        console.log('❌ Problema na estrutura dos dados');
    }
    
    // Teste 4: Simulação completa
    const simulacaoOk = await simularCarregamentoHistorico();
    if (!simulacaoOk) {
        console.log('❌ Problema na simulação do carregamento');
        return;
    }
    
    console.log('==========================================');
    console.log('✅ Todos os testes concluídos!');
    console.log('Se chegou até aqui, o problema pode estar no frontend.');
    console.log('Verifique se o botão está chamando a função correta.');
}

// Executar os testes automaticamente
executarTestesCompletos();

// Disponibilizar funções individuais para teste manual
window.debugHistorico = {
    testarConexao: testarConexaoSupabase,
    testarAcesso: testarAcessoHistorico,
    simularCarregamento: simularCarregamentoHistorico,
    executarTodos: executarTestesCompletos
};

console.log('💡 Funções de debug disponíveis em window.debugHistorico');
console.log('Exemplo: debugHistorico.testarConexao()');