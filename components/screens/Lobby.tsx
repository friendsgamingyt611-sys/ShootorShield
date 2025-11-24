
import React from 'react';
import { Play } from 'lucide-react';
import { TURN_DURATION, TIMEOUT_PENALTY } from '../../constants';

interface LobbyProps {
  onStart: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4 max-w-2xl">
        <h2 className="text-2xl text-blue-400">Rules of Engagement</h2>
        <ul className="text-left text-gray-400 space-y-2 font-mono text-sm bg-gray-900 p-6 rounded border border-gray-800 shadow-2xl">
          <li className="flex items-center gap-2"><span className="text-red-500 font-bold">SHOOT</span> deals damage. Consumes 1 AMMO.</li>
          <li className="flex items-center gap-2"><span className="text-green-500 font-bold">SHIELD</span> blocks shoots. Consumes 1 CHARGE.</li>
          <li className="flex items-center gap-2"><span className="text-yellow-500 font-bold">PENALTY:</span> Shielding vs IDLE/SHIELD damages your Armor.</li>
          <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">TIMER:</span> {TURN_DURATION}s to act or take {TIMEOUT_PENALTY} DMG penalty.</li>
        </ul>
      </div>
      <button onClick={onStart} className="group relative px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded hover:bg-blue-500 transition-all overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.5)]">
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        <span className="flex items-center gap-2">ENTER SIMULATION <Play size={20} fill="currentColor"/></span>
      </button>
    </div>
  );
};
