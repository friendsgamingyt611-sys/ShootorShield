

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ActionType, 
  GameState, 
  PlayerStats, 
  TurnResult,
  GameMode,
  MatchType,
  NetworkPacket,
  HandshakePayload,
  MovePayload,
  ChatMessage,
  ChatScope,
  LobbyUpdatePayload,
  GameEventPayload,
  SwitchTeamPayload,
  TimeFormat,
  ItemStats,
  MatchResult,
  PlayerProfile
} from '../types';
import { 
  INITIAL_PLAYER, 
  INITIAL_OPPONENT, 
  BASE_SHIELD_PENALTY,
  TIME_CONTROLS,
  DEFAULT_TIME_FORMAT,
  CHARACTERS,
  LOBBY_COUNTDOWN_DURATION,
  INTRO_DURATION,
  RESOLUTION_DELAY,
  PREPARATION_DURATION,
  DEFAULT_MAX_ROUNDS,
  K_FACTOR,
  STARTING_ELO,
  getRankTitle,
  getLevelXp,
  WIN_REWARD,
  XP_PER_WIN,
  XP_PER_LOSS,
  TIMEOUT_PENALTY,
  MATCH_STARTING_CASH,
  ROUND_WIN_CASH,
  ROUND_LOSS_CASH,
  SURVIVAL_BONUS,
  KILL_BONUS,
  SHOPPING_DURATION,
  GUNS,
  SHIELDS,
  ARMORS
} from '../constants';
import { getAIMove } from '../services/geminiService';
import { NetworkService } from '../services/network';
import { playerService } from '../services/playerService';
import { socialService } from '../services/socialService';

export const useGameEngine = (initialPlayer?: PlayerStats) => {
  const [gameState, setGameState] = useState<GameState>({
    round: 1,
    maxRounds: DEFAULT_MAX_ROUNDS,
    timeFormat: DEFAULT_TIME_FORMAT,
    turnDuration: TIME_CONTROLS[DEFAULT_TIME_FORMAT],
    isPublic: false,
    phase: 'MAIN_MENU',
    combatSubPhase: 'INTRO',
    mode: 'SOLO',
    matchType: '1v1',
    turnLog: [],
    myId: '',
    players: [],
    matchups: {},
    startTimer: 0, 
    player: { ...INITIAL_PLAYER, id: 'me', isHost: true, isReady: false, teamId: 1, isBot: false },
    opponent: { ...INITIAL_OPPONENT, id: 'cpu', isHost: false, isReady: true, teamId: 2, isBot: true },
    isProcessing: false,
    isConnected: false,
    isHost: false,
    isSocialOpen: false,
    isSettingsOpen: false
  });

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const launchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const combatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolutionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shoppingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [uiState, setUiState] = useState({
    inputName: "",
    selectedCharIndex: 0,
    gameMessage: "Welcome to Shoot or Shield. Select Protocol.",
    timeLeft: TIME_CONTROLS[DEFAULT_TIME_FORMAT],
    localLockedAction: null as ActionType | null,
    actionCooldownUntil: 0,
    dailyRewardClaimed: false
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);

  const chatState = {
      messages: chatMessages,
      isOpen: showChat,
      setIsOpen: setShowChat
  };

  // Stores action AND intensity (burst amount)
  const committedMoves = useRef<Map<string, { action: ActionType, round: number, intensity: number }>>(new Map());

  // --- INIT & PERSISTENCE ---
  useEffect(() => {
      // Use the player passed from App auth or initialize default
      const { player, rewardClaimed } = playerService.initializeState(initialPlayer);
      
      setGameState(prev => ({ ...prev, player: { ...prev.player, ...player } }));
      setUiState(prev => ({ ...prev, dailyRewardClaimed: rewardClaimed, inputName: player.name }));

      // Check for deep links
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
          setGameState(prev => ({ ...prev, roomCode: roomParam, mode: 'MULTIPLAYER', phase: 'MULTIPLAYER_LOBBY' }));
      }

      return () => {
          cleanupTimers();
      };
  }, [initialPlayer]);

  // Sync when player object changes significantly (backup safety)
  useEffect(() => {
      if (initialPlayer && initialPlayer.id !== gameState.player.id) {
           setGameState(prev => ({ ...prev, player: { ...prev.player, ...initialPlayer } }));
      }
  }, [initialPlayer]);

  const cleanupTimers = () => {
      if (launchTimerRef.current) clearInterval(launchTimerRef.current);
      if (combatTimerRef.current) clearInterval(combatTimerRef.current);
      if (shoppingTimerRef.current) clearInterval(shoppingTimerRef.current);
      if (resolutionTimeoutRef.current) clearTimeout(resolutionTimeoutRef.current);
      if (prepTimeoutRef.current) clearTimeout(prepTimeoutRef.current);
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
  };

  // --- HELPER FUNCTIONS ---
  
  const addChatMessage = (msg: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-49), msg]);
  };

  const broadcastChat = (msg: ChatMessage) => {
      NetworkService.broadcast('CHAT', msg);
  };

  const broadcastLobbyUpdate = (players: PlayerStats[]) => {
    NetworkService.broadcast('LOBBY_UPDATE', { 
      players, matchType: gameStateRef.current.matchType, startTimer: gameStateRef.current.startTimer, maxRounds: gameStateRef.current.maxRounds, timeFormat: gameStateRef.current.timeFormat, isPublic: gameStateRef.current.isPublic, customTeamSize: gameStateRef.current.customTeamSize
    });
  };

  const broadcastSync = (state: GameState, players: PlayerStats[], message: string) => {
    NetworkService.broadcast('GAME_STATE_SYNC', {
        phase: state.phase,
        combatSubPhase: state.combatSubPhase,
        round: state.round,
        players: players,
        gameMessage: message,
        timeLeft: state.turnDuration
    });
  };

  const handlePlayerDisconnect = (peerId: string) => {
      if (gameStateRef.current.isHost) {
           setGameState(prev => {
               const updatedPlayers = prev.players.filter(p => p.id !== peerId);
               broadcastLobbyUpdate(updatedPlayers);
               return { ...prev, players: updatedPlayers };
           });
      }
  };

  const buyItem = (type: 'gun' | 'shield' | 'armor', item: ItemStats) => {
      setGameState(prev => {
          const updatedPlayer = playerService.purchaseItem(prev.player, item);
          return { ...prev, player: updatedPlayer };
      });
  };

  const equipItem = (type: 'gun' | 'shield' | 'armor', item: ItemStats) => {
      setGameState(prev => {
          const updatedPlayer = playerService.equipItem(prev.player, type, item);
          return { ...prev, player: updatedPlayer };
      });
  };

  const claimTask = (id: string) => {
      setGameState(prev => {
          const updatedPlayer = playerService.claimTask(prev.player, id);
          return { ...prev, player: updatedPlayer };
      });
  };
  
  const nextLevel = () => {
      setGameState(prev => ({ ...prev, phase: 'MAIN_MENU', matchResult: undefined, newUnlock: undefined }));
  };
  
  const continueToShop = () => {
      setGameState(prev => ({ ...prev, phase: 'SHOP', matchResult: undefined }));
  };

  const handleUpdateProfile = (name: string, avatar: string) => {
      const updated = playerService.updateProfile(gameState.player, name, avatar);
      setGameState(prev => ({ 
          ...prev, 
          player: updated,
          inspectingPlayer: prev.inspectingPlayer && prev.inspectingPlayer.id === updated.id 
            ? { ...prev.inspectingPlayer, name: updated.name, customAvatar: updated.customAvatar } 
            : prev.inspectingPlayer
      }));
      setUiState(prev => ({ ...prev, inputName: updated.name }));
  };
  
  const clearUnlock = () => {
      setGameState(prev => ({ ...prev, newUnlock: undefined }));
  };

  const generateBot = (level: number, teamId: number, id?: string): PlayerStats => {
    const hpBonus = (level - 1) * 10;
    const botId = id || `BOT_${Math.random().toString(36).substr(2,5)}`;
    const botElo = 1000 + (level * 100);

    return {
        ...INITIAL_OPPONENT,
        id: botId,
        name: `BOT ${botId.substring(4)} [L${level}]`,
        level: level,
        elo: botElo,
        isBot: true,
        isReady: true,
        teamId: teamId,
        character: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)],
        maxHealth: 100 + hpBonus,
        health: 100 + hpBonus,
        maxArmor: 0,
        armor: 0,
        likes: 0,
        hasLockedIn: false,
        roundsWon: 0,
        cumulativeHealth: 0,
        successfulActions: 0,
        matchCash: MATCH_STARTING_CASH
    };
  };

  // --- LOBBY HANDLERS ---

  const handleCreateRoom = async () => {
      setGameState(prev => ({ ...prev, isProcessing: true }));
      try {
          const id = await NetworkService.hostGame();
          // Reload fresh state to ensure sync
          const { player } = playerService.initializeState(gameState.player); 
          
          const hostPlayer = { ...INITIAL_PLAYER, ...player, id: id, isHost: true, isReady: false, teamId: 1, roundsWon: 0, matchCash: MATCH_STARTING_CASH, cumulativeHealth: 0, successfulActions: 0 };
          
          setGameState(prev => ({
              ...prev,
              phase: 'LOBBY_ROOM',
              mode: 'MULTIPLAYER',
              isHost: true,
              myId: id,
              roomCode: id,
              players: [hostPlayer],
              player: hostPlayer,
              isConnected: true,
              isProcessing: false
          }));
      } catch (e) {
          console.error(e);
          setGameState(prev => ({ ...prev, isProcessing: false }));
          alert("Failed to create room");
      }
  };

  const handleJoinRoom = async (code: string) => {
      if (!code) return;
      setGameState(prev => ({ ...prev, isProcessing: true }));
      try {
          const connected = await NetworkService.joinGame(code);
          if (connected) {
              const { player } = playerService.initializeState(gameState.player);
              NetworkService.sendTo(code, 'HANDSHAKE', {
                  id: NetworkService.myPeerId,
                  name: player.name,
                  character: player.character,
                  level: player.level,
                  elo: player.elo,
                  profile: socialService.getProfileFor(player)
              });
              
              setGameState(prev => ({
                  ...prev,
                  phase: 'LOBBY_ROOM',
                  mode: 'MULTIPLAYER',
                  isHost: false,
                  myId: NetworkService.myPeerId,
                  roomCode: code,
                  isConnected: true,
                  isProcessing: false
              }));
          } else {
              alert("Could not connect to room: " + code);
              setGameState(prev => ({ ...prev, isProcessing: false }));
          }
      } catch (e) {
          alert("Connection failed");
          setGameState(prev => ({ ...prev, isProcessing: false }));
      }
  };

  const handleToggleReady = () => {
      if (!gameState.isConnected) return;
      const myPlayer = gameState.players.find(p => p.id === gameState.myId);
      if (!myPlayer) return;
      
      const newStatus = !myPlayer.isReady;
      NetworkService.sendTo(gameState.roomCode || '', 'PLAYER_READY', { isReady: newStatus });
      
      // Optimistic update
      setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === prev.myId ? { ...p, isReady: newStatus } : p)
      }));
  };

  const handleChangeMatchType = (type: MatchType) => {
      if (!gameState.isHost) return;
      setGameState(prev => {
          const next = { ...prev, matchType: type };
          broadcastLobbyUpdate(next.players);
          return next;
      });
  };
  
  const handleLobbySettingChange = (key: 'maxRounds' | 'isPublic' | 'customTeamSize' | 'timeFormat', val: any) => {
       if (!gameState.isHost) return;
       setGameState(prev => {
           const next = { ...prev, [key]: val };
           if (key === 'timeFormat') next.turnDuration = TIME_CONTROLS[val as TimeFormat];
           broadcastLobbyUpdate(next.players);
           return next;
       });
  };

  const handleKick = (id: string) => {
      if (!gameState.isHost) return;
      NetworkService.sendTo(id, 'KICK', {});
      setGameState(prev => {
          const nextPlayers = prev.players.filter(p => p.id !== id);
          broadcastLobbyUpdate(nextPlayers);
          return { ...prev, players: nextPlayers };
      });
  };
  
  const handleManualSwitch = (playerId: string, targetTeamId: number) => {
      if (gameState.mode === 'MULTIPLAYER') {
          if (gameState.isHost) {
              const updatedPlayers = gameState.players.map(p => p.id === playerId ? { ...p, teamId: targetTeamId, isReady: false } : p);
              setGameState(prev => ({ ...prev, players: updatedPlayers }));
              broadcastLobbyUpdate(updatedPlayers);
              NetworkService.sendTo(playerId, 'SWITCH_TEAM', { playerId, targetTeamId });
          } else if (playerId === gameState.myId) {
              NetworkService.sendTo(gameState.roomCode || '', 'SWITCH_TEAM', { playerId, targetTeamId });
          }
      }
  };

  const handleStartGame = () => {
      if (!gameState.isHost) return;
      
      const maxSlots = gameState.matchType === 'CUSTOM' ? (gameState.customTeamSize || 2) * 2 : parseInt(gameState.matchType[0]) * 2;
      let currentPlayers = [...gameState.players];
      
      if (currentPlayers.length < maxSlots) {
          const team1Count = currentPlayers.filter(p => p.teamId === 1).length;
          const team2Count = currentPlayers.filter(p => p.teamId === 2).length;
          const half = maxSlots / 2;
          
          for (let i = team1Count; i < half; i++) currentPlayers.push(generateBot(gameState.player.level, 1));
          for (let i = team2Count; i < half; i++) currentPlayers.push(generateBot(gameState.player.level, 2));
      }
      
      const matchupMap: Record<string, string> = {};
      const t1 = currentPlayers.filter(p => p.teamId === 1);
      const t2 = currentPlayers.filter(p => p.teamId === 2);
      
      t1.forEach((p, i) => {
          if (t2[i]) {
              matchupMap[p.id] = t2[i].id;
              matchupMap[t2[i].id] = p.id;
          }
      });

      setGameState(prev => ({
          ...prev,
          players: currentPlayers,
          matchups: matchupMap,
          combatSubPhase: 'INTRO',
          round: 1,
          phase: 'COMBAT'
      }));

      NetworkService.broadcast('START_GAME', { 
          players: currentPlayers, 
          matchups: matchupMap,
          settings: { 
              maxRounds: gameState.maxRounds, 
              turnDuration: TIME_CONTROLS[gameState.timeFormat]
          }
      });

      startTurnSequence(currentPlayers, matchupMap);
  };

  const handleLeaveGame = (force: boolean = false) => {
      if (gameState.isConnected) {
          NetworkService.sendTo(gameState.roomCode || '', 'LEAVE', {});
          NetworkService.disconnect();
      }
      setGameState(prev => ({ 
          ...prev, 
          phase: 'MAIN_MENU', 
          mode: 'SOLO', 
          isConnected: false, 
          players: [],
          roomCode: undefined
      }));
  };

  // --- COMBAT LOGIC ---
  
  const initializeCombat = () => {
      const opponent = generateBot(gameState.player.level, 2);
      setGameState(prev => ({
          ...prev,
          mode: 'SOLO',
          phase: 'COMBAT',
          round: 1,
          maxRounds: 3,
          opponent: opponent,
          players: [prev.player, opponent],
          matchups: { [prev.player.id]: opponent.id, [opponent.id]: prev.player.id }
      }));
      startTurnSequence([gameState.player, opponent], { [gameState.player.id]: opponent.id });
  };

  const startTurnSequence = (currentPlayers?: PlayerStats[], currentMatchups?: Record<string, string>) => {
      const players = currentPlayers || gameState.players;

      if (launchTimerRef.current) clearInterval(launchTimerRef.current);
      
      if (gameState.mode === 'MULTIPLAYER') {
          broadcastSync({ ...gameStateRef.current, phase: 'COMBAT', combatSubPhase: 'INTRO' }, players, "MATCH STARTING");
      } else {
          setGameState(prev => ({ ...prev, combatSubPhase: 'INTRO' }));
          setUiState(prev => ({ ...prev, gameMessage: "MATCH STARTING" }));
      }

      introTimeoutRef.current = setTimeout(() => {
          startShoppingPhase(players);
      }, INTRO_DURATION * 1000);
  };
  
  const startShoppingPhase = (players: PlayerStats[]) => {
       const duration = SHOPPING_DURATION;
       
       if (gameState.mode === 'MULTIPLAYER') {
            broadcastSync({ ...gameStateRef.current, combatSubPhase: 'SHOPPING', turnDuration: duration }, players, "TACTICAL SHOP OPEN");
       } else {
            setGameState(prev => ({ ...prev, combatSubPhase: 'SHOPPING', turnDuration: duration }));
            setUiState(prev => ({ ...prev, timeLeft: duration }));
       }
       
       let timeLeft = duration;
       if (shoppingTimerRef.current) clearInterval(shoppingTimerRef.current);
       
       shoppingTimerRef.current = setInterval(() => {
           timeLeft--;
           if (gameState.mode === 'SOLO') setUiState(prev => ({ ...prev, timeLeft }));
           
           if (timeLeft <= 0) {
               clearInterval(shoppingTimerRef.current as any);
               startDecisionPhase(players);
           }
       }, 1000);
  };

  const startDecisionPhase = (players: PlayerStats[]) => {
      committedMoves.current.clear();
      const duration = gameState.turnDuration;

      if (gameState.mode === 'MULTIPLAYER') {
          broadcastSync({ ...gameStateRef.current, combatSubPhase: 'DECISION', turnDuration: duration }, players, "MAKE YOUR MOVE");
      } else {
          setGameState(prev => ({ ...prev, combatSubPhase: 'DECISION', turnDuration: duration }));
          setUiState(prev => ({ ...prev, timeLeft: duration, localLockedAction: null, gameMessage: "CHOOSE ACTION" }));
      }
      
      let timeLeft = duration;
      if (combatTimerRef.current) clearInterval(combatTimerRef.current);

      combatTimerRef.current = setInterval(() => {
          timeLeft--;
          if (gameState.mode === 'SOLO') setUiState(prev => ({ ...prev, timeLeft }));

          if (timeLeft <= 0) {
              clearInterval(combatTimerRef.current as any);
              resolveTurn();
          }
      }, 1000);
  };

  const handlePlayerAction = (action: ActionType, intensity: number = 1) => {
      if (uiState.localLockedAction) return;

      setUiState(prev => ({ ...prev, localLockedAction: action }));
      setGameState(prev => ({ ...prev, lastAction: action }));

      if (gameState.mode === 'SOLO') {
          handleSoloTurn(action, intensity);
      } else {
          NetworkService.sendTo(gameState.roomCode || '', 'COMMIT_MOVE', { action, round: gameState.round, intensity });
      }
  };

  const handleSoloTurn = async (playerAction: ActionType, playerIntensity: number) => {
      if (combatTimerRef.current) clearInterval(combatTimerRef.current);
      
      setGameState(prev => ({ ...prev, isProcessing: true }));
      
      const history = gameState.turnLog.slice(-3).map(l => `R${l.round}: You ${l.playerAction} vs AI ${l.opponentAction}`);
      const aiMove = await getAIMove(gameState.player, gameState.opponent, history);
      
      setGameState(prev => ({ 
          ...prev, 
          opponentLastAction: aiMove.action,
          isProcessing: false 
      }));

      const results = resolveCombatLogic(
          { ...gameState.player, action: playerAction, intensity: playerIntensity },
          { ...gameState.opponent, action: aiMove.action, intensity: aiMove.intensity || 1 }
      );
      
      const newLog: TurnResult = {
          round: gameState.round,
          playerAction,
          opponentAction: aiMove.action,
          description: `${aiMove.taunt} (AI thought: ${aiMove.thoughtProcess})`,
          playerDamageTaken: results.p1Damage,
          opponentDamageTaken: results.p2Damage,
          playerPenaltyTaken: results.p1Penalty,
          opponentPenaltyTaken: results.p2Penalty,
          playerIntensity: playerIntensity,
          opponentIntensity: aiMove.intensity || 1,
          specialEvents: results.events
      };

      setGameState(prev => ({
          ...prev,
          player: results.p1,
          opponent: results.p2,
          turnLog: [...prev.turnLog, newLog],
          combatSubPhase: 'RESOLUTION'
      }));

      checkMatchStatus(results.p1, results.p2);
  };

  const resolveCombatLogic = (p1: PlayerStats & { action: ActionType, intensity: number }, p2: PlayerStats & { action: ActionType, intensity: number }) => {
      let p1Damage = 0;
      let p2Damage = 0;
      let p1Penalty = 0;
      let p2Penalty = 0;
      const events: string[] = [];

      if (p1.action === ActionType.SHOOT) p1.ammo = Math.max(0, p1.ammo - p1.intensity);
      if (p2.action === ActionType.SHOOT) p2.ammo = Math.max(0, p2.ammo - p2.intensity);
      
      if (p1.action === ActionType.SHIELD) p1.shieldCharges = Math.max(0, p1.shieldCharges - 1);
      if (p2.action === ActionType.SHIELD) p2.shieldCharges = Math.max(0, p2.shieldCharges - 1);

      // P1 SHOOTS
      if (p1.action === ActionType.SHOOT) {
          if (p2.action === ActionType.SHIELD) {
               if (p2.shield.ability === 'REFLECT' && Math.random() < (p2.shield.abilityChance || 0)) {
                   p1Damage += p1.gun.value * 0.5 * p1.intensity;
                   events.push(`${p2.name} Reflected Fire!`);
               }
          } else {
               let dmg = p1.gun.value * p1.intensity;
               if (p1.gun.ability === 'CRITICAL' && Math.random() < (p1.gun.abilityChance || 0)) {
                   dmg *= 1.5;
                   events.push("Critical Hit by " + p1.name + "!");
               }
               if (p2.character.passiveAbility.type === 'DODGE' && Math.random() < p2.character.passiveAbility.value) {
                   dmg = 0;
                   events.push(`${p2.name} Dodged!`);
               }
               if (p2.armor > 0) {
                   let reduction = Math.min(p2.armor, dmg);
                   if (p1.gun.ability === 'PIERCING') {
                       const ignoreAmt = (p1.gun.abilityChance || 0);
                       const effectiveArmor = p2.armor * (1 - ignoreAmt);
                       reduction = Math.min(effectiveArmor, dmg);
                   }
                   p2.armor -= reduction;
                   dmg -= reduction;
               }
               if (p2.character.passiveAbility.type === 'MITIGATION') {
                   dmg *= (1 - p2.character.passiveAbility.value);
               }
               p2Damage += dmg;
          }
      }

      // P2 SHOOTS
      if (p2.action === ActionType.SHOOT) {
          if (p1.action === ActionType.SHIELD) {
               if (p1.shield.ability === 'REFLECT' && Math.random() < (p1.shield.abilityChance || 0)) {
                   p2Damage += p2.gun.value * 0.5 * p2.intensity;
                   events.push(`${p1.name} Reflected Fire!`);
               }
          } else {
               let dmg = p2.gun.value * p2.intensity;
               if (p2.gun.ability === 'CRITICAL' && Math.random() < (p2.gun.abilityChance || 0)) {
                   dmg *= 1.5;
                   events.push("Critical Hit by " + p2.name + "!");
               }
               if (p1.character.passiveAbility.type === 'DODGE' && Math.random() < p1.character.passiveAbility.value) {
                   dmg = 0;
                   events.push(`${p1.name} Dodged!`);
               }
               if (p1.armor > 0) {
                   let reduction = Math.min(p1.armor, dmg);
                   if (p2.gun.ability === 'PIERCING') {
                       const ignoreAmt = (p2.gun.abilityChance || 0);
                       const effectiveArmor = p1.armor * (1 - ignoreAmt);
                       reduction = Math.min(effectiveArmor, dmg);
                   }
                   p1.armor -= reduction;
                   dmg -= reduction;
               }
               if (p1.character.passiveAbility.type === 'MITIGATION') {
                   dmg *= (1 - p1.character.passiveAbility.value);
               }
               p1Damage += dmg;
          }
      }

      if (p1.action === ActionType.SHIELD && p2.action !== ActionType.SHOOT) {
          const penalty = Math.max(0, BASE_SHIELD_PENALTY - p1.shield.value);
          p1Penalty += penalty;
          if (p1.armor > 0) p1.armor = Math.max(0, p1.armor - penalty);
          else p1Damage += penalty;
      }

      if (p2.action === ActionType.SHIELD && p1.action !== ActionType.SHOOT) {
          const penalty = Math.max(0, BASE_SHIELD_PENALTY - p2.shield.value);
          p2Penalty += penalty;
          if (p2.armor > 0) p2.armor = Math.max(0, p2.armor - penalty);
          else p2Damage += penalty;
      }

      p1.health = Math.max(0, p1.health - p1Damage);
      p2.health = Math.max(0, p2.health - p2Damage);
      
      p1.cumulativeHealth -= p1Damage;
      p2.cumulativeHealth -= p2Damage;

      return { p1, p2, p1Damage, p2Damage, p1Penalty, p2Penalty, events };
  };

  const resolveTurn = () => {
      if (gameState.mode === 'MULTIPLAYER' && !gameState.isHost) return;

      const players = [...gameState.players];
      const matchups = gameState.matchups;
      const logs: TurnResult[] = [];
      const processedIds = new Set<string>();

      players.forEach(p1 => {
          if (processedIds.has(p1.id)) return;
          const p2Id = matchups[p1.id];
          if (!p2Id) return;
          const p2 = players.find(p => p.id === p2Id);
          if (!p2) return;

          processedIds.add(p1.id);
          processedIds.add(p2.id);

          const p1Move = committedMoves.current.get(p1.id) || { action: ActionType.IDLE, round: gameState.round, intensity: 1 };
          const p2Move = committedMoves.current.get(p2.id) || { action: ActionType.IDLE, round: gameState.round, intensity: 1 };

          if (p2.isBot && !committedMoves.current.has(p2.id)) {
             p2Move.action = ActionType.SHOOT; 
          }

          const res = resolveCombatLogic(
              { ...p1, action: p1Move.action, intensity: p1Move.intensity }, 
              { ...p2, action: p2Move.action, intensity: p2Move.intensity }
          );
          
          const idx1 = players.findIndex(p => p.id === p1.id);
          const idx2 = players.findIndex(p => p.id === p2.id);
          players[idx1] = res.p1;
          players[idx2] = res.p2;

          if (p1.id === gameState.myId || p2.id === gameState.myId) {
              logs.push({
                  round: gameState.round,
                  playerAction: p1.id === gameState.myId ? p1Move.action : p2Move.action,
                  opponentAction: p1.id === gameState.myId ? p2Move.action : p1Move.action,
                  description: "Clash Resolved",
                  playerDamageTaken: p1.id === gameState.myId ? res.p1Damage : res.p2Damage,
                  opponentDamageTaken: p1.id === gameState.myId ? res.p2Damage : res.p1Damage,
                  playerPenaltyTaken: p1.id === gameState.myId ? res.p1Penalty : res.p2Penalty,
                  opponentPenaltyTaken: p1.id === gameState.myId ? res.p2Penalty : res.p1Penalty,
                  playerIntensity: p1.id === gameState.myId ? p1Move.intensity : p2Move.intensity,
                  opponentIntensity: p1.id === gameState.myId ? p2Move.intensity : p1Move.intensity,
                  specialEvents: res.events
              });
          }
      });

      setGameState(prev => ({
          ...prev,
          players: players,
          turnLog: [...prev.turnLog, ...logs],
          combatSubPhase: 'RESOLUTION',
          player: players.find(p => p.id === prev.myId) || prev.player,
          opponent: players.find(p => p.id === prev.matchups[prev.myId]) || prev.opponent
      }));
      
      broadcastSync({ ...gameStateRef.current, players, combatSubPhase: 'RESOLUTION', turnLog: [...gameState.turnLog, ...logs] }, players, "TURN RESOLVED");

      checkMatchStatus(null, null, players);
  };

  const checkMatchStatus = (p1?: PlayerStats | null, p2?: PlayerStats | null, allPlayers?: PlayerStats[]) => {
      setTimeout(() => {
           const state = gameStateRef.current;
           const players = allPlayers || (p1 && p2 ? [p1, p2] : state.players);
           
           const t1Alive = players.filter(p => p.teamId === 1 && p.health > 0).length;
           const t2Alive = players.filter(p => p.teamId === 2 && p.health > 0).length;
           
           if (t1Alive === 0 || t2Alive === 0) {
               const winnerTeam = t1Alive > 0 ? 1 : 2;
               endRound(winnerTeam, players);
           } else {
               startPrepPhase(players);
           }

      }, RESOLUTION_DELAY * 1000);
  };
  
  const endRound = (winnerTeam: number, players: PlayerStats[]) => {
      const updatedPlayers = players.map(p => {
          const won = p.teamId === winnerTeam;
          return {
              ...p,
              roundsWon: won ? p.roundsWon + 1 : p.roundsWon,
              matchCash: p.matchCash + (won ? ROUND_WIN_CASH : ROUND_LOSS_CASH) + (p.health > 0 ? SURVIVAL_BONUS : 0)
          };
      });

      const t1Wins = updatedPlayers.filter(p => p.teamId === 1)[0].roundsWon;
      const t2Wins = updatedPlayers.filter(p => p.teamId === 2)[0].roundsWon;
      const threshold = Math.ceil(gameState.maxRounds / 2);
      
      if (t1Wins >= threshold || t2Wins >= threshold) {
          endMatch(t1Wins >= threshold ? 1 : 2, updatedPlayers);
      } else {
          const resetPlayers = updatedPlayers.map(p => ({
              ...p,
              health: p.maxHealth,
              armor: p.maxArmor,
              ammo: p.maxAmmo,
              shieldCharges: p.maxShieldCharges,
              isReady: false
          }));
          
          setGameState(prev => ({
              ...prev,
              players: resetPlayers,
              round: prev.round + 1,
              combatSubPhase: 'ROUND_OVER',
              turnLog: []
          }));
          
          broadcastSync({ ...gameStateRef.current, round: gameStateRef.current.round + 1, combatSubPhase: 'ROUND_OVER', players: resetPlayers }, resetPlayers, `ROUND ${gameState.round} OVER`);
          
          nextRoundTimeoutRef.current = setTimeout(() => {
              startTurnSequence(resetPlayers);
          }, 5000);
      }
  };

  const endMatch = (winnerTeam: number, players: PlayerStats[]) => {
      const myPlayer = players.find(p => p.id === gameState.myId);
      const won = myPlayer?.teamId === winnerTeam;
      
      let result: MatchResult | undefined;
      let newUnlock;
      
      if (myPlayer && !myPlayer.isBot) {
          const xp = won ? XP_PER_WIN : XP_PER_LOSS;
          const credits = won ? WIN_REWARD : 25;
          
          // Update standard XP
          const { player: xpUpdated, leveledUp } = playerService.addXp(playerService.initializeState(gameState.player).player, xp);
          xpUpdated.elo += won ? 25 : -15;
          
          // Calculate Match Stats for Detailed Update
          const damageDealt = gameState.turnLog.reduce((sum, l) => l.playerAction ? sum + l.opponentDamageTaken : sum, 0);
          const damageTaken = gameState.turnLog.reduce((sum, l) => l.playerAction ? sum + l.playerDamageTaken : sum, 0);
          const shotsFired = gameState.turnLog.reduce((sum, l) => l.playerAction === ActionType.SHOOT ? sum + (l.playerIntensity || 1) : sum, 0);
          
          // Assuming successful hits if dmg > 0, loosely
          const shotsHit = gameState.turnLog.reduce((sum, l) => (l.playerAction === ActionType.SHOOT && l.opponentDamageTaken > 0) ? sum + (l.playerIntensity || 1) : sum, 0);
          const blocks = gameState.turnLog.reduce((sum, l) => (l.playerAction === ActionType.SHIELD && l.opponentAction === ActionType.SHOOT) ? sum + 1 : sum, 0);

          // Update Detailed Stats
          const matchResPartial = {
              damageDealt, damageTaken, shotsFired, shotsHit, blocksSuccessful: blocks,
              victoryReason: won ? "VICTORY" : "DEFEAT",
              eloChange: won ? 25 : -15,
              xpGained: xp,
              creditsGained: credits,
              oldElo: myPlayer.elo,
              newElo: xpUpdated.elo,
              title: getRankTitle(xpUpdated.elo).title,
              leveledUp,
              completedTasks: []
          };
          
          let finalPlayer = playerService.updateDetailedStats(xpUpdated, matchResPartial as MatchResult);
          
          // Update Tasks
          finalPlayer = playerService.updateTasks(finalPlayer, 'PLAY', 1);
          if (won) finalPlayer = playerService.updateTasks(finalPlayer, 'WIN', 1);
          
          // Check Achievements
          const { player: achPlayer, newUnlocks } = playerService.checkAchievements(finalPlayer);
          finalPlayer = achPlayer;
          
          // Save all
          playerService.saveProfile({ ...finalPlayer, credits: finalPlayer.credits + credits });
          
          result = {
              ...matchResPartial,
              newAchievements: newUnlocks
          } as MatchResult;
          
          if (newUnlocks.length > 0) {
              newUnlock = newUnlocks[0];
          }
      }
      
      setGameState(prev => ({
          ...prev,
          phase: won ? 'VICTORY' : 'GAMEOVER',
          combatSubPhase: 'ROUND_OVER',
          players: players,
          matchResult: result,
          newUnlock: newUnlock
      }));
  };

  const startPrepPhase = (players: PlayerStats[]) => {
      if (gameState.mode === 'MULTIPLAYER') {
          broadcastSync({ ...gameStateRef.current, combatSubPhase: 'PREPARATION', turnDuration: PREPARATION_DURATION }, players, "PREPARE");
      } else {
          setGameState(prev => ({ ...prev, combatSubPhase: 'PREPARATION' }));
      }

      prepTimeoutRef.current = setTimeout(() => {
          startDecisionPhase(players);
      }, PREPARATION_DURATION * 1000);
  };

  // --- PUBLIC INTERFACE ---
  const actions = {
    setMode: (mode: GameMode) => setGameState(prev => ({ ...prev, mode })),
    setPhase: (phase: GameState['phase']) => setGameState(prev => ({ ...prev, phase })),
    setInputName: (name: string) => setUiState(prev => ({ ...prev, inputName: name })),
    setSelectedCharIndex: (idx: number) => setUiState(prev => ({ ...prev, selectedCharIndex: idx })),
    
    initializeCombat: () => {
       const char = CHARACTERS[uiState.selectedCharIndex];
       const updatedPlayer = { 
           ...gameState.player, 
           name: uiState.inputName || "Player", 
           character: char,
       };
       playerService.saveProfile(updatedPlayer);
       
       setGameState(prev => ({ ...prev, player: updatedPlayer }));
       
       if (gameState.mode === 'SOLO') {
           initializeCombat();
       } else {
           setGameState(prev => ({ ...prev, phase: 'MULTIPLAYER_LOBBY' }));
       }
    },
    
    handlePlayerAction,
    handleCreateRoom,
    handleJoinRoom,
    handleToggleReady,
    handleKick,
    handleStartGame,
    handleLeaveGame,
    handleChangeMatchType,
    handleLobbySettingChange,
    handleManualSwitch,
    
    buyItem,
    equipItem,
    nextLevel,
    continueToShop,
    handleMatchBuy: (type: 'gun' | 'shield' | 'armor', item: ItemStats) => {
        if (gameState.player.matchCash >= (item.matchCost || 9999)) {
            const newCash = gameState.player.matchCash - (item.matchCost || 0);
            const updated = playerService.equipItem({ ...gameState.player, matchCash: newCash }, type, item);
            setGameState(prev => ({ ...prev, player: updated }));
        }
    },
    handleLoot: (category: 'gun' | 'shield' | 'armor') => {
        const enemyItem = category === 'gun' ? gameState.opponent.gun : category === 'shield' ? gameState.opponent.shield : gameState.opponent.armorItem;
        const updated = playerService.equipItem(gameState.player, category, enemyItem);
        setGameState(prev => ({ ...prev, player: updated }));
    },
    
    handleSendMessage: (content: string, scope: ChatScope, targetId?: string) => {
        const msg: ChatMessage = {
            id: Math.random().toString(36),
            senderId: gameState.myId,
            senderName: gameState.player.name,
            content,
            scope,
            timestamp: Date.now(),
            teamId: gameState.player.teamId,
            targetId
        };
        addChatMessage(msg);
        if (gameState.mode === 'MULTIPLAYER') broadcastChat(msg);
    },
    
    handleSendLike: (targetId: string) => {
        NetworkService.sendTo(targetId, 'GAME_EVENT', { type: 'LIKE', targetId });
    },
    
    toggleSocial: () => setGameState(prev => ({ ...prev, isSocialOpen: !prev.isSocialOpen })),
    toggleSettings: () => setGameState(prev => ({ ...prev, isSettingsOpen: !prev.isSettingsOpen })),
    inspectPlayer: (profile: PlayerProfile) => setGameState(prev => ({ ...prev, inspectingPlayer: profile })),
    closeInspector: () => setGameState(prev => ({ ...prev, inspectingPlayer: null })),
    addFriend: (profile: PlayerProfile) => socialService.addFriend(profile),
    sendInvite: (id: string) => NetworkService.sendTo(id, 'INVITE_LOBBY', { code: gameState.roomCode }),
    
    claimTask,
    handleUpdateProfile,
    clearUnlock
  };

  // Setup Network Listeners
  useEffect(() => {
      NetworkService.onData((packet, senderId) => {
          switch (packet.type) {
              case 'HANDSHAKE':
                  const p = packet.payload as HandshakePayload;
                  if (gameStateRef.current.isHost) {
                      setGameState(prev => {
                          if (prev.players.find(pl => pl.id === p.id)) return prev;
                          
                          const t1 = prev.players.filter(pl => pl.teamId === 1).length;
                          const t2 = prev.players.filter(pl => pl.teamId === 2).length;
                          const teamId = t1 <= t2 ? 1 : 2;
                          
                          const newPlayer: PlayerStats = {
                              ...INITIAL_PLAYER,
                              id: p.id,
                              name: p.name,
                              level: p.level,
                              elo: p.elo,
                              character: p.character,
                              teamId: teamId,
                              isReady: false,
                              roundsWon: 0,
                              matchCash: MATCH_STARTING_CASH,
                              cumulativeHealth: 0,
                              successfulActions: 0,
                              profile: p.profile
                          };
                          
                          const nextPlayers = [...prev.players, newPlayer];
                          setTimeout(() => broadcastLobbyUpdate(nextPlayers), 100);
                          return { ...prev, players: nextPlayers };
                      });
                  }
                  break;
              
              case 'LOBBY_UPDATE':
                  const update = packet.payload as LobbyUpdatePayload;
                  setGameState(prev => ({
                      ...prev,
                      players: update.players,
                      matchType: update.matchType || prev.matchType,
                      maxRounds: update.maxRounds || prev.maxRounds,
                      startTimer: update.startTimer || 0,
                      isPublic: update.isPublic ?? prev.isPublic,
                      customTeamSize: update.customTeamSize ?? prev.customTeamSize,
                  }));
                  break;
                  
              case 'START_GAME':
                  setGameState(prev => ({
                      ...prev,
                      players: packet.payload.players,
                      matchups: packet.payload.matchups,
                      phase: 'COMBAT',
                      combatSubPhase: 'INTRO',
                      maxRounds: packet.payload.settings.maxRounds,
                      turnDuration: packet.payload.settings.turnDuration
                  }));
                  break;
                  
              case 'GAME_STATE_SYNC':
                  if (!gameStateRef.current.isHost) {
                      const sync = packet.payload;
                      setGameState(prev => ({
                          ...prev,
                          phase: sync.phase,
                          combatSubPhase: sync.combatSubPhase,
                          round: sync.round,
                          players: sync.players,
                          turnDuration: sync.timeLeft || prev.turnDuration,
                          player: sync.players.find((pl: PlayerStats) => pl.id === prev.myId) || prev.player,
                          opponent: sync.players.find((pl: PlayerStats) => pl.id === prev.matchups[prev.myId]) || prev.opponent
                      }));
                      setUiState(prev => ({ ...prev, gameMessage: sync.gameMessage }));
                  }
                  break;

              case 'COMMIT_MOVE':
                  if (gameStateRef.current.isHost) {
                      const move = packet.payload as MovePayload;
                      committedMoves.current.set(senderId, { action: move.action, round: move.round, intensity: move.intensity || 1 });
                  }
                  break;
                  
              case 'CHAT':
                  addChatMessage(packet.payload as ChatMessage);
                  break;
                  
              case 'KICK':
                  if (!gameStateRef.current.isHost) {
                      alert("You have been kicked from the lobby.");
                      handleLeaveGame();
                  }
                  break;
            
              case 'SWITCH_TEAM':
                  if (packet.payload.playerId === gameStateRef.current.myId) {
                      // play sound?
                  }
                  break;
          }
      });
      
      NetworkService.onConnect((id) => {
          // Optional logic
      });
      
      NetworkService.onDisconnect((id) => {
          handlePlayerDisconnect(id);
      });

  }, []);

  return {
    gameState,
    uiState,
    chatState,
    actions
  };
};