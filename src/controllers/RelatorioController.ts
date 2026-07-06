import type { RelatorioService } from "../services/RelatorioService";

export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  async dashboard() {
    return this.relatorioService.dashboard();
  }

  async livrosDisponiveis() {
    return this.relatorioService.livrosDisponiveis();
  }

  async livrosEmprestadosAtivos() {
    return this.relatorioService.livrosEmprestadosAtivos();
  }

  async historicoGeral() {
    return this.relatorioService.historicoGeral();
  }

  async clientesComMaisEmprestimos(limit = 10) {
    return this.relatorioService.clientesComMaisEmprestimos(limit);
  }

  async autoresMaisEmprestados(limit = 10) {
    return this.relatorioService.autoresMaisEmprestados(limit);
  }

  async livrosMaisEmprestados(limit = 10) {
    return this.relatorioService.livrosMaisEmprestados(limit);
  }

  async estatisticas() {
    return this.relatorioService.estatisticas();
  }

  async exportLivrosDisponiveis(filePath?: string) {
    const items = await this.relatorioService.livrosDisponiveis();
    return this.relatorioService.exportLivrosDisponiveis(items, filePath);
  }

  async exportLivrosEmprestados(filePath?: string) {
    const items = await this.relatorioService.livrosEmprestadosAtivos();
    return this.relatorioService.exportLivrosEmprestados(items, filePath);
  }

  async exportHistoricoGeral(filePath?: string) {
    const items = await this.relatorioService.historicoGeral();
    return this.relatorioService.exportHistoricoGeral(items, filePath);
  }

  async exportRankingClientes(filePath?: string, limit = 10) {
    const items = await this.relatorioService.clientesComMaisEmprestimos(limit);
    return this.relatorioService.exportRankingClientes(items, filePath);
  }

  async exportRankingAutores(filePath?: string, limit = 10) {
    const items = await this.relatorioService.autoresMaisEmprestados(limit);
    return this.relatorioService.exportRankingAutores(items, filePath);
  }

  async exportRankingLivros(filePath?: string, limit = 10) {
    const items = await this.relatorioService.livrosMaisEmprestados(limit);
    return this.relatorioService.exportRankingLivros(items, filePath);
  }
}

