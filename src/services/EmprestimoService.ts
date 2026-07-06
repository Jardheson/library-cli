import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { db } from "../database/connection";
import { ClienteRepository } from "../repositories/ClienteRepository";
import { EmprestimoRepository } from "../repositories/EmprestimoRepository";
import { LivroRepository } from "../repositories/LivroRepository";
import { NotFoundError, ValidationError } from "../utils/Errors";
import { Logger } from "../utils/Logger";
import { Validator } from "../utils/Validator";
import type { PoolClient } from "pg";

const emprestimoCreateSchema = z.object({
  livroId: z.string().uuid("Livro inválido"),
  clienteId: z.string().uuid("Cliente inválido")
});

const devolucaoSchema = z.object({
  emprestimoId: z.string().uuid("Empréstimo inválido")
});

export class EmprestimoService {
  constructor(
    private readonly emprestimoRepository: EmprestimoRepository,
    private readonly livroRepository: LivroRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly logger: Logger,
    private readonly transactionRunner: <T>(fn: (client: PoolClient) => Promise<T>) => Promise<T> =
      db.withTransaction
  ) {}

  async registrarEmprestimo(input: unknown) {
    const data = Validator.parse(emprestimoCreateSchema, input);

    const cliente = await this.clienteRepository.findById(data.clienteId);
    if (!cliente) throw new ValidationError("Cliente inexistente");

    const livro = await this.livroRepository.findById(data.livroId);
    if (!livro) throw new ValidationError("Livro inexistente");
    if (livro.disponivel <= 0) throw new ValidationError("Livro indisponível");

    const now = new Date();
    const emprestimoId = uuidv4();

    const emprestimo = await this.transactionRunner(async (client) => {
      const ok = await this.livroRepository.decrementDisponivel(data.livroId, client);
      if (!ok) throw new ValidationError("Livro indisponível");
      return this.emprestimoRepository.create(
        {
          id: emprestimoId,
          livroId: data.livroId,
          clienteId: data.clienteId,
          dataEmprestimo: now
        },
        client
      );
    });

    await this.logger.info("Empréstimo registrado", {
      emprestimoId,
      livroId: data.livroId,
      clienteId: data.clienteId
    });
    return emprestimo;
  }

  async registrarDevolucao(input: unknown) {
    const data = Validator.parse(devolucaoSchema, input);
    const emprestimo = await this.emprestimoRepository.findActiveById(
      data.emprestimoId
    );
    if (!emprestimo) throw new NotFoundError("Empréstimo ativo não encontrado");

    const now = new Date();

    await this.transactionRunner(async (client) => {
      const ok = await this.emprestimoRepository.markReturned(
        data.emprestimoId,
        now,
        client
      );
      if (!ok) throw new NotFoundError("Empréstimo ativo não encontrado");
      await this.livroRepository.incrementDisponivel(emprestimo.livroId, client);
    });

    await this.logger.info("Devolução registrada", {
      emprestimoId: data.emprestimoId
    });

    const after = await this.emprestimoRepository.findById(data.emprestimoId);
    if (!after) throw new NotFoundError("Empréstimo não encontrado");
    return after;
  }

  async consultarEmprestimosAtivos(page = 1, pageSize = 10) {
    return this.emprestimoRepository.list(false, page, pageSize);
  }

  async consultarHistorico(page = 1, pageSize = 10) {
    return this.emprestimoRepository.list(null, page, pageSize);
  }
}
