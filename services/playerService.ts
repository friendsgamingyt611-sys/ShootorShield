

import { PlayerStats, ItemStats, DailyTask, MatchResult, Achievement } from '../types';
import { INITIAL_PLAYER, DAILY_TASK_TEMPLATES, getLevelXp, GUNS, SHIELDS, ARMORS, DAILY_LOGIN_REWARD, ACHIEVEMENTS } from '../constants';
import { cloudService } from './cloud';
import { authService } from './auth';

class PlayerService {
  
  // Now accepts an optional player to initialize, otherwise uses default
  public initializeState(serverPlayer?: PlayerStats): { player: PlayerStats, rewardClaimed: boolean } {
    let player = serverPlayer ? { ...INITIAL_PLAYER, ...serverPlayer } : { ...INITIAL_PLAYER };
    
    // Re-hydrate items logic (in case JSON lost function references or specific object pointers)
    player.gun = GUNS.find(g => g.id === player.gun.id) || GUNS[0];
    player.shield = SHIELDS.find(s => s.id === player.shield.id) || SHIELDS[0];
    player.armorItem = ARMORS.find(a => a.id === player.armorItem.id) || ARMORS[0];

    // Ensure daily tasks exist
    if (!player.dailyTasks || player.dailyTasks.length === 0) {
        player.dailyTasks = this.generateDailyTasks();
    }

    // Login Reward Logic
    let rewardClaimed = false;
    const now = Date.now();
    const lastLogin = new Date(player.lastLogin || 0);
    const today = new Date(now);
    
    const isSameDay = lastLogin.getDate() === today.getDate() && 
                      lastLogin.getMonth() === today.getMonth() && 
                      lastLogin.getFullYear() === today.getFullYear();

    if (!isSameDay) {
      player.credits += DAILY_LOGIN_REWARD;
      player.dailyTasks = this.generateDailyTasks();
      player.lastLogin = now;
      rewardClaimed = true;
      this.saveProfile(player);
    }

    return { player, rewardClaimed };
  }

  public saveProfile(player: PlayerStats) {
    const token = authService.getToken();
    if (token) {
        cloudService.syncProfile(player, token).catch(err => console.warn("Background sync error", err));
    }
    // Also update local cache for offline robustness / faster loads
    localStorage.setItem('sos_user_cache', JSON.stringify(player));
  }

  public updateProfile(player: PlayerStats, name: string, avatarBase64?: string): PlayerStats {
    const newPlayer = {
        ...player,
        name: name || player.name,
        customAvatar: avatarBase64 || player.customAvatar
    };
    
    // If name changed, update it on the auth/user level too
    if (name !== player.name) {
        const token = authService.getToken();
        if (token) cloudService.updateCallsign(token, name);
    }

    this.saveProfile(newPlayer);
    return newPlayer;
  }

  // --- CORE LOGIC UPDATES ---

  public updateDetailedStats(player: PlayerStats, matchResult: MatchResult): PlayerStats {
      const isWin = matchResult.victoryReason === "VICTORY";
      
      let newWinStreak = isWin ? player.winStreak + 1 : 0;
      let newBestStreak = Math.max(player.bestWinStreak, newWinStreak);

      const totalShots = player.totalShotsFired + matchResult.shotsFired;
      const totalHits = player.totalShotsHit + matchResult.shotsHit;
      const acc = totalShots > 0 ? totalHits / totalShots : 0;

      return {
          ...player,
          totalMatchesPlayed: player.totalMatchesPlayed + 1,
          matchesWon: isWin ? player.matchesWon + 1 : player.matchesWon,
          matchesLost: !isWin ? player.matchesLost + 1 : player.matchesLost,
          winStreak: newWinStreak,
          bestWinStreak: newBestStreak,
          totalDamageDealt: player.totalDamageDealt + matchResult.damageDealt,
          totalDamageTaken: player.totalDamageTaken + matchResult.damageTaken,
          totalShotsFired: totalShots,
          totalShotsHit: totalHits,
          accuracyPercentage: acc
      };
  }

  public checkAchievements(player: PlayerStats): { player: PlayerStats, newUnlocks: Achievement[] } {
      const newUnlocks: Achievement[] = [];
      const currentAchievementIds = new Set(player.achievements.map(a => a.achievementId));
      const token = authService.getToken();

      ACHIEVEMENTS.forEach(ach => {
          if (!currentAchievementIds.has(ach.id)) {
              if (ach.condition(player)) {
                  newUnlocks.push(ach);
                  if (token) cloudService.unlockAchievement(player.id, ach.id, token);
              }
          }
      });

      if (newUnlocks.length === 0) return { player, newUnlocks: [] };

      const updatedPlayer = {
          ...player,
          achievements: [
              ...player.achievements,
              ...newUnlocks.map(u => ({ achievementId: u.id, unlockedAt: Date.now() }))
          ]
      };
      
      return { player: updatedPlayer, newUnlocks };
  }

  public addXp(player: PlayerStats, amount: number): { player: PlayerStats, leveledUp: boolean } {
    let newPlayer = { ...player };
    newPlayer.xp += amount;
    let leveledUp = false;

    while (newPlayer.xp >= newPlayer.maxXp) {
      newPlayer.xp -= newPlayer.maxXp;
      newPlayer.level += 1;
      newPlayer.maxXp = getLevelXp(newPlayer.level);
      newPlayer.credits += 100; // Level up reward
      leveledUp = true;
    }
    
    return { player: newPlayer, leveledUp };
  }

  public updateTasks(player: PlayerStats, type: 'WIN' | 'PLAY' | 'DAMAGE' | 'BLOCK', amount: number): PlayerStats {
    const newTasks = player.dailyTasks.map(task => {
      if (task.type === type && !task.isClaimed) {
        return { ...task, current: Math.min(task.target, task.current + amount) };
      }
      return task;
    });
    
    const newPlayer = { ...player, dailyTasks: newTasks };
    this.saveProfile(newPlayer);
    return newPlayer;
  }

  public claimTask(player: PlayerStats, taskId: string): PlayerStats {
    const taskIndex = player.dailyTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return player;

    const task = player.dailyTasks[taskIndex];
    if (task.isClaimed || task.current < task.target) return player;

    const newTasks = [...player.dailyTasks];
    newTasks[taskIndex] = { ...task, isClaimed: true };
    
    const newPlayer = { 
      ...player, 
      credits: player.credits + task.reward,
      dailyTasks: newTasks
    };
    
    this.saveProfile(newPlayer);
    return newPlayer;
  }

  public purchaseItem(player: PlayerStats, item: ItemStats): PlayerStats {
    if (player.credits < item.cost) return player;
    if (player.inventory.includes(item.id)) return player;

    const newPlayer = {
      ...player,
      credits: player.credits - item.cost,
      inventory: [...player.inventory, item.id]
    };

    this.saveProfile(newPlayer);
    return newPlayer;
  }

  public equipItem(player: PlayerStats, type: 'gun' | 'shield' | 'armor', item: ItemStats): PlayerStats {
    if (!player.inventory.includes(item.id)) return player;

    const newPlayer = { ...player };
    if (type === 'gun') {
        newPlayer.gun = item;
        newPlayer.ammo = item.maxCharges || 6;
        newPlayer.maxAmmo = item.maxCharges || 6;
    } else if (type === 'shield') {
        newPlayer.shield = item;
        newPlayer.shieldCharges = item.maxCharges || 3;
        newPlayer.maxShieldCharges = item.maxCharges || 3;
    } else if (type === 'armor') {
        newPlayer.armorItem = item;
        newPlayer.maxArmor = item.value; 
        newPlayer.armor = item.value;
    }

    this.saveProfile(newPlayer);
    return newPlayer;
  }

  private generateDailyTasks(): DailyTask[] {
    const shuffled = [...DAILY_TASK_TEMPLATES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(t => ({
      ...t,
      current: 0,
      isClaimed: false
    }));
  }
}

export const playerService = new PlayerService();