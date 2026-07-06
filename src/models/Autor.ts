import type { IAutor } from "../interfaces/IAutor";

export class Autor implements IAutor {
  constructor(
    public id: string,
    public nome: string,
    public nacionalidade: string | null,
    public createdAt: Date
  ) {}
}

