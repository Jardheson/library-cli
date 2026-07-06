import inquirer from "inquirer";
import chalk from "chalk";
import { AutorMenu } from "./AutorMenu";
import { LivroMenu } from "./LivroMenu";
import { ClienteMenu } from "./ClienteMenu";
import { EmprestimoMenu } from "./EmprestimoMenu";
import { RelatorioMenu } from "./RelatorioMenu";
import { RelatorioController } from "../controllers/RelatorioController";
import { ErrorHandler } from "../utils/ErrorHandler";
import { MenuHelpers } from "./MenuHelpers";

export class MainMenu {
  constructor(
    private readonly autorMenu: AutorMenu,
    private readonly livroMenu: LivroMenu,
    private readonly clienteMenu: ClienteMenu,
    private readonly emprestimoMenu: EmprestimoMenu,
    private readonly relatorioMenu: RelatorioMenu,
    private readonly relatorioController: RelatorioController
  ) {}

  async start(): Promise<void> {
    await this.showDashboard();
    while (true) {
      MenuHelpers.printTitle("Menu Principal");
      const res = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: "Selecione uma opção:",
          choices: [
            { name: "1 - Autores", value: "AUTORES" },
            { name: "2 - Livros", value: "LIVROS" },
            { name: "3 - Clientes", value: "CLIENTES" },
            { name: "4 - Empréstimos", value: "EMPRESTIMOS" },
            { name: "5 - Relatórios", value: "RELATORIOS" },
            { name: "6 - Dashboard", value: "DASHBOARD" },
            { name: "0 - Sair", value: "EXIT" }
          ]
        }
      ]);

      if (res.action === "EXIT") return;

      if (res.action === "AUTORES") {
        await this.autorMenu.open();
        continue;
      }
      if (res.action === "LIVROS") {
        await this.livroMenu.open();
        continue;
      }
      if (res.action === "CLIENTES") {
        await this.clienteMenu.open();
        continue;
      }
      if (res.action === "EMPRESTIMOS") {
        await this.emprestimoMenu.open();
        continue;
      }
      if (res.action === "RELATORIOS") {
        await this.relatorioMenu.open();
        continue;
      }
      if (res.action === "DASHBOARD") {
        await this.showDashboard();
        await MenuHelpers.pause();
        continue;
      }
    }
  }

  private async showDashboard(): Promise<void> {
    try {
      MenuHelpers.printTitle("Dashboard");
      const d = await this.relatorioController.dashboard();
      const cards = [
        { label: "Total de Autores", value: d.totalAutores },
        { label: "Total de Livros", value: d.totalLivros },
        { label: "Total de Clientes", value: d.totalClientes },
        { label: "Livros Disponíveis", value: d.livrosDisponiveis },
        { label: "Livros Emprestados", value: d.livrosEmprestados },
        { label: "Empréstimos Ativos", value: d.emprestimosAtivos }
      ];

      for (const c of cards) {
        console.log(
          `${chalk.yellowBright(c.label.padEnd(22))}: ${chalk.whiteBright(String(c.value))}`
        );
      }
    } catch (err) {
      const handled = ErrorHandler.handle(err);
      MenuHelpers.printError(handled.message);
    }
  }
}

