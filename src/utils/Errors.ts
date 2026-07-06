export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message = "Dados inválidos", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Erro de banco de dados", details?: unknown) {
    super(message, 500, "DATABASE_ERROR");
    if (details) {
      (this as { details?: unknown }).details = details;
    }
  }
}

