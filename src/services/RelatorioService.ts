import path from "node:path";
import { AutorRepository } from "../repositories/AutorRepository";
import { ClienteRepository } from "../repositories/ClienteRepository";
import { EmprestimoRepository } from "../repositories/EmprestimoRepository";
import { LivroRepository } from "../repositories/LivroRepository";
import {
  RelatorioRepository,
  type EstatisticasItem,
  type HistoricoGeralItem,
  type LivroDisponivelReportItem,
  type LivroEmprestadoReportItem,
  type RankingAutorItem,
  type RankingClienteItem,
  type RankingLivroItem
} from "../repositories/RelatorioRepository";
import { CsvExporter } from "../utils/CsvExporter";
import { Formatter } from "../utils/Formatter";
import { StatusEmprestimo } from "../enums/StatusEmprestimo";

export type DashboardData = {
  totalAutores: number;
  totalLivros: number;
  totalClientes: number;
  livrosDisponiveis: number;
  livrosEmprestados: number;
  emprestimosAtivos: number;
};

export class RelatorioService {
  constructor(
    private readonly relatorioRepository: RelatorioRepository,
    private readonly autorRepository: AutorRepository,
    private readonly livroRepository: LivroRepository,
    private readonly clienteRepository: ClienteRepository,
    private readonly emprestimoRepository: EmprestimoRepository
  ) {}

  async dashboard(): Promise<DashboardData> {
    const [
      totalAutores,
      totalLivros,
      totalClientes,
      livrosDisponiveis,
      emprestimosAtivos
    ] = await Promise.all([
      this.autorRepository.count(),
      this.livroRepository.count(),
      this.clienteRepository.count(),
      this.livroRepository.countDisponiveis(),
      this.emprestimoRepository.countAtivos()
    ]);

    return {
      totalAutores,
      totalLivros,
      totalClientes,
      livrosDisponiveis,
      livrosEmprestados: emprestimosAtivos,
      emprestimosAtivos
    };
  }

  async livrosDisponiveis(): Promise<LivroDisponivelReportItem[]> {
    return this.relatorioRepository.livrosDisponiveis();
  }

  async livrosEmprestadosAtivos(): Promise<LivroEmprestadoReportItem[]> {
    return this.relatorioRepository.livrosEmprestadosAtivos();
  }

  async historicoGeral(): Promise<Array<HistoricoGeralItem & { status: StatusEmprestimo }>> {
    const data = await this.relatorioRepository.historicoGeral();
    return data.map((i) => ({
      ...i,
      status: i.devolvido ? StatusEmprestimo.DEVOLVIDO : StatusEmprestimo.ATIVO
    }));
  }

  async clientesComMaisEmprestimos(limit = 10): Promise<RankingClienteItem[]> {
    return this.relatorioRepository.clientesComMaisEmprestimos(limit);
  }

  async autoresMaisEmprestados(limit = 10): Promise<RankingAutorItem[]> {
    return this.relatorioRepository.autoresMaisEmprestados(limit);
  }

  async livrosMaisEmprestados(limit = 10): Promise<RankingLivroItem[]> {
    return this.relatorioRepository.livrosMaisEmprestados(limit);
  }

  async estatisticas(): Promise<EstatisticasItem> {
    return this.relatorioRepository.estatisticas();
  }

  async exportLivrosDisponiveis(
    items: LivroDisponivelReportItem[],
    filePath?: string
  ): Promise<string> {
    const target = filePath ?? path.resolve(process.cwd(), "exports", "livros_disponiveis.csv");
    return CsvExporter.writeFile(
      target,
      ["LivroId", "Título", "Autor", "Quantidade", "Disponível"],
      items.map((i) => [i.livroId, i.titulo, i.autorNome, i.quantidade, i.disponivel])
    );
  }

  async exportLivrosEmprestados(
    items: LivroEmprestadoReportItem[],
    filePath?: string
  ): Promise<string> {
    const target = filePath ?? path.resolve(process.cwd(), "exports", "livros_emprestados.csv");
    return CsvExporter.writeFile(
      target,
      ["EmprestimoId", "LivroId", "Título", "Autor", "ClienteId", "Cliente", "DataEmpréstimo"],
      items.map((i) => [
        i.emprestimoId,
        i.livroId,
        i.titulo,
        i.autorNome,
        i.clienteId,
        i.clienteNome,
        Formatter.date(i.dataEmprestimo)
      ])
    );
  }

  async exportHistoricoGeral(
    items: Array<HistoricoGeralItem & { status: StatusEmprestimo }>,
    filePath?: string
  ): Promise<string> {
    const target = filePath ?? path.resolve(process.cwd(), "exports", "historico_geral.csv");
    return CsvExporter.writeFile(
      target,
      ["EmprestimoId", "Cliente", "Livro", "Autor", "DataEmpréstimo", "DataDevolução", "Status"],
      items.map((i) => [
        i.emprestimoId,
        i.clienteNome,
        i.livroTitulo,
        i.autorNome,
        Formatter.date(i.dataEmprestimo),
        Formatter.date(i.dataDevolucao),
        i.status
      ])
    );
  }

  async exportRankingClientes(items: RankingClienteItem[], filePath?: string): Promise<string> {
    const target = filePath ?? path.resolve(process.cwd(), "exports", "clientes_mais_emprestimos.csv");
    return CsvExporter.writeFile(
      target,
      ["ClienteId", "Cliente", "TotalEmpréstimos"],
      items.map((i) => [i.clienteId, i.clienteNome, i.totalEmprestimos])
    );
  }

  async exportRankingAutores(items: RankingAutorItem[], filePath?: string): Promise<string> {
    const target = filePath ?? path.resolve(process.cwd(), "exports", "autores_mais_emprestados.csv");
    return CsvExporter.writeFile(
      target,
      ["AutorId", "Autor", "TotalEmpréstimos"],
      items.map((i) => [i.autorId, i.autorNome, i.totalEmprestimos])
    );
  }

  async exportRankingLivros(items: RankingLivroItem[], filePath?: string): Promise<string> {
    const target = filePath ?? path.resolve(process.cwd(), "exports", "livros_mais_emprestados.csv");
    return CsvExporter.writeFile(
      target,
      ["LivroId", "Livro", "TotalEmpréstimos"],
      items.map((i) => [i.livroId, i.livroTitulo, i.totalEmprestimos])
    );
  }
}

