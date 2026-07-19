import { AutorService } from "../src/services/AutorService";
import { NotFoundError, ValidationError } from "../src/utils/Errors";

type Autor = { id: string; nome: string; nacionalidade: string | null; createdAt: Date };

class InMemoryAutorRepository {
  private items: Autor[] = [];

  async create(input: { id: string; nome: string; nacionalidade: string | null }): Promise<Autor> {
    const autor: Autor = { ...input, createdAt: new Date() };
    this.items.push(autor);
    return autor;
  }

  async findById(id: string): Promise<Autor | null> {
    return this.items.find((a) => a.id === id) ?? null;
  }

  async list() {
    return { items: this.items, page: 1, pageSize: 10, totalItems: this.items.length, totalPages: 1 };
  }

  async searchByName() {
    return { items: this.items, page: 1, pageSize: 10, totalItems: this.items.length, totalPages: 1 };
  }

  async update(id: string, input: { nome: string; nacionalidade: string | null }): Promise<Autor | null> {
    const idx = this.items.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    this.items[idx] = { ...this.items[idx], ...input };
    return this.items[idx];
  }

  async delete(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((a) => a.id !== id);
    return this.items.length !== before;
  }
}

class SilentLogger {
  async info(): Promise<void> {}
}

describe("CRUD Autor (Service)", () => {
  test("cadastra e consulta autor", async () => {
    const repo = new InMemoryAutorRepository();
    const service = new AutorService(repo as any, new SilentLogger() as any);
    const autor = await service.create({ nome: "Machado", nacionalidade: "Brasil" });
    const found = await service.findById(autor.id);
    expect(found.nome).toBe("Machado");
  });

  test("lança NotFound ao consultar autor inexistente", async () => {
    const service = new AutorService(new InMemoryAutorRepository() as any, new SilentLogger() as any);

    await expect(service.findById("11111111-1111-1111-1111-111111111111")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  test("valida nome obrigatório", async () => {
    const service = new AutorService(new InMemoryAutorRepository() as any, new SilentLogger() as any);
    await expect(service.create({ nome: "", nacionalidade: null })).rejects.toBeInstanceOf(ValidationError);
  });

  test("lança NotFound ao atualizar inexistente", async () => {
    const service = new AutorService(new InMemoryAutorRepository() as any, new SilentLogger() as any);
    await expect(
      service.update("11111111-1111-1111-1111-111111111111", { nome: "XX", nacionalidade: null })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("exclui autor existente", async () => {
    const repo = new InMemoryAutorRepository();
    const service = new AutorService(repo as any, new SilentLogger() as any);
    const autor = await service.create({ nome: "Clarice", nacionalidade: null });
    await expect(service.delete(autor.id)).resolves.toBe(true);
  });

  test("lista, busca por nome e atualiza autor existente", async () => {
    const repo = new InMemoryAutorRepository();
    const service = new AutorService(repo as any, new SilentLogger() as any);
    const autor = await service.create({ nome: "Aluisio", nacionalidade: null });

    const list = await service.list(1, 10);
    const search = await service.searchByName("Alu", 1, 10);
    const updated = await service.update(autor.id, {
      nome: "Aluisio Azevedo",
      nacionalidade: "Brasil"
    });

    expect(list.totalItems).toBe(1);
    expect(search.totalItems).toBe(1);
    expect(updated.nacionalidade).toBe("Brasil");
  });

  test("lança NotFound ao excluir inexistente", async () => {
    const service = new AutorService(new InMemoryAutorRepository() as any, new SilentLogger() as any);
    await expect(service.delete("11111111-1111-1111-1111-111111111111")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
