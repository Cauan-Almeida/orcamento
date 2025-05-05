import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/PaginaEmConstrucao.css';

interface PaginaEmConstrucaoProps {
  titulo: string;
  descricao: string;
  imagem?: string;
  rotaRetorno?: string;
}

const PaginaEmConstrucao: React.FC<PaginaEmConstrucaoProps> = ({ 
  titulo, 
  descricao, 
  imagem = '/images/orcamento-exemplo.svg',
  rotaRetorno = '/dashboard'
}) => {
  const navigate = useNavigate();

  return (
    <div className="construcao-container">
      <div className="construcao-content">
        <img 
          src={imagem} 
          alt="Página em construção" 
          className="construcao-image"
        />
        
        <h1>{titulo}</h1>
        <p className="construcao-descricao">{descricao}</p>
        
        <div className="construcao-info">
          <div className="info-item">
            <div className="info-icon">📝</div>
            <div className="info-text">
              <h3>Em desenvolvimento</h3>
              <p>Estamos trabalhando para implementar esta funcionalidade em breve.</p>
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-icon">💡</div>
            <div className="info-text">
              <h3>Sugestões</h3>
              <p>Tem ideias para melhorar esta funcionalidade? Compartilhe conosco!</p>
            </div>
          </div>
        </div>
        
        <div className="construcao-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(rotaRetorno)}
          >
            Voltar para Dashboard
          </button>
          
          <Link to="/configuracoes" className="btn btn-primary">
            Configurações
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaginaEmConstrucao; 