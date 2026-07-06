import { AppError } from "./Errors";

export type HandledError = {
  message: string;
  details?: unknown;
};

export class ErrorHandler {
  static handle(err: unknown): HandledError {
    if (err instanceof AppError) {
      const details = (err as { details?: unknown }).details;
      return { message: err.message, details };
    }
    if (err instanceof Error) return { message: err.message };
    return { message: "Erro inesperado" };
  }
}

