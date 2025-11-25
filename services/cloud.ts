
import { PlayerStats, AuthResponse } from "../types";
import { authService } from "./auth";
import { playerService } from "./playerService";

// This service now acts as a bridge to the Firebase Plugin
// Keeping the same method signatures so the rest of the app doesn't break

export class CloudService {
    
    public async register(username: string, callsign: string, pass: string): Promise<AuthResponse> {
        return await authService.register(username, callsign, pass);
    }

    public async login(username: string, pass: string): Promise<AuthResponse> {
        return await authService.login(username, pass);
    }

    public async updateCallsign(token: string, newCallsign: string): Promise<boolean> {
        const player = authService.getCachedPlayer();
        if (player) {
            player.name = newCallsign;
            await playerService.saveProfile(player);
            return true;
        }
        return false;
    }

    public async syncProfile(player: PlayerStats, token: string): Promise<boolean> {
        await playerService.saveProfile(player);
        return true;
    }

    public async getProfile(token: string): Promise<PlayerStats | null> {
        // In the new architecture, we verify session via Firebase Auth state
        // For simplicity, we return the cached player or wait for auth state
        return authService.getCachedPlayer();
    }

    public async unlockAchievement(playerId: string, achievementId: string, token: string): Promise<boolean> {
        const player = authService.getCachedPlayer();
        if (player) {
             // Logic handled in playerService, eventually calls syncProfile
             return true;
        }
        return false;
    }
}

export const cloudService = new CloudService();
