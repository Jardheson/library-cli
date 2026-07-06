import type { EmprestimoService } from "../services/EmprestimoService";

export class EmprestimoController {
  constructor(private readonly emprestimoService: EmprestimoService) {}

  async registrarEmprestimo(input: unknown) {
    return this.emprestimoService.registrarEmprestimo(input);
  }

  async registrarDevolucao(input: unknown) {
    return this.emprestimoService.registrarDevolucao(input);
  }

  async consultarEmprestimos(page = 1, pageSize = 10) {
    return this.emprestimoService.consultarEmprestimosAtivos(page, pageSize);
  }

  async consultarHistorico(page = 1, pageSize = 10) {
    return this.emprestimoService.consultarHistorico(page, pageSize);
  }
}

