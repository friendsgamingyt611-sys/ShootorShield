
import React, { useState } from 'react';
import { Shield, Crosshair, Lock, User, Type, AlertTriangle, Loader2, Check } from 'lucide-react';
import { authService } from '../../services/auth';
import { PlayerStats } from '../../types';

interface AuthScreenProps {
    onAuthSuccess: (player: PlayerStats) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [callsign, setCallsign] = useState('');
    const [rememberMe, setRememberMe] = useState(authService.getRememberMe());
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Save remember me preference first
            authService.setRememberMe(rememberMe);

            let res;
            if (mode === 'LOGIN') {
                res = await authService.login(username, password);
            } else {
                res = await authService.register(username, callsign, password);
            }

            if (res.success && res.player) {
                onAuthSuccess(res.player);
            } else {
                setError(res.message || "Authentication failed");
            }
        } catch (err) {
            setError("Connection to server failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden font-display p-4">
            {/* Cyberpunk Background Elements */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
                     <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 mb-2">
                         SHOOT<span className="text-blue-500">OR</span>SHIELD
                     </h1>
                     <p className="text-blue-400 text-xs font-mono tracking-[0.4em]">TACTICAL NET WARFARE</p>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in duration-500">
                    {/* Header Tabs */}
                    <div className="flex border-b border-gray-800">
                        <button 
                            onClick={() => { setMode('LOGIN'); setError(''); }}
                            className={`flex-1 py-4 text-sm font-bold tracking-widest transition-colors ${mode === 'LOGIN' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            LOGIN
                        </button>
                        <button 
                            onClick={() => { setMode('REGISTER'); setError(''); }}
                            className={`flex-1 py-4 text-sm font-bold tracking-widest transition-colors ${mode === 'REGISTER' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            REGISTER
                        </button>
                    </div>

                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-3 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-2 text-red-400 text-xs font-bold animate-pulse">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 tracking-widest ml-1">USERNAME</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none font-mono transition-all"
                                        placeholder="UNIQUE ID"
                                        required
                                    />
                                </div>
                            </div>

                            {mode === 'REGISTER' && (
                                <div className="space-y-1 animate-in slide-in-from-right">
                                    <label className="text-[10px] font-bold text-gray-500 tracking-widest ml-1">CALLSIGN</label>
                                    <div className="relative group">
                                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                                        <input 
                                            type="text" 
                                            value={callsign}
                                            onChange={(e) => setCallsign(e.target.value)}
                                            className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-purple-500 outline-none font-mono transition-all"
                                            placeholder="DISPLAY NAME"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 tracking-widest ml-1">PASSWORD</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none font-mono transition-all"
                                        placeholder="SECURE KEY"
                                        required
                                    />
                                </div>
                            </div>

                            {mode === 'LOGIN' && (
                                <div className="flex items-center gap-2 py-2">
                                    <button 
                                        type="button"
                                        onClick={() => setRememberMe(!rememberMe)}
                                        className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-transparent'}`}
                                    >
                                        {rememberMe && <Check size={10} className="text-white" />}
                                    </button>
                                    <span className="text-xs text-gray-400 font-mono cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>REMEMBER CREDENTIALS</span>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full py-4 mt-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'LOGIN' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'}`}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : mode === 'LOGIN' ? <><Crosshair size={20}/> AUTHENTICATE</> : <><Shield size={20}/> INITIALIZE</>}
                            </button>
                        </form>
                    </div>
                    
                    <div className="p-4 bg-black/40 text-center border-t border-gray-800">
                        <p className="text-[10px] text-gray-600 font-mono">SECURE CONNECTION ESTABLISHED v2.4.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
