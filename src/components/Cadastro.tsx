import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { loginGoogle } from '../auth';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const Cadastro = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Iniciando cadastro com email/senha');

    try {
      // Validar campos
      if (!nome || !email || !password || !empresa) {
        setError('Todos os campos são obrigatórios');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('A senha precisa ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      console.log('Criando usuário no Firebase Auth');
      // Criar o usuário com email e senha
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário criado com sucesso:', user.uid);

      // Etapa 1: Atualizar o perfil (não é crítico)
      try {
        console.log('Atualizando perfil com nome');
        await updateProfile(user, {
          displayName: nome
        });
        console.log('Perfil atualizado com sucesso');
      } catch (profileError) {
        console.error('Erro ao atualizar perfil (não crítico):', profileError);
        // Continua mesmo se não conseguir atualizar o perfil
      }

      // Etapa 2: Salvar no Firestore (não é crítico para o login)
      try {
        console.log('Salvando dados no Firestore');
        await setDoc(doc(db, "users", user.uid), {
          nome,
          email,
          empresa,
          criadoEm: new Date()
        });
        console.log('Dados salvos com sucesso');
      } catch (firestoreError) {
        console.error('Erro ao salvar no Firestore (não crítico):', firestoreError);
        // Continua mesmo se não conseguir salvar no Firestore
      }

      // O importante é que o usuário foi criado no Authentication
      console.log('Cadastro concluído com sucesso');
      console.log('Redirecionando para o dashboard');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let errorMessage = 'Falha no cadastro. Tente novamente.';
      
      // Verificar se é um FirebaseError com código
      const firebaseError = error as { code?: string, message?: string };
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está cadastrado. Deseja fazer login?';
        // Mostrar opção para ir para a página de login
        setError(errorMessage);
        // Adicionar botão de login na mensagem de erro
        setTimeout(() => {
          const errorElement = document.querySelector('.auth-error');
          if (errorElement && !errorElement.querySelector('.btn-error-action')) {
            const loginButton = document.createElement('button');
            loginButton.textContent = 'Ir para Login';
            loginButton.className = 'btn-error-action';
            loginButton.onclick = () => navigate('/login', { state: { email } });
            errorElement.appendChild(loginButton);
          }
        }, 100);
        setLoading(false);
        return; // Sair da função para não sobrescrever a mensagem personalizada
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'A senha precisa ter pelo menos 6 caracteres.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (firebaseError.message) {
        errorMessage = firebaseError.message;
      }
      
      setError(errorMessage);
      console.error('Erro tratado:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    console.log('Iniciando cadastro com Google');
    
    try {
      const user = await loginGoogle();
      console.log('Resultado do login Google:', user ? 'Sucesso' : 'Falha');
      
      if (user) {
        try {
          // Verificar se o documento do usuário já existe
          console.log('Salvando dados no Firestore');
          await setDoc(doc(db, "users", user.uid), {
            nome: user.displayName || 'Usuário',
            email: user.email || '',
            empresa: empresa || 'Minha Empresa', // Valor padrão se não tiver sido preenchido
            criadoEm: new Date()
          }, { merge: true }); // merge: true para não sobrescrever dados existentes
          console.log('Dados salvos com sucesso');
        } catch (innerError) {
          console.error('Erro ao salvar dados do usuário:', innerError);
          // Continua mesmo se falhar ao salvar no Firestore
        }
        
        // Verificar explicitamente se o usuário está autenticado
        console.log('Verificando estado de autenticação após Google login');
        if (auth.currentUser) {
          console.log('Usuário Google autenticado:', auth.currentUser.uid);
          console.log('Redirecionando para o dashboard');
          navigate('/dashboard');
        } else {
          console.log('Usuário Google não está autenticado, aguardando...');
          // Adicionar um pequeno atraso
          setTimeout(() => {
            if (auth.currentUser) {
              console.log('Usuário Google autenticado após delay:', auth.currentUser.uid);
              navigate('/dashboard');
            } else {
              console.log('Falha na autenticação Google, redirecionando para o login');
              navigate('/login');
            }
          }, 1000);
        }
      } else {
        setError('Não foi possível completar o cadastro com Google. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Erro no cadastro com Google:', error);
      let errorMessage = 'Erro ao fazer cadastro com Google. Tente novamente.';
      
      if (error.message) {
        errorMessage = error.message;
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
          <h2>Cadastre-se</h2>
          <p>Crie sua conta para gerar orçamentos profissionais</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleEmailSignup} className="auth-form">
          <div className="form-group">
            <label htmlFor="nome">Nome completo</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Seu nome"
            />
          </div>

          <div className="form-group">
            <label htmlFor="empresa">Nome da sua empresa</label>
            <input
              type="text"
              id="empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              required
              placeholder="Sua empresa"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button 
          onClick={handleGoogleSignup} 
          className="google-button"
          disabled={loading}
        >
          <img src="/images/google-icon.svg" alt="Google" />
          Cadastrar com Google
        </button>

        <div className="auth-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastro; 