// Referências aos elementos do DOM
const form = document.getElementById('agendamento-form');
const btnAgendar = document.getElementById('btn-agendar');
const tabelaBody = document.querySelector('#tabela-semanal-body');

// Configuração da API de feriados
const HOLIDAYS_API_KEY = 'demo'; // Use 'demo' para testes ou substitua por sua chave da Abstract API
const HOLIDAYS_API_URL = 'https://holidays.abstractapi.com/v1/';

// Cache para feriados (evitar múltiplas chamadas)
let cacheHolidays = {
    data: null,
    year: null,
    lastFetch: null
};

// Variáveis globais
let agendamentos = [];
let ultimaAtualizacaoSemana = formatDateForAPI(new Date());

// Função para converter data para fuso horário America/Cuiaba (UTC−4)
function toLocalDate(date) {
    if (typeof date === 'string') {
        return new Date(date);
    }
    return new Date(date);
}

// Funções utilitárias para formatação internacional de datas
function formatDateISO(date) {
    // Usar data local em vez de UTC
    const localDate = toLocalDate(date);
    const year = localDate.getFullYear();
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
    const day = localDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
    // Converte YYYY-MM-DD para DD/MM/YYYY para exibição
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatDateTimeDisplay(date) {
    // Formato internacional para exibição: DD/MM/YYYY HH:MM
    const localDate = toLocalDate(date);
    const day = localDate.getDate().toString().padStart(2, '0');
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
    const year = localDate.getFullYear();
    const hours = localDate.getHours().toString().padStart(2, '0');
    const minutes = localDate.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function parseDateBR(diaMesAno) {
    if (!diaMesAno) return new Date(NaN);
    if (diaMesAno.includes('/')) {
        const [dia, mes, ano] = diaMesAno.split('/').map(Number);
        return new Date(ano, mes - 1, dia);
    }
    if (diaMesAno.includes('-')) {
        const [ano, mes, dia] = diaMesAno.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }
    return new Date(diaMesAno);
}
// Função para buscar feriados da API
async function buscarFeriados(ano) {
    // Verificar cache primeiro
    const agora = Date.now();
    const umDiaEmMs = 24 * 60 * 60 * 1000;
    
    if (cacheHolidays.data && 
        cacheHolidays.year === ano && 
        cacheHolidays.lastFetch && 
        (agora - cacheHolidays.lastFetch) < umDiaEmMs) {
        console.log('📅 Usando feriados do cache para', ano);
        return cacheHolidays.data;
    }
    
    try {
        console.log('🌐 Buscando feriados online para', ano);
        const response = await fetch(`${HOLIDAYS_API_URL}?api_key=${HOLIDAYS_API_KEY}&country=BR&year=${ano}`);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const holidays = await response.json();
        
        // Atualizar cache
        cacheHolidays = {
            data: holidays,
            year: ano,
            lastFetch: agora
        };
        
        console.log(`✅ ${holidays.length} feriados carregados para ${ano}`);
        return holidays;
        
    } catch (error) {
        console.warn('⚠️ Erro ao buscar feriados:', error.message);
        // Retornar feriados básicos do Brasil como fallback
        return getFeriadosBasicos(ano);
    }
}

// Função fallback com feriados básicos do Brasil
function getFeriadosBasicos(ano) {
    return [
        { name: 'Ano Novo', date: `${ano}-01-01`, type: 'national' },
        { name: 'Tiradentes', date: `${ano}-04-21`, type: 'national' },
        { name: 'Dia do Trabalhador', date: `${ano}-05-01`, type: 'national' },
        { name: 'Independência do Brasil', date: `${ano}-09-07`, type: 'national' },
        { name: 'Nossa Senhora Aparecida', date: `${ano}-10-12`, type: 'national' },
        { name: 'Finados', date: `${ano}-11-02`, type: 'national' },
        { name: 'Proclamação da República', date: `${ano}-11-15`, type: 'national' },
        { name: 'Natal', date: `${ano}-12-25`, type: 'national' }
    ];
}

// Função para verificar se uma data é feriado
function isHoliday(dateString, holidays) {
    if (!holidays || holidays.length === 0) return null;
    
    const holiday = holidays.find(h => h.date === dateString);
    return holiday || null;
}

// Função para formatar data no padrão YYYY-MM-DD
function formatDateForAPI(date) {
    const localDate = toLocalDate(date);
    const year = localDate.getFullYear();
    const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
    const day = localDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Função para verificar se precisa atualizar a visualização semanal
function verificarAtualizacaoSemanal() {
    const agora = new Date();
    const hoje = formatDateISO(agora);
    const diaSemana = toLocalDate(agora).getDay();
    
    // Se mudou o dia e é sábado (dia 6), atualizar a visualização
    if (hoje !== ultimaAtualizacaoSemana && diaSemana === 6) {
        console.log('🔄 Atualizando visualização semanal automaticamente (sábado detectado)');
        carregarAgendamentos();
        ultimaAtualizacaoSemana = hoje;
    }
    // Se mudou o dia (qualquer dia), verificar se precisa atualizar
    else if (hoje !== ultimaAtualizacaoSemana) {
        ultimaAtualizacaoSemana = hoje;
        // Recarregar para garantir que a semana está correta
        carregarAgendamentos();
    }
}

// Função para calcular tempo até próximo sábado 00:00
function tempoAteProximoSabado() {
    const agora = new Date();
    const localDate = toLocalDate(agora);
    const proximoSabado = new Date(agora);
    
    // Calcular dias até o próximo sábado (6 = sábado)
    const diasAteProximoSabado = (6 - localDate.getDay() + 7) % 7;
    
    if (diasAteProximoSabado === 0 && localDate.getHours() === 0 && localDate.getMinutes() === 0) {
        // É exatamente sábado 00:00, próximo sábado é em 7 dias
        proximoSabado.setDate(agora.getDate() + 7);
    } else if (diasAteProximoSabado === 0) {
        // É sábado mas não é 00:00, próximo sábado é em 7 dias
        proximoSabado.setDate(agora.getDate() + 7);
    } else {
        // Não é sábado, calcular próximo sábado
        proximoSabado.setDate(agora.getDate() + diasAteProximoSabado);
    }
    
    proximoSabado.setHours(0, 0, 0, 0);
    
    return proximoSabado.getTime() - agora.getTime();
}

// Configurar timer para verificação automática
function iniciarVerificacaoAutomatica() {
    // Verificar imediatamente
    verificarAtualizacaoSemanal();
    
    // Configurar verificação a cada minuto (60000ms)
    setInterval(verificarAtualizacaoSemanal, 60000);
    
    // Configurar timer específico para sábado 00:00
    const tempoAteProximoSabadoMs = tempoAteProximoSabado();
    
    setTimeout(() => {
        console.log('🎯 Sábado 00:00 detectado! Atualizando para próxima semana...');
        carregarAgendamentos();
        
        // Reconfigurar timer para próximo sábado (a cada 7 dias)
        setInterval(() => {
            console.log('🎯 Sábado 00:00 detectado! Atualizando para próxima semana...');
            carregarAgendamentos();
        }, 7 * 24 * 60 * 60 * 1000); // 7 dias em milissegundos
        
    }, tempoAteProximoSabadoMs);
    
    console.log('✅ Verificação automática de atualização semanal iniciada');
    console.log(`⏰ Próxima atualização automática em: ${Math.round(tempoAteProximoSabadoMs / (1000 * 60 * 60))} horas`);
}

// Habilitar botão e carregar agendamentos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    btnAgendar.disabled = false;
    carregarAgendamentos();
    popularHorarios();
    
    // Iniciar verificação automática de atualização semanal
    iniciarVerificacaoAutomatica();

    const dataInput = document.getElementById('data');
    const hoje = new Date();
    const dataMinima = formatDateISO(hoje);
    dataInput.min = dataMinima;

    const horaFimSelect = document.getElementById('hora-fim');
    horaFimSelect.innerHTML = '<option value="">Selecione primeiro a hora de início</option>';

    const horaInicioSelect = document.getElementById('hora-inicio');

    // Configurar caixas clicáveis para equipamentos
    setupCheckboxItems();
    
    // Validação em tempo real para evitar sábados e domingos
    dataInput.addEventListener('change', function() {
        if (this.value) {
            const [ano, mes, dia] = this.value.split('-').map(Number);
            const dataSelecionada = new Date(ano, mes - 1, dia);
            const diaSemana = toLocalDate(dataSelecionada).getDay();
            
            if (diaSemana === 0 || diaSemana === 6) {
                alert('Agendamentos não são permitidos aos sábados e domingos. Por favor, selecione um dia útil.');
                this.value = '';
                return;
            }
        }
    });
    
    horaInicioSelect.addEventListener('change', function () {
        if (this.value) {
            atualizarHorariosFim(this.value);
        } else {
            const horaFimSelect = document.getElementById('hora-fim');
            horaFimSelect.innerHTML = '<option value="">Selecione primeiro a hora de início</option>';
            horaFimSelect.value = '';
        }
    });

    const lousaCheckboxes = document.querySelectorAll('.lousa-checkbox');
    lousaCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                lousaCheckboxes.forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
});

// Função para validar se o horário está dentro do período escolar
function validarHorarioEscolar(input, tipo) {
    const horario = input.value;
    if (!horario) return;
    
    const [h, m] = horario.split(':').map(Number);
    const minutos = h * 60 + m;
    
    // Período válido: 7:10-17:00 (horário escolar atualizado)
    const validoEscolar = (minutos >= 430 && minutos <= 1020); // 7:10 às 17:00
    
    if (!validoEscolar) {
        input.style.borderColor = 'var(--accent-color)';
        input.title = `Horário de ${tipo} deve estar entre 7h10 e 17h`;
    } else {
        input.style.borderColor = '';
        input.title = '';
    }
}

// Função para validar ordem dos horários
function validarOrdemHorarios() {
    // Função removida - permite agendamentos com horário de término maior que inicial
}

// Função para configurar caixas clicáveis de equipamentos
function setupCheckboxItems() {
    const checkboxItems = document.querySelectorAll('.checkbox-item');
    
    // Mapeamento de dependências entre salas e lousas
    const dependencias = {
        'Sala de Informática': 'Lousa Informática',
        'Anfiteatro': 'Lousa Anfiteatro',
        'Biblioteca': 'Lousa Biblioteca',
        'Lousa Informática': 'Sala de Informática',
        'Lousa Anfiteatro': 'Anfiteatro',
        'Lousa Biblioteca': 'Biblioteca'
    };
    
    // Função para gerenciar estado de habilitação/desabilitação
    function gerenciarDependencias() {
        const espacosSelecionados = Array.from(document.querySelectorAll('.espaco-checkbox:checked')).map(cb => cb.value);
        const lousasSelecionadas = Array.from(document.querySelectorAll('.lousa-checkbox:checked')).map(cb => cb.value);
        
        // Resetar todos os estados primeiro
        document.querySelectorAll('.espaco-checkbox, .lousa-checkbox').forEach(cb => {
            cb.disabled = false;
        });
        
        // Se há um espaço selecionado, desabilitar lousas incompatíveis
        if (espacosSelecionados.length > 0) {
            const espacoSelecionado = espacosSelecionados[0];
            const lousaCompativel = dependencias[espacoSelecionado];
            
            document.querySelectorAll('.lousa-checkbox').forEach(cb => {
                if (cb.value !== lousaCompativel) {
                    cb.disabled = true;
                }
            });
        }
        
        // Se há uma lousa selecionada, desabilitar espaços incompatíveis
        if (lousasSelecionadas.length > 0) {
            const lousaSelecionada = lousasSelecionadas[0];
            const espacoCompativel = dependencias[lousaSelecionada];
            
            document.querySelectorAll('.espaco-checkbox').forEach(cb => {
                if (cb.value !== espacoCompativel) {
                    cb.disabled = true;
                }
            });
        }
    }
    
    checkboxItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('label');
        
        // Função para atualizar estado visual
        function updateVisualState() {
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
        
        // Evento de clique na caixa inteira
        item.addEventListener('click', function(e) {
            // Prevenir clique se estiver desabilitado
            if (checkbox.disabled) {
                return;
            }
            
            // Prevenir duplo clique se clicar diretamente no checkbox ou label
            if (e.target === checkbox || e.target === label) {
                return;
            }
            
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
            updateVisualState();
        });
        
        // Evento de mudança no checkbox
        checkbox.addEventListener('change', function() {
            updateVisualState();
            
            // Lógica para permitir apenas uma lousa selecionada
            if (checkbox.classList.contains('lousa-checkbox') && checkbox.checked) {
                const outrasLousas = document.querySelectorAll('.lousa-checkbox');
                outrasLousas.forEach(outraLousa => {
                    if (outraLousa !== checkbox && outraLousa.checked) {
                        outraLousa.checked = false;
                        const outraLousaItem = outraLousa.closest('.checkbox-item');
                        outraLousaItem.classList.remove('selected');
                    }
                });
            }
            
            // Lógica para permitir apenas um espaço selecionado
            if (checkbox.classList.contains('espaco-checkbox') && checkbox.checked) {
                const outrosEspacos = document.querySelectorAll('.espaco-checkbox');
                outrosEspacos.forEach(outroEspaco => {
                    if (outroEspaco !== checkbox && outroEspaco.checked) {
                        outroEspaco.checked = false;
                        const outroEspacoItem = outroEspaco.closest('.checkbox-item');
                        outroEspacoItem.classList.remove('selected');
                    }
                });
            }
            
            // Aplicar lógica de dependências
            gerenciarDependencias();
        });
        
        // Estado inicial
        updateVisualState();
    });
    
    // Aplicar dependências no estado inicial
    gerenciarDependencias();
}

// Função para popular os horários
function popularHorarios() {
    const horaInicioSelect = document.getElementById('hora-inicio');

    horaInicioSelect.innerHTML = '<option value="">Selecione o horário</option>';

    // Horários da manhã - removendo 07:30, 08:30, 09:30, 10:30 e alterando 07:00 para 07:10
    const horariosManha = ['07:10', '08:00', '09:00', '10:00', '11:00', '12:00'];
    
    horariosManha.forEach(horario => {
        horaInicioSelect.innerHTML += `<option value="${horario}">${horario}</option>`;
    });

    // Horários da tarde - removendo 13:30, 14:30, 15:30, 16:30 e alterando 13:10 para 13:00
    const horariosTarde = ['13:00', '14:00', '15:00', '16:00'];
    
    horariosTarde.forEach(horario => {
        horaInicioSelect.innerHTML += `<option value="${horario}">${horario}</option>`;
    });
}

// Atualizar hora fim sem limites de quantidade
function atualizarHorariosFim(horaInicio) {
    const horaFimSelect = document.getElementById('hora-fim');
    horaFimSelect.innerHTML = '<option value="">Selecione o horário</option>';

    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const inicioMin = hIni * 60 + mIni;

    // Definir limite máximo de horas baseado no horário de início
    let limiteHoras;
    const horaInicioStr = `${hIni.toString().padStart(2, '0')}:${mIni.toString().padStart(2, '0')}`;
    
    if (horaInicioStr === '08:00' || horaInicioStr === '14:00') {
        limiteHoras = 3; // 8h ou 14h: máximo 3 horas
    } else if (horaInicioStr === '09:00' || horaInicioStr === '11:00' || horaInicioStr === '15:00') {
        limiteHoras = 2; // 9h, 11h ou 15h: máximo 2 horas
    } else if (horaInicioStr === '10:00' || horaInicioStr === '12:00' || horaInicioStr === '16:00') {
        limiteHoras = 1; // 10h, 12h ou 16h: máximo 1 hora
    } else {
        limiteHoras = 4; // Todos os outros: máximo 4 horas (padrão)
    }

    // Calcular horário máximo permitido
    const maxMin = inicioMin + (limiteHoras * 60);

    // Usar os mesmos horários atualizados - removendo horários :30 e alterando 07:00->07:10, removendo 13:10
    // Incluindo 13:00 e 17:00 apenas para horário de término
    const horarios = ['07:10', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    console.log(`Horário início: ${horaInicioStr}, Limite: ${limiteHoras}h, Máximo permitido: ${Math.floor(maxMin/60)}:${(maxMin%60).toString().padStart(2, '0')}`);

    horarios.forEach(horario => {
        const [h, m] = horario.split(':').map(Number);
        const min = h * 60 + m;
        
        // Verificar se o horário de fim é posterior ao de início E dentro do limite
        if (min > inicioMin && min <= maxMin) {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            horaFimSelect.appendChild(option);
        }
    });

    // Se não há opções disponíveis, mostrar mensagem informativa
    if (horaFimSelect.children.length === 1) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = `Nenhum horário disponível (limite: ${limiteHoras}h)`;
        option.disabled = true;
        horaFimSelect.appendChild(option);
    }
}

// Move agendamentos antigos para histórico
async function moverParaHistorico() {
    const hoje = new Date();
    const hojeLocal = toLocalDate(hoje);
    const ontem = new Date(hojeLocal);
    ontem.setDate(hojeLocal.getDate() - 1);
    const ontemISO = formatDateForAPI(ontem);

    // Buscar agendamentos antigos
    const { data: agendamentosAntigos, error: errorSelect } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .lt('"data"', formatDateForAPI(hojeLocal));

    if (errorSelect) {
        console.error("Erro ao buscar agendamentos antigos:", errorSelect.message);
        return;
    }

    if (agendamentosAntigos && agendamentosAntigos.length > 0) {
        // Inserir no histórico
        const { error: errorInsert } = await supabaseClient
            .from('historico_agendamentos')
            .insert(agendamentosAntigos.map(ag => ({
                nome: ag.nome,
                turma: ag.turma,
                contato: ag.contato,
                equipamentos: ag.equipamentos,
                "data": ag.data,
                "horaInicio": ag.horaInicio,
                "horaFim": ag.horaFim,
                mensagem: ag.mensagem,
                timestamp: ag.timestamp,
                created_at: ag.created_at
            })));

        if (errorInsert) {
            console.error("Erro ao mover para histórico:", errorInsert.message);
            return;
        }

        // Remover da tabela principal
        await supabaseClient
            .from('agendamentos')
            .delete()
            .lt('"data"', formatDateForAPI(hojeLocal));
    }
}

// Função para gerar opções de semanas futuras
function gerarOpcoesSemanasF() {
    const weekSelector = document.getElementById('week-selector');
    const valorAtual = weekSelector.value; // Preservar seleção atual
    weekSelector.innerHTML = '';
    
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    
    // Calcular a segunda-feira da semana base
    let segundaFeiraBase = new Date(hoje);
    if (diaSemana === 6) {
        // Se é sábado, começar da próxima segunda (eliminar semana atual)
        segundaFeiraBase.setDate(hoje.getDate() + 2);
    } else if (diaSemana === 0) {
        // Se é domingo, próxima segunda (em 1 dia)
        segundaFeiraBase.setDate(hoje.getDate() + 1);
    } else {
        // Se é segunda a sexta, segunda-feira da semana atual
        const diasVoltarParaSegunda = diaSemana - 1;
        segundaFeiraBase.setDate(hoje.getDate() - diasVoltarParaSegunda);
    }
    
    // Gerar 9 opções de semanas
    for (let i = 0; i < 9; i++) {
        const segundaFeira = new Date(segundaFeiraBase);
        segundaFeira.setDate(segundaFeiraBase.getDate() + (i * 7));
        
        const sextaFeira = new Date(segundaFeira);
        sextaFeira.setDate(segundaFeira.getDate() + 4);
        
        const dataInicio = formatDateDisplay(formatDateISO(segundaFeira));
        const dataFim = formatDateDisplay(formatDateISO(sextaFeira));
        
        const option = document.createElement('option');
        option.value = i;
        
        // Determinar rótulo baseado no dia da semana
        if (diaSemana === 6) {
            // No sábado, todas são "próximas semanas"
            option.textContent = i === 0 ? 
                `Próxima Semana (${dataInicio} - ${dataFim})` : 
                `Semana ${i + 1} (${dataInicio} - ${dataFim})`;
        } else {
            // Outros dias, primeira é "atual"
            option.textContent = i === 0 ? 
                `Semana Atual (${dataInicio} - ${dataFim})` : 
                `Semana ${i + 1} (${dataInicio} - ${dataFim})`;
        }
        
        weekSelector.appendChild(option);
    }
    
    // Restaurar seleção ou definir padrão
    if (valorAtual && document.querySelector(`option[value="${valorAtual}"]`)) {
        weekSelector.value = valorAtual;
    } else {
        weekSelector.value = '0'; // Primeira semana disponível
    }
}

// Carrega apenas agendamentos de hoje em diante
async function carregarAgendamentos() {
    // Mover agendamentos antigos para histórico
    await moverParaHistorico();

    const hoje = new Date();
    const hojeLocal = toLocalDate(hoje);
    const hojeISO = formatDateForAPI(hojeLocal);

    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .gte('"data"', hojeISO)
        .order('"data"', { ascending: true })
        .order('"horaInicio"', { ascending: true });

    if (error) {
        console.error("Erro ao carregar agendamentos:", error.message);
        return;
    }

    // Gerar opções de semanas
    gerarOpcoesSemanasF();
    
    // Carregar semana atual (índice 0)
    await criarTabelaSemanal(data, 0);
}

async function criarTabelaSemanal(agendamentos, semanaIndex = 0) {
    // Usar os horários atualizados - removendo horários :30 e alterando 07:00->07:10, removendo 13:10
    const horarios = ['07:10', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    // Calcular dinamicamente a semana baseada no índice selecionado
    const hoje = new Date();
    const hojeLocal = toLocalDate(hoje);
    console.log('Data atual:', formatDateTimeDisplay(hoje));
    const diaSemana = hojeLocal.getDay(); // 0 = domingo, 1 = segunda, etc.
    console.log('Dia da semana atual:', diaSemana);
    
    // Calcular a segunda-feira da semana base (atual ou próxima)
    let segundaFeiraBase = new Date(hoje);
    
    if (diaSemana === 6) {
        // Se é sábado, mostrar próxima segunda (em 2 dias)
        segundaFeiraBase.setDate(hoje.getDate() + 2);
    } else if (diaSemana === 0) {
        // Se é domingo, mostrar próxima segunda (em 1 dia)
        segundaFeiraBase.setDate(hoje.getDate() + 1);
    } else {
        // Se é segunda a sexta, mostrar a segunda-feira da semana atual
        const diasVoltarParaSegunda = diaSemana - 1; // 1=segunda, 2=terça, etc.
        segundaFeiraBase.setDate(hoje.getDate() - diasVoltarParaSegunda);
    }
    
    // Ajustar para o fuso horário local
    segundaFeiraBase = toLocalDate(segundaFeiraBase);
    
    // Calcular a segunda-feira da semana selecionada
    const segundaFeira = new Date(segundaFeiraBase);
    segundaFeira.setDate(segundaFeiraBase.getDate() + (semanaIndex * 7));
    
    console.log('Segunda-feira da semana exibida:', formatDateDisplay(formatDateISO(segundaFeira)));

    // Criar array com as datas da semana (segunda a sexta)
    const diasSemana = [];
    const nomesDias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
    
    for (let i = 0; i < 5; i++) {
        const dia = new Date(segundaFeira);
        dia.setDate(segundaFeira.getDate() + i);
        const diaLocal = toLocalDate(dia);
        const diaISO = formatDateISO(diaLocal);
        diasSemana.push(diaISO);
        console.log(`${nomesDias[i]}: ${formatDateDisplay(diaISO)}`);
    }
    
    // Buscar feriados para o ano atual
    const anoAtual = segundaFeira.getFullYear();
    const feriados = await buscarFeriados(anoAtual);
    
    // Atualizar cabeçalho da tabela com as datas e indicação de feriados
    const cabecalhos = document.querySelectorAll('.tabela-semanal .dia-col');
    cabecalhos.forEach((th, index) => {
        const dataFormatada = formatDateDisplay(diasSemana[index]).substring(0, 5); // DD/MM
        const feriado = isHoliday(diasSemana[index], feriados);
        
        if (feriado) {
            th.innerHTML = `${nomesDias[index]} (${dataFormatada})<br><small class="holiday-indicator">🎉 ${feriado.name}</small>`;
            th.classList.add('holiday-header');
        } else {
            th.textContent = `${nomesDias[index]} (${dataFormatada})`;
            th.classList.remove('holiday-header');
        }
    });

    // Organizar agendamentos por data e horário (expandindo por todo o período)
    const agendamentosPorDiaHora = {};
    agendamentos.forEach(ag => {
        const data = ag.data;
        const horaInicio = ag.horaInicio.substring(0, 5);
        const horaFim = ag.horaFim.substring(0, 5);
        
        // Converter horários para minutos para facilitar comparação
        const [hIni, mIni] = horaInicio.split(':').map(Number);
        const [hFim, mFim] = horaFim.split(':').map(Number);
        const inicioMinutos = hIni * 60 + mIni;
        const fimMinutos = hFim * 60 + mFim;
        
        // Preencher todas as células do período agendado
        horarios.forEach(horario => {
            const [h, m] = horario.split(':').map(Number);
            const horarioMinutos = h * 60 + m;
            
            // Se o horário está dentro do período agendado
            if (horarioMinutos >= inicioMinutos && horarioMinutos < fimMinutos) {
                if (!agendamentosPorDiaHora[data]) {
                    agendamentosPorDiaHora[data] = {};
                }
                if (!agendamentosPorDiaHora[data][horario]) {
                    agendamentosPorDiaHora[data][horario] = [];
                }
                agendamentosPorDiaHora[data][horario].push(ag);
            }
        });
    });

    // Limpar tabela
    tabelaBody.innerHTML = '';

    // Criar linhas da tabela
    horarios.forEach((horario, index) => {
        
        const tr = document.createElement('tr');
        
        // Coluna do horário
        const tdHorario = document.createElement('td');
        tdHorario.className = 'horario-cell';
        tdHorario.textContent = horario;
        tr.appendChild(tdHorario);

        // Colunas dos dias da semana
        diasSemana.forEach(data => {
            const td = document.createElement('td');
            
            // Verificar se é feriado
            const feriado = isHoliday(data, feriados);
            if (feriado) {
                td.classList.add('holiday-cell');
                td.title = `Feriado: ${feriado.name}`;
            }
            
            if (agendamentosPorDiaHora[data] && agendamentosPorDiaHora[data][horario]) {
                agendamentosPorDiaHora[data][horario].forEach(ag => {
                    const agendamentoDiv = document.createElement('div');
                    agendamentoDiv.className = 'agendamento-item agendamento-box';
                    
                    // Adicionar tooltip com mensagem se existir
                    if (ag.mensagem && ag.mensagem.trim() !== '') {
                        agendamentoDiv.setAttribute('data-mensagem', ag.mensagem);
                        setupTooltip(agendamentoDiv, ag.mensagem);
                    }
                    
                    const nomeDiv = document.createElement('div');
                    nomeDiv.className = 'agendamento-nome';
                    nomeDiv.textContent = `${ag.nome} - ${ag.turma}`;
                    
                    const equipamentoDiv = document.createElement('div');
                    equipamentoDiv.className = 'agendamento-equipamento';
                    equipamentoDiv.textContent = ag.equipamentos.join(', ');

                    agendamentoDiv.appendChild(nomeDiv);
                    agendamentoDiv.appendChild(equipamentoDiv);
                    // Aplicar classes visuais no elemento interno conforme equipamentos
                    const eqs = Array.isArray(ag.equipamentos) ? ag.equipamentos : [];
                    if (eqs.some(e => e === 'Lousa Informática' || e === 'Sala de Informática')) {
                        agendamentoDiv.classList.add('agendamento-info');
                    }
                    if (eqs.some(e => e === 'Anfiteatro' || e === 'Lousa Anfiteatro')) {
                        agendamentoDiv.classList.add('agendamento-anf');
                    }
                    if (eqs.some(e => e === 'Biblioteca' || e === 'Lousa Biblioteca')) {
                        agendamentoDiv.classList.add('agendamento-bib');
                    }
                    td.appendChild(agendamentoDiv);
                });
            } else {
                td.className = feriado ? 'dia-vazio holiday-cell' : 'dia-vazio';
            }
            
            tr.appendChild(td);
        });
        
        tabelaBody.appendChild(tr);
    });
}

// Verifica conflito
// Função auxiliar para converter horário (HH:MM) em minutos
function horarioParaMinutos(horario) {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
}

// Regras de família para espaços fixos e lousas móveis
const FIXOS = ["Sala de Informática", "Anfiteatro", "Biblioteca"];
const MOVEIS = ["Lousa Informática", "Lousa Anfiteatro", "Lousa Biblioteca"];
const FAMILIA = {
  "Sala de Informática": "Lousa Informática",
  "Anfiteatro": "Lousa Anfiteatro",
  "Biblioteca": "Lousa Biblioteca"
};

async function verificarConflito(data, horaInicio, horaFim, equipamentos, turma, nome) {
    try {
        // Consulta otimizada: buscar apenas campos necessários
        const { data: agendamentos, error } = await supabaseClient
            .from('agendamentos')
            .select('nome, turma, equipamentos, horaInicio, horaFim')
            .eq('"data"', data);

        if (error) {
            console.error("Erro ao verificar conflitos:", error.message);
            return "Erro ao verificar conflitos. Tente novamente.";
        }

        // Se não há agendamentos na data, não há conflito
        if (!agendamentos || agendamentos.length === 0) {
            return null;
        }

        // Converter horários para minutos para comparação precisa
        const inicioMinutos = horarioParaMinutos(horaInicio);
        const fimMinutos = horarioParaMinutos(horaFim);

        for (const ag of agendamentos) {
            // Converter horários do agendamento existente para minutos
            const agInicioMinutos = horarioParaMinutos(ag.horaInicio);
            const agFimMinutos = horarioParaMinutos(ag.horaFim);

            // Verificar sobreposição de horários
            // Dois intervalos se sobrepõem se: início1 < fim2 E fim1 > início2
            // Agendamentos consecutivos (fim1 = início2 ou início1 = fim2) NÃO são conflito
            const temSobreposicao = inicioMinutos < agFimMinutos && fimMinutos > agInicioMinutos;

            console.log(`Verificando: Novo(${horaInicio}-${horaFim} = ${inicioMinutos}-${fimMinutos}min) vs Existente(${ag.horaInicio}-${ag.horaFim} = ${agInicioMinutos}-${agFimMinutos}min)`);
            console.log(`Sobreposição: ${temSobreposicao} (${inicioMinutos} < ${agFimMinutos} = ${inicioMinutos < agFimMinutos}) && (${fimMinutos} > ${agInicioMinutos} = ${fimMinutos > agInicioMinutos})`);

            if (temSobreposicao) {
                // Verificar conflito de equipamentos (mantido como está hoje)
                const equipamentosConflito = ag.equipamentos.filter(eq => equipamentos.includes(eq));
                if (equipamentosConflito.length > 0) {
                    return `Conflito de equipamento: ${equipamentosConflito.join(', ')} já está(ão) agendado(s) das ${ag.horaInicio} às ${ag.horaFim} para "${ag.nome}".`;
                }

                // Verificar conflito de turma com novas regras FIXO/MÓVEL por família
                if (ag.turma === turma) {
                    // Classificar novos e existentes entre FIXOS e MÓVEIS
                    const novos = Array.isArray(equipamentos) ? equipamentos : [];
                    const existentes = Array.isArray(ag.equipamentos) ? ag.equipamentos : [];

                    const novoFixo = novos.find(e => FIXOS.includes(e));
                    const novoMovel = novos.find(e => MOVEIS.includes(e));
                    const existenteFixo = existentes.find(e => FIXOS.includes(e));
                    const existenteMovel = existentes.find(e => MOVEIS.includes(e));

                    // Regra 1: FIXO + FIXO (mesmo dia/horário/turma) → BLOQUEAR
                    if (novoFixo && existenteFixo) {
                        const existente = existenteFixo;
                        return `🚫 Ops! A turma "${turma}" já reservou um espaço fixo neste horário (${existente}).\nEspaços como Sala de Informática, Biblioteca e Anfiteatro só podem ser usados um por vez.`;
                    }

                    // Regra 2: MÓVEL + MÓVEL (mesmo dia/horário/turma) → BLOQUEAR
                    if (novoMovel && existenteMovel) {
                        const existente = existenteMovel;
                        return `🚫 Atenção! A turma "${turma}" já reservou um equipamento móvel neste horário (${existente}).\nSomente uma lousa pode ser utilizada por vez.`;
                    }

                    // Regra 3: FIXO + MÓVEL (mesmo dia/horário/turma)
                    if ((novoFixo && existenteMovel) || (novoMovel && existenteFixo)) {
                        const fixo = novoFixo || existenteFixo;
                        const movel = novoMovel || existenteMovel;

                        // Se são da mesma família → PERMITIR (sem conflito)
                        if (fixo && movel && FAMILIA[fixo] === movel) {
                            // permitido: continuar verificando outros agendamentos
                        } else {
                            const novo = novoFixo ? novoFixo : novoMovel;
                            const existente = novoFixo ? existenteMovel : existenteFixo;
                            return `⚠️ Atenção! Para esta turma o uso combinado só é permitido quando espaço e equipamento são da mesma família.\nVocê tentou usar "${novo}" junto com "${existente}".\nExemplo permitido: "${FAMILIA[fixo]}" com "${fixo}".`;
                        }
                    } else {
                        // Qualquer outra combinação de mesma turma e horário mantém regra atual: bloquear
                        return `Conflito de turma: A turma "${turma}" já tem agendamento das ${ag.horaInicio} às ${ag.horaFim} para "${ag.nome}".`;
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.error("Erro inesperado ao verificar conflitos:", error);
        return "Erro inesperado ao verificar conflitos. Tente novamente.";
    }
}

// Envio do formulário - Interceptar para exibir modal de confirmação
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Capturar dados do formulário
    const dados = capturarDadosFormulario();

    // Validações básicas antes de exibir o modal
    if (dados.equipamentos.length === 0) {
        alert("Selecione ao menos um equipamento.");
        return;
    }

    if (!dados.nome.trim()) {
        alert("Por favor, preencha o nome.");
        return;
    }

    if (!dados.turma.trim()) {
        alert("Por favor, preencha a turma.");
        return;
    }

    if (!dados.data) {
        alert("Por favor, selecione uma data.");
        return;
    }

    if (!dados.horaInicio || !dados.horaFim) {
        alert("Por favor, selecione os horários de início e fim.");
        return;
    }

    // Armazenar dados temporariamente e exibir modal
    dadosFormularioTemp = dados;
    exibirModalConfirmacao(dados);
});

// Função para enviar notificação por e-mail
async function enviarNotificacaoEmail(dadosAgendamento) {
    console.log('🔄 Iniciando envio de e-mail...', dadosAgendamento);
    
    try {
        // Verificar se as configurações do EmailJS estão disponíveis
        if (typeof EMAILJS_CONFIG === 'undefined') {
            console.error('❌ Configurações do EmailJS não encontradas!');
            return;
        }
        console.log('✅ Configurações do EmailJS encontradas:', EMAILJS_CONFIG);

        // Verificar se o EmailJS está carregado
        if (typeof emailjs === 'undefined') {
            console.error('❌ EmailJS não está carregado!');
            return;
        }
        console.log('✅ EmailJS está carregado');

        // Usar configurações do arquivo emailjs-config.js
        const { serviceID, templateID, publicKey } = EMAILJS_CONFIG;

        // Formatar data para exibição
        const [ano, mes, dia] = dadosAgendamento.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        // Formatar horários
        const horaInicio = dadosAgendamento.horaInicio.substring(0, 5);
        const horaFim = dadosAgendamento.horaFim.substring(0, 5);

        // Parâmetros do template de e-mail
        const templateParams = {
            to_email: 'eric.benaglia@edu.treslagoas.ms.gov.br',
            from_name: 'AgendaTec',
            from_email: 'no-reply@seudominio.com',
            professor_nome: dadosAgendamento.nome,
            professor_turma: dadosAgendamento.turma,
            professor_contato: dadosAgendamento.contato,
            equipamentos: dadosAgendamento.equipamentos.join(', '),
            data_agendamento: dataFormatada,
            horario_inicio: horaInicio,
            horario_fim: horaFim,
            mensagem: dadosAgendamento.mensagem || 'Nenhuma mensagem adicional',
            timestamp: new Date().toLocaleString('pt-BR')
        };
        
        console.log('📧 Parâmetros do e-mail:', templateParams);

        // Enviar e-mail usando EmailJS com timeout de 10 segundos
        console.log('📤 Enviando e-mail...');
        const emailPromise = emailjs.send(serviceID, templateID, templateParams, publicKey);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout no envio de e-mail')), 10000)
        );
        
        const result = await Promise.race([emailPromise, timeoutPromise]);
        console.log('✅ E-mail de notificação enviado com sucesso!', result);
        
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail de notificação:', error);
        console.error('Detalhes do erro:', error.message, error.stack);
        // Não interrompe o fluxo do agendamento se o e-mail falhar
    }
}

// Variável global para armazenar dados do histórico
let dadosHistorico = [];

// Função para carregar histórico
async function carregarHistorico() {
    const btnCarregar = document.getElementById('btn-carregar-historico');
    const btnPDF = document.getElementById('btn-baixar-pdf');
    const tabelaContainer = document.getElementById('historico-table-container');
    const tabelaBody = document.querySelector('#tabela-historico tbody');

    btnCarregar.classList.add('loading');
    btnCarregar.textContent = 'Carregando...';

    try {
        const { data, error } = await supabaseClient
            .from('historico_agendamentos')
            .select('*')
            .order('"data"', { ascending: false })
            .order('"horaInicio"', { ascending: false });

        if (error) {
            console.error("Erro ao carregar histórico:", error.message);
            alert("Erro ao carregar histórico: " + error.message);
            return;
        }

        dadosHistorico = data || [];
        tabelaBody.innerHTML = '';

        if (dadosHistorico.length === 0) {
            tabelaBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--light-color);">Nenhum agendamento no histórico</td></tr>';
        } else {
            dadosHistorico.forEach(ag => {
                const horaInicio = ag.horaInicio.substring(0, 5);
                const horaFim = ag.horaFim.substring(0, 5);
                const [ano, mes, dia] = ag.data.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${ag.nome}</td>
                    <td>${ag.turma}</td>
                    <td>${ag.equipamentos.join(', ')}</td>
                    <td>${dataFormatada}</td>
                    <td>${horaInicio} - ${horaFim}</td>
                    <td>${ag.mensagem || ''}</td>
                `;
                tabelaBody.appendChild(tr);
            });
        }

        tabelaContainer.style.display = 'block';
        btnPDF.style.display = dadosHistorico.length > 0 ? 'flex' : 'none';

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        alert("Erro ao carregar histórico");
    } finally {
        btnCarregar.classList.remove('loading');
        btnCarregar.innerHTML = '<i class="fas fa-history"></i> Atualizar Histórico';
    }
}

// Função para gerar PDF
function gerarPDF() {
    if (dadosHistorico.length === 0) {
        alert('Nenhum dado no histórico para gerar PDF');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurar fonte para suportar caracteres especiais
    doc.setFont('helvetica');

    // Título
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text('Histórico de Agendamentos', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    const hoje = new Date();
    const dataRelatorio = formatDateTimeDisplay(hoje);
    doc.text(`Relatório gerado em: ${dataRelatorio}`, 20, 30);

    // Preparar dados para a tabela
    const colunas = ['Nome', 'Turma', 'Equipamentos', 'Data', 'Horário', 'Mensagem'];
    const linhas = dadosHistorico.map(ag => {
        const horaInicio = ag.horaInicio.substring(0, 5);
        const horaFim = ag.horaFim.substring(0, 5);
        const dataFormatada = formatDateDisplay(ag.data);
        
        return [
            ag.nome,
            ag.turma,
            ag.equipamentos.join(', '),
            dataFormatada,
            `${horaInicio} - ${horaFim}`,
            ag.mensagem || ''
        ];
    });

    // Gerar tabela
    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 50,
        styles: {
            fontSize: 8,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [33, 150, 243],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { top: 50, left: 20, right: 20 },
        columnStyles: {
            0: { cellWidth: 30 }, // Nome
            1: { cellWidth: 25 }, // Turma
            2: { cellWidth: 40 }, // Equipamentos
            3: { cellWidth: 20 }, // Data
            4: { cellWidth: 25 }, // Horário
            5: { cellWidth: 30 }  // Mensagem
        }
    });

    // Salvar PDF
    const dataArquivo = formatDateISO(new Date()).replace(/-/g, '_');
    const nomeArquivo = `historico_agendamentos_${dataArquivo}.pdf`;
    doc.save(nomeArquivo);
}

// Event listeners para os botões do histórico
document.getElementById('btn-carregar-historico').addEventListener('click', carregarHistorico);
document.getElementById('btn-baixar-pdf').addEventListener('click', gerarPDF);

// Função para verificar se precisa atualizar o menu (chamada periodicamente)
function verificarAtualizacaoMenu() {
    const hoje = new Date();
    const diaSemana = toLocalDate(hoje).getDay();
    
    // Se é sábado, regenerar opções para eliminar semana atual
    if (diaSemana === 6) {
        const weekSelector = document.getElementById('week-selector');
        const primeiraOpcao = weekSelector.querySelector('option');
        
        // Verificar se ainda mostra "Semana Atual" no sábado
        if (primeiraOpcao && primeiraOpcao.textContent.includes('Semana Atual')) {
            gerarOpcoesSemanasF();
            // Recarregar agendamentos para a nova semana selecionada
            carregarAgendamentos();
        }
    }
}

// Event listener para mudança de semana selecionada
document.getElementById('week-selector').addEventListener('change', async function() {
    const semanaIndex = parseInt(this.value);
    console.log('Semana selecionada:', semanaIndex);
    
    // Recarregar agendamentos para a semana selecionada
    const hoje = new Date();
    const hojeISO = formatDateISO(hoje);
    
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .gte('"data"', hojeISO)
        .order('"data"', { ascending: true })
        .order('"horaInicio"', { ascending: true });
    
    if (error) {
        console.error("Erro ao carregar agendamentos:", error.message);
        return;
    }
    
    await criarTabelaSemanal(data, semanaIndex);
});

// Verificar atualizações do menu a cada 30 minutos
setInterval(verificarAtualizacaoMenu, 30 * 60 * 1000);

// Verificar imediatamente ao carregar a página
verificarAtualizacaoMenu();

// Google Calendar event listeners removed

// Limpar tokens do Google Calendar do localStorage
if (localStorage.getItem('google_calendar_token')) {
    localStorage.removeItem('google_calendar_token');
    console.log('Token do Google Calendar removido do localStorage');
}
if (localStorage.getItem('google_calendar_refresh_token')) {
    localStorage.removeItem('google_calendar_refresh_token');
    console.log('Refresh token do Google Calendar removido do localStorage');
}
if (localStorage.getItem('google_calendar_expires_at')) {
    localStorage.removeItem('google_calendar_expires_at');
    console.log('Data de expiração do Google Calendar removida do localStorage');
}

// ===== SISTEMA DE TOOLTIP PERSONALIZADO =====

let currentTooltip = null;

function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
}

function showTooltip(element, message, event) {
    // Remove tooltip anterior se existir
    hideTooltip();
    
    // Cria novo tooltip
    currentTooltip = createTooltip();
    currentTooltip.textContent = message;
    
    // Posiciona o tooltip próximo ao cursor
    positionTooltip(currentTooltip, event);
    
    // Mostra o tooltip com animação
    setTimeout(() => {
        if (currentTooltip) {
            currentTooltip.classList.add('show');
        }
    }, 10);
}

function hideTooltip() {
    if (currentTooltip) {
        currentTooltip.classList.remove('show');
        setTimeout(() => {
            if (currentTooltip && currentTooltip.parentNode) {
                currentTooltip.parentNode.removeChild(currentTooltip);
            }
            currentTooltip = null;
        }, 200);
    }
}

function positionTooltip(tooltip, event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // Posição inicial: acima do cursor
    let tooltipX = mouseX + scrollX;
    let tooltipY = mouseY + scrollY - 40;
    
    // Ajusta posição para não sair da tela
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Ajuste horizontal
    if (tooltipX + tooltipRect.width > windowWidth + scrollX) {
        tooltipX = windowWidth + scrollX - tooltipRect.width - 10;
    }
    if (tooltipX < scrollX + 10) {
        tooltipX = scrollX + 10;
    }
    
    // Ajuste vertical - se não cabe acima, coloca abaixo
    if (tooltipY < scrollY + 10) {
        tooltipY = mouseY + scrollY + 20;
        // Muda a seta para apontar para cima
        tooltip.style.setProperty('--arrow-position', 'top');
        tooltip.classList.add('arrow-top');
    } else {
        tooltip.style.setProperty('--arrow-position', 'bottom');
        tooltip.classList.remove('arrow-top');
    }
    
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
}

function updateTooltipPosition(event) {
    if (currentTooltip) {
        positionTooltip(currentTooltip, event);
    }
}

function setupTooltip(element, message) {
    element.addEventListener('mouseenter', (event) => {
        showTooltip(element, message, event);
    });
    
    element.addEventListener('mouseleave', () => {
        hideTooltip();
    });
    
    element.addEventListener('mousemove', (event) => {
        updateTooltipPosition(event);
    });
}

// Limpa tooltips ao sair da página
window.addEventListener('beforeunload', hideTooltip);

// ===== SUPABASE REALTIME CONFIGURATION =====

// Configuração do Realtime para monitorar alterações na tabela agendamentos
let realtimeChannel = null;

function iniciarRealtimeMonitoring() {
    // Remove canal anterior se existir
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
    }

    // Cria novo canal para monitorar a tabela agendamentos
    realtimeChannel = supabaseClient
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
                await atualizarTabelaRealtime(payload);
            }
        )
        .subscribe((status) => {
            console.log('Status do Realtime:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime conectado com sucesso!');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Erro na conexão Realtime');
                // Tenta reconectar após 5 segundos
                setTimeout(iniciarRealtimeMonitoring, 5000);
            }
        });
}

async function atualizarTabelaRealtime(payload) {
    try {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        console.log(`Evento Realtime: ${eventType}`, { newRecord, oldRecord });
        
        // Força recarregar os agendamentos diretamente do Supabase
        const { data: novosAgendamentos, error } = await supabaseClient
            .from('agendamentos')
            .select('*')
            .order('data', { ascending: true });
            
        if (error) throw error;
        
        // Atualiza a variável global de agendamentos
        agendamentos = novosAgendamentos;
        
        // Atualiza a tabela semanal
        const semanaAtual = document.getElementById('week-selector').value || 0;
        await criarTabelaSemanal(agendamentos, parseInt(semanaAtual));
        
        // Mostra notificação visual para o usuário
        mostrarNotificacaoRealtime(eventType, newRecord, oldRecord);
        
    } catch (error) {
        console.error('Erro ao atualizar tabela em tempo real:', error);
    }
}

function mostrarNotificacaoRealtime(eventType, newRecord, oldRecord) {
    let mensagem = '';
    let tipo = 'info';
    
    switch (eventType) {
        case 'INSERT':
            mensagem = `📅 Novo agendamento criado: ${newRecord.nome || 'Sem nome'}`;
            tipo = 'success';
            break;
        case 'UPDATE':
            mensagem = `✏️ Agendamento atualizado: ${newRecord.nome || oldRecord.nome || 'Sem nome'}`;
            tipo = 'warning';
            break;
        case 'DELETE':
            mensagem = `🗑️ Agendamento removido: ${oldRecord.nome || 'Sem nome'}`;
            tipo = 'error';
            break;
        default:
            mensagem = '🔄 Tabela de agendamentos atualizada';
    }
    
    // Cria elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `realtime-notification ${tipo}`;
    notificacao.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${mensagem}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adiciona estilos se não existirem
    if (!document.getElementById('realtime-styles')) {
        const styles = document.createElement('style');
        styles.id = 'realtime-styles';
        styles.textContent = `
            .realtime-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInRight 0.3s ease-out;
                font-family: Arial, sans-serif;
                font-size: 14px;
            }
            
            .realtime-notification.success {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }
            
            .realtime-notification.warning {
                background: linear-gradient(135deg, #FF9800, #f57c00);
                color: white;
            }
            
            .realtime-notification.error {
                background: linear-gradient(135deg, #f44336, #d32f2f);
                color: white;
            }
            
            .realtime-notification.info {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .notification-close:hover {
                background-color: rgba(255,255,255,0.2);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Adiciona notificação ao DOM
    document.body.appendChild(notificacao);
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
        if (notificacao.parentElement) {
            notificacao.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 5000);
}

// Função para limpar conexões Realtime ao sair da página
function limparRealtimeConnections() {
    if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
        console.log('🔌 Conexão Realtime encerrada');
    }
}

// Event listeners para gerenciar conexões
window.addEventListener('beforeunload', limparRealtimeConnections);
window.addEventListener('unload', limparRealtimeConnections);

// Inicia o monitoramento Realtime quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que o Supabase está inicializado
    setTimeout(iniciarRealtimeMonitoring, 1000);
});

// Reconecta automaticamente se a conexão for perdida
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && realtimeChannel) {
        // Página ficou visível novamente, verifica conexão
        setTimeout(() => {
            if (realtimeChannel.state !== 'joined') {
                console.log('🔄 Reconectando Realtime...');
                iniciarRealtimeMonitoring();
            }
        }, 1000);
    }
});

console.log('🚀 Supabase Realtime configurado com sucesso!');

// ===== MODAL DE CONFIRMAÇÃO =====

// Elementos do modal
const modalOverlay = document.getElementById('modal-confirmacao');
const modalClose = document.querySelector('.modal-close');
const btnCancelar = document.querySelector('.btn-cancelar');
const btnConfirmar = document.querySelector('.btn-confirmar');

// Variável para armazenar os dados do formulário temporariamente
let dadosFormularioTemp = null;

// Função para capturar dados do formulário
function capturarDadosFormulario() {
    const equipamentosSelecionados = [];
    
    // Capturar equipamentos selecionados
    const checkboxes = document.querySelectorAll('input[name="equipamentos"]:checked');
    checkboxes.forEach(checkbox => {
        equipamentosSelecionados.push(checkbox.value);
    });
    
    // Capturar dados do formulário diretamente dos elementos
    const dados = {
        nome: document.getElementById('nome').value || '',
        turma: document.getElementById('turma').value || '',
        contato: document.getElementById('contato').value || '',
        equipamentos: equipamentosSelecionados,
        data: document.getElementById('data').value || '',
        horaInicio: document.getElementById('hora-inicio').value || '',
        horaFim: document.getElementById('hora-fim').value || '',
        mensagem: document.getElementById('mensagem').value || ''
    };
    
    return dados;
}

// Função para formatar data para exibição
function formatarDataExibicao(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para formatar horário para exibição
function formatarHorarioExibicao(horario) {
    if (!horario) return '';
    return horario.substring(0, 5);
}

// Função para exibir o modal com os dados
function exibirModalConfirmacao(dados) {
    // Preencher os dados no modal
    document.getElementById('resumo-nome').textContent = dados.nome || 'Não informado';
    document.getElementById('resumo-turma').textContent = dados.turma || 'Não informado';
    document.getElementById('resumo-contato').textContent = dados.contato && dados.contato.trim() !== '' ? dados.contato : '(nenhum)';
    document.getElementById('resumo-equipamentos').textContent = dados.equipamentos.length > 0 ? dados.equipamentos.join(', ') : 'Nenhum equipamento selecionado';
    document.getElementById('resumo-data').textContent = formatarDataExibicao(dados.data) || 'Não informado';
    document.getElementById('resumo-horario').textContent = dados.horaInicio && dados.horaFim ? 
        `${formatarHorarioExibicao(dados.horaInicio)} - ${formatarHorarioExibicao(dados.horaFim)}` : 'Não informado';
    
    // Tratar mensagem (ocultar se estiver vazia)
    const itemMensagem = document.getElementById('resumo-mensagem-container');
    if (dados.mensagem && dados.mensagem.trim() !== '') {
        document.getElementById('resumo-mensagem').textContent = dados.mensagem;
        itemMensagem.classList.remove('hidden');
    } else {
        itemMensagem.classList.add('hidden');
    }
    
    // Exibir o modal
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevenir scroll da página
}

// Função para fechar o modal
function fecharModal() {
    modalOverlay.classList.remove('show');
    document.body.style.overflow = ''; // Restaurar scroll da página
    dadosFormularioTemp = null;
}

// Função para processar o envio do formulário (código original)
async function processarEnvioFormulario(dados) {
    try {
        // Mostrar loading no botão confirmar
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btnConfirmar.disabled = true;
        
        // Validações (código original do form.addEventListener)
        if (dados.equipamentos.length === 0) {
            throw new Error('Por favor, selecione pelo menos um equipamento.');
        }

        if (dados.equipamentos.includes('Sala de Informática') && dados.mensagem.trim().length < 9) {
            throw new Error('Para agendar a Sala de Informática, é necessário informar o conteúdo didático aplicado aos alunos (mínimo de 9 caracteres).');
        }

        const lousasSelecionadas = dados.equipamentos.filter(eq => eq.includes('lousa'));
        if (lousasSelecionadas.length > 1) {
            throw new Error('Você pode selecionar apenas uma lousa por agendamento.');
        }

        const espacosSelecionados = dados.equipamentos.filter(eq => ['Sala de Informática', 'Anfiteatro', 'Biblioteca'].includes(eq));
        if (espacosSelecionados.length > 1) {
            throw new Error('Você pode selecionar apenas um espaço por agendamento.');
        }

        const dataAgendamento = parseDateBR(dados.data);
        const hoje = new Date();
        const hojeLocal = toLocalDate(hoje);
        hojeLocal.setHours(0, 0, 0, 0);

        if (toLocalDate(dataAgendamento) < hojeLocal) {
            throw new Error('Não é possível agendar para datas passadas.');
        }

        if (dados.equipamentos.includes('Sala de Informática')) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const dataSelecionada = new Date(dataAgendamento);
            dataSelecionada.setHours(0, 0, 0, 0);

            if (dataSelecionada.getTime() === hoje.getTime()) {
                throw new Error('A Sala de Informática deve ser agendada com pelo menos 1 dia de antecedência. Por favor, selecione uma data a partir de amanhã.');
            }
        }

        const diaSemana = toLocalDate(dataAgendamento).getDay();
        if (diaSemana === 0 || diaSemana === 6) {
            throw new Error('Agendamentos não são permitidos aos finais de semana.');
        }

        const horaInicioMinutos = horarioParaMinutos(dados.horaInicio);
        const horaFimMinutos = horarioParaMinutos(dados.horaFim);

        if (horaInicioMinutos >= horaFimMinutos) {
            throw new Error('O horário de início deve ser anterior ao horário de fim.');
        }

        if (horaInicioMinutos < 420 || horaFimMinutos > 1080) {
            throw new Error('Os agendamentos devem estar entre 07:00 e 18:00.');
        }

        // Verificar conflitos
        const conflito = await verificarConflito(dados.data, dados.horaInicio, dados.horaFim, dados.equipamentos, dados.turma, dados.nome);
        if (conflito) {
            throw new Error(conflito);
        }

        // Inserir no Supabase
        const { data: novoAgendamento, error } = await supabaseClient
            .from('agendamentos')
            .insert([{
                nome: dados.nome,
                turma: dados.turma,
                contato: dados.contato,
                equipamentos: dados.equipamentos,
                data: dados.data,
                horaInicio: dados.horaInicio,
                horaFim: dados.horaFim,
                mensagem: dados.mensagem || null
            }])
            .select();

        if (error) {
            console.error('Erro ao inserir agendamento:', error);
            throw new Error('Erro ao salvar agendamento. Tente novamente.');
        }

        // Enviar notificação por email
        await enviarNotificacaoEmail({
            nome: dados.nome,
            turma: dados.turma,
            contato: dados.contato,
            equipamentos: dados.equipamentos,
            data: dados.data,
            horaInicio: dados.horaInicio,
            horaFim: dados.horaFim,
            mensagem: dados.mensagem
        });

        // Fechar modal
        fecharModal();

        // Mostrar sucesso
        alert('Agendamento realizado com sucesso!');

        // Limpar formulário
        form.reset();
        setupCheckboxItems();

        // Recarregar agendamentos
        await carregarAgendamentos();

    } catch (error) {
        console.error('Erro no envio:', error);
        alert(error.message);
    } finally {
        // Restaurar botão confirmar
        btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Agendamento';
        btnConfirmar.disabled = false;
    }
}

// Event listeners do modal
modalClose.addEventListener('click', fecharModal);
btnCancelar.addEventListener('click', fecharModal);

btnConfirmar.addEventListener('click', async () => {
    if (dadosFormularioTemp) {
        await processarEnvioFormulario(dadosFormularioTemp);
    }
});

// Fechar modal ao clicar no overlay
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        fecharModal();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('show')) {
        fecharModal();
    }
});

// Função isolada para manter o Supabase ativo (keep-alive)
async function pingSupabase() { 
  try { 
    await supabaseClient 
      .from('agendamentos') 
      .select('id') 
      .limit(1) 
  } catch (e) { 
    console.warn('Ping Supabase falhou:', e.message) 
  } 
} 

// Executa uma vez ao carregar e depois a cada 5 minutos
pingSupabase();
setInterval(pingSupabase, 5 * 60 * 1000);
