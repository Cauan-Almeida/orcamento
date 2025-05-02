import { useState, useEffect } from 'react';
import { Orcamento } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

interface BudgetHistoryProps {
  onSelectBudget?: (orcamento: Orcamento) => void;
  onClose?: () => void;
}

const BudgetHistory: React.FC<BudgetHistoryProps> = ({ onSelectBudget, onClose }) => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    // Carregar orçamentos do localStorage
    const savedOrcamentos = localStorage.getItem('orcamentos');
    if (savedOrcamentos) {
      const parsed = JSON.parse(savedOrcamentos);
      
      // Ordenar por data (mais recente primeiro)
      const orcamentosOrdenados = parsed.sort((a: Orcamento, b: Orcamento) => {
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });
      
      setOrcamentos(orcamentosOrdenados);
    }
  }, []);

  const formatarData = (dataString: string | Date) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const calcularTotal = (orcamento: Orcamento) => {
    return orcamento.itens.reduce((total, item) => {
      return total + (item.quantidade * item.precoUnitario);
    }, 0);
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleRegeneratePDF = (orcamento: Orcamento) => {
    generatePDF(orcamento, null);
  };

  const limparHistorico = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de orçamentos?')) {
      localStorage.setItem('orcamentos', JSON.stringify([]));
      setOrcamentos([]);
    }
  };

  const orcamentosFiltrados = orcamentos.filter(orc => {
    if (!filtro) return true;
    
    const termoLower = filtro.toLowerCase();
    return (
      orc.cliente.nome.toLowerCase().includes(termoLower) ||
      (orc.numeroOrcamento && orc.numeroOrcamento.toLowerCase().includes(termoLower)) ||
      orc.id.toLowerCase().includes(termoLower) ||
      (orc.cliente.email && orc.cliente.email.toLowerCase().includes(termoLower))
    );
  });

  return (
    <div className="historico-orcamentos card">
      <div className="historico-heading">
        <h2 className="mb-4">Histórico de Orçamentos</h2>
        <div className="historico-actions">
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          )}
          {orcamentos.length > 0 && (
            <button className="btn btn-danger" onClick={limparHistorico}>
              Limpar Histórico
            </button>
          )}
        </div>
      </div>
      
      {orcamentos.length > 0 ? (
        <>
          <div className="mb-4">
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por cliente ou número"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          
          <ul className="orcamentos-lista">
            {orcamentosFiltrados.map((orcamento) => (
              <li
                key={orcamento.id}
                className="orcamento-item"
                onClick={() => onSelectBudget && onSelectBudget(orcamento)}
              >
                <div className="orcamento-item-header">
                  <span className="orcamento-item-id">
                    {orcamento.numeroOrcamento ? 
                      `Orçamento ${orcamento.numeroOrcamento}` : 
                      `Orçamento #${orcamento.id.substring(0, 8)}`}
                  </span>
                  <span className="orcamento-item-data">
                    {formatarData(orcamento.data)}
                  </span>
                </div>
                <div className="orcamento-item-cliente">
                  Cliente: {orcamento.cliente.nome}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="orcamento-item-valor">
                    {formatarMoeda(calcularTotal(orcamento))}
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegeneratePDF(orcamento);
                    }}
                  >
                    Gerar PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-center text-gray-500">
          Nenhum orçamento encontrado no histórico.
        </p>
      )}
    </div>
  );
};

export default BudgetHistory; 