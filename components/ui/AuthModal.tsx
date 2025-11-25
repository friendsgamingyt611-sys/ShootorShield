
import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertTriangle, Chrome, Check, Shield } from 'lucide-react';
import { authService } from '../../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState(''); // Callsign
  const [loginId, setLoginId] = useState(''); // Unique Username
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (mode === 'REGISTER') {
        if (!username || !loginId) throw new Error("All fields required.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (password.length < 6) throw new Error("Password too short (min 6 chars).");
        
        user = await authService.register(loginId, username, password);
      } else {
        user = await authService.login(loginId, password);
      }
      
      if (!user.success) throw new Error(user.message || "Authentication failed.");
      
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      // Simplify Firebase errors for user
      let msg = err.message;
      if (msg.includes('auth/email-already-in-use')) msg = "Username already taken.";
      if (msg.includes('auth/wrong-password')) msg = "Invalid credentials.";
      if (msg.includes('auth/user-not-found')) msg = "User not found.";
      if (msg.includes('auth/weak-password')) msg = "Password too weak (min 6 chars).";
      if (msg.includes('auth/invalid-email')) msg = "Invalid username format.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      // const user = await authService.signInWithGoogle(); 
      // Google Auth not implemented in local version, defaulting to mock success for demo
      throw new Error("Google Auth unavailable in local mode. Please use username/password.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
      <div className="w-full max-w-md bg-gray-900 border border-blue-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)] relative">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800 bg-black/40 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
          <div className="flex justify-center mb-2">
              <Shield className="text-blue-500" size={32} />
          </div>
          <h2 className="text-2xl font-black italic text-white tracking-wider">
            {mode === 'LOGIN' ? 'SYSTEM ACCESS' : 'NEW REGISTRATION'}
          </h2>
          <p className="text-blue-400 text-xs font-mono tracking-[0.2em] mt-1">SECURE CONNECTION</p>
        </div>

        {/* Body */}
        <div className="p-8 relative">
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded flex items-center gap-2 text-red-200 text-xs font-bold">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'REGISTER' && (
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="IN-GAME CALLSIGN (DISPLAY NAME)" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all uppercase"
                />
              </div>
            )}

            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="USERNAME (LOGIN ID)" 
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all lowercase"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all"
              />
            </div>

            {mode === 'REGISTER' && (
                <div className="relative group">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${password === confirmPassword && password ? 'text-green-500' : 'text-gray-500'} transition-colors`} size={18} />
                  <input 
                    type="password" 
                    placeholder="CONFIRM PASSWORD" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono transition-all"
                  />
                  {password === confirmPassword && password.length > 0 && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                  )}
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'PROCESSING...' : mode === 'LOGIN' ? 'AUTHENTICATE' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-gray-800 flex-1"></div>
            <span className="text-xs text-gray-600 font-mono">OR</span>
            <div className="h-px bg-gray-800 flex-1"></div>
          </div>

          <button onClick={handleGoogle} type="button" className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 flex items-center justify-center gap-2 transition-all hover:border-white/50 text-white text-sm font-bold">
              <Chrome size={18} /> CONTINUE WITH GOOGLE
          </button>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(''); }}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-mono tracking-wide"
            >
              {mode === 'LOGIN' ? "NEW USER? CREATE ACCOUNT" : "ALREADY REGISTERED? LOGIN"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
