
import React, { useState } from 'react';
import { GameCard } from '../GameCard';
import { GameState, ItemStats } from '../../types';
import { GUNS, SHIELDS, ARMORS } from '../../constants';
import { ShoppingBag, Play, Shield, Crosshair, Zap, Lock, Check, AlertTriangle, Clock } from 'lucide-react';

interface ShopProps {
  gameState: GameState;
  onBuy: (type: 'gun' | 'shield' | 'armor', item: ItemStats) => void;
  onEquip: (type: 'gun' | 'shield' | 'armor', item: ItemStats) => void;
  onNextLevel: () => void;
}

export const Shop: React.FC<ShopProps> = ({ gameState, onBuy, onEquip, onNextLevel }) => {
  const [activeCategory, setActiveCategory] = useState<'gun' | 'shield' | 'armor'>('gun');

  const items = activeCategory === 'gun' ? GUNS : activeCategory === 'shield' ? SHIELDS : ARMORS;
  const currentEquipped = activeCategory === 'gun' ? gameState.player.gun : activeCategory === 'shield' ? gameState.player.shield : gameState.player.armorItem;

  // Helper to get tier color
  const getTierColor = (tier: number) => {
      if (tier === 1) return "border-gray-600 text-gray-400";
      if (tier === 2) return "border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]";
      if (tier === 3) return "border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]";
      return "border-gray-600";
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 p-4 animate-in fade-in slide-in-from-bottom-4">
      
      {/* LEFT: LOADOUT PREVIEW */}
      <div className="lg:w-1/3 flex flex-col gap-4">
         <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6 flex-1 flex flex-col">
            <h3 className="text-gray-500 text-xs font-mono tracking-widest mb-4 flex items-center gap-2">
                <UserIcon /> CURRENT OPERATIVE
            </h3>
            <div className="flex-1 flex items-center justify-center mb-4">
                 <div className="w-full max-w-[300px] aspect-square">
                    <GameCard stats={gameState.player} isPlayer={true} compact={false} />
                 </div>
            </div>
            
            {/* Current Stats Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/40 p-2 rounded border border-gray-800">
                    <div className="text-[10px] text-gray-500">DMG</div>
                    <div className="text-red-400 font-bold text-xl">{gameState.player.gun.value}</div>
                </div>
                <div className="bg-black/40 p-2 rounded border border-gray-800">
                    <div className="text-[10px] text-gray-500">BLOCK</div>
                    <div className="text-green-400 font-bold text-xl">{gameState.player.shield.value}</div>
                </div>
                <div className="bg-black/40 p-2 rounded border border-gray-800">
                    <div className="text-[10px] text-gray-500">ARMOR</div>
                    <div className="text-yellow-400 font-bold text-xl">{gameState.player.maxArmor}</div>
                </div>
            </div>
         </div>
         
         <button onClick={onNextLevel} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
            DEPLOY TO NEXT MISSION <Play fill="currentColor" />
         </button>
      </div>

      {/* RIGHT: ARMORY */}
      <div className="lg:w-2/3 bg-gray-900/90 border border-gray-700 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
         {/* Header */}
         <div className="p-6 border-b border-gray-800 bg-black/40 flex justify-between items-center">
             <div>
                 <h2 className="text-3xl font-black italic text-white flex items-center gap-3">
                     <ShoppingBag className="text-yellow-500" /> BLACK MARKET
                 </h2>
                 <p className="text-xs text-gray-500 font-mono mt-1">LICENSED VENDOR // NO REFUNDS</p>
             </div>
             <div className="text-right">
                 <div className="text-yellow-500 font-mono text-2xl font-bold">{gameState.player.credits} CR</div>
                 <div className="text-[10px] text-gray-500">AVAILABLE FUNDS</div>
             </div>
         </div>

         {/* Tabs */}
         <div className="flex border-b border-gray-800">
             <button 
                onClick={() => setActiveCategory('gun')}
                className={`flex-1 py-4 font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2 ${activeCategory === 'gun' ? 'bg-red-900/20 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
             >
                <Crosshair size={16}/> WEAPONS
             </button>
             <button 
                onClick={() => setActiveCategory('shield')}
                className={`flex-1 py-4 font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2 ${activeCategory === 'shield' ? 'bg-green-900/20 text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
             >
                <Shield size={16}/> DEFENSE
             </button>
             <button 
                onClick={() => setActiveCategory('armor')}
                className={`flex-1 py-4 font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2 ${activeCategory === 'armor' ? 'bg-yellow-900/20 text-yellow-400 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
             >
                <Zap size={16}/> PLATING
             </button>
         </div>

         {/* Item Grid */}
         <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
             {items.map((item) => {
                 const isOwned = gameState.player.inventory.includes(item.id);
                 const isEquipped = currentEquipped.id === item.id;
                 const canAfford = gameState.player.credits >= item.cost;
                 const tierColor = getTierColor(item.tier);
                 
                 return (
                     <div key={item.id} className={`relative group border rounded-xl p-4 bg-gray-800/30 transition-all hover:bg-gray-800 flex flex-col gap-3 ${isEquipped ? 'border-white bg-white/5' : tierColor}`}>
                         
                         {/* Header */}
                         <div className="flex justify-between items-start">
                             <div>
                                 <div className={`text-xs font-bold px-2 py-0.5 rounded w-fit mb-1 ${item.tier === 3 ? 'bg-yellow-500/20 text-yellow-400' : item.tier === 2 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                                     TIER {item.tier}
                                 </div>
                                 <h4 className="font-bold text-lg text-white">{item.name}</h4>
                             </div>
                             {isOwned ? (
                                 isEquipped ? <span className="text-green-500 flex items-center gap-1 text-xs font-bold"><Check size={12}/> EQUIPPED</span> : <span className="text-gray-500 text-xs font-bold">OWNED</span>
                             ) : (
                                 <span className="text-yellow-500 font-mono font-bold">{item.cost} CR</span>
                             )}
                         </div>

                         {/* Description */}
                         <p className="text-xs text-gray-400 min-h-[32px]">{item.description}</p>

                         {/* Stats */}
                         <div className="grid grid-cols-3 gap-2 text-xs bg-black/20 p-2 rounded">
                             <div className="flex flex-col">
                                 <span className="text-gray-500 text-[8px]">POWER</span>
                                 <span className="text-white font-bold">{item.value}</span>
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-gray-500 text-[8px]">{activeCategory === 'gun' ? 'AMMO' : activeCategory === 'shield' ? 'CHARGES' : 'DURABILITY'}</span>
                                 <span className="text-white font-bold">{activeCategory === 'armor' ? 'N/A' : item.maxCharges}</span>
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-gray-500 text-[8px] flex items-center gap-1">COORD <Clock size={8}/></span>
                                 <span className={`font-bold ${item.coordinateTime && item.coordinateTime < 1.0 ? 'text-green-400' : 'text-white'}`}>
                                     {item.coordinateTime}s
                                 </span>
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="mt-auto pt-2">
                             {isOwned ? (
                                 <button 
                                    onClick={() => onEquip(activeCategory, item)}
                                    disabled={isEquipped}
                                    className={`w-full py-2 rounded font-bold text-xs transition-all ${isEquipped ? 'bg-gray-700 text-gray-500 cursor-default' : 'bg-white text-black hover:bg-gray-200'}`}
                                 >
                                     {isEquipped ? 'EQUIPPED' : 'EQUIP ITEM'}
                                 </button>
                             ) : (
                                 <button 
                                    onClick={() => onBuy(activeCategory, item)}
                                    disabled={!canAfford}
                                    className={`w-full py-2 rounded font-bold text-xs transition-all flex items-center justify-center gap-2 ${canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                 >
                                     {canAfford ? 'PURCHASE' : <><Lock size={12} /> INSUFFICIENT FUNDS</>}
                                 </button>
                             )}
                         </div>

                     </div>
                 );
             })}
         </div>
      </div>
    </div>
  );
};

const UserIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
