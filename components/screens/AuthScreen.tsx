
import React, { useState } from 'react';
import { Shield, Crosshair, Lock, User, Type, AlertTriangle, Loader2, Check } from 'lucide-react';
import { authService } from '../../services/auth';
import { PlayerStats } from '../../types';

interface AuthScreenProps {
    onAuthSuccess: (player: PlayerStats) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    
    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [callsign, setCallsign] = useState('');
    const [rememberMe, setRememberMe] = useState(authService.getRememberMe());
    
    // UI State
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Save preference
            authService.setRememberMe(rememberMe);

            let res;
            if (mode === 'LOGIN') {
                res = await authService.login(username, password);
            } else {
                // Validation before network request
                if (username.length < 3) throw new Error("Username must be at least 3 characters.");
                if (callsign.length < 3) throw new Error("Callsign must be at least 3 characters.");
                if (password.length < 6) throw new Error("Password too weak (min 6 characters).");
                
                res = await authService.register(username, callsign, password);
            }

            if (res.success && res.player) {
                onAuthSuccess(res.player);
            } else {
                // Specific Error Handling for better UX
                let msg = res.message || "Authentication failed.";
                
                // Translate backend messages to UI friendly errors
                if (msg.includes('Username already taken')) msg = "Identity Conflict: Username already registered.";
                else if (msg.includes('Callsign already taken')) msg = "Identity Conflict: Callsign already in use.";
                else if (msg.includes('User not found')) msg = "Login Failed: Operative not found.";
                else if (msg.includes('Invalid credentials')) msg = "Login Failed: Invalid passcode.";
                else if (msg.toLowerCase().includes('network')) msg = "Uplink failed. Database may be initializing (wait 10s).";
                
                setError(msg);
            }
        } catch (err: any) {
            setError(err.message || "Network uplink failed. Check connection.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden font-display p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-900 via-blue-500 to-blue-900 opacity-50"></div>
            
            <div className="w-full max-w-md bg-gray-900/80 border border-gray-700 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(30,58,138,0.2)] backdrop-blur-xl animate-in zoom-in duration-300 relative z-10">
                
                {/* Header */}
                <div className="p-8 text-center border-b border-gray-800 bg-black/40">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/20 border border-blue-500/30 mb-4 animate-pulse">
                        <Shield size={32} className="text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-black italic text-white tracking-wider mb-1">
                        SHOOT <span className="text-blue-500">OR</span> SHIELD
                    </h1>
                    <p className="text-xs text-blue-400 font-mono tracking-[0.3em]">SECURE TACTICAL UPLINK</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200 text-xs animate-in slide-in-from-top-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 tracking-widest ml-1">OPERATIVE ID (USERNAME)</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                    placeholder="Enter username"
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all lowercase"
                                    required
                                />
                            </div>
                        </div>

                        {/* Callsign (Register Only) */}
                        {mode === 'REGISTER' && (
                            <div className="space-y-1 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-bold text-gray-500 tracking-widest ml-1">DISPLAY CALLSIGN</label>
                                <div className="relative group">
                                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={callsign}
                                        onChange={(e) => setCallsign(e.target.value)}
                                        placeholder="Public display name"
                                        className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all uppercase"
                                        required
                                        minLength={3}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 tracking-widest ml-1">PASSPHRASE</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2 py-2">
                            <button 
                                type="button"
                                onClick={() => setRememberMe(!rememberMe)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-600'}`}
                            >
                                {rememberMe && <Check size={12} className="text-white" />}
                            </button>
                            <span className="text-xs text-gray-400 font-mono">REMEMBER DEVICE</span>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-wait mt-4"
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin"/> ESTABLISHING LINK...</>
                            ) : (
                                <><Crosshair size={18} /> {mode === 'LOGIN' ? 'AUTHENTICATE' : 'INITIALIZE PROFILE'}</>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center border-t border-gray-800 pt-6">
                        <button 
                            onClick={() => {
                                setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); 
                                setError('');
                                setUsername('');
                                setPassword('');
                            }}
                            className="text-xs text-gray-500 hover:text-white font-mono tracking-wide transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            {mode === 'LOGIN' ? (
                                <>NO ID FOUND? <span className="text-blue-400 underline decoration-blue-500/30 underline-offset-4">REGISTER NEW OPERATIVE</span></>
                            ) : (
                                <>ALREADY REGISTERED? <span className="text-blue-400 underline decoration-blue-500/30 underline-offset-4">LOGIN TO CONSOLE</span></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="absolute bottom-4 text-[10px] text-gray-700 font-mono">
                SECURE SERVER CONNECTION // ENCRYPTED
            </div>
        </div>
    );
};
