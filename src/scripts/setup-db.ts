import { Client } from 'pg';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import * as fs from 'node:fs';

dotenv.config();

const __dirname = process.cwd();

async function readlineAsync(): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let data = '';
    
    const onData = (chunk: string) => {
      data += chunk;
      if (data.includes('\n')) {
        stdin.removeListener('data', onData);
        stdin.pause();
        resolve(data.trim());
      }
    };
    
    stdin.on('data', onData);
  });
}

async function tryConnect(user: string, password: string, database: string): Promise<Client | null> {
  const clientConfig: any = {
    host: 'localhost',
    port: 5432,
    user,
    database,
    password
  };

  const client = new Client(clientConfig);

  try {
    await client.connect();
    return client;
  } catch (error) {
    try {
      await client.end();
    } catch { }
    return null;
  }
}

async function initializeDatabase() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   📚 Inicializador de Banco de Dados - Library CLI        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Tentar diferentes senhas da variável de ambiente primeiro
  const envPassword = process.env.DB_PASSWORD;
  let adminClient: Client | null = null;

  if (envPassword) {
    console.log('🔄 Tentando conectar ao PostgreSQL com credenciais do .env...');
    adminClient = await tryConnect('postgres', envPassword, 'postgres');
    if (adminClient) {
      console.log('✅ Conectado com credenciais do .env\n');
    }
  }

  if (!adminClient) {
    console.log('⚠️  Não foi possível conectar com as credenciais atuais.');
    console.log('📝 Próximas opções:');
    console.log('   1. Tentar sem senha (pressione ENTER)');
    console.log('   2. Fornecer uma senha específica\n');
    
    process.stdout.write('Digite a senha do PostgreSQL (ou deixe em branco para tentar sem senha): ');
    const userPassword = await readlineAsync();

    console.log('\n🔄 Tentando conectar ao PostgreSQL...');
    adminClient = await tryConnect('postgres', userPassword, 'postgres');

    if (adminClient) {
      console.log('✅ Conectado ao PostgreSQL\n');
      
      // Atualizar .env se for diferente
      if (userPassword !== envPassword) {
        console.log('💾 Atualizando arquivo .env...');
        const envPath = path.join(__dirname, '.env');
        const newEnvContent = `DB_HOST=localhost\nDB_PORT=5432\nDB_USER=postgres\nDB_PASSWORD=${userPassword}\nDB_NAME=biblioteca\n`;
        await writeFile(envPath, newEnvContent);
        console.log('✅ Arquivo .env atualizado\n');
      }
    } else {
      console.error('\n❌ Não foi possível conectar ao PostgreSQL');
      console.error('   Verifique se o PostgreSQL está rodando em localhost:5432');
      console.error('   Verifique a senha do usuário postgres\n');
      process.exit(1);
    }
  }

  try {
    // Verificar se o banco existe
    console.log('📋 Verificando se banco "biblioteca" existe...');
    const result = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'biblioteca'"
    );

    if (result.rows.length === 0) {
      console.log('📚 Criando banco de dados "biblioteca"...');
      await adminClient.query('CREATE DATABASE biblioteca ENCODING "UTF8"');
      console.log('✅ Banco de dados criado com sucesso\n');
    } else {
      console.log('✅ Banco de dados "biblioteca" já existe\n');
    }

    await adminClient.end();

    // Conectar ao banco biblioteca
    let dbClient: Client | null = null;
    const dbPassword = process.env.DB_PASSWORD || '';

    console.log('🔄 Conectando ao banco "biblioteca"...');
    dbClient = await tryConnect('postgres', dbPassword, 'biblioteca');

    if (!dbClient) {
      console.error('❌ Não foi possível conectar ao banco "biblioteca"\n');
      process.exit(1);
    }

    console.log('✅ Conectado ao banco de dados\n');

    // Ler e executar o schema
    console.log('📋 Criando estrutura de tabelas...');
    const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf-8');
    await dbClient.query(schema);
    console.log('✅ Tabelas criadas com sucesso\n');

    // Verificar se há dados e adicionar seed se necessário
    console.log('📊 Verificando dados iniciais...');
    const countAutores = await dbClient.query('SELECT COUNT(*) FROM autores');
    
    if (countAutores.rows[0].count === 0) {
      console.log('🌱 Adicionando dados de seed...');
      const seedPath = path.join(__dirname, 'src', 'database', 'seed.sql');
      const seed = await readFile(seedPath, 'utf-8');
      await dbClient.query(seed);
      console.log('✅ Dados de seed adicionados\n');
    } else {
      console.log('✅ Dados já existem no banco\n');
    }

    await dbClient.end();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║ ✨ Banco de dados inicializado com sucesso!              ║');
    console.log('║                                                            ║');
    console.log('║ 🚀 Próximos passos:                                       ║');
    console.log('║    npm run dev   - Iniciar em modo desenvolvimento        ║');
    console.log('║    npm run build - Compilar projeto                       ║');
    console.log('║    npm test      - Executar testes                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

initializeDatabase();
