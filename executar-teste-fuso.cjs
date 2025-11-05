// Script para executar teste de fuso horário e salvar resultados
const fs = require('fs');
const path = require('path');

// Função para converter data para o fuso horário America/Cuiaba (UTC-4)
function toLocalDate(date) {
    if (!date) return new Date();
    const data = new Date(date);
    const offset = -4; // UTC-4 para America/Cuiaba
    const utc = data.getTime() + (data.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * offset));
}

// Função para formatar data no formato ISO (YYYY-MM-DD)
function formatDateISO(date) {
    const dataLocal = toLocalDate(date);
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(dataLocal.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para formatar data e hora para exibição
function formatDateTimeDisplay(date) {
    const dataLocal = toLocalDate(date);
    const dia = String(dataLocal.getDate()).padStart(2, '0');
    const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
    const ano = dataLocal.getFullYear();
    const horas = String(dataLocal.getHours()).padStart(2, '0');
    const minutos = String(dataLocal.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

// Função para obter o início da semana (segunda-feira)
function getInicioSemana(data) {
    const d = toLocalDate(data);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const novaData = new Date(d.setDate(diff));
    return toLocalDate(novaData);
}

// Função para verificar se é sábado (dia de atualização)
function verificarAtualizacaoSemanal(data) {
    const dataLocal = toLocalDate(data);
    return dataLocal.getDay() === 6; // 6 = Sábado
}

// Função para simular data/hora específica
function criarDataSimulada(ano, mes, dia, hora, minuto) {
    // Criar data diretamente em UTC para simular o horário local
    // America/Cuiaba é UTC-4, então:
    // - Sábado 00h00 local = Sexta 20h00 UTC
    // - Sexta 23h59 local = Sexta 19h59 UTC  
    // - Terça 21h46 local = Terça 17h46 UTC
    return new Date(Date.UTC(ano, mes - 1, dia, hora - 4, minuto));
}

// Função para executar todos os testes
function executarTestes() {
    console.log('🧪 INICIANDO TESTES DE FUSO HORÁRIO - America/Cuiaba (UTC−4)');
    console.log('=' .repeat(70));
    
    const resultados = [];
    
    // Teste 1: Terça-feira às 21h46
    console.log('\n📅 TESTE 1: Terça-feira às 21h46');
    console.log('-'.repeat(40));
    const dataTerca = criarDataSimulada(2024, 1, 9, 21, 46); // Terça, 9 de janeiro
    const localTerca = toLocalDate(dataTerca);
    const inicioSemanaTerca = getInicioSemana(dataTerca);
    const deveAtualizarTerca = verificarAtualizacaoSemanal(dataTerca);
    
    console.log(`Data simulada (UTC): ${dataTerca.toISOString()}`);
    console.log(`Data local (America/Cuiaba): ${formatDateTimeDisplay(dataTerca)}`);
    console.log(`Dia da semana: ${localTerca.getDay()} (2 = Terça)`);
    console.log(`Início da semana: ${formatDateISO(inicioSemanaTerca)}`);
    console.log(`Deve atualizar semana? ${deveAtualizarTerca}`);
    
    const tercaOk = localTerca.getDay() === 2 && !deveAtualizarTerca && formatDateISO(inicioSemanaTerca) === '2024-01-08';
    resultados.push({
        teste: 'Terça-feira 21h46',
        esperado: 'Dia=2, Atualizar=false, Início=2024-01-08',
        obtido: `Dia=${localTerca.getDay()}, Atualizar=${deveAtualizarTerca}, Início=${formatDateISO(inicioSemanaTerca)}`,
        sucesso: tercaOk
    });
    
    // Teste 2: Sexta-feira às 23h59
    console.log('\n📅 TESTE 2: Sexta-feira às 23h59');
    console.log('-'.repeat(40));
    const dataSexta = criarDataSimulada(2024, 1, 12, 23, 59); // Sexta, 12 de janeiro
    const localSexta = toLocalDate(dataSexta);
    const inicioSemanaSexta = getInicioSemana(dataSexta);
    const deveAtualizarSexta = verificarAtualizacaoSemanal(dataSexta);
    
    console.log(`Data simulada (UTC): ${dataSexta.toISOString()}`);
    console.log(`Data local (America/Cuiaba): ${formatDateTimeDisplay(dataSexta)}`);
    console.log(`Dia da semana: ${localSexta.getDay()} (5 = Sexta)`);
    console.log(`Início da semana: ${formatDateISO(inicioSemanaSexta)}`);
    console.log(`Deve atualizar semana? ${deveAtualizarSexta}`);
    
    const sextaOk = localSexta.getDay() === 5 && !deveAtualizarSexta && formatDateISO(inicioSemanaSexta) === '2024-01-08';
    resultados.push({
        teste: 'Sexta-feira 23h59',
        esperado: 'Dia=5, Atualizar=false, Início=2024-01-08',
        obtido: `Dia=${localSexta.getDay()}, Atualizar=${deveAtualizarSexta}, Início=${formatDateISO(inicioSemanaSexta)}`,
        sucesso: sextaOk
    });
    
    // Teste 3: Sábado às 00h00
    console.log('\n📅 TESTE 3: Sábado às 00h00');
    console.log('-'.repeat(40));
    const dataSabado = criarDataSimulada(2024, 1, 13, 4, 0); // Sábado 00h00 local = 04h00 UTC
    const localSabado = toLocalDate(dataSabado);
    const inicioSemanaSabado = getInicioSemana(dataSabado);
    const deveAtualizarSabado = verificarAtualizacaoSemanal(dataSabado);
    
    console.log(`Data simulada (UTC): ${dataSabado.toISOString()}`);
    console.log(`Data local (America/Cuiaba): ${formatDateTimeDisplay(dataSabado)}`);
    console.log(`Dia da semana: ${localSabado.getDay()} (6 = Sábado)`);
    console.log(`Início da semana: ${formatDateISO(inicioSemanaSabado)}`);
    console.log(`Deve atualizar semana? ${deveAtualizarSabado}`);
    
    const sabadoOk = localSabado.getDay() === 6 && deveAtualizarSabado && formatDateISO(inicioSemanaSabado) === '2024-01-15';
    resultados.push({
        teste: 'Sábado 00h00',
        esperado: 'Dia=6, Atualizar=true, Início=2024-01-15',
        obtido: `Dia=${localSabado.getDay()}, Atualizar=${deveAtualizarSabado}, Início=${formatDateISO(inicioSemanaSabado)}`,
        sucesso: sabadoOk
    });
    
    // Resumo
    console.log('\n📊 RESUMO DOS TESTES');
    console.log('='.repeat(70));
    
    const total = resultados.length;
    const sucessos = resultados.filter(r => r.sucesso).length;
    const falhas = total - sucessos;
    
    resultados.forEach(resultado => {
        const status = resultado.sucesso ? '✅' : '❌';
        console.log(`${status} ${resultado.teste}`);
        console.log(`   Esperado: ${resultado.esperado}`);
        console.log(`   Obtido:   ${resultado.obtido}`);
        console.log('');
    });
    
    console.log(`Total: ${total} | Sucessos: ${sucessos} | Falhas: ${falhas}`);
    
    if (falhas === 0) {
        console.log('🎉 TODOS OS TESTES PASSARAM!');
    } else {
        console.log('⚠️  ALGUNS TESTES FALHARAM!');
    }
    
    // Salvar resultados em arquivo
    const logContent = `
=== LOG DE TESTES DE FUSO HORÁRIO ===
Data do teste: ${new Date().toISOString()}
Fuso horário: America/Cuiaba (UTC−4)

Resultados:
${resultados.map(r => `
${r.sucesso ? '✅' : '❌'} ${r.teste}
Esperado: ${r.esperado}
Obtido: ${r.obtido}
`).join('')}

Resumo:
Total: ${total} testes
Sucessos: ${sucessos}
Falhas: ${falhas}
Status: ${falhas === 0 ? 'TODOS PASSARAM' : 'ALGUNS FALHARAM'}
=====================================
`;
    
    fs.writeFileSync('teste-fuso-horario-log.txt', logContent, 'utf8');
    console.log('\n📄 Log salvo em: teste-fuso-horario-log.txt');
    
    return {
        total,
        sucessos,
        falhas,
        todosPassaram: falhas === 0,
        resultados
    };
}

// Executar testes
if (require.main === module) {
    const resultado = executarTestes();
    process.exit(resultado.todosPassaram ? 0 : 1);
}

module.exports = { executarTestes };