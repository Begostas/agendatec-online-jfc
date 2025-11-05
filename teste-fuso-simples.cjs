// Teste simples e direto do fuso horário
const fs = require('fs');

console.log('🧪 TESTE DE FUSO HORÁRIO - America/Cuiaba (UTC−4)');
console.log('='.repeat(60));

// Função para converter data para o fuso horário America/Cuiaba (UTC-4)
function toLocalDate(date) {
    if (!date) return new Date();
    // Se a data já está em UTC, apenas aplicar o offset
    const data = new Date(date);
    const offset = -4; // UTC-4 para America/Cuiaba
    return new Date(data.getTime() + (3600000 * offset));
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

// Teste direto com datas específicas em UTC
console.log('\n📅 CENÁRIO 1: Terça-feira às 21h46 local');
console.log('-'.repeat(50));

// Terça 21h46 local = Terça 17h46 UTC (UTC-4)
const tercaUTC = new Date('2024-01-09T17:46:00Z');
const tercaLocal = toLocalDate(tercaUTC);
console.log(`UTC: ${tercaUTC.toISOString()}`);
console.log(`Local: ${formatDateTimeDisplay(tercaUTC)}`);
console.log(`Dia da semana: ${tercaLocal.getDay()} (esperado: 2 - Terça)`);
console.log(`Início semana: ${formatDateISO(getInicioSemana(tercaUTC))} (esperado: 2024-01-08)`);
console.log(`Deve atualizar: ${verificarAtualizacaoSemanal(tercaUTC)} (esperado: false)`);

console.log('\n📅 CENÁRIO 2: Sexta-feira às 23h59 local');
console.log('-'.repeat(50));

// Sexta 23h59 local = Sexta 19h59 UTC (UTC-4)
const sextaUTC = new Date('2024-01-12T19:59:00Z');
const sextaLocal = toLocalDate(sextaUTC);
console.log(`UTC: ${sextaUTC.toISOString()}`);
console.log(`Local: ${formatDateTimeDisplay(sextaUTC)}`);
console.log(`Dia da semana: ${sextaLocal.getDay()} (esperado: 5 - Sexta)`);
console.log(`Início semana: ${formatDateISO(getInicioSemana(sextaUTC))} (esperado: 2024-01-08)`);
console.log(`Deve atualizar: ${verificarAtualizacaoSemanal(sextaUTC)} (esperado: false)`);

console.log('\n📅 CENÁRIO 3: Sábado às 00h00 local');
console.log('-'.repeat(50));

// Sábado 00h00 local = Sexta 20h00 UTC (UTC-4)
const sabadoUTC = new Date('2024-01-12T20:00:00Z');
const sabadoLocal = toLocalDate(sabadoUTC);
console.log(`UTC: ${sabadoUTC.toISOString()}`);
console.log(`Local: ${formatDateTimeDisplay(sabadoUTC)}`);
console.log(`Dia da semana: ${sabadoLocal.getDay()} (esperado: 6 - Sábado)`);
console.log(`Início semana: ${formatDateISO(getInicioSemana(sabadoUTC))} (esperado: 2024-01-15)`);
console.log(`Deve atualizar: ${verificarAtualizacaoSemanal(sabadoUTC)} (esperado: true)`);

// Verificação final
const teste1 = tercaLocal.getDay() === 2 && !verificarAtualizacaoSemanal(tercaUTC);
const teste2 = sextaLocal.getDay() === 5 && !verificarAtualizacaoSemanal(sextaUTC);
const teste3 = sabadoLocal.getDay() === 6 && verificarAtualizacaoSemanal(sabadoUTC);

console.log('\n📊 RESUMO DOS TESTES');
console.log('='.repeat(60));
console.log(`✅ Terça 21h46: ${teste1 ? 'PASSOU' : 'FALHOU'}`);
console.log(`✅ Sexta 23h59: ${teste2 ? 'PASSOU' : 'FALHOU'}`);
console.log(`✅ Sábado 00h00: ${teste3 ? 'PASSOU' : 'FALHOU'}`);

const todosPassaram = teste1 && teste2 && teste3;
console.log(`\n🎯 RESULTADO FINAL: ${todosPassaram ? 'TODOS OS TESTES PASSARAM!' : 'ALGUNS TESTES FALHARAM!'}`);

// Salvar log
const log = `
=== TESTE DE FUSO HORÁRIO ===
Data: ${new Date().toISOString()}
Fuso: America/Cuiaba (UTC−4)

Terça 21h46 local: ${teste1 ? '✅' : '❌'}
Sexta 23h59 local: ${teste2 ? '✅' : '❌'}
Sábado 00h00 local: ${teste3 ? '✅' : '❌'}

Resultado: ${todosPassaram ? 'TODOS PASSARAM' : 'ALGUNS FALHARAM'}
============================
`;

fs.writeFileSync('teste-fuso-resultado.txt', log);
console.log('\n📄 Log salvo em: teste-fuso-resultado.txt');

process.exit(todosPassaram ? 0 : 1);