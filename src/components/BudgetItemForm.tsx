import { useState } from 'react';
import { Item, ItemTipo } from '../types';
import { v4 as uuidv4 } from 'uuid';

type BudgetItemFormProps = {
  onAddItem: (item: Item) => void;
};

const BudgetItemForm = ({ onAddItem }: BudgetItemFormProps) => {
  const [tipo, setTipo] = useState<ItemTipo>('Produto');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState<string>('');

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permitir apenas números, vírgula ou ponto
    if (/^(\d+)?([\.,]\d{0,2})?$/.test(value) || value === '') {
      setPrecoUnitario(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter o preço com vírgula para formato numérico
    const precoNumerico = Number(precoUnitario.replace(',', '.'));
    
    const novoItem: Item = {
      id: uuidv4(),
      tipo,
      descricao,
      quantidade,
      precoUnitario: precoNumerico
    };
    
    onAddItem(novoItem);
    
    // Resetar formulário
    setDescricao('');
    setQuantidade(1);
    setPrecoUnitario('');
  };

  const precoValido = precoUnitario !== '' && Number(precoUnitario.replace(',', '.')) > 0;

  return (
    <div className="card">
      <h3 className="mb-4">Adicionar Item</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 grid-cols-3 mb-4">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ItemTipo)}
            >
              <option value="Produto">Produto</option>
              <option value="Serviço">Serviço</option>
            </select>
          </div>
          
          <div className="col-span-2 form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text"
              className="form-input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Serviço de design, Produto X, etc."
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 grid-cols-2 mb-4">
          <div className="form-group">
            <label className="form-label">Quantidade</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Preço Unitário (R$)</label>
            <div className="preco-input-container">
              <div className="preco-prefix">R$</div>
              <input
                type="text"
                className="form-input preco-input"
                value={precoUnitario}
                onChange={handlePrecoChange}
                placeholder="0,00"
                required
              />
            </div>
            <small className="block mt-1 text-gray-500">Use vírgula ou ponto para decimais</small>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!descricao || quantidade < 1 || !precoValido}
          >
            Adicionar Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetItemForm; 