
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, X, MessageCircle, Play, Hash, Search, Check, Trash2, ArrowRight } from 'lucide-react';
import { socialService } from '../../services/socialService';
import { NetworkService } from '../../services/network';
import { Friend } from '../../types';

interface SocialOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (id: string) => void;
}

export const SocialOverlay: React.FC<SocialOverlayProps> = ({ isOpen, onClose, onInvite }) => {
    const [activeTab, setActiveTab] = useState<'FRIENDS' | 'RECENT' | 'REQUESTS'>('FRIENDS');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<Friend[]>([]);
    const [searchId, setSearchId] = useState('');

    const refresh = () => {
        setFriends(socialService.getConfirmedFriends());
        setRequests(socialService.getPendingIncoming());
    };

    useEffect(() => {
        if (isOpen) {
            refresh();
            // Poll for changes in case network packets arrive while open
            const interval = setInterval(refresh, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const handleAccept = (id: string) => {
        NetworkService.acceptFriendRequest(id);
        setTimeout(refresh, 100);
    };

    const handleDecline = (id: string) => {
        NetworkService.removeFriend(id);
        setTimeout(refresh, 100);
    };

    const handleSearch = () => {
        if (!searchId) return;
        // In this P2P model, we assume searchID IS the username. 
        // We try to add them. The service handles the PeerID generation.
        socialService.sendFriendRequest({ id: `sos_player_${searchId.toLowerCase()}`, name: searchId });
        NetworkService.sendFriendRequest(`sos_player_${searchId.toLowerCase()}`);
        setSearchId('');
        alert(`Friend Request sent to ${searchId}. They must be online to receive it.`);
    };

    const FriendItem: React.FC<{ friend: Friend, isRequest?: boolean }> = ({ friend, isRequest }) => (
        <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors group">
             <div className="flex items-center gap-3">
                 <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 overflow-hidden flex items-center justify-center">
                        {friend.customAvatar ? (
                             <img src={friend.customAvatar} className="w-full h-full object-cover" />
                        ) : (
                             <div className="text-xs font-bold">{friend.name[0]}</div>
                        )}
                    </div>
                    {!isRequest && <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${friend.status === 'ONLINE' ? 'bg-green-500' : friend.status === 'IN_GAME' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>}
                 </div>
                 <div>
                     <div className="font-bold text-white text-sm">{friend.name}</div>
                     <div className={`text-[10px] font-mono ${friend.status === 'ONLINE' ? 'text-green-400' : friend.status === 'IN_GAME' ? 'text-yellow-400' : 'text-gray-500'}`}>
                         {isRequest ? 'INCOMING REQUEST' : friend.status === 'IN_GAME' ? 'IN MATCH - RANKED' : friend.status}
                     </div>
                 </div>
             </div>
             
             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isRequest ? (
                      <>
                          <button onClick={() => handleAccept(friend.id)} className="p-2 bg-green-600 hover:bg-green-500 rounded-full text-white" title="Accept">
                              <Check size={14} />
                          </button>
                          <button onClick={() => handleDecline(friend.id)} className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white" title="Decline">
                              <X size={14} />
                          </button>
                      </>
                  ) : (
                      <>
                          <button onClick={() => onInvite(friend.id)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white" title="Invite to Squad">
                              <UserPlus size={14} />
                          </button>
                          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white" title="Message">
                              <MessageCircle size={14} />
                          </button>
                      </>
                  )}
             </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-black/95 backdrop-blur-md border-l border-gray-800 z-[60] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <h2 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-blue-500"/> SOCIAL NETWORK</h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400"><X size={18}/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button onClick={() => setActiveTab('FRIENDS')} className={`flex-1 py-3 text-[10px] font-bold tracking-wider ${activeTab === 'FRIENDS' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/10' : 'text-gray-500 hover:text-gray-300'}`}>
                    FRIENDS ({friends.length})
                </button>
                <button onClick={() => setActiveTab('REQUESTS')} className={`flex-1 py-3 text-[10px] font-bold tracking-wider ${activeTab === 'REQUESTS' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/10' : 'text-gray-500 hover:text-gray-300'}`}>
                    REQUESTS ({requests.length})
                </button>
                 <button onClick={() => setActiveTab('RECENT')} className={`flex-1 py-3 text-[10px] font-bold tracking-wider ${activeTab === 'RECENT' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/10' : 'text-gray-500 hover:text-gray-300'}`}>
                    RECENT
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-gray-800">
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                    <input 
                        type="text" 
                        placeholder="Add via Exact Username..." 
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-9 pr-8 text-xs text-white focus:border-blue-500 outline-none"
                    />
                    {searchId && (
                        <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-blue-600 rounded-full hover:bg-blue-500">
                            <ArrowRight size={10} className="text-white"/>
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeTab === 'FRIENDS' && (
                    <>
                        <div className="text-[10px] font-bold text-gray-500 mb-2 mt-1">ONLINE ({friends.filter(f => f.status !== 'OFFLINE').length})</div>
                        {friends.filter(f => f.status !== 'OFFLINE').map(f => <FriendItem key={f.id} friend={f} />)}
                        
                        <div className="text-[10px] font-bold text-gray-500 mb-2 mt-4">OFFLINE ({friends.filter(f => f.status === 'OFFLINE').length})</div>
                        {friends.filter(f => f.status === 'OFFLINE').map(f => <FriendItem key={f.id} friend={f} />)}
                        
                        {friends.length === 0 && (
                            <div className="text-center py-8 text-gray-600 text-xs">
                                No friends yet. Use search above.
                            </div>
                        )}
                    </>
                )}
                
                {activeTab === 'REQUESTS' && (
                     <>
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-xs">
                                <UserPlus size={32} className="mx-auto mb-2 opacity-20" />
                                No pending requests.
                            </div>
                        ) : (
                            requests.map(f => <FriendItem key={f.id} friend={f} isRequest />)
                        )}
                        
                        {socialService.getPendingOutgoing().length > 0 && (
                            <div className="mt-6 border-t border-gray-800 pt-4">
                                <div className="text-[10px] font-bold text-gray-500 mb-2">SENT REQUESTS</div>
                                {socialService.getPendingOutgoing().map(f => (
                                    <div key={f.id} className="flex justify-between items-center p-2 opacity-60">
                                        <span className="text-xs text-gray-300">{f.name}</span>
                                        <span className="text-[10px] text-yellow-500">PENDING</span>
                                    </div>
                                ))}
                            </div>
                        )}
                     </>
                )}
                
                {activeTab === 'RECENT' && (
                     <div className="text-center py-8 text-gray-500 text-xs">
                         <Clock size={32} className="mx-auto mb-2 opacity-20" />
                         No recent players found.
                     </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/80">
                <button className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg flex items-center justify-center gap-2 text-sm">
                    <Play size={16} fill="currentColor"/> QUICK JOIN PARTY
                </button>
            </div>
        </div>
    );
};
