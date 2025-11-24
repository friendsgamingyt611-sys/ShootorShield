

import { ItemStats, PlayerStats, Character, TimeFormat, DailyTask, Achievement } from './types';

export const BASE_SHIELD_PENALTY = 15;
export const STARTING_CREDITS = 100; 
export const WIN_REWARD = 100;
export const XP_PER_WIN = 100;
export const XP_PER_LOSS = 25;
export const TIMEOUT_PENALTY = 20; 
export const NETWORK_TIMEOUT_MS = 30000;
export const LOBBY_COUNTDOWN_DURATION = 5; 

// Flow Durations
export const INTRO_DURATION = 2; 
export const SHOPPING_DURATION = 15; 
export const RESOLUTION_DELAY = 5; 
export const PREPARATION_DURATION = 3; 

export const DEFAULT_MAX_ROUNDS = 3; 
export const DEFAULT_TIME_FORMAT: TimeFormat = 'RAPID';

export const TIME_CONTROLS: Record<TimeFormat, number> = {
    'BULLET': 5,
    'BLITZ': 10,
    'RAPID': 20,     
    'TACTICAL': 60   
};

export const TURN_DURATION = TIME_CONTROLS[DEFAULT_TIME_FORMAT];

// --- CLASH SQUAD ECONOMY CONSTANTS ---
export const MATCH_STARTING_CASH = 500;
export const ROUND_WIN_CASH = 1500;
export const ROUND_LOSS_CASH = 800;
export const SURVIVAL_BONUS = 200;
export const KILL_BONUS = 300;

// Elo Constants
export const K_FACTOR = 32; 
export const STARTING_ELO = 1200;
export const DAILY_LOGIN_REWARD = 200;

export const RANK_TITLES = [
    { min: 0, title: 'Script Kiddie', color: 'text-gray-500' },
    { min: 1100, title: 'Hacker', color: 'text-green-500' },
    { min: 1300, title: 'Operative', color: 'text-blue-500' },
    { min: 1500, title: 'Elite', color: 'text-purple-500' },
    { min: 1700, title: 'Cyber-Master', color: 'text-orange-500' },
    { min: 2000, title: 'Grandmaster', color: 'text-yellow-500 animate-pulse' }
];

export const getRankTitle = (elo: number) => {
    return RANK_TITLES.slice().reverse().find(r => elo >= r.min) || RANK_TITLES[0];
};

export const getLevelXp = (level: number) => {
    return level * 500; 
}

export const PLAYSTYLE_TAGS = [
    { id: 'rusher', label: 'RUSHER', color: 'bg-red-600' },
    { id: 'tactical', label: 'TACTICIAN', color: 'bg-blue-600' },
    { id: 'tank', label: 'TANK', color: 'bg-green-600' },
    { id: 'sniper', label: 'SNIPER', color: 'bg-purple-600' },
    { id: 'camper', label: 'SURVIVOR', color: 'bg-gray-600' },
];

// --- ACHIEVEMENTS ---
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Win your first match.',
        tier: 'BRONZE',
        icon: '⚔️',
        condition: (stats) => stats.matchesWon >= 1
    },
    {
        id: 'veteran',
        name: 'Veteran',
        description: 'Play 50 matches.',
        tier: 'SILVER',
        icon: '🎖️',
        condition: (stats) => stats.totalMatchesPlayed >= 50
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Reach a win streak of 5.',
        tier: 'GOLD',
        icon: '🔥',
        condition: (stats) => stats.winStreak >= 5
    },
    {
        id: 'damage_dealer',
        name: 'Heavy Hitter',
        description: 'Deal 10,000 total damage.',
        tier: 'SILVER',
        icon: '💥',
        condition: (stats) => stats.totalDamageDealt >= 10000
    },
    {
        id: 'cyber_god',
        name: 'Cyber God',
        description: 'Reach Level 50.',
        tier: 'PLATINUM',
        icon: '🤖',
        condition: (stats) => stats.level >= 50
    },
    {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Maintain 80% Accuracy (min 100 shots).',
        tier: 'GOLD',
        icon: '🎯',
        condition: (stats) => stats.totalShotsFired > 100 && stats.accuracyPercentage >= 0.8
    }
];

// --- CHARACTERS WITH ABILITIES ---
export const CHARACTERS: Character[] = [
  {
    id: 'c1',
    name: 'Spectre',
    role: 'Stealth',
    description: 'A ghost in the machine. Hard to hit.',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-900/50 to-black',
    passiveAbility: {
        name: 'Phantom Step',
        description: '15% chance to dodge incoming damage completely.',
        type: 'DODGE',
        value: 0.15
    }
  },
  {
    id: 'c2',
    name: 'Vanguard',
    role: 'Heavy',
    description: 'Immovable object. Damage mitigation.',
    color: 'text-orange-500',
    bgGradient: 'from-orange-900/50 to-black',
    passiveAbility: {
        name: 'Iron Plating',
        description: 'Reduces all incoming damage by 15%.',
        type: 'MITIGATION',
        value: 0.15
    }
  },
  {
    id: 'c3',
    name: 'Neon',
    role: 'Tech',
    description: 'Hacks reality. Resource efficiency.',
    color: 'text-purple-400',
    bgGradient: 'from-purple-900/50 to-black',
    passiveAbility: {
        name: 'Overclock',
        description: '20% chance to not consume ammo when firing.',
        type: 'AMMO_SAVER',
        value: 0.20
    }
  }
];

export const RANDOM_NAMES = [
  "Glitch", "Zero", "Vortex", "Cipher", "Dredd", "Nova", "Flux", "Reaper", "Kilo", "Echo"
];

export const DAILY_TASK_TEMPLATES: Omit<DailyTask, 'current' | 'isClaimed'>[] = [
    { id: 'task_win_1', description: "Win 1 Match", target: 1, reward: 50, type: 'WIN' },
    { id: 'task_play_3', description: "Play 3 Matches", target: 3, reward: 100, type: 'PLAY' },
    { id: 'task_dmg_500', description: "Deal 500 Damage", target: 500, reward: 150, type: 'DAMAGE' },
    { id: 'task_block_5', description: "Perfect Block 5 Shots", target: 5, reward: 100, type: 'BLOCK' },
];

// --- ITEMS WITH SCALING & ABILITIES ---

export const GUNS: ItemStats[] = [
  { id: 'g1', name: 'G18', tier: 1, value: 25, cost: 0, matchCost: 0, description: '25 DMG. Standard issue.', maxCharges: 99, visualType: 'pistol', ability: 'NONE', coordinateTime: 1.5 },
  { id: 'g2', name: 'Pulse Rifle', tier: 1, value: 30, cost: 200, matchCost: 600, description: '30 DMG. 15% Crit Chance.', maxCharges: 12, visualType: 'rifle', ability: 'CRITICAL', abilityChance: 0.15, coordinateTime: 1.2 },
  { id: 'g3', name: 'Plasma Blaster', tier: 2, value: 35, cost: 500, matchCost: 1200, description: '35 DMG. Ignores 30% Armor.', maxCharges: 8, visualType: 'blaster', ability: 'PIERCING', abilityChance: 0.30, coordinateTime: 1.0 },
  { id: 'g4', name: 'Widowmaker', tier: 2, value: 45, cost: 800, matchCost: 1800, description: '45 DMG. 30% Crit Chance.', maxCharges: 5, visualType: 'sniper', ability: 'CRITICAL', abilityChance: 0.30, coordinateTime: 0.8 },
  { id: 'g5', name: 'Omega Railgun', tier: 3, value: 55, cost: 2000, matchCost: 2500, description: '55 DMG. Ignores 50% Armor.', maxCharges: 4, visualType: 'railgun', ability: 'PIERCING', abilityChance: 0.50, coordinateTime: 0.4 },
];

export const SHIELDS: ItemStats[] = [
  { id: 's1', name: 'Lid', tier: 1, value: 0, cost: 0, matchCost: 0, description: '15 Penalty Damage.', maxCharges: 3, visualType: 'basic', ability: 'NONE', coordinateTime: 1.2 },
  { id: 's2', name: 'Riot Shield', tier: 1, value: 5, cost: 200, matchCost: 400, description: '10 Penalty. 20% Reflect.', maxCharges: 4, visualType: 'riot', ability: 'REFLECT', abilityChance: 0.2, coordinateTime: 1.0 },
  { id: 's3', name: 'Energy Barrier', tier: 2, value: 8, cost: 500, matchCost: 1000, description: '7 Penalty. 10% Regen.', maxCharges: 6, visualType: 'energy', ability: 'REGEN_SHIELD', abilityChance: 0.1, coordinateTime: 0.8 },
  { id: 's4', name: 'Aegis System', tier: 2, value: 12, cost: 800, matchCost: 1500, description: '3 Penalty. 40% Reflect.', maxCharges: 7, visualType: 'tech', ability: 'REFLECT', abilityChance: 0.4, coordinateTime: 0.6 },
  { id: 's5', name: 'Void Matrix', tier: 3, value: 15, cost: 2000, matchCost: 2200, description: '0 Penalty. 50% Reflect.', maxCharges: 10, visualType: 'void', ability: 'REFLECT', abilityChance: 0.5, coordinateTime: 0.2 },
];

export const ARMORS: ItemStats[] = [
  { id: 'a1', name: 'Leather Jacket', tier: 1, value: 0, cost: 0, matchCost: 0, description: 'No Protection.', ability: 'NONE', coordinateTime: 1.0 },
  { id: 'a2', name: 'Vest Lvl 1', tier: 1, value: 50, cost: 200, matchCost: 400, description: '50 Armor HP.', ability: 'NONE', coordinateTime: 0.9 },
  { id: 'a3', name: 'Vest Lvl 2', tier: 2, value: 100, cost: 600, matchCost: 800, description: '100 Armor HP.', ability: 'NONE', coordinateTime: 0.7 },
  { id: 'a4', name: 'Nano-Suit', tier: 3, value: 150, cost: 1500, matchCost: 1200, description: '150 Armor HP + Auto Repair.', ability: 'AUTO_REPAIR', abilityChance: 0.1, coordinateTime: 0.5 },
];

export const INITIAL_PLAYER: PlayerStats = {
  id: 'player',
  username: 'user_guest',
  isBot: false,
  teamId: 1,
  isReady: false,
  isHost: false,
  name: "Player",
  level: 1,
  elo: STARTING_ELO,
  xp: 0,
  maxXp: 500,
  likes: 0,
  credits: STARTING_CREDITS,
  lastLogin: Date.now(),
  inventory: ['g1', 's1', 'a1'],
  dailyTasks: [],
  customAvatar: '',
  
  // Extended Stats
  totalMatchesPlayed: 0,
  matchesWon: 0,
  matchesLost: 0,
  winStreak: 0,
  bestWinStreak: 0,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  totalShotsFired: 0,
  totalShotsHit: 0,
  accuracyPercentage: 0,
  achievements: [],
  privacySettings: {
      showEmail: false,
      showExactStats: true,
      allowFriendRequests: true,
      publicProfile: true
  },
  userSettings: {
      lowQualityMode: false,
      showFPS: true,
      rememberMe: false,
      region: 'NA-EAST',
      volume: 100
  },
  
  character: CHARACTERS[0],
  health: 100,
  maxHealth: 100,
  armor: 0,
  maxArmor: 0,
  
  gun: GUNS[0],
  shield: SHIELDS[0],
  armorItem: ARMORS[0],
  
  ammo: GUNS[0].maxCharges || 6,
  maxAmmo: GUNS[0].maxCharges || 6,
  shieldCharges: SHIELDS[0].maxCharges || 3,
  maxShieldCharges: SHIELDS[0].maxCharges || 3,

  roundsWon: 0,
  cumulativeHealth: 0,
  successfulActions: 0,
  matchCash: MATCH_STARTING_CASH
};

export const INITIAL_OPPONENT: PlayerStats = {
  ...INITIAL_PLAYER,
  id: 'cpu',
  username: 'cpu_bot',
  isBot: true,
  teamId: 2,
  isReady: true,
  name: "CPU",
  credits: 0,
  inventory: [],
  character: CHARACTERS[1]
};
