# Guia de Troubleshooting - Library CLI

## PostgreSQL não consegue conectar

### Sintomas
- Erro: "Failed to connect to database"
- Erro: "authentication type password failed"
- Erro: "ECONNREFUSED"

### Causas e Soluções

#### 1. PostgreSQL não está instalado

```bash
# Windows - Verificar instalação
Get-ChildItem "C:\Program Files\PostgreSQL"

# macOS
which psql
brew info postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
```

#### 2. PostgreSQL não está rodando

```bash
# Windows - Verificar serviço
Get-Service postgresql*

# Se não está rodando:
Start-Service postgresql-x64-18

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Se não está rodando:
sudo systemctl start postgresql
```

#### 3. Porta 5432 já está em uso

```bash
# Windows - Encontrar processo na porta
netstat -ano | findstr :5432

# macOS/Linux
lsof -i :5432
netstat -tuln | grep 5432

# Se outro processo está usando:
# - Mude a porta em .env (DB_PORT)
# - Ou mate o processo conflitante
```

#### 4. Senha ou usuário errados

```bash
# No Windows - abrir cmd PostgreSQL
cd "C:\Program Files\PostgreSQL\18\bin"

# Tentar conectar (sem senha)
psql -U postgres -d postgres

# Tentar conectar (com senha)
psql -U postgres -d postgres -W
```

#### 5. PostgreSQL com autenticação local diferente

O PostgreSQL pode ter diferentes métodos de autenticação em `pg_hba.conf`:

```bash
# Localizar pg_hba.conf
# Windows: C:\Program Files\PostgreSQL\18\data\pg_hba.conf
# Linux/macOS: /etc/postgresql/18/main/pg_hba.conf

# Verificar se a linha LOCAL usa 'trust' ou 'password'
# Para conexões locais (localhost):
# local   all             all                                     trust
# host    all             all             127.0.0.1/32            trust
# host    all             all             ::1/128                 trust
```

#### 6. Firewall bloqueando conexão

```bash
# Windows Defender Firewall
# Settings > Privacy & Security > Windows Defender Firewall
# Permitir PostgreSQL na porta 5432

# Linux UFW
sudo ufw allow 5432/tcp
```

---

## Solução: Usar PostgreSQL com Docker (Recomendado)

Se quiser evitar problemas de instalação local:

```bash
# 1. Instalar Docker

# 2. Criar container PostgreSQL
docker run --name biblioteca-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=biblioteca \
  -p 5432:5432 \
  -d postgres:18-alpine

# 3. Verificar se está rodando
docker ps

# 4. Testar conexão
docker exec -it biblioteca-db psql -U postgres -d biblioteca
```

---

## Resetar PostgreSQL para Configuração Padrão

### Windows

```bash
# 1. Parar o serviço
net stop postgresql-x64-18

# 2. Remover banco de dados
cd "C:\Program Files\PostgreSQL\18\data"
# Deletar pasta "base" se quiser limpar

# 3. Reiniciar
net start postgresql-x64-18

# 4. Resetar senha do postgres
cd "C:\Program Files\PostgreSQL\18\bin"
psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### macOS

```bash
# Com Homebrew
brew services restart postgresql
brew services stop postgresql
rm -rf /usr/local/var/postgres
brew services start postgresql

# Resetar senha
psql postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### Linux (Ubuntu/Debian)

```bash
# Remover e reinstalar
sudo apt-get purge postgresql postgresql-contrib
sudo apt-get install postgresql postgresql-contrib

# Resetar senha (usuário postgres tem senha vazia por padrão)
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '';"
```

---

## Testar Conexão com Script Node

Criar arquivo `test-connection.js`:

```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',  // alterar conforme necessário
  database: 'postgres'
});

client.connect(err => {
  if (err) {
    console.error('Erro de conexão:', err.message);
    console.error('Código:', err.code);
    console.error('Detalhes:', err);
  } else {
    console.log('Conectado com sucesso!');
    client.query('SELECT version()', (err, res) => {
      if (err) console.error(err);
      else console.log('Versão:', res.rows[0].version);
      client.end();
    });
  }
});
```

Executar:
```bash
node test-connection.js
```

---

## Checklist de Verificação

- [ ] PostgreSQL está instalado?
  ```bash
  psql --version
  ```

- [ ] PostgreSQL está rodando?
  ```bash
  # Windows
  Get-Service postgresql* | Select Name, Status
  ```

- [ ] Porta 5432 está acessível?
  ```bash
  netstat -ano | findstr :5432
  ```

- [ ] Arquivo `.env` está correto?
  ```bash
  cat .env
  ```

- [ ] Credenciais estão corretas?
  ```bash
  npm run setup
  ```

- [ ] Banco de dados `biblioteca` foi criado?
  ```bash
  psql -U postgres -l | grep biblioteca
  ```

---

## Precisa de mais ajuda?

1. **Verificar logs de erro**:
   ```bash
   cat logs/app.log
   ```

2. **Executar setup novamente**:
   ```bash
   npm run setup
   ```

3. **Modo debug**:
   ```bash
   npm run dev
   ```

4. **Testar banco manualmente**:
   ```bash
   psql -U postgres -d biblioteca
   \dt  # listar tabelas
   \q  # sair
   ```

---

**Última atualização**: 2026-07-06
