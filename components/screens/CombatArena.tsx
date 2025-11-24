
import React, { useEffect, useRef, useState } from 'react';
import { GameCard } from '../GameCard';
import { GameState, ActionType, PlayerStats, ItemStats } from '../../types';
import { TURN_DURATION, PREPARATION_DURATION, SHOPPING_DURATION, GUNS, SHIELDS, ARMORS } from '../../constants';
import { Crosshair, Shield, RotateCw, Skull, ShoppingBag, Timer as TimerIcon, Loader2, Users, ChevronLeft, ChevronRight, Eye, ThumbsUp, Menu, Lock, TrendingUp, TrendingDown, Trophy, Hourglass, DollarSign, Zap, Archive, RefreshCw, Info, Clock } from 'lucide-react';

interface CombatArenaProps {
  gameState: GameState;
  gameMessage: string;
  timeLeft: number;
  localLockedAction?: ActionType | null;
  actionCooldownUntil?: number;
  onAction: (type: ActionType, intensity?: number) => void;
  onRestart: () => void;
  onShop: () => void;
}

// LOOT BOX OVERLAY
const LootOverlay: React.FC<{ 
    player: PlayerStats, 
    opponent: PlayerStats,
    onLoot: (category: 'gun'|'shield'|'armor') => void 
}> = ({ player, opponent, onLoot }) => {
    
    const LootRow: React.FC<{ label: string, myItem: ItemStats, enemyItem: ItemStats, category: 'gun'|'shield'|'armor' }> = ({ label, myItem, enemyItem, category }) => {
        // Comparison logic: Tier > Value > CoordinateTime (Lower is better)
        const isBetter = enemyItem.tier > myItem.tier || 
                         (enemyItem.tier === myItem.tier && enemyItem.value > myItem.value) || 
                         (enemyItem.tier === myItem.tier && enemyItem.value === myItem.value && (enemyItem.coordinateTime || 99) < (myItem.coordinateTime || 99));
                         
        const valKey = category === 'gun' ? 'DMG' : category === 'shield' ? 'BLK' : 'ARM';

        return (
            <div className="flex items-center justify-between bg-black/40 p-2 rounded mb-2 border border-gray-800">
                <div className="flex flex-col w-1/3 opacity-60">
                    <span className="text-[8px] text-gray-500 font-mono">CURRENT</span>
                    <div className="text-xs text-white font-bold truncate">{myItem.name}</div>
                    <div className="text-[10px] text-gray-400 flex gap-2">
                         <span>{valKey} {myItem.value}</span>
                         <span className="flex items-center gap-0.5"><Clock size={8}/> {myItem.coordinateTime}s</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-center w-1/6">
                     {isBetter ? <TrendingUp size={16} className="text-green-500 animate-bounce"/> : myItem.id === enemyItem.id ? <RefreshCw size={12} className="text-gray-600"/> : <TrendingDown size={16} className="text-red-500"/>}
                </div>

                <div className="flex flex-col w-1/3 text-right">
                    <span className="text-[8px] text-gray-500 font-mono">DROPPED</span>
                    <div className={`text-xs font-bold truncate ${isBetter ? 'text-green-400' : 'text-gray-300'}`}>{enemyItem.name}</div>
                    <div className="text-[10px] text-gray-400 flex gap-2 justify-end">
                         <span>{valKey} {enemyItem.value}</span>
                         <span className={`flex items-center gap-0.5 ${(enemyItem.coordinateTime || 99) < (myItem.coordinateTime || 99) ? 'text-green-400' : ''}`}><Clock size={8}/> {enemyItem.coordinateTime}s</span>
                    </div>
                </div>

                <button 
                    onClick={() => onLoot(category)}
                    disabled={myItem.id === enemyItem.id} 
                    className={`ml-2 p-2 rounded ${myItem.id === enemyItem.id ? 'bg-gray-800 text-gray-600' : 'bg-yellow-600 text-black hover:bg-yellow-500'} font-bold text-[10px]`}
                >
                    SWAP
                </button>
            </div>
        )
    };

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-gray-900 border border-yellow-600 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="bg-yellow-600/20 p-3 border-b border-yellow-600/50 flex justify-between items-center">
                    <h3 className="text-yellow-500 font-bold text-sm flex items-center gap-2"><Archive size={16}/> SCAVENGE GEAR</h3>
                    <div className="text-[10px] text-gray-400">OPPONENT ELIMINATED</div>
                </div>
                <div className="p-4">
                    <LootRow label="WEAPON" category="gun" myItem={player.gun} enemyItem={opponent.gun} />
                    <LootRow label="SHIELD" category="shield" myItem={player.shield} enemyItem={opponent.shield} />
                    <LootRow label="ARMOR" category="armor" myItem={player.armorItem} enemyItem={opponent.armorItem} />
                </div>
                <div className="bg-black/50 p-2 text-center text-[10px] text-gray-500">
                    LOOTED ITEMS REPAIR FULLY NEXT ROUND
                </div>
            </div>
        </div>
    );
};

// TACTICAL SHOP OVERLAY
const MatchShopOverlay: React.FC<{ 
    player: PlayerStats, 
    timeLeft: number, 
    onBuy: (type: 'gun'|'shield'|'armor', item: ItemStats) => void 
}> = ({ player, timeLeft, onBuy }) => {
    
    const ShopItemBtn: React.FC<{ item: ItemStats, type: 'gun'|'shield'|'armor', current: ItemStats }> = ({ item, type, current }) => {
        const cost = item.matchCost || 0;
        const canAfford = player.matchCash >= cost;
        const isOwned = current.id === item.id;
        
        return (
            <button 
                disabled={!canAfford || isOwned}
                onClick={() => onBuy(type, item)}
                className={`relative p-2 rounded border flex flex-col items-center text-center transition-all group ${
                    isOwned ? 'bg-green-900/30 border-green-500 cursor-default' :
                    canAfford ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-white' : 
                    'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'
                }`}
            >
                <div className="text-[10px] font-bold text-white truncate w-full">{item.name}</div>
                <div className="text-xs text-yellow-500 font-mono my-1">${cost}</div>
                <div className="text-[8px] text-gray-400 flex justify-between w-full px-2">
                    <span>{type === 'gun' ? `DMG ${item.value}` : type === 'shield' ? `BLK ${item.value}` : `ARM ${item.value}`}</span>
                    <span className="flex items-center gap-0.5"><Clock size={8}/> {item.coordinateTime}s</span>
                </div>
                
                {item.ability && item.ability !== 'NONE' && (
                    <div className="text-[8px] text-purple-400 mt-1 font-bold animate-pulse">{item.ability}</div>
                )}

                {isOwned && <div className="absolute top-1 right-1 text-green-500"><Zap size={8} fill="currentColor"/></div>}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl bg-gray-900 border border-blue-500 rounded-xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300 max-h-[90vh]">
                {/* Header */}
                <div className="p-4 bg-blue-900/20 border-b border-blue-500/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black italic text-white">TACTICAL SHOP</h2>
                        <div className="bg-black/50 px-3 py-1 rounded text-yellow-400 font-mono font-bold flex items-center gap-2 text-xl">
                            <DollarSign size={18} /> {player.matchCash}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-mono font-bold animate-pulse">
                        <TimerIcon size={18} /> CLOSING IN {timeLeft}s
                    </div>
                </div>
                
                {/* Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
                    {/* GUNS */}
                    <div className="bg-black/30 p-3 rounded border border-gray-800">
                        <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3 flex items-center gap-2"><Crosshair size={12}/> FIREARMS</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {GUNS.map(g => <ShopItemBtn key={g.id} item={g} type="gun" current={player.gun} />)}
                        </div>
                    </div>

                    {/* SHIELDS */}
                    <div className="bg-black/30 p-3 rounded border border-gray-800">
                        <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3 flex items-center gap-2"><Shield size={12}/> DEFENSE</h3>
                        <div className="grid grid-cols-2 gap-2">
                             {SHIELDS.map(s => <ShopItemBtn key={s.id} item={s} type="shield" current={player.shield} />)}
                        </div>
                    </div>

                    {/* ARMOR */}
                    <div className="bg-black/30 p-3 rounded border border-gray-800">
                         <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3 flex items-center gap-2"><Zap size={12}/> VESTS</h3>
                         <div className="grid grid-cols-2 gap-2">
                             {ARMORS.map(a => <ShopItemBtn key={a.id} item={a} type="armor" current={player.armorItem} />)}
                         </div>
                    </div>
                </div>

                <div className="p-2 bg-black text-center text-xs text-gray-500 font-mono">
                    PURCHASED ITEMS PERSIST IF YOU SURVIVE THE ROUND. LOWER COORD TIME IS BETTER.
                </div>
            </div>
        </div>
    );
}

const RoundIntroOverlay: React.FC<{ round: number, maxRounds: number, isMatchStart: boolean, message: string }> = ({ round, maxRounds, isMatchStart, message }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
        <div className="flex flex-col items-center animate-in zoom-in duration-300">
             {isMatchStart ? (
                 <>
                     <h1 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 italic tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] animate-pulse">
                         ROUND 1
                     </h1>
                     <p className="text-white font-mono tracking-[1em] mt-2 text-xl animate-bounce">FIGHT</p>
                 </>
             ) : (
                 <>
                     <h1 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                         {message}
                     </h1>
                     <div className="h-2 w-full bg-yellow-500 mt-4 animate-[pulse_1s_infinite]"></div>
                     <p className="text-gray-400 font-mono mt-2">PREPARING ROUND {round} OF {maxRounds}</p>
                 </>
             )}
        </div>
    </div>
);

export const CombatArena: React.FC<CombatArenaProps> = ({ 
  gameState, gameMessage, timeLeft, localLockedAction, actionCooldownUntil, onAction, onRestart, onShop 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [spectatorIndex, setSpectatorIndex] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [onCooldown, setOnCooldown] = useState(false);
  const [burstAmount, setBurstAmount] = useState(1);
  
  const [isActiveSpectating, setIsActiveSpectating] = useState(false);

  useEffect(() => {
      if (!actionCooldownUntil) return;
      const checkCooldown = () => {
          const now = Date.now();
          setOnCooldown(now < actionCooldownUntil);
          if (now < actionCooldownUntil) {
              requestAnimationFrame(checkCooldown);
          }
      };
      checkCooldown();
  }, [actionCooldownUntil]);

  useEffect(() => {
    if (scrollRef.current && (gameState.combatSubPhase === 'RESOLUTION' || showLogs)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.turnLog, showLogs, gameState.combatSubPhase]);
  
  // Reset burst amount each round start
  useEffect(() => {
      if (gameState.combatSubPhase === 'DECISION') {
          setBurstAmount(1);
      }
  }, [gameState.combatSubPhase]);

  const isIntro = gameState.combatSubPhase === 'INTRO';
  const isShopping = gameState.combatSubPhase === 'SHOPPING';
  const isDecision = gameState.combatSubPhase === 'DECISION';
  const isResolution = gameState.combatSubPhase === 'RESOLUTION';
  const isPrep = gameState.combatSubPhase === 'PREPARATION';
  const isRoundOver = gameState.combatSubPhase === 'ROUND_OVER';

  const totalTurnDuration = gameState.turnDuration || TURN_DURATION;
  const timerPercent = (timeLeft / (isPrep || isRoundOver ? PREPARATION_DURATION : totalTurnDuration)) * 100;
  const timerColor = timeLeft <= 5 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)]' : timeLeft <= 10 ? 'bg-yellow-500' : 'bg-blue-500';

  const myTeamId = gameState.player.teamId;
  const teammates = gameState.players.filter(p => p.teamId === myTeamId).sort((a, b) => a.id === gameState.myId ? -1 : 1);
  const enemies = gameState.players.filter(p => p.teamId !== myTeamId);
  const aliveTeammates = teammates.filter(p => p.health > 0 && p.id !== gameState.myId);

  const hasOpponent = !!gameState.matchups[gameState.myId];
  const isAlive = gameState.player.health > 0;
  const opponentDead = gameState.opponent.health <= 0;
  const duelWon = isAlive && opponentDead && hasOpponent;
  
  const spectatingEnabled = !isAlive || (duelWon && isActiveSpectating);
  const spectatedPlayer = aliveTeammates.length > 0 ? aliveTeammates[spectatorIndex % aliveTeammates.length] : null;

  const displayRound = Math.min(gameState.round, gameState.maxRounds);

  const getOpponentAction = () => {
      if (isResolution || isPrep || isRoundOver) return gameState.opponentLastAction;
      return undefined;
  };
  
  const myTeamScore = teammates.reduce((acc, p) => Math.max(acc, p.roundsWon), 0);
  const enemyTeamScore = enemies.reduce((acc, p) => Math.max(acc, p.roundsWon), 0);

  const TeamStatusPill: React.FC<{ p: PlayerStats, isEnemy: boolean }> = ({ p, isEnemy }) => {
      const hpPct = (p.health / p.maxHealth) * 100;
      const dead = p.health <= 0;
      return (
          <div className={`flex items-center gap-1 md:gap-2 p-1 rounded bg-black/40 border ${dead ? 'border-gray-800 opacity-50' : isEnemy ? 'border-red-900' : 'border-blue-900'}`}>
             <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold ${dead ? 'bg-gray-700' : isEnemy ? 'bg-red-600' : 'bg-blue-600'} text-white relative`}>
                 {dead ? <Skull size={10} /> : p.name.substring(0, 1)}
             </div>
             <div className="hidden md:block min-w-[60px]">
                 <div className="text-[10px] text-gray-400 leading-none mb-1 truncate max-w-[80px]">{p.name}</div>
                 <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                     <div className={`h-full transition-all ${isEnemy ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${hpPct}%` }}></div>
                 </div>
             </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full fixed inset-0 bg-black overflow-hidden">
      
      {/* LEVEL UP CELEBRATION */}
      {gameState.matchResult?.leveledUp && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 pointer-events-none animate-in fade-in duration-1000">
              <h1 className="text-8xl font-black text-yellow-400 tracking-tighter animate-bounce drop-shadow-[0_0_50px_rgba(250,204,21,0.8)]">
                  LEVEL UP!
              </h1>
              <div className="text-4xl text-white font-bold mt-4 animate-pulse">
                  RANK {gameState.player.level}
              </div>
          </div>
      )}
      
      {isShopping && <MatchShopOverlay player={gameState.player} timeLeft={timeLeft} onBuy={(type, item) => onAction(('BUY_' + type + '_' + JSON.stringify(item)) as any)} />}
      {(isIntro || isRoundOver) && gameState.phase === 'COMBAT' && <RoundIntroOverlay round={displayRound} maxRounds={gameState.maxRounds} isMatchStart={isIntro} message={gameMessage} />}
      {isPrep && !isRoundOver && <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/80 px-8 py-2 rounded-full border border-blue-500/50 animate-pulse"><div className="text-blue-400 font-mono text-sm font-bold tracking-widest">NEXT TURN...</div></div>}

      {/* TACTICAL HUD */}
      {gameState.mode === 'MULTIPLAYER' && (
          <div className="flex justify-between gap-2 p-2 bg-gray-900/90 border-b border-gray-700 shrink-0 z-30 relative">
              <div className="flex gap-1 items-center">
                  <span className="text-blue-400 text-[10px] font-bold tracking-widest mr-1 hidden md:inline">ALPHA</span>
                  {teammates.map(p => <TeamStatusPill key={p.id} p={p} isEnemy={false} />)}
              </div>
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="flex items-center gap-4 text-2xl font-black italic">
                        <span className="text-blue-500">{myTeamScore}</span>
                        <span className="text-gray-600 text-xs font-mono">ROUND {displayRound}/{gameState.maxRounds}</span>
                        <span className="text-red-500">{enemyTeamScore}</span>
                    </div>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest">
                        {isResolution ? "RESOLVING" : isShopping ? "SHOPPING" : isRoundOver ? "ROUND END" : timeLeft + "s"}
                    </span>
               </div>
              <div className="flex gap-1 items-center justify-end">
                  {enemies.map(p => <TeamStatusPill key={p.id} p={p} isEnemy={true} />)}
                  <span className="text-red-400 text-[10px] font-bold tracking-widest ml-1 hidden md:inline">OMEGA</span>
              </div>
          </div>
      )}
      
      <div className="absolute top-16 left-2 z-30 bg-black/60 border border-yellow-500/30 px-3 py-1 rounded-full flex items-center gap-1 text-yellow-400 font-bold font-mono text-sm">
          <DollarSign size={12} /> {gameState.player.matchCash}
      </div>
      
      {/* ABILITY HUD */}
      <div className="absolute top-24 left-2 z-30 flex flex-col gap-2">
          {gameState.player.character.passiveAbility && (
              <div className="bg-black/60 border border-blue-500/30 px-2 py-1 rounded text-[10px] text-blue-300 max-w-[150px]">
                  <span className="font-bold text-white block">{gameState.player.character.passiveAbility.name}</span>
                  {gameState.player.character.passiveAbility.description}
              </div>
          )}
          {gameState.player.gun.ability !== 'NONE' && (
              <div className="bg-black/60 border border-red-500/30 px-2 py-1 rounded text-[10px] text-red-300 max-w-[150px]">
                   <span className="font-bold text-white block">Gun: {gameState.player.gun.ability}</span>
                   {gameState.player.gun.ability === 'CRITICAL' && "Chance for 1.5x Dmg"}
                   {gameState.player.gun.ability === 'PIERCING' && "Ignores Armor"}
              </div>
          )}
      </div>

      {/* BATTLEFIELD */}
      <div className="flex-1 flex flex-row items-stretch justify-center relative overflow-hidden bg-black/50">
        
        {spectatingEnabled && gameState.phase === 'COMBAT' && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
                {aliveTeammates.length > 0 && spectatedPlayer ? (
                    <div className="w-full max-w-md p-4 flex flex-col items-center">
                        <div className="flex justify-between w-full items-center mb-4">
                             <button onClick={() => setSpectatorIndex(i => Math.max(0, i - 1))} className="p-2 bg-gray-800 rounded-full"><ChevronLeft /></button>
                             <div className="text-yellow-500 font-mono text-xs animate-pulse flex items-center gap-2">
                                 <Eye size={14} /> SPECTATING: {spectatedPlayer.name}
                             </div>
                             <button onClick={() => setSpectatorIndex(i => i + 1)} className="p-2 bg-gray-800 rounded-full"><ChevronRight /></button>
                        </div>
                        <div className="w-full h-64 mb-4">
                             <GameCard stats={spectatedPlayer} isPlayer={true} compact={false} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => onAction(('LIKE_TEAMMATE_' + spectatedPlayer.id) as any)} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-full shadow-lg flex items-center gap-2"><ThumbsUp size={16} /> BOOST</button>
                            {duelWon && <button onClick={() => setIsActiveSpectating(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2">RETURN TO LOOT</button>}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 border border-red-900 rounded-xl bg-red-950/20">
                        <Skull size={64} className="text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-500">ALL UNITS DOWN</h2>
                        <p className="text-gray-500 mt-2 animate-pulse">Waiting for Round to end...</p>
                    </div>
                )}
            </div>
        )}

        {/* PLAYER (LEFT) */}
        <div className="w-1/2 border-r border-gray-800 relative flex flex-col justify-center items-center p-1 bg-gradient-to-b from-blue-900/10 to-transparent">
             <div className="w-full h-full flex flex-col">
                <GameCard 
                  stats={gameState.player} 
                  isPlayer={true} 
                  lastAction={isResolution || isPrep || isRoundOver || isShopping ? gameState.lastAction : undefined}
                  damageTaken={isResolution ? gameState.turnLog[gameState.turnLog.length-1]?.playerDamageTaken : 0}
                  penaltyTaken={isResolution ? gameState.turnLog[gameState.turnLog.length-1]?.playerPenaltyTaken : 0}
                  compact={true}
                />
                {!isResolution && !isPrep && !isRoundOver && !isShopping && localLockedAction && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600/80 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur flex items-center gap-2">
                         {onCooldown ? <Hourglass size={10} className="animate-spin"/> : <Lock size={10} />}
                         {onCooldown ? "COOLDOWN..." : "MOVE SET"}
                    </div>
                )}
             </div>
        </div>

        {/* CENTER DIVIDER */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0 flex flex-col items-center z-20 pointer-events-none">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            {gameState.phase === 'COMBAT' && isAlive && hasOpponent && !isShopping && (
                <div className="absolute top-4 md:top-1/2 md:-translate-y-1/2">
                   <div className="flex items-center justify-center w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-900 border-2 border-gray-700 shadow-xl relative overflow-hidden">
                        <div className={`absolute inset-0 opacity-30 transition-all duration-1000 ${timerColor}`} style={{ top: `${100 - timerPercent}%` }}></div>
                        <span className="font-bold font-mono text-sm md:text-xl text-white relative z-10">
                            {isResolution ? '!' : (isPrep || isRoundOver) ? '...' : timeLeft}
                        </span>
                   </div>
                </div>
             )}
        </div>

        {/* OPPONENT (RIGHT) */}
        <div className="w-1/2 relative flex flex-col justify-center items-center p-1 bg-gradient-to-b from-red-900/10 to-transparent">
             {(!isAlive || !hasOpponent || gameState.phase !== 'COMBAT') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                      {isAlive ? <Loader2 className="animate-spin mb-2" /> : <Skull className="mb-2" />}
                      <span className="text-[10px] font-mono text-center">{isAlive ? "SCANNING..." : "LOST"}</span>
                  </div>
             ) : (
                  <div className="w-full h-full flex flex-col relative">
                      <GameCard 
                        stats={gameState.opponent} 
                        isPlayer={false} 
                        lastAction={getOpponentAction()}
                        damageTaken={isResolution ? gameState.turnLog[gameState.turnLog.length-1]?.opponentDamageTaken : 0}
                        penaltyTaken={isResolution ? gameState.turnLog[gameState.turnLog.length-1]?.opponentPenaltyTaken : 0}
                        compact={true} 
                      />
                      {!isResolution && !isPrep && !isRoundOver && !isShopping && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                               <div className="bg-black/50 text-gray-400 text-[10px] px-2 py-1 rounded backdrop-blur flex items-center gap-1">
                                   <Loader2 size={10} className="animate-spin" /> WAITING
                               </div>
                          </div>
                      )}
                      {duelWon && !isActiveSpectating && <LootOverlay player={gameState.player} opponent={gameState.opponent} onLoot={(cat) => onAction(('LOOT_' + cat) as any)} />}
                  </div>
             )}
        </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="shrink-0 bg-gray-950 border-t border-gray-800 p-2 flex flex-col relative z-20 pb-safe">
          {gameState.phase === 'COMBAT' && isAlive && hasOpponent && !isShopping && !duelWon ? (
              <div className="flex flex-col gap-2 h-[140px]">
                  {/* BURST CONTROL */}
                  <div className="flex justify-between items-center px-4">
                      <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <TrendingUp size={12} /> BURST INTENSITY
                      </div>
                      <div className="flex items-center gap-2">
                           <button 
                             onClick={() => setBurstAmount(Math.max(1, burstAmount - 1))} 
                             disabled={burstAmount <= 1}
                             className="p-1 bg-gray-800 rounded text-gray-400 hover:text-white"
                           ><ChevronLeft size={14}/></button>
                           
                           <span className="text-yellow-500 font-bold font-mono text-lg w-6 text-center">{burstAmount}</span>
                           
                           <button 
                             onClick={() => setBurstAmount(Math.min(gameState.player.ammo, burstAmount + 1))}
                             disabled={burstAmount >= gameState.player.ammo}
                             className="p-1 bg-gray-800 rounded text-gray-400 hover:text-white"
                           ><ChevronRight size={14}/></button>
                      </div>
                      <div className="text-[10px] text-red-500 font-mono">
                          {burstAmount * gameState.player.gun.value} POTENTIAL DMG
                      </div>
                  </div>

                  <div className="flex justify-center items-center gap-2 md:gap-4 flex-1">
                    <button 
                      onClick={() => onAction(ActionType.SHOOT, burstAmount)}
                      disabled={isIntro || isPrep || isRoundOver || onCooldown || gameState.player.ammo < burstAmount}
                      className={`flex-1 h-full max-w-[140px] rounded-xl flex flex-col items-center justify-center transition-all shadow-lg ${
                          onCooldown ? 'opacity-50 cursor-wait' : 'opacity-100'
                      } ${
                          localLockedAction === ActionType.SHOOT
                          ? 'bg-red-800 border-2 border-white text-white scale-105 shadow-red-500/30' 
                          : 'bg-red-950 border border-red-900 hover:bg-red-900 hover:border-red-500 text-red-500 hover:text-white active:scale-95'
                      }`}
                    >
                      <Crosshair size={24} className="mb-1" />
                      <span className="text-[10px] md:text-xs font-bold tracking-widest">SHOOT x{burstAmount}</span>
                      {gameState.player.ammo < burstAmount && <span className="text-[8px] text-red-300">NO AMMO</span>}
                    </button>

                    <button 
                      onClick={() => onAction(ActionType.IDLE)}
                      disabled={isIntro || isPrep || isRoundOver || onCooldown}
                      className={`flex-1 h-full max-w-[80px] rounded-xl flex flex-col items-center justify-center disabled:opacity-50 active:scale-95 transition-all shadow-lg ${
                          onCooldown ? 'opacity-50 cursor-wait' : ''
                      } ${
                          localLockedAction === ActionType.IDLE
                          ? 'bg-gray-700 border-2 border-white text-white scale-105'
                          : 'bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <RotateCw size={20} className="mb-1" />
                      <span className="text-[10px] md:text-xs font-bold tracking-widest">IDLE</span>
                    </button>

                    <button 
                      onClick={() => onAction(ActionType.SHIELD)}
                      disabled={isIntro || isPrep || isRoundOver || onCooldown || gameState.player.shieldCharges <= 0}
                       className={`flex-1 h-full max-w-[140px] rounded-xl flex flex-col items-center justify-center transition-all shadow-lg ${
                          onCooldown ? 'opacity-50 cursor-wait' : 'opacity-100'
                      } ${
                          localLockedAction === ActionType.SHIELD
                          ? 'bg-green-800 border-2 border-white text-white scale-105 shadow-green-500/30' 
                          : 'bg-green-950 border border-green-900 hover:bg-green-900 hover:border-green-500 text-green-500 hover:text-white active:scale-95'
                      }`}
                    >
                      <Shield size={24} className="mb-1" />
                      <span className="text-[10px] md:text-xs font-bold tracking-widest">SHIELD</span>
                    </button>
                  </div>
              </div>
          ) : (
              <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-center h-[100px] animate-in slide-in-from-bottom">
                  {duelWon && !isActiveSpectating && (
                       <button onClick={() => setIsActiveSpectating(true)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                           <Eye size={20} /> SPECTATE ALLIES
                       </button>
                  )}
                  {gameState.matchResult && (
                      <div className="absolute bottom-[110px] left-1/2 -translate-x-1/2 bg-gray-900/95 border border-yellow-500/50 p-6 rounded-2xl shadow-2xl text-center min-w-[300px] backdrop-blur-lg z-50">
                          <div className="text-[10px] text-yellow-500 font-mono uppercase tracking-widest mb-2 border-b border-gray-700 pb-2">{gameState.victoryReason || "MISSION COMPLETE"}</div>
                          <h3 className="text-xl text-white font-bold mb-4 uppercase tracking-widest">Progression Report</h3>
                          {/* (Simplified Scoreboard logic here for brevity) */}
                          <div className="text-center text-white font-bold">MATCH COMPLETE</div>
                      </div>
                  )}
                  {gameState.phase === 'GAMEOVER' && <button onClick={onRestart} className="px-8 py-3 bg-red-600 text-white font-bold rounded shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"><Skull size={20} /> RETRY MISSION</button>}
                  {gameState.phase === 'VICTORY' && <button onClick={onShop} className="px-8 py-3 bg-yellow-600 text-black font-bold rounded shadow-lg flex items-center gap-2 animate-pulse hover:scale-105 transition-transform"><ShoppingBag size={20} /> ACCESS MARKET</button>}
                  {isShopping && (
                      <div className="text-center">
                          <div className="text-xs text-gray-500 font-mono mb-1">SHOPPING PHASE</div>
                          <div className="text-yellow-500 font-bold animate-pulse">EQUIP YOUR OPERATOR</div>
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* LOGS OVERLAY */}
      {(showLogs || isResolution || isPrep || isRoundOver) && (
          <div className={`absolute inset-x-0 bottom-[140px] ${isResolution || isPrep || isRoundOver ? 'top-auto h-40' : 'top-20'} bg-black/90 border-t border-gray-800 z-40 flex flex-col animate-in slide-in-from-bottom-10 backdrop-blur-md`}>
               <div className="p-2 bg-blue-900/20 border-b border-gray-800 flex justify-between items-center">
                   <span className="text-xs font-mono text-blue-400 font-bold flex items-center gap-2"><TimerIcon size={12} /> TACTICAL LOG</span>
                   <button onClick={() => setShowLogs(false)} className="text-gray-500 p-1 hover:text-white"><ChevronRight size={16} className="rotate-90" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300 space-y-3" ref={scrollRef}>
                   {gameState.turnLog.slice().map((log, i) => (
                       <div key={i} className="border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                           <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                               <span>R{log.round}</span>
                               <span>{log.playerAction} (x{log.playerIntensity}) VS {log.opponentAction} (x{log.opponentIntensity})</span>
                           </div>
                           <div className="text-white font-bold">{log.description}</div>
                           {log.specialEvents && log.specialEvents.map((evt, idx) => <div key={idx} className="text-purple-400 italic text-[9px]">{evt}</div>)}
                           <div className="flex gap-2 mt-1 text-[10px]">
                               {(log.playerDamageTaken > 0 || log.playerPenaltyTaken > 0) && <span className="text-red-400">YOU: -{log.playerDamageTaken + log.playerPenaltyTaken} HP</span>}
                               {(log.opponentDamageTaken > 0 || log.opponentPenaltyTaken > 0) && <span className="text-green-400">ENEMY: -{log.opponentDamageTaken + log.opponentPenaltyTaken} HP</span>}
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )}
      
      <button onClick={() => setShowLogs(!showLogs)} className="absolute top-20 right-2 p-2 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-full text-gray-400 hover:text-white z-30 md:hidden">
           <Menu size={16} />
      </button>
    </div>
  );
};
