import dotenv from "dotenv";
import chalk from "chalk";
import { initializeDatabase, db } from "./database/connection";
import { Logger } from "./utils/Logger";
import { AutorRepository } from "./repositories/AutorRepository";
import { LivroRepository } from "./repositories/LivroRepository";
import { ClienteRepository } from "./repositories/ClienteRepository";
import { EmprestimoRepository } from "./repositories/EmprestimoRepository";
import { RelatorioRepository } from "./repositories/RelatorioRepository";
import { AutorService } from "./services/AutorService";
import { LivroService } from "./services/LivroService";
import { ClienteService } from "./services/ClienteService";
import { EmprestimoService } from "./services/EmprestimoService";
import { RelatorioService } from "./services/RelatorioService";
import { AutorController } from "./controllers/AutorController";
import { LivroController } from "./controllers/LivroController";
import { ClienteController } from "./controllers/ClienteController";
import { EmprestimoController } from "./controllers/EmprestimoController";
import { RelatorioController } from "./controllers/RelatorioController";
import { MainMenu } from "./menus/MainMenu";
import { AutorMenu } from "./menus/AutorMenu";
import { LivroMenu } from "./menus/LivroMenu";
import { ClienteMenu } from "./menus/ClienteMenu";
import { EmprestimoMenu } from "./menus/EmprestimoMenu";
import { RelatorioMenu } from "./menus/RelatorioMenu";

dotenv.config();

async function bootstrap(): Promise<void> {
  const logger = new Logger();

  await initializeDatabase();

  const autorRepository = new AutorRepository();
  const livroRepository = new LivroRepository();
  const clienteRepository = new ClienteRepository();
  const emprestimoRepository = new EmprestimoRepository();
  const relatorioRepository = new RelatorioRepository();

  const autorService = new AutorService(autorRepository, logger);
  const livroService = new LivroService(livroRepository, autorRepository, logger);
  const clienteService = new ClienteService(clienteRepository, logger);
  const emprestimoService = new EmprestimoService(
    emprestimoRepository,
    livroRepository,
    clienteRepository,
    logger
  );
  const relatorioService = new RelatorioService(
    relatorioRepository,
    autorRepository,
    livroRepository,
    clienteRepository,
    emprestimoRepository
  );

  const autorController = new AutorController(autorService);
  const livroController = new LivroController(livroService);
  const clienteController = new ClienteController(clienteService);
  const emprestimoController = new EmprestimoController(emprestimoService);
  const relatorioController = new RelatorioController(relatorioService);

  const autorMenu = new AutorMenu(autorController);
  const livroMenu = new LivroMenu(livroController);
  const clienteMenu = new ClienteMenu(clienteController);
  const emprestimoMenu = new EmprestimoMenu(emprestimoController);
  const relatorioMenu = new RelatorioMenu(relatorioController);

  const mainMenu = new MainMenu(
    autorMenu,
    livroMenu,
    clienteMenu,
    emprestimoMenu,
    relatorioMenu,
    relatorioController
  );

  await mainMenu.start();
}

bootstrap()
  .catch((err) => {
    console.error(chalk.red("Falha ao iniciar o sistema."));
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.pool.end().catch(() => {});
  });

