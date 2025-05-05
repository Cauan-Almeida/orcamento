import { useState, useEffect } from 'react';
import { ItemOrcamento } from '../types';
import InputMoeda from './InputMoeda';

interface BudgetItemFormProps {
  onSubmit: (item: ItemOrcamento) => void;
  editingItem?: ItemOrcamento;
  onUpdate?: (item: ItemOrcamento) => void;
  onCancel?: () => void;
}

const BudgetItemForm: React.FC<BudgetItemFormProps> = ({ 
  onSubmit, 
  editingItem,
  onUpdate,
  onCancel
}) => {
  const [descricao, setDescricao] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setDescricao(editingItem.descricao);
      setDetalhes(editingItem.detalhes || '');
      setQuantidade(editingItem.quantidade);
      setPrecoUnitario(editingItem.precoUnitario);
      setIsEditing(true);
    } else {
      resetForm();
      setIsEditing(false);
    }
  }, [editingItem]);

  const resetForm = () => {
    setDescricao('');
    setDetalhes('');
    setQuantidade(1);
    setPrecoUnitario(0);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!descricao.trim()) {
      newErrors.descricao = 'A descrição é obrigatória';
    }
    
    if (quantidade <= 0) {
      newErrors.quantidade = 'A quantidade deve ser maior que zero';
    }
    
    if (precoUnitario <= 0) {
      newErrors.precoUnitario = 'O preço unitário deve ser maior que zero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const item: ItemOrcamento = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 8),
        descricao: descricao.trim(),
        detalhes: detalhes.trim() || undefined,
        quantidade,
        precoUnitario
      };
      
      if (isEditing && onUpdate) {
        onUpdate(item);
      } else {
        onSubmit(item);
        resetForm();
      }
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setQuantidade(isNaN(value) ? 0 : value);
  };

  return (
    <form onSubmit={handleSubmit} className="item-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="descricao">Descrição *</label>
          <input
            id="descricao"
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`form-input ${errors.descricao ? 'input-error' : ''}`}
            placeholder="Descrição do item ou serviço"
          />
          {errors.descricao && <div className="error-message">{errors.descricao}</div>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="detalhes">Detalhes (opcional)</label>
          <input
            id="detalhes"
            type="text"
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            className="form-input"
            placeholder="Detalhes adicionais, especificações, etc."
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantidade">Quantidade *</label>
          <input
            id="quantidade"
            type="number"
            min="1"
            value={quantidade}
            onChange={handleQuantidadeChange}
            className={`form-input ${errors.quantidade ? 'input-error' : ''}`}
          />
          {errors.quantidade && <div className="error-message">{errors.quantidade}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="precoUnitario">Preço Unitário *</label>
          <InputMoeda
            value={precoUnitario}
            onChange={setPrecoUnitario}
            placeholder="0,00"
          />
          {errors.precoUnitario && <div className="error-message">{errors.precoUnitario}</div>}
          <div className="help-text">Formato: R$ 0,00</div>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Atualizar Item' : 'Adicionar Item'}
        </button>
        {isEditing && (
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleCancelEdit}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default BudgetItemForm; 