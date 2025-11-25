
import { PlayerStats, AuthResponse } from "../types";
import { INITIAL_PLAYER } from "../constants";

// --- LOCAL AUTHENTICATION SYSTEM ---
// Stores user accounts in browser LocalStorage ("sos_accounts").
// Simulates a full backend auth experience without API keys.

const ACCOUNTS_KEY = 'sos_accounts';
const SESSION_KEY = 'sos_current_session';

class LocalAuthService {

    // Helper: Get all accounts
    private getAccounts(): Record<string, { profile: PlayerStats, passwordHash: string }> {
        const data = localStorage.getItem(ACCOUNTS_KEY);
        return data ? JSON.parse(data) : {};
    }

    // Helper: Save accounts
    private saveAccounts(accounts: Record<string, { profile: PlayerStats, passwordHash: string }>) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    // Sanitizer for PeerID compatibility (only alphanumeric and hyphens)
    public sanitizeUsername(username: string): string {
        return username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    // LOGIN
    public async login(username: string, pass: string): Promise<AuthResponse> {
        // Simulate network delay for realism
        await new Promise(r => setTimeout(r, 500));

        const accounts = this.getAccounts();
        const normalizedUser = this.sanitizeUsername(username);
        const account = accounts[normalizedUser];

        if (!account) {
            return { success: false, message: "Operative not found in local database." };
        }

        if (account.passwordHash !== pass) {
            return { success: false, message: "Invalid security credentials." };
        }

        this.startSession(account.profile);
        return { success: true, token: 'local-token-' + Date.now(), player: account.profile };
    }

    // REGISTER
    public async register(username: string, callsign: string, pass: string): Promise<AuthResponse> {
        await new Promise(r => setTimeout(r, 800));

        const accounts = this.getAccounts();
        const normalizedUser = this.sanitizeUsername(username);

        if (accounts[normalizedUser]) {
            return { success: false, message: "Username already registered locally." };
        }

        const newPlayer: PlayerStats = {
            ...INITIAL_PLAYER,
            id: `sos_player_${normalizedUser}`, // Deterministic ID for P2P Friend Discovery
            username: normalizedUser,
            name: callsign,
            lastLogin: Date.now()
        };

        accounts[normalizedUser] = {
            profile: newPlayer,
            passwordHash: pass
        };

        this.saveAccounts(accounts);
        this.startSession(newPlayer);

        return { success: true, token: 'local-token-' + Date.now(), player: newPlayer };
    }

    // SESSION MANAGEMENT
    private startSession(player: PlayerStats) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(player));
        localStorage.setItem('sos_user_cache', JSON.stringify(player));
    }

    public logout() {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('sos_user_cache');
        window.location.reload();
    }

    public getCurrentUser() {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        const p = JSON.parse(session);
        return { uid: p.id, email: p.username, displayName: p.name };
    }

    public isAuthenticated(): boolean {
        return !!localStorage.getItem(SESSION_KEY);
    }

    // DATA PERSISTENCE
    public async saveToCloud(player: PlayerStats) {
        const accounts = this.getAccounts();
        if (player.username && accounts[player.username]) {
            accounts[player.username].profile = player;
            this.saveAccounts(accounts);
        }
    }

    public getCachedPlayer(): PlayerStats | null {
        const saved = localStorage.getItem(SESSION_KEY);
        return saved ? JSON.parse(saved) : null;
    }

    public getRememberMe(): boolean {
        return localStorage.getItem('sos_remember') === 'true';
    }

    public setRememberMe(val: boolean) {
        localStorage.setItem('sos_remember', String(val));
    }
}

export const authService = new LocalAuthService();
