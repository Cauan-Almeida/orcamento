export interface Cliente {
  nome: string;
  telefone?: string;
  email?: string;
  whatsapp?: string;
}

export interface Empresa {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface ItemOrcamento {
  id: string;
  descricao: string;
  detalhes?: string;
  quantidade: number;
  precoUnitario: number;
  valorUnitario?: number;
}

export interface Orcamento {
  id: string;
  firestoreId?: string;
  numero?: string;
  numeroOrcamento?: string;
  cliente: Cliente;
  itens: ItemOrcamento[];
  observacoes?: string;
  data: Date | string;
  empresa?: Empresa;
  status?: 'Pendente' | 'Enviado' | 'Aprovado' | 'Recusado';
  dataCriacao?: Date;
  valorTotal?: number;
  valor?: number;
} 