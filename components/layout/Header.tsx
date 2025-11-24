

import React from 'react';
import { GameState } from '../../types';
import { Wifi } from 'lucide-react';

interface HeaderProps {
  playerCredits: number;
  phase: GameState['phase'];
  roomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({ playerCredits, phase, roomCode }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-300 uppercase italic">
          Shoot <span className="text-white">OR</span> Shield
        </h1>
        <p className="text-gray-500 text-xs tracking-[0.3em]">TACTICAL COMBAT SIMULATION</p>
      </div>
      
      <div className="flex items-center gap-6">
        {roomCode && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded text-cyan-400 text-xs font-mono animate-pulse">
                <Wifi size={12} />
                LOBBY: {roomCode}
            </div>
        )}

        <div className="text-right">
            <div className="text-yellow-500 font-mono text-xl flex items-center justify-center md:justify-end gap-2">
                <span className="text-xs text-gray-500">CREDITS</span> {playerCredits}
            </div>
            <div className="text-gray-400 text-sm font-mono uppercase">STATUS: {phase.replace('_', ' ')}</div>
        </div>
      </div>
    </header>
  );
};