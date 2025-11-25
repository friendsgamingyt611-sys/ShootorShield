
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { PlayerStats, AuthResponse } from '../types';
import { INITIAL_PLAYER } from '../constants';

// --- SERVICE INITIALIZATION ---
let auth: any = null;
let db: any = null;

const isConfigured = firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

if (isConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("🔥 Firebase Plug-in Active");
    } catch (e) {
        console.error("Firebase Init Failed:", e);
    }
} else {
    console.warn("⚠️ Firebase keys missing. Running in OFFLINE mode.");
}

// --- AUTHENTICATION SERVICE ---

export const authService = {
    
    isAuthenticated: () => !!auth?.currentUser,

    getUser: () => auth?.currentUser,

    // LOGIN
    login: async (username: string, pass: string): Promise<AuthResponse> => {
        if (!isConfigured) {
            // Mock Login for Offline Mode
            return { 
                success: true, 
                token: 'mock-token', 
                player: { ...INITIAL_PLAYER, name: username, id: 'offline-user' } 
            };
        }

        try {
            // Check if username is actually an email, if not append fake domain
            const email = username.includes('@') ? username : `${username}@shootorshield.game`;
            
            const userCred = await signInWithEmailAndPassword(auth, email, pass);
            const user = userCred.user;
            
            // Get Profile Data
            const player = await dataService.loadProfile(user.uid);
            
            return { success: true, token: await user.getIdToken(), player: player || INITIAL_PLAYER };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    // REGISTER
    register: async (username: string, callsign: string, pass: string): Promise<AuthResponse> => {
        if (!isConfigured) {
            return { 
                success: true, 
                token: 'mock-token', 
                player: { ...INITIAL_PLAYER, name: callsign, username: username, id: 'offline-user' } 
            };
        }

        try {
            const email = `${username}@shootorshield.game`;
            const userCred = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCred.user;
            
            await firebaseUpdateProfile(user, { displayName: callsign });

            // Initialize DB Entry
            const newPlayer: PlayerStats = {
                ...INITIAL_PLAYER,
                id: user.uid,
                username: username,
                name: callsign,
                lastLogin: Date.now()
            };
            
            await dataService.saveProfile(newPlayer);
            
            return { success: true, token: await user.getIdToken(), player: newPlayer };
        } catch (error: any) {
             return { success: false, message: error.message };
        }
    },
    
    // GOOGLE LOGIN (Optional)
    signInWithGoogle: async (): Promise<AuthResponse> => {
        if (!isConfigured) throw new Error("Firebase not configured");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Check if exists
            let player = await dataService.loadProfile(user.uid);
            
            if (!player) {
                // First time setup
                player = {
                    ...INITIAL_PLAYER,
                    id: user.uid,
                    username: user.email?.split('@')[0] || 'agent',
                    name: user.displayName || 'Agent',
                    lastLogin: Date.now()
                };
                await dataService.saveProfile(player);
            }
            
            return { success: true, token: await user.getIdToken(), player };
        } catch (error: any) {
            throw new Error(error.message);
        }
    },

    logout: async () => {
        if (auth) await auth.signOut();
        localStorage.removeItem('sos_user_cache');
    },

    getRememberMe: () => localStorage.getItem('sos_remember') === 'true',
    setRememberMe: (val: boolean) => localStorage.setItem('sos_remember', String(val)),
    getCachedPlayer: () => {
        const data = localStorage.getItem('sos_user_cache');
        return data ? JSON.parse(data) : null;
    }
};

// --- DATA SERVICE (Database) ---

export const dataService = {
    
    saveProfile: async (player: PlayerStats) => {
        // Always save to local cache first (Instant UI updates)
        localStorage.setItem('sos_user_cache', JSON.stringify(player));

        if (!isConfigured || !auth?.currentUser) return;

        try {
            await setDoc(doc(db, "users", player.id), player, { merge: true });
        } catch (e) {
            console.error("Cloud Save Failed:", e);
        }
    },

    loadProfile: async (userId: string): Promise<PlayerStats | null> => {
        if (!isConfigured || !auth?.currentUser) return null;

        try {
            const docRef = doc(db, "users", userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data() as PlayerStats;
                // Merge with initial structure to ensure new game fields exist on old accounts
                return { ...INITIAL_PLAYER, ...data };
            }
        } catch (e) {
            console.error("Cloud Load Failed:", e);
        }
        return null;
    }
};
