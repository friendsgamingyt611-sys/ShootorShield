
import React, { useEffect, useRef, useState } from 'react';
import { PlayerStats, ActionType } from '../types';
import { Heart, Shield, Crosshair, Zap, AlertTriangle, ThumbsUp } from 'lucide-react';

interface GameCardProps {
  stats: PlayerStats;
  isPlayer: boolean;
  lastAction?: ActionType;
  damageTaken?: number;
  penaltyTaken?: number;
  compact?: boolean; // New prop for fit-to-screen mode
}

export const GameCard: React.FC<GameCardProps> = ({ stats, isPlayer, lastAction, damageTaken, penaltyTaken, compact = false }) => {
  // Flash effect for shop upgrades
  const [flash, setFlash] = useState(false);
  const [likeFlash, setLikeFlash] = useState(false);
  const prevGunId = useRef(stats.gun.id);
  const prevShieldId = useRef(stats.shield.id);
  const prevLikes = useRef(stats.likes);

  useEffect(() => {
    if (prevGunId.current !== stats.gun.id || prevShieldId.current !== stats.shield.id) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 600);
      prevGunId.current = stats.gun.id;
      prevShieldId.current = stats.shield.id;
      return () => clearTimeout(timer);
    }
  }, [stats.gun.id, stats.shield.id]);

  useEffect(() => {
      if (stats.likes > prevLikes.current) {
          setLikeFlash(true);
          const timer = setTimeout(() => setLikeFlash(false), 1500);
          prevLikes.current = stats.likes;
          return () => clearTimeout(timer);
      }
      prevLikes.current = stats.likes;
  }, [stats.likes]);

  // Calculate percentages for bars
  const healthPct = Math.max(0, (stats.health / stats.maxHealth) * 100);
  const armorPct = Math.max(0, (stats.armor / stats.maxArmor) * 100);

  const hasDamage = (damageTaken && damageTaken > 0) || (penaltyTaken && penaltyTaken > 0);
  const shakeClass = hasDamage ? 'animate-shake' : '';
  const flashClass = flash ? 'animate-flash-upgrade' : '';
  
  // Visual Impact for Hit
  const impactClass = hasDamage ? 'filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] brightness-150 saturate-200' : '';
  
  const charColor = stats.character.color;
  const charBg = stats.character.bgGradient;

  // --- Character Renderer Components ---

  const RenderHumanoid = () => {
    // determine styles based on character ID
    const isSpectre = stats.character.id === 'c1'; // Stealth Bot
    const isVanguard = stats.character.id === 'c2'; // Heavy Tank Bot
    const isNeon = stats.character.id === 'c3'; // Tech Drone Bot

    // Action States
    const isShooting = lastAction === ActionType.SHOOT;
    const isShielding = lastAction === ActionType.SHIELD;
    const isIdle = !lastAction || lastAction === ActionType.IDLE;

    // Arm Rotations
    // Right arm (Gun): Idle ~20deg, Shoot -90deg (horizontal)
    const armRRotation = isShooting ? -90 : 20;
    
    // Left arm (Shield): Idle -20deg, Shield -45deg (raised)
    const armLRotation = isShielding ? -45 : -20;

    // Colors - Metallic & Neon
    const primaryFill = isVanguard ? '#2a2a2a' : isSpectre ? '#1a1a1a' : '#222';
    const jointColor = '#444';
    const energyColor = isPlayer ? '#3b82f6' : '#ef4444'; // Blue/Red core
    
    // Animation Class based on Role
    let roleAnim = "animate-mech-idle";
    if (isSpectre) roleAnim = "animate-glitch";
    if (isVanguard) roleAnim = "animate-heavy";
    if (isNeon) roleAnim = "animate-tech";

    if (isShooting) roleAnim = "animate-recoil"; // Override when shooting

    // Gun Graphics based on tier/id
    const renderGun = () => {
        const tier = stats.gun.tier;
        const type = stats.gun.visualType || 'pistol';
        
        // Gun mounting point is wrist
        return (
          <g>
             <rect x="-4" y="-2" width="8" height="12" fill="#333" /> {/* Grip */}
             
             {/* Tier 1: Pistol */}
             {tier === 1 && type === 'pistol' && <path d="M-3 10 L20 10 L20 16 L-3 16 Z" fill="#666" />}
             {tier === 1 && type === 'rifle' && <path d="M-3 10 L30 10 L30 15 L5 15 L5 20 L-3 18 Z" fill="#555" />}
             
             {/* Tier 2: High Tech */}
             {tier === 2 && type === 'blaster' && (
                 <g>
                     <path d="M-4 8 L25 8 L25 18 L-4 18 Z M5 18 L10 25 L0 25 Z" fill="#555" />
                     <rect x="5" y="10" width="15" height="2" fill="cyan" opacity="0.8" />
                 </g>
             )}
             {tier === 2 && type === 'sniper' && <path d="M-5 8 L50 8 L50 12 L-5 12 Z M10 12 L15 20 L0 20 Z" fill="#333" stroke="#555" />}

             {/* Tier 3: Legendary */}
             {tier === 3 && (
                 <g>
                     <path d="M-5 5 L35 5 L35 12 L-5 15 Z M0 12 L8 20 L-5 20 Z" fill="#222" stroke="cyan" strokeWidth="1" />
                     <circle cx="10" cy="8" r="3" fill="cyan" className="animate-pulse" />
                     <circle cx="20" cy="8" r="3" fill="cyan" className="animate-pulse" style={{animationDelay: '0.1s'}} />
                     <circle cx="30" cy="8" r="3" fill="cyan" className="animate-pulse" style={{animationDelay: '0.2s'}} />
                 </g>
             )}

             {isShooting && <path d="M25 5 L45 0 L40 15 Z" fill="yellow" className="animate-muzzle" />}
          </g>
        );
    };

    // Shield Graphics based on tier/id
    const renderShield = () => {
        const tier = stats.shield.tier;
        return (
          <g>
             {tier === 1 && <circle cx="0" cy="15" r="12" fill="#444" stroke="#222" strokeWidth="2" opacity="0.8" />}
             {tier === 2 && <path d="M-10 0 L10 0 L8 35 L-8 35 Z" fill="#333" stroke="gray" strokeWidth="1" />}
             {tier === 3 && (
                 <g className="animate-spin-slow">
                     <path d="M0 -10 L15 10 L0 40 L-15 10 Z" fill="#111" stroke="cyan" strokeWidth="1" />
                     <circle cx="0" cy="15" r="5" fill="cyan" opacity="0.5" className="animate-pulse"/>
                 </g>
             )}
             
             {/* Active Shield Effect */}
             {isShielding && (
                <path d="M-15 -15 L35 -15 L35 55 L-15 55 Z" fill={isPlayer ? "url(#shieldGradPlayer)" : "url(#shieldGradEnemy)"} className="animate-pulse" style={{ mixBlendMode: 'screen', transform: 'scale(1.5)' }} />
             )}
          </g>
        );
    };

    return (
      <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-2xl ${roleAnim} ${impactClass} transition-all duration-100`}>
        <g transform="translate(100, 140)"> {/* Center coordinate system */}
          
          {/* --- LEGS / CHASSIS LOWER --- */}
          <g className="text-gray-800 fill-current">
             {/* Spectre: Digitigrade legs (Chicken walker) */}
             {isSpectre && (
               <>
                 <path d="M-10 0 L-15 25 L-25 50" stroke="#333" strokeWidth="6" fill="none" />
                 <circle cx="-15" cy="25" r="3" fill={jointColor} />
                 <path d="M10 0 L15 25 L25 50" stroke="#333" strokeWidth="6" fill="none" />
                 <circle cx="15" cy="25" r="3" fill={jointColor} />
               </>
             )}
             
             {/* Vanguard: Tank Treads / Heavy Pistons */}
             {isVanguard && (
               <g transform="translate(0, 10)">
                 <rect x="-30" y="0" width="20" height="50" rx="2" fill="#222" stroke="#444" />
                 <rect x="10" y="0" width="20" height="50" rx="2" fill="#222" stroke="#444" />
                 <path d="M-30 10 L-10 10 M-30 20 L-10 20 M-30 30 L-10 30" stroke="#111" strokeWidth="2" />
                 <path d="M10 10 L30 10 M10 20 L30 20 M10 30 L30 30" stroke="#111" strokeWidth="2" />
               </g>
             )}

             {/* Neon: Hover Thruster instead of legs */}
             {isNeon && (
               <g>
                 <path d="M-5 0 L5 0 L0 40 Z" fill="#333" />
                 <ellipse cx="0" cy="40" rx="8" ry="3" fill={energyColor} className="animate-pulse" />
                 <path d="M-2 40 L2 40 L0 60 Z" fill="url(#thruster)" opacity="0.8" />
               </g>
             )}
          </g>

          {/* --- TORSO --- */}
          <g transform="translate(0, -30)">
            {/* Waist Joint */}
            <circle cx="0" cy="30" r="6" fill={jointColor} /> 
            
            {/* Body Shape */}
            {isSpectre && <path d="M-12 0 L12 0 L8 30 L-8 30 Z" fill={primaryFill} stroke="#333" />}
            {isVanguard && <path d="M-25 -10 L25 -10 L20 35 L-20 35 Z" fill={primaryFill} stroke="#444" strokeWidth="2" />}
            {isNeon && (
               <g>
                 <circle cx="0" cy="15" r="15" fill={primaryFill} />
                 <circle cx="0" cy="15" r="8" fill={energyColor} opacity="0.6" className="animate-pulse" />
               </g>
            )}

            {/* Chest Armor/Core */}
            {isSpectre && <path d="M-5 10 L5 10 L0 20 Z" fill={energyColor} opacity="0.8" />}
            {isVanguard && <rect x="-15" y="5" width="30" height="15" fill="#111" opacity="0.5" />}
          </g>

          {/* --- HEAD --- */}
          <g transform="translate(0, -60)">
             {/* Neck */}
             <rect x="-4" y="10" width="8" height="8" fill={jointColor} />
             
             {/* Head Shape */}
             <g transform="translate(0, 0)">
                {isSpectre && (
                  <g>
                     <path d="M-10 -5 L10 -5 L8 12 L-8 12 Z" fill="#222" />
                     <rect x="-8" y="2" width="16" height="4" fill={energyColor} className="animate-pulse" /> {/* Visor */}
                     <path d="M-12 -5 L-12 -15" stroke="#444" strokeWidth="2" /> {/* Antenna */}
                  </g>
                )}
                {isVanguard && (
                   <g>
                     <rect x="-14" y="-8" width="28" height="22" rx="4" fill="#333" />
                     <circle cx="-6" cy="2" r="3" fill="red" opacity="0.5" />
                     <circle cx="6" cy="2" r="3" fill="red" opacity="0.5" />
                     <rect x="-10" y="8" width="20" height="4" fill="#111" /> {/* Grill */}
                   </g>
                )}
                {isNeon && (
                   <g>
                     <path d="M0 -10 L10 5 L0 15 L-10 5 Z" fill="#222" />
                     <circle cx="0" cy="5" r="4" fill={energyColor} className="animate-pulse" />
                     <path d="M-15 -5 L15 -5" stroke={energyColor} strokeWidth="1" opacity="0.5" /> {/* Halo */}
                   </g>
                )}
             </g>
          </g>

          {/* --- LEFT ARM (SHIELD) --- */}
          <g transform={`translate(-18, -50)`}> 
             <g transform={`rotate(${isPlayer ? armLRotation : -armLRotation})`}>
                {/* Shoulder */}
                <circle cx="0" cy="0" r={isVanguard ? 12 : 8} fill={isVanguard ? "#444" : "#333"} />
                {/* Upper Arm */}
                <rect x="-4" y="0" width="8" height="25" rx="2" fill={primaryFill} />
                {/* Elbow */}
                <circle cx="0" cy="25" r="5" fill={jointColor} />
                {/* Forearm */}
                <g transform="translate(0, 25) rotate(10)">
                   <rect x="-3" y="0" width="6" height="20" fill={primaryFill} />
                   {/* Hand/Mount */}
                   <g transform="translate(0, 20)">
                      {renderShield()}
                   </g>
                </g>
             </g>
          </g>

          {/* --- RIGHT ARM (GUN) --- */}
          <g transform={`translate(18, -50)`}> 
             <g transform={`rotate(${isPlayer ? armRRotation : -armRRotation})`}>
                {/* Shoulder */}
                <circle cx="0" cy="0" r={isVanguard ? 12 : 8} fill={isVanguard ? "#444" : "#333"} />
                {/* Upper Arm */}
                <rect x="-4" y="0" width="8" height="25" rx="2" fill={primaryFill} />
                {/* Elbow */}
                <circle cx="0" cy="25" r="5" fill={jointColor} />
                {/* Forearm */}
                <g transform="translate(0, 25) rotate(-10)">
                   <rect x="-3" y="0" width="6" height="20" fill={primaryFill} />
                   {/* Hand/Gun Mount */}
                   <g transform="translate(0, 20) rotate(-90)"> 
                      {renderGun()}
                   </g>
                </g>
             </g>
          </g>

        </g>

        <defs>
          <radialGradient id="shieldGradPlayer">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="80%" stopColor="rgba(59, 130, 246, 0.2)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
          </radialGradient>
          <radialGradient id="shieldGradEnemy">
            <stop offset="0%" stopColor="rgba(239, 68, 68, 0)" />
            <stop offset="80%" stopColor="rgba(239, 68, 68, 0.2)" />
            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.6)" />
          </radialGradient>
          <linearGradient id="thruster" x1="0" y1="0" x2="0" y2="1">
             <stop offset="0%" stopColor="cyan" stopOpacity="0.8"/>
             <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // --- Action Text Overlay ---
  const getActionVisuals = () => {
    const txtSize = compact ? "text-xs" : "text-base";
    switch (lastAction) {
      case ActionType.SHOOT: 
        return <div className={`absolute bottom-2 right-2 z-20 text-red-500 font-bold font-display tracking-widest text-shadow-glow ${txtSize}`}>FIRING</div>;
      case ActionType.SHIELD: 
        return <div className={`absolute bottom-2 left-2 z-20 text-green-400 font-bold font-display tracking-widest text-shadow-glow ${txtSize}`}>SHIELD</div>;
      case ActionType.IDLE: 
        return <div className={`absolute top-4 right-4 z-20 text-[10px] font-mono text-gray-500 animate-pulse`}>IDLE</div>;
      default: return null;
    }
  };

  // Layout container classes
  // Compact mode uses a vertical flex layout to fit in narrow columns (width 50%)
  const containerClasses = compact 
    ? "h-full w-full flex flex-col p-1 bg-gray-900/20 border-0 rounded-lg justify-between overflow-hidden" 
    : "relative p-1 rounded-2xl bg-gray-800 w-full max-w-md transition-all duration-500 shadow-2xl";

  const innerClasses = compact
    ? `relative flex-1 w-full flex flex-col overflow-hidden`
    : `relative rounded-xl border-2 overflow-hidden p-5 bg-gradient-to-b ${charBg} ${isPlayer ? 'border-blue-500/30' : 'border-red-500/30'}`;

  return (
    <div className={`${containerClasses} ${shakeClass} ${flashClass} group`}>
      
      {/* Main Content Area */}
      <div className={`${innerClasses} ${compact ? (isPlayer ? 'border-r-2 border-blue-500/10' : 'border-l-2 border-red-500/10') : ''}`}>

        {/* HIT IMPACT EFFECT */}
        {hasDamage && (
             <div className="absolute inset-0 bg-red-600/40 z-50 animate-pulse pointer-events-none mix-blend-overlay"></div>
        )}

        {/* Floating Damage Text */}
        {(damageTaken && damageTaken > 0) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-bold text-4xl md:text-6xl animate-bounce z-50 drop-shadow-[0_0_10px_rgba(255,0,0,1)] font-display">
            -{damageTaken}
            </div>
        )}
        
        {(penaltyTaken && penaltyTaken > 0) && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-sm md:text-xl animate-pulse z-50 flex items-center gap-2 bg-black/90 px-2 py-1 rounded border border-yellow-500 whitespace-nowrap">
            <AlertTriangle size={16} /> -{penaltyTaken}
            </div>
        )}

        {likeFlash && (
             <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <ThumbsUp size={40} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
             </div>
        )}

        {/* Header Info (Compact: Stacked) */}
        <div className={`flex flex-col items-center relative z-10 ${compact ? 'mb-1 mt-2' : 'mb-2 justify-between flex-row'}`}>
            <div className="flex flex-col items-center text-center">
                <h2 className={`${compact ? 'text-sm md:text-base' : 'text-2xl md:text-3xl'} font-display font-bold uppercase tracking-wider leading-none ${isPlayer ? 'text-white' : 'text-red-200'}`}>
                    {stats.name}
                </h2>
                {!compact && <span className={`text-xs font-mono uppercase tracking-[0.2em] ${charColor} opacity-80`}>
                    {stats.character.role} Model
                </span>}
                {compact && (
                    <div className="flex items-center gap-1 mt-1">
                        {stats.likes > 0 && <span className="text-yellow-500 flex items-center gap-1 text-[10px]"><ThumbsUp size={8} />{stats.likes}</span>}
                        <span className="px-1 bg-black/40 rounded border border-white/10 text-[8px] text-gray-400">LVL {stats.level}</span>
                    </div>
                )}
            </div>
            {!compact && (
                 <div className="text-right text-[10px] font-mono text-gray-400 flex flex-col items-end gap-1">
                     <div className="flex items-center gap-1">
                        {stats.likes > 0 && <span className="text-yellow-500 flex items-center gap-1 mr-2"><ThumbsUp size={8} />{stats.likes}</span>}
                        <span className="px-1 bg-black/40 rounded border border-white/10">LVL {stats.level}</span>
                     </div>
                </div>
            )}
        </div>

        {/* Character Scene */}
        <div className={`relative mx-auto flex items-center justify-center overflow-visible ${compact ? 'flex-1 w-full min-h-0' : 'h-56 -mt-2 mb-4 w-full'}`}>
             {/* Floor glow */}
            <div className={`absolute bottom-2 w-16 md:w-32 h-2 md:h-4 rounded-full blur-xl ${isPlayer ? 'bg-blue-500/20' : 'bg-red-500/20'}`}></div>
            
            <div className={`${compact ? 'w-full h-full max-h-[150px]' : 'w-64 h-64'} relative z-10 transition-transform duration-300 ${isPlayer ? '' : 'scale-x-[-1]'}`}> 
                 <RenderHumanoid />
            </div>
            {getActionVisuals()}
        </div>

        {/* Stats Bars - Fixed height bottom section in compact mode */}
        <div className={`space-y-1 font-mono relative z-10 w-full ${compact ? 'mt-auto pb-1' : 'bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-white/5 shadow-inner md:space-y-3'}`}>
            {/* Health */}
            <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] md:text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1 text-red-500"><Heart size={8} fill="currentColor"/> HULL</span>
                    <span>{Math.ceil(stats.health)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-sm h-1 md:h-2 overflow-hidden relative border border-gray-800">
                    <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-500" style={{ width: `${healthPct}%` }} />
                </div>
            </div>

            {/* Armor */}
            <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] md:text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1 text-yellow-500"><Shield size={8} fill="currentColor"/> AP</span>
                    <span>{Math.ceil(stats.armor)}</span>
                </div>
                <div className="w-full bg-gray-900 rounded-sm h-1 md:h-2 overflow-hidden relative border border-gray-800">
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full transition-all duration-500" style={{ width: `${armorPct}%` }} />
                </div>
            </div>
        </div>

        {/* Resource Counters */}
        <div className={`grid grid-cols-2 gap-1 mt-1 relative z-10 w-full`}>
            <div className={`p-1 rounded border bg-black/40 flex flex-col md:flex-row items-center justify-center md:justify-between ${stats.ammo === 0 ? 'border-red-900/60 opacity-60' : 'border-white/10'}`}>
                <div className="flex items-center gap-1 text-[8px] text-gray-400"><Crosshair size={8} /></div>
                <div className={`font-bold font-display text-[10px] md:text-sm ${stats.ammo === 0 ? 'text-red-500' : 'text-white'}`}>
                    {stats.ammo}<span className="text-gray-600 text-[8px] hidden md:inline">/{stats.maxAmmo}</span>
                </div>
            </div>

            <div className={`p-1 rounded border bg-black/40 flex flex-col md:flex-row items-center justify-center md:justify-between ${stats.shieldCharges === 0 ? 'border-red-900/60 opacity-60' : 'border-white/10'}`}>
                <div className="flex items-center gap-1 text-[8px] text-gray-400"><Zap size={8} /></div>
                <div className={`font-bold font-display text-[10px] md:text-sm ${stats.shieldCharges === 0 ? 'text-red-500' : 'text-white'}`}>
                    {stats.shieldCharges}<span className="text-gray-600 text-[8px] hidden md:inline">/{stats.maxShieldCharges}</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
