import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { AutorRepository } from "../repositories/AutorRepository";
import { LivroRepository } from "../repositories/LivroRepository";
import { NotFoundError, ValidationError } from "../utils/Errors";
import { Logger } from "../utils/Logger";
import { Validator } from "../utils/Validator";

const livroCreateSchema = z.object({
  titulo: z.string().trim().min(2, "Título é obrigatório"),
  autorId: z.string().uuid("Autor inválido"),
  quantidade: z.coerce.number().int().min(1, "Quantidade mínima é 1")
});

const livroUpdateSchema = livroCreateSchema;

export class LivroService {
  constructor(
    private readonly livroRepository: LivroRepository,
    private readonly autorRepository: AutorRepository,
    private readonly logger: Logger
  ) {}

  async create(input: unknown) {
    const data = Validator.parse(livroCreateSchema, input);
    const autor = await this.autorRepository.findById(data.autorId);
    if (!autor) throw new ValidationError("Autor obrigatório/inexistente");

    const livro = await this.livroRepository.create({
      id: uuidv4(),
      titulo: data.titulo,
      autorId: data.autorId,
      quantidade: data.quantidade
    });
    await this.logger.info("Livro cadastrado", { livroId: livro.id });
    return livro;
  }

  async list(page = 1, pageSize = 10) {
    return this.livroRepository.list(page, pageSize);
  }

  async findById(id: string) {
    const livro = await this.livroRepository.findById(id);
    if (!livro) throw new NotFoundError("Livro não encontrado");
    return livro;
  }

  async searchByTitle(term: string, page = 1, pageSize = 10) {
    return this.livroRepository.searchByTitle(term, page, pageSize);
  }

  async update(id: string, input: unknown) {
    const data = Validator.parse(livroUpdateSchema, input);
    const autor = await this.autorRepository.findById(data.autorId);
    if (!autor) throw new ValidationError("Autor obrigatório/inexistente");

    const updated = await this.livroRepository.update(id, {
      titulo: data.titulo,
      autorId: data.autorId,
      quantidade: data.quantidade
    });

    if (!updated) {
      const exists = await this.livroRepository.findById(id);
      if (!exists) throw new NotFoundError("Livro não encontrado");
      throw new ValidationError(
        "Quantidade inválida: existe(m) empréstimo(s) ativo(s) maior(es) que o novo total"
      );
    }

    await this.logger.info("Livro atualizado", { livroId: id });
    return updated;
  }

  async delete(id: string) {
    const ok = await this.livroRepository.delete(id);
    if (!ok) throw new NotFoundError("Livro não encontrado");
    await this.logger.info("Livro excluído", { livroId: id });
    return ok;
  }
}

