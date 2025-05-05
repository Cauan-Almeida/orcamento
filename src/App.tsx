import './App.css';
import './styles/DarkTheme.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { configurarSite } from './utils/siteConfig';
import { ConfigProvider } from './context/ConfigContext';

// Componentes
import HomePage from './components/HomePage';
import Login from './components/login';
import Cadastro from './components/Cadastro';
import Dashboard from './components/Dashboard';
import OrcamentoDetail from './components/OrcamentoDetail';
import NewBudget from './pages/NewBudget';
import UserProfile from './components/UserProfile';
import Configuracoes from './components/Configuracoes';
import PaginaEmConstrucao from './components/PaginaEmConstrucao';

// Configurar o título e favicon do site
configurarSite();

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedRoute: Verificando autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isAuthenticated = !!user;
      console.log('ProtectedRoute: Status de autenticação:', isAuthenticated, user?.uid);
      setAuthenticated(isAuthenticated);
      setLoading(false);
      
      if (!isAuthenticated) {
        // Se não estiver autenticado, redireciona imediatamente
        console.log('ProtectedRoute: Não autenticado, redirecionando para login');
        navigate('/login');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    console.log('ProtectedRoute: Carregando...');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!authenticated) {
    // Este trecho raramente será executado devido ao redirecionamento no useEffect
    console.log('ProtectedRoute: Não autenticado (renderização)');
    return null;
  }

  console.log('ProtectedRoute: Autenticado, renderizando conteúdo protegido');
  return <>{children}</>;
};

// Componente para rota não encontrada
const NotFoundRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Se estiver autenticado, redireciona para o dashboard
  // Se não estiver autenticado, redireciona para a home
  return authenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />;
};

function App() {
  // Efeito para garantir que o favicon seja atualizado sempre que o componente montar
  useEffect(() => {
    configurarSite();
  }, []);
  
  return (
    <ConfigProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          
          {/* Rotas protegidas */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/orcamentos/:id" 
            element={
              <ProtectedRoute>
                <OrcamentoDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/orcamentos/:id/editar" 
            element={
              <ProtectedRoute>
                <NewBudget />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/novo-orcamento" 
            element={
              <ProtectedRoute>
                <NewBudget />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/novo-orcamento/:id" 
            element={
              <ProtectedRoute>
                <NewBudget />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/perfil" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          
          {/* Rotas ainda não implementadas totalmente */}
          <Route 
            path="/orcamentos" 
            element={
              <ProtectedRoute>
                <PaginaEmConstrucao 
                  titulo="Área de Orçamentos" 
                  descricao="Gerencie todos os seus orçamentos em um só lugar. Em breve você poderá filtrar, exportar e criar novos modelos de orçamentos."
                />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute>
                <PaginaEmConstrucao 
                  titulo="Gerenciamento de Clientes" 
                  descricao="Visualize, adicione e gerencie seus clientes. Em breve você poderá importar contatos e criar grupos de clientes."
                />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/produtos" 
            element={
              <ProtectedRoute>
                <PaginaEmConstrucao 
                  titulo="Catálogo de Produtos" 
                  descricao="Gerencie seu catálogo de produtos e serviços. Em breve você poderá incluir fotos e categorias personalizadas."
                />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/configuracoes" 
            element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirecionar rotas não encontradas baseado na autenticação */}
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
