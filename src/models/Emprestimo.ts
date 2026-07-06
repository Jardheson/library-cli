import type { IEmprestimo } from "../interfaces/IEmprestimo";

export class Emprestimo implements IEmprestimo {
  constructor(
    public id: string,
    public livroId: string,
    public clienteId: string,
    public dataEmprestimo: Date,
    public dataDevolucao: Date | null,
    public devolvido: boolean
  ) {}
}

