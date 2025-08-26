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
        console.log("PlayerSelection: Set language to:", currentUser?.language);
      } catch (err) {
        console.error("Error loading user language:", err);
      }
    }
    loadUser();
  }, []);

  const translations = {
    title: {
      he: "משחק הלבשה",
      en: "Fashion Game"
    },
    subtitle: {
      he: "משחק הלבשה ואופנה",
      en: "Fashion and dress up game"
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={(selectedPlayers) => {
        if (selectedPlayers && selectedPlayers.length > 0) {
          onPlayerSelect(selectedPlayers[0]);
        }
      }}
      gameType="fashion"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-purple-100 to-indigo-100"
      maxPlayers={1}
    />
  );
}