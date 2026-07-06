import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type CsvValue = string | number | boolean | null | undefined | Date;

export class CsvExporter {
  static async writeFile(
    filePath: string,
    headers: string[],
    rows: CsvValue[][]
  ): Promise<string> {
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
    await mkdir(path.dirname(abs), { recursive: true });

    const csv = CsvExporter.toCsv(headers, rows);
    await writeFile(abs, csv, { encoding: "utf8" });
    return abs;
  }

  static toCsv(headers: string[], rows: CsvValue[][], delimiter = ";"): string {
    const escape = (v: CsvValue): string => {
      if (v === null || v === undefined) return "";
      const raw = v instanceof Date ? v.toISOString() : String(v);
      const needsQuotes =
        raw.includes(delimiter) || raw.includes('"') || raw.includes("\n");
      const withEscapedQuotes = raw.replace(/"/g, '""');
      return needsQuotes ? `"${withEscapedQuotes}"` : withEscapedQuotes;
    };

    const lines = [
      headers.map((h) => escape(h)).join(delimiter),
      ...rows.map((r) => r.map((c) => escape(c)).join(delimiter))
    ];
    return `${lines.join("\n")}\n`;
  }
}

