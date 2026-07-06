import { format } from "date-fns";

export class Formatter {
  static date(value: Date | string | null | undefined): string {
    if (!value) return "-";
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return "-";
    return format(d, "dd/MM/yyyy HH:mm");
  }

  static cpf(value: string): string {
    const digits = value.replace(/[^\d]/g, "");
    if (digits.length !== 11) return value;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
      6,
      9
    )}-${digits.slice(9)}`;
  }
}

