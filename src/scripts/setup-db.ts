import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";
import { Client } from "pg";
import {
  resolveDatabaseConfig,
  type DatabaseConfig
} from "../database/config";
import { applyPendingMigrations } from "../database/migrations";

const maintenanceDatabase = "postgres";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function tryConnect(
  config: DatabaseConfig,
  database: string
): Promise<Client | null> {
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database
  });

  try {
    await client.connect();
    return client;
  } catch {
    await client.end().catch(() => {});
    return null;
  }
}

async function promptForConfig(
  current: DatabaseConfig
): Promise<DatabaseConfig> {
  const answers = await inquirer.prompt([
    { name: "host", type: "input", message: "DB_HOST:", default: current.host },
    { name: "port", type: "number", message: "DB_PORT:", default: current.port },
    { name: "user", type: "input", message: "DB_USER:", default: current.user },
    {
      name: "password",
      type: "password",
      message: "DB_PASSWORD:",
      default: current.password,
      mask: "*"
    },
    {
      name: "database",
      type: "input",
      message: "DB_NAME:",
      default: current.database
    }
  ]);

  return {
    host: String(answers.host).trim(),
    port: Number(answers.port),
    user: String(answers.user).trim(),
    password: String(answers.password ?? ""),
    database: String(answers.database).trim()
  };
}

function validateDatabaseName(database: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(database)) {
    throw new Error(
      "DB_NAME invalido para criacao automatica. Use apenas letras, numeros e underscore."
    );
  }
}

async function upsertEnvFile(
  filePath: string,
  config: DatabaseConfig
): Promise<void> {
  const existing = (await fileExists(filePath))
    ? await readFile(filePath, { encoding: "utf8" })
    : "";

  const map = new Map<string, string>();
  const preservedLines: string[] = [];

  for (const rawLine of existing.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      if (rawLine) preservedLines.push(rawLine);
      continue;
    }

    const sepIndex = rawLine.indexOf("=");
    const key = rawLine.slice(0, sepIndex).trim();
    const value = rawLine.slice(sepIndex + 1);
    map.set(key, value);
  }

  map.set("DB_HOST", config.host);
  map.set("DB_PORT", String(config.port));
  map.set("DB_USER", config.user);
  map.set("DB_PASSWORD", config.password);
  map.set("DB_NAME", config.database);

  const envLines = [
    ...preservedLines,
    `DB_HOST=${map.get("DB_HOST") ?? ""}`,
    `DB_PORT=${map.get("DB_PORT") ?? ""}`,
    `DB_USER=${map.get("DB_USER") ?? ""}`,
    `DB_PASSWORD=${map.get("DB_PASSWORD") ?? ""}`,
    `DB_NAME=${map.get("DB_NAME") ?? ""}`
  ];

  await writeFile(filePath, `${envLines.filter(Boolean).join("\n")}\n`, {
    encoding: "utf8"
  });
}

async function connectAdmin(
  config: DatabaseConfig
): Promise<{ config: DatabaseConfig; client: Client; prompted: boolean }> {
  const initialClient = await tryConnect(config, maintenanceDatabase);
  if (initialClient) {
    return { config, client: initialClient, prompted: false };
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "Falha ao conectar com a configuracao atual e nao ha terminal interativo para solicitar novos dados."
    );
  }

  console.log(
    "Nao foi possivel conectar com a configuracao atual. Informe os dados do PostgreSQL."
  );
  const promptedConfig = await promptForConfig(config);
  const promptedClient = await tryConnect(promptedConfig, maintenanceDatabase);

  if (!promptedClient) {
    throw new Error(
      "Nao foi possivel conectar ao PostgreSQL com os dados informados."
    );
  }

  return { config: promptedConfig, client: promptedClient, prompted: true };
}

async function ensureDatabaseExists(
  client: Client,
  databaseName: string
): Promise<void> {
  validateDatabaseName(databaseName);

  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [databaseName]
  );

  if (result.rows.length > 0) {
    return;
  }

  await client.query(`CREATE DATABASE "${databaseName}" ENCODING 'UTF8'`);
}

async function connectDatabaseOrFail(
  config: DatabaseConfig
): Promise<Client> {
  const client = await tryConnect(config, config.database);
  if (!client) {
    throw new Error(
      `Nao foi possivel conectar ao banco "${config.database}" com a configuracao atual.`
    );
  }
  return client;
}

async function initializeDatabase(): Promise<void> {
  const envPath = path.resolve(process.cwd(), ".env");
  const initialConfig = resolveDatabaseConfig();

  console.log("\nLibrary CLI - setup do banco\n");

  const { config, client: adminClient, prompted } = await connectAdmin(
    initialConfig
  );

  try {
    console.log(`Verificando banco "${config.database}"...`);
    await ensureDatabaseExists(adminClient, config.database);
  } finally {
    await adminClient.end().catch(() => {});
  }

  const dbClient = await connectDatabaseOrFail(config);
  try {
    console.log("Aplicando migrations versionadas...");
    await applyPendingMigrations(dbClient);
  } finally {
    await dbClient.end().catch(() => {});
  }

  if (prompted || !(await fileExists(envPath))) {
    await upsertEnvFile(envPath, config);
  }

  console.log("\nSetup concluido com sucesso.");
  console.log("Proximos passos:");
  console.log(" - npm run dev");
  console.log(" - npm run build");
  console.log(" - npm test");
}

initializeDatabase().catch((error) => {
  console.error("Falha no setup do banco.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
