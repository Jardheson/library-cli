import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import dotenv from "dotenv";
import { DatabaseError } from "../utils/Errors";
import { DatabaseError } from "../utils/Errors";
import {
  resolveDatabaseConfig,
  validateDatabaseConfig
} from "./config";
import { applyPendingMigrations } from "./migrations";

dotenv.config();

type QueryParams = Array<string | number | boolean | Date | null>;

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

function loadDatabaseConfig() {
  const config = resolveDatabaseConfig();
  validateDatabaseConfig(config);
  return config;
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
  await db.withClient(async (client) => {
    await applyPendingMigrations(client);
  });
}
