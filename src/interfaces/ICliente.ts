export interface ICliente {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
  createdAt: Date;
}

