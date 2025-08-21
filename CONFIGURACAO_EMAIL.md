# Configuração de Notificações por E-mail

Este documento explica como configurar o sistema de notificações por e-mail para receber alertas sempre que um novo agendamento for realizado.

## Pré-requisitos

- Conta no EmailJS (gratuita)
- Conta de e-mail (Gmail, Outlook, etc.)

## Passo a Passo

### 1. Criar Conta no EmailJS

1. Acesse [https://www.emailjs.com/](https://www.emailjs.com/)
2. Clique em "Sign Up" e crie sua conta gratuita
3. Confirme seu e-mail

### 2. Configurar Serviço de E-mail

1. No painel do EmailJS, vá para "Email Services"
2. Clique em "Add New Service"
3. Escolha seu provedor (Gmail, Outlook, etc.)
4. Siga as instruções para conectar sua conta de e-mail
5. Anote o **Service ID** gerado

### 3. Criar Template de E-mail

1. Vá para "Email Templates"
2. Clique em "Create New Template"
3. Configure o template com as seguintes variáveis:

**Assunto:**
```
Novo Agendamento - {{professor_nome}}
```

**Corpo do E-mail:**
```
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
```

4. Salve o template e anote o **Template ID**

### 4. Obter Chave Pública

1. Vá para "Account" > "General"
2. Copie sua **Public Key**

### 5. Configurar o Sistema

1. Abra o arquivo `emailjs-config.js`
2. Substitua as configurações:

```javascript
const EMAILJS_CONFIG = {
    serviceID: 'seu_service_id_aqui',
    templateID: 'seu_template_id_aqui', 
    publicKey: 'sua_public_key_aqui'
};
```

### 6. Configurar E-mail de Destino

O e-mail está configurado para ser enviado para: **eric.benaglia@gmail.com**

Para alterar o destinatário, edite o arquivo `script.js` na linha que contém:
```javascript
to_email: 'eric.benaglia@gmail.com',
```

## Teste

1. Salve todas as alterações
2. Abra o sistema no navegador
3. Faça um agendamento de teste
4. Verifique se o e-mail foi recebido

## Solução de Problemas

### E-mail não está sendo enviado

1. Verifique o console do navegador (F12) para erros
2. Confirme se as configurações no `emailjs-config.js` estão corretas
3. Verifique se o template no EmailJS está ativo
4. Confirme se o serviço de e-mail está conectado corretamente

### Variáveis não aparecem no e-mail

1. Verifique se os nomes das variáveis no template correspondem exatamente aos usados no código
2. Certifique-se de usar `{{nome_da_variavel}}` no template

## Limitações da Conta Gratuita

- 200 e-mails por mês
- Marca d'água do EmailJS nos e-mails
- Para remover limitações, considere upgrade para plano pago

## Segurança

- A Public Key pode ser exposta no frontend (é seguro)
- Nunca exponha a Private Key
- Configure filtros anti-spam se necessário

## Suporte

Para dúvidas sobre o EmailJS: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)