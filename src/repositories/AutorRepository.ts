import { db } from "../database/connection";
import { Autor } from "../models/Autor";
import { Pagination, type PageResult } from "../utils/Pagination";

type AutorRow = {
  id: string;
  nome: string;
  nacionalidade: string | null;
  created_at: Date;
};

export type AutorCreateInput = {
  id: string;
  nome: string;
  nacionalidade: string | null;
};

export type AutorUpdateInput = {
  nome: string;
  nacionalidade: string | null;
};

export class AutorRepository {
  async create(input: AutorCreateInput): Promise<Autor> {
    const res = await db.query<AutorRow>(
      `
      INSERT INTO autores (id, nome, nacionalidade)
      VALUES ($1, $2, $3)
      RETURNING id, nome, nacionalidade, created_at
      `,
      [input.id, input.nome, input.nacionalidade]
    );
    return this.map(res.rows[0]);
  }

  async findById(id: string): Promise<Autor | null> {
    const res = await db.query<AutorRow>(
      `SELECT id, nome, nacionalidade, created_at FROM autores WHERE id = $1`,
      [id]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async list(page = 1, pageSize = 10): Promise<PageResult<Autor>> {
    const req = Pagination.normalize({ page, pageSize });
    const total = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM autores`
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);
    const res = await db.query<AutorRow>(
      `
      SELECT id, nome, nacionalidade, created_at
      FROM autores
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [req.pageSize, Pagination.offset(req.page, req.pageSize)]
    );
    const items = res.rows.map((r) => this.map(r));
    return Pagination.buildResult(items, req.page, req.pageSize, totalItems);
  }

  async searchByName(
    term: string,
    page = 1,
    pageSize = 10
  ): Promise<PageResult<Autor>> {
    const req = Pagination.normalize({ page, pageSize });
    const sanitized = term.trim();
    const like = `%${sanitized}%`;

    const total = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM autores WHERE nome ILIKE $1`,
      [like]
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);

    const res = await db.query<AutorRow>(
      `
      SELECT id, nome, nacionalidade, created_at
      FROM autores
      WHERE nome ILIKE $1
      ORDER BY nome ASC
      LIMIT $2 OFFSET $3
      `,
      [like, req.pageSize, Pagination.offset(req.page, req.pageSize)]
    );

    const items = res.rows.map((r) => this.map(r));
    return Pagination.buildResult(items, req.page, req.pageSize, totalItems);
  }

  async update(id: string, input: AutorUpdateInput): Promise<Autor | null> {
    const res = await db.query<AutorRow>(
      `
      UPDATE autores
      SET nome = $2, nacionalidade = $3
      WHERE id = $1
      RETURNING id, nome, nacionalidade, created_at
      `,
      [id, input.nome, input.nacionalidade]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query<{ id: string }>(
      `DELETE FROM autores WHERE id = $1 RETURNING id`,
      [id]
    );
    return Boolean(res.rows[0]);
  }

  async count(): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM autores`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  private map(row: AutorRow): Autor {
    return new Autor(row.id, row.nome, row.nacionalidade, row.created_at);
  }
}

