import dotenv from "dotenv";

dotenv.config();

export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "biblioteca"
};

export function resolveDatabaseConfig(
  overrides: Partial<DatabaseConfig> = {}
): DatabaseConfig {
  const merged = {
    host: process.env.DB_HOST ?? DEFAULT_DATABASE_CONFIG.host,
    port: Number(process.env.DB_PORT ?? DEFAULT_DATABASE_CONFIG.port),
    user: process.env.DB_USER ?? DEFAULT_DATABASE_CONFIG.user,
    password: process.env.DB_PASSWORD ?? DEFAULT_DATABASE_CONFIG.password,
    database: process.env.DB_NAME ?? DEFAULT_DATABASE_CONFIG.database,
    ...overrides
  };

  return {
    host: String(merged.host),
    port: Number(merged.port),
    user: String(merged.user),
    password: String(merged.password ?? ""),
    database: String(merged.database)
  };
}

export function validateDatabaseConfig(config: DatabaseConfig): void {
  const missing: string[] = [];

  if (!config.host) missing.push("DB_HOST");
  if (!config.port || Number.isNaN(config.port)) missing.push("DB_PORT");
  if (!config.user) missing.push("DB_USER");
  if (!config.database) missing.push("DB_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Configuração do banco incompleta. Defina as variáveis ausentes em .env: ${missing.join(
        ", "
      )}.`
    );
  }
}

