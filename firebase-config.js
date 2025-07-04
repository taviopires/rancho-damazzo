// firebase-config.js

// Importa os módulos necessários do Firebase (modo ES6 via URL)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBhy-hCWGlUyoJgg9-gmAkvr-tiXpcWlLE",
  authDomain: "rancho-damazzo-22aa6.firebaseapp.com",
  projectId: "rancho-damazzo-22aa6",
  storageBucket: "rancho-damazzo-22aa6.firebasestorage.app",
  messagingSenderId: "140142311321",
  appId: "1:140142311321:web:9ed091a6056d0deab94508"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore pra usar no app.js
export const db = getFirestore(app);
