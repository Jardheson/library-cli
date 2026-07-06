import { AppError, DatabaseError, NotFoundError, ValidationError } from "../src/utils/Errors";
import { ErrorHandler } from "../src/utils/ErrorHandler";
import { Validator } from "../src/utils/Validator";

describe("Erros globais", () => {
  test("AppError aceita status e código customizados", () => {
    const err = new AppError("Falha", 418, "TEAPOT");

    expect(err.message).toBe("Falha");
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe("TEAPOT");
  });

  test("AppError usa valores padrão quando omitidos", () => {
    const err = new AppError("Falha");

    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("APP_ERROR");
  });

  test("NotFoundError usa mensagem padrão", () => {
    const err = new NotFoundError();

    expect(err.message).toBe("Recurso não encontrado");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  test("ValidationError preserva detalhes opcionais", () => {
    const err = new ValidationError("Dados inválidos", [{ field: "nome" }]);

    expect(err.message).toBe("Dados inválidos");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect((err as { details?: unknown }).details).toEqual([{ field: "nome" }]);
  });

  test("ValidationError usa mensagem padrão sem detalhes", () => {
    const err = new ValidationError();

    expect(err.message).toBe("Dados inválidos");
    expect((err as { details?: unknown }).details).toBeUndefined();
  });

  test("DatabaseError expõe details quando informado", () => {
    const err = new DatabaseError("Erro", { sql: "SELECT 1" });

    expect(err.message).toBe("Erro");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("DATABASE_ERROR");
    expect((err as { details?: unknown }).details).toEqual({ sql: "SELECT 1" });
  });

  test("DatabaseError sem details não quebra", () => {
    const err = new DatabaseError("Erro");

    expect((err as { details?: unknown }).details).toBeUndefined();
  });
});

describe("ErrorHandler", () => {
  test("retorna details para AppError", () => {
    const handled = ErrorHandler.handle(new ValidationError("Inválido", { campo: "email" }));

    expect(handled).toEqual({ message: "Inválido", details: { campo: "email" } });
  });

  test("retorna message para Error genérico", () => {
    const handled = ErrorHandler.handle(new Error("boom"));

    expect(handled).toEqual({ message: "boom" });
  });

  test("retorna fallback para valor não-Error", () => {
    const handled = ErrorHandler.handle("qualquer coisa");

    expect(handled).toEqual({ message: "Erro inesperado" });
  });
});

describe("Validator", () => {
  test("repropaga erro não-Zod sem transformar", () => {
    const fakeSchema = {
      parse() {
        throw new Error("boom");
      }
    };

    expect(() => Validator.parse(fakeSchema as never, {})).toThrow("boom");
  });
});