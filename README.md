# Library CLI - Sistema de Gerenciamento de Biblioteca

Sistema completo de gerenciamento de biblioteca via Terminal (CLI) desenvolvido com Node.js, TypeScript e PostgreSQL.

## Características

- Gestão completa de Autores, Livros e Clientes
- Sistema de Empréstimos e Devoluções com controle
- Interface CLI interativa com menus navegáveis
- Validação de CPF e Email em tempo real
- Exportação de relatórios em CSV
- Dashboard com indicadores principais
- Paginação de resultados
- Logs detalhados das operações
- Migrations versionadas (`001_schema`, `002_seed`) com controle em `_migrations`
- Testes automatizados com cobertura minima de 80% nas camadas criticas
- TypeScript com tipagem forte em todo projeto

## Tecnologias

- **Node.js** 18+ - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **PostgreSQL** 12+ - Banco de dados
- **Inquirer** - Interface CLI interativa
- **Chalk** - Colorização de saída
- **Date-fns** - Manipulação de datas
- **Zod** - Validação de schemas
- **Jest** - Framework de testes
- **pg** - Driver PostgreSQL

## Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 12 ou superior
- npm ou yarn

## Instalação e Configuração

### 1️ Clonar/Preparar o Projeto

```bash
cd library-cli
```

### 2️ Instalar Dependências

```bash
npm install
```

### 3️ Configurar Banco de Dados

Execute o script de setup:

```bash
npm run setup
```

Este script:
- usa os valores atuais de `.env` quando eles ja funcionam
- so solicita dados no terminal se a conexao inicial falhar
- preserva outras chaves existentes no `.env`
- cria o banco configurado em `DB_NAME` se ele nao existir
- aplica migrations versionadas e seed reprodutivel

### 4️ (Alternativo) Configuração Manual

Se preferir configurar manualmente:

```bash
# PowerShell
Copy-Item .env.example .env

# bash
cp .env.example .env

# Editar .env com suas credenciais
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=sua_senha
# DB_NAME=biblioteca

# Executar setup
npm run setup
```

## Como Usar

### Iniciar em Desenvolvimento (com hot-reload)

```bash
npm run dev
```

### Compilar Projeto para Produção

```bash
npm run build
```

### Executar versão compilada

```bash
npm start
```

### Executar Testes

```bash
npm test              # Executar todos os testes
npm run test:coverage # Gerar relatório de cobertura
```

## Estrutura do Projeto

```
src/
├── main.ts                 # Ponto de entrada
├── controllers/            # Controladores
├── services/              # Lógica de negócio
├── repositories/          # Acesso a dados
├── models/                # Modelos de dados
├── interfaces/            # Interfaces TypeScript
├── menus/                 # Menus CLI
├── database/              # Schema, seed, conexão
├── utils/                 # Utilitários
├── enums/                 # Enumerações
└── scripts/               # Scripts auxiliares

tests/                      # Testes unitários
coverage/                   # Relatórios de cobertura
dist/                       # Código compilado
```

## Esquema do Banco de Dados

### Tabelas

- **autores**: Informações de autores
- **livros**: Catálogo com quantidade disponível
- **clientes**: Dados de clientes
- **emprestimos**: Histórico de transações

## Testes

```bash
npm test                # Executar testes
npm run test:coverage   # Com cobertura
```

A configuracao atual exige pelo menos `80%` de cobertura global em:
- statements
- branches
- functions
- lines

A cobertura eh aplicada sobre as camadas criticas de negocio:
- `src/services`
- `src/utils`

## Variáveis de Ambiente

Arquivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=biblioteca
```

## Scripts Disponíveis

```bash
npm run setup           # Configurar banco de dados
npm run dev             # Modo desenvolvimento
npm run build           # Compilar para produção
npm start               # Executar versão compilada
npm test                # Executar testes
npm run test:coverage   # Testes com cobertura
```

## Migrations

O projeto aplica migrations versionadas sobre a tabela `_migrations`:

- `001_schema` -> cria/atualiza a estrutura principal
- `002_seed` -> popula dados iniciais apenas quando o banco estiver vazio

## Troubleshooting

### Erro: "Failed to connect to database"

1. Verifique se PostgreSQL está rodando
2. Confirme as credenciais em `.env`
3. Execute `npm run setup` novamente

### Erro: "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

## Licença

MIT

---

**Versão**: 1.0.0  
**Última atualização**: 2026-07-06
