import React, { useState, useEffect } from 'react';
import CommonPlayerSelection from '../common/PlayerSelection';
import { User } from '@/api/entities';

export default function PlayerSelection({ onPlayersSelect }) {
  const [language, setLanguage] = useState('he');
  
  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await User.me();
        setLanguage(currentUser?.language || 'he');
      } catch (err) {
        console.error("Error loading user language:", err);
      }
    }
    loadUser();
  }, []);

  const translations = {
    title: {
      he: 'איקס עיגול',
      en: 'Tic Tac Toe'
    },
    subtitle: {
      he: 'משחק איקס עיגול קלאסי',
      en: 'Classic tic tac toe game'
    }
  };

  const handlePlayersSelect = (selectedPlayers) => {
    if (selectedPlayers && selectedPlayers.length >= 2) {
      onPlayersSelect({ 
        X: selectedPlayers[0], 
        O: selectedPlayers[1] 
      });
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={handlePlayersSelect}
      gameType="tictactoe"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-blue-100 to-indigo-100"
      maxPlayers={2} // Tic Tac Toe needs 2 players
      minPlayers={2}
    />
  );
}