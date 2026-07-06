import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

type LogLevel = "INFO" | "ERROR";

export class Logger {
  private readonly logFilePath: string;

  constructor(logFilePath?: string) {
    this.logFilePath =
      logFilePath ?? path.resolve(process.cwd(), "logs", "app.log");
  }

  async info(message: string, context?: Record<string, unknown>): Promise<void> {
    await this.write("INFO", message, context);
  }

  async error(
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.write("ERROR", message, context);
  }

  private async write(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const dir = path.dirname(this.logFilePath);
    await mkdir(dir, { recursive: true });

    const timestamp = new Date().toISOString();
    const payload = context ? JSON.stringify(context) : "";
    const line = `[${timestamp}] [${level}] ${message}${
      payload ? ` ${payload}` : ""
    }\n`;

    await appendFile(this.logFilePath, line, { encoding: "utf8" });
  }
}

