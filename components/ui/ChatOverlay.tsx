
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatScope } from '../../types';
import { MessageSquare, Send, Users, Globe, User, X } from 'lucide-react';

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, scope: ChatScope, targetId?: string) => void;
  myTeamId: number;
  players: { id: string; name: string; teamId: number }[];
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
  messages, onSendMessage, myTeamId, players, isOpen, setIsOpen 
}) => {
  const [input, setInput] = useState("");
  const [scope, setScope] = useState<ChatScope>('GLOBAL');
  const [targetWhisperId, setTargetWhisperId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Identify my ID loosely by finding a player named 'me' or inferring from sent messages
  // Ideally this should be passed in, but for now we check senderId against known logic
  const me = players.find(p => p.id === 'me') || players[0]; 

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input, scope, scope === 'WHISPER' ? targetWhisperId : undefined);
    setInput("");
  };

  // Helper to determine relationship
  const getSenderTag = (msg: ChatMessage) => {
      // Find the sender in the players list
      const sender = players.find(p => p.id === msg.senderId);
      const isMe = sender?.id === (players.find(p=>p.id === 'me')?.id || messages.find(m=>m.senderName === 'You')?.senderId); 
      // Note: Strict ID matching in multiplayer requires 'myId' passed prop, doing best effort visual here
      
      // We use color coding based on team logic passed in props
      const isTeammate = sender?.teamId === myTeamId;
      
      if (msg.senderId === players.find(p => p.id.length > 4)?.id) { 
         // This logic needs the 'myId' prop strictly to be perfect.
         // For now, let's rely on the 'scope' logic mostly.
      }

      if (msg.senderName === 'System') return <span className="text-yellow-500 font-bold">[SYS] </span>;
      
      // Just simple logic:
      // If I sent it -> [YOU] (Blue)
      // If Teammate -> [ALLY] (Green)
      // If Enemy -> [ENEMY] (Red)
      
      // We don't have 'myId' prop here, let's pass it? 
      // Actually 'players' contains everyone. 
      // For better UX, let's just use the scope + name color.
      
      let color = "text-gray-400";
      let tag = "";
      
      if (msg.teamId === myTeamId) {
          color = "text-blue-400";
          tag = "[ALLY]";
      } else {
          color = "text-red-400";
          tag = "[ENEMY]";
      }
      
      return <span className={`${color} font-bold text-[10px] mr-1`}>{tag} {msg.senderName}:</span>;
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-black/80 border border-blue-500/50 p-3 rounded-full text-blue-400 hover:bg-blue-900/50 transition-all shadow-lg shadow-blue-500/20"
      >
        <MessageSquare size={24} />
        {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
                !
            </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 md:w-96 h-[400px] bg-black/90 border border-gray-700 rounded-xl shadow-2xl flex flex-col backdrop-blur-sm animate-in slide-in-from-bottom-4">
      
      <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-gray-900/50 rounded-t-xl">
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <MessageSquare size={14} /> Comms Uplink
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
            <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {messages.map((msg) => {
             const isMyTeam = msg.teamId === myTeamId;
             const isSystem = msg.senderId === 'system';
             const isWhisper = msg.scope === 'WHISPER';
             
             let rowClass = "text-gray-300";
             if (isWhisper) rowClass = "text-purple-300 bg-purple-900/20 p-1 rounded";
             else if (isSystem) rowClass = "text-yellow-300 italic";
             else if (isMyTeam) rowClass = "text-blue-100";
             
             return (
                <div key={msg.id} className={`break-words ${rowClass}`}>
                    <span className="opacity-30 text-[10px] mr-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {isSystem ? (
                         <span className="text-yellow-500">[SYS] {msg.content}</span>
                    ) : (
                        <>
                            {isWhisper && <span className="text-purple-400 font-bold">[WHISPER] </span>}
                            {!isWhisper && isMyTeam && <span className="text-blue-400 font-bold">[ALLY] </span>}
                            {!isWhisper && !isMyTeam && <span className="text-red-400 font-bold">[ENEMY] </span>}
                            
                            <span 
                                className="font-bold hover:underline cursor-pointer" 
                                onClick={() => { setScope('WHISPER'); setTargetWhisperId(msg.senderId); }}
                            >
                                {msg.senderName}:
                            </span>
                            <span className="ml-1 opacity-90">{msg.content}</span>
                        </>
                    )}
                </div>
             );
        })}
      </div>

      <div className="p-2 bg-gray-900/80 border-t border-gray-800 rounded-b-xl space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
            <button onClick={() => setScope('GLOBAL')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${scope === 'GLOBAL' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                <Globe size={10} /> ALL
            </button>
            <button onClick={() => setScope('TEAM')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${scope === 'TEAM' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                <Users size={10} /> TEAM
            </button>
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Msg ${scope}...`}
                className="flex-1 bg-black border border-gray-700 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded">
                <Send size={14} />
            </button>
        </form>
      </div>
    </div>
  );
};
