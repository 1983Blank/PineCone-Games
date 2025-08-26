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
      he: 'עיצוב ציפורניים',
      en: 'Nail Design'
    },
    subtitle: {
      he: 'עצבי ציפורניים יפהפיות עם צבעים, מדבקות ואפקטים',
      en: 'Design beautiful nails with colors, stickers and effects'
    }
  };

  return (
    <CommonPlayerSelection 
      onSelect={(selectedPlayers) => onPlayerSelect(selectedPlayers[0])}
      gameType="nails"
      title={language === 'en' ? translations.title.en : translations.title.he}
      subtitle={language === 'en' ? translations.subtitle.en : translations.subtitle.he}
      background="from-pink-100 to-purple-100"
      maxPlayers={1}
    />
  );
}