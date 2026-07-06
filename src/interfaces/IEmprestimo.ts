export interface IEmprestimo {
  id: string;
  livroId: string;
  clienteId: string;
  dataEmprestimo: Date;
  dataDevolucao: Date | null;
  devolvido: boolean;
}

