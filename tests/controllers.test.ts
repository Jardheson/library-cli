import { AutorController } from "../src/controllers/AutorController";
import { LivroController } from "../src/controllers/LivroController";
import { ClienteController } from "../src/controllers/ClienteController";
import { EmprestimoController } from "../src/controllers/EmprestimoController";
import { RelatorioController } from "../src/controllers/RelatorioController";

describe("Controllers", () => {
  test("AutorController delega operacoes ao service", async () => {
    const service = {
      create: jest.fn().mockResolvedValue({ id: "1" }),
      list: jest.fn().mockResolvedValue({ items: [] }),
      findById: jest.fn().mockResolvedValue({ id: "1" }),
      searchByName: jest.fn().mockResolvedValue({ items: [] }),
      update: jest.fn().mockResolvedValue({ id: "1" }),
      delete: jest.fn().mockResolvedValue(true)
    };
    const controller = new AutorController(service as never);

    await controller.cadastrar({ nome: "Autor" });
    await controller.listar(1, 10);
    await controller.buscarPorId("1");
    await controller.buscarPorNome("au", 1, 10);
    await controller.atualizar("1", { nome: "Novo" });
    await controller.excluir("1");

    expect(service.create).toHaveBeenCalled();
    expect(service.list).toHaveBeenCalledWith(1, 10);
    expect(service.findById).toHaveBeenCalledWith("1");
    expect(service.searchByName).toHaveBeenCalledWith("au", 1, 10);
    expect(service.update).toHaveBeenCalledWith("1", { nome: "Novo" });
    expect(service.delete).toHaveBeenCalledWith("1");
  });

  test("LivroController delega operacoes ao service", async () => {
    const service = {
      create: jest.fn().mockResolvedValue({ id: "1" }),
      list: jest.fn().mockResolvedValue({ items: [] }),
      findById: jest.fn().mockResolvedValue({ id: "1" }),
      searchByTitle: jest.fn().mockResolvedValue({ items: [] }),
      update: jest.fn().mockResolvedValue({ id: "1" }),
      delete: jest.fn().mockResolvedValue(true)
    };
    const controller = new LivroController(service as never);

    await controller.cadastrar({ titulo: "Livro" });
    await controller.listar(1, 10);
    await controller.buscarPorId("1");
    await controller.buscarPorNome("li", 1, 10);
    await controller.atualizar("1", { titulo: "Novo" });
    await controller.excluir("1");

    expect(service.searchByTitle).toHaveBeenCalledWith("li", 1, 10);
    expect(service.update).toHaveBeenCalledWith("1", { titulo: "Novo" });
    expect(service.delete).toHaveBeenCalledWith("1");
  });

  test("ClienteController delega operacoes ao service", async () => {
    const service = {
      create: jest.fn().mockResolvedValue({ id: "1" }),
      list: jest.fn().mockResolvedValue({ items: [] }),
      findById: jest.fn().mockResolvedValue({ id: "1" }),
      searchByName: jest.fn().mockResolvedValue({ items: [] }),
      update: jest.fn().mockResolvedValue({ id: "1" }),
      delete: jest.fn().mockResolvedValue(true)
    };
    const controller = new ClienteController(service as never);

    await controller.cadastrar({ nome: "Cliente" });
    await controller.listar(1, 10);
    await controller.buscarPorId("1");
    await controller.buscarPorNome("cl", 1, 10);
    await controller.atualizar("1", { nome: "Novo" });
    await controller.excluir("1");

    expect(service.searchByName).toHaveBeenCalledWith("cl", 1, 10);
    expect(service.update).toHaveBeenCalledWith("1", { nome: "Novo" });
    expect(service.delete).toHaveBeenCalledWith("1");
  });

  test("EmprestimoController delega operacoes ao service", async () => {
    const service = {
      registrarEmprestimo: jest.fn().mockResolvedValue({ id: "1" }),
      registrarDevolucao: jest.fn().mockResolvedValue({ id: "1" }),
      consultarEmprestimosAtivos: jest.fn().mockResolvedValue({ items: [] }),
      consultarHistorico: jest.fn().mockResolvedValue({ items: [] })
    };
    const controller = new EmprestimoController(service as never);

    await controller.registrarEmprestimo({ livroId: "l", clienteId: "c" });
    await controller.registrarDevolucao({ emprestimoId: "1" });
    await controller.consultarEmprestimos(1, 10);
    await controller.consultarHistorico(1, 10);

    expect(service.registrarEmprestimo).toHaveBeenCalled();
    expect(service.registrarDevolucao).toHaveBeenCalled();
    expect(service.consultarEmprestimosAtivos).toHaveBeenCalledWith(1, 10);
    expect(service.consultarHistorico).toHaveBeenCalledWith(1, 10);
  });

  test("RelatorioController delega operacoes ao service", async () => {
    const service = {
      dashboard: jest.fn().mockResolvedValue({}),
      livrosDisponiveis: jest.fn().mockResolvedValue([{ id: "1" }]),
      livrosEmprestadosAtivos: jest.fn().mockResolvedValue([{ id: "1" }]),
      historicoGeral: jest.fn().mockResolvedValue([{ id: "1" }]),
      clientesComMaisEmprestimos: jest.fn().mockResolvedValue([{ id: "1" }]),
      autoresMaisEmprestados: jest.fn().mockResolvedValue([{ id: "1" }]),
      livrosMaisEmprestados: jest.fn().mockResolvedValue([{ id: "1" }]),
      estatisticas: jest.fn().mockResolvedValue({}),
      exportLivrosDisponiveis: jest.fn().mockResolvedValue("a.csv"),
      exportLivrosEmprestados: jest.fn().mockResolvedValue("b.csv"),
      exportHistoricoGeral: jest.fn().mockResolvedValue("c.csv"),
      exportRankingClientes: jest.fn().mockResolvedValue("d.csv"),
      exportRankingAutores: jest.fn().mockResolvedValue("e.csv"),
      exportRankingLivros: jest.fn().mockResolvedValue("f.csv")
    };
    const controller = new RelatorioController(service as never);

    await controller.dashboard();
    await controller.livrosDisponiveis();
    await controller.livrosEmprestadosAtivos();
    await controller.historicoGeral();
    await controller.clientesComMaisEmprestimos(10);
    await controller.autoresMaisEmprestados(10);
    await controller.livrosMaisEmprestados(10);
    await controller.estatisticas();
    await controller.exportLivrosDisponiveis("x.csv");
    await controller.exportLivrosEmprestados("y.csv");
    await controller.exportHistoricoGeral("z.csv");
    await controller.exportRankingClientes("a.csv", 5);
    await controller.exportRankingAutores("b.csv", 5);
    await controller.exportRankingLivros("c.csv", 5);

    expect(service.dashboard).toHaveBeenCalled();
    expect(service.clientesComMaisEmprestimos).toHaveBeenCalledWith(10);
    expect(service.exportRankingClientes).toHaveBeenCalledWith(
      [{ id: "1" }],
      "a.csv"
    );
    expect(service.exportRankingAutores).toHaveBeenCalledWith(
      [{ id: "1" }],
      "b.csv"
    );
    expect(service.exportRankingLivros).toHaveBeenCalledWith(
      [{ id: "1" }],
      "c.csv"
    );
  });
});
