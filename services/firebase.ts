
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';

// NOTE: In a real production app, these should be environment variables (process.env.REACT_APP_FIREBASE_...)
// You must get these keys from the Firebase Console (https://console.firebase.google.com)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "shoot-or-shield.firebaseapp.com",
  projectId: "shoot-or-shield",
  storageBucket: "shoot-or-shield.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:00000000000000"
};

// Initialize Firebase
// We wrap this in a try/catch because in some preview environments without keys it might throw
let auth: any;
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (e) {
    console.warn("Firebase not configured. Auth will run in simulation mode.");
}

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Social Login
  signInWithGoogle: async () => {
    if (!auth) throw new Error("Auth service not configured");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      throw error;
    }
  },

  // Email/Password Register
  register: async (email: string, pass: string, displayName: string) => {
    if (!auth) throw new Error("Auth service not configured");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName });
      return userCredential.user;
    } catch (error: any) {
      throw error;
    }
  },

  // Email/Password Login
  login: async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth service not configured");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      throw error;
    }
  },

  logout: async () => {
    if (!auth) return;
    await signOut(auth);
  },

  // Listener
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(callback);
  }
};
