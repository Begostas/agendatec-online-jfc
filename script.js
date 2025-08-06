document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.getElementById('agendamento-form');
    const btnAgendar = document.getElementById('btn-agendar');
    const tabelaAgendamentos = document.getElementById('tabela-agendamentos').getElementsByTagName('tbody')[0];
    const inputData = document.getElementById('data');
    const selectHoraInicio = document.getElementById('hora-inicio');
    const selectHoraFim = document.getElementById('hora-fim');
    const equipamentosContainer = document.getElementById('equipamentos-container');
    const checkboxesEquipamentos = document.querySelectorAll('input[name="equipamentos"]');
    const lousaCheckboxes = document.querySelectorAll('.lousa-checkbox');
    
    // Dados de agendamentos
    let agendamentos = [];
    
    // URL da API (quando hospedado no Vercel)
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api/agendamentos' 
        : '/api/agendamentos';
    
    // Função para limpar agendamentos antigos (mais de 15 dias)
async function limparAgendamentosAntigos() {
    const hoje = new Date();
    const quinzeDiasAtras = new Date(hoje);
    quinzeDiasAtras.setDate(hoje.getDate() - 15);
    
    // Filtrar apenas agendamentos com menos de 15 dias
    const agendamentosAtualizados = agendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data + 'T00:00:00');
        return dataAgendamento >= quinzeDiasAtras;
    });
    
    // Se houve remoção de agendamentos
    if (agendamentosAtualizados.length < agendamentos.length) {
        const removidos = agendamentos.length - agendamentosAtualizados.length;
        agendamentos = agendamentosAtualizados;
        
        // Salvar agendamentos atualizados
        await salvarAgendamentos();
        console.log(`${removidos} agendamento(s) antigo(s) removido(s) automaticamente.`);
        
        // Mostrar mensagem de remoção se houver agendamentos removidos
        if (removidos > 0) {
            const mensagem = `${removidos} agendamento(s) com mais de 15 dias foram removidos automaticamente.`;
            mostrarMensagemRemocao(mensagem);
        }
    }
}

// Função para mostrar mensagem de remoção
function mostrarMensagemRemocao(mensagem) {
    const mensagemContainer = document.createElement('div');
    mensagemContainer.className = 'info-message';
    mensagemContainer.textContent = mensagem;
    
    // Inserir a mensagem no início do formulário
    const form = document.querySelector('form');
    form.parentNode.insertBefore(mensagemContainer, form);
    
    // Remover a mensagem após 5 segundos
    setTimeout(() => {
        mensagemContainer.classList.add('fadeOut');
        setTimeout(() => {
            mensagemContainer.remove();
        }, 500);
    }, 5000);
}
    
    // A limpeza de agendamentos antigos agora é feita na função inicializar()
    
    // Função para adicionar agendamentos de teste (apenas para demonstração)
    async function adicionarAgendamentosTeste() {
        // Verificar se já existem agendamentos
        if (agendamentos.length > 0) return;
        
        // Data atual
        const hoje = new Date();
        
        // Criar alguns agendamentos de teste, incluindo alguns antigos
        const agendamentosTeste = [
            {
                nome: "Professor Teste",
                turma: "9º Ano",
                contato: "professor@teste.com",
                equipamento: "Sala de Informática",
                data: new Date(hoje.getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 20 dias atrás
                horaInicio: "8:00",
                horaFim: "10:00",
                mensagem: "Aula de programação"
            },
            {
                nome: "Maria Silva",
                turma: "7º Ano",
                contato: "maria@escola.com",
                equipamento: "Lousa 1",
                data: new Date(hoje.getTime() - (16 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 16 dias atrás
                horaInicio: "13:00",
                horaFim: "15:00",
                mensagem: "Aula de matemática"
            },
            {
                nome: "João Santos",
                turma: "8º Ano",
                contato: "joao@escola.com",
                equipamento: "Caixa de som",
                data: new Date(hoje.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 5 dias atrás
                horaInicio: "9:00",
                horaFim: "11:00",
                mensagem: "Apresentação de trabalho"
            },
            {
                nome: "Ana Oliveira",
                turma: "6º Ano",
                contato: "ana@escola.com",
                equipamento: "Lousa 2",
                data: new Date(hoje.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // 3 dias no futuro
                horaInicio: "14:00",
                horaFim: "16:00",
                mensagem: "Aula de ciências"
            }
        ];
        
        // Adicionar agendamentos de teste
        agendamentos = agendamentosTeste;
        await salvarAgendamentos();
        console.log("Agendamentos de teste adicionados.");
    }
    
    // Não adicionar agendamentos de teste em produção
    // adicionarAgendamentosTeste();
    
    // Configurar data mínima (hoje)
    const hoje = new Date();
    const dataMinima = hoje.toISOString().split('T')[0];
    inputData.setAttribute('min', dataMinima);
    
    // Preencher opções de horários
    function preencherOpcoesHorario() {
        // Limpar opções existentes
        selectHoraInicio.innerHTML = '<option value="">Selecione o horário</option>';
        selectHoraFim.innerHTML = '<option value="">Selecione o horário</option>';
        
        // Horários disponíveis (7h às 11h e 13h às 17h)
        const horariosManha = [];
        const horariosTarde = [];
        
        // Gerar horários da manhã (7h às 11h)
        for (let hora = 7; hora < 11; hora++) {
            horariosManha.push(`${hora}:00`);
            horariosManha.push(`${hora}:30`);
        }
        horariosManha.push('11:00'); // Adicionar 11:00
        
        // Gerar horários da tarde (13h às 17h)
        for (let hora = 13; hora < 17; hora++) {
            horariosTarde.push(`${hora}:00`);
            horariosTarde.push(`${hora}:30`);
        }
        horariosTarde.push('17:00'); // Adicionar 17:00
        
        // Adicionar opções ao select de hora início
        horariosManha.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            selectHoraInicio.appendChild(option);
        });
        
        // Adicionar separador entre turnos
        const separadorManha = document.createElement('option');
        separadorManha.disabled = true;
        separadorManha.textContent = '--- Intervalo ---';
        selectHoraInicio.appendChild(separadorManha);
        
        // Adicionar opções da tarde
        horariosTarde.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            selectHoraInicio.appendChild(option);
        });
    }
    
    // Atualizar opções de hora de término com base na hora de início
    function atualizarHorasFim() {
        const horaInicio = selectHoraInicio.value;
        if (!horaInicio) return;
        
        // Limpar opções existentes
        selectHoraFim.innerHTML = '<option value="">Selecione o horário</option>';
        
        // Converter hora de início para minutos desde meia-noite
        const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
        const inicioEmMinutos = horaInicioH * 60 + horaInicioM;
        
        // Determinar período (manhã ou tarde)
        const ehManha = horaInicioH < 12;
        const limiteMaximo = ehManha ? 11 * 60 : 17 * 60;
        
        // Gerar opções de término (máximo 2 horas após início)
        let tempoMaximo = Math.min(inicioEmMinutos + 120, limiteMaximo);
        
        // Adicionar opções em intervalos de 30 minutos
        for (let minutos = inicioEmMinutos + 30; minutos <= tempoMaximo; minutos += 30) {
            const hora = Math.floor(minutos / 60);
            const min = minutos % 60;
            const horarioFormatado = `${hora}:${min === 0 ? '00' : min}`;
            
            const option = document.createElement('option');
            option.value = horarioFormatado;
            option.textContent = horarioFormatado;
            selectHoraFim.appendChild(option);
        }
    }
    
    // Obter equipamentos selecionados
    function getEquipamentosSelecionados() {
        const equipamentos = [];
        checkboxesEquipamentos.forEach(checkbox => {
            if (checkbox.checked) {
                equipamentos.push(checkbox.value);
            }
        });
        return equipamentos;
    }
    
    // Verificar se há duas lousas selecionadas
    function verificarDuasLousasSelecionadas() {
        let lousasSelecionadas = 0;
        lousaCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                lousasSelecionadas++;
            }
        });
        return lousasSelecionadas > 1;
    }
    
    // Verificar disponibilidade dos equipamentos na data e horário selecionados
    function verificarDisponibilidade() {
        const equipamentosSelecionados = getEquipamentosSelecionados();
        const data = inputData.value;
        const horaInicio = selectHoraInicio.value;
        const horaFim = selectHoraFim.value;
        
        if (equipamentosSelecionados.length === 0 || !data || !horaInicio || !horaFim) return true;
        
        // Verificar se há duas lousas selecionadas
        if (verificarDuasLousasSelecionadas()) {
            mostrarErro('Não é permitido agendar duas lousas simultaneamente.');
            return false;
        }
        
        // Converter horários para comparação
        const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
        const [horaFimH, horaFimM] = horaFim.split(':').map(Number);
        const inicioEmMinutos = horaInicioH * 60 + horaInicioM;
        const fimEmMinutos = horaFimH * 60 + horaFimM;
        
        // Verificar conflitos de agendamento para cada equipamento selecionado
        for (const equipamento of equipamentosSelecionados) {
            for (const agendamento of agendamentos) {
                if (agendamento.data === data) {
                    // Verificar se o agendamento existente contém o equipamento atual
                    const equipamentosAgendamento = Array.isArray(agendamento.equipamentos) ? 
                        agendamento.equipamentos : [agendamento.equipamento];
                    
                    if (equipamentosAgendamento.includes(equipamento)) {
                        // Converter horários do agendamento existente
                        const [agendaInicioH, agendaInicioM] = agendamento.horaInicio.split(':').map(Number);
                        const [agendaFimH, agendaFimM] = agendamento.horaFim.split(':').map(Number);
                        const agendaInicioEmMinutos = agendaInicioH * 60 + agendaInicioM;
                        const agendaFimEmMinutos = agendaFimH * 60 + agendaFimM;
                        
                        // Verificar sobreposição de horários
                        if (!(fimEmMinutos <= agendaInicioEmMinutos || inicioEmMinutos >= agendaFimEmMinutos)) {
                            mostrarErro(`O equipamento "${equipamento}" já está agendado para este horário.`);
                            return false; // Há conflito
                        }
                    }
                    
                    // Verificar regra de não agendar lousa quando outra já está agendada
                    const temLousaSelecionada = equipamento === 'Lousa 1' || equipamento === 'Lousa 2';
                    const temLousaAgendada = equipamentosAgendamento.some(eq => eq === 'Lousa 1' || eq === 'Lousa 2');
                    
                    if (temLousaSelecionada && temLousaAgendada && equipamento !== agendamento.equipamento) {
                        // Converter horários do agendamento existente
                        const [agendaInicioH, agendaInicioM] = agendamento.horaInicio.split(':').map(Number);
                        const [agendaFimH, agendaFimM] = agendamento.horaFim.split(':').map(Number);
                        const agendaInicioEmMinutos = agendaInicioH * 60 + agendaInicioM;
                        const agendaFimEmMinutos = agendaFimH * 60 + agendaFimM;
                        
                        // Verificar sobreposição de horários
                        if (!(fimEmMinutos <= agendaInicioEmMinutos || inicioEmMinutos >= agendaFimEmMinutos)) {
                            mostrarErro('Não é permitido agendar duas lousas simultaneamente.');
                            return false; // Há conflito
                        }
                    }
                }
            }
        }
        
        return true; // Não há conflito
    }
    
    // Verificar se o professor já tem agendamento no dia
    function verificarAgendamentoDiario(nome, contato) {
        const data = inputData.value;
        
        for (const agendamento of agendamentos) {
            if (agendamento.data === data && 
                (agendamento.nome === nome || agendamento.contato === contato)) {
                return false; // Já existe agendamento para este professor neste dia
            }
        }
        
        return true; // Não há agendamento para este professor neste dia
    }
    
    // Validar formulário
    function validarFormulario() {
        const nome = document.getElementById('nome').value;
        const turma = document.getElementById('turma').value;
        const contato = document.getElementById('contato').value;
        const equipamentosSelecionados = getEquipamentosSelecionados();
        const data = inputData.value;
        const horaInicio = selectHoraInicio.value;
        const horaFim = selectHoraFim.value;
        
        // Verificar se pelo menos um equipamento está selecionado
        const equipamentosErro = document.getElementById('equipamentos-erro');
        if (equipamentosSelecionados.length === 0) {
            equipamentosErro.style.display = 'block';
        } else {
            equipamentosErro.style.display = 'none';
        }
        
        // Verificar se todos os campos obrigatórios estão preenchidos
        if (!nome || !turma || !contato || equipamentosSelecionados.length === 0 || !data || !horaInicio || !horaFim) {
            btnAgendar.disabled = true;
            return false;
        }
        
        // Verificar disponibilidade
        if (!verificarDisponibilidade()) {
            mostrarErro('Este equipamento já está agendado para este horário.');
            btnAgendar.disabled = true;
            return false;
        }
        
        // Verificar agendamento diário
        if (!verificarAgendamentoDiario(nome, contato)) {
            mostrarErro('Você já possui um agendamento para esta data.');
            btnAgendar.disabled = true;
            return false;
        }
        
        // Tudo ok, habilitar botão
        btnAgendar.disabled = false;
        limparErros();
        return true;
    }
    
    // Mostrar mensagem de erro
    function mostrarErro(mensagem) {
        limparErros();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = mensagem;
        
        form.insertBefore(errorDiv, document.querySelector('.form-actions'));
    }
    
    // Limpar mensagens de erro
    function limparErros() {
        const erros = document.querySelectorAll('.error-message');
        erros.forEach(erro => erro.remove());
    }
    
    // Adicionar agendamento à tabela
    function adicionarAgendamentoTabela(agendamento) {
        const novaLinha = tabelaAgendamentos.insertRow();
        novaLinha.className = 'fade-in';
        
        // Formatar data para exibição
        const dataObj = new Date(agendamento.data + 'T00:00:00');
        const dataFormatada = dataObj.toLocaleDateString('pt-BR');
        
        // Adicionar células
        const celulaNome = novaLinha.insertCell(0);
        const celulaTurma = novaLinha.insertCell(1);
        const celulaEquipamento = novaLinha.insertCell(2);
        const celulaData = novaLinha.insertCell(3);
        const celulaHorario = novaLinha.insertCell(4);
        const celulaMensagem = novaLinha.insertCell(5);
        
        // Preencher células
        celulaNome.textContent = agendamento.nome;
        celulaTurma.textContent = agendamento.turma;
        
        // Tratar equipamentos (pode ser string ou array)
        let equipamentosTexto = '';
        if (Array.isArray(agendamento.equipamentos)) {
            equipamentosTexto = agendamento.equipamentos.join(', ');
        } else {
            equipamentosTexto = agendamento.equipamento || '';
        }
        celulaEquipamento.textContent = equipamentosTexto;
        
        celulaData.textContent = dataFormatada;
        celulaHorario.textContent = `${agendamento.horaInicio} - ${agendamento.horaFim}`;
        celulaMensagem.textContent = agendamento.mensagem || '-';
    }
    
    // Carregar agendamentos da API
    async function carregarAgendamentos() {
        tabelaAgendamentos.innerHTML = '';
        
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Erro ao carregar agendamentos');
            }
            
            agendamentos = await response.json();
            
            // Ordenar agendamentos por data e hora
            agendamentos.sort((a, b) => {
                if (a.data !== b.data) return a.data.localeCompare(b.data);
                return a.horaInicio.localeCompare(b.horaInicio);
            });
            
            // Adicionar à tabela
            agendamentos.forEach(agendamento => {
                adicionarAgendamentoTabela(agendamento);
            });
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            // Fallback para localStorage se a API falhar
            const agendamentosLocal = JSON.parse(localStorage.getItem('agendamentos')) || [];
            agendamentos = agendamentosLocal;
            
            // Ordenar e exibir agendamentos do localStorage
            agendamentos.sort((a, b) => {
                if (a.data !== b.data) return a.data.localeCompare(b.data);
                return a.horaInicio.localeCompare(b.horaInicio);
            });
            
            agendamentos.forEach(agendamento => {
                adicionarAgendamentoTabela(agendamento);
            });
        }
    }
    
    // Função para limpar agendamentos antigos (mais de 15 dias)
    function limparAgendamentosAntigos() {
        const hoje = new Date();
        const quinzeDiasAtras = new Date(hoje);
        quinzeDiasAtras.setDate(hoje.getDate() - 15);
        
        // Filtrar apenas agendamentos com menos de 15 dias
        const agendamentosAtualizados = agendamentos.filter(agendamento => {
            const dataAgendamento = new Date(agendamento.data + 'T00:00:00');
            return dataAgendamento >= quinzeDiasAtras;
        });
        
        // Se houve remoção de agendamentos
        if (agendamentosAtualizados.length < agendamentos.length) {
            const removidos = agendamentos.length - agendamentosAtualizados.length;
            agendamentos = agendamentosAtualizados;
            salvarAgendamentos();
            console.log(`${removidos} agendamento(s) antigo(s) removido(s) automaticamente.`);
            
            // Mostrar mensagem de remoção se houver agendamentos removidos
            if (removidos > 0) {
                const mensagem = `${removidos} agendamento(s) com mais de 15 dias foram removidos automaticamente.`;
                mostrarMensagemRemocao(mensagem);
            }
        }
    }
    
    // Mostrar mensagem de remoção de agendamentos antigos
    function mostrarMensagemRemocao(mensagem) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-message fade-in';
        infoDiv.textContent = mensagem;
        
        const agendamentosContainer = document.querySelector('.agendamentos-container');
        agendamentosContainer.insertBefore(infoDiv, agendamentosContainer.firstChild);
        
        // Remover após 5 segundos
        setTimeout(() => {
            infoDiv.remove();
        }, 5000);
    }
    
    // Salvar agendamentos na API
    async function salvarAgendamentos() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(agendamentos)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar agendamentos');
            }
            
            // Backup no localStorage caso a API falhe no futuro
            localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar agendamentos na API:', error);
            // Fallback para localStorage
            localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
            return false;
        }
    }
    
    // Mostrar mensagem de sucesso
    function mostrarSucesso(mensagem) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message fade-in';
        successDiv.textContent = mensagem;
        
        const formContainer = document.querySelector('.form-container');
        formContainer.insertBefore(successDiv, form);
        
        // Remover após 3 segundos
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
    
    // Event Listeners
    preencherOpcoesHorario();
    
    // Inicialização assíncrona
    (async function inicializar() {
        await carregarAgendamentos();
        await limparAgendamentosAntigos();
        
        // Adicionar agendamentos de teste para demonstração (opcional)
        // await adicionarAgendamentosTeste();
    })();
    
    // Atualizar hora de término quando hora de início mudar
    selectHoraInicio.addEventListener('change', function() {
        atualizarHorasFim();
        validarFormulario();
    });
    
    // Event listeners para os checkboxes de equipamentos
    checkboxesEquipamentos.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Verificar se é uma lousa e implementar exclusividade
            if (checkbox.value === 'Lousa 1' || checkbox.value === 'Lousa 2') {
                const outraLousa = checkbox.value === 'Lousa 1' ? 
                    document.querySelector('input[value="Lousa 2"]') : 
                    document.querySelector('input[value="Lousa 1"]');
                
                if (checkbox.checked && outraLousa) {
                    outraLousa.disabled = true;
                    outraLousa.checked = false;
                } else if (!checkbox.checked && outraLousa) {
                    outraLousa.disabled = false;
                }
            }
            validarFormulario();
        });
    });

    // Validar formulário quando campos mudarem
    form.addEventListener('input', validarFormulario);
    selectHoraFim.addEventListener('change', validarFormulario);
    
    // Submeter formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validarFormulario()) {
            // Desabilitar botão durante o envio
            btnAgendar.disabled = true;
            btnAgendar.textContent = 'Enviando...';
            
            // Coletar dados do formulário
            const novoAgendamento = {
                nome: document.getElementById('nome').value,
                turma: document.getElementById('turma').value,
                contato: document.getElementById('contato').value,
                equipamentos: getEquipamentosSelecionados(),
                data: inputData.value,
                horaInicio: selectHoraInicio.value,
                horaFim: selectHoraFim.value,
                mensagem: document.getElementById('mensagem').value
            };
            
            try {
                // Adicionar ao array
                agendamentos.push(novoAgendamento);
                
                // Salvar na API
                const salvou = await salvarAgendamentos();
                
                // Atualizar tabela
                adicionarAgendamentoTabela(novoAgendamento);
                
                // Mostrar mensagem de sucesso
                if (salvou) {
                    mostrarSucesso('Agendamento realizado com sucesso!');
                } else {
                    mostrarSucesso('Agendamento salvo localmente. Será sincronizado quando a conexão for restabelecida.');
                }
                
                // Limpar formulário
                form.reset();
                btnAgendar.disabled = true;
                btnAgendar.textContent = 'Agendar';
                selectHoraFim.innerHTML = '<option value="">Selecione o horário</option>';
            } catch (error) {
                console.error('Erro ao salvar agendamento:', error);
                mostrarErro('Ocorreu um erro ao salvar o agendamento. Tente novamente.');
                btnAgendar.disabled = false;
                btnAgendar.textContent = 'Agendar';
            }
        }
    });
});