import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { AutorRepository } from "../repositories/AutorRepository";
import { NotFoundError } from "../utils/Errors";
import { Logger } from "../utils/Logger";
import { Validator } from "../utils/Validator";

const autorCreateSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório"),
  nacionalidade: z.string().trim().min(2).optional().nullable()
});

const autorUpdateSchema = autorCreateSchema;

export class AutorService {
  constructor(
    private readonly autorRepository: AutorRepository,
    private readonly logger: Logger
  ) {}

  async create(input: unknown) {
    const data = Validator.parse(autorCreateSchema, input);
    const autor = await this.autorRepository.create({
      id: uuidv4(),
      nome: data.nome,
      nacionalidade: data.nacionalidade ?? null
    });
    await this.logger.info("Autor cadastrado", { autorId: autor.id });
    return autor;
  }

  async list(page = 1, pageSize = 10) {
    return this.autorRepository.list(page, pageSize);
  }

  async findById(id: string) {
    const autor = await this.autorRepository.findById(id);
    if (!autor) throw new NotFoundError("Autor não encontrado");
    return autor;
  }

  async searchByName(term: string, page = 1, pageSize = 10) {
    return this.autorRepository.searchByName(term, page, pageSize);
  }

  async update(id: string, input: unknown) {
    const data = Validator.parse(autorUpdateSchema, input);
    const updated = await this.autorRepository.update(id, {
      nome: data.nome,
      nacionalidade: data.nacionalidade ?? null
    });
    if (!updated) throw new NotFoundError("Autor não encontrado");
    await this.logger.info("Autor atualizado", { autorId: id });
    return updated;
  }

  async delete(id: string) {
    const ok = await this.autorRepository.delete(id);
    if (!ok) throw new NotFoundError("Autor não encontrado");
    await this.logger.info("Autor excluído", { autorId: id });
    return ok;
  }
}

