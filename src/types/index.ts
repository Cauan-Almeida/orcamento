export type Cliente = {
  nome: string;
  whatsapp?: string;
  email?: string;
};

export type ItemTipo = 'Produto' | 'Serviço';

export type Item = {
  id: string;
  tipo: ItemTipo;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
};

export type Empresa = {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
};

export type Orcamento = {
  id: string;
  cliente: Cliente;
  itens: Item[];
  observacoes: string;
  data: Date;
  empresa: Empresa;
}; 