// Referências aos elementos do DOM
const form = document.getElementById('agendamento-form');
const btnAgendar = document.getElementById('btn-agendar');
const tabelaBody = document.querySelector('#tabela-agendamentos tbody');

// Habilitar botão e carregar agendamentos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    btnAgendar.disabled = false;
    carregarAgendamentos();
    popularHorarios();
    
    // Limpar opções de hora de término inicialmente (manter apenas a opção padrão)
    const horaFimSelect = document.getElementById('hora-fim');
    horaFimSelect.innerHTML = '<option value="">Selecione primeiro a hora de início</option>';
    
    // Adicionar evento para atualizar hora de término quando hora de início for selecionada
    const horaInicioSelect = document.getElementById('hora-inicio');
    horaInicioSelect.addEventListener('change', function() {
        if (this.value) {
            atualizarHorariosFim(this.value);
        } else {
            horaFimSelect.innerHTML = '<option value="">Selecione primeiro a hora de início</option>';
            horaFimSelect.value = '';
        }
    });
    
    // Adicionar funcionalidade de seleção exclusiva para lousas
    const lousaCheckboxes = document.querySelectorAll('.lousa-checkbox');
    lousaCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // Desmarcar todas as outras lousas quando uma for selecionada
                lousaCheckboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                    }
                });
            }
        });
    });
});

// -------------------- FUNÇÕES -------------------- //

// Função para popular os horários nos campos select
function popularHorarios() {
    const horaInicioSelect = document.getElementById('hora-inicio');
    const horaFimSelect = document.getElementById('hora-fim');
    
    // Limpar opções existentes (exceto a primeira)
    horaInicioSelect.innerHTML = '<option value="">Selecione o horário</option>';
    horaFimSelect.innerHTML = '<option value="">Selecione o horário</option>';
    
    // Horários da manhã: 7:00 até 10:30 (intervalos de 30 minutos)
    for (let hora = 7; hora <= 10; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            if (hora === 10 && minuto > 30) break; // Para em 10:30
            const horarioFormatado = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            
            // Adicionar ao horário de início
            const optionInicio = document.createElement('option');
            optionInicio.value = horarioFormatado;
            optionInicio.textContent = horarioFormatado;
            horaInicioSelect.appendChild(optionInicio);
            
            // Adicionar ao horário de fim (exceto 7:00)
            if (horarioFormatado !== '07:00') {
                const optionFim = document.createElement('option');
                optionFim.value = horarioFormatado;
                optionFim.textContent = horarioFormatado;
                horaFimSelect.appendChild(optionFim);
            }
        }
    }
    
    // Separador visual para horário de início (entre 10:30 e 13:00)
    const separadorInicio = document.createElement('option');
    separadorInicio.value = '';
    separadorInicio.textContent = '------- Intervalo -------';
    separadorInicio.disabled = true;
    horaInicioSelect.appendChild(separadorInicio);
    
    // Adicionar 11:00 ao horário de fim (antes do separador)
    const option11 = document.createElement('option');
    option11.value = '11:00';
    option11.textContent = '11:00';
    horaFimSelect.appendChild(option11);
    
    // Separador visual para horário de fim (entre 11:00 e 13:30)
    const separadorFim = document.createElement('option');
    separadorFim.value = '';
    separadorFim.textContent = '------- Intervalo -------';
    separadorFim.disabled = true;
    horaFimSelect.appendChild(separadorFim);
    
    // Horários da tarde: 13:00 até 16:30 (intervalos de 30 minutos)
    for (let hora = 13; hora <= 16; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            if (hora === 16 && minuto > 30) break; // Para em 16:30
            const horarioFormatado = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            
            // Adicionar ao horário de início
            const optionInicio = document.createElement('option');
            optionInicio.value = horarioFormatado;
            optionInicio.textContent = horarioFormatado;
            horaInicioSelect.appendChild(optionInicio);
            
            // Adicionar ao horário de fim (exceto 13:00, começar em 13:30)
            if (horarioFormatado !== '13:00') {
                const optionFim = document.createElement('option');
                optionFim.value = horarioFormatado;
                optionFim.textContent = horarioFormatado;
                horaFimSelect.appendChild(optionFim);
            }
         }
     }
     
     // Adicionar 17:00 ao horário de fim (após os horários da tarde)
     const option17 = document.createElement('option');
     option17.value = '17:00';
     option17.textContent = '17:00';
     horaFimSelect.appendChild(option17);
 }

// Função para atualizar horários de fim baseado na hora de início (máximo 2 horas)
function atualizarHorariosFim(horaInicio) {
    const horaFimSelect = document.getElementById('hora-fim');
    horaFimSelect.innerHTML = '<option value="">Selecione o horário</option>';
    
    // Converter hora de início para minutos
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const minutosInicio = horaIni * 60 + minIni;
    
    // Calcular limite máximo (2 horas = 120 minutos)
    const minutosLimite = minutosInicio + 120;
    
    // Lista de todos os horários possíveis
    const todosHorarios = [];
    
    // Horários da manhã: 7:30 até 11:00
    for (let hora = 7; hora <= 11; hora++) {
        for (let minuto = (hora === 7 ? 30 : 0); minuto < 60; minuto += 30) {
            if (hora === 11 && minuto > 0) break;
            todosHorarios.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
        }
    }
    
    // Horários da tarde: 13:30 até 17:00
    for (let hora = 13; hora <= 17; hora++) {
        for (let minuto = (hora === 13 ? 30 : 0); minuto < 60; minuto += 30) {
            if (hora === 17 && minuto > 0) break;
            todosHorarios.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
        }
    }
    
    let adicionouSeparador = false;
    
    // Filtrar horários válidos (após hora de início e dentro do limite de 2 horas)
    todosHorarios.forEach(horario => {
        const [hora, min] = horario.split(':').map(Number);
        const minutosHorario = hora * 60 + min;
        
        // Verificar se está após a hora de início e dentro do limite
        if (minutosHorario > minutosInicio && minutosHorario <= minutosLimite) {
            // Adicionar separador se necessário (entre manhã e tarde)
            if (!adicionouSeparador && hora >= 13) {
                const separador = document.createElement('option');
                separador.value = '';
                separador.textContent = '------- Intervalo -------';
                separador.disabled = true;
                horaFimSelect.appendChild(separador);
                adicionouSeparador = true;
            }
            
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            horaFimSelect.appendChild(option);
        }
    });
}

// 1️⃣ Carrega agendamentos do Supabase e preenche a tabela
async function carregarAgendamentos() {
    const { data, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('horaInicio', { ascending: true });

    if (error) {
        console.error("Erro ao carregar agendamentos:", error.message);
        return;
    }

    tabelaBody.innerHTML = '';
    data.forEach(ag => {
        // Formatar horários para exibir apenas hora:minuto (sem segundos)
        const horaInicioFormatada = ag.horaInicio.substring(0, 5);
        const horaFimFormatada = ag.horaFim.substring(0, 5);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ag.nome}</td>
            <td>${ag.turma}</td>
            <td>${ag.equipamentos.join(', ')}</td>
            <td>${new Date(ag.data).toLocaleDateString('pt-BR')}</td>
            <td>${horaInicioFormatada} - ${horaFimFormatada}</td>
            <td>${ag.mensagem || ''}</td>
        `;
        tabelaBody.appendChild(tr);
    });
}

// 2️⃣ Verifica conflito de horários para o mesmo equipamento
async function verificarConflito(data, horaInicio, horaFim, equipamentos) {
    const { data: agendamentos, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .eq('data', data);

    if (error) {
        console.error("Erro ao verificar conflitos:", error.message);
        return true; // Em caso de erro, impede o agendamento
    }

    // Verifica se algum equipamento do novo agendamento já está ocupado no horário
    for (const ag of agendamentos) {
        const inicioExistente = ag.horaInicio;
        const fimExistente = ag.horaFim;

        const conflitouHorario =
            (horaInicio >= inicioExistente && horaInicio < fimExistente) ||
            (horaFim > inicioExistente && horaFim <= fimExistente) ||
            (horaInicio <= inicioExistente && horaFim >= fimExistente);

        const compartilhaEquipamento = ag.equipamentos.some(eq => equipamentos.includes(eq));

        if (conflitouHorario && compartilhaEquipamento) {
            alert(`Conflito detectado! O equipamento ${ag.equipamentos.join(', ')} já está agendado nesse horário.`);
            return true;
        }
    }

    return false;
}

// 3️⃣ Evento de envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Coleta dados do formulário
    const nome = form.nome.value.trim();
    const turma = form.turma.value.trim();
    const contato = form.contato.value.trim();
    const equipamentos = Array.from(document.querySelectorAll('input[name="equipamentos"]:checked')).map(cb => cb.value);
    const data = form.data.value;
    const horaInicio = form['hora-inicio'].value;
    const horaFim = form['hora-fim'].value;
    const mensagem = form.mensagem.value.trim();

    if (equipamentos.length === 0) {
        alert("Selecione ao menos um equipamento!");
        return;
    }

    // Verifica conflito antes de inserir
    const temConflito = await verificarConflito(data, horaInicio, horaFim, equipamentos);
    if (temConflito) return;

    // Insere no Supabase
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

    alert("Agendamento realizado com sucesso!");
    form.reset();
    carregarAgendamentos();
});
