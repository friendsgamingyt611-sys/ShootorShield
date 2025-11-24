
import { PlayerStats, AuthResponse } from "../types";

// REAL BACKEND INTEGRATION
// This service now makes actual HTTP requests to the Netlify Functions which interact with Neon DB.
const BASE_URL = '/.netlify/functions';

export class CloudService {
    
    private getHeaders(token?: string) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- AUTHENTICATION ---

    public async register(username: string, callsign: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${BASE_URL}/auth-register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, callsign, password })
            });
            return await response.json();
        } catch (error) {
            console.error("Registration Error:", error);
            return { success: false, message: "Network error during registration." };
        }
    }

    public async login(username: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${BASE_URL}/auth-login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: "Network error during login." };
        }
    }

    public async updateCallsign(token: string, newCallsign: string): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}/player-update-callsign`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({ callsign: newCallsign })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            return false;
        }
    }

    public async syncProfile(player: PlayerStats, token: string): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}/player-sync`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({ playerData: player })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.warn("Sync failed:", error);
            return false;
        }
    }

    public async getProfile(token: string): Promise<PlayerStats | null> {
        try {
            const response = await fetch(`${BASE_URL}/player-profile`, {
                method: 'GET',
                headers: this.getHeaders(token)
            });
            const data = await response.json();
            if (data.success && data.player) {
                return data.player;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    public async unlockAchievement(playerId: string, achievementId: string, token: string): Promise<boolean> {
        try {
            // Fire and forget, usually
            fetch(`${BASE_URL}/achievement-unlock`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({ playerId, achievementId })
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}

export const cloudService = new CloudService();
