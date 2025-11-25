
import React from 'react';
import { PlayerStats, MatchRecord } from '../../types';
import { Trophy, Skull, Clock, Target, Crosshair, ArrowLeft, History } from 'lucide-react';

interface MatchHistoryProps {
    player: PlayerStats;
    onBack: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ player, onBack }) => {
    
    // Sort by newest
    const history = [...(player.matchHistory || [])].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="flex flex-col items-center min-h-[70vh] w-full max-w-4xl mx-auto p-4 animate-in slide-in-from-right duration-500">
            
            <div className="w-full flex justify-between items-center mb-6">
                <button onClick={onBack} className="p-2 bg-gray-900 border border-gray-700 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white flex items-center gap-2">
                    <History /> COMBAT RECORDS
                </h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                
                {/* Stats Summary */}
                <div className="grid grid-cols-4 border-b border-gray-800 bg-black/40 p-4">
                    <div className="text-center border-r border-gray-800">
                        <div className="text-[10px] text-gray-500 font-bold tracking-widest">MATCHES</div>
                        <div className="text-xl font-mono text-white">{player.totalMatchesPlayed}</div>
                    </div>
                    <div className="text-center border-r border-gray-800">
                        <div className="text-[10px] text-gray-500 font-bold tracking-widest">WIN RATE</div>
                        <div className="text-xl font-mono text-yellow-500">{player.totalMatchesPlayed > 0 ? Math.round((player.matchesWon / player.totalMatchesPlayed) * 100) : 0}%</div>
                    </div>
                    <div className="text-center border-r border-gray-800">
                        <div className="text-[10px] text-gray-500 font-bold tracking-widest">K/D (ROUNDS)</div>
                        <div className="text-xl font-mono text-blue-500">{player.matchesLost > 0 ? (player.matchesWon / player.matchesLost).toFixed(2) : player.matchesWon}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-gray-500 font-bold tracking-widest">ACCURACY</div>
                        <div className="text-xl font-mono text-green-500">{Math.round(player.accuracyPercentage * 100)}%</div>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-gray-600">
                            <Clock size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-mono text-sm">NO COMBAT DATA LOGGED</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-950 text-gray-500 text-[10px] font-bold uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="p-4">Outcome</th>
                                    <th className="p-4">Opponent</th>
                                    <th className="p-4 hidden md:table-cell">Mode</th>
                                    <th className="p-4 text-center">Performance</th>
                                    <th className="p-4 text-right">Rewards</th>
                                    <th className="p-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-xs font-mono">
                                {history.map((match) => (
                                    <tr key={match.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className={`flex items-center gap-2 font-bold ${match.result === 'VICTORY' ? 'text-green-400' : match.result === 'DEFEAT' ? 'text-red-500' : 'text-gray-400'}`}>
                                                {match.result === 'VICTORY' ? <Trophy size={14} /> : <Skull size={14} />}
                                                {match.result}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-white">
                                            {match.opponentName}
                                        </td>
                                        <td className="p-4 text-gray-400 hidden md:table-cell">
                                            {match.mode}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-4 text-gray-400">
                                                <div className="flex items-center gap-1" title="Damage Dealt">
                                                    <Target size={12} /> {match.stats.damageDealt}
                                                </div>
                                                <div className="flex items-center gap-1" title="Accuracy">
                                                    <Crosshair size={12} /> {Math.round(match.stats.accuracy * 100)}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`${match.eloChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {match.eloChange >= 0 ? '+' : ''}{match.eloChange} ELO
                                                </span>
                                                <span className="text-yellow-500 text-[10px]">+{match.creditsEarned} CR</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-gray-500">
                                            {new Date(match.timestamp).toLocaleDateString()}
                                            <div className="text-[10px] opacity-50">{new Date(match.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
