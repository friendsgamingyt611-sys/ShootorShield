

import React, { useState, useEffect } from 'react';
import { Wifi, Plus, Globe, Users, Play, AlertTriangle, RefreshCw, UserPlus, PlayCircle, Lock } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { Friend } from '../../types';
import { NetworkService } from '../../services/network';

interface MultiplayerLobbyProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  isConnecting: boolean;
  playerUsername: string;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onCreateRoom, onJoinRoom, isConnecting, playerUsername }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [view, setView] = useState<'FRIENDS' | 'ADD'>('FRIENDS');

  // Poll friend status more frequently in this screen
  useEffect(() => {
      const load = () => setFriends(socialService.getFriendsList());
      load();
      // Force refresh network connections
      NetworkService.connectToFriends();
      const interval = setInterval(load, 2000);
      return () => clearInterval(interval);
  }, []);

  const handleAddFriend = (e: React.FormEvent) => {
      e.preventDefault();
      if (newFriendName.trim()) {
          socialService.addFriendByUsername(newFriendName.trim());
          setNewFriendName('');
          setView('FRIENDS');
          // Trigger connection attempt
          setTimeout(() => NetworkService.connectToFriends(), 500);
      }
  };

  const FriendRow: React.FC<{ friend: Friend }> = ({ friend }) => {
      const isOnline = friend.status !== 'OFFLINE';
      const isLobby = friend.status === 'LOBBY';
      
      return (
          <div className="flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-600 transition-all group">
               <div className="flex items-center gap-4">
                   <div className="relative">
                       <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg text-gray-400 border-2 border-gray-600">
                           {friend.name[0].toUpperCase()}
                       </div>
                       <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-gray-500'}`}></div>
                   </div>
                   <div>
                       <div className="text-white font-bold text-lg">{friend.name}</div>
                       <div className="flex items-center gap-2 text-xs font-mono">
                           <span className={isOnline ? 'text-green-400' : 'text-gray-500'}>{friend.status.replace('_', ' ')}</span>
                           {isLobby && <span className="text-yellow-500 animate-pulse">• HOSTING</span>}
                       </div>
                   </div>
               </div>

               <div>
                   {isLobby ? (
                       <button 
                         onClick={() => onJoinRoom(friend.id)}
                         className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 animate-pulse"
                       >
                           <PlayCircle size={18} /> JOIN
                       </button>
                   ) : (
                       <span className="text-xs text-gray-600 font-mono opacity-50">
                           {isOnline ? 'WAITING...' : 'OFFLINE'}
                       </span>
                   )}
               </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8">
      
      <div className="flex justify-between items-center mb-8">
          <div>
              <h2 className="text-3xl font-black italic text-white">SQUAD DEPLOYMENT</h2>
              <p className="text-gray-500 font-mono text-sm tracking-widest">P2P SECURE UPLINK // ID: {playerUsername}</p>
          </div>
          <button onClick={onCreateRoom} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-transform hover:scale-105">
              <Wifi size={20} /> CREATE LOBBY
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT PANEL - NAVIGATION */}
          <div className="col-span-1 bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2 h-fit">
              <button 
                onClick={() => setView('FRIENDS')}
                className={`w-full py-3 px-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${view === 'FRIENDS' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:bg-gray-800'}`}
              >
                  <Users size={18} /> FRIENDS ONLINE
                  <span className="ml-auto bg-gray-800 text-xs px-2 py-0.5 rounded text-gray-300">{friends.filter(f => f.status !== 'OFFLINE').length}</span>
              </button>
              <button 
                onClick={() => setView('ADD')}
                className={`w-full py-3 px-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${view === 'ADD' ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 'text-gray-500 hover:bg-gray-800'}`}
              >
                  <UserPlus size={18} /> ADD OPERATIVE
              </button>
          </div>

          {/* RIGHT PANEL - CONTENT */}
          <div className="col-span-1 md:col-span-2 bg-black/40 border border-gray-800 rounded-2xl p-6 min-h-[400px]">
              
              {view === 'FRIENDS' && (
                  <div className="space-y-4">
                      {friends.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[300px] text-gray-600">
                              <AlertTriangle size={48} className="mb-4 opacity-20" />
                              <p className="font-mono text-sm">NO ALLIES CONFIGURED</p>
                              <button onClick={() => setView('ADD')} className="mt-4 text-blue-500 hover:underline text-xs">ADD FRIEND TO BEGIN</button>
                          </div>
                      ) : (
                          <>
                             {friends.sort((a,b) => (a.status === 'OFFLINE' ? 1 : -1)).map(friend => (
                                 <FriendRow key={friend.id} friend={friend} />
                             ))}
                          </>
                      )}
                  </div>
              )}

              {view === 'ADD' && (
                  <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto">
                      <h3 className="text-xl font-bold text-white mb-6">ADD FRIEND BY USERNAME</h3>
                      <form onSubmit={handleAddFriend} className="w-full">
                          <input 
                            type="text" 
                            placeholder="ENTER USERNAME..." 
                            value={newFriendName}
                            onChange={(e) => setNewFriendName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 px-6 text-white text-center font-bold tracking-widest focus:border-green-500 outline-none mb-4"
                          />
                          <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg">
                              SEND CONNECTION REQUEST
                          </button>
                      </form>
                      <p className="text-gray-600 text-xs text-center mt-6">
                          *Friends must be online to accept the P2P handshake. 
                          <br/>Ensure you both have the exact username.
                      </p>
                  </div>
              )}

          </div>

      </div>

    </div>
  );
};
