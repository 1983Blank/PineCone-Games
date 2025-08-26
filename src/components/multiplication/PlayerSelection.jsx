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
      he: 'לוח הכפל',
      en: 'Multiplication Table'
    },
    subtitle: {
      he: 'תרגול לוח הכפל',
      en: 'Practice multiplication'
    }
  };

  const handlePlayerSelect = (selectedPlayers) => {
    if (selectedPlayers && selectedPlayers.length > 0) {
      onPlayerSelect(selectedPlayers[0]); // Take only the first player
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={handlePlayerSelect}
      gameType="multiplication"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-green-100 to-emerald-100"
      maxPlayers={1} // Single player game
    />
  );
}