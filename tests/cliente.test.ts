import { ClienteService } from "../src/services/ClienteService";
import { CpfValidator } from "../src/utils/CpfValidator";
import { DatabaseError, NotFoundError, ValidationError } from "../src/utils/Errors";
import { Validator } from "../src/utils/Validator";

type Cliente = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
  createdAt: Date;
};

class InMemoryClienteRepository {
  private items: Cliente[] = [];

  async create(input: Omit<Cliente, "createdAt">): Promise<Cliente> {
    const created: Cliente = { ...input, createdAt: new Date() };
    this.items.push(created);
    return created;
  }

  async findById(id: string): Promise<Cliente | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }

  async findByCpf(cpf: string): Promise<Cliente | null> {
    return this.items.find((c) => c.cpf === cpf) ?? null;
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    return this.items.find((c) => c.email === email) ?? null;
  }

  async update(id: string, input: Omit<Cliente, "id" | "createdAt">): Promise<Cliente | null> {
    const idx = this.items.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    this.items[idx] = { ...this.items[idx], ...input };
    return this.items[idx];
  }

  async delete(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((c) => c.id !== id);
    return this.items.length !== before;
  }

  async list() {
    return { items: this.items, page: 1, pageSize: 10, totalItems: this.items.length, totalPages: 1 };
  }

  async searchByName() {
    return { items: this.items, page: 1, pageSize: 10, totalItems: this.items.length, totalPages: 1 };
  }
}

class SilentLogger {
  async info(): Promise<void> {}
}

describe("Validação de CPF", () => {
  test("aceita CPF válido (52998224725)", () => {
    expect(CpfValidator.isValid("529.982.247-25")).toBe(true);
    expect(CpfValidator.isValid("52998224725")).toBe(true);
  });

  test("rejeita CPF inválido", () => {
    expect(CpfValidator.isValid("111.111.111-11")).toBe(false);
    expect(CpfValidator.isValid("123")).toBe(false);
  });
});

describe("CRUD Cliente (Service)", () => {
  test("cadastra cliente com CPF e e-mail válidos", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    const cliente = await service.create({
      nome: "Maria",
      email: "maria@example.com",
      cpf: "529.982.247-25",
      telefone: "11999990000"
    });

    expect(cliente.id).toBeTruthy();
    expect(cliente.cpf).toBe("52998224725");
  });

  test("consulta cliente existente por ID", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    const cliente = await service.create({
      nome: "Maria",
      email: "maria@example.com",
      cpf: "52998224725",
      telefone: null
    });

    const found = await service.findById(cliente.id);
    expect(found.id).toBe(cliente.id);
  });

  test("lança NotFound ao consultar cliente inexistente", async () => {
    const service = new ClienteService(new InMemoryClienteRepository() as any, new SilentLogger() as any);

    await expect(service.findById("11111111-1111-1111-1111-111111111111")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  test("rejeita e-mail inválido", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    await expect(
      service.create({
        nome: "Maria",
        email: "invalido",
        cpf: "52998224725",
        telefone: null
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("rejeita CPF inválido", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    await expect(
      service.create({
        nome: "Maria",
        email: "maria@example.com",
        cpf: "11111111111",
        telefone: null
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("impede CPF duplicado", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    await service.create({
      nome: "Maria",
      email: "maria@example.com",
      cpf: "52998224725",
      telefone: null
    });

    await expect(
      service.create({
        nome: "João",
        email: "joao@example.com",
        cpf: "52998224725",
        telefone: null
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("impede e-mail duplicado", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    await service.create({
      nome: "Maria",
      email: "maria@example.com",
      cpf: "52998224725",
      telefone: null
    });

    await expect(
      service.create({
        nome: "João",
        email: "maria@example.com",
        cpf: "11144477735",
        telefone: null
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("atualiza cliente e mantém unicidade de e-mail/CPF", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    const a = await service.create({
      nome: "Ana",
      email: "a@example.com",
      cpf: "52998224725",
      telefone: null
    });
    await service.create({
      nome: "Bruno",
      email: "b@example.com",
      cpf: "11144477735",
      telefone: null
    });

    await expect(
      service.update(a.id, {
        nome: "A2",
        email: "b@example.com",
        cpf: "52998224725",
        telefone: null
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("atualiza cliente com novo e-mail e CPF (válidos)", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    const a = await service.create({
      nome: "Ana",
      email: "ana@example.com",
      cpf: "52998224725",
      telefone: null
    });

    const updated = await service.update(a.id, {
      nome: "Ana Maria",
      email: "ana.maria@example.com",
      cpf: "11144477735",
      telefone: null
    });

    expect(updated.email).toBe("ana.maria@example.com");
    expect(updated.cpf).toBe("11144477735");
  });

  test("atualiza cliente sem alterar cpf e e-mail", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);

    const cliente = await service.create({
      nome: "Ana",
      email: "ana@example.com",
      cpf: "52998224725",
      telefone: null
    });

    const updated = await service.update(cliente.id, {
      nome: "Ana Souza",
      email: "ana@example.com",
      cpf: "52998224725",
      telefone: null
    });

    expect(updated.nome).toBe("Ana Souza");
    expect(updated.email).toBe("ana@example.com");
    expect(updated.cpf).toBe("52998224725");
  });

  test("lança NotFound ao excluir inexistente", async () => {
    const repo = new InMemoryClienteRepository();
    const service = new ClienteService(repo as any, new SilentLogger() as any);
    await expect(service.delete("11111111-1111-1111-8111-111111111111")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});

describe("Utils", () => {
  test("DatabaseError expõe details quando fornecido", () => {
    const err = new DatabaseError("db", { foo: "bar" });
    expect((err as any).details).toEqual({ foo: "bar" });
  });

  test("Validator repropaga erro não-Zod", () => {
    const fakeSchema = {
      parse() {
        throw new Error("boom");
      }
    };
    expect(() => Validator.parse(fakeSchema as any, {})).toThrow("boom");
  });
});
