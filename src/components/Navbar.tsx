import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Orçamento<span className="logo-highlight">PRO</span></span>
          <div className="logo-icon">
            <img src="/favicon.ico" alt="Orçamento PRO" className="logo-img" />
          </div>
        </Link>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Início
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/recursos" className="nav-link">
              Recursos
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/precos" className="nav-link">
              Preços
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/contato" className="nav-link">
              Contato
            </Link>
          </li>
        </ul>
        
        <div className="nav-cta">
          <Link to="/login" className="nav-button login">
            Entrar
          </Link>
          <Link to="/cadastro" className="nav-button signup">
            Cadastrar
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 