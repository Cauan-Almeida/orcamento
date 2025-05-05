import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="logo">
          <h1>Orçamento<span>Pro</span></h1>
        </div>
        <div className="nav-container">
          <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li><Link to="/">Início</Link></li>
              <li><Link to="/recursos">Recursos</Link></li>
              <li><Link to="/precos">Preços</Link></li>
              <li><Link to="/contato">Contato</Link></li>
            </ul>
          </nav>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/cadastro" className="btn btn-primary">Cadastre-se</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Gere orçamentos profissionais em minutos</h1>
          <p>Simplifique seu processo de orçamento e impressione seus clientes com documentos de aparência profissional.</p>
          <div className="hero-buttons">
            <Link to="/cadastro" className="btn btn-primary btn-large">Comece Grátis</Link>
            <Link to="/demo" className="btn btn-outline">Ver Demonstração</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/orcamento-exemplo.svg" alt="Exemplo de orçamento" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Recursos que facilitam o seu negócio</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Orçamentos Personalizados</h3>
            <p>Crie orçamentos com sua identidade visual e dados da sua empresa.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Sincronização em Nuvem</h3>
            <p>Acesse seus orçamentos em qualquer dispositivo, a qualquer momento.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Compartilhamento Fácil</h3>
            <p>Envie orçamentos por e-mail ou WhatsApp diretamente do sistema.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Análise de Dados</h3>
            <p>Acompanhe quais orçamentos são aprovados e rejeitados.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2>O que nossos clientes dizem</h2>
        <div className="testimonial-carousel">
          <div className="testimonial-card">
            <p>"O melhor investimento que fiz para meu negócio. Economizo horas toda semana!"</p>
            <div className="testimonial-author">
              <img src="/images/avatar1.svg" alt="Cliente" />
              <div>
                <h4>Roberto Silva</h4>
                <p>Proprietário da RS Construções</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Pronto para simplificar seus orçamentos?</h2>
        <p>Junte-se a milhares de profissionais que já utilizam o OrçamentoPro.</p>
        <Link to="/cadastro" className="btn btn-primary btn-large">Criar Conta Gratuita</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>Orçamento<span>Pro</span></h2>
            <p>Simplificando orçamentos desde 2023</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Produto</h4>
              <ul>
                <li><Link to="/recursos">Recursos</Link></li>
                <li><Link to="/precos">Preços</Link></li>
                <li><Link to="/demo">Demonstração</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Empresa</h4>
              <ul>
                <li><Link to="/sobre">Sobre nós</Link></li>
                <li><Link to="/contato">Contato</Link></li>
                <li><Link to="/carreiras">Carreiras</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/termos">Termos de Uso</Link></li>
                <li><Link to="/privacidade">Privacidade</Link></li>
                <li><Link to="/cookies">Cookies</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} OrçamentoPro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 