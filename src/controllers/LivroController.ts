import type { LivroService } from "../services/LivroService";

export class LivroController {
  constructor(private readonly livroService: LivroService) {}

  async cadastrar(input: unknown) {
    return this.livroService.create(input);
  }

  async listar(page = 1, pageSize = 10) {
    return this.livroService.list(page, pageSize);
  }

  async buscarPorId(id: string) {
    return this.livroService.findById(id);
  }

  async buscarPorNome(term: string, page = 1, pageSize = 10) {
    return this.livroService.searchByTitle(term, page, pageSize);
  }

  async atualizar(id: string, input: unknown) {
    return this.livroService.update(id, input);
  }

  async excluir(id: string) {
    return this.livroService.delete(id);
  }
}

