import { db } from "../database/connection";

export type LivroDisponivelReportItem = {
  livroId: string;
  titulo: string;
  autorNome: string;
  quantidade: number;
  disponivel: number;
};

export type LivroEmprestadoReportItem = {
  emprestimoId: string;
  livroId: string;
  titulo: string;
  autorNome: string;
  clienteId: string;
  clienteNome: string;
  dataEmprestimo: Date;
};

export type HistoricoGeralItem = {
  emprestimoId: string;
  clienteNome: string;
  livroTitulo: string;
  autorNome: string;
  dataEmprestimo: Date;
  dataDevolucao: Date | null;
  devolvido: boolean;
};

export type RankingClienteItem = {
  clienteId: string;
  clienteNome: string;
  totalEmprestimos: number;
};

export type RankingAutorItem = {
  autorId: string;
  autorNome: string;
  totalEmprestimos: number;
};

export type RankingLivroItem = {
  livroId: string;
  livroTitulo: string;
  totalEmprestimos: number;
};

export type EstatisticasItem = {
  totalEmprestimos: number;
  mediaEmprestimosPorCliente: number;
  livroMaisEmprestado: RankingLivroItem | null;
  autorMaisPopular: RankingAutorItem | null;
};

type CountRow = { count: string };

export class RelatorioRepository {
  async livrosDisponiveis(): Promise<LivroDisponivelReportItem[]> {
    const res = await db.query<{
      livro_id: string;
      titulo: string;
      autor_nome: string;
      quantidade: number;
      disponivel: number;
    }>(
      `
      SELECT
        l.id AS livro_id,
        l.titulo,
        a.nome AS autor_nome,
        l.quantidade,
        l.disponivel
      FROM livros l
      JOIN autores a ON a.id = l.autor_id
      WHERE l.disponivel > 0
      ORDER BY l.disponivel DESC, l.titulo ASC
      `
    );
    return res.rows.map((r) => ({
      livroId: r.livro_id,
      titulo: r.titulo,
      autorNome: r.autor_nome,
      quantidade: r.quantidade,
      disponivel: r.disponivel
    }));
  }

  async livrosEmprestadosAtivos(): Promise<LivroEmprestadoReportItem[]> {
    const res = await db.query<{
      emprestimo_id: string;
      livro_id: string;
      titulo: string;
      autor_nome: string;
      cliente_id: string;
      cliente_nome: string;
      data_emprestimo: Date;
    }>(
      `
      SELECT
        e.id AS emprestimo_id,
        l.id AS livro_id,
        l.titulo,
        a.nome AS autor_nome,
        c.id AS cliente_id,
        c.nome AS cliente_nome,
        e.data_emprestimo
      FROM emprestimos e
      JOIN livros l ON l.id = e.livro_id
      JOIN autores a ON a.id = l.autor_id
      JOIN clientes c ON c.id = e.cliente_id
      WHERE e.devolvido = FALSE
      ORDER BY e.data_emprestimo DESC
      `
    );
    return res.rows.map((r) => ({
      emprestimoId: r.emprestimo_id,
      livroId: r.livro_id,
      titulo: r.titulo,
      autorNome: r.autor_nome,
      clienteId: r.cliente_id,
      clienteNome: r.cliente_nome,
      dataEmprestimo: r.data_emprestimo
    }));
  }

  async historicoGeral(): Promise<HistoricoGeralItem[]> {
    const res = await db.query<{
      emprestimo_id: string;
      cliente_nome: string;
      livro_titulo: string;
      autor_nome: string;
      data_emprestimo: Date;
      data_devolucao: Date | null;
      devolvido: boolean;
    }>(
      `
      SELECT
        e.id AS emprestimo_id,
        c.nome AS cliente_nome,
        l.titulo AS livro_titulo,
        a.nome AS autor_nome,
        e.data_emprestimo,
        e.data_devolucao,
        e.devolvido
      FROM emprestimos e
      JOIN clientes c ON c.id = e.cliente_id
      JOIN livros l ON l.id = e.livro_id
      JOIN autores a ON a.id = l.autor_id
      ORDER BY e.data_emprestimo DESC
      `
    );
    return res.rows.map((r) => ({
      emprestimoId: r.emprestimo_id,
      clienteNome: r.cliente_nome,
      livroTitulo: r.livro_titulo,
      autorNome: r.autor_nome,
      dataEmprestimo: r.data_emprestimo,
      dataDevolucao: r.data_devolucao,
      devolvido: r.devolvido
    }));
  }

  async clientesComMaisEmprestimos(limit = 10): Promise<RankingClienteItem[]> {
    const res = await db.query<{
      cliente_id: string;
      cliente_nome: string;
      total: string;
    }>(
      `
      SELECT
        c.id AS cliente_id,
        c.nome AS cliente_nome,
        COUNT(e.id)::text AS total
      FROM clientes c
      JOIN emprestimos e ON e.cliente_id = c.id
      GROUP BY c.id, c.nome
      ORDER BY COUNT(e.id) DESC, c.nome ASC
      LIMIT $1
      `,
      [limit]
    );
    return res.rows.map((r) => ({
      clienteId: r.cliente_id,
      clienteNome: r.cliente_nome,
      totalEmprestimos: Number(r.total)
    }));
  }

  async autoresMaisEmprestados(limit = 10): Promise<RankingAutorItem[]> {
    const res = await db.query<{
      autor_id: string;
      autor_nome: string;
      total: string;
    }>(
      `
      SELECT
        a.id AS autor_id,
        a.nome AS autor_nome,
        COUNT(e.id)::text AS total
      FROM autores a
      JOIN livros l ON l.autor_id = a.id
      JOIN emprestimos e ON e.livro_id = l.id
      GROUP BY a.id, a.nome
      ORDER BY COUNT(e.id) DESC, a.nome ASC
      LIMIT $1
      `,
      [limit]
    );
    return res.rows.map((r) => ({
      autorId: r.autor_id,
      autorNome: r.autor_nome,
      totalEmprestimos: Number(r.total)
    }));
  }

  async livrosMaisEmprestados(limit = 10): Promise<RankingLivroItem[]> {
    const res = await db.query<{
      livro_id: string;
      livro_titulo: string;
      total: string;
    }>(
      `
      SELECT
        l.id AS livro_id,
        l.titulo AS livro_titulo,
        COUNT(e.id)::text AS total
      FROM livros l
      JOIN emprestimos e ON e.livro_id = l.id
      GROUP BY l.id, l.titulo
      ORDER BY COUNT(e.id) DESC, l.titulo ASC
      LIMIT $1
      `,
      [limit]
    );
    return res.rows.map((r) => ({
      livroId: r.livro_id,
      livroTitulo: r.livro_titulo,
      totalEmprestimos: Number(r.total)
    }));
  }

  async estatisticas(): Promise<EstatisticasItem> {
    const totalRes = await db.query<CountRow>(
      `SELECT COUNT(*)::text AS count FROM emprestimos`
    );
    const totalEmprestimos = Number(totalRes.rows[0]?.count ?? 0);

    const clientesRes = await db.query<CountRow>(
      `SELECT COUNT(*)::text AS count FROM clientes`
    );
    const totalClientes = Number(clientesRes.rows[0]?.count ?? 0);
    const mediaEmprestimosPorCliente =
      totalClientes === 0 ? 0 : Number((totalEmprestimos / totalClientes).toFixed(2));

    const topLivro = (await this.livrosMaisEmprestados(1))[0] ?? null;
    const topAutor = (await this.autoresMaisEmprestados(1))[0] ?? null;

    return {
      totalEmprestimos,
      mediaEmprestimosPorCliente,
      livroMaisEmprestado: topLivro,
      autorMaisPopular: topAutor
    };
  }
}

