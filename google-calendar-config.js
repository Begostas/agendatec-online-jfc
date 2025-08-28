// Configuração do Google Calendar API com Google Identity Services (GSI)
// Migrado das bibliotecas depreciadas gapi.auth2 para GSI
// Para configurar:
// 1. Acesse https://console.developers.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Ative a Google Calendar API
// 4. Crie credenciais OAuth 2.0 Client ID
// 5. Adicione seu domínio (localhost:8000 para desenvolvimento)
// 6. Substitua as configurações abaixo

// Configurações do Google Calendar API
const GOOGLE_CALENDAR_CONFIG = {
    // API Key do Google Cloud Console
    apiKey: 'AIzaSyAIfwOojqQl__XlZlVMm1VG67gFcHE64LY',
    
    // Client ID OAuth criado
    clientId: '983871250354-t3jqm7sieb8ikpn8d5sngpv7ntt5gdoc.apps.googleusercontent.com',
    
    // Escopo necessário para criar eventos
    scope: 'https://www.googleapis.com/auth/calendar.events',
    
    // Discovery URL para Calendar API
    discoveryUrl: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
};

// Estado da autenticação
let isGoogleCalendarAuthorized = false;
let gapi = null;
let tokenClient = null;
let accessToken = null;

// Função para carregar o Google Identity Services
function loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
        // Verificar se GSI já está carregado
        if (window.google && window.google.accounts) {
            resolve();
            return;
        }
        
        // Verificar se o script já existe
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.onload = resolve;
            existingScript.onerror = reject;
            return;
        }
        
        // Criar novo script para GSI
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            setTimeout(() => {
                if (window.google && window.google.accounts) {
                    resolve();
                } else {
                    reject(new Error('Google Identity Services não carregou corretamente'));
                }
            }, 100);
        };
        script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'));
        document.head.appendChild(script);
    });
}

// Função para carregar a Google API (para Calendar API)
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        // Verificar se gapi já está carregado
        if (window.gapi && window.gapi.load) {
            gapi = window.gapi;
            resolve();
            return;
        }
        
        // Verificar se o script já existe
        const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
        if (existingScript) {
            existingScript.onload = () => {
                gapi = window.gapi;
                resolve();
            };
            existingScript.onerror = reject;
            return;
        }
        
        // Criar novo script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            setTimeout(() => {
                if (window.gapi && window.gapi.load) {
                    gapi = window.gapi;
                    resolve();
                } else {
                    reject(new Error('Google API não carregou corretamente'));
                }
            }, 100);
        };
        script.onerror = () => reject(new Error('Falha ao carregar Google API script'));
        document.head.appendChild(script);
    });
}

// Função para inicializar o Google Calendar API com GSI
async function initializeGoogleCalendar() {
    try {
        console.log('🔄 Carregando Google Calendar API com GSI...');
        
        // Verificar se estamos em localhost ou domínio autorizado
        const hostname = window.location.hostname;
        const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
        const isVercel = hostname.includes('vercel.app');
        
        if (!isLocalhost && !isVercel) {
            console.log('⚠️ Google Calendar API só funciona em localhost para desenvolvimento ou em domínio configurado no Google Cloud Console.');
            const statusSpan = document.getElementById('calendar-status');
            if (statusSpan) {
                statusSpan.textContent = 'Domínio não autorizado';
                statusSpan.className = 'status-error';
            }
            return;
        }
        
        // Carregar Google Identity Services
        console.log('🔧 Carregando Google Identity Services...');
        await loadGoogleIdentityServices();
        
        // Carregar Google API para Calendar
        console.log('🔧 Carregando Google API...');
        await loadGoogleAPI();
        
        // Inicializar token client para OAuth2
        console.log('🔧 Inicializando token client...');
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CALENDAR_CONFIG.clientId,
            scope: GOOGLE_CALENDAR_CONFIG.scope,
            callback: (tokenResponse) => {
                console.log('✅ Token recebido:', tokenResponse);
                if (tokenResponse && tokenResponse.access_token) {
                    accessToken = tokenResponse.access_token;
                    isGoogleCalendarAuthorized = true;
                    
                    // Configurar o token no gapi
                    gapi.client.setToken({
                        access_token: accessToken
                    });
                    
                    updateGoogleCalendarUI();
                    console.log('✅ Autorização concluída com sucesso!');
                } else {
                    console.error('❌ Token inválido recebido');
                    isGoogleCalendarAuthorized = false;
                    updateGoogleCalendarUI();
                }
            },
            error_callback: (error) => {
                console.error('❌ Erro na autorização:', error);
                isGoogleCalendarAuthorized = false;
                updateGoogleCalendarUI();
            }
        });
        
        // Carregar módulos necessários do gapi
        console.log('🔧 Carregando módulos client...');
        await new Promise((resolve, reject) => {
            gapi.load('client', {
                callback: resolve,
                onerror: reject
            });
        });
        
        // Inicializar cliente gapi
        console.log('🔧 Inicializando cliente gapi...');
        await gapi.client.init({
            apiKey: GOOGLE_CALENDAR_CONFIG.apiKey,
            discoveryDocs: [GOOGLE_CALENDAR_CONFIG.discoveryUrl]
        });
        
        console.log('✅ Google Calendar API inicializada com GSI!');
        updateGoogleCalendarUI();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Google Calendar API:', error);
        
        // Mostrar erro específico na interface
        const statusSpan = document.getElementById('calendar-status');
        if (statusSpan) {
            let errorMessage = 'Erro na configuração';
            
            const errorMsg = error.message || '';
            
            if (errorMsg.includes('Google Identity Services')) {
                errorMessage = 'Falha ao carregar GSI';
            } else if (errorMsg.includes('Google API')) {
                errorMessage = 'Falha ao carregar API';
            } else if (errorMsg.includes('client')) {
                errorMessage = 'Erro nos módulos';
            }
            
            statusSpan.textContent = errorMessage;
            statusSpan.className = 'status-error';
        }
    }
}

// Função para autorizar acesso ao Google Calendar com GSI
async function authorizeGoogleCalendar() {
    try {
        console.log('🔐 Solicitando autorização com GSI...');
        
        // Verificar se o token client está inicializado
        if (!tokenClient) {
            console.error('❌ Token client não está inicializado');
            throw new Error('Token client não inicializado');
        }
        
        // Verificar se já temos um token válido
        if (accessToken && gapi.client.getToken()) {
            console.log('✅ Token já existe e é válido');
            isGoogleCalendarAuthorized = true;
            updateGoogleCalendarUI();
            return;
        }
        
        // Solicitar novo token
        console.log('🔄 Solicitando novo token...');
        tokenClient.requestAccessToken({ prompt: 'consent' });
        
    } catch (error) {
        console.error('❌ Erro na autorização:', error);
        isGoogleCalendarAuthorized = false;
        updateGoogleCalendarUI();
        
        // Mostrar erro na interface
        const statusSpan = document.getElementById('calendar-status');
        if (statusSpan) {
            statusSpan.textContent = 'Erro na autorização';
            statusSpan.className = 'status-error';
        }
    }
}

// Função para desconectar do Google Calendar
function disconnectGoogleCalendar() {
    try {
        console.log('🔌 Desconectando do Google Calendar...');
        
        // Revogar token se existir
        if (accessToken) {
            google.accounts.oauth2.revoke(accessToken, () => {
                console.log('✅ Token revogado');
            });
        }
        
        // Limpar estado
        accessToken = null;
        isGoogleCalendarAuthorized = false;
        
        // Limpar token do gapi
        if (gapi && gapi.client && gapi.client.setToken) {
            gapi.client.setToken(null);
        }
        
        updateGoogleCalendarUI();
        console.log('✅ Desconectado do Google Calendar');
        
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
    }
}

// Função para atualizar a interface do usuário
function updateGoogleCalendarUI() {
    const statusSpan = document.getElementById('calendar-status');
    const connectBtn = document.getElementById('btn-connect-calendar');
    const disconnectBtn = document.getElementById('btn-disconnect-calendar');
    
    if (statusSpan) {
        if (isGoogleCalendarAuthorized) {
            statusSpan.textContent = 'Conectado';
            statusSpan.className = 'status-connected';
            
            if (connectBtn) {
                connectBtn.style.display = 'none';
            }
            if (disconnectBtn) {
                disconnectBtn.style.display = 'inline-block';
            }
        } else {
            statusSpan.textContent = 'Desconectado';
            statusSpan.className = 'status-disconnected';
            
            if (connectBtn) {
                connectBtn.style.display = 'inline-block';
            }
            if (disconnectBtn) {
                disconnectBtn.style.display = 'none';
            }
        }
    }
}

// Função para criar evento no Google Calendar
async function createGoogleCalendarEvent(eventData) {
    try {
        console.log('🔍 Verificando autorização...');
        console.log('🔍 isGoogleCalendarAuthorized:', isGoogleCalendarAuthorized);
        console.log('🔍 accessToken existe:', !!accessToken);
        console.log('🔍 gapi.client existe:', !!(gapi && gapi.client));
        
        if (!isGoogleCalendarAuthorized || !accessToken) {
            console.log('⚠️ Google Calendar não está autorizado');
            console.log('⚠️ Detalhes: autorizado =', isGoogleCalendarAuthorized, ', token =', !!accessToken);
            return false;
        }
        
        if (!gapi || !gapi.client || !gapi.client.calendar) {
            console.error('❌ Google API client não está inicializado corretamente');
            return false;
        }
        
        console.log('📅 Criando evento no Google Calendar:', eventData);
        console.log('📅 Token atual:', accessToken ? 'Token presente' : 'Token ausente');
        
        // Preparar dados do evento
        const equipamentosTexto = Array.isArray(eventData.equipamentos) 
            ? eventData.equipamentos.join(', ') 
            : eventData.equipamentos;
            
        const event = {
            summary: `Agendamento - ${eventData.nome} (${eventData.turma})`,
            description: `Agendamento de equipamentos\n\nProfessor: ${eventData.nome}\nTurma: ${eventData.turma}\nContato: ${eventData.contato || 'Não informado'}\nEquipamentos: ${equipamentosTexto}\nMensagem: ${eventData.mensagem || 'Nenhuma mensagem adicional'}`,
            start: {
                dateTime: `${eventData.data}T${eventData.horaInicio}:00`,
                timeZone: 'America/Sao_Paulo'
            },
            end: {
                dateTime: `${eventData.data}T${eventData.horaFim}:00`,
                timeZone: 'America/Sao_Paulo'
            },
            location: 'Escola Municipal Júlio Fernandes Colino'
        };
        
        console.log('📅 Dados do evento preparados:', event);
        
        // Criar evento
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });
        
        if (response.status === 200) {
            console.log('✅ Evento criado com sucesso:', response.result);
            return response.result;
        } else {
            console.error('❌ Erro ao criar evento:', response);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar evento no Google Calendar:', error);
        console.error('Detalhes do erro:', error.message, error.stack);
        return false;
    }
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGoogleCalendar);
} else {
    initializeGoogleCalendar();
}