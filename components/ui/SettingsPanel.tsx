
import React, { useState } from 'react';
import { X, User, Monitor, Wifi, LogOut, Save, Volume2, Shield, Key, Edit3, Check } from 'lucide-react';
import { PlayerStats } from '../../types';
import { authService } from '../../services/auth';
import { playerService } from '../../services/playerService';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    player: PlayerStats;
    onUpdatePlayer: (p: PlayerStats) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, player, onUpdatePlayer }) => {
    const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'SYSTEM'>('ACCOUNT');
    const [newCallsign, setNewCallsign] = useState(player.name);
    const [isSaving, setIsSaving] = useState(false);
    
    // System Settings State (in a real app these would persist to localStorage or UserSettings)
    const [fpsEnabled, setFpsEnabled] = useState(player.userSettings?.showFPS ?? true);
    const [lowQuality, setLowQuality] = useState(player.userSettings?.lowQualityMode ?? false);
    const [rememberMe, setRememberMe] = useState(authService.getRememberMe());

    if (!isOpen) return null;

    const handleSaveProfile = () => {
        if (!newCallsign.trim() || newCallsign === player.name) return;
        
        setIsSaving(true);
        // Optimistic update
        const updated = playerService.updateProfile(player, newCallsign);
        onUpdatePlayer(updated);
        
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleLogout = () => {
        if (window.confirm("Terminate session?")) {
            authService.logout();
        }
    };

    const handleSystemToggle = (key: string) => {
        if (key === 'remember') {
            setRememberMe(!rememberMe);
            authService.setRememberMe(!rememberMe);
        } else if (key === 'fps') {
            setFpsEnabled(!fpsEnabled);
            // Update local player state logic if needed
        } else if (key === 'quality') {
            setLowQuality(!lowQuality);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md h-full bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-black/40">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Key size={20} className="text-blue-500" /> CONTROL PANEL
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button onClick={() => setActiveTab('ACCOUNT')} className={`flex-1 py-4 font-bold text-xs tracking-widest ${activeTab === 'ACCOUNT' ? 'bg-blue-900/20 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'}`}>
                        ACCOUNT
                    </button>
                    <button onClick={() => setActiveTab('SYSTEM')} className={`flex-1 py-4 font-bold text-xs tracking-widest ${activeTab === 'SYSTEM' ? 'bg-blue-900/20 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'}`}>
                        SYSTEM
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {activeTab === 'ACCOUNT' && (
                        <>
                            {/* Identity Card */}
                            <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center border-2 border-blue-500 text-2xl font-bold text-white">
                                        {player.name[0]}
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-bold tracking-widest mb-1">OPERATIVE ID</div>
                                        <div className="text-xl font-mono text-white">{player.username}</div>
                                        <div className="text-xs text-green-500 flex items-center gap-1 mt-1"><Shield size={10}/> LVL {player.level}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Edit Callsign */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold tracking-widest">CALLSIGN (PUBLIC)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                        <input 
                                            type="text" 
                                            value={newCallsign}
                                            onChange={(e) => setNewCallsign(e.target.value)}
                                            className="w-full bg-black border border-gray-700 rounded px-4 py-3 pl-10 text-white focus:border-blue-500 outline-none font-mono"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isSaving || newCallsign === player.name}
                                        className={`px-4 rounded font-bold flex items-center gap-2 ${newCallsign !== player.name ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}
                                    >
                                        {isSaving ? <Edit3 size={16} className="animate-spin"/> : <Save size={16}/>}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-600">*This name appears in lobbies and leaderboards.</p>
                            </div>

                            <div className="border-t border-gray-800 my-4"></div>

                            <button onClick={handleLogout} className="w-full py-4 rounded bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40 font-bold flex items-center justify-center gap-2">
                                <LogOut size={18} /> TERMINATE SESSION
                            </button>
                        </>
                    )}

                    {activeTab === 'SYSTEM' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <Shield size={20} className="text-purple-500"/>
                                    <div>
                                        <div className="text-sm font-bold text-white">REMEMBER CREDENTIALS</div>
                                        <div className="text-[10px] text-gray-500">Auto-login on startup</div>
                                    </div>
                                </div>
                                <button onClick={() => handleSystemToggle('remember')} className={`w-10 h-5 rounded-full relative transition-colors ${rememberMe ? 'bg-green-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${rememberMe ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <Monitor size={20} className="text-blue-500"/>
                                    <div>
                                        <div className="text-sm font-bold text-white">PERFORMANCE HUD</div>
                                        <div className="text-[10px] text-gray-500">Show FPS and Ping</div>
                                    </div>
                                </div>
                                <button onClick={() => handleSystemToggle('fps')} className={`w-10 h-5 rounded-full relative transition-colors ${fpsEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${fpsEnabled ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3">
                                    <Wifi size={20} className="text-yellow-500"/>
                                    <div>
                                        <div className="text-sm font-bold text-white">LOW BANDWIDTH MODE</div>
                                        <div className="text-[10px] text-gray-500">Reduce animations for slower nets</div>
                                    </div>
                                </div>
                                <button onClick={() => handleSystemToggle('quality')} className={`w-10 h-5 rounded-full relative transition-colors ${lowQuality ? 'bg-green-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${lowQuality ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <Volume2 size={20} className="text-white"/>
                                    <div className="text-sm font-bold text-white">MASTER VOLUME</div>
                                </div>
                                <input type="range" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 bg-black/60 text-center text-[10px] text-gray-600 font-mono">
                    SHOOT OR SHIELD CLIENT v3.0.1 [STABLE]
                </div>
            </div>
        </div>
    );
};
