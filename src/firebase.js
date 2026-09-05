// Firebase configuration
// Replace these values with your actual Firebase project config
// See: https://firebase.google.com/docs/web/setup
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "demo",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "demo.firebaseapp.com",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || "https://demo-default-rtdb.firebaseio.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "demo",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| "000000000000",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:000:web:000",
};

let app, db, auth;
let isFirebaseAvailable = false;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app  = initializeApp(firebaseConfig);
    db   = getDatabase(app);
    auth = getAuth(app);
    isFirebaseAvailable = true;
  }
} catch {
  console.warn('[SHF] Firebase not configured — running in mock mode');
}

export { db, auth, isFirebaseAvailable };
export { ref, onValue, set, push, update, get };
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
