import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit, 
  DocumentData,
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';

// Cache para armazenar resultados de consultas
interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number; // tempo em milissegundos
}

const cache: Record<string, CacheItem> = {};

// Tempo de expiração padrão: 5 minutos
const DEFAULT_EXPIRATION = 5 * 60 * 1000;

/**
 * Obtém dados do Firestore com cache
 * @param collectionName Nome da coleção
 * @param docId ID do documento (opcional)
 * @param constraints Restrições de consulta (opcional)
 * @param expiresIn Tempo de expiração em ms (opcional)
 */
export async function getFirestoreData(
  collectionName: string,
  docId?: string,
  constraints?: QueryConstraint[],
  expiresIn: number = DEFAULT_EXPIRATION
): Promise<DocumentData | DocumentData[]> {
  // Criar chave única para o cache
  const cacheKey = `${collectionName}_${docId || 'collection'}_${JSON.stringify(constraints || [])}`;
  
  // Verificar se temos dados em cache válidos
  const cachedItem = cache[cacheKey];
  const now = Date.now();
  
  if (cachedItem && now - cachedItem.timestamp < cachedItem.expiresIn) {
    console.log(`Usando dados em cache para ${cacheKey}`);
    return cachedItem.data;
  }
  
  // Se não temos cache válido, buscar do Firestore
  let data: DocumentData | DocumentData[];
  
  try {
    if (docId) {
      // Buscar documento específico
      const docRef = doc(db, collectionName, docId);
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        data = { id: docSnapshot.id, ...docSnapshot.data() };
      } else {
        throw new Error(`Documento não encontrado: ${collectionName}/${docId}`);
      }
    } else {
      // Buscar coleção com possíveis restrições
      const collectionRef = collection(db, collectionName);
      const q = constraints 
        ? query(collectionRef, ...constraints)
        : query(collectionRef);
      
      const querySnapshot = await getDocs(q);
      data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // Armazenar em cache
    cache[cacheKey] = {
      data,
      timestamp: now,
      expiresIn
    };
    
    return data;
  } catch (error) {
    console.error(`Erro ao buscar dados do Firestore: ${error}`);
    throw error;
  }
}

/**
 * Limpar todo o cache ou itens específicos
 * @param cacheKey Chave específica para limpar (opcional)
 */
export function clearFirestoreCache(cacheKey?: string): void {
  if (cacheKey) {
    delete cache[cacheKey];
  } else {
    Object.keys(cache).forEach(key => delete cache[key]);
  }
} 