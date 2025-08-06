// Referências aos elementos do DOM
const form = document.getElementById('agendamento-form');
const btnAgendar = document.getElementById('btn-agendar');
const tabelaBody = document.querySelector('#tabela-agendamentos tbody');

// Habilitar botão e carregar agendamentos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    btnAgendar.disabled = false;
    carregarAgendamentos();
});

// -------------------- FUNÇÕES -------------------- //

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
