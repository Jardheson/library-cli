import inquirer from "inquirer";
import { RelatorioController } from "../controllers/RelatorioController";
import { Formatter } from "../utils/Formatter";
import { ErrorHandler } from "../utils/ErrorHandler";
import { MenuHelpers } from "./MenuHelpers";

export class RelatorioMenu {
  constructor(private readonly relatorioController: RelatorioController) {}

  async open(): Promise<void> {
    while (true) {
      MenuHelpers.printTitle("Relatórios");
      const res = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: "Selecione um relatório:",
          choices: [
            { name: "1 - Livros Disponíveis", value: "AVAILABLE" },
            { name: "2 - Livros Emprestados (Ativos)", value: "BORROWED" },
            { name: "3 - Histórico Geral", value: "HISTORY" },
            { name: "4 - Clientes com Mais Empréstimos", value: "TOP_CLIENTS" },
            { name: "5 - Autores Mais Emprestados", value: "TOP_AUTHORS" },
            { name: "6 - Livros Mais Emprestados", value: "TOP_BOOKS" },
            { name: "7 - Estatísticas", value: "STATS" },
            { name: "0 - Voltar", value: "BACK" }
          ]
        }
      ]);

      if (res.action === "BACK") return;

      try {
        if (res.action === "AVAILABLE") {
          const items = await this.relatorioController.livrosDisponiveis();
          console.table(
            items.map((i) => ({
              livroId: i.livroId,
              titulo: i.titulo,
              autor: i.autorNome,
              quantidade: i.quantidade,
              disponivel: i.disponivel
            }))
          );
          await this.askExport("Exportar para CSV?", () =>
            this.relatorioController.exportLivrosDisponiveis()
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "BORROWED") {
          const items = await this.relatorioController.livrosEmprestadosAtivos();
          console.table(
            items.map((i) => ({
              emprestimoId: i.emprestimoId,
              cliente: i.clienteNome,
              titulo: i.titulo,
              autor: i.autorNome,
              dataEmprestimo: Formatter.date(i.dataEmprestimo)
            }))
          );
          await this.askExport("Exportar para CSV?", () =>
            this.relatorioController.exportLivrosEmprestados()
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "HISTORY") {
          const items = await this.relatorioController.historicoGeral();
          console.table(
            items.map((i) => ({
              emprestimoId: i.emprestimoId,
              cliente: i.clienteNome,
              livro: i.livroTitulo,
              autor: i.autorNome,
              dataEmprestimo: Formatter.date(i.dataEmprestimo),
              dataDevolucao: Formatter.date(i.dataDevolucao),
              status: i.status
            }))
          );
          await this.askExport("Exportar para CSV?", () =>
            this.relatorioController.exportHistoricoGeral()
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "TOP_CLIENTS") {
          const items = await this.relatorioController.clientesComMaisEmprestimos(10);
          console.table(
            items.map((i, idx) => ({
              rank: idx + 1,
              cliente: i.clienteNome,
              totalEmprestimos: i.totalEmprestimos
            }))
          );
          await this.askExport("Exportar para CSV?", () =>
            this.relatorioController.exportRankingClientes(undefined, 10)
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "TOP_AUTHORS") {
          const items = await this.relatorioController.autoresMaisEmprestados(10);
          console.table(
            items.map((i, idx) => ({
              rank: idx + 1,
              autor: i.autorNome,
              totalEmprestimos: i.totalEmprestimos
            }))
          );
          await this.askExport("Exportar para CSV?", () =>
            this.relatorioController.exportRankingAutores(undefined, 10)
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "TOP_BOOKS") {
          const items = await this.relatorioController.livrosMaisEmprestados(10);
          console.table(
            items.map((i, idx) => ({
              rank: idx + 1,
              livro: i.livroTitulo,
              totalEmprestimos: i.totalEmprestimos
            }))
          );
          await this.askExport("Exportar para CSV?", () =>
            this.relatorioController.exportRankingLivros(undefined, 10)
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "STATS") {
          const stats = await this.relatorioController.estatisticas();
          console.table([
            {
              totalEmprestimos: stats.totalEmprestimos,
              mediaPorCliente: stats.mediaEmprestimosPorCliente,
              livroMaisEmprestado: stats.livroMaisEmprestado?.livroTitulo ?? "-",
              autorMaisPopular: stats.autorMaisPopular?.autorNome ?? "-"
            }
          ]);
          await MenuHelpers.pause();
          continue;
        }
      } catch (err) {
        const handled = ErrorHandler.handle(err);
        MenuHelpers.printError(handled.message);
        if (handled.details) {
          console.table(handled.details as unknown[]);
        }
        await MenuHelpers.pause();
      }
    }
  }

  private async askExport(
    message: string,
    exporter: () => Promise<string>
  ): Promise<void> {
    const { ok } = await inquirer.prompt([
      { name: "ok", message, type: "confirm", default: false }
    ]);
    if (!ok) return;
    const filePath = await exporter();
    MenuHelpers.printSuccess(`Arquivo gerado: ${filePath}`);
  }
}

