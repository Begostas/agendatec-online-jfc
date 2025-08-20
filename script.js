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
async function verificarConflito(data, horaInicio, horaFim, equipamentos, turma) {
    const { data: agendamentos, error } = await supabaseClient
        .from('agendamentos')
        .select('*')
        .eq('"data"', data);

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

        if (conflitoHorario) {
            // Verificar conflito de equipamentos
            const conflitoEquip = ag.equipamentos.some(eq => equipamentos.includes(eq));
            if (conflitoEquip) {
                alert(`Conflito: O equipamento ${ag.equipamentos.join(', ')} já está agendado neste horário.`);
                return true;
            }

            // Verificar conflito de turma
            if (ag.turma === turma) {
                alert('Já há um agendamento para esse horário. Por favor cheque a lista de agendamentos.');
                return true;
            }
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

    const conflito = await verificarConflito(data, horaInicio, horaFim, equipamentos, turma);
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
            tabelaBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">Nenhum agendamento no histórico</td></tr>';
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
    doc.text('Escola Municipal Júlio Fernandes Colino', 20, 30);
    
    const hoje = new Date();
    const dataRelatorio = hoje.toLocaleDateString('pt-BR');
    doc.text(`Relatório gerado em: ${dataRelatorio}`, 20, 40);

    // Preparar dados para a tabela
    const colunas = ['Nome', 'Turma', 'Equipamentos', 'Data', 'Horário', 'Mensagem'];
    const linhas = dadosHistorico.map(ag => {
        const horaInicio = ag.horaInicio.substring(0, 5);
        const horaFim = ag.horaFim.substring(0, 5);
        const [ano, mes, dia] = ag.data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
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
    const nomeArquivo = `historico_agendamentos_${hoje.getFullYear()}_${(hoje.getMonth() + 1).toString().padStart(2, '0')}_${hoje.getDate().toString().padStart(2, '0')}.pdf`;
    doc.save(nomeArquivo);
}

// Event listeners para os botões do histórico
document.getElementById('btn-carregar-historico').addEventListener('click', carregarHistorico);
document.getElementById('btn-baixar-pdf').addEventListener('click', gerarPDF);
