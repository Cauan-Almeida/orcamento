import { ItemOrcamento } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

interface BudgetItemListProps {
  itens: ItemOrcamento[];
  onEditItem: (index: number) => void;
  onDeleteItem: (index: number) => void;
}

const BudgetItemList: React.FC<BudgetItemListProps> = ({ 
  itens, 
  onEditItem, 
  onDeleteItem 
}) => {
  // Formatar valor como moeda brasileira
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (itens.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        Nenhum item adicionado ao orçamento ainda.
      </div>
    );
  }

  return (
    <ul className="item-list">
      {itens.map((item, index) => (
        <li key={index} className="budget-item">
          <div className="budget-item-actions">
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={() => onEditItem(index)}
              title="Editar item"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button 
              className="btn btn-sm btn-danger" 
              onClick={() => onDeleteItem(index)}
              title="Remover item"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          
          <div className="budget-item-content">
            <div className="budget-item-description">
              <strong>{item.descricao}</strong>
              {item.detalhes && <div className="item-details">{item.detalhes}</div>}
            </div>
            <div className="budget-item-quantity">
              <span className="label">Qtd:</span> <span className="quantity-value">{item.quantidade}</span>
            </div>
            <div className="budget-item-price">
              <span className="label">Valor Unit.:</span> <span className="price-value">{formatarMoeda(item.precoUnitario)}</span>
            </div>
            <div className="budget-item-total">
              {formatarMoeda(item.quantidade * item.precoUnitario)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default BudgetItemList; 