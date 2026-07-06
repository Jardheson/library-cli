import type { ClienteService } from "../services/ClienteService";

export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  async cadastrar(input: unknown) {
    return this.clienteService.create(input);
  }

  async listar(page = 1, pageSize = 10) {
    return this.clienteService.list(page, pageSize);
  }

  async buscarPorId(id: string) {
    return this.clienteService.findById(id);
  }

  async buscarPorNome(term: string, page = 1, pageSize = 10) {
    return this.clienteService.searchByName(term, page, pageSize);
  }

  async atualizar(id: string, input: unknown) {
    return this.clienteService.update(id, input);
  }

  async excluir(id: string) {
    return this.clienteService.delete(id);
  }
}

