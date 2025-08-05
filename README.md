# Sistema de Agendamento de Equipamentos Tecnológicos

## Descrição

Este é um sistema de agendamento de equipamentos tecnológicos para uso escolar. A aplicação permite que professores agendem equipamentos como Sala de Informática, Lousas Digitais, Caixas de Som e Microfones, respeitando as regras de horário da instituição e evitando conflitos de agendamento.

O sistema utiliza uma API serverless no Vercel para armazenar os agendamentos, permitindo acesso de qualquer dispositivo com conexão à internet.

## Funcionalidades

- Formulário de agendamento com validação de campos
- Seleção de equipamentos tecnológicos
- Calendário para escolha de data (não permite datas passadas)
- Seleção de horários respeitando os períodos escolares (7h-11h e 13h-17h)
- Limitação de agendamento de 2 horas por dia
- Prevenção de agendamentos simultâneos do mesmo equipamento
- Prevenção de agendamentos de duas lousas simultaneamente
- Limitação de um agendamento por professor por dia
- Visualização dos agendamentos em uma tabela
- Armazenamento dos agendamentos em API serverless
- Tema escuro para melhor visualização
- Remoção automática de agendamentos com mais de 15 dias
- Funcionamento offline com sincronização quando online

## Regras de Agendamento

- Horário escolar: 7h às 11h (manhã) e 13h às 17h (tarde)
- Não é possível agendar antes das 7h, entre 11h e 13h, ou após as 17h
- Máximo de 2 horas de agendamento por dia
- Não é permitido agendar duas lousas simultaneamente
- Cada professor pode fazer apenas um agendamento por dia

## Como Usar

1. Preencha seus dados pessoais (Nome, Turma e Contato)
2. Selecione o equipamento desejado
3. Escolha a data do agendamento
4. Selecione o horário de início e término (respeitando o limite de 2 horas)
5. Opcionalmente, deixe uma mensagem
6. Clique em "Registrar Agendamento"

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- API Serverless com Node.js
- Vercel para hospedagem
- GitHub para controle de versão
- LocalStorage como fallback para funcionamento offline

## Instalação e Implantação

### Execução Local

Para executar localmente, basta abrir o arquivo `index.html` em qualquer navegador moderno. Os dados serão armazenados no localStorage do navegador.

### Implantação no Vercel com GitHub

1. Crie um repositório no GitHub e faça upload dos arquivos do projeto
2. Crie uma conta no [Vercel](https://vercel.com) (pode usar sua conta GitHub)
3. No dashboard do Vercel, clique em "New Project"
4. Importe o repositório GitHub que contém o projeto
5. Mantenha as configurações padrão (o arquivo `vercel.json` já contém as configurações necessárias)
6. Clique em "Deploy"

Após a implantação, o Vercel fornecerá uma URL para acessar o aplicativo. Cada vez que você fizer um push para o repositório GitHub, o Vercel automaticamente implantará as atualizações.

## Desenvolvido para

Escola de Tecnologia - Sistema de Agendamento de Equipamentos