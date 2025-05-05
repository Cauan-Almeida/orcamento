import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../styles/UserProfile.css';
import ConnectionStatus from './ConnectionStatus';

interface UserData {
  nome: string;
  email: string;
  empresa: string;
  telefone?: string;
  whatsapp?: string;
  cargo?: string;
  foto?: string;
}

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    nome: '',
    email: '',
    empresa: '',
    telefone: '',
    whatsapp: '',
    cargo: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setUserData(data);
            setFormData(data);
          } else {
            // Se o documento não existir, usar dados básicos
            const defaultData = {
              nome: user.displayName || 'Usuário',
              email: user.email || '',
              empresa: 'Minha Empresa',
              cargo: 'Usuário',
            };
            setUserData(defaultData);
            setFormData(defaultData);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          setError('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const plainObject: Record<string, any> = { ...formData };
      await updateDoc(userRef, plainObject);
      
      setUserData(formData);
      setMessage('Perfil atualizado com sucesso!');
      setEditing(false);
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setError('Erro ao salvar perfil. Tente novamente mais tarde.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getRandomColor = (name: string) => {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // Gerar um índice baseado no nome para sempre ter a mesma cor
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <ConnectionStatus />
      
      <div className="profile-header">
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </button>
        <h1>Meu Perfil</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-avatar" style={{ backgroundColor: getRandomColor(userData?.nome || 'User') }}>
          {getInitials(userData?.nome || 'User')}
        </div>
        
        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="nome">Nome Completo</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled
              />
              <small>O email não pode ser alterado</small>
            </div>

            <div className="form-group">
              <label htmlFor="empresa">Empresa</label>
              <input
                type="text"
                id="empresa"
                name="empresa"
                value={formData.empresa}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cargo">Cargo</label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo || ''}
                onChange={handleInputChange}
                placeholder="Seu cargo na empresa"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone || ''}
                onChange={handleInputChange}
                placeholder="(00) 0000-0000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="form-buttons">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setEditing(false);
                  setFormData(userData || formData);
                  setError(null);
                }}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Nome:</span>
              <span className="info-value">{userData?.nome}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{userData?.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Empresa:</span>
              <span className="info-value">{userData?.empresa}</span>
            </div>
            {userData?.cargo && (
              <div className="info-row">
                <span className="info-label">Cargo:</span>
                <span className="info-value">{userData.cargo}</span>
              </div>
            )}
            {userData?.telefone && (
              <div className="info-row">
                <span className="info-label">Telefone:</span>
                <span className="info-value">{userData.telefone}</span>
              </div>
            )}
            {userData?.whatsapp && (
              <div className="info-row">
                <span className="info-label">WhatsApp:</span>
                <span className="info-value">{userData.whatsapp}</span>
              </div>
            )}
            
            <button 
              className="btn btn-primary edit-profile-btn" 
              onClick={() => setEditing(true)}
            >
              Editar Perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 