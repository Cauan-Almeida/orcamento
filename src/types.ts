export interface Cliente {
  nome: string;
  telefone?: string;
  email?: string;
}

export interface Empresa {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface ItemOrcamento {
  descricao: string;
  detalhes?: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Orcamento {
  id: string;
  numeroOrcamento?: string;
  cliente: Cliente;
  itens: ItemOrcamento[];
  observacoes?: string;
  data: Date | string;
  empresa?: Empresa;
} 