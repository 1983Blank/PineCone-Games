import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { User } from '@/api/entities';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

// Static data, no reliance on hooks or props
const AVATARS = [
  { id: 'bear', labelHe: 'דובי', labelEn: 'Bear', emoji: '🐻' },
  { id: 'rabbit', labelHe: 'ארנב', labelEn: 'Rabbit', emoji: '🐰' },
  { id: 'cat', labelHe: 'חתול', labelEn: 'Cat', emoji: '🐱' },
  { id: 'dog', labelHe: 'כלב', labelEn: 'Dog', emoji: '🐶' },
  { id: 'fox', labelHe: 'שועל', labelEn: 'Fox', emoji: '🦊' },
  { id: 'tiger', labelHe: 'נמר', labelEn: 'Tiger', emoji: '🐯' },
  { id: 'monkey', labelHe: 'קוף', labelEn: 'Monkey', emoji: '🐵' },
  { id: 'panda', labelHe: 'פנדה', labelEn: 'Panda', emoji: '🐼' },
  { id: 'unicorn', labelHe: 'חד קרן', labelEn: 'Unicorn', emoji: '🦄' },
  { id: 'dragon', labelHe: 'דרקון', labelEn: 'Dragon', emoji: '🐲' }
];

// Translations lookup table
const translations = {
  en: {
    "Loading players...": "Loading players...",
    "Select Players": "Select Players",
    "Add New Player": "Add New Player",
    "Player Name": "Player Name",
    "Add Player": "Add Player",
    "Start Game": "Start Game",
    "games": "games"
  },
  he: {
    "Loading players...": "טוען שחקנים...",
    "Select Players": "בחר שחקנים",
    "Add New Player": "הוסף שחקן חדש",
    "Player Name": "שם השחקן",
    "Add Player": "הוסף שחקן",
    "Start Game": "התחל משחק",
    "games": "משחקים"
  }
};

export default function GameSetup(props) {
  // Simple state
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('bear');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('he');

  // Simple translation function without dependencies
  const t = (key) => {
    return (language === 'en' ? translations.en[key] : translations.he[key]) || key;
  };

  // Load data on mount
  useEffect(() => {
    async function init() {
      try {
        const user = await User.me();
        setLanguage(user.language || 'he');
        
        const loadedPlayers = await GamePlayer.filter({ 
          userEmail: user.email,
          isActive: true
        });
        
        setPlayers(loadedPlayers.sort((a, b) => 
          (b.stats?.memory?.highScore || 0) - (a.stats?.memory?.highScore || 0)
        ));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    }
    
    init();
  }, []);

  // Player selection handler
  const togglePlayerSelection = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  // Create new player
  const createNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const user = await User.me();
      const player = await GamePlayer.create({
        name: newPlayerName,
        userEmail: user.email,
        isActive: true,
        avatar: selectedAvatar,
        stats: {
          memory: {
            gamesPlayed: 0,
            gamesWon: 0,
            highScore: 0,
            perfectGames: 0,
            bestTime: null,
            lastPlayed: new Date().toISOString()
          }
        }
      });
      
      // Reload players and select the new one
      const loadedPlayers = await GamePlayer.filter({ 
        userEmail: user.email,
        isActive: true
      });
      
      setPlayers(loadedPlayers.sort((a, b) => 
        (b.stats?.memory?.highScore || 0) - (a.stats?.memory?.highScore || 0)
      ));
      
      setSelectedPlayers([...selectedPlayers, player]);
      setNewPlayerName('');
      setSelectedAvatar('bear');
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  // Handle game start
  const handleStartGame = () => {
    if (selectedPlayers.length > 0) {
      // Call the parent component callback manually
      // This avoids any issues with the prop being undefined
      if (props && typeof props.onPlayersSelect === 'function') {
        props.onPlayersSelect(selectedPlayers);
      } else {
        console.warn("No valid onPlayersSelect callback provided");
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4">{t('Loading players...')}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Main component render
  return (
    <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl rounded-2xl">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-blue-800 mb-4">{t('Select Players')}</h2>
          <div className="space-y-4">
            {players.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {players.map(player => (
                  <Button
                    key={player.id}
                    variant={selectedPlayers.find(p => p.id === player.id) ? "default" : "outline"}
                    className={`justify-start h-auto py-3 ${
                      selectedPlayers.find(p => p.id === player.id) 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => togglePlayerSelection(player)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label={player.avatar}>
                        {AVATARS.find(a => a.id === player.avatar)?.emoji || '👤'}
                      </span>
                      <div className="text-right">
                        <div>{player.name}</div>
                        <div className="text-xs opacity-80">
                          {player.stats?.memory?.gamesPlayed || 0} {t('games')}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-2">{t('Add New Player')}</h3>
              <div className="space-y-3">
                <Input
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  placeholder={t('Player Name')}
                  className="rtl"
                />
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-2 rounded-lg text-2xl ${
                        selectedAvatar === avatar.id 
                          ? 'bg-blue-100 ring-2 ring-blue-400' 
                          : 'hover:bg-gray-100'
                      }`}
                      title={language === 'en' ? avatar.labelEn : avatar.labelHe}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={createNewPlayer}
                  disabled={!newPlayerName.trim() || selectedPlayers.length >= 4}
                  className="w-full"
                >
                  <PlusCircle className="w-5 h-5 ml-2" />
                  {t('Add Player')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleStartGame}
          disabled={selectedPlayers.length === 0}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl py-6 rounded-xl shadow-lg"
        >
          {t('Start Game')}
        </Button>
      </div>
    </Card>
  );
}