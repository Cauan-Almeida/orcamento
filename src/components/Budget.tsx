import { useState } from 'react';
import { ItemOrcamento } from '../types';
import BudgetItemForm from './BudgetItemForm';
import BudgetItemList from './BudgetItemList';

interface BudgetProps {
  itens: ItemOrcamento[];
  observacoes: string;
  onItensChange: (itens: ItemOrcamento[]) => void;
  onObservacoesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Budget: React.FC<BudgetProps> = ({ 
  itens, 
  observacoes, 
  onItensChange, 
  onObservacoesChange 
}) => {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleAddItem = (item: ItemOrcamento) => {
    onItensChange([...itens, item]);
  };

  const handleUpdateItem = (index: number, item: ItemOrcamento) => {
    const novosItens = [...itens];
    novosItens[index] = item;
    onItensChange(novosItens);
    setEditingItemIndex(null);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    if (window.confirm('Tem certeza que deseja remover este item?')) {
      const novosItens = [...itens];
      novosItens.splice(index, 1);
      onItensChange(novosItens);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemIndex(null);
  };

  // Calcular total do orçamento
  const total = itens.reduce((sum, item) => {
    return sum + (item.quantidade * item.precoUnitario);
  }, 0);

  // Formatar valor como moeda brasileira
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="budget-container card">
      <h3>Itens do Orçamento</h3>
      
      <BudgetItemForm 
        onSubmit={handleAddItem}
        editingItem={editingItemIndex !== null ? itens[editingItemIndex] : undefined}
        onUpdate={editingItemIndex !== null ? (item) => handleUpdateItem(editingItemIndex, item) : undefined}
        onCancel={handleCancelEdit}
      />

      <div className="budget-items">
        <BudgetItemList 
          itens={itens} 
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
      </div>

      {itens.length > 0 && (
        <div className="budget-total">
          Total: {formatarMoeda(total)}
        </div>
      )}

      <div className="observacoes-field">
        <label htmlFor="observacoes">Observações:</label>
        <textarea
          id="observacoes"
          value={observacoes}
          onChange={onObservacoesChange}
          placeholder="Adicione informações adicionais, condições de pagamento, prazo de entrega, etc."
          className="form-input"
        />
      </div>
    </div>
  );
};

export default Budget; 