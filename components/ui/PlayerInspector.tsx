

import React, { useState, useRef, useEffect } from 'react';
import { PlayerProfile, Friend } from '../../types';
import { X, UserPlus, MessageCircle, Trophy, Target, Crosshair, Shield, Camera, Edit2, Save, Users, Share2, Check, Clock } from 'lucide-react';
import { getRankTitle } from '../../constants';
import { socialService } from '../../services/socialService';
import { NetworkService } from '../../services/network';

interface PlayerInspectorProps {
    profile: PlayerProfile | null;
    isSelf: boolean;
    onClose: () => void;
    onAddFriend: (profile: PlayerProfile) => void;
    onUpdateProfile?: (name: string, avatar: string) => void;
}

export const PlayerInspector: React.FC<PlayerInspectorProps> = ({ profile, isSelf, onClose, onAddFriend, onUpdateProfile }) => {
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState('');
    const [networkFriends, setNetworkFriends] = useState<Friend[]>([]); // Friends of the inspected user
    const [loadingGraph, setLoadingGraph] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Social Graph when opening inspection of another player
    useEffect(() => {
        if (profile && !isSelf && profile.status !== 'OFFLINE') {
            setLoadingGraph(true);
            NetworkService.requestSocialGraph(profile.id);
            
            // Listen for response (simplistic hook)
            const handleData = (packet: any, senderId: string) => {
                if (senderId === profile.id && packet.type === 'SOCIAL_GRAPH_RESPONSE') {
                    setNetworkFriends(packet.payload.friends);
                    setLoadingGraph(false);
                }
            };
            NetworkService.onData(handleData);
            
            // Timeout safety
            const timer = setTimeout(() => setLoadingGraph(false), 3000);
            return () => { clearTimeout(timer); };
        }
    }, [profile?.id]);

    if (!profile) return null;

    const rank = getRankTitle(profile.elo);
    const relationship = socialService.getRelationship(profile.id);
    const mutualsCount = socialService.calculateMutuals(socialService.getConfirmedFriends(), networkFriends.map(f => f.id));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (onUpdateProfile && reader.result) {
                    onUpdateProfile(newName || profile.name, reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (onUpdateProfile && newName && newName !== profile.name) {
             onUpdateProfile(newName, profile.customAvatar || '');
        }
        setEditMode(false);
    };

    const startEdit = () => {
        setNewName(profile.name);
        setEditMode(true);
    };
    
    const sendFriendRequest = () => {
        NetworkService.sendFriendRequest(profile.id);
        onAddFriend(profile); // Updates local state
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
            <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
                {/* Header / Cover */}
                <div className="h-24 bg-gradient-to-r from-blue-900 to-purple-900 relative shrink-0">
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white z-10"><X size={16}/></button>
                    
                    {/* Avatar Section */}
                    <div className="absolute -bottom-10 left-6 flex items-end">
                         <div className="relative w-20 h-20 rounded-xl border-4 border-gray-900 bg-gray-800 flex items-center justify-center overflow-hidden shadow-xl group">
                             {profile.customAvatar ? (
                                 <img src={profile.customAvatar} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="text-2xl font-bold text-gray-500">{profile.name[0]}</div>
                             )}
                             
                             {/* Upload Overlay */}
                             {isSelf && (
                                 <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                 >
                                    <Camera size={20} className="text-white"/>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                 </div>
                             )}
                         </div>
                    </div>
                </div>

                <div className="pt-12 px-6 pb-6 overflow-y-auto">
                    {/* Identity */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 mr-4">
                            {editMode ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="bg-black border border-gray-700 rounded px-2 py-1 text-white font-bold text-xl w-full focus:border-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <button onClick={handleSave} className="p-2 bg-green-600 rounded hover:bg-green-500"><Save size={16} className="text-white"/></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group">
                                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                                    {isSelf && (
                                        <button onClick={startEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-white">
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded bg-gray-800 border border-gray-700 ${rank.color}`}>{rank.title}</span>
                                <span className="text-xs text-gray-500">LVL {profile.level}</span>
                            </div>
                            
                            {!isSelf && (
                                <div className="mt-2 text-[10px] text-gray-400 font-mono flex items-center gap-2">
                                    <Users size={12}/> {loadingGraph ? "Scanning Network..." : `${networkFriends.length} Connections`} 
                                    {mutualsCount > 0 && <span className="text-blue-400">({mutualsCount} Mutual)</span>}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {!isSelf && (
                                <>
                                    {relationship === 'NONE' && (
                                        <button onClick={sendFriendRequest} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-lg" title="Send Friend Request"><UserPlus size={20}/></button>
                                    )}
                                    {relationship === 'PENDING_OUTGOING' && (
                                        <button className="p-2 bg-gray-700 rounded-lg text-white cursor-default" title="Request Sent"><Clock size={20}/></button>
                                    )}
                                    {relationship === 'FRIEND' && (
                                        <button className="p-2 bg-green-600 rounded-lg text-white cursor-default" title="Friends"><Check size={20}/></button>
                                    )}
                                    <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400"><MessageCircle size={20}/></button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {profile.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[10px] font-bold text-gray-300 tracking-wider">{tag}</span>
                        ))}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="bg-black/40 rounded-xl p-3 border border-gray-800">
                             <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-1"><Trophy size={12}/> WIN RATE</div>
                             <div className="text-2xl font-mono text-yellow-500">{profile.stats.winRate}%</div>
                         </div>
                         <div className="bg-black/40 rounded-xl p-3 border border-gray-800">
                             <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-1"><Target size={12}/> K/D RATIO</div>
                             <div className="text-2xl font-mono text-green-500">{profile.stats.kdRatio}</div>
                         </div>
                         <div className="bg-black/40 rounded-xl p-3 border border-gray-800">
                             <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-1"><Crosshair size={12}/> HEADSHOT %</div>
                             <div className="text-2xl font-mono text-red-500">{profile.stats.headshotRate}%</div>
                         </div>
                         <div className="bg-black/40 rounded-xl p-3 border border-gray-800">
                             <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-1"><Shield size={12}/> MATCHES</div>
                             <div className="text-2xl font-mono text-blue-500">{profile.stats.matchesPlayed}</div>
                         </div>
                    </div>
                    
                    {/* Social Graph / Friends of Friends */}
                    {!isSelf && networkFriends.length > 0 && (
                        <div className="mb-6">
                             <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2">
                                 <Share2 size={12}/> NETWORK ({networkFriends.length})
                             </h3>
                             <div className="flex gap-2 overflow-x-auto pb-2">
                                 {networkFriends.slice(0, 10).map((f, i) => (
                                     <div key={i} className="flex flex-col items-center min-w-[50px]">
                                         <div className="w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-[10px] overflow-hidden">
                                             {f.name[0]}
                                         </div>
                                         <div className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{f.name}</div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}

                    {/* ID Footer */}
                    <div className="text-center text-[10px] text-gray-600 font-mono bg-gray-950 p-2 rounded">
                        UID: {profile.id}
                    </div>
                </div>
            </div>
        </div>
    );
};
