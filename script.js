const form = document.getElementById('agendamento-form');
const btnAgendar = document.getElementById('btn-agendar');
const tabelaBody = document.querySelector('#tabela-agendamentos tbody');

document.addEventListener('DOMContentLoaded', () => {
    btnAgendar.disabled = false;
    carregarAgendamentos();
    gerarHorarios(); // Gera os horários automaticamente
    
    // Configurar data mínima (hoje)
    const hoje = new Date();
    const dataMinima = hoje.toISOString().split('T')[0];
    document.getElementById('data').setAttribute('min', dataMinima);
    
    // Event listeners para lousas (exclusividade)
    const lousaCheckboxes = document.querySelectorAll('.lousa-checkbox');
    lousaCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // Desmarcar outras lousas
                lousaCheckboxes.forEach(other => {
                    if (other !== this) {
                        other.checked = false;
                    }
                });
            }
        });
    });
});

// -------------------- GERAR HORÁRIOS -------------------- //
function gerarHorarios() {
    const horaInicioSelect = document.getElementById('hora-inicio');
    const horaFimSelect = document.getElementById('hora-fim');

    horaInicioSelect.innerHTML = '<option value="">Selecione o horário</option>';
    horaFimSelect.innerHTML = '<option value="">Selecione o horário</option>';

    const inicioDia = 7;
    const fimDia = 17.5;
    const intervalo = 0.5; // 30 minutos

    let horarios = [];

    for (let h = inicioDia; h <= fimDia; h += intervalo) {
        let hora = Math.floor(h);
        let minuto = (h % 1) === 0 ? "00" : "30";
        horarios.push(`${hora.toString().padStart(2, '0')}:${minuto}`);
    }

    const horariosInicio = horarios.filter(h => h !== "11:00" && h !== "17:00");

    horariosInicio.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        horaInicioSelect.appendChild(opt);
    });

    horarios.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        horaFimSelect.appendChild(opt);
    });
}

// -------------------- CARREGAR AGENDAMENTOS -------------------- //
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
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ag.nome}</td>
            <td>${ag.turma}</td>
            <td>${ag.equipamentos.join(', ')}</td>
            <td>${new Date(ag.data).toLocaleDateString('pt-BR')}</td>
            <td>${ag.horaInicio} - ${ag.horaFim}</td>
            <td>${ag.mensagem || ''}</td>
        `;
        tabelaBody.appendChild(tr);
    });
}

// -------------------- VERIFICAR CONFLITOS -------------------- //
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

// -------------------- EVENTO DE SUBMISSÃO -------------------- //
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = form.nome.value.trim();
    const contato = form.contato.value.trim();

    // Pega a turma marcada (escolha única)
    const turmaCheckbox = document.querySelector('#turma-container input[type="checkbox"]:checked');
    const turma = turmaCheckbox ? turmaCheckbox.value : '';

    // Pega equipamentos selecionados
    const equipamentos = Array.from(document.querySelectorAll('input[name="equipamentos"]:checked')).map(cb => cb.value);

    const data = form.data.value;
    const horaInicio = form['hora-inicio'].value;
    const horaFim = form['hora-fim'].value;
    const mensagem = form.mensagem.value.trim();

    // -------------------- VALIDAÇÕES -------------------- //
    if (!turma) {
        alert("Selecione uma turma!");
        return;
    }

    if (equipamentos.length === 0) {
        alert("Selecione ao menos um equipamento!");
        return;
    }

    // Verificar se duas lousas foram selecionadas simultaneamente
    const lousasSelecionadas = equipamentos.filter(eq => eq.includes('Lousa'));
    if (lousasSelecionadas.length > 1) {
        alert("Não é permitido agendar duas lousas simultaneamente!");
        return;
    }

    const temConflito = await verificarConflito(data, horaInicio, horaFim, equipamentos);
    if (temConflito) return;

    // -------------------- INSERIR NO SUPABASE -------------------- //
    const { error } = await supabaseClient
        .from('agendamentos')
        .insert([{ nome, turma, contato, equipamentos, data, horaInicio, horaFim, mensagem }]);

    if (error) {
        alert("Erro ao salvar: " + error.message);
        return;
    }

    alert("Agendamento realizado com sucesso!");
    form.reset();
    carregarAgendamentos();
});
