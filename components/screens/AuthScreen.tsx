import React, { useEffect, useState } from 'react';
import { Shield, Play, LogIn, Globe } from 'lucide-react';
import { authService } from '../../services/auth';
import { PlayerStats } from '../../types';
import { playerService } from '../../services/playerService';

declare global {
    interface Window {
        netlifyIdentity: any;
    }
}

interface AuthScreenProps {
    onAuthSuccess: (player: PlayerStats) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    
    useEffect(() => {
        // Listen for Netlify Identity login event
        if (window.netlifyIdentity) {
            window.netlifyIdentity.on('login', (user: any) => {
                window.netlifyIdentity.close();
                // Initialize player with cloud data
                const { player } = playerService.initializeState();
                onAuthSuccess(player);
            });
        }
    }, [onAuthSuccess]);

    const handleGuestPlay = () => {
        // Just initialize with local storage
        const { player } = playerService.initializeState();
        onAuthSuccess(player);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden font-display p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 opacity-50"></div>
            
            {/* Main Container */}
            <div className="w-full max-w-lg relative z-10 flex flex-col items-center gap-8 animate-in zoom-in duration-500">
                
                {/* Logo Section */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-900/20 border border-blue-500/30 mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
                        <Shield size={48} className="text-blue-500" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter mb-2 drop-shadow-2xl">
                        SHOOT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">OR</span> SHIELD
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 font-mono tracking-[0.4em] uppercase">Tactical Combat Simulation</p>
                </div>

                {/* Status Bar */}
                <div className="flex gap-4 text-[10px] md:text-xs font-mono text-gray-600 border-y border-gray-800 py-2 w-full justify-center">
                    <span className="flex items-center gap-1"><Globe size={12} className="text-green-500"/> SERVER: ONLINE</span>
                    <span>•</span>
                    <span>VERSION: 3.1.0</span>
                    <span>•</span>
                    <span className="text-blue-500 animate-pulse">NETLIFY UPLINK ACTIVE</span>
                </div>

                {/* Actions */}
                <div className="w-full space-y-4">
                    <button 
                        onClick={() => authService.openLogin()}
                        className="group w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                    >
                        <LogIn size={24} className="group-hover:translate-x-1 transition-transform"/>
                        <div className="text-left">
                            <div className="text-lg leading-none tracking-widest">LOGIN / SYNC</div>
                            <div className="text-[10px] opacity-70 font-mono font-normal">ENABLE CLOUD SAVE & RANKED</div>
                        </div>
                    </button>

                    <button 
                        onClick={handleGuestPlay}
                        className="group w-full py-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
                    >
                        <Play size={24} className="text-gray-500 group-hover:text-white transition-colors"/>
                        <div className="text-left">
                            <div className="text-lg leading-none tracking-widest">GUEST ACCESS</div>
                            <div className="text-[10px] opacity-70 font-mono font-normal">LOCAL SAVE ONLY</div>
                        </div>
                    </button>
                </div>
            </div>
            
            <div className="absolute bottom-8 text-center">
                <p className="text-[10px] text-gray-700 font-mono max-w-xs mx-auto">
                    BY ACCESSING THIS TERMINAL YOU AGREE TO THE PROTOCOLS OF ENGAGEMENT. 
                    <br/>POWERED BY NETLIFY IDENTITY.
                </p>
            </div>
        </div>
    );
};