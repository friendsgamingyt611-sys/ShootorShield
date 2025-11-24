
import { Friend, PlayerProfile, PlayerStats } from '../types';
import { CHARACTERS, PLAYSTYLE_TAGS } from '../constants';

const FRIENDS_KEY = 'shoot_or_shield_friends';

class SocialService {
    private friends: Friend[] = [];

    constructor() {
        this.loadFriends();
    }

    private loadFriends() {
        const stored = localStorage.getItem(FRIENDS_KEY);
        if (stored) {
            this.friends = JSON.parse(stored);
        } else {
            // Initial mock friends for demo purposes
            this.friends = [
                { id: 'f1', name: 'CyberNinja', level: 15, status: 'ONLINE', lastSeen: Date.now(), avatarId: 'c1' },
                { id: 'f2', name: 'TankGurl', level: 8, status: 'IN_GAME', lastSeen: Date.now(), avatarId: 'c2' },
                { id: 'f3', name: 'ZeroCool', level: 22, status: 'OFFLINE', lastSeen: Date.now() - 3600000, avatarId: 'c3' }
            ];
            this.saveFriends();
        }
    }

    private saveFriends() {
        localStorage.setItem(FRIENDS_KEY, JSON.stringify(this.friends));
    }

    public getFriends(): Friend[] {
        return this.friends;
    }

    public addFriend(profile: PlayerProfile) {
        if (this.friends.some(f => f.id === profile.id)) return;
        
        const newFriend: Friend = {
            id: profile.id,
            name: profile.name,
            level: profile.level,
            status: 'ONLINE',
            lastSeen: Date.now(),
            avatarId: profile.avatarId,
            customAvatar: profile.customAvatar
        };
        
        this.friends.push(newFriend);
        this.saveFriends();
    }

    public removeFriend(id: string) {
        this.friends = this.friends.filter(f => f.id !== id);
        this.saveFriends();
    }

    public isFriend(id: string): boolean {
        return this.friends.some(f => f.id === id);
    }

    // Generates a profile for a player (local or remote)
    public getProfileFor(player: PlayerStats): PlayerProfile {
        const kd = 0.5 + (Math.random() * 2.5); // 0.5 - 3.0
        const wr = 40 + (Math.random() * 30); // 40% - 70%
        
        // Assign random tags
        const tags = [];
        const shuffledTags = [...PLAYSTYLE_TAGS].sort(() => 0.5 - Math.random());
        tags.push(shuffledTags[0].label);
        if (Math.random() > 0.5) tags.push(shuffledTags[1].label);

        return {
            id: player.id,
            name: player.name,
            level: player.level,
            elo: player.elo,
            avatarId: player.character.id,
            customAvatar: player.customAvatar,
            tags: tags,
            stats: {
                matchesPlayed: 10 + (player.level * 5) + Math.floor(Math.random() * 50),
                winRate: Math.floor(wr),
                kdRatio: parseFloat(kd.toFixed(2)),
                headshotRate: Math.floor(20 + Math.random() * 40)
            },
            isFriend: this.isFriend(player.id),
            status: 'ONLINE'
        };
    }

    // Mock Server List Generator
    public generateMockServers(region: string) {
        const modes = ['1v1', '2v2', '4v4', 'CUSTOM'];
        const servers = [];
        const count = 5 + Math.floor(Math.random() * 10);

        for (let i = 0; i < count; i++) {
            const mode = modes[Math.floor(Math.random() * modes.length)];
            const maxPlayers = mode === 'CUSTOM' ? 8 : parseInt(mode[0]) * 2;
            const currentPlayers = Math.floor(Math.random() * maxPlayers);
            const rounds = [3, 5, 7][Math.floor(Math.random() * 3)];
            
            servers.push({
                id: `srv_${Math.random().toString(36).substr(2,5)}`,
                host: `Host_${Math.random().toString(36).substr(2,4)}`,
                mode: mode,
                rounds: rounds,
                players: currentPlayers,
                max: maxPlayers,
                ping: 20 + Math.floor(Math.random() * 80),
                region: region,
                isLocked: Math.random() > 0.8
            });
        }
        return servers.sort((a,b) => a.ping - b.ping);
    }
}

export const socialService = new SocialService();
