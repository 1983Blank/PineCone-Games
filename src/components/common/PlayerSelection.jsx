
import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { User } from '@/api/entities';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, PlusCircle, Trophy } from "lucide-react";

const AVATARS = [
  { id: 'bear', labelHe: 'דובי', labelEn: 'Bear', emoji: '🐻' },
  { id: 'rabbit', labelHe: 'ארנב', labelEn: 'Rabbit', emoji: '🐰' },
  { id: 'cat', labelHe: 'חתול', labelEn: 'Cat', emoji: '🐱' },
  { id: 'dog', labelHe: 'כלב', labelEn: 'Dog', emoji: '🐶' },
  { id: 'fox', labelHe: 'שועל', labelEn: 'Fox', emoji: '🦊' },
  { id: 'tiger', labelHe: 'נמר', labelEn: 'Tiger', emoji: '🐯' },
  { id: 'monkey', labelHe: 'קוף', labelEn: 'Monkey', emoji: '🐵' },
  { id: 'panda', labelHe: 'פנדה', labelEn: 'Panda', emoji: '🐼' }
];

export default function PlayerSelection({ 
  gameType, 
  title, 
  subtitle, 
  background = "from-blue-50 to-purple-50",
  onSelect,
  maxPlayers = 4,
  minPlayers = 1
}) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      loadPlayers(currentUser);
    } catch (err) {
      console.error("Error loading user:", err);
      setLoading(false);
    }
  };

  const loadPlayers = async (currentUser) => {
    try {
      const loadedPlayers = await GamePlayer.filter({ 
        userEmail: currentUser.email,
        isActive: true
      });
      
      setPlayers(loadedPlayers.sort((a, b) => 
        (b.stats?.[gameType]?.highScore || 0) - (a.stats?.[gameType]?.highScore || 0)
      ));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading players:', error);
      setLoading(false);
    }
  };

  const togglePlayerSelection = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < maxPlayers) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const createNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const player = await GamePlayer.create({
        name: newPlayerName,
        userEmail: user.email,
        isActive: true,
        avatar: selectedAvatar,
        stats: {
          [gameType]: {
            gamesPlayed: 0,
            gamesWon: 0,
            highScore: 0,
            lastPlayed: new Date().toISOString()
          }
        }
      });
      
      await loadPlayers(user);
      setSelectedPlayers([...selectedPlayers, player]);
      setNewPlayerName('');
      setSelectedAvatar(AVATARS[0].id);
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  const handleStart = () => {
    if (selectedPlayers.length >= minPlayers && typeof onSelect === 'function') {
      onSelect(selectedPlayers);
    }
  };

  // Simple translation
  const t = (key) => {
    if (!user) return key;
    
    if (user.language === 'en') {
      const enTranslations = {
        "Loading players...": "Loading players...",
        "Select Players": "Select Players",
        "Add New Player": "Add New Player",
        "Player Name": "Player Name",
        "Add Player": "Add Player",
        "Start Game": "Start Game",
        "Back to Home": "Back to Home",
        "games": "games",
        "No players selected": "No players selected",
        "Select at least": "Select at least",
        "players": "players",
        "No players found. Create a new player to start.": "No players found. Create a new player to start.",
        "View Leaderboard": "View Leaderboard"
      };
      return enTranslations[key] || key;
    }
    
    const heTranslations = {
      "Loading players...": "טוען שחקנים...",
      "Select Players": "בחר שחקנים",
      "Add New Player": "הוסף שחקן חדש",
      "Player Name": "שם השחקן",
      "Add Player": "הוסף שחקן",
      "Start Game": "התחל משחק",
      "Back to Home": "חזור למסך הבית",
      "games": "משחקים",
      "No players selected": "לא נבחרו שחקנים",
      "Select at least": "בחר לפחות",
      "players": "שחקנים",
      "No players found. Create a new player to start.": "לא נמצאו שחקנים. צור שחקן חדש כדי להתחיל.",
      "View Leaderboard": "צפה בלוח התוצאות"
    };
    return heTranslations[key] || key;
  };

  if (loading) {
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

  return (
    <div className={`min-h-screen bg-gradient-to-b ${background} p-6`} dir={user?.language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {title || t('Select Players')}
          </h1>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {t('Back to Home')}
            </Button>
          </Link>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur shadow-xl">
          <div className="space-y-8">
            <p className="text-gray-600">{subtitle}</p>
            
            {players.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                  {players.map(player => (
                    <div
                      key={player.id}
                      className="relative group"
                    >
                      <div
                        onClick={() => togglePlayerSelection(player)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200
                          ${selectedPlayers.find(p => p.id === player.id) 
                            ? 'bg-blue-100 border-blue-300 border-2' 
                            : 'bg-gray-50 border-gray-200 border hover:bg-gray-100'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {AVATARS.find(a => a.id === player.avatar)?.emoji || '👤'}
                          </span>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-gray-500">
                              {player.stats?.[gameType]?.gamesPlayed || 0} {t('games')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                />
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map(avatar => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-2 rounded-lg text-2xl ${
                        selectedAvatar === avatar.id 
                          ? 'bg-blue-100 ring-2 ring-blue-400' 
                          : 'hover:bg-gray-100'
                      }`}
                      title={user?.language === 'en' ? avatar.labelEn : avatar.labelHe}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
                <Button 
                  onClick={createNewPlayer}
                  disabled={!newPlayerName.trim() || selectedPlayers.length >= maxPlayers}
                  className="w-full"
                >
                  <PlusCircle className="w-5 h-5 ml-2" />
                  {t('Add Player')}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleStart}
              disabled={selectedPlayers.length < minPlayers}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl py-6 rounded-xl shadow-lg"
            >
              {t('Start Game')}
            </Button>
            
            {players.length === 0 && (
              <p className="text-center text-gray-500 mt-4">{t('No players found. Create a new player to start.')}</p>
            )}

            {selectedPlayers.length === 0 && players.length > 0 && (
              <p className="text-center text-gray-500 mt-4">
                {minPlayers > 1 
                  ? `${t('Select at least')} ${minPlayers} ${t('players')}`
                  : t('No players selected')}
              </p>
            )}

            <Link to={createPageUrl('Leaderboard')} className="block text-center">
              <Button variant="ghost" className="flex items-center gap-2 mx-auto">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {t('View Leaderboard')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
