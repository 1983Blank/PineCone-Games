import React, { useState, useEffect } from 'react';
import CommonPlayerSelection from '../common/PlayerSelection';
import { User } from '@/api/entities';

export default function PlayerSelection({ onPlayerSelect }) {
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
      he: 'טטריס',
      en: 'Tetris'
    },
    subtitle: {
      he: 'סדר את הלבנים במהירות וצבור נקודות',
      en: 'Arrange blocks quickly and score points'
    }
  };

  const handlePlayerSelect = (selectedPlayer) => {
    if (selectedPlayer && selectedPlayer.length > 0) {
      onPlayerSelect(selectedPlayer[0]); // Take only the first player for Tetris
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={handlePlayerSelect}
      gameType="tetris"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-purple-100 to-blue-100"
      maxPlayers={1} // Tetris is single player
    />
  );
}