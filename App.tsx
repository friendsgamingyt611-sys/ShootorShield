

import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { Header } from './components/layout/Header';
import { MainMenu } from './components/screens/MainMenu';
import { Lobby } from './components/screens/Lobby';
import { MultiplayerLobby } from './components/screens/MultiplayerLobby';
import { LobbyRoom } from './components/screens/LobbyRoom'; 
import { CharacterSelect } from './components/screens/CharacterSelect';
import { CombatArena } from './components/screens/CombatArena';
import { Shop } from './components/screens/Shop';
import { ChatOverlay } from './components/ui/ChatOverlay'; 
import { SocialOverlay } from './components/ui/SocialOverlay';
import { PlayerInspector } from './components/ui/PlayerInspector';
import { AchievementToast } from './components/ui/AchievementToast';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { AuthScreen } from './components/screens/AuthScreen';
import { RANDOM_NAMES } from './constants';
import { ActionType, PlayerStats } from './types';
import { Users, Settings } from 'lucide-react';
import { socialService } from './services/socialService';
import { authService } from './services/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialPlayer, setInitialPlayer] = useState<PlayerStats | undefined>(undefined);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
        // 1. Try to get optimistic cached player for speed
        const cached = authService.getCachedPlayer();
        if (cached) {
            setInitialPlayer(cached);
            setIsAuthenticated(true);
        }
        
        // 2. Validate with backend
        const verifiedProfile = await authService.validateSession();
        if (verifiedProfile) {
            setInitialPlayer(verifiedProfile);
            setIsAuthenticated(true);
        } else if (cached) {
            // If backend rejects token but we showed cached UI, logout now
            setIsAuthenticated(false);
            setInitialPlayer(undefined);
        }
        setAuthLoading(false);
    };
    checkSession();
  }, []);

  const { gameState, uiState, chatState, actions } = useGameEngine(initialPlayer);

  // Wrapper for combat actions to handle special like events and buy events
  const handleCombatAction = (type: ActionType | string) => {
      if (typeof type === 'string') {
          if (type.startsWith('LIKE_TEAMMATE_')) {
              const targetId = type.replace('LIKE_TEAMMATE_', '');
              actions.handleSendLike(targetId);
          } else if (type.startsWith('BUY_')) {
              const parts = type.split('_');
              const category = parts[1] as 'gun' | 'shield' | 'armor';
              const jsonStr = parts.slice(2).join('_'); 
              try {
                  const item = JSON.parse(jsonStr);
                  actions.handleMatchBuy(category, item);
              } catch (e) {
                  console.error("Failed to parse buy action", e);
              }
          } else if (type.startsWith('LOOT_')) {
              const category = type.split('_')[1] as 'gun' | 'shield' | 'armor';
              actions.handleLoot(category);
          }
      } else {
          actions.handlePlayerAction(type as ActionType);
      }
  };

  const isCombat = ['COMBAT', 'GAMEOVER', 'VICTORY'].includes(gameState.phase);
  
  // Logic to open self profile
  const handleOpenSelfProfile = () => {
      const profile = socialService.getProfileFor(gameState.player);
      // Ensure local avatar is synced
      profile.customAvatar = gameState.player.customAvatar;
      actions.inspectPlayer(profile);
  };

  if (authLoading) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-mono">INITIALIZING UPLINK...</div>;
  }

  if (!isAuthenticated) {
      return <AuthScreen onAuthSuccess={(player) => { setInitialPlayer(player); setIsAuthenticated(true); }} />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 font-display selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <div className="crt-overlay fixed inset-0 z-50 pointer-events-none opacity-30"></div>
      
      {/* ACHIEVEMENT UNLOCK TOAST */}
      {gameState.newUnlock && (
          <AchievementToast achievement={gameState.newUnlock} onClose={actions.clearUnlock} />
      )}

      {/* SETTINGS PANEL */}
      <SettingsPanel 
        isOpen={gameState.isSettingsOpen} 
        onClose={actions.toggleSettings}
        player={gameState.player}
        onUpdatePlayer={(p) => {
            // This forces a re-render if name changes etc
            actions.handleUpdateProfile(p.name, p.customAvatar || '');
        }}
      />

      {/* During Combat, we remove the container constraints to allow full-screen layout */}
      <div className={`${isCombat ? '' : 'max-w-6xl mx-auto p-4'} relative z-10 transition-all duration-500`}>
        
        {!isCombat && (
             <Header 
             playerCredits={gameState.player.credits} 
             phase={gameState.phase} 
             roomCode={gameState.roomCode}
           />
        )}

        <div onClick={(e) => {
            if ((e.target as HTMLElement).closest('#profile-card')) {
                handleOpenSelfProfile();
            }
        }}>
            {gameState.phase === 'MAIN_MENU' && (
            <MainMenu 
                onSelectMode={actions.setMode} 
                player={gameState.player}
                dailyRewardClaimed={uiState.dailyRewardClaimed}
                onClaimTask={actions.claimTask}
            />
            )}
        </div>

        {gameState.phase === 'MULTIPLAYER_LOBBY' && (
          <MultiplayerLobby 
            onCreateRoom={actions.handleCreateRoom}
            onJoinRoom={actions.handleJoinRoom}
            isConnecting={gameState.isProcessing}
          />
        )}

        {gameState.phase === 'LOBBY_ROOM' && (
          <LobbyRoom 
            players={gameState.players}
            myId={gameState.myId}
            roomCode={gameState.roomCode || ''}
            isHost={gameState.isHost}
            matchType={gameState.matchType}
            startTimer={gameState.startTimer}
            maxRounds={gameState.maxRounds}
            isPublic={gameState.isPublic}
            customTeamSize={gameState.customTeamSize}
            timeFormat={gameState.timeFormat}
            onToggleReady={actions.handleToggleReady}
            onChangeMatchType={actions.handleChangeMatchType}
            onKickPlayer={actions.handleKick}
            onStartGame={actions.handleStartGame}
            onLeave={() => actions.handleLeaveGame(false)}
            onManualSwitch={actions.handleManualSwitch}
            onSettingChange={actions.handleLobbySettingChange}
            onInspect={actions.inspectPlayer}
          />
        )}

        {gameState.phase === 'CHARACTER_SELECT' && (
          <CharacterSelect 
            inputName={uiState.inputName}
            setInputName={actions.setInputName}
            selectedCharIndex={uiState.selectedCharIndex}
            setSelectedCharIndex={actions.setSelectedCharIndex}
            onConfirm={actions.initializeCombat}
            randomNamePlaceholder={RANDOM_NAMES[0]} 
          />
        )}

        {isCombat && (
          <CombatArena 
            gameState={gameState}
            gameMessage={uiState.gameMessage}
            timeLeft={uiState.timeLeft}
            localLockedAction={uiState.localLockedAction}
            actionCooldownUntil={uiState.actionCooldownUntil}
            onAction={handleCombatAction}
            onRestart={() => actions.setPhase('MAIN_MENU')}
            onShop={actions.continueToShop}
          />
        )}

        {gameState.phase === 'SHOP' && (
          <Shop 
            gameState={gameState}
            onBuy={actions.buyItem}
            onEquip={actions.equipItem}
            onNextLevel={actions.nextLevel}
          />
        )}

        {/* Global Chat System */}
        {(gameState.mode === 'MULTIPLAYER' && gameState.isConnected) && (
          <ChatOverlay 
            messages={chatState.messages}
            onSendMessage={actions.handleSendMessage}
            myTeamId={gameState.players.find(p => p.id === gameState.myId)?.teamId || 1}
            players={gameState.players}
            isOpen={chatState.isOpen}
            setIsOpen={chatState.setIsOpen}
          />
        )}

        {/* Social Features Overlay */}
        <SocialOverlay 
            isOpen={gameState.isSocialOpen}
            onClose={actions.toggleSocial}
            onInvite={actions.sendInvite}
        />
        
        <PlayerInspector 
            profile={gameState.inspectingPlayer || null}
            isSelf={gameState.inspectingPlayer?.id === gameState.player.id}
            onClose={actions.closeInspector}
            onAddFriend={actions.addFriend}
            onUpdateProfile={actions.handleUpdateProfile}
        />

        {/* Social & Settings Buttons (Only show if not in intense combat) */}
        {(!isCombat || gameState.combatSubPhase === 'ROUND_OVER') && (
            <div className="fixed top-4 right-4 z-[55] flex gap-2">
                <button onClick={actions.toggleSocial} className="p-3 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full text-white hover:bg-blue-900/50 hover:border-blue-500 transition-all shadow-lg relative">
                    <Users size={20} />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></span>
                </button>
                
                <button onClick={actions.toggleSettings} className="p-3 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-full text-white hover:bg-gray-800 hover:border-white transition-all shadow-lg">
                    <Settings size={20} />
                </button>
            </div>
        )}

      </div>
    </div>
  );
}

export default App;