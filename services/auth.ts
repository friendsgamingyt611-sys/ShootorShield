
import { cloudService } from "./cloud";
import { PlayerStats, AuthResponse } from "../types";
import { INITIAL_PLAYER } from "../constants";

const TOKEN_KEY = 'sos_auth_token';
const USER_KEY = 'sos_user_cache';
const REMEMBER_KEY = 'sos_remember_me';

class AuthService {
    private token: string | null = null;
    private rememberMe: boolean = false;

    constructor() {
        // Restore state on load
        this.rememberMe = localStorage.getItem(REMEMBER_KEY) === 'true';
        
        if (this.rememberMe) {
            this.token = localStorage.getItem(TOKEN_KEY);
        } else {
            this.token = sessionStorage.getItem(TOKEN_KEY);
        }
    }

    public getToken(): string | null {
        return this.token;
    }

    public getRememberMe(): boolean {
        return this.rememberMe;
    }

    public setRememberMe(value: boolean) {
        this.rememberMe = value;
        localStorage.setItem(REMEMBER_KEY, String(value));
        
        // Move token to correct storage
        if (this.token) {
            if (value) {
                localStorage.setItem(TOKEN_KEY, this.token);
                sessionStorage.removeItem(TOKEN_KEY);
            } else {
                sessionStorage.setItem(TOKEN_KEY, this.token);
                localStorage.removeItem(TOKEN_KEY);
            }
        }
    }

    public async login(username: string, pass: string): Promise<AuthResponse> {
        const res = await cloudService.login(username, pass);
        if (res.success && res.token && res.player) {
            this.handleSessionStart(res.token, res.player);
        }
        return res;
    }

    public async register(username: string, callsign: string, pass: string): Promise<AuthResponse> {
        const res = await cloudService.register(username, callsign, pass);
        if (res.success && res.token && res.player) {
            this.handleSessionStart(res.token, res.player);
        }
        return res;
    }

    private handleSessionStart(token: string, player: PlayerStats) {
        this.token = token;
        if (this.rememberMe) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            sessionStorage.setItem(TOKEN_KEY, token);
        }
        // Cache initial player state
        localStorage.setItem(USER_KEY, JSON.stringify(player));
    }

    public logout() {
        this.token = null;
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.reload();
    }

    // Check if session is valid by fetching profile
    public async validateSession(): Promise<PlayerStats | null> {
        if (!this.token) return null;
        const player = await cloudService.getProfile(this.token);
        if (!player) {
            this.logout(); // Token invalid
            return null;
        }
        return player;
    }
    
    // Get cached player for instant load (optimistic)
    public getCachedPlayer(): PlayerStats | null {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    }
}

export const authService = new AuthService();
