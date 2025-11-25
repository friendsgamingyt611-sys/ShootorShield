

import { Friend, PlayerProfile, PlayerStats, RelationshipStatus } from '../types';
import { PLAYSTYLE_TAGS } from '../constants';
import { authService } from './auth';

const FRIENDS_KEY = 'shoot_or_shield_friends';

class SocialService {
    private friends: Map<string, Friend> = new Map();
    private friendUsernames: Set<string> = new Set(); 

    constructor() {
        this.loadFriends();
    }

    private loadFriends() {
        const stored = localStorage.getItem(FRIENDS_KEY);
        if (stored) {
            const list: Friend[] = JSON.parse(stored);
            this.friends = new Map(list.map(f => [f.id, f]));
            this.updateUsernamesSet();
        }
    }

    private saveFriends() {
        localStorage.setItem(FRIENDS_KEY, JSON.stringify(Array.from(this.friends.values())));
        this.updateUsernamesSet();
    }

    private updateUsernamesSet() {
        this.friendUsernames = new Set(
            Array.from(this.friends.values())
            .map(f => f.username || f.id.replace('sos_player_', ''))
        );
    }

    // --- Public Getters ---

    public getFriendsList(): Friend[] {
        return Array.from(this.friends.values());
    }

    public getConfirmedFriends(): Friend[] {
        return Array.from(this.friends.values()).filter(f => f.relationship === 'FRIEND');
    }

    public getPendingIncoming(): Friend[] {
        return Array.from(this.friends.values()).filter(f => f.relationship === 'PENDING_INCOMING');
    }

    public getPendingOutgoing(): Friend[] {
        return Array.from(this.friends.values()).filter(f => f.relationship === 'PENDING_OUTGOING');
    }

    public getFriendUsernames(): string[] {
        // Return usernames of anyone we have any relation with to attempt connections
        return Array.from(this.friendUsernames);
    }

    public getRelationship(id: string): RelationshipStatus {
        return this.friends.get(id)?.relationship || 'NONE';
    }

    // --- Friendship Logic ---

    // 1. Send Request (Outgoing)
    public sendFriendRequest(target: { id: string, name: string, username?: string, avatarId?: string, customAvatar?: string }) {
        if (this.friends.has(target.id) && this.friends.get(target.id)?.relationship === 'FRIEND') return;

        const friend: Friend = {
            id: target.id,
            name: target.name,
            username: target.username || target.id.replace('sos_player_', ''),
            level: 1, // Will update when we see them online
            avatarId: target.avatarId || 'c1',
            customAvatar: target.customAvatar,
            status: 'OFFLINE', // Assume offline until connected
            relationship: 'PENDING_OUTGOING',
            lastSeen: Date.now()
        };
        
        this.friends.set(target.id, friend);
        this.saveFriends();
    }

    // 2. Receive Request (Incoming)
    public receiveFriendRequest(sender: { id: string, name: string, username?: string, avatarId?: string, customAvatar?: string }) {
        if (this.friends.has(sender.id)) {
            // If we already sent one, auto-friend (race condition handling)
            if (this.friends.get(sender.id)?.relationship === 'PENDING_OUTGOING') {
                this.updateRelationship(sender.id, 'FRIEND');
                return;
            }
            if (this.friends.get(sender.id)?.relationship === 'FRIEND') return;
        }

        const friend: Friend = {
            id: sender.id,
            name: sender.name,
            username: sender.username || sender.id.replace('sos_player_', ''),
            level: 1,
            avatarId: sender.avatarId || 'c1',
            customAvatar: sender.customAvatar,
            status: 'ONLINE', // They just sent a request, so they are online
            relationship: 'PENDING_INCOMING',
            lastSeen: Date.now()
        };

        this.friends.set(sender.id, friend);
        this.saveFriends();
    }

    // 3. Accept Request
    public acceptFriendRequest(id: string) {
        if (this.friends.has(id)) {
            this.updateRelationship(id, 'FRIEND');
        }
    }

    // 4. Decline / Remove / Cancel
    public removeFriend(id: string) {
        if (this.friends.has(id)) {
            this.friends.delete(id);
            this.saveFriends();
        }
    }

    // 5. Helpers for UI/Engine calls
    public addFriend(profile: PlayerProfile) {
        this.sendFriendRequest({
            id: profile.id,
            name: profile.name,
            avatarId: profile.avatarId,
            customAvatar: profile.customAvatar
        });
    }

    public addFriendByUsername(username: string) {
        // Basic sanitization to match auth logic
        const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const id = `sos_player_${sanitized}`;
        this.sendFriendRequest({
            id: id,
            name: username,
            username: sanitized
        });
    }

    // --- Updates ---

    public updateRelationship(id: string, status: RelationshipStatus) {
        const f = this.friends.get(id);
        if (f) {
            f.relationship = status;
            this.friends.set(id, f);
            this.saveFriends();
        }
    }

    public updateFriendStatus(id: string, status: 'ONLINE' | 'IN_GAME' | 'OFFLINE' | 'LOBBY', lobbyCode?: string) {
        const f = this.friends.get(id);
        if (f) {
            f.status = status;
            f.lastSeen = Date.now();
            f.currentLobby = lobbyCode;
            this.friends.set(id, f);
            // We don't save ephemeral status to local storage to avoid showing old status on reload
        }
    }

    public updateFriendProfile(id: string, profile: Partial<Friend>) {
        const f = this.friends.get(id);
        if (f) {
            this.friends.set(id, { ...f, ...profile });
            this.saveFriends();
        }
    }

    // --- Profile Generation & Social Graph ---

    public getProfileFor(player: PlayerStats): PlayerProfile {
        const kd = 0.5 + (Math.random() * 2.5); 
        
        // Tags generation
        const tags = [];
        const shuffledTags = [...PLAYSTYLE_TAGS].sort(() => 0.5 - Math.random());
        tags.push(shuffledTags[0].label);

        // Calculate stats based on local friend list
        const confirmedFriends = this.getConfirmedFriends();

        return {
            id: player.id,
            name: player.name,
            level: player.level,
            elo: player.elo,
            avatarId: player.character.id,
            customAvatar: player.customAvatar,
            tags: tags,
            relationship: 'NONE', // Self
            stats: {
                matchesPlayed: player.totalMatchesPlayed > 0 ? player.totalMatchesPlayed : 0,
                winRate: player.totalMatchesPlayed > 0 ? Math.round((player.matchesWon / player.totalMatchesPlayed) * 100) : 0,
                kdRatio: parseFloat(kd.toFixed(2)),
                headshotRate: Math.floor(20 + Math.random() * 40)
            },
            status: 'ONLINE',
            social: {
                friendsCount: confirmedFriends.length,
                mutualsCount: 0
            }
        };
    }

    // Logic to calculate mutual friends when viewing another profile
    public calculateMutuals(myFriends: Friend[], theirFriendsIDs: string[]): number {
        const myFriendIDs = new Set(myFriends.map(f => f.id));
        return theirFriendsIDs.filter(id => myFriendIDs.has(id)).length;
    }
}

export const socialService = new SocialService();
