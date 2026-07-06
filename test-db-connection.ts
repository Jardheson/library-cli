import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'postgres'
  });

  try {
    console.log('Tentando conectar com: host=localhost, port=5432, user=postgres, sem senha');
    await client.connect();
    console.log('✅ Conexão bem-sucedida!');
    const result = await client.query('SELECT version()');
    console.log('Versão do PostgreSQL:', result.rows[0].version);
    await client.end();
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error.message);
    console.error('Código:', error.code);
  }
}

testConnection();
