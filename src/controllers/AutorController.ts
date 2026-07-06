import type { AutorService } from "../services/AutorService";

export class AutorController {
  constructor(private readonly autorService: AutorService) {}

  async cadastrar(input: unknown) {
    return this.autorService.create(input);
  }

  async listar(page = 1, pageSize = 10) {
    return this.autorService.list(page, pageSize);
  }

  async buscarPorId(id: string) {
    return this.autorService.findById(id);
  }

  async buscarPorNome(term: string, page = 1, pageSize = 10) {
    return this.autorService.searchByName(term, page, pageSize);
  }

  async atualizar(id: string, input: unknown) {
    return this.autorService.update(id, input);
  }

  async excluir(id: string) {
    return this.autorService.delete(id);
  }
}

