// Teste final do fuso horário usando as funções do projeto
const fs = require('fs');

console.log('🧪 TESTE FINAL DE FUSO HORÁRIO - America/Cuiaba (UTC−4)');
console.log('='.repeat(70));

// Função para converter data para o fuso horário America/Cuiaba (UTC-4) - DO PROJETO
function toLocalDate(date) {
    if (!date) return new Date();
    const data = new Date(date);
    const offset = -4; // UTC-4 para America/Cuiaba
    const utc = data.getTime() + (data.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * offset));
}

// Função para formatar data no formato ISO (YYYY-MM-DD) - DO PROJETO
function formatDateISO(date) {
    const dataLocal = toLocalDate(date);
    const ano = dataLocal.getFullYear();
    const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(dataLocal.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para obter o início da semana (segunda-feira) - DO PROJETO
function getInicioSemana(data) {
    const d = toLocalDate(data);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const novaData = new Date(d.setDate(diff));
    return toLocalDate(novaData);
}

// Função para verificar se é sábado (dia de atualização) - DO PROJETO
function verificarAtualizacaoSemanal(data) {
    const dataLocal = toLocalDate(data);
    return dataLocal.getDay() === 6; // 6 = Sábado
}

// Teste 1: Terça-feira, 21h46 local (America/Cuiaba)
console.log('\n📅 TESTE 1: Terça-feira, 21h46 local');
console.log('-'.repeat(50));

// Criar data: Terça, 9 Jan 2024, 21:46:00 (UTC-4)
// Em UTC: Quarta, 10 Jan 2024, 01:46:00 (UTC+0)
const dataTerca = new Date(Date.UTC(2024, 0, 10, 1, 46)); // 10/jan 01:46 UTC = 9/jan 21:46 local
const tercaLocal = toLocalDate(dataTerca);

console.log(`Data UTC: ${dataTerca.toISOString()}`);
console.log(`Data Local (America/Cuiaba): ${tercaLocal.toISOString()}`);
console.log(`Dia da semana: ${tercaLocal.getDay()} (esperado: 2 - Terça-feira)`);
console.log(`Início da semana: ${formatDateISO(getInicioSemana(dataTerca))} (esperado: 2024-01-08)`);
console.log(`Deve atualizar semana: ${verificarAtualizacaoSemanal(dataTerca)} (esperado: false)`);

// Teste 2: Sexta-feira, 23h59 local (America/Cuiaba)
console.log('\n📅 TESTE 2: Sexta-feira, 23h59 local');
console.log('-'.repeat(50));

// Criar data: Sexta, 12 Jan 2024, 23:59:00 (UTC-4)
// Em UTC: Sábado, 13 Jan 2024, 03:59:00 (UTC+0)
const dataSexta = new Date(Date.UTC(2024, 0, 13, 3, 59)); // 13/jan 03:59 UTC = 12/jan 23:59 local
const sextaLocal = toLocalDate(dataSexta);

console.log(`Data UTC: ${dataSexta.toISOString()}`);
console.log(`Data Local (America/Cuiaba): ${sextaLocal.toISOString()}`);
console.log(`Dia da semana: ${sextaLocal.getDay()} (esperado: 5 - Sexta-feira)`);
console.log(`Início da semana: ${formatDateISO(getInicioSemana(dataSexta))} (esperado: 2024-01-08)`);
console.log(`Deve atualizar semana: ${verificarAtualizacaoSemanal(dataSexta)} (esperado: false)`);

// Teste 3: Sábado, 00h00 local (America/Cuiaba) - MOMENTO CRÍTICO!
console.log('\n📅 TESTE 3: Sábado, 00h00 local - MOMENTO CRÍTICO!');
console.log('-'.repeat(50));

// Criar data: Sábado, 13 Jan 2024, 00:00:00 (UTC-4)
// Em UTC: Sábado, 13 Jan 2024, 04:00:00 (UTC+0)
const dataSabado = new Date(Date.UTC(2024, 0, 13, 4, 0)); // 13/jan 04:00 UTC = 13/jan 00:00 local
const sabadoLocal = toLocalDate(dataSabado);

console.log(`Data UTC: ${dataSabado.toISOString()}`);
console.log(`Data Local (America/Cuiaba): ${sabadoLocal.toISOString()}`);
console.log(`Dia da semana: ${sabadoLocal.getDay()} (esperado: 6 - Sábado)`);
console.log(`Início da semana: ${formatDateISO(getInicioSemana(dataSabado))} (esperado: 2024-01-15)`);
console.log(`Deve atualizar semana: ${verificarAtualizacaoSemanal(dataSabado)} (esperado: true)`);

// Verificação final
const teste1Ok = tercaLocal.getDay() === 2 && !verificarAtualizacaoSemanal(dataTerca);
const teste2Ok = sextaLocal.getDay() === 5 && !verificarAtualizacaoSemanal(dataSexta);
const teste3Ok = sabadoLocal.getDay() === 6 && verificarAtualizacaoSemanal(dataSabado);

console.log('\n📊 RESUMO FINAL DOS TESTES');
console.log('='.repeat(70));
console.log(`✅ Terça 21h46: ${teste1Ok ? 'PASSOU' : 'FALHOU'}`);
console.log(`✅ Sexta 23h59: ${teste2Ok ? 'PASSOU' : 'FALHOU'}`);
console.log(`✅ Sábado 00h00: ${teste3Ok ? 'PASSOU' : 'FALHOU'}`);

const todosPassaram = teste1Ok && teste2Ok && teste3Ok;
console.log(`\n🎯 CONCLUSÃO: ${todosPassaram ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️  ALGUNS TESTES FALHARAM!'}`);

if (todosPassaram) {
    console.log('\n✨ O sistema de fuso horário está funcionando corretamente!');
    console.log('📅 A atualização semanal ocorrerá no sábado às 00h00 (America/Cuiaba)');
} else {
    console.log('\n🔧 É necessário revisar as funções de fuso horário.');
}

// Criar log detalhado
const logDetalhado = `
=== LOG DETALHADO DO TESTE DE FUSO HORÁRIO ===
Data do teste: ${new Date().toISOString()}
Fuso horário testado: America/Cuiaba (UTC−4)

RESULTADOS DETALHADOS:

1. Terça-feira 21h46 local (America/Cuiaba):
   - Data UTC: ${dataTerca.toISOString()}
   - Data local: ${tercaLocal.toISOString()}
   - Dia da semana: ${tercaLocal.getDay()} (esperado: 2)
   - Início da semana: ${formatDateISO(getInicioSemana(dataTerca))} (esperado: 2024-01-08)
   - Deve atualizar: ${verificarAtualizacaoSemanal(dataTerca)} (esperado: false)
   - Status: ${teste1Ok ? '✅ PASSOU' : '❌ FALHOU'}

2. Sexta-feira 23h59 local (America/Cuiaba):
   - Data UTC: ${dataSexta.toISOString()}
   - Data local: ${sextaLocal.toISOString()}
   - Dia da semana: ${sextaLocal.getDay()} (esperado: 5)
   - Início da semana: ${formatDateISO(getInicioSemana(dataSexta))} (esperado: 2024-01-08)
   - Deve atualizar: ${verificarAtualizacaoSemanal(dataSexta)} (esperado: false)
   - Status: ${teste2Ok ? '✅ PASSOU' : '❌ FALHOU'}

3. Sábado 00h00 local (America/Cuiaba):
   - Data UTC: ${dataSabado.toISOString()}
   - Data local: ${sabadoLocal.toISOString()}
   - Dia da semana: ${sabadoLocal.getDay()} (esperado: 6)
   - Início da semana: ${formatDateISO(getInicioSemana(dataSabado))} (esperado: 2024-01-15)
   - Deve atualizar: ${verificarAtualizacaoSemanal(dataSabado)} (esperado: true)
   - Status: ${teste3Ok ? '✅ PASSOU' : '❌ FALHOU'}

RESUMO:
Total de testes: 3
Testes passados: ${[teste1Ok, teste2Ok, teste3Ok].filter(Boolean).length}
Testes falhados: ${[teste1Ok, teste2Ok, teste3Ok].filter(x => !x).length}
Status final: ${todosPassaram ? '🎉 TODOS OS TESTES PASSARAM' : '⚠️  ALGUNS TESTES FALHARAM'}

===============================================
`;

fs.writeFileSync('teste-fuso-horario-completo.txt', logDetalhado, 'utf8');
console.log('\n📄 Log completo salvo em: teste-fuso-horario-completo.txt');

process.exit(todosPassaram ? 0 : 1);