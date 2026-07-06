import inquirer from "inquirer";
import { AutorController } from "../controllers/AutorController";
import { ErrorHandler } from "../utils/ErrorHandler";
import { MenuHelpers } from "./MenuHelpers";

export class AutorMenu {
  constructor(private readonly autorController: AutorController) {}

  async open(): Promise<void> {
    while (true) {
      MenuHelpers.printTitle("Autores");
      const res = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: "Selecione uma opção:",
          choices: [
            { name: "1 - Cadastrar", value: "CREATE" },
            { name: "2 - Listar", value: "LIST" },
            { name: "3 - Buscar por ID", value: "GET_ID" },
            { name: "4 - Buscar por Nome", value: "SEARCH" },
            { name: "5 - Atualizar", value: "UPDATE" },
            { name: "6 - Excluir", value: "DELETE" },
            { name: "0 - Voltar", value: "BACK" }
          ]
        }
      ]);

      if (res.action === "BACK") return;

      try {
        if (res.action === "CREATE") {
          const input = await inquirer.prompt([
            { name: "nome", message: "Nome:", type: "input" },
            { name: "nacionalidade", message: "Nacionalidade (opcional):", type: "input" }
          ]);
          const autor = await this.autorController.cadastrar({
            nome: input.nome,
            nacionalidade: input.nacionalidade ? input.nacionalidade : null
          });
          MenuHelpers.printSuccess(`Autor cadastrado: ${autor.nome} (${autor.id})`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "LIST") {
          let page = 1;
          while (true) {
            const result = await this.autorController.listar(page, 10);
            console.table(
              result.items.map((a) => ({
                id: a.id,
                nome: a.nome,
                nacionalidade: a.nacionalidade ?? "-"
              }))
            );
            const action = await MenuHelpers.choosePaginationAction(result);
            if (action === "BACK") break;
            page = action === "NEXT" ? page + 1 : page - 1;
          }
          continue;
        }

        if (res.action === "GET_ID") {
          const { id } = await inquirer.prompt([
            { name: "id", message: "ID do autor:", type: "input" }
          ]);
          const autor = await this.autorController.buscarPorId(id);
          console.table([
            {
              id: autor.id,
              nome: autor.nome,
              nacionalidade: autor.nacionalidade ?? "-"
            }
          ]);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "SEARCH") {
          const { term } = await inquirer.prompt([
            { name: "term", message: "Digite parte do nome:", type: "input" }
          ]);
          let page = 1;
          while (true) {
            const result = await this.autorController.buscarPorNome(term, page, 10);
            console.table(
              result.items.map((a) => ({
                id: a.id,
                nome: a.nome,
                nacionalidade: a.nacionalidade ?? "-"
              }))
            );
            const action = await MenuHelpers.choosePaginationAction(result);
            if (action === "BACK") break;
            page = action === "NEXT" ? page + 1 : page - 1;
          }
          continue;
        }

        if (res.action === "UPDATE") {
          const { id } = await inquirer.prompt([
            { name: "id", message: "ID do autor:", type: "input" }
          ]);
          const current = await this.autorController.buscarPorId(id);
          const input = await inquirer.prompt([
            { name: "nome", message: "Nome:", type: "input", default: current.nome },
            {
              name: "nacionalidade",
              message: "Nacionalidade (opcional):",
              type: "input",
              default: current.nacionalidade ?? ""
            }
          ]);
          const autor = await this.autorController.atualizar(id, {
            nome: input.nome,
            nacionalidade: input.nacionalidade ? input.nacionalidade : null
          });
          MenuHelpers.printSuccess(`Autor atualizado: ${autor.nome}`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "DELETE") {
          const { id } = await inquirer.prompt([
            { name: "id", message: "ID do autor:", type: "input" }
          ]);
          const confirm = await inquirer.prompt([
            { name: "ok", message: "Confirmar exclusão?", type: "confirm", default: false }
          ]);
          if (confirm.ok) {
            await this.autorController.excluir(id);
            MenuHelpers.printSuccess("Autor excluído.");
          }
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
}

