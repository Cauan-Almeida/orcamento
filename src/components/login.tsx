import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { loginGoogle } from '../auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Auth.css';

interface LocationState {
  email?: string;
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se recebemos um email da página de cadastro
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.email) {
      console.log('Email recebido da tela de cadastro:', state.email);
      setEmail(state.email);
      // Foca no campo de senha
      setTimeout(() => {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
    }
  }, [location]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Iniciando login com email/senha');

    try {
      // Tentar login diretamente sem verificação prévia
      console.log('Tentando login direto');
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login bem-sucedido, redirecionando para dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro durante login:', error);
      let errorMessage = 'Falha na autenticação. Tente novamente.';
      
      // Verificar se é um FirebaseError com código
      const firebaseError = error as { code?: string };
      
      if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = 'Este email não está cadastrado.';
      } else if (firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Tente novamente.';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente mais tarde ou redefina sua senha.';
      } else if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciais inválidas. Verifique seu email e senha.';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = 'Problema de conexão com o servidor. Verifique sua internet.';
      }
      
      setError(errorMessage);
      console.log('Erro tratado:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const user = await loginGoogle();
      if (user) {
        console.log('Login com Google bem-sucedido, redirecionando');
        navigate('/dashboard');
      } else {
        setError('Falha ao fazer login com Google. Tente novamente.');
      }
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      let errorMessage = 'Erro ao fazer login com Google. Tente novamente.';
      
      // Verificar se é um FirebaseError com código
      const firebaseError = error as { code?: string, message?: string };
      
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Você fechou a janela de login do Google.';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = 'Problema de conexão com o servidor. Verifique sua internet.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Login</h2>
          <p>Faça login para acessar seus orçamentos</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleEmailLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-footer">
            <Link to="/esqueci-senha" className="forgot-password">
              Esqueceu a senha?
            </Link>
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="google-button"
          disabled={loading}
        >
          <img src="/images/google-icon.svg" alt="Google" />
          Entrar com Google
        </button>

        <div className="auth-footer">
          <p>
            Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;