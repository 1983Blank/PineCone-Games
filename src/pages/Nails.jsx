import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { GamePlayer } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Home } from "lucide-react";
import PlayerSelection from '../components/nails/PlayerSelection';
import NailDesignEditor from '../components/nails/NailDesignEditor';

export default function Nails() {
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [language, setLanguage] = useState('he');
    const [gameStarted, setGameStarted] = useState(false);
    
    useEffect(() => {
        const loadUserLanguage = async () => {
            try {
                const user = await User.me();
                setLanguage(user?.language || 'he');
            } catch (err) {
                console.error("Error loading user language:", err);
            }
        };
        loadUserLanguage();
    }, []);

    const t = (key) => {
        const translations = {
            "Nail Polish Game": { he: "משחק עיצוב ציפורניים", en: "Nail Polish Game" },
            "Leaderboard": { he: "לוח שיאים", en: "Leaderboard" },
            "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
            "Finish & Save Design": { he: "סיים ושמור", en: "Finish & Save Design" },
            "New Design": { he: "עיצוב חדש", en: "New Design" }
        };
        
        return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
    };

    const handleGameFinish = () => {
        setGameStarted(false);
    };

    const handleNewGame = () => {
        setGameStarted(true);
    };

    if (!currentPlayer) {
        return <PlayerSelection onPlayerSelect={setCurrentPlayer} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 p-4" dir={language === 'en' ? 'ltr' : 'rtl'}>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-pink-600">
                        {t('Nail Polish Game')}
                    </h1>
                    <div className="flex gap-2">
                        <Link to={createPageUrl('Leaderboard')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                {t('Leaderboard')}
                            </Button>
                        </Link>
                        <Link to={createPageUrl('Home')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Home className="w-5 h-5" />
                                {t('Back to Home')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {gameStarted ? (
                    <NailDesignEditor 
                        player={currentPlayer}
                        language={language}
                        onFinish={handleGameFinish}
                    />
                ) : (
                    <Card className="bg-white/80 backdrop-blur shadow-xl p-6">
                        <CardContent className="flex flex-col items-center space-y-6 pt-6">
                            <h2 className="text-2xl font-bold text-pink-500">
                                ✨ {t('Nail Polish Game')} ✨
                            </h2>
                            <p className="text-center max-w-lg">
                                {language === 'he' 
                                    ? "עצבי ציפורניים מדהימות עם צבעים, מדבקות ואפקטים מיוחדים!"
                                    : "Design amazing nails with colors, stickers and special effects!"}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                                {[
                                    { emoji: "💅", text: language === 'he' ? "צביעה ועיצוב" : "Paint & Design" },
                                    { emoji: "✨", text: language === 'he' ? "מדבקות ואפקטים" : "Stickers & Effects" },
                                    { emoji: "🎨", text: language === 'he' ? "צבעים מיוחדים" : "Special Colors" },
                                ].map((feature, i) => (
                                    <div key={i} className="bg-pink-50 p-4 rounded-lg shadow text-center">
                                        <div className="text-4xl mb-2">{feature.emoji}</div>
                                        <div className="font-medium">{feature.text}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <Button 
                                onClick={handleNewGame}
                                className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-6 text-lg mt-6"
                            >
                                {language === 'he' ? "התחל לעצב!" : "Start Designing!"}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}