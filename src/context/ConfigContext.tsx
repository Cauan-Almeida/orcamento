import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Interface para configurações do usuário
export interface UserConfig {
  notificacoesEmail: boolean;
  temaEscuro: boolean;
  idioma: string;
  formatoMonetario: string;
}

// Valores padrão para as configurações
const defaultConfig: UserConfig = {
  notificacoesEmail: true,
  temaEscuro: false,
  idioma: 'pt-BR',
  formatoMonetario: 'BRL',
};

// Interface para o contexto
interface ConfigContextType {
  config: UserConfig;
  loading: boolean;
  setConfig: (config: UserConfig) => void;
  applyTheme: () => void;
}

// Criando o contexto
const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  loading: true,
  setConfig: () => {},
  applyTheme: () => {},
});

// Provider para o contexto
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<UserConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  // Função para aplicar o tema baseado nas configurações
  const applyTheme = () => {
    if (config.temaEscuro) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  // Carregar configurações do usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.configuracoes) {
              setConfig(userData.configuracoes as UserConfig);
            } else {
              setConfig(defaultConfig);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar configurações:", error);
          setConfig(defaultConfig);
        } finally {
          setLoading(false);
        }
      } else {
        setConfig(defaultConfig);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Aplicar o tema sempre que a configuração mudar
  useEffect(() => {
    applyTheme();
  }, [config.temaEscuro]);

  return (
    <ConfigContext.Provider value={{ config, loading, setConfig, applyTheme }}>
      {children}
    </ConfigContext.Provider>
  );
};

// Hook personalizado para usar o contexto de configurações
export const useConfig = () => useContext(ConfigContext);

export default ConfigContext; 