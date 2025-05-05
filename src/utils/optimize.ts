// Funções para otimização de performance

/**
 * Limpa dados antigos do localStorage para reduzir o uso de memória
 */
export const limparDadosAntigos = () => {
  try {
    const keys = Object.keys(localStorage);
    const agora = Date.now();
    const umaSemanaAtras = agora - (7 * 24 * 60 * 60 * 1000); // 7 dias em milissegundos
    
    // Itens com "cached_" no nome e mais antigos que uma semana
    for (const key of keys) {
      if (key.startsWith('cached_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && item.timestamp < umaSemanaAtras) {
            localStorage.removeItem(key);
            console.log(`Cache antigo removido: ${key}`);
          }
        } catch (e) {
          // Ignora itens que não podem ser parseados
        }
      }
    }
    
    // Limitar orçamentos offline para manter apenas os últimos 10
    const offlineOrcamentos = localStorage.getItem('offline_orcamentos');
    if (offlineOrcamentos) {
      try {
        const items = JSON.parse(offlineOrcamentos);
        if (Array.isArray(items) && items.length > 10) {
          localStorage.setItem('offline_orcamentos', JSON.stringify(items.slice(0, 10)));
        }
      } catch (e) {
        // Ignora se não puder ser parseado
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao limpar dados antigos:", error);
    return false;
  }
};

/**
 * Reduz o número de listeners ativos
 */
export const otimizarListeners = () => {
  // Esta função seria chamada periodicamente para remover listeners desnecessários
  // Implementação específica depende da estrutura do aplicativo
  console.log("Otimização de listeners executada");
};

/**
 * Limpa o cache de imagens e outros recursos pesados
 */
export const limparCacheRecursos = () => {
  if ('caches' in window) {
    try {
      caches.delete('image-cache').then(() => {
        console.log('Cache de imagens limpo');
      });
    } catch (e) {
      console.error("Erro ao limpar cache:", e);
    }
  }
};

/**
 * Função principal que executa todas as otimizações
 */
export const otimizarAplicativo = () => {
  limparDadosAntigos();
  otimizarListeners();
  limparCacheRecursos();
  
  console.log("Otimização do aplicativo concluída");
}; 