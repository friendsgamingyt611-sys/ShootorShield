
import React, { useState, useEffect } from 'react';
import { Wifi, Lock, ArrowRight, Globe, Filter, Users, Server, AlertTriangle, RefreshCw, Map } from 'lucide-react';
import { socialService } from '../../services/socialService';

interface MultiplayerLobbyProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  isConnecting: boolean;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onCreateRoom, onJoinRoom, isConnecting }) => {
  const [activeTab, setActiveTab] = useState<'SERVER_BROWSER' | 'HOST'>('SERVER_BROWSER');
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('NA-EAST');
  const [servers, setServers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
      refreshServers();
  }, [region]);

  const refreshServers = () => {
      setIsRefreshing(true);
      setTimeout(() => {
          setServers(socialService.generateMockServers(region));
          setIsRefreshing(false);
      }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex bg-gray-900 rounded-full p-1 border border-gray-800">
              <button 
                onClick={() => setActiveTab('SERVER_BROWSER')}
                className={`px-6 py-2 rounded-full font-bold text-xs tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SERVER_BROWSER' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                 <Globe size={14} /> PUBLIC SERVERS
              </button>
              <button 
                onClick={() => setActiveTab('HOST')}
                className={`px-6 py-2 rounded-full font-bold text-xs tracking-widest transition-all flex items-center gap-2 ${activeTab === 'HOST' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                 <Wifi size={14} /> HOST / PRIVATE
              </button>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-gray-800">
              <span className="text-[10px] text-gray-500 font-bold">REGION:</span>
              <select 
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)}
                  className="bg-transparent text-xs font-mono text-blue-400 outline-none cursor-pointer"
              >
                  <option value="NA-EAST">NA-EAST (VIRGINIA)</option>
                  <option value="NA-WEST">NA-WEST (OREGON)</option>
                  <option value="EU-CENTRAL">EU-CENTRAL (FRANKFURT)</option>
                  <option value="ASIA-PACIFIC">ASIA-PACIFIC (TOKYO)</option>
              </select>
          </div>
      </div>

      {isConnecting ? (
         <div className="bg-black/50 border border-cyan-500/30 rounded-xl p-12 text-center relative overflow-hidden h-[400px] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse"></div>
            <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold text-cyan-400 animate-pulse">ESTABLISHING UPLINK...</h3>
            <p className="text-xs text-cyan-700 mt-2 font-mono">HANDSHAKING WITH PEER NETWORK</p>
         </div>
      ) : (
        <>
            {activeTab === 'SERVER_BROWSER' && (
                <div className="bg-gray-900/80 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                    {/* Browser Header / Filters */}
                    <div className="p-4 border-b border-gray-700 bg-black/40 flex flex-wrap gap-4 items-center">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2"><Server size={16} className="text-blue-500"/> SERVER LIST</h3>
                        <div className="h-6 w-px bg-gray-700 mx-2"></div>
                        
                        <button onClick={refreshServers} className={`p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`}>
                            <RefreshCw size={14} />
                        </button>

                        <div className="flex items-center gap-2 ml-auto">
                            <input type="text" placeholder="Search Lobbies..." className="bg-gray-950 border border-gray-700 rounded px-3 py-1 text-xs text-white w-40" />
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 px-6 py-3 bg-gray-950 text-[10px] font-bold text-gray-500 tracking-widest border-b border-gray-800">
                        <div className="col-span-4">HOST / LOBBY NAME</div>
                        <div className="col-span-2">MODE</div>
                        <div className="col-span-2">MAP</div>
                        <div className="col-span-2">PLAYERS</div>
                        <div className="col-span-2 text-right">PING</div>
                    </div>

                    {/* Server List */}
                    <div className="divide-y divide-gray-800 min-h-[300px] max-h-[500px] overflow-y-auto bg-gray-900/50">
                        {servers.map((server) => (
                            <div 
                                key={server.id} 
                                onClick={() => { setCode(server.id); onJoinRoom(server.id); }}
                                className="grid grid-cols-12 px-6 py-4 text-xs items-center hover:bg-blue-900/20 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-blue-500"
                            >
                                <div className="col-span-4 font-bold text-white flex items-center gap-3">
                                    {server.isLocked ? <Lock size={12} className="text-red-500"/> : <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>}
                                    {server.host}
                                    {Math.random() > 0.8 && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[8px] rounded border border-yellow-500/30">NEW</span>}
                                </div>
                                <div className="col-span-2 font-mono text-blue-400 font-bold bg-blue-900/10 w-fit px-2 py-0.5 rounded">{server.mode}</div>
                                <div className="col-span-2 font-mono text-gray-400 flex items-center gap-1"><Map size={10}/> FACTORY</div>
                                <div className="col-span-2 font-mono text-gray-300 flex items-center gap-1">
                                    <Users size={12} className={server.players >= server.max ? "text-red-500" : "text-gray-500"}/> 
                                    {server.players}/{server.max}
                                </div>
                                <div className="col-span-2 text-right font-mono">
                                    <span className={server.ping < 50 ? "text-green-500" : server.ping < 100 ? "text-yellow-500" : "text-red-500"}>{server.ping}ms</span>
                                </div>
                            </div>
                        ))}
                        
                        {servers.length === 0 && !isRefreshing && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                                <AlertTriangle size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-mono">NO SERVERS FOUND IN {region}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'HOST' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl flex flex-col items-center text-center hover:border-blue-500/50 transition-all group">
                        <div className="bg-blue-500/20 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.2)]"><Lock className="text-blue-400" size={40} /></div>
                        <h3 className="text-2xl font-bold text-white mb-2">HOST PRIVATE ROOM</h3>
                        <p className="text-gray-400 text-sm mb-8">Create a secure lobby with a unique Invite Code. Share with friends to play.</p>
                        <button onClick={onCreateRoom} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/40 transition-all">CREATE LOBBY</button>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl flex flex-col items-center text-center hover:border-green-500/50 transition-all group">
                        <div className="bg-green-500/20 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,197,94,0.2)]"><ArrowRight className="text-green-400" size={40} /></div>
                        <h3 className="text-2xl font-bold text-white mb-2">JOIN VIA CODE</h3>
                        <p className="text-gray-400 text-sm mb-6">Enter a private lobby code directly.</p>
                        <div className="w-full flex gap-2">
                            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 bg-black border border-gray-700 rounded-xl px-6 py-3 text-center font-mono text-lg text-white focus:border-green-500 outline-none uppercase tracking-widest" />
                            <button onClick={() => onJoinRoom(code)} disabled={!code} className="px-6 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg">JOIN</button>
                        </div>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};
