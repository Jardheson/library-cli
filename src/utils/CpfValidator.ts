export class CpfValidator {
  static normalize(cpf: string): string {
    return cpf.replace(/[^\d]/g, "");
  }

  static isValid(cpf: string): boolean {
    const normalized = CpfValidator.normalize(cpf);
    if (normalized.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(normalized)) return false;

    const digits = normalized.split("").map((d) => Number(d));
    const calcCheckDigit = (slice: number, factorStart: number): number => {
      const sum = digits
        .slice(0, slice)
        .reduce((acc, curr, idx) => acc + curr * (factorStart - idx), 0);
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };

    const d1 = calcCheckDigit(9, 10);
    const d2 = calcCheckDigit(10, 11);
    return digits[9] === d1 && digits[10] === d2;
  }
}

