import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseError } from "../utils/Errors";

dotenv.config();

type QueryParams = Array<string | number | boolean | Date | null>;

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function buildConnectionError(err: unknown): DatabaseError {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code?: string }).code ?? "");
    if (code === "28P01") {
      return new DatabaseError(
        "Falha na autenticação do PostgreSQL. Verifique DB_USER e DB_PASSWORD no arquivo .env.",
        {
          code,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          database: process.env.DB_NAME
        }
      );
    }
  }

  return new DatabaseError("Falha ao conectar ao PostgreSQL", {
    error: err,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  });
}

function loadDatabaseConfig(): DatabaseConfig {
  const requiredKeys = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"] as const;
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Configuração do banco incompleta. Defina as variáveis ausentes em .env: ${missingKeys.join(
        ", "
      )}.`
    );
  }

  return {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME as string
  };
}

const databaseConfig = loadDatabaseConfig();

const pool = new Pool(databaseConfig);

export const db = {
  pool,
  async query<T extends QueryResultRow = any>(
    text: string,
    params: QueryParams = []
  ): Promise<QueryResult<T>> {
    try {
      return await pool.query<T>(text, params);
    } catch (err) {
      throw new DatabaseError("Falha ao executar query", {
        text,
        params,
        error: err
      });
    }
  },
  async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    let client: PoolClient;

    try {
      client = await pool.connect();
    } catch (err) {
      throw buildConnectionError(err);
    }

    try {
      return await fn(client);
    } finally {
      client.release();
    }
  },
  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return db.withClient(async (client) => {
      try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch {}
        throw err;
      }
    });
  }
};

export async function initializeDatabase(): Promise<void> {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const seedPath = path.resolve(__dirname, "seed.sql");

  const schemaSql = await readFile(schemaPath, { encoding: "utf8" });
  const seedSql = await readFile(seedPath, { encoding: "utf8" });

  await db.withTransaction(async (client) => {
    await client.query(schemaSql);

    const counts = await client.query<{
      autores: string;
      livros: string;
      clientes: string;
      emprestimos: string;
    }>(
      `
      SELECT
        (SELECT COUNT(*)::text FROM autores) AS autores,
        (SELECT COUNT(*)::text FROM livros) AS livros,
        (SELECT COUNT(*)::text FROM clientes) AS clientes,
        (SELECT COUNT(*)::text FROM emprestimos) AS emprestimos
      `
    );

    const row = counts.rows[0];
    const shouldSeed =
      Number(row.autores) === 0 &&
      Number(row.livros) === 0 &&
      Number(row.clientes) === 0 &&
      Number(row.emprestimos) === 0;

    if (shouldSeed) {
      await client.query(seedSql);
    }
  });
}
