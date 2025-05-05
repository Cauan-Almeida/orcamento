import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo favicon
const rootDir = path.resolve(__dirname, '..');
const faviconSource = path.join(rootDir, 'favicon.ico');
const faviconDest = path.join(rootDir, 'dist', 'favicon.ico');

// Copiar o arquivo
try {
  // Verificar se o arquivo existe
  if (fs.existsSync(faviconSource)) {
    // Copiar para o diretório de destino
    fs.copyFileSync(faviconSource, faviconDest);
    console.log('✅ Favicon copiado com sucesso para o diretório de build');
  } else {
    console.error('❌ Arquivo favicon.ico não encontrado na raiz do projeto');
  }
} catch (error) {
  console.error('❌ Erro ao copiar favicon:', error);
} 