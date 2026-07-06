import { db } from "../database/connection";
import { Livro } from "../models/Livro";
import { Pagination, type PageResult } from "../utils/Pagination";
import type { QueryResult, QueryResultRow } from "pg";

type LivroRow = {
  id: string;
  titulo: string;
  autor_id: string;
  quantidade: number;
  disponivel: number;
  created_at: Date;
};

export type LivroCreateInput = {
  id: string;
  titulo: string;
  autorId: string;
  quantidade: number;
};

export type LivroUpdateInput = {
  titulo: string;
  autorId: string;
  quantidade: number;
};

export class LivroRepository {
  async create(input: LivroCreateInput): Promise<Livro> {
    const res = await db.query<LivroRow>(
      `
      INSERT INTO livros (id, titulo, autor_id, quantidade, disponivel)
      VALUES ($1, $2, $3, $4, $4)
      RETURNING id, titulo, autor_id, quantidade, disponivel, created_at
      `,
      [input.id, input.titulo, input.autorId, input.quantidade]
    );
    return this.map(res.rows[0]);
  }

  async findById(id: string): Promise<Livro | null> {
    const res = await db.query<LivroRow>(
      `
      SELECT id, titulo, autor_id, quantidade, disponivel, created_at
      FROM livros
      WHERE id = $1
      `,
      [id]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async list(page = 1, pageSize = 10): Promise<PageResult<Livro>> {
    const req = Pagination.normalize({ page, pageSize });
    const total = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM livros`
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);
    const res = await db.query<LivroRow>(
      `
      SELECT id, titulo, autor_id, quantidade, disponivel, created_at
      FROM livros
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [req.pageSize, Pagination.offset(req.page, req.pageSize)]
    );
    return Pagination.buildResult(
      res.rows.map((r) => this.map(r)),
      req.page,
      req.pageSize,
      totalItems
    );
  }

  async searchByTitle(
    term: string,
    page = 1,
    pageSize = 10
  ): Promise<PageResult<Livro>> {
    const req = Pagination.normalize({ page, pageSize });
    const sanitized = term.trim();
    const like = `%${sanitized}%`;
    const total = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM livros WHERE titulo ILIKE $1`,
      [like]
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);
    const res = await db.query<LivroRow>(
      `
      SELECT id, titulo, autor_id, quantidade, disponivel, created_at
      FROM livros
      WHERE titulo ILIKE $1
      ORDER BY titulo ASC
      LIMIT $2 OFFSET $3
      `,
      [like, req.pageSize, Pagination.offset(req.page, req.pageSize)]
    );
    return Pagination.buildResult(
      res.rows.map((r) => this.map(r)),
      req.page,
      req.pageSize,
      totalItems
    );
  }

  async update(id: string, input: LivroUpdateInput): Promise<Livro | null> {
    const existingRes = await db.query<Pick<LivroRow, "quantidade" | "disponivel">>(
      `SELECT quantidade, disponivel FROM livros WHERE id = $1`,
      [id]
    );
    const existing = existingRes.rows[0];
    if (!existing) return null;

    const borrowed = existing.quantidade - existing.disponivel;
    if (borrowed > input.quantidade) {
      return null;
    }
    const newDisponivel = input.quantidade - borrowed;

    const res = await db.query<LivroRow>(
      `
      UPDATE livros
      SET titulo = $2, autor_id = $3, quantidade = $4, disponivel = $5
      WHERE id = $1
      RETURNING id, titulo, autor_id, quantidade, disponivel, created_at
      `,
      [id, input.titulo, input.autorId, input.quantidade, newDisponivel]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query<{ id: string }>(
      `DELETE FROM livros WHERE id = $1 RETURNING id`,
      [id]
    );
    return Boolean(res.rows[0]);
  }

  async decrementDisponivel(
    id: string,
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
      UPDATE livros
      SET disponivel = disponivel - 1
      WHERE id = $1 AND disponivel > 0
      RETURNING id
      `,
      [id]
    );
    return Boolean(res.rows[0]);
  }

  async incrementDisponivel(
    id: string,
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
      UPDATE livros
      SET disponivel = LEAST(quantidade, disponivel + 1)
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );
    return Boolean(res.rows[0]);
  }

  async count(): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM livros`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  async countDisponiveis(): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM livros WHERE disponivel > 0`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  private map(row: LivroRow): Livro {
    return new Livro(
      row.id,
      row.titulo,
      row.autor_id,
      row.quantidade,
      row.disponivel,
      row.created_at
    );
  }
}
