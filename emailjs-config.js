// Configuração do EmailJS para notificações por e-mail
// Para configurar:
// 1. Crie uma conta em https://www.emailjs.com/
// 2. Configure um serviço de e-mail (Gmail, Outlook, etc.)
// 3. Crie um template de e-mail
// 4. Substitua as configurações abaixo pelas suas

// Configurações do EmailJS
const EMAILJS_CONFIG = {
    serviceID: 'service_ypnksmp',
    templateID: 'template_56yfund', 
    publicKey: 'S3CuQhv426S2tMMO5'
};

// Inicializar EmailJS quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        console.log('EmailJS inicializado com sucesso!');
    } else {
        console.error('EmailJS não foi carregado!');
    }
});

// Template de e-mail sugerido para o EmailJS:
/*
Assunto: Novo Agendamento - {{professor_nome}}

Corpo do e-mail:
=== NOVO AGENDAMENTO REALIZADO ===

Professor: {{professor_nome}}
Turma: {{professor_turma}}
Contato: {{professor_contato}}

Equipamentos: {{equipamentos}}
Data: {{data_agendamento}}
Horário: {{horario_inicio}} às {{horario_fim}}

Mensagem: {{mensagem}}

---
Agendamento realizado em: {{timestamp}}
Sistema: {{from_name}}
*/