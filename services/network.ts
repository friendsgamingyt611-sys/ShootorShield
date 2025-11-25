
import { Peer, DataConnection } from "peerjs";
import { NetworkPacket, PacketType, PlayerStats, PlayerProfile, Friend } from "../types";
import { socialService } from "./socialService";
import { authService } from "./auth";
import { playerService } from "./playerService";

// Packet for Social Updates
interface SocialPacket {
    type: 'SOCIAL_STATUS';
    payload: {
        status: 'ONLINE' | 'IN_GAME' | 'OFFLINE' | 'LOBBY';
        lobbyCode?: string;
        profile: PlayerProfile;
    };
    senderId: string;
}

class P2PService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onDataCallback: ((data: NetworkPacket, senderId: string) => void) | null = null;
  private onConnectCallback: ((peerId: string) => void) | null = null;
  private onDisconnectCallback: ((peerId: string) => void) | null = null;
  
  public myPeerId: string = '';
  private myStatus: 'ONLINE' | 'IN_GAME' | 'OFFLINE' | 'LOBBY' = 'ONLINE';
  private currentLobbyCode?: string;

  constructor() {}

  // Initialize Network with Deterministic ID
  public async initialize(username: string): Promise<string> {
      if (this.peer) return this.myPeerId;

      const sanitizedId = `sos_player_${authService.sanitizeUsername(username)}`;
      
      return new Promise((resolve, reject) => {
          this.peer = new Peer(sanitizedId, { 
              debug: 1,
              config: {
                 iceServers: [
                     { urls: 'stun:stun.l.google.com:19302' },
                     { urls: 'stun:global.stun.twilio.com:3478' }
                 ]
              }
          });

          this.peer.on('open', (id) => {
              console.log('⚡ NETWORK ONLINE: ' + id);
              this.myPeerId = id;
              this.connectToFriends(); // Auto-connect to friends on startup
              resolve(id);
          });

          this.peer.on('connection', (conn) => {
              this.handleConnection(conn);
          });

          this.peer.on('error', (err) => {
              console.warn("Peer Warning:", err);
              // resolve anyway so game doesn't block, just means offline mode
              resolve(sanitizedId); 
          });
      });
  }

  // Attempt to connect to all known friends (and pending ones)
  public connectToFriends() {
      const friendUsernames = socialService.getFriendUsernames();
      friendUsernames.forEach(username => {
          const friendPeerId = `sos_player_${username}`;
          if (!this.connections.has(friendPeerId) && friendPeerId !== this.myPeerId) {
              this.connectToPeer(friendPeerId, true);
          }
      });
  }

  public connectToPeer(peerId: string, isSocial: boolean = false) {
      if (!this.peer) return;
      
      try {
          const conn = this.peer.connect(peerId, { reliable: true });
          this.handleConnection(conn, isSocial);
      } catch (e) {
          console.log("Could not connect to " + peerId);
      }
  }

  private handleConnection(conn: DataConnection, isSocial: boolean = false) {
    conn.on('open', () => {
      console.log("Connected to:", conn.peer);
      this.connections.set(conn.peer, conn);

      if (this.onConnectCallback) {
          this.onConnectCallback(conn.peer);
      }

      // Immediately send my status
      this.sendSocialStatus(conn.peer);
    });

    conn.on('data', (data: any) => {
       const packet = data as NetworkPacket;
       
       switch(packet.type) {
           case 'SOCIAL_STATUS':
               // Update Friend Status in UI
               const p = packet.payload as any;
               socialService.updateFriendStatus(conn.peer, p.status, p.lobbyCode);
               // Also check if we need to update profile data (avatar etc)
               if (p.profile) {
                   socialService.updateFriendProfile(conn.peer, {
                       name: p.profile.name,
                       avatarId: p.profile.avatarId,
                       customAvatar: p.profile.customAvatar
                   });
               }
               break;

           case 'FRIEND_REQUEST':
               const senderProfile = packet.payload.profile;
               socialService.receiveFriendRequest({
                   id: conn.peer,
                   name: senderProfile.name,
                   avatarId: senderProfile.avatarId,
                   customAvatar: senderProfile.customAvatar
               });
               // Auto reply with status to ensure handshake complete
               this.sendSocialStatus(conn.peer);
               break;

           case 'FRIEND_ACCEPT':
               socialService.acceptFriendRequest(conn.peer);
               break;

           case 'FRIEND_DECLINE':
           case 'FRIEND_REMOVE':
               socialService.removeFriend(conn.peer);
               break;

           case 'SOCIAL_GRAPH_REQUEST':
               // Someone wants to see my friends list (for "Mutuals" logic)
               this.sendSocialGraph(conn.peer);
               break;

           case 'SOCIAL_GRAPH_RESPONSE':
               // Received a graph, this would be handled by the UI callback usually, 
               // but we can also emit it to a specific listener if we had one.
               // For simplicity, we assume the UI polls or listens to generic data for now,
               // or we store it in a temporary cache in socialService?
               // Let's rely on the onDataCallback to bubble this up to the Inspector component.
               break;

           default:
               // Game Packet
               if (this.onDataCallback) {
                   this.onDataCallback(packet as NetworkPacket, conn.peer);
               }
       }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      socialService.updateFriendStatus(conn.peer, 'OFFLINE');
      if (this.onDisconnectCallback) {
          this.onDisconnectCallback(conn.peer);
      }
    });
    
    conn.on('error', () => {
        this.connections.delete(conn.peer);
        socialService.updateFriendStatus(conn.peer, 'OFFLINE');
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback(conn.peer);
        }
    });
  }

  // --- Actions ---

  public sendFriendRequest(targetPeerId: string) {
      const player = authService.getCachedPlayer();
      if (!player) return;
      
      const profile = socialService.getProfileFor(player);
      
      // Attempt connection if not exists
      if (!this.connections.has(targetPeerId)) {
          this.connectToPeer(targetPeerId);
          // Wait slightly for connection to open then send
          setTimeout(() => {
              this.sendTo(targetPeerId, 'FRIEND_REQUEST', { profile });
          }, 1000);
      } else {
          this.sendTo(targetPeerId, 'FRIEND_REQUEST', { profile });
      }

      // Update local state
      socialService.sendFriendRequest({ id: targetPeerId, name: 'Unknown' }); // Name will update on connect
  }

  public acceptFriendRequest(targetPeerId: string) {
      socialService.acceptFriendRequest(targetPeerId);
      this.sendTo(targetPeerId, 'FRIEND_ACCEPT', {});
  }

  public removeFriend(targetPeerId: string) {
      socialService.removeFriend(targetPeerId);
      this.sendTo(targetPeerId, 'FRIEND_REMOVE', {});
  }

  public requestSocialGraph(targetPeerId: string) {
      this.sendTo(targetPeerId, 'SOCIAL_GRAPH_REQUEST', {});
  }

  private sendSocialGraph(targetPeerId: string) {
      const friends = socialService.getConfirmedFriends().map(f => ({
          id: f.id,
          name: f.name,
          avatarId: f.avatarId
      }));
      this.sendTo(targetPeerId, 'SOCIAL_GRAPH_RESPONSE', { friends });
  }

  // --- Game Hosting ---
  public async hostGame(): Promise<string> {
      if (!this.peer) throw new Error("Network not initialized");
      this.myStatus = 'LOBBY';
      this.currentLobbyCode = this.myPeerId;
      this.broadcastSocialStatus();
      return this.myPeerId;
  }

  public async joinGame(hostId: string): Promise<boolean> {
      if (!this.peer) return false;
      
      if (!this.connections.has(hostId)) {
          this.connectToPeer(hostId);
          await new Promise(r => setTimeout(r, 1000));
      }
      
      const conn = this.connections.get(hostId);
      return !!conn && conn.open;
  }

  public setStatus(status: 'ONLINE' | 'IN_GAME' | 'OFFLINE' | 'LOBBY', lobbyCode?: string) {
      this.myStatus = status;
      this.currentLobbyCode = lobbyCode;
      this.broadcastSocialStatus();
  }

  private sendSocialStatus(targetPeerId: string) {
      const player = authService.getCachedPlayer();
      if (!player) return;
      
      const profile = socialService.getProfileFor(player);

      this.sendTo(targetPeerId, 'SOCIAL_STATUS' as any, {
          status: this.myStatus,
          lobbyCode: this.currentLobbyCode,
          profile: profile
      });
  }

  private broadcastSocialStatus() {
      this.connections.forEach((conn, peerId) => {
          this.sendSocialStatus(peerId);
      });
  }

  // --- Standard Messaging ---

  public sendTo(peerId: string, type: PacketType, payload: any) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send({ type, payload, senderId: this.myPeerId });
    }
  }

  public broadcast(type: PacketType, payload: any) {
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send({ type, payload, senderId: this.myPeerId });
      }
    });
  }

  public onData(callback: (data: NetworkPacket, senderId: string) => void) {
    this.onDataCallback = callback;
  }

  public onConnect(callback: (peerId: string) => void) {
      this.onConnectCallback = callback;
  }

  public onDisconnect(callback: (peerId: string) => void) {
      this.onDisconnectCallback = callback;
  }

  public disconnect() {
      this.setStatus('OFFLINE');
      setTimeout(() => {
        this.connections.forEach(c => c.close());
        this.connections.clear();
        if (this.peer) this.peer.destroy();
        this.peer = null;
      }, 500);
  }
}

export const NetworkService = new P2PService();
