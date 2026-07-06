import type { ILivro } from "../interfaces/ILivro";

export class Livro implements ILivro {
  constructor(
    public id: string,
    public titulo: string,
    public autorId: string,
    public quantidade: number,
    public disponivel: number,
    public createdAt: Date
  ) {}
}

