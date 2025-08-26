
import React, { useState, useEffect } from 'react';
import { Profile } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Fixed casing
import { Input } from '@/components/ui/input';
import { Trophy, PlusCircle, UserCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { renderIcon, avatarIcons } from './GameSetup';

export default function PlayerSelection({ onPlayersSelect }) {
  const [players, setPlayers] = useState([{ name: '', avatar: 'Smile' }]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPlayers();
  }, []);

  const loadSavedPlayers = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      const profile = await Profile.filter({ email: user.email });
      
      if (profile && profile[0] && profile[0].lastGames?.memory?.players) {
        setSavedPlayers(profile[0].lastGames.memory.players);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading saved players:', err);
      setLoading(false);
    }
  };

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, { name: '', avatar: 'Smile' }]);
    }
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index, field, value) => {
    const newPlayers = [...players];
    if (field === 'avatar') {
      newPlayers[index] = { 
        ...newPlayers[index], 
        [field]: avatarIcons[value].name 
      };
    } else {
      newPlayers[index] = { ...newPlayers[index], [field]: value };
    }
    setPlayers(newPlayers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (players.some(p => !p.name)) return;
    onPlayersSelect(players);
  };

  const useSavedPlayers = () => {
    if (savedPlayers && savedPlayers.length > 0) {
      onPlayersSelect(savedPlayers);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-800">משחק הזיכרון</h2>
        <Link to={createPageUrl('Home')}>
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            חזור למסך הבית
          </Button>
        </Link>
      </div>

      <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl rounded-2xl">
        {savedPlayers && savedPlayers.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-medium text-blue-700 mb-2">שחקנים אחרונים</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {savedPlayers.map((player, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    avatarIcons.find(a => a.name === player.avatar)?.bg || 'bg-gray-100'
                  }`}>
                    {renderIcon(player.avatar, `w-5 h-5 ${
                      avatarIcons.find(a => a.name === player.avatar)?.color || 'text-gray-500'
                    }`)}
                  </div>
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
            <Button 
              onClick={useSavedPlayers} 
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              המשך עם שחקנים אלה
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">הגדר שחקנים חדשים</h2>
            <div className="bg-blue-50 p-6 rounded-xl space-y-4">
              <Input
                value={players[0].name}
                onChange={(e) => updatePlayer(0, 'name', e.target.value)}
                placeholder="הכנס את שמך"
                className="text-lg h-12 border-2 border-blue-200 focus:border-blue-400"
                dir="rtl"
                required
              />

              <div>
                <label className="block text-lg font-medium mb-3 text-blue-700">בחר דמות</label>
                <div className="grid grid-cols-4 gap-3">
                  {avatarIcons.map((avatar, avatarIndex) => (
                    <Button
                      key={avatarIndex}
                      type="button"
                      variant={players[0].avatar === avatar.name ? 'default' : 'outline'}
                      className={`p-4 h-auto ${avatar.bg} border-2 hover:scale-105 transition-transform ${
                        players[0].avatar === avatar.name 
                          ? 'ring-4 ring-blue-400 border-blue-400' 
                          : 'hover:border-blue-300'
                      }`}
                      onClick={() => updatePlayer(0, 'avatar', avatarIndex)}
                    >
                      {renderIcon(avatar.name, `w-10 h-10 ${avatar.color}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {players.slice(1).map((player, index) => (
            <div key={index + 1} className="bg-blue-50 p-6 rounded-xl space-y-4">
            </div>
          ))}

          <Button
            type="button"
            onClick={addPlayer}
            disabled={players.length >= 4}
            className="w-full py-6 text-lg bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-6 h-6" />
            הוסף שחקן
          </Button>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl py-6 rounded-xl shadow-lg"
          >
            התחל משחק
          </Button>
        </form>
      </Card>
    </div>
  );
}
