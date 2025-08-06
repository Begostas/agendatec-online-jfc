# Configuração do Supabase para o Sistema de Agendamento

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha:
   - **Name**: `agendamento-equipamentos`
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America)
6. Clique em "Create new project"

## 2. Configurar o Banco de Dados

⚠️ **ATENÇÃO: Use APENAS o arquivo `supabase-schema.sql`**

1. No painel do Supabase, vá para **SQL Editor**
2. **COPIE APENAS** o conteúdo do arquivo `supabase-schema.sql` (NÃO o `supabase-config.js`)
3. Cole no SQL Editor e clique em **Run**
4. Isso criará:
   - Tabela `agendamentos` com todas as colunas necessárias
   - Índices para melhor performance
   - Políticas RLS para acesso público
   - Dados de exemplo (opcional)

**❌ ERRO COMUM:** 
Se você receber erro "syntax error at or near '//'", significa que copiou o arquivo JavaScript errado. Use apenas o arquivo `.sql`!

### Arquivo Correto para Copiar:
```sql
-- Schema para o banco de dados Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    ...
```

### ❌ NÃO Copie Este (JavaScript):
```javascript
// Configuração do Supabase  ← ERRO!
class SupabaseConfig {
    ...
```

**Importante:** O schema foi atualizado para usar nomes de colunas consistentes:
- `horaInicio` (em camelCase) em vez de `hora_inicio`
- `horaFim` (em camelCase) em vez de `hora_fim`
- Isso garante compatibilidade com o frontend JavaScript

## Passo 3: Obter as Credenciais

1. No painel do Supabase, vá para **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public** key (chave pública)

## Passo 4: Configurar Variáveis de Ambiente

### Para desenvolvimento local:
1. Edite o arquivo `.env` na raiz do projeto
2. Substitua os valores:
```env
SUPABASE_URL=https://seu-project-url.supabase.co
SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### Para produção no Vercel:
1. Acesse o painel do Vercel
2. Vá para seu projeto > **Settings** > **Environment Variables**
3. Adicione as variáveis:
   - `SUPABASE_URL`: sua URL do projeto
   - `SUPABASE_ANON_KEY`: sua chave anon
4. Marque as opções: **Production**, **Preview**, **Development**
5. Clique em **Save**

## Passo 5: Configurar o Frontend

1. Edite o arquivo `supabase-config.js`
2. Substitua os valores de exemplo:
```javascript
this.supabaseUrl = 'https://seu-project-url.supabase.co';
this.supabaseKey = 'sua-anon-key-aqui';
```

## Passo 6: Testar a Conexão

1. Abra o console do navegador (F12)
2. Recarregue a página
3. Verifique se aparecem as mensagens:
   - "Supabase inicializado com sucesso"
   - "Cliente Supabase inicializado no frontend"
   - "Conexão com Supabase OK"

## Passo 7: Deploy

1. Faça commit das alterações:
```bash
git add .
git commit -m "Configurar integração com Supabase"
git push origin main
```

2. O Vercel fará o deploy automaticamente
3. Teste o site em produção

## Verificação de Funcionamento

### Indicadores de sucesso:
- ✅ Agendamentos são salvos no Supabase
- ✅ Agendamentos são carregados do Supabase
- ✅ Múltiplos usuários veem os mesmos dados
- ✅ Dados persistem entre sessões

### Fallbacks em caso de erro:
- 🔄 Se API falhar → tenta Supabase direto
- 🔄 Se Supabase falhar → usa localStorage
- 🔄 Sempre mantém backup local

## Estrutura da Tabela

```sql
agendamentos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    contato VARCHAR(255) NOT NULL,
    equipamentos TEXT[] NOT NULL,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    mensagem TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
)
```

## Políticas de Segurança (RLS)

- ✅ Leitura pública permitida
- ✅ Inserção pública permitida
- ✅ Atualização pública permitida
- ✅ Exclusão pública permitida (para limpeza automática)

## Monitoramento

- Acesse **Database** > **Tables** para ver os dados
- Use **Logs** para monitorar requisições
- **API** > **Logs** mostra chamadas da API

## Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o deploy foi feito após adicionar as variáveis

### Erro: "Row Level Security"
- Verifique se as políticas RLS foram criadas
- Execute novamente o script `supabase-schema.sql`

### Dados não aparecem
- Verifique o console do navegador
- Confirme se a tabela foi criada corretamente
- Teste a conexão no SQL Editor do Supabase

## Backup e Migração

- Os dados ficam salvos no Supabase (PostgreSQL)
- Backup automático do Supabase
- localStorage como fallback local
- Exportação via SQL quando necessário