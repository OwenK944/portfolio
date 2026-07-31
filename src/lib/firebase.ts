import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCjcNJqKllXv2LKeOEUJ5XdAU-__NuItok",
  authDomain: "gen-lang-client-0107832514.firebaseapp.com",
  projectId: "gen-lang-client-0107832514",
  storageBucket: "gen-lang-client-0107832514.firebasestorage.app",
  messagingSenderId: "1054602715097",
  appId: "1:1054602715097:web:f0a9d5c47a405fc61803c8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-e11704c0-0f64-4ee8-982e-87d55e81af92");
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
