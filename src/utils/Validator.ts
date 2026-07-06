import { ZodError, type ZodSchema } from "zod";
import { ValidationError } from "./Errors";

export class Validator {
  static parse<T>(schema: ZodSchema<T>, input: unknown): T {
    try {
      return schema.parse(input);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message
        }));
        throw new ValidationError("Dados inválidos", details);
      }
      throw err;
    }
  }
}

