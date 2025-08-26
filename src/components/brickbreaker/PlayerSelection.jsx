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
      he: "שובר הלבנים",
      en: "Brick Breaker"
    },
    subtitle: {
      he: "נפץ את הלבנים וצבור נקודות",
      en: "Break bricks and score points"
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={(players) => onPlayerSelect(players[0])} // קבל רק את השחקן הראשון
      gameType="brickBreaker"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-blue-100 to-indigo-100"
      maxPlayers={1} // הגבל לשחקן אחד בלבד
      minPlayers={1}
    />
  );
}