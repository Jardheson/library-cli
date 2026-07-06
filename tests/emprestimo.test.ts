import { EmprestimoService } from "../src/services/EmprestimoService";
import { NotFoundError, ValidationError } from "../src/utils/Errors";

type Livro = { id: string; disponivel: number; quantidade: number };
type Cliente = { id: string };
type Emprestimo = {
  id: string;
  livroId: string;
  clienteId: string;
  dataEmprestimo: Date;
  dataDevolucao: Date | null;
  devolvido: boolean;
};

class InMemoryLivroRepository {
  constructor(private livros: Livro[]) {}

  async findById(id: string) {
    const l = this.livros.find((x) => x.id === id);
    if (!l) return null;
    return { ...l, titulo: "T", autorId: "00000000-0000-0000-0000-000000000000", createdAt: new Date() };
  }

  async decrementDisponivel(id: string): Promise<boolean> {
    const l = this.livros.find((x) => x.id === id);
    if (!l) return false;
    if (l.disponivel <= 0) return false;
    l.disponivel -= 1;
    return true;
  }

  async incrementDisponivel(id: string): Promise<boolean> {
    const l = this.livros.find((x) => x.id === id);
    if (!l) return false;
    l.disponivel = Math.min(l.quantidade, l.disponivel + 1);
    return true;
  }
}

class InMemoryClienteRepository {
  constructor(private clientes: Cliente[]) {}
  async findById(id: string): Promise<Cliente | null> {
    return this.clientes.find((c) => c.id === id) ?? null;
  }
}

class InMemoryEmprestimoRepository {
  private items: Emprestimo[] = [];
  private failMarkReturned = false;

  setFailMarkReturned(value: boolean): void {
    this.failMarkReturned = value;
  }

  async create(input: { id: string; livroId: string; clienteId: string; dataEmprestimo: Date }): Promise<Emprestimo> {
    const e: Emprestimo = {
      id: input.id,
      livroId: input.livroId,
      clienteId: input.clienteId,
      dataEmprestimo: input.dataEmprestimo,
      dataDevolucao: null,
      devolvido: false
    };
    this.items.push(e);
    return e;
  }

  async findById(id: string): Promise<Emprestimo | null> {
    return this.items.find((e) => e.id === id) ?? null;
  }

  async findActiveById(id: string): Promise<Emprestimo | null> {
    const e = this.items.find((x) => x.id === id && !x.devolvido);
    return e ?? null;
  }

  async markReturned(id: string, returnedAt: Date): Promise<boolean> {
    if (this.failMarkReturned) return false;
    const e = this.items.find((x) => x.id === id && !x.devolvido);
    if (!e) return false;
    e.devolvido = true;
    e.dataDevolucao = returnedAt;
    return true;
  }

  async list(devolvido: boolean | null) {
    const filtered =
      devolvido === null ? this.items : this.items.filter((e) => e.devolvido === devolvido);
    return {
      items: filtered.map((e) => ({
        id: e.id,
        livroId: e.livroId,
        livroTitulo: "Livro",
        autorNome: "Autor",
        clienteId: e.clienteId,
        clienteNome: "Cliente",
        dataEmprestimo: e.dataEmprestimo,
        dataDevolucao: e.dataDevolucao,
        devolvido: e.devolvido
      })),
      page: 1,
      pageSize: 10,
      totalItems: filtered.length,
      totalPages: 1
    };
  }
}

class SilentLogger {
  async info(): Promise<void> {}
}

describe("Empréstimo/Devolução (Service)", () => {
  test("rejeita empréstimo quando cliente não existe", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 1, disponivel: 1 }]);
    const clientesRepo = new InMemoryClienteRepository([]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    await expect(service.registrarEmprestimo({ livroId, clienteId })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test("rejeita empréstimo quando livro não existe", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    await expect(service.registrarEmprestimo({ livroId, clienteId })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test("registra empréstimo e decrementa disponibilidade", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 2, disponivel: 2 }]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();

    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    const emprestimo = await service.registrarEmprestimo({ livroId, clienteId });
    expect(emprestimo.devolvido).toBe(false);

    const livroAfter = await livrosRepo.findById(livroId);
    expect(livroAfter?.disponivel).toBe(1);
  });

  test("rejeita empréstimo quando a baixa de disponibilidade falha na transação", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 1, disponivel: 1 }]) as any;
    livrosRepo.decrementDisponivel = async () => false;
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    await expect(service.registrarEmprestimo({ livroId, clienteId })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test("impede empréstimo quando livro indisponível", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 1, disponivel: 0 }]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    await expect(service.registrarEmprestimo({ livroId, clienteId })).rejects.toBeInstanceOf(ValidationError);
  });

  test("registra devolução e incrementa disponibilidade", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 2, disponivel: 2 }]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    const emprestimo = await service.registrarEmprestimo({ livroId, clienteId });

    const devolucao = await service.registrarDevolucao({ emprestimoId: emprestimo.id });
    expect(devolucao.devolvido).toBe(true);
    expect(devolucao.dataDevolucao).toBeTruthy();

    const livroAfter = await livrosRepo.findById(livroId);
    expect(livroAfter?.disponivel).toBe(2);
  });

  test("rejeita devolução quando a marcação falha na transação", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 2, disponivel: 2 }]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    const emprestimo = await service.registrarEmprestimo({ livroId, clienteId });
    emprestimosRepo.setFailMarkReturned(true);

    await expect(service.registrarDevolucao({ emprestimoId: emprestimo.id })).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  test("rejeita devolução para empréstimo inexistente", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 2, disponivel: 2 }]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    await expect(
      service.registrarDevolucao({ emprestimoId: "33333333-3333-3333-8333-333333333333" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("consulta empréstimos ativos e histórico", async () => {
    const livroId = "11111111-1111-1111-8111-111111111111";
    const clienteId = "22222222-2222-2222-8222-222222222222";

    const livrosRepo = new InMemoryLivroRepository([{ id: livroId, quantidade: 1, disponivel: 1 }]);
    const clientesRepo = new InMemoryClienteRepository([{ id: clienteId }]);
    const emprestimosRepo = new InMemoryEmprestimoRepository();
    const transactionRunner = async <T>(fn: (client: any) => Promise<T>) => fn({});

    const service = new EmprestimoService(
      emprestimosRepo as any,
      livrosRepo as any,
      clientesRepo as any,
      new SilentLogger() as any,
      transactionRunner as any
    );

    const emprestimo = await service.registrarEmprestimo({ livroId, clienteId });
    const ativos = await service.consultarEmprestimosAtivos(1, 10);
    expect(ativos.totalItems).toBe(1);

    await service.registrarDevolucao({ emprestimoId: emprestimo.id });
    const historico = await service.consultarHistorico(1, 10);
    expect(historico.totalItems).toBe(1);
  });
});
