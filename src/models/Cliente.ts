import type { ICliente } from "../interfaces/ICliente";

export class Cliente implements ICliente {
  constructor(
    public id: string,
    public nome: string,
    public email: string,
    public cpf: string,
    public telefone: string | null,
    public createdAt: Date
  ) {}
}

