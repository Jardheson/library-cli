import inquirer from "inquirer";
import chalk from "chalk";
import type { PageResult } from "../utils/Pagination";

export class MenuHelpers {
  static printTitle(title: string): void {
    const line = "-".repeat(Math.min(60, title.length + 10));
    console.log(chalk.cyanBright(`\n${line}\n${title}\n${line}`));
  }

  static printInfo(message: string): void {
    console.log(chalk.gray(message));
  }

  static printSuccess(message: string): void {
    console.log(chalk.green(message));
  }

  static printError(message: string): void {
    console.log(chalk.red(message));
  }

  static async pause(message = "Pressione ENTER para continuar..."): Promise<void> {
    await inquirer.prompt([
      {
        name: "pause",
        message,
        type: "input"
      }
    ]);
  }

  static async choosePaginationAction<T>(
    page: PageResult<T>
  ): Promise<"NEXT" | "PREV" | "BACK"> {
    const choices: Array<{ name: string; value: "NEXT" | "PREV" | "BACK" }> = [];
    if (page.page > 1) choices.push({ name: "Página anterior", value: "PREV" });
    if (page.page < page.totalPages)
      choices.push({ name: "Próxima página", value: "NEXT" });
    choices.push({ name: "Voltar", value: "BACK" });

    const res = await inquirer.prompt([
      {
        name: "action",
        message: `Página ${page.page} de ${page.totalPages} (Total: ${page.totalItems})`,
        type: "list",
        choices
      }
    ]);
    return res.action;
  }
}

