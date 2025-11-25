
import { PlayerStats } from "../types";
import { INITIAL_PLAYER } from "../constants";
import { authService as firebaseAuth, dataService } from "./firebase";

// "Plug-and-Play" Auth Service
// Works offline via LocalStorage immediately (Vercel friendly)
// Upgrades to Firebase Cloud Save automatically if API Keys are provided.

class AuthService {
    
    public openLogin() {
        // Trigger generic UI event that App.tsx or AuthScreen listens to if needed
        // For now, we rely on the custom AuthModal in UI
    }

    public openSignup() {
        // Trigger generic UI event
    }

    public logout() {
        localStorage.removeItem('sos_user_cache');
        firebaseAuth.logout();
        window.location.reload();
    }

    public getCurrentUser() {
        return firebaseAuth.getUser();
    }

    public isAuthenticated(): boolean {
        // If we have a cached user, we consider them "logged in" for offline play
        // If we have a firebase user, they are "cloud logged in"
        return !!localStorage.getItem('sos_user_cache');
    }

    public getRememberMe(): boolean {
        return localStorage.getItem('sos_remember') === 'true';
    }

    public setRememberMe(val: boolean) {
        localStorage.setItem('sos_remember', String(val));
    }

    // Syncs local player stats to Cloud (if connected)
    public async saveToCloud(player: PlayerStats) {
        if (firebaseAuth.isAuthenticated()) {
            await dataService.saveProfile(player);
        }
    }

    // Loads player from Cloud (if connected) or LocalStorage
    public getCachedPlayer(): PlayerStats | null {
        const saved = localStorage.getItem('sos_user_cache');
        return saved ? JSON.parse(saved) : null;
    }
}

export const authService = new AuthService();
