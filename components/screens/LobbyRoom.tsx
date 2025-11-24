
import React, { useState } from 'react';
import { PlayerStats, MatchType, TimeFormat } from '../../types';
import { User, Shield, Cpu, Trash2, Play, AlertTriangle, Trophy, Copy, Check, Settings, Lock, Unlock, Plus, Minus, RefreshCw, Clock, MoreVertical, Eye } from 'lucide-react';
import { getRankTitle, TIME_CONTROLS } from '../../constants';
import { socialService } from '../../services/socialService';

interface ExtendedLobbyRoomProps {
  players: PlayerStats[];
  myId: string;
  roomCode: string;
  isHost: boolean;
  matchType: MatchType;
  startTimer?: number;
  
  maxRounds: number;
  isPublic: boolean;
  customTeamSize?: number;
  timeFormat?: TimeFormat;

  onSettingChange: (key: 'maxRounds' | 'isPublic' | 'customTeamSize' | 'timeFormat', val: any) => void;
  onToggleReady: () => void;
  onChangeMatchType: (type: MatchType) => void;
  onKickPlayer: (id: string) => void;
  onStartGame: () => void;
  onLeave: () => void;
  onManualSwitch: (playerId: string, targetTeamId: number) => void;
  onInspect: (profile: any) => void; // New Prop
}

export const LobbyRoom: React.FC<ExtendedLobbyRoomProps> = ({
  players, myId, roomCode, isHost, matchType, startTimer,
  maxRounds, isPublic, customTeamSize, timeFormat = 'RAPID',
  onToggleReady, onChangeMatchType, onKickPlayer, onStartGame, onLeave, onManualSwitch, onSettingChange, onInspect
}) => {
  
  const [copied, setCopied] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null); 

  const maxSlots = matchType === 'CUSTOM' ? (customTeamSize || 2) * 2 : parseInt(matchType[0]) * 2; 
  const teamSize = maxSlots / 2;

  const team1Players = players.filter(p => p.teamId === 1);
  const team2Players = players.filter(p => p.teamId === 2);

  const t1EmptyCount = Math.max(0, teamSize - team1Players.length);
  const t2EmptyCount = Math.max(0, teamSize - team2Players.length);

  const team1Slots = [...team1Players, ...Array(t1EmptyCount).fill(null)];
  const team2Slots = [...team2Players, ...Array(t2EmptyCount).fill(null)];

  const readyCount = players.filter(p => p.isReady).length;
  const allReady = readyCount === players.length && players.length > 1;

  const handleCopyCode = () => {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleSlotClick = (player: PlayerStats | null, teamId: number) => {
      if (selectedPlayerId && isHost) {
          onManualSwitch(selectedPlayerId, teamId);
          setSelectedPlayerId(null);
          return;
      }
      if (player) {
          if (isHost) {
              setSelectedPlayerId(player.id === selectedPlayerId ? null : player.id);
          } else {
              // If not host, clicking inspects
              const profile = player.profile || socialService.getProfileFor(player);
              onInspect(profile);
          }
      } else {
          if (!isHost) {
              onManualSwitch(myId, teamId);
          }
      }
  };

  const PlayerSlot: React.FC<{ player: PlayerStats | null, teamId: number, teamColor: string }> = ({ player, teamId, teamColor }) => {
      const isSelected = player && player.id === selectedPlayerId;
      const rank = player ? getRankTitle(player.elo) : null;

      return (
      <div 
        onClick={() => handleSlotClick(player, teamId)}
        className={`relative h-32 md:h-40 rounded-xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden group cursor-pointer ${
            player 
            ? isSelected 
                ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10'
                : player.isReady 
                    ? `border-green-500 bg-green-900/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]` 
                    : `border-gray-600 bg-gray-900/50 hover:bg-gray-800`
            : `border-gray-800 border-dashed bg-black/30 opacity-50 hover:opacity-80 hover:border-${teamColor.replace('bg-','')} hover:scale-[1.02]`
        }`}
      >
        {player ? (
            <>
                {/* Inspect Icon hover */}
                {!isHost && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded text-blue-400">
                        <Eye size={14}/>
                    </div>
                )}

                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full mb-2 flex items-center justify-center shadow-lg relative z-10 border-2 ${player.isReady ? 'border-green-500 bg-green-500 text-black' : 'border-gray-600 bg-gray-700 text-gray-300'}`}>
                    {player.isBot ? <Cpu size={20} /> : <User size={20} />}
                </div>
                
                <div className="text-xs md:text-sm font-bold text-white uppercase tracking-wider truncate max-w-[90%]">{player.name}</div>
                
                {/* Elo Badge */}
                <div className={`mt-1 px-2 py-0.5 rounded-full bg-black/50 border border-gray-700 text-[9px] font-mono ${rank?.color} flex items-center gap-1`}>
                    <Trophy size={10} /> {player.elo}
                </div>
                
                {/* Host Badge */}
                {player.isHost && <div className="absolute top-2 left-2 text-[8px] bg-yellow-600 text-black px-1.5 py-0.5 rounded font-bold shadow-lg">HOST</div>}
                
                {isHost && player.id !== myId && (
                    <button onClick={(e) => { e.stopPropagation(); onKickPlayer(player.id); }} className="absolute top-2 right-2 text-red-500 hover:text-white p-1 hover:bg-red-600 rounded"><Trash2 size={14} /></button>
                )}
                
                {isSelected && isHost && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center backdrop-blur-sm z-20 pointer-events-none">
                        <span className="text-[10px] font-bold animate-pulse bg-black/50 px-2 py-1 rounded">TAP SLOT TO MOVE</span>
                    </div>
                )}
            </>
        ) : (
            <div className="text-gray-600 font-mono text-[10px] flex flex-col items-center gap-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${teamColor}`}></div>
                {isHost && selectedPlayerId ? "PLACE HERE" : "JOIN SLOT"}
            </div>
        )}
      </div>
      );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in relative">
      
      {/* START OVERLAY */}
      {startTimer !== undefined && startTimer > 0 && (
         <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-[150px] font-black text-white leading-none drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse">
                {startTimer}
            </div>
            <h2 className="text-3xl font-bold text-red-500 tracking-[0.5em] mt-4">DEPLOYING</h2>
         </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl text-white font-bold flex items-center gap-2">
                LOBBY <span className="text-blue-500">#{roomCode.substring(0,6)}</span>
                <button onClick={handleCopyCode} className="p-1 bg-gray-800 rounded text-gray-400 hover:text-white">
                    {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                </button>
            </h2>
            <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Settings size={12} /> {matchType === 'CUSTOM' ? `CUSTOM (${teamSize}v${teamSize})` : matchType}</span>
                <span className="flex items-center gap-1"><RefreshCw size={12} /> BEST OF {maxRounds}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {timeFormat} ({TIME_CONTROLS[timeFormat]}s)</span>
                <span className="flex items-center gap-1">{isPublic ? <Unlock size={12} className="text-green-500"/> : <Lock size={12} className="text-red-500"/>} {isPublic ? 'PUBLIC' : 'PRIVATE'}</span>
            </div>
        </div>

        {/* HOST SETTINGS */}
        {isHost && (
            <div className="flex flex-wrap gap-2 bg-gray-900/50 p-2 rounded border border-gray-800">
                <div className="flex items-center border-r border-gray-700 pr-2 mr-2 gap-1">
                    <span className="text-[10px] text-gray-500">MODE</span>
                    <select 
                        value={matchType} 
                        onChange={(e) => onChangeMatchType(e.target.value as MatchType)}
                        className="bg-black text-white text-xs border border-gray-700 rounded px-1 py-1"
                    >
                        <option value="1v1">1v1</option>
                        <option value="2v2">2v2</option>
                        <option value="3v3">3v3</option>
                        <option value="4v4">4v4</option>
                        <option value="CUSTOM">CUSTOM</option>
                    </select>
                </div>
                
                {matchType === 'CUSTOM' && (
                    <div className="flex items-center border-r border-gray-700 pr-2 mr-2 gap-1">
                        <span className="text-[10px] text-gray-500">SLOTS</span>
                        <button onClick={() => onSettingChange('customTeamSize', Math.max(1, (customTeamSize||2)-1))} className="p-1 bg-gray-800 rounded"><Minus size={10}/></button>
                        <span className="text-xs font-bold w-4 text-center">{customTeamSize || 2}</span>
                        <button onClick={() => onSettingChange('customTeamSize', (customTeamSize||2)+1)} className="p-1 bg-gray-800 rounded"><Plus size={10}/></button>
                    </div>
                )}

                <div className="flex items-center border-r border-gray-700 pr-2 mr-2 gap-1">
                    <span className="text-[10px] text-gray-500">ROUNDS</span>
                    <select 
                        value={maxRounds} 
                        onChange={(e) => onSettingChange('maxRounds', parseInt(e.target.value))}
                        className="bg-black text-white text-xs border border-gray-700 rounded px-1 py-1"
                    >
                        <option value="1">1</option>
                        <option value="3">3</option>
                        <option value="5">5</option>
                        <option value="7">7</option>
                    </select>
                </div>

                 <div className="flex items-center border-r border-gray-700 pr-2 mr-2 gap-1">
                    <span className="text-[10px] text-gray-500">CLOCK</span>
                    <select 
                        value={timeFormat} 
                        onChange={(e) => onSettingChange('timeFormat', e.target.value)}
                        className="bg-black text-white text-xs border border-gray-700 rounded px-1 py-1"
                    >
                        <option value="BULLET">BULLET (5s)</option>
                        <option value="BLITZ">BLITZ (10s)</option>
                        <option value="RAPID">RAPID (20s)</option>
                        <option value="TACTICAL">TACTICAL (60s)</option>
                    </select>
                </div>

                <button 
                    onClick={() => onSettingChange('isPublic', !isPublic)}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${isPublic ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                >
                    {isPublic ? <Unlock size={10}/> : <Lock size={10}/>} {isPublic ? 'PUB' : 'PRIV'}
                </button>
            </div>
        )}
      </div>

      {/* TEAMS GRID */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-3 relative">
              <h3 className="text-blue-400 font-bold tracking-widest mb-3 text-xs md:text-sm border-b border-blue-500/30 pb-2 flex justify-between">
                  ALPHA TEAM <span>{team1Players.length}/{teamSize}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                  {team1Slots.map((p, i) => <PlayerSlot key={i} player={p} teamId={1} teamColor="bg-blue-500" />)}
              </div>
          </div>

          <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-3 relative">
              <h3 className="text-red-400 font-bold tracking-widest mb-3 text-xs md:text-sm border-b border-red-500/30 pb-2 flex justify-between">
                  OMEGA TEAM <span>{team2Players.length}/{teamSize}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                  {team2Slots.map((p, i) => <PlayerSlot key={i} player={p} teamId={2} teamColor="bg-red-500" />)}
              </div>
          </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-center gap-4 border-t border-gray-800 pt-6">
         <button onClick={onLeave} className="px-6 py-3 rounded bg-red-950/30 text-red-500 hover:bg-red-900/50 font-bold text-sm">LEAVE</button>

         {isHost ? (
            <button 
                onClick={onStartGame}
                className={`px-8 py-3 rounded font-bold text-sm md:text-lg flex items-center gap-2 shadow-lg transition-all ${
                    (allReady || players.length < maxSlots) && !startTimer 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
                {players.length < maxSlots ? <><AlertTriangle size={16} /> AUTO-FILL & START</> : <><Play size={16} /> START MATCH</>}
            </button>
         ) : (
             <button 
                onClick={onToggleReady}
                className={`px-8 py-3 rounded font-bold text-sm md:text-lg flex items-center gap-2 shadow-lg transition-all ${
                    players.find(p => p.id === myId)?.isReady
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-600 text-black'
                }`}
             >
                <Shield size={16} /> {players.find(p => p.id === myId)?.isReady ? 'READY' : 'MARK READY'}
             </button>
         )}
      </div>
    </div>
  );
};
