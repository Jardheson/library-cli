import inquirer from "inquirer";
import { EmprestimoController } from "../controllers/EmprestimoController";
import { ErrorHandler } from "../utils/ErrorHandler";
import { Formatter } from "../utils/Formatter";
import { MenuHelpers } from "./MenuHelpers";

export class EmprestimoMenu {
  constructor(private readonly emprestimoController: EmprestimoController) {}

  async open(): Promise<void> {
    while (true) {
      MenuHelpers.printTitle("Empréstimos");
      const res = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: "Selecione uma opção:",
          choices: [
            { name: "1 - Registrar empréstimo", value: "LOAN" },
            { name: "2 - Registrar devolução", value: "RETURN" },
            { name: "3 - Consultar empréstimos ativos", value: "ACTIVE" },
            { name: "4 - Consultar histórico", value: "HISTORY" },
            { name: "0 - Voltar", value: "BACK" }
          ]
        }
      ]);

      if (res.action === "BACK") return;

      try {
        if (res.action === "LOAN") {
          const input = await inquirer.prompt([
            { name: "clienteId", message: "Cliente ID:", type: "input" },
            { name: "livroId", message: "Livro ID:", type: "input" }
          ]);
          const emprestimo = await this.emprestimoController.registrarEmprestimo(input);
          MenuHelpers.printSuccess(`Empréstimo registrado: ${emprestimo.id}`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "RETURN") {
          const input = await inquirer.prompt([
            { name: "emprestimoId", message: "Empréstimo ID:", type: "input" }
          ]);
          const devolucao = await this.emprestimoController.registrarDevolucao(input);
          MenuHelpers.printSuccess(
            `Devolução registrada: ${devolucao.id} em ${Formatter.date(devolucao.dataDevolucao)}`
          );
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "ACTIVE") {
          let page = 1;
          while (true) {
            const result = await this.emprestimoController.consultarEmprestimos(page, 10);
            console.table(
              result.items.map((e) => ({
                emprestimoId: e.id,
                cliente: e.clienteNome,
                livro: e.livroTitulo,
                autor: e.autorNome,
                dataEmprestimo: Formatter.date(e.dataEmprestimo)
              }))
            );
            const action = await MenuHelpers.choosePaginationAction(result);
            if (action === "BACK") break;
            page = action === "NEXT" ? page + 1 : page - 1;
          }
          continue;
        }

        if (res.action === "HISTORY") {
          let page = 1;
          while (true) {
            const result = await this.emprestimoController.consultarHistorico(page, 10);
            console.table(
              result.items.map((e) => ({
                emprestimoId: e.id,
                cliente: e.clienteNome,
                livro: e.livroTitulo,
                autor: e.autorNome,
                dataEmprestimo: Formatter.date(e.dataEmprestimo),
                dataDevolucao: Formatter.date(e.dataDevolucao),
                devolvido: e.devolvido ? "SIM" : "NÃO"
              }))
            );
            const action = await MenuHelpers.choosePaginationAction(result);
            if (action === "BACK") break;
            page = action === "NEXT" ? page + 1 : page - 1;
          }
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
}

