
import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { Profile } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, PlusCircle, UserCircle, Paintbrush } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PlayerSelection({ onPlayerSelect, gameType = "coloring" }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      const loadedPlayers = await GamePlayer.filter({ userEmail: user.email });
      
      const sortedPlayers = loadedPlayers.sort((a, b) => 
        (b.stats?.[gameType]?.highScore || 0) - (a.stats?.[gameType]?.highScore || 0)
      );
      
      setPlayers(sortedPlayers);

      const profile = await Profile.filter({ email: user.email });
      if (profile?.[0]?.lastGames?.[gameType]) {
        const lastGame = profile[0].lastGames[gameType];
        if (lastGame.playerId) {
          const lastPlayer = await GamePlayer.get(lastGame.playerId);
          if (lastPlayer) {
            setSelectedPlayer(lastPlayer);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading players:', error);
      setIsLoading(false);
    }
  };

  const createNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const user = await User.me();
      const playerData = {
        name: newPlayerName,
        userEmail: user.email,
        isActive: true,
        stats: {}
      };
      
      playerData.stats[gameType] = {
        gamesPlayed: 0,
        highScore: 0,
        lastPlayed: null
      };
      
      if (gameType === "coloring") {
        playerData.stats[gameType].picturesCompleted = 0;
      }
      
      const player = await GamePlayer.create(playerData);
      
      setNewPlayerName('');
      await loadPlayers();
      
      setSelectedPlayer(player);
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
  };

  const handleConfirmSelection = () => {
    if (selectedPlayer) {
      onPlayerSelect(selectedPlayer);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur shadow-xl p-6">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
            <p className="mt-4">טוען שחקנים...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="bg-white/80 backdrop-blur shadow-xl p-6">
          <CardContent className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-2">בחר שחקן</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {players.map(player => (
                <Button
                  key={player.id}
                  variant={selectedPlayer?.id === player.id ? "default" : "outline"}
                  className="flex-col h-auto py-4 px-2"
                  onClick={() => handleSelectPlayer(player)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <UserCircle className="w-10 h-10" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{player.name}</div>
                      {player.stats?.[gameType]?.highScore > 0 && (
                        <div className="text-xs">
                          {player.stats[gameType].highScore} נקודות
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
              
              <Button
                variant="outline"
                className="flex-col h-auto py-4 px-2 border-dashed border-2"
                onClick={() => setSelectedPlayer(null)}
              >
                <div className="flex flex-col items-center gap-2">
                  <PlusCircle className="w-10 h-10 text-yellow-500" />
                  <div className="font-medium text-sm">שחקן חדש</div>
                </div>
              </Button>
            </div>
            
            {selectedPlayer ? (
              <div className="text-center pt-4">
                <p className="text-lg font-medium mb-4">
                  שחקן נבחר: {selectedPlayer.name}
                </p>
                <Button 
                  size="lg" 
                  onClick={handleConfirmSelection}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Paintbrush className="w-5 h-5 mr-2" />
                  התחל לצבוע
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                  <PlusCircle className="w-5 h-5 text-yellow-500" />
                  שחקן חדש
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    placeholder="שם השחקן החדש"
                    className="rtl"
                  />
                  <Button onClick={createNewPlayer} disabled={!newPlayerName.trim()}>
                    הוסף
                  </Button>
                </div>
              </div>
            )}
            
            <Link to={createPageUrl('Leaderboard')} className="block text-center">
              <Button variant="ghost" className="flex items-center gap-2 mx-auto">
                <Trophy className="w-5 h-5 text-yellow-500" />
                צפה בלוח התוצאות
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
