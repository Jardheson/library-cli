import inquirer from "inquirer";
import { ClienteController } from "../controllers/ClienteController";
import { Formatter } from "../utils/Formatter";
import { ErrorHandler } from "../utils/ErrorHandler";
import { MenuHelpers } from "./MenuHelpers";

export class ClienteMenu {
  constructor(private readonly clienteController: ClienteController) {}

  async open(): Promise<void> {
    while (true) {
      MenuHelpers.printTitle("Clientes");
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
            { name: "email", message: "E-mail:", type: "input" },
            { name: "cpf", message: "CPF (somente números ou formatado):", type: "input" },
            { name: "telefone", message: "Telefone (opcional):", type: "input" }
          ]);
          const cliente = await this.clienteController.cadastrar({
            ...input,
            telefone: input.telefone ? input.telefone : null
          });
          MenuHelpers.printSuccess(`Cliente cadastrado: ${cliente.nome} (${cliente.id})`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "LIST") {
          let page = 1;
          while (true) {
            const result = await this.clienteController.listar(page, 10);
            console.table(
              result.items.map((c) => ({
                id: c.id,
                nome: c.nome,
                email: c.email,
                cpf: Formatter.cpf(c.cpf),
                telefone: c.telefone ?? "-"
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
            { name: "id", message: "ID do cliente:", type: "input" }
          ]);
          const c = await this.clienteController.buscarPorId(id);
          console.table([
            {
              id: c.id,
              nome: c.nome,
              email: c.email,
              cpf: Formatter.cpf(c.cpf),
              telefone: c.telefone ?? "-"
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
            const result = await this.clienteController.buscarPorNome(term, page, 10);
            console.table(
              result.items.map((c) => ({
                id: c.id,
                nome: c.nome,
                email: c.email,
                cpf: Formatter.cpf(c.cpf),
                telefone: c.telefone ?? "-"
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
            { name: "id", message: "ID do cliente:", type: "input" }
          ]);
          const current = await this.clienteController.buscarPorId(id);
          const input = await inquirer.prompt([
            { name: "nome", message: "Nome:", type: "input", default: current.nome },
            { name: "email", message: "E-mail:", type: "input", default: current.email },
            {
              name: "cpf",
              message: "CPF:",
              type: "input",
              default: Formatter.cpf(current.cpf)
            },
            {
              name: "telefone",
              message: "Telefone (opcional):",
              type: "input",
              default: current.telefone ?? ""
            }
          ]);
          const cliente = await this.clienteController.atualizar(id, {
            ...input,
            telefone: input.telefone ? input.telefone : null
          });
          MenuHelpers.printSuccess(`Cliente atualizado: ${cliente.nome}`);
          await MenuHelpers.pause();
          continue;
        }

        if (res.action === "DELETE") {
          const { id } = await inquirer.prompt([
            { name: "id", message: "ID do cliente:", type: "input" }
          ]);
          const confirm = await inquirer.prompt([
            { name: "ok", message: "Confirmar exclusão?", type: "confirm", default: false }
          ]);
          if (confirm.ok) {
            await this.clienteController.excluir(id);
            MenuHelpers.printSuccess("Cliente excluído.");
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

