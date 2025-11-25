
import { MatchType } from '../types';

export interface LobbyInfo {
    id: string; 
    host: string;
    mode: MatchType;
    players: number;
    max: number;
    region: string;
    isLocked: boolean;
    ping?: number;
    createdAt: number;
}

const RECENT_LOBBIES_KEY = 'sos_recent_lobbies';

// --- LOCAL LOBBY SERVICE ---
// Since we removed the central database (Firebase), we can't have a "Global Server Browser".
// This service now manages "Recent Rooms" you have joined, stored locally.
// Multiplayer is done by sharing Room Codes directly.

class LobbyService {
    
    private getRecents(): LobbyInfo[] {
        const data = localStorage.getItem(RECENT_LOBBIES_KEY);
        return data ? JSON.parse(data) : [];
    }

    private saveRecents(lobbies: LobbyInfo[]) {
        // Keep last 10
        const trimmed = lobbies.slice(0, 10);
        localStorage.setItem(RECENT_LOBBIES_KEY, JSON.stringify(trimmed));
    }

    public async registerLobby(
        roomCode: string, 
        hostName: string, 
        matchType: MatchType, 
        maxPlayers: number,
        region: string,
        isPrivate: boolean
    ) {
        // In P2P mode, "registering" just means adding it to your own recent history so you can see it
        // We don't broadcast to a global list anymore.
        const lobby: LobbyInfo = {
            id: roomCode,
            host: hostName,
            mode: matchType,
            players: 1,
            max: maxPlayers,
            region: region,
            isLocked: isPrivate,
            createdAt: Date.now(),
            ping: 0
        };
        
        this.addToHistory(lobby);
    }

    public async updateLobbyCount(roomCode: string, count: number) {
        // No-op in local mode
    }

    public async removeLobby(roomCode: string) {
        // No-op in local mode
    }

    public addToHistory(lobby: LobbyInfo) {
        const recents = this.getRecents().filter(l => l.id !== lobby.id);
        recents.unshift(lobby);
        this.saveRecents(recents);
    }

    public async fetchLobbies(region?: string): Promise<LobbyInfo[]> {
        // Returns local history instead of global server list
        return this.getRecents();
    }
}

export const lobbyService = new LobbyService();
