export class EmailValidator {
  private static readonly emailRegex =
    /^(?=.{1,254}$)(?=.{1,64}@)[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i;

  static isValid(email: string): boolean {
    return EmailValidator.emailRegex.test(email.trim());
  }
}

