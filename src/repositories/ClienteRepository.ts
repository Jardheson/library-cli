import { db } from "../database/connection";
import { Cliente } from "../models/Cliente";
import { Pagination, type PageResult } from "../utils/Pagination";

type ClienteRow = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
  created_at: Date;
};

export type ClienteCreateInput = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
};

export type ClienteUpdateInput = {
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
};

export class ClienteRepository {
  async create(input: ClienteCreateInput): Promise<Cliente> {
    const res = await db.query<ClienteRow>(
      `
      INSERT INTO clientes (id, nome, email, cpf, telefone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nome, email, cpf, telefone, created_at
      `,
      [input.id, input.nome, input.email, input.cpf, input.telefone]
    );
    return this.map(res.rows[0]);
  }

  async findById(id: string): Promise<Cliente | null> {
    const res = await db.query<ClienteRow>(
      `
      SELECT id, nome, email, cpf, telefone, created_at
      FROM clientes
      WHERE id = $1
      `,
      [id]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async findByCpf(cpf: string): Promise<Cliente | null> {
    const res = await db.query<ClienteRow>(
      `
      SELECT id, nome, email, cpf, telefone, created_at
      FROM clientes
      WHERE cpf = $1
      `,
      [cpf]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<Cliente | null> {
    const res = await db.query<ClienteRow>(
      `
      SELECT id, nome, email, cpf, telefone, created_at
      FROM clientes
      WHERE email = $1
      `,
      [email]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async list(page = 1, pageSize = 10): Promise<PageResult<Cliente>> {
    const req = Pagination.normalize({ page, pageSize });
    const total = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM clientes`
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);
    const res = await db.query<ClienteRow>(
      `
      SELECT id, nome, email, cpf, telefone, created_at
      FROM clientes
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

  async searchByName(
    term: string,
    page = 1,
    pageSize = 10
  ): Promise<PageResult<Cliente>> {
    const req = Pagination.normalize({ page, pageSize });
    const sanitized = term.trim();
    const like = `%${sanitized}%`;
    const total = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM clientes WHERE nome ILIKE $1`,
      [like]
    );
    const totalItems = Number(total.rows[0]?.count ?? 0);
    const res = await db.query<ClienteRow>(
      `
      SELECT id, nome, email, cpf, telefone, created_at
      FROM clientes
      WHERE nome ILIKE $1
      ORDER BY nome ASC
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

  async update(id: string, input: ClienteUpdateInput): Promise<Cliente | null> {
    const res = await db.query<ClienteRow>(
      `
      UPDATE clientes
      SET nome = $2, email = $3, cpf = $4, telefone = $5
      WHERE id = $1
      RETURNING id, nome, email, cpf, telefone, created_at
      `,
      [id, input.nome, input.email, input.cpf, input.telefone]
    );
    return res.rows[0] ? this.map(res.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await db.query<{ id: string }>(
      `DELETE FROM clientes WHERE id = $1 RETURNING id`,
      [id]
    );
    return Boolean(res.rows[0]);
  }

  async count(): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM clientes`
    );
    return Number(res.rows[0]?.count ?? 0);
  }

  private map(row: ClienteRow): Cliente {
    return new Cliente(
      row.id,
      row.nome,
      row.email,
      row.cpf,
      row.telefone,
      row.created_at
    );
  }
}

