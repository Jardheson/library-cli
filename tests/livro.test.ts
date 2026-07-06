import { LivroService } from "../src/services/LivroService";
import { NotFoundError, ValidationError } from "../src/utils/Errors";

type Autor = { id: string };

class InMemoryAutorRepository {
  private ids = new Set<string>();
  add(id: string) {
    this.ids.add(id);
  }
  async findById(id: string): Promise<Autor | null> {
    return this.ids.has(id) ? { id } : null;
  }
}

type Livro = {
  id: string;
  titulo: string;
  autorId: string;
  quantidade: number;
  disponivel: number;
  createdAt: Date;
};

class InMemoryLivroRepository {
  private items: Livro[] = [];

  async create(input: { id: string; titulo: string; autorId: string; quantidade: number }): Promise<Livro> {
    const created: Livro = {
      id: input.id,
      titulo: input.titulo,
      autorId: input.autorId,
      quantidade: input.quantidade,
      disponivel: input.quantidade,
      createdAt: new Date()
    };
    this.items.push(created);
    return created;
  }

  async findById(id: string): Promise<Livro | null> {
    return this.items.find((l) => l.id === id) ?? null;
  }

  setDisponivel(id: string, disponivel: number): void {
    const livro = this.items.find((l) => l.id === id);
    if (livro) livro.disponivel = disponivel;
  }

  async update(id: string, input: { titulo: string; autorId: string; quantidade: number }): Promise<Livro | null> {
    const idx = this.items.findIndex((l) => l.id === id);
    if (idx < 0) return null;
    const borrowed = this.items[idx].quantidade - this.items[idx].disponivel;
    if (borrowed > input.quantidade) return null;
    this.items[idx] = {
      ...this.items[idx],
      titulo: input.titulo,
      autorId: input.autorId,
      quantidade: input.quantidade,
      disponivel: input.quantidade - borrowed
    };
    return this.items[idx];
  }

  async delete(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((l) => l.id !== id);
    return this.items.length !== before;
  }

  async list() {
    return { items: this.items, page: 1, pageSize: 10, totalItems: this.items.length, totalPages: 1 };
  }

  async searchByTitle() {
    return { items: this.items, page: 1, pageSize: 10, totalItems: this.items.length, totalPages: 1 };
  }
}

class SilentLogger {
  async info(): Promise<void> {}
}

describe("CRUD Livro (Service)", () => {
  test("exige autor existente e quantidade mínima 1", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    await expect(
      service.create({ titulo: "Teste", autorId: "00000000-0000-0000-0000-000000000000", quantidade: 1 })
    ).rejects.toBeInstanceOf(ValidationError);

    autorRepo.add("00000000-0000-0000-0000-000000000000");
    await expect(
      service.create({ titulo: "Teste", autorId: "00000000-0000-0000-0000-000000000000", quantidade: 0 })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("cadastra e atualiza livro", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    const autorId = "00000000-0000-0000-0000-000000000000";
    autorRepo.add(autorId);

    const livro = await service.create({ titulo: "Fundação", autorId, quantidade: 5 });
    const updated = await service.update(livro.id, { titulo: "Fundação (Ed. 2)", autorId, quantidade: 6 });

    expect(updated.quantidade).toBe(6);
    expect(updated.disponivel).toBe(6);
  });

  test("consulta livro existente por ID", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    const autorId = "00000000-0000-0000-0000-000000000000";
    autorRepo.add(autorId);

    const livro = await service.create({ titulo: "Fundação", autorId, quantidade: 5 });
    const found = await service.findById(livro.id);

    expect(found.id).toBe(livro.id);
  });

  test("impede reduzir quantidade abaixo de empréstimos ativos (borrowed)", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    const autorId = "00000000-0000-0000-0000-000000000000";
    autorRepo.add(autorId);

    const livro = await service.create({ titulo: "1984", autorId, quantidade: 5 });
    livroRepo.setDisponivel(livro.id, 3);

    await expect(
      service.update(livro.id, { titulo: "1984", autorId, quantidade: 1 })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test("lança NotFound ao atualizar inexistente", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    const autorId = "00000000-0000-0000-0000-000000000000";
    autorRepo.add(autorId);

    await expect(
      service.update("11111111-1111-1111-8111-111111111111", { titulo: "XX", autorId, quantidade: 2 })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("lança NotFound ao excluir inexistente", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    await expect(service.delete("11111111-1111-1111-8111-111111111111")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  test("lança NotFound ao consultar livro inexistente", async () => {
    const autorRepo = new InMemoryAutorRepository();
    const livroRepo = new InMemoryLivroRepository();
    const service = new LivroService(livroRepo as any, autorRepo as any, new SilentLogger() as any);

    await expect(service.findById("11111111-1111-1111-8111-111111111111")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
