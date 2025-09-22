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
let ultimaAtualizacaoSemana = new Date().toISOString().split('T')[0];

// Funções utilitárias para formatação internacional de datas
function formatDateISO(date) {
    return date.toISOString().split('T')[0];
}

function formatDateDisplay(dateString) {
    // Converte YYYY-MM-DD para DD/MM/YYYY para exibição
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatDateTimeDisplay(date) {
    // Formato internacional para exibição: DD/MM/YYYY HH:MM
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Função para verificar se precisa atualizar a visualização semanal
function verificarAtualizacaoSemanal() {
    const agora = new Date();
    const hoje = formatDateISO(agora);
    const diaSemana = agora.getDay();
    
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
    const proximoSabado = new Date(agora);
    
    // Calcular dias até o próximo sábado (6 = sábado)
    const diasAteProximoSabado = (6 - agora.getDay() + 7) % 7;
    
    if (diasAteProximoSabado === 0 && agora.getHours() === 0 && agora.getMinutes() === 0) {
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
    const dataMinima = hoje.toISOString().split('T')[0];
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
            const diaSemana = dataSelecionada.getDay();
            
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
        });
        
        // Estado inicial
        updateVisualState();
    });
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
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemISO = ontem.toISOString().split('T')[0];

    // Buscar agendamentos antigos
    const { data: agendamentosAntigos, error: errorSelect } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .lt('"data"', hoje.toISOString().split('T')[0]);

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
            .lt('"data"', hoje.toISOString().split('T')[0]);
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
    const hojeISO = hoje.toISOString().split('T')[0];

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
    console.log('Data atual:', formatDateTimeDisplay(hoje));
    const diaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.
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
        const diaISO = formatDateISO(dia);
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
                    agendamentoDiv.className = 'agendamento-item';
                    
                    // Adicionar tooltip com observações se existir
                    if (ag.mensagem && ag.mensagem.trim() !== '') {
                        agendamentoDiv.setAttribute('data-mensagem', ag.mensagem);
                        agendamentoDiv.title = 'Clique para ver observações';
                    }
                    
                    const nomeDiv = document.createElement('div');
                    nomeDiv.className = 'agendamento-nome';
                    nomeDiv.textContent = `${ag.nome} - ${ag.turma}`;
                    
                    const equipamentoDiv = document.createElement('div');
                    equipamentoDiv.className = 'agendamento-equipamento';
                    equipamentoDiv.textContent = ag.equipamentos.join(', ');
                    
                    agendamentoDiv.appendChild(nomeDiv);
                    agendamentoDiv.appendChild(equipamentoDiv);
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

async function verificarConflito(data, horaInicio, horaFim, equipamentos, turma, nome) {
    try {
        // Consulta otimizada: buscar apenas campos necessários
        const { data: agendamentos, error } = await supabaseClient
            .from('agendamentos')
            .select('nome, turma, equipamentos, horaInicio, horaFim')
            .eq('"data"', data);

        if (error) {
            console.error("Erro ao verificar conflitos:", error.message);
            return true;
        }

        // Se não há agendamentos na data, não há conflito
        if (!agendamentos || agendamentos.length === 0) {
            return false;
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
                // Verificar conflito de equipamentos
                const equipamentosConflito = ag.equipamentos.filter(eq => equipamentos.includes(eq));
                
                if (equipamentosConflito.length > 0) {
                    alert(`Conflito de equipamento: ${equipamentosConflito.join(', ')} já está(ão) agendado(s) das ${ag.horaInicio} às ${ag.horaFim} para "${ag.nome}".`);
                    return true;
                }

                // Verificar conflito de turma
                if (ag.turma === turma) {
                    alert(`Conflito de turma: A turma "${turma}" já tem agendamento das ${ag.horaInicio} às ${ag.horaFim} para "${ag.nome}".`);
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error("Erro inesperado ao verificar conflitos:", error);
        return true; // Em caso de erro, bloquear agendamento por segurança
    }
}

// Envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = form.nome.value.trim();
    const turma = form.turma.value.trim();
    const contato = form.contato.value.trim();
    const equipamentos = Array.from(document.querySelectorAll('input[name="equipamentos"]:checked')).map(cb => cb.value);
    const data = form.data.value;
    const horaInicio = form['hora-inicio'].value;
    const horaFim = form['hora-fim'].value;
    const mensagem = form.mensagem.value.trim();

    // Validação de equipamentos
    if (equipamentos.length === 0) {
        alert("Selecione ao menos um equipamento.");
        return;
    }

    // Validação de múltiplas lousas
    const lousasSelecionadas = equipamentos.filter(eq => eq.includes('Lousa'));
    if (lousasSelecionadas.length > 1) {
        alert('Não é permitido agendar mais de uma lousa simultaneamente. Por favor, selecione apenas uma lousa.');
        return;
    }

    // Validação de múltiplos espaços
    const espacosSelecionados = equipamentos.filter(eq => 
        eq === 'Sala de Informática' || eq === 'Anfiteatro' || eq === 'Biblioteca'
    );
    if (espacosSelecionados.length > 1) {
        alert('Não é permitido agendar mais de um espaço simultaneamente. Por favor, selecione apenas um espaço.');
        return;
    }

    // Validação de data passada
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas a data
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataSelecionada = new Date(ano, mes - 1, dia);
    
    if (dataSelecionada < hoje) {
        alert('Não é possível agendar para datas passadas. Por favor, selecione uma data atual ou futura.');
        return;
    }

    // Validação de horários
    if (!horaInicio || !horaFim) {
        alert('Por favor, selecione os horários de início e fim.');
        return;
    }

    // Converter horários para minutos para comparação
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);
    const inicioMinutos = hIni * 60 + mIni;
    const fimMinutos = hFim * 60 + mFim;



    // Validar se os horários estão dentro do período escolar
    const periodoEscolar = (inicioMinutos >= 430 && fimMinutos <= 1020); // 7:10 às 17:00
    
    if (!periodoEscolar) {
        alert('Os horários devem estar dentro do período escolar: 7h10 às 17h.');
        return;
    }





    // Verificar se a data não é sábado ou domingo
    const diaSemana = dataSelecionada.getDay();
    
    if (diaSemana === 0 || diaSemana === 6) {
        alert('Agendamentos não são permitidos aos sábados e domingos. Por favor, selecione um dia útil.');
        return;
    }

    const conflito = await verificarConflito(data, horaInicio, horaFim, equipamentos, turma, nome);
    if (conflito) return;

    const { error } = await supabaseClient
        .from('agendamentos')
        .insert([{
            nome,
            turma,
            contato,
            equipamentos,
            data,
            horaInicio,
            horaFim,
            mensagem
        }]);

    if (error) {
        alert("Erro ao salvar: " + error.message);
        return;
    }

    // Dados do agendamento para integração
    const dadosAgendamento = {
        nome,
        turma,
        contato,
        equipamentos,
        data,
        horaInicio,
        horaFim,
        mensagem
    };

    // Enviar notificação por e-mail de forma assíncrona (não-bloqueante)
    enviarNotificacaoEmail(dadosAgendamento).catch(error => {
        console.error('Erro no envio de e-mail (não afeta o agendamento):', error);
    });

    // Google Calendar integration removed

    alert("Agendamento realizado com sucesso!");
    form.reset();
    carregarAgendamentos();
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
            to_email: 'eric.benaglia@gmail.com',
            from_name: 'Sistema de Agendamento - AgendaTec',
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
    const dataArquivo = formatDateISO(hoje).replace(/-/g, '_');
    const nomeArquivo = `historico_agendamentos_${dataArquivo}.pdf`;
    doc.save(nomeArquivo);
}

// Event listeners para os botões do histórico
document.getElementById('btn-carregar-historico').addEventListener('click', carregarHistorico);
document.getElementById('btn-baixar-pdf').addEventListener('click', gerarPDF);

// Função para verificar se precisa atualizar o menu (chamada periodicamente)
function verificarAtualizacaoMenu() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    
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
    const hojeISO = hoje.toISOString().split('T')[0];
    
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
