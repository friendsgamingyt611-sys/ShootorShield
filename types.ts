

export enum ActionType {
  SHOOT = 'SHOOT',
  SHIELD = 'SHIELD',
  IDLE = 'IDLE'
}

export type GameMode = 'SOLO' | 'MULTIPLAYER';
export type MatchType = '1v1' | '2v2' | '3v3' | '4v4' | 'CUSTOM';
export type TimeFormat = 'BULLET' | 'BLITZ' | 'RAPID' | 'TACTICAL'; 
export type CombatSubPhase = 'INTRO' | 'SHOPPING' | 'DECISION' | 'RESOLUTION' | 'PREPARATION' | 'ROUND_OVER';

export interface Character {
  id: string;
  name: string; 
  role: string; 
  description: string;
  color: string; 
  bgGradient: string; 
  passiveAbility: {
      name: string;
      description: string;
      type: 'DODGE' | 'MITIGATION' | 'AMMO_SAVER';
      value: number; 
  };
}

export type ItemTier = 1 | 2 | 3;

export type ItemAbilityType = 'NONE' | 'CRITICAL' | 'PIERCING' | 'LIFESTEAL' | 'REFLECT' | 'REGEN_SHIELD' | 'AUTO_REPAIR';

export interface ItemStats {
  id: string;
  name: string;
  tier: ItemTier;
  value: number; 
  cost: number; 
  matchCost?: number; 
  description: string;
  maxCharges?: number; 
  visualType?: string; 
  ability?: ItemAbilityType;
  abilityChance?: number; 
  coordinateTime?: number; 
}

export interface MatchRecord {
    id: string;
    timestamp: number;
    opponentName: string;
    result: 'VICTORY' | 'DEFEAT' | 'DRAW';
    eloChange: number;
    creditsEarned: number;
    xpEarned: number;
    stats: {
        damageDealt: number;
        shotsFired: number;
        shotsHit: number;
        accuracy: number;
    };
    mode: GameMode;
}

export interface MatchResult {
  eloChange: number;
  xpGained: number;
  creditsGained: number;
  oldElo: number;
  newElo: number;
  title: string;
  leveledUp: boolean; 
  completedTasks: string[]; 
  victoryReason?: string;
  damageDealt: number;
  damageTaken: number;
  shotsFired: number;
  shotsHit: number;
  blocksSuccessful: number;
  newAchievements?: Achievement[];
}

export interface DailyTask {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  isClaimed: boolean;
  type: 'WIN' | 'PLAY' | 'DAMAGE' | 'BLOCK';
}

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    tier: AchievementTier;
    icon: string;
    condition: (stats: PlayerStats) => boolean;
}

export interface PlayerAchievement {
    achievementId: string;
    unlockedAt: number;
}

export interface PrivacySettings {
    showEmail: boolean;
    showExactStats: boolean;
    allowFriendRequests: boolean;
    publicProfile: boolean;
}

export interface UserSettings {
    lowQualityMode: boolean;
    showFPS: boolean;
    rememberMe: boolean;
    region: string;
    volume: number;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    player?: PlayerStats;
    message?: string;
}

export interface MatchStats {
    damage: number;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
}

export interface PlayerStats {
  id: string; 
  name: string; 
  username: string; 
  isBot: boolean;
  teamId: number; 
  isReady: boolean;
  isHost: boolean;
  level: number; 
  elo: number; 
  xp: number;    
  maxXp: number; 
  credits: number; 
  likes: number; 
  totalMatchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winStreak: number;
  bestWinStreak: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalShotsFired: number;
  totalShotsHit: number;
  accuracyPercentage: number;
  achievements: PlayerAchievement[];
  matchHistory: MatchRecord[];
  privacySettings: PrivacySettings;
  userSettings: UserSettings;
  lastLogin?: number;
  inventory: string[]; 
  dailyTasks: DailyTask[];
  customAvatar?: string; 
  character: Character;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  gun: ItemStats;
  shield: ItemStats;
  armorItem: ItemStats;
  ammo: number;
  maxAmmo: number;
  shieldCharges: number;
  maxShieldCharges: number;
  matchStats: MatchStats;
  roundsWon: number;
  cumulativeHealth: number; 
  successfulActions: number; 
  matchCash: number; 
  hasLockedIn?: boolean; 
  matchResult?: MatchResult;
  profile?: PlayerProfile;
}

export type RelationshipStatus = 'NONE' | 'FRIEND' | 'PENDING_INCOMING' | 'PENDING_OUTGOING';

export interface PlayerProfile {
    id: string;
    name: string;
    level: number;
    elo: number;
    avatarId: string;
    customAvatar?: string; 
    tags: string[]; 
    stats: {
        matchesPlayed: number;
        winRate: number;
        kdRatio: number;
        headshotRate: number;
    };
    relationship: RelationshipStatus; // Status relative to the viewer
    status: 'ONLINE' | 'IN_GAME' | 'OFFLINE';
    social?: {
        friendsCount: number;
        mutualsCount: number;
        topFriends?: Friend[]; // Subset for display
    }
}

export interface Friend {
    id: string;
    name: string;
    level: number;
    status: 'ONLINE' | 'IN_GAME' | 'OFFLINE' | 'LOBBY';
    relationship: RelationshipStatus;
    lastSeen: number;
    avatarId: string;
    customAvatar?: string;
    username?: string; // Needed for P2P lookups
    currentLobby?: string; // If status is LOBBY
}

export interface GameState {
  round: number;
  maxRounds: number; 
  timeFormat: TimeFormat; 
  turnDuration: number; 
  isPublic: boolean; 
  phase: 'AUTH' | 'MAIN_MENU' | 'MULTIPLAYER_LOBBY' | 'LOBBY_ROOM' | 'CHARACTER_SELECT' | 'COMBAT' | 'SHOP' | 'GAMEOVER' | 'VICTORY' | 'MATCH_HISTORY' | 'POST_MATCH';
  combatSubPhase: CombatSubPhase; 
  mode: GameMode;
  matchType: MatchType;
  customTeamSize?: number; 
  roomCode?: string;
  turnLog: TurnResult[];
  myId: string;
  players: PlayerStats[]; 
  matchups: Record<string, string>; 
  startTimer: number; 
  player: PlayerStats;
  opponent: PlayerStats;
  lastAction?: ActionType; 
  opponentLastAction?: ActionType; 
  isProcessing: boolean;
  isConnected: boolean;
  isHost: boolean;
  matchResult?: MatchResult;
  victoryReason?: string;
  winnerTeam?: number; 
  inspectingPlayer?: PlayerProfile | null;
  isSocialOpen: boolean;
  isSettingsOpen: boolean;
  newUnlock?: Achievement;
}

export interface TurnResult {
  round: number;
  playerAction: ActionType;
  opponentAction: ActionType;
  description: string;
  playerDamageTaken: number;
  opponentDamageTaken: number;
  playerPenaltyTaken: number;
  opponentPenaltyTaken: number;
  playerIntensity?: number; 
  opponentIntensity?: number;
  specialEvents?: string[]; 
}

export interface AIResponse {
  action: ActionType;
  intensity?: number; 
  thoughtProcess: string; 
  taunt: string;
}

export type ChatScope = 'GLOBAL' | 'TEAM' | 'WHISPER' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  scope: ChatScope;
  timestamp: number;
  targetId?: string; 
  teamId?: number; 
  actionRequest?: {
      type: 'SWAP_REQUEST';
      payload: any;
  }; 
}

export type PacketType = 
    'HANDSHAKE' | 'LOBBY_UPDATE' | 'PLAYER_READY' | 'START_GAME' | 'COMMIT_MOVE' | 'CHAT' | 'KICK' | 
    'GAME_STATE_SYNC' | 'GAME_EVENT' | 'SWITCH_TEAM' | 'LOBBY_SETTINGS' | 'LOBBY_CLOSED' | 'LEAVE' | 
    'MATCH_BUY' | 'LOOT_REQUEST' | 'INVITE_LOBBY' | 'RETURN_TO_LOBBY' | 'SOCIAL_STATUS' |
    'FRIEND_REQUEST' | 'FRIEND_ACCEPT' | 'FRIEND_DECLINE' | 'FRIEND_REMOVE' |
    'SOCIAL_GRAPH_REQUEST' | 'SOCIAL_GRAPH_RESPONSE';

export interface NetworkPacket {
  type: PacketType;
  payload: any;
  senderId?: string;
}

export interface HandshakePayload {
  id: string;
  name: string;
  character: Character;
  level: number;
  elo: number;
  profile?: PlayerProfile; 
}

export interface MovePayload {
  action: ActionType;
  round: number;
  intensity?: number; 
}

export interface LobbyUpdatePayload {
  players: PlayerStats[];
  matchType: MatchType;
  matchups?: Record<string, string>;
  startTimer?: number;
  maxRounds?: number;
  timeFormat?: TimeFormat;
  isPublic?: boolean;
  customTeamSize?: number;
}

export interface GameEventPayload {
  type: 'LIKE';
  targetId: string;
}

export interface SwitchTeamPayload {
    playerId: string;
    targetTeamId: number;
    targetSlotIndex?: number; 
}

export interface AuthSession {
    token: string;
    userId: string;
    expiresAt: number;
}