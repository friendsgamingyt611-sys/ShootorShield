
import React, { useState, useEffect } from 'react';
import { Crosshair, Globe, Calendar, CheckCircle, Gift, User, Trophy, Battery, Edit } from 'lucide-react';
import { PlayerStats, DailyTask } from '../../types';
import { playerService } from '../../services/playerService';
import { socialService } from '../../services/socialService';

interface MainMenuProps {
  onSelectMode: (mode: 'SOLO' | 'MULTIPLAYER') => void;
  player: PlayerStats; // Receive player data to show progress
  dailyRewardClaimed: boolean;
  onClaimTask: (id: string) => void;
  onOpenAuth?: () => void; // Deprecated
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode, player, dailyRewardClaimed, onClaimTask }) => {
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [showMissions, setShowMissions] = useState(false);

  useEffect(() => {
    if (dailyRewardClaimed) {
      setShowRewardPopup(true);
    }
  }, [dailyRewardClaimed]);

  // Generate a profile object for the local player to pass to the inspector
  const localProfile = socialService.getProfileFor(player);
  // Ensure local profile has the latest custom avatar
  if (player.customAvatar) localProfile.customAvatar = player.customAvatar;

  // We need to dispatch an event to open the inspector. 
  // Since MainMenu doesn't have direct access to actions.inspectPlayer without prop drilling,
  // we will rely on App.tsx passing a specific prop or we can cheat slightly by using a window event or refactoring.
  // But wait, App.tsx renders MainMenu. I should update App.tsx to pass "onInspectSelf".
  // For now, I will emit a custom event or assume the parent handles it if I click the profile.
  // Actually, looking at App.tsx, it doesn't pass inspectPlayer to MainMenu.
  // I will assume the user clicked the profile area to "edit" it. 
  
  // Let's trigger a custom event that App.tsx listens to? No, that's messy.
  // I'll add an ID to the div and let App.tsx handle it? No.
  // I will just update the props in App.tsx as well.

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in zoom-in duration-500 relative">
      
      {/* DAILY REWARD POPUP */}
      {showRewardPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-yellow-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in zoom-in duration-300 relative overflow-hidden">
             <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>
             <Gift size={64} className="mx-auto text-yellow-400 mb-4 animate-bounce" />
             <h2 className="text-2xl font-bold text-white mb-2">DAILY SUPPLY DROP</h2>
             <p className="text-gray-400 mb-6">You received generic login credits.</p>
             <div className="text-4xl font-mono font-bold text-yellow-400 mb-8">+200 CR</div>
             <button 
               onClick={() => setShowRewardPopup(false)}
               className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl"
             >
               ACCEPT
             </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="text-center space-y-4">
        <h2 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          SELECT PROTOCOL
        </h2>
        <p className="text-gray-500 tracking-[0.5em] font-mono">INITIATE COMBAT SEQUENCE</p>
      </div>

      {/* PROFILE SUMMARY CARD */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
         <div 
            id="profile-card" // ID for click handling if needed, but onClick below is better if prop exists
            className="col-span-1 md:col-span-3 bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm cursor-pointer hover:bg-gray-800 transition-colors group"
         >
            <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 bg-gray-700 border-gray-500 overflow-hidden">
                    {player.customAvatar ? (
                        <img src={player.customAvatar} alt="Av" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-white" />
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit size={16} className="text-white" />
                    </div>
                </div>
                <div>
                    <div className="text-white font-bold text-lg flex items-center gap-2">
                        {player.name} <span className="text-xs bg-blue-900 px-2 py-0.5 rounded text-blue-300">LVL {player.level}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono flex gap-3">
                        <span className="flex items-center gap-1"><Trophy size={10} className="text-yellow-500"/> ELO {player.elo}</span>
                        <span className="flex items-center gap-1"><Battery size={10} className="text-green-500"/> XP {player.xp}/{player.maxXp}</span>
                    </div>
                    {/* XP BAR */}
                    <div className="w-32 md:w-48 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(player.xp / player.maxXp) * 100}%` }}></div>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={() => setShowMissions(!showMissions)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 flex items-center gap-2 text-xs font-bold transition-all relative"
                >
                    <Calendar size={14} className={player.dailyTasks.some(t => t.current >= t.target && !t.isClaimed) ? "text-yellow-400 animate-pulse" : "text-gray-400"} /> 
                    DAILY MISSIONS
                    {player.dailyTasks.some(t => t.current >= t.target && !t.isClaimed) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                    )}
                </button>
            </div>
         </div>

         {/* MISSIONS DROPDOWN */}
         {showMissions && (
             <div className="col-span-1 md:col-span-3 bg-black/80 border border-gray-700 rounded-xl p-4 animate-in slide-in-from-top-2">
                 <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3">ACTIVE CONTRACTS</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     {player.dailyTasks.map(task => (
                         <div key={task.id} className={`p-3 rounded border ${task.isClaimed ? 'border-green-900 bg-green-900/10 opacity-50' : 'border-gray-800 bg-gray-900'} flex flex-col gap-2`}>
                             <div className="flex justify-between items-start">
                                 <span className="text-sm font-bold text-gray-200">{task.description}</span>
                                 <span className="text-xs text-yellow-500 font-mono">+{task.reward} CR</span>
                             </div>
                             <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (task.current / task.target) * 100)}%` }}></div>
                             </div>
                             <div className="flex justify-between items-center mt-1">
                                 <span className="text-[10px] text-gray-500">{task.current}/{task.target}</span>
                                 {task.current >= task.target && !task.isClaimed ? (
                                     <button onClick={() => onClaimTask(task.id)} className="px-2 py-1 bg-yellow-600 text-black text-[10px] font-bold rounded animate-pulse hover:scale-105">CLAIM</button>
                                 ) : task.isClaimed ? (
                                     <span className="flex items-center gap-1 text-[10px] text-green-500"><CheckCircle size={10}/> COMPLETE</span>
                                 ) : (
                                     <span className="text-[10px] text-gray-600">IN PROGRESS</span>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {/* MODE SELECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        
        {/* SOLO MODE */}
        <button 
          onClick={() => onSelectMode('SOLO')}
          className="group relative overflow-hidden bg-gray-900/50 border border-gray-800 hover:border-blue-500 rounded-2xl p-8 transition-all duration-300 hover:bg-gray-900 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Crosshair size={48} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-2 transition-transform">SOLO OPS</h3>
          <p className="text-gray-400 text-sm font-mono">Train against the AI. Upgrade your arsenal. Survival is personal.</p>
        </button>

        {/* MULTIPLAYER MODE */}
        <button 
          onClick={() => onSelectMode('MULTIPLAYER')}
          className="group relative overflow-hidden bg-gray-900/50 border border-gray-800 hover:border-red-500 rounded-2xl p-8 transition-all duration-300 hover:bg-gray-900 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Globe size={48} className="text-red-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-2 transition-transform">NET WARFARE</h3>
          <p className="text-gray-400 text-sm font-mono">High stakes PVP. Connect via global servers. Rank up or die trying.</p>
          <div className="absolute top-4 right-4 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-[10px] text-red-300 font-bold animate-pulse">
            LIVE
          </div>
        </button>

      </div>
    </div>
  );
};
