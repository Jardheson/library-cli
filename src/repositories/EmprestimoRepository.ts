import { db } from "../database/connection";
import { Emprestimo } from "../models/Emprestimo";
import { Pagination, type PageResult } from "../utils/Pagination";
import type { QueryResult, QueryResultRow } from "pg";

type EmprestimoRow = {
  id: string;
  livro_id: string;
  cliente_id: string;
  data_emprestimo: Date;
  data_devolucao: Date | null;
  devolvido: boolean;
};

export type EmprestimoCreateInput = {
  id: string;
  livroId: string;
  clienteId: string;
  dataEmprestimo: Date;
};

export type EmprestimoDetalhado = {
  id: string;
  livroId: string;
  livroTitulo: string;
  autorNome: string;
  clienteId: string;
  clienteNome: string;
  dataEmprestimo: Date;
  dataDevolucao: Date | null;
  devolvido: boolean;
};

type EmprestimoDetalhadoRow = {
  id: string;
  livro_id: string;
  livro_titulo: string;
  autor_nome: string;
  cliente_id: string;
  cliente_nome: string;
  data_emprestimo: Date;
  data_devolucao: Date | null;
  devolvido: boolean;
};

export class EmprestimoRepository {
  async create(
    input: EmprestimoCreateInput,
    executor?: {
      query: <T extends QueryResultRow>(
        text: string,
        params?: unknown[]
      ) => Promise<QueryResult<T>>;
    }
  ): Promise<Emprestimo> {
    const q = executor?.query ? executor.query.bind(executor) : db.query;
    const res = await q<EmprestimoRow>(
      `
      INSERT INTO emprestimos (id, livro_id, cliente_id, data_emprestimo, devolvido)
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING id, livro_id, cliente_id, data_emprestimo, data_devolucao, devolvido
      `,
      [input.id, input.livroId, input.clienteId, input.dataEmprestimo]
    );
    return this.map(res.rows[0]);
  }

  async findById(id: string): Promise<Emprestimo | null> {
    const res = await db.query<EmprestimoRow>(
      `
      SELECT id, livro_id, cliente_id, data_emprestimo, data_devolucao, devolvido
      FROM emprestimos
      WHERE id = $1
      `,
      [id]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async findActiveById(id: string): Promise<Emprestimo | null> {
    const res = await db.query<EmprestimoRow>(
      `
      SELECT id, livro_id, cliente_id, data_emprestimo, data_devolucao, devolvido
      FROM emprestimos
      WHERE id = $1 AND devolvido = FALSE
      `,
      [id]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async markReturned(
    id: string,
    returnedAt: Date,
    executor?: {
      query: <T extends QueryResultRow>(
        text: string,
        params?: unknown[]
      ) => Promise<QueryResult<T>>;
    }
  ): Promise<boolean> {
    const q = executor?.query ? executor.query.bind(executor) : db.query;
    const res = await q<{ id: string }>(
      `
      UPDATE emprestimos
      SET devolvido = TRUE, data_devolucao = $2
      WHERE id = $1 AND devolvido = FALSE
      RETURNING id
      `,
      [id, returnedAt]
    );
    return Boolean(res.rows[0]);
  }

  async list(
    devolvido: boolean | null,
    page = 1,
    pageSize = 10
  ): Promise<PageResult<EmprestimoDetalhado>> {
    const req = Pagination.normalize({ page, pageSize });

    const filterSql =
      devolvido === null ? "" : `WHERE e.devolvido = ${devolvido ? "TRUE" : "FALSE"}`;

    const total = await db.query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM emprestimos e
      ${filterSql}
      `
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);

    const res = await db.query<EmprestimoDetalhadoRow>(
      `
      SELECT
        e.id,
        e.livro_id,
        l.titulo AS livro_titulo,
        a.nome AS autor_nome,
        e.cliente_id,
        c.nome AS cliente_nome,
        e.data_emprestimo,
        e.data_devolucao,
        e.devolvido
      FROM emprestimos e
      JOIN livros l ON l.id = e.livro_id
      JOIN autores a ON a.id = l.autor_id
      JOIN clientes c ON c.id = e.cliente_id
      ${filterSql}
      ORDER BY e.data_emprestimo DESC
      LIMIT $1 OFFSET $2
      `,
      [req.pageSize, Pagination.offset(req.page, req.pageSize)]
    );

    const items = res.rows.map((r) => this.mapDetalhado(r));
    return Pagination.buildResult(items, req.page, req.pageSize, totalItems);
  }

  async count(): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM emprestimos`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  async countAtivos(): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM emprestimos WHERE devolvido = FALSE`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  private map(row: EmprestimoRow): Emprestimo {
    return new Emprestimo(
      row.id,
      row.livro_id,
      row.cliente_id,
      row.data_emprestimo,
      row.data_devolucao,
      row.devolvido
    );
  }

  private mapDetalhado(row: EmprestimoDetalhadoRow): EmprestimoDetalhado {
    return {
      id: row.id,
      livroId: row.livro_id,
      livroTitulo: row.livro_titulo,
      autorNome: row.autor_nome,
      clienteId: row.cliente_id,
      clienteNome: row.cliente_nome,
      dataEmprestimo: row.data_emprestimo,
      dataDevolucao: row.data_devolucao,
      devolvido: row.devolvido
    };
  }
}
