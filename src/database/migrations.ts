import { readFile } from "node:fs/promises";
import path from "node:path";
import type { QueryResult, QueryResultRow } from "pg";

type SqlExecutor = {
  query: <T extends QueryResultRow = any>(
    text: string,
    values?: any[]
  ) => Promise<QueryResult<T>>;
};

type Migration = {
  id: string;
  fileName: string;
  shouldRun?: (client: SqlExecutor) => Promise<boolean>;
};

const migrations: Migration[] = [
  { id: "001_schema", fileName: "schema.sql" },
  {
    id: "002_seed",
    fileName: "seed.sql",
    shouldRun: async (client) => {
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
      return (
        Number(row.autores) === 0 &&
        Number(row.livros) === 0 &&
        Number(row.clientes) === 0 &&
        Number(row.emprestimos) === 0
      );
    }
  }
];

async function ensureMigrationsTable(client: SqlExecutor): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id VARCHAR(100) PRIMARY KEY,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrationIds(client: SqlExecutor): Promise<Set<string>> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM _migrations ORDER BY executed_at ASC`
  );
  return new Set(result.rows.map((row) => row.id));
}

async function markMigrationApplied(
  client: SqlExecutor,
  migrationId: string
): Promise<void> {
  await client.query(
    `
    INSERT INTO _migrations (id)
    VALUES ($1)
    ON CONFLICT (id) DO NOTHING
    `,
    [migrationId]
  );
}

async function loadMigrationSql(fileName: string): Promise<string> {
  const filePath = path.resolve(__dirname, fileName);
  return readFile(filePath, { encoding: "utf8" });
}

export async function applyPendingMigrations(client: SqlExecutor): Promise<void> {
  await ensureMigrationsTable(client);
  const applied = await getAppliedMigrationIds(client);

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    const shouldRun = migration.shouldRun
      ? await migration.shouldRun(client)
      : true;

    if (shouldRun) {
      const sql = await loadMigrationSql(migration.fileName);
      await client.query(sql);
    }

    await markMigrationApplied(client, migration.id);
  }
}
