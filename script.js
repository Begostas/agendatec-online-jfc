// Referências aos elementos do DOM
const form = document.getElementById('agendamento-form');
const btnAgendar = document.getElementById('btn-agendar');
const tabelaBody = document.querySelector('#tabela-agendamentos tbody');

// Habilitar botão e carregar agendamentos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    btnAgendar.disabled = false;
    carregarAgendamentos();
    popularHorarios();

    const dataInput = document.getElementById('data');
    const hoje = new Date();
    const dataMinima = hoje.toISOString().split('T')[0];
    dataInput.min = dataMinima;

    const horaFimSelect = document.getElementById('hora-fim');
    horaFimSelect.innerHTML = '<option value="">Selecione primeiro a hora de início</option>';

    const horaInicioSelect = document.getElementById('hora-inicio');
    horaInicioSelect.addEventListener('change', function () {
        if (this.value) {
            atualizarHorariosFim(this.value);
        } else {
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

// Função para popular os horários
function popularHorarios() {
    const horaInicioSelect = document.getElementById('hora-inicio');
    const horaFimSelect = document.getElementById('hora-fim');

    horaInicioSelect.innerHTML = '<option value="">Selecione o horário</option>';
    horaFimSelect.innerHTML = '<option value="">Selecione o horário</option>';

    for (let hora = 7; hora <= 10; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            if (hora === 10 && minuto > 30) break;
            const h = hora.toString().padStart(2, '0');
            const m = minuto.toString().padStart(2, '0');
            const horario = `${h}:${m}`;
            horaInicioSelect.innerHTML += `<option value="${horario}">${horario}</option>`;
            if (horario !== '07:00') {
                horaFimSelect.innerHTML += `<option value="${horario}">${horario}</option>`;
            }
        }
    }

    horaFimSelect.innerHTML += `<option disabled>------- Intervalo -------</option>`;
    horaFimSelect.innerHTML += `<option value="11:00">11:00</option>`;

    horaInicioSelect.innerHTML += `<option disabled>------- Intervalo -------</option>`;

    for (let hora = 13; hora <= 16; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
            if (hora === 16 && minuto > 30) break;
            const h = hora.toString().padStart(2, '0');
            const m = minuto.toString().padStart(2, '0');
            const horario = `${h}:${m}`;
            horaInicioSelect.innerHTML += `<option value="${horario}">${horario}</option>`;
            if (horario !== '13:00') {
                horaFimSelect.innerHTML += `<option value="${horario}">${horario}</option>`;
            }
        }
    }

    horaFimSelect.innerHTML += `<option value="17:00">17:00</option>`;
}

// Atualizar hora fim com limite de 2 horas
function atualizarHorariosFim(horaInicio) {
    const horaFimSelect = document.getElementById('hora-fim');
    horaFimSelect.innerHTML = '<option value="">Selecione o horário</option>';

    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const inicioMin = hIni * 60 + mIni;
    const limite = inicioMin + 120;

    const horarios = [];

    for (let h = 7; h <= 11; h++) {
        for (let m = (h === 7 ? 30 : 0); m < 60; m += 30) {
            if (h === 11 && m > 0) break;
            horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }

    for (let h = 13; h <= 17; h++) {
        for (let m = (h === 13 ? 30 : 0); m < 60; m += 30) {
            if (h === 17 && m > 0) break;
            horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }

    horarios.forEach(horario => {
        const [h, m] = horario.split(':').map(Number);
        const min = h * 60 + m;
        if (min > inicioMin && min <= limite) {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            horaFimSelect.appendChild(option);
        }
    });
}

// Carrega agendamentos e remove os com +15 dias
async function carregarAgendamentos() {
    const hoje = new Date();
    const quinzeDiasAtras = new Date(hoje);
    quinzeDiasAtras.setDate(hoje.getDate() - 15);
    const limiteISO = quinzeDiasAtras.toISOString().split('T')[0];

    await supabaseClient
        .from('agendamentos')
        .delete()
        .lt('data', limiteISO);

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
        const horaInicio = ag.horaInicio.substring(0, 5);
        const horaFim = ag.horaFim.substring(0, 5);
        // Corrigir problema de fuso horário na exibição da data
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

// Verifica conflito
async function verificarConflito(data, horaInicio, horaFim, equipamentos) {
    const { data: agendamentos, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .eq('data', data);

    if (error) {
        console.error("Erro ao verificar conflitos:", error.message);
        return true;
    }

    for (const ag of agendamentos) {
        const i = ag.horaInicio;
        const f = ag.horaFim;
        const conflitoHorario =
            (horaInicio >= i && horaInicio < f) ||
            (horaFim > i && horaFim <= f) ||
            (horaInicio <= i && horaFim >= f);

        const conflitoEquip = ag.equipamentos.some(eq => equipamentos.includes(eq));

        if (conflitoHorario && conflitoEquip) {
            alert(`Conflito: O equipamento ${ag.equipamentos.join(', ')} já está agendado neste horário.`);
            return true;
        }
    }

    return false;
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

    if (equipamentos.length === 0) {
        alert("Selecione ao menos um equipamento.");
        return;
    }

    // Verificar se a data não é sábado ou domingo
    // Usar split para evitar problemas de fuso horário
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataSelecionada = new Date(ano, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
    const diaSemana = dataSelecionada.getDay(); // 0 = domingo, 6 = sábado
    
    if (diaSemana === 0 || diaSemana === 6) {
        alert('Agendamentos não são permitidos aos sábados e domingos. Por favor, selecione um dia útil.');
        return;
    }

    const conflito = await verificarConflito(data, horaInicio, horaFim, equipamentos);
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

    alert("Agendamento realizado com sucesso!");
    form.reset();
    carregarAgendamentos();
});
