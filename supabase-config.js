// Configuração do Supabase
class SupabaseConfig {
    constructor() {
        // Configurações do Supabase - substitua pelos seus valores reais
        this.supabaseUrl = 'https://your-project-url.supabase.co';
        this.supabaseKey = 'your-anon-key-here';
        
        // Inicializar cliente Supabase
        this.supabase = null;
        this.initSupabase();
    }

    initSupabase() {
        try {
            if (typeof supabase !== 'undefined') {
                this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('Supabase inicializado com sucesso');
            } else {
                console.error('Supabase não está disponível. Verifique se o script foi carregado.');
            }
        } catch (error) {
            console.error('Erro ao inicializar Supabase:', error);
        }
    }

    getClient() {
        return this.supabase;
    }

    // Verificar se o Supabase está conectado
    async testConnection() {
        try {
            if (!this.supabase) {
                throw new Error('Cliente Supabase não inicializado');
            }
            
            // Teste simples de conexão
            const { data, error } = await this.supabase
                .from('agendamentos')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.error('Erro na conexão com Supabase:', error);
                return false;
            }
            
            console.log('Conexão com Supabase OK');
            return true;
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            return false;
        }
    }
}

// Instância global do Supabase
const supabaseConfig = new SupabaseConfig();