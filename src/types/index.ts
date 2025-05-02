// Removido export * from '../types' para evitar conflito

// Definição do tipo Item (ajuste conforme necessário)
export interface Item {
  id: string;
  descricao: string;
  detalhes?: string;
  quantidade: number;
  precoUnitario: number;
}

// Adicione whatsapp ao tipo Cliente (se não existir)
export interface Cliente {
  nome: string;
  telefone?: string;
  email?: string;
  whatsapp?: string;
} 