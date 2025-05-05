import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/Configuracoes.css';
import { useConfig, UserConfig } from '../context/ConfigContext';

interface UserData {
  nome: string;
  email: string;
  empresa: string;
  configuracoes?: UserConfig;
}

const Configuracoes = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { config, setConfig } = useConfig();
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Carregar dados do usuário
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setUserData(userData);
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfig({
        ...config,
        [name]: checked
      });
    } else {
      setConfig({
        ...config,
        [name]: value
      });
    }
  };

  const salvarConfiguracoes = async () => {
    if (!auth.currentUser) return;
    
    setSalvando(true);
    setMensagem('');
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        configuracoes: config
      });
      
      setMensagem('Configurações salvas com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setMensagem('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="config-container">
      <div className="config-header">
        <h1>Configurações</h1>
        <p>Personalize o funcionamento do seu OrcamentoPRO</p>
      </div>

      <div className="config-section">
        <h2>Preferências Gerais</h2>
        
        <div className="config-group">
          <label className="switch-label">
            <span>Receber notificações por email</span>
            <label className="switch">
              <input 
                type="checkbox" 
                name="notificacoesEmail" 
                checked={config.notificacoesEmail} 
                onChange={handleConfigChange}
                title="Receber alertas por email quando novos orçamentos forem criados ou atualizados"
              />
              <span className="slider round"></span>
            </label>
          </label>
          <p className="config-description">
            Enviar notificações por email quando houver alterações nos orçamentos.
          </p>
        </div>
        
        <div className="config-group">
          <label className="switch-label">
            <span>Tema escuro</span>
            <label className="switch">
              <input 
                type="checkbox" 
                name="temaEscuro" 
                checked={config.temaEscuro} 
                onChange={handleConfigChange}
                title="Ativar modo escuro para reduzir o cansaço visual"
              />
              <span className="slider round"></span>
            </label>
          </label>
          <p className="config-description">
            Modo escuro para reduzir o cansaço visual e economizar bateria. As alterações são aplicadas imediatamente.
          </p>
        </div>
        
        <div className="config-group">
          <label>
            Idioma
            <select 
              name="idioma" 
              value={config.idioma} 
              onChange={handleConfigChange}
              title="Selecione o idioma para formatação de números e datas"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (USA)</option>
              <option value="es">Español</option>
            </select>
          </label>
          <p className="config-description">
            Define o formato de data e números conforme o padrão regional.
          </p>
        </div>
        
        <div className="config-group">
          <label>
            Formato monetário
            <select 
              name="formatoMonetario" 
              value={config.formatoMonetario} 
              onChange={handleConfigChange}
              title="Selecione a moeda para exibição de valores"
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </label>
          <p className="config-description">
            Define o símbolo monetário e formato de exibição dos valores. Apenas para exibição, não altera os valores armazenados.
          </p>
        </div>
      </div>

      <div className="config-section">
        <h2>Orçamentos</h2>
        
        <div className="config-group">
          <p className="config-description">
            Aqui você pode personalizar como seus orçamentos são numerados, 
            configurar modelos e definir valores padrão para novos orçamentos.
          </p>
          <div className="feature-soon">
            <p>Mais configurações estarão disponíveis em breve!</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
        >
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          onClick={salvarConfiguracoes}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {mensagem && (
        <div className="message-bar success">
          {mensagem}
        </div>
      )}
    </div>
  );
};

export default Configuracoes; 