import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ClienteRepository } from "../repositories/ClienteRepository";
import { CpfValidator } from "../utils/CpfValidator";
import { EmailValidator } from "../utils/EmailValidator";
import { NotFoundError, ValidationError } from "../utils/Errors";
import { Logger } from "../utils/Logger";
import { Validator } from "../utils/Validator";

const clienteCreateSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório"),
  email: z.string().trim().min(5, "E-mail é obrigatório"),
  cpf: z.string().trim().min(11, "CPF é obrigatório"),
  telefone: z.string().trim().min(6).optional().nullable()
});

const clienteUpdateSchema = clienteCreateSchema;

export class ClienteService {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly logger: Logger
  ) {}

  async create(input: unknown) {
    const data = Validator.parse(clienteCreateSchema, input);

    const cpf = CpfValidator.normalize(data.cpf);
    if (!CpfValidator.isValid(cpf)) throw new ValidationError("CPF inválido");
    if (!EmailValidator.isValid(data.email))
      throw new ValidationError("E-mail inválido");

    const cpfExists = await this.clienteRepository.findByCpf(cpf);
    if (cpfExists) throw new ValidationError("CPF já cadastrado");

    const emailExists = await this.clienteRepository.findByEmail(data.email);
    if (emailExists) throw new ValidationError("E-mail já cadastrado");

    const cliente = await this.clienteRepository.create({
      id: uuidv4(),
      nome: data.nome,
      email: data.email,
      cpf,
      telefone: data.telefone ?? null
    });

    await this.logger.info("Cliente cadastrado", { clienteId: cliente.id });
    return cliente;
  }

  async list(page = 1, pageSize = 10) {
    return this.clienteRepository.list(page, pageSize);
  }

  async findById(id: string) {
    const cliente = await this.clienteRepository.findById(id);
    if (!cliente) throw new NotFoundError("Cliente não encontrado");
    return cliente;
  }

  async searchByName(term: string, page = 1, pageSize = 10) {
    return this.clienteRepository.searchByName(term, page, pageSize);
  }

  async update(id: string, input: unknown) {
    const data = Validator.parse(clienteUpdateSchema, input);
    const existing = await this.clienteRepository.findById(id);
    if (!existing) throw new NotFoundError("Cliente não encontrado");

    const cpf = CpfValidator.normalize(data.cpf);
    if (!CpfValidator.isValid(cpf)) throw new ValidationError("CPF inválido");
    if (!EmailValidator.isValid(data.email))
      throw new ValidationError("E-mail inválido");

    if (cpf !== existing.cpf) {
      const cpfExists = await this.clienteRepository.findByCpf(cpf);
      if (cpfExists) throw new ValidationError("CPF já cadastrado");
    }

    if (data.email !== existing.email) {
      const emailExists = await this.clienteRepository.findByEmail(data.email);
      if (emailExists) throw new ValidationError("E-mail já cadastrado");
    }

    const updated = await this.clienteRepository.update(id, {
      nome: data.nome,
      email: data.email,
      cpf,
      telefone: data.telefone ?? null
    });

    if (!updated) throw new NotFoundError("Cliente não encontrado");

    await this.logger.info("Cliente atualizado", { clienteId: id });
    return updated;
  }

  async delete(id: string) {
    const ok = await this.clienteRepository.delete(id);
    if (!ok) throw new NotFoundError("Cliente não encontrado");
    await this.logger.info("Cliente excluído", { clienteId: id });
    return ok;
  }
}

