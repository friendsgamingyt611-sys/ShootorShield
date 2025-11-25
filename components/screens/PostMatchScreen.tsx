
import React, { useState } from 'react';
import { PlayerStats, MatchResult } from '../../types';
import { Trophy, ThumbsUp, Home, ArrowRight, Share2, Target, Skull, Crown } from 'lucide-react';
import { GameCard } from '../GameCard';

interface PostMatchScreenProps {
    players: PlayerStats[];
    myId: string;
    winnerTeam: number;
    matchResult?: MatchResult;
    onReturnToLobby: () => void;
    onLeave: () => void;
    onLike: (id: string) => void;
}

export const PostMatchScreen: React.FC<PostMatchScreenProps> = ({ 
    players, myId, winnerTeam, matchResult, onReturnToLobby, onLeave, onLike 
}) => {
    
    // Sort players by Score (MVP logic)
    const sortedPlayers = [...players].sort((a, b) => b.matchStats.score - a.matchStats.score);
    const mvp = sortedPlayers[0];
    const isWinner = players.find(p => p.id === myId)?.teamId === winnerTeam;
    
    // Track who we liked locally to disable button
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

    const handleLike = (id: string) => {
        if (likedIds.has(id)) return;
        onLike(id);
        setLikedIds(prev => new Set(prev).add(id));
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden animate-in fade-in duration-1000">
            
            {/* BACKGROUND EFFECTS */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-b ${isWinner ? 'from-yellow-600 to-black' : 'from-gray-800 to-black'}`}></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            {/* HEADER: VICTORY / DEFEAT */}
            <div className="relative pt-12 pb-4 text-center z-10">
                <h1 className={`text-6xl md:text-9xl font-black italic tracking-tighter drop-shadow-2xl ${isWinner ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {isWinner ? "BOOYAH!" : "DEFEAT"}
                </h1>
                <p className="text-xl text-white font-mono tracking-[0.5em] mt-2">
                    {isWinner ? "MISSION ACCOMPLISHED" : "MISSION FAILED"}
                </p>
                {matchResult && (
                    <div className="mt-4 flex justify-center gap-4 text-sm font-bold">
                        <span className={`${matchResult.eloChange >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                           {matchResult.eloChange > 0 ? '+' : ''}{matchResult.eloChange} ELO
                        </span>
                        <span className="text-yellow-400">+{matchResult.creditsGained} CREDITS</span>
                        <span className="text-blue-400">+{matchResult.xpGained} XP</span>
                    </div>
                )}
            </div>

            {/* MVP SPOTLIGHT */}
            <div className="relative flex-1 flex flex-col items-center justify-center -mt-8 mb-4 z-10">
                <div className="absolute top-0 text-yellow-500 font-black tracking-widest flex items-center gap-2 animate-bounce">
                    <Crown size={24} fill="currentColor"/> MVP
                </div>
                <div className="w-64 h-64 md:w-80 md:h-80 scale-125">
                     <GameCard stats={mvp} isPlayer={mvp.id === myId} compact={false} />
                </div>
                <div className="mt-4 text-center">
                    <h2 className="text-3xl font-bold text-white uppercase">{mvp.name}</h2>
                    <div className="text-xs text-gray-400 font-mono">SCORE: {mvp.matchStats.score}</div>
                </div>
            </div>

            {/* SCOREBOARD TABLE */}
            <div className="relative bg-black/80 backdrop-blur-md border-t border-gray-800 p-4 pb-safe z-20 h-[40vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-white font-bold flex items-center gap-2"><Trophy size={16} className="text-yellow-500"/> BATTLE REPORT</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900 text-gray-500 text-[10px] font-bold uppercase tracking-widest sticky top-0">
                            <tr>
                                <th className="p-3">Agent</th>
                                <th className="p-3 text-center">K / D / A</th>
                                <th className="p-3 text-center">DMG</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-xs font-mono">
                            {sortedPlayers.map((p) => (
                                <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.id === myId ? 'bg-blue-900/10' : ''}`}>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {p.id === mvp.id && <Crown size={12} className="text-yellow-500" fill="currentColor"/>}
                                            <span className={`font-bold ${p.id === myId ? 'text-blue-400' : 'text-white'}`}>{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center text-gray-300">
                                        <span className="text-white font-bold">{p.matchStats.kills}</span> / {p.matchStats.deaths} / {p.matchStats.assists}
                                    </td>
                                    <td className="p-3 text-center text-gray-400">
                                        {p.matchStats.damage}
                                    </td>
                                    <td className="p-3 text-right">
                                        {p.id !== myId && (
                                            <button 
                                                onClick={() => handleLike(p.id)}
                                                disabled={likedIds.has(p.id)}
                                                className={`p-2 rounded-full transition-all ${likedIds.has(p.id) ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                            >
                                                <ThumbsUp size={14} fill={likedIds.has(p.id) ? "currentColor" : "none"} />
                                            </button>
                                        )}
                                        {p.id === myId && <span className="text-[10px] text-gray-600 italic">YOU</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
                    <button onClick={onLeave} className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold flex items-center justify-center gap-2">
                        <Home size={18} /> LOBBY
                    </button>
                    <button onClick={onReturnToLobby} className="flex-[2] py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-yellow-500/20">
                        PLAY AGAIN <ArrowRight size={18} />
                    </button>
                </div>
            </div>

        </div>
    );
};
