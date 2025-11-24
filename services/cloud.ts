
import { PlayerStats, AuthResponse } from "../types";

// REAL BACKEND INTEGRATION
const BASE_URL = '/.netlify/functions/api';

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

    public async register(username: string, callsign: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, callsign, password })
            });
            const data = await response.json();
            // Map 409 to friendly message if not present
            if (response.status === 409 && !data.message) {
                 return { success: false, message: "Username or Callsign already taken." };
            }
            return data;
        } catch (error) {
            console.error("Registration Error:", error);
            return { success: false, message: "Network error during registration." };
        }
    }

    public async login(username: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${BASE_URL}/login`, {
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
        // Callsign updates happen via sync now for simplicity, or we can add a dedicated endpoint.
        // The sync endpoint updates callsign if name changed in payload.
        return true; 
    }

    public async syncProfile(player: PlayerStats, token: string): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}/sync`, {
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
            const response = await fetch(`${BASE_URL}/profile`, {
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
        // Handled via profile sync in this architecture
        return true;
    }
}

export const cloudService = new CloudService();
