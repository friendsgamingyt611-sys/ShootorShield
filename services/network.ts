
import { Peer, DataConnection } from "peerjs";
import { NetworkPacket, PacketType } from "../types";

// Advanced P2P Service handling multiple connections
class P2PService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map(); // Map PeerID -> Connection
  private onDataCallback: ((data: NetworkPacket, senderId: string) => void) | null = null;
  private onConnectCallback: ((peerId: string) => void) | null = null;
  private onDisconnectCallback: ((peerId: string) => void) | null = null;
  public myPeerId: string = '';

  constructor() {}

  // Initialize as HOST
  public async hostGame(): Promise<string> {
    return new Promise((resolve, reject) => {
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      this.peer = new Peer(randomId, { debug: 1 });

      this.peer.on('open', (id) => {
        console.log('Hosted Room: ' + id);
        this.myPeerId = id;
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      this.peer.on('error', (err) => reject(err));
      
      // Handle critical peer errors or closure
      this.peer.on('close', () => {
          this.disconnect();
      });
    });
  }

  // Initialize as CLIENT (Join)
  public async joinGame(hostId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.peer = new Peer(randomId);

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        if (!this.peer) return;
        const conn = this.peer.connect(hostId);
        this.handleConnection(conn);
        
        conn.on('open', () => {
          resolve(true);
        });
        
        // If connection fails immediately
        setTimeout(() => {
            if (!conn.open) resolve(false);
        }, 5000);
      });
      
      this.peer.on('error', (err) => {
          console.error("Peer Error", err);
          resolve(false);
      });
    });
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log("New Connection:", conn.peer);
      this.connections.set(conn.peer, conn);
      if (this.onConnectCallback) this.onConnectCallback(conn.peer);
    });

    conn.on('data', (data) => {
      if (this.onDataCallback) {
        // Inject sender ID if missing to ensure authenticity
        const packet = data as NetworkPacket;
        this.onDataCallback(packet, conn.peer);
      }
    });

    const closeHandler = () => {
      console.log("Connection closed:", conn.peer);
      if (this.connections.has(conn.peer)) {
          this.connections.delete(conn.peer);
          if (this.onDisconnectCallback) this.onDisconnectCallback(conn.peer);
      }
    };

    conn.on('close', closeHandler);
    
    // Sometimes 'close' doesn't fire on network error, 'error' might
    conn.on('error', (err) => {
        console.error("Conn Error:", err);
        closeHandler();
    });
    
    // Monitor connection state in case events fail
    conn.peerConnection.oniceconnectionstatechange = () => {
        if (conn.peerConnection.iceConnectionState === 'disconnected' || conn.peerConnection.iceConnectionState === 'failed' || conn.peerConnection.iceConnectionState === 'closed') {
            closeHandler();
        }
    };
  }

  // Send to a specific peer
  public sendTo(peerId: string, type: PacketType, payload: any) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send({ type, payload, senderId: this.myPeerId } as NetworkPacket);
    }
  }

  // Broadcast to ALL connected peers (Host function)
  public broadcast(type: PacketType, payload: any) {
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send({ type, payload, senderId: this.myPeerId } as NetworkPacket);
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
    this.connections.forEach(c => {
        try { c.close(); } catch(e) {}
    });
    this.connections.clear();
    
    if (this.peer) {
        try { this.peer.destroy(); } catch(e) {}
    }
    this.peer = null;
    
    // Clear callbacks to prevent zombie execution
    this.onDataCallback = null;
    this.onConnectCallback = null;
    this.onDisconnectCallback = null;
  }
}

export const NetworkService = new P2PService();
