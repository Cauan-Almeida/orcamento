import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configuração básica do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDLNCeCa_PREn0dP8Pn80wVcVhjMX62Ysc",
    authDomain: "orcamentosapp.firebaseapp.com",
    projectId: "orcamentosapp",
    storageBucket: "orcamentosapp.appspot.com",
    messagingSenderId: "289304055622",
    appId: "1:289304055622:web:d137aa9c91e71f42201f47",
    measurementId: "G-WF81LYWQ4C",
    databaseURL: "https://orcamentosapp.firebaseio.com"
};

// Inicialização simples do Firebase
const app = initializeApp(firebaseConfig);

// Serviços básicos
export const auth = getAuth(app);
export const db = getFirestore(app); // Sem especificar nome de banco
export const provider = new GoogleAuthProvider();

// Config básica do provedor
provider.setCustomParameters({
    prompt: 'select_account'
});

// Analytics se suportado
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Log simplificado
console.log("Firebase inicializado com configuração básica");