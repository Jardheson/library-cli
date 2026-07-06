import inquirer from "inquirer";
import { LivroController } from "../controllers/LivroController";
import { ErrorHandler } from "../utils/ErrorHandler";
import { MenuHelpers } from "./MenuHelpers";

export class LivroMenu {
  constructor(private readonly livroController: LivroController) {}

  async open(): Promise<void> {
    while (true) {
      MenuHelpers.printTitle("Livros");
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
            { name: "titulo", message: "Título:", type: "input" },
            { name: "autorId", message: "Autor ID:", type: "input" },
            { name: "quantidade", message: "Quantidade:", type: "number", default: 1 }
          ]);
          const livro = await this.livroController.cadastrar(input);
          MenuHelpers.printSuccess(`Livro cadastrado: ${livro.titulo} (${livro.id})`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "LIST") {
          let page = 1;
          while (true) {
            const result = await this.livroController.listar(page, 10);
            console.table(
              result.items.map((l) => ({
                id: l.id,
                titulo: l.titulo,
                autorId: l.autorId,
                quantidade: l.quantidade,
                disponivel: l.disponivel
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
            { name: "id", message: "ID do livro:", type: "input" }
          ]);
          const livro = await this.livroController.buscarPorId(id);
          console.table([
            {
              id: livro.id,
              titulo: livro.titulo,
              autorId: livro.autorId,
              quantidade: livro.quantidade,
              disponivel: livro.disponivel
            }
          ]);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "SEARCH") {
          const { term } = await inquirer.prompt([
            { name: "term", message: "Digite parte do título:", type: "input" }
          ]);
          let page = 1;
          while (true) {
            const result = await this.livroController.buscarPorNome(term, page, 10);
            console.table(
              result.items.map((l) => ({
                id: l.id,
                titulo: l.titulo,
                autorId: l.autorId,
                quantidade: l.quantidade,
                disponivel: l.disponivel
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
            { name: "id", message: "ID do livro:", type: "input" }
          ]);
          const current = await this.livroController.buscarPorId(id);
          const input = await inquirer.prompt([
            { name: "titulo", message: "Título:", type: "input", default: current.titulo },
            { name: "autorId", message: "Autor ID:", type: "input", default: current.autorId },
            {
              name: "quantidade",
              message: "Quantidade:",
              type: "number",
              default: current.quantidade
            }
          ]);
          const livro = await this.livroController.atualizar(id, input);
          MenuHelpers.printSuccess(`Livro atualizado: ${livro.titulo}`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "DELETE") {
          const { id } = await inquirer.prompt([
            { name: "id", message: "ID do livro:", type: "input" }
          ]);
          const confirm = await inquirer.prompt([
            { name: "ok", message: "Confirmar exclusão?", type: "confirm", default: false }
          ]);
          if (confirm.ok) {
            await this.livroController.excluir(id);
            MenuHelpers.printSuccess("Livro excluído.");
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

