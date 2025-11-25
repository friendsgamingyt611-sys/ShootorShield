
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
import { MatchHistory } from './components/screens/MatchHistory';
import { PostMatchScreen } from './components/screens/PostMatchScreen';
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
import { playerService } from './services/playerService';
import { NetworkService } from './services/network';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialPlayer, setInitialPlayer] = useState<PlayerStats | undefined>(undefined);

  // Check for existing session on mount
  useEffect(() => {
    const cached = authService.getCachedPlayer();
    if (cached) {
         const { player } = playerService.initializeState(cached);
         setInitialPlayer(player);
         setIsAuthenticated(true);
         // Initialize P2P Network immediately on login
         NetworkService.initialize(player.username);
    }
  }, []);

  const { gameState, uiState, chatState, actions } = useGameEngine(initialPlayer);

  const handleAuthSuccess = (player: PlayerStats) => {
      setInitialPlayer(player);
      setIsAuthenticated(true);
      NetworkService.initialize(player.username);
  };

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
  
  const handleOpenSelfProfile = () => {
      const profile = socialService.getProfileFor(gameState.player);
      profile.customAvatar = gameState.player.customAvatar;
      actions.inspectPlayer(profile);
  };

  if (!isAuthenticated) {
      return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 font-display selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <div className="crt-overlay fixed inset-0 z-50 pointer-events-none opacity-30"></div>
      
      {gameState.newUnlock && (
          <AchievementToast achievement={gameState.newUnlock} onClose={actions.clearUnlock} />
      )}

      <SettingsPanel 
        isOpen={gameState.isSettingsOpen} 
        onClose={actions.toggleSettings}
        player={gameState.player}
        onUpdatePlayer={(p) => {
            actions.handleUpdateProfile(p.name, p.customAvatar || '');
        }}
      />

      <div className={`${isCombat ? '' : 'max-w-6xl mx-auto p-4'} relative z-10 transition-all duration-500`}>
        
        {!isCombat && gameState.phase !== 'POST_MATCH' && (
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
                onSelectMode={(mode) => {
                    if (mode === 'MATCH_HISTORY') {
                        actions.setPhase('MATCH_HISTORY');
                    } else {
                        actions.setMode(mode as any);
                        // If multiplayer, go to Friend Lobby, if solo, go to Char select
                        if (mode === 'MULTIPLAYER') {
                            actions.setPhase('MULTIPLAYER_LOBBY');
                        } else {
                            actions.setPhase('CHARACTER_SELECT');
                        }
                    }
                }} 
                player={gameState.player}
                dailyRewardClaimed={uiState.dailyRewardClaimed}
                onClaimTask={actions.claimTask}
            />
            )}
        </div>
        
        {gameState.phase === 'MATCH_HISTORY' && (
            <MatchHistory player={gameState.player} onBack={() => actions.setPhase('MAIN_MENU')} />
        )}

        {gameState.phase === 'MULTIPLAYER_LOBBY' && (
          <MultiplayerLobby 
            onCreateRoom={actions.handleCreateRoom}
            onJoinRoom={actions.handleJoinRoom}
            isConnecting={gameState.isProcessing}
            playerUsername={gameState.player.username}
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

        {gameState.phase === 'POST_MATCH' && (
            <PostMatchScreen 
                players={gameState.players}
                myId={gameState.myId}
                winnerTeam={gameState.winnerTeam || 1}
                matchResult={gameState.matchResult}
                onReturnToLobby={actions.handleReturnToLobby}
                onLeave={() => actions.handleLeaveGame(false)}
                onLike={actions.handleSendLike}
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

        {(!isCombat || gameState.combatSubPhase === 'ROUND_OVER') && gameState.phase !== 'POST_MATCH' && (
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
