import { signInWithPopup, setPersistence, browserLocalPersistence, AuthError } from "firebase/auth";
import { auth, provider } from "./firebase";
import { setDoc, doc, getDoc, FirestoreError } from "firebase/firestore";
import { db } from "./firebase";
// Imports do Firestore comentados temporariamente para isolar o problema
// import { setDoc, doc, getDoc, FirestoreError } from "firebase/firestore";
// import { db } from "./firebase";

// Configurar persistência para manter o usuário logado
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Erro ao configurar persistência:", error);
});

export const loginGoogle = async () => {
  try {
    console.log("Iniciando login com Google (versão completa)");
    
    // Limpar estado de autenticação anterior se existir
    if (auth.currentUser) {
      console.log("Usuário já autenticado, desconectando primeiro");
      await auth.signOut();
    }
    
    // Usar apenas popup para simplificar
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    if (!user) {
      console.log("Login não concluído ou cancelado pelo usuário");
      return null;
    }
    
    console.log("Login com Google bem-sucedido:", user.uid);
    console.log("Nome do usuário:", user.displayName);
    console.log("Email do usuário:", user.email);
    
    // IMPORTANTE: Verificar se o usuário está realmente autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("Usuário logado mas auth.currentUser é null");
      return user; // Retornar o usuário mesmo assim
    }
    
    console.log("Usuário autenticado:", currentUser.uid);
    
    // Tentativa de salvar dados no Firestore com tratamento de erro adequado
    try {
      // Obter token fresco antes de qualquer operação Firestore
      console.log("Obtendo token atualizado...");
      const idToken = await user.getIdToken(true);
      console.log("Token atualizado obtido com sucesso:", !!idToken);
      
      // Esperar para garantir que o token seja processado
      console.log("Aguardando processamento do token...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Preparando dados do usuário para salvar no Firestore");
      
      // Dados básicos do usuário
      const userData = {
        nome: user.displayName || 'Usuário',
        email: user.email || '',
        empresa: 'Minha Empresa',
        ultimoLogin: new Date().toISOString(),
        // Adicione estes campos apenas na primeira vez (se o documento não existir)
        criadoEm: new Date().toISOString()
      };
      
      // Verificar se o usuário já existe no Firestore
      const userDocRef = doc(db, "users", user.uid);
      console.log("Verificando se usuário já existe no Firestore...");
      
      try {
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          console.log("Usuário já existe, atualizando apenas dados de login");
          await setDoc(userDocRef, {
            nome: userData.nome,
            email: userData.email,
            ultimoLogin: userData.ultimoLogin
          }, { merge: true });
        } else {
          console.log("Novo usuário, criando documento completo");
          await setDoc(userDocRef, userData);
        }
        
        console.log("Dados do usuário salvos/atualizados com sucesso");
      } catch (error) {
        console.error("Erro ao acessar/verificar documento:", error);
        throw error; // Repassar erro para tratamento externo
      }
      
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error("Erro ao acessar Firestore:", firestoreError);
      console.error("Detalhes do erro:", {
        code: firestoreError.code,
        message: firestoreError.message,
        name: firestoreError.name,
        stack: firestoreError.stack
      });
      
      // Continuar mesmo com erro no Firestore
      console.log("Continuando apesar do erro do Firestore");
    }
    
    // Retornar o usuário
    console.log("Login finalizado com sucesso");
    return user;
  } catch (error) {
    console.error("Erro ao fazer login com Google:", error);
    const authError = error as AuthError;
    if (authError && authError.code) {
      console.error("Código do erro:", authError.code);
      console.error("Mensagem do erro:", authError.message);
    }
    return null;
  }
};