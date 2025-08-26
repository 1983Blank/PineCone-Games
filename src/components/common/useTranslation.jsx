import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { translations } from './translations';

export function useTranslation() {
    const [currentLanguage, setCurrentLanguage] = useState('he');

    useEffect(() => {
        loadUserLanguage();
    }, []);

    const loadUserLanguage = async () => {
        try {
            const user = await User.me();
            if (user && user.language) {
                setCurrentLanguage(user.language);
            }
        } catch (error) {
            console.error("Error loading user language:", error);
        }
    };

    const t = (key) => {
        if (!translations[currentLanguage]) {
            return key;
        }
        
        return translations[currentLanguage][key] || key;
    };

    const changeLanguage = (lang) => {
        if (lang === 'he' || lang === 'en') {
            setCurrentLanguage(lang);
        }
    };

    return { t, changeLanguage, currentLanguage };
}

export default useTranslation;