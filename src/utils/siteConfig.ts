/**
 * Configurações e utilitários relacionados ao site
 */

// Configurações do site
export const siteConfig = {
  title: 'Orçamento PRO',
  description: 'Sistema de gerenciamento de orçamentos',
  faviconPath: '/images/FAVEICON-USE.png',
  logoPath: '/logo192.png'
};

/**
 * Atualiza o favicon do site forçando uma recarga
 */
export function atualizarFavicon() {
  // Remove ícones existentes
  const iconNodes = document.querySelectorAll("link[rel*='icon']");
  iconNodes.forEach(node => node.remove());
  
  // Adiciona nova tag link para o favicon com timestamp para forçar recarga
  const timestamp = new Date().getTime();
  
  // Força o carregamento com cache-busting
  const faviconUrl = `${siteConfig.faviconPath}?v=${timestamp}`;
  
  // Ícone principal
  const link = document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = faviconUrl;
  document.head.appendChild(link);
  
  // Shortcut icon para compatibilidade
  const shortcutLink = document.createElement('link');
  shortcutLink.type = 'image/png';
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.href = faviconUrl;
  document.head.appendChild(shortcutLink);
  
  // Console log para debug
  console.log('Favicon atualizado:', faviconUrl);
}

/**
 * Atualiza o título do documento
 */
export function atualizarTitulo(pagina?: string) {
  document.title = pagina 
    ? `${pagina} | ${siteConfig.title}` 
    : siteConfig.title;
}

/**
 * Configura título e favicon do site
 */
export function configurarSite(pagina?: string) {
  atualizarTitulo(pagina);
  atualizarFavicon();
} 