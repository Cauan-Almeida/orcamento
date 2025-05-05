import React, { useState, useEffect } from 'react';
import '../styles/ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  
  useEffect(() => {
    // Funções para atualizar o status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      setShowMessage(true);
      // Esconder a mensagem após 3 segundos
      setTimeout(() => setShowMessage(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowMessage(true);
    };
    
    // Adicionar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Limpar event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showMessage) return null;
  
  return (
    <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <span>✓ Online - Seus dados estão sendo sincronizados</span>
      ) : (
        <span>⚠️ Offline - Seus dados serão salvos localmente</span>
      )}
    </div>
  );
};

export default ConnectionStatus; 