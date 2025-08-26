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
      he: 'ארבע בשורה',
      en: 'Connect Four'
    },
    subtitle: {
      he: 'משחק ארבע בשורה קלאסי',
      en: 'Classic connect four game'
    }
  };

  const handlePlayersSelect = (selectedPlayers) => {
    if (selectedPlayers && selectedPlayers.length >= 2) {
      onPlayersSelect({
        player1: selectedPlayers[0],
        player2: selectedPlayers[1]
      });
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={handlePlayersSelect}
      gameType="connectFour"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-red-100 to-pink-100"
      maxPlayers={2} // Connect Four needs 2 players
      minPlayers={2}
    />
  );
}