import { salvarOrcamentoFirestore } from './pdfGenerator';

// Função para verificar se há orçamentos pendentes de sincronização
export const checkOfflineOrcamentos = async (userId: string): Promise<void> => {
  try {
    // Verificar se há orçamentos offline
    const offlineOrcamentos = JSON.parse(localStorage.getItem('offline_orcamentos') || '[]');
    
    if (offlineOrcamentos.length === 0) {
      return; // Nada para sincronizar
    }
    
    // Se estiver online, tenta sincronizar
    if (navigator.onLine) {
      console.log(`Tentando sincronizar ${offlineOrcamentos.length} orçamentos offline`);
      
      const sucessos = [];
      const falhas = [];
      
      for (const orcamento of offlineOrcamentos) {
        try {
          // Tentar salvar no Firestore
          await salvarOrcamentoFirestore(userId, orcamento);
          sucessos.push(orcamento);
        } catch (error) {
          console.error("Erro ao sincronizar orçamento offline:", error);
          falhas.push(orcamento);
        }
      }
      
      // Atualizar o localStorage apenas com os orçamentos que falharam
      localStorage.setItem('offline_orcamentos', JSON.stringify(falhas));
      
      // Notificar o usuário se houve sincronização
      if (sucessos.length > 0) {
        alert(`${sucessos.length} orçamento(s) sincronizado(s) com sucesso.`);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar orçamentos offline:", error);
  }
};

// Função para configurar listener de reconexão
export const setupOfflineSyncListeners = (userId: string): void => {
  // Listener para quando o navegador ficar online
  window.addEventListener('online', () => {
    console.log("Conexão restabelecida, verificando dados offline");
    checkOfflineOrcamentos(userId);
  });
}; 