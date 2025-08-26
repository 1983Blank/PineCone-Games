
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from '@/api/entities';
import { GameType } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, LayoutIcon, Grid3x3, Target, Crown, Trophy, 
  Calculator, Hash, Paintbrush, Settings, Beaker, Shirt, Gamepad2
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // לאחר טעינת המשתמש, טען את המשחקים
      loadGames(currentUser);
    } catch (err) {
      console.error("Error loading user:", err);
      setLoading(false);
    }
  };
  
  // פונקציה חדשה לטעינת משחקים מה-DB
  const loadGames = async (currentUser) => {
    try {
      setLoading(true);
      
      // נסה לטעון משחקים מהמסד נתונים
      try {
        const gameTypes = await GameType.list();
        
        if (gameTypes && gameTypes.length > 0) {
          // סנן משחקים לפי הרשאות
          const filteredGames = gameTypes.filter(game => {
            // אם המשחק לא פעיל, לא מציגים אותו כלל
            if (!game.isActive) return false;
            
            // אם המשחק למנהלים בלבד, בדוק הרשאות
            if (game.adminOnly) {
              return currentUser?.role === 'admin';
            }
            
            // המשחק זמין לכולם
            return true;
          });
          
          // מיין את המשחקים לפי סדר
          const sortedGames = filteredGames.sort((a, b) => {
            return (a.order || 999) - (b.order || 999);
          });
          
          setGames(sortedGames);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn("לא הצלחנו לטעון משחקים מהמסד נתונים:", error);
      }
      
      // משחקים ברירת מחדל אם אין משחקים במסד נתונים
      const defaultGames = [
        {
          name: "משחק הזיכרון",
          name_en: "Memory Game",
          route: "Game",
          icon: "Target",
          description: "משחק זיכרון קלאסי עם קלפים",
          description_en: "Classic memory card game"
        },
        {
          name: "איקס עיגול",
          name_en: "Tic Tac Toe",
          route: "TicTacToe",
          icon: "Grid3x3",
          description: "משחק איקס עיגול קלאסי",
          description_en: "Classic tic tac toe game"
        },
        {
          name: "טטריס",
          name_en: "Tetris",
          route: "Tetris",
          icon: "LayoutIcon",
          description: "משחק טטריס קלאסי",
          description_en: "Classic tetris game"
        },
        {
          name: "לוח הכפל",
          name_en: "Multiplication Table",
          route: "Multiplication",
          icon: "Calculator",
          description: "תרגול לוח הכפל",
          description_en: "Practice multiplication"
        },
        {
          name: "ארבע בשורה",
          name_en: "Connect Four",
          route: "ConnectFour",
          icon: "Hash",
          description: "משחק ארבע בשורה קלאסי",
          description_en: "Classic connect four game"
        },
        {
          name: "משחק צביעה",
          name_en: "Coloring Game",
          route: "Coloring",
          icon: "Paintbrush",
          description: "משחק צביעה והשלמת תמונות",
          description_en: "Coloring and completing pictures"
        },
        {
          name: "משחק הנוזלים",
          name_en: "Liquid Sort",
          route: "LiquidSort",
          icon: "Beaker",
          description: "משחק מיון נוזלים צבעוניים",
          description_en: "Sort colorful liquids"
        },
        {
          name: "שובר הלבנים",
          name_en: "Brick Breaker",
          route: "BrickBreaker",
          icon: "Grid3x3",
          description: "נפץ את הלבנים וצבור נקודות",
          description_en: "Break bricks and score points"
        }
      ];
      
      // Add Fashion game and Nails game only for admin users
      if (currentUser?.role === 'admin') {
        defaultGames.push({
          name: "משחק הלבשה",
          name_en: "Fashion Game",
          route: "Fashion",
          icon: "Shirt",
          description: "משחק הלבשה ואופנה",
          description_en: "Fashion and dress up game"
        });
        
        defaultGames.push({
          name: "עיצוב ציפורניים",
          name_en: "Nail Design",
          route: "Nails",
          icon: "Nail",
          description: "משחק עיצוב ציפורניים",
          description_en: "Nail design game"
        });
      }
      
      setGames(defaultGames);
      setLoading(false);
    } catch (error) {
      console.error("Error loading games:", error);
      setLoading(false);
    }
  };

  // Simple translation function
  const t = (key) => {
    const translations = {
      "Pine Cones Games": { 
        he: "האצטרובלים הלבנים", 
        en: "Pine Cones Games" 
      },
      "Here you can find various challenging games for memory, thinking and concentration. All games are completely free and without ads!": {
        he: "כאן תוכלו למצוא מגוון משחקים מאתגרים לזיכרון, חשיבה וריכוז. כל המשחקים חינמיים לחלוטין וללא פרסומות!",
        en: "Here you can find various challenging games for memory, thinking and concentration. All games are completely free and without ads!"
      },
      "View Leaderboard": {
        he: "צפה בלוח השיאים",
        en: "View Leaderboard"
      },
      "Admin Panel": {
        he: "פאנל ניהול",
        en: "Admin Panel"
      }
    };
    
    if (!user) return translations[key]?.he || key;
    return user?.language === 'en' ? translations[key]?.en : translations[key]?.he;
  };

  // תיקון render של רשימת המשחקים
  const renderGameCard = (game) => {
    // קבע את שם המשחק לפי שפת המשתמש
    const gameName = user?.language === 'en' ? game.name_en : game.name;
    // קבע את תיאור המשחק לפי שפת המשתמש
    const gameDesc = user?.language === 'en' ? game.description_en : game.description;
    
    // הגדר את האייקון המתאים לפי שם האייקון
    let GameIcon;
    switch(game.icon) {
      case 'Target': GameIcon = Target; break;
      case 'Grid3x3': GameIcon = Grid3x3; break;
      case 'LayoutIcon': GameIcon = LayoutIcon; break;
      case 'Calculator': GameIcon = Calculator; break;
      case 'Shirt': GameIcon = Shirt; break;
      case 'Hash': GameIcon = Hash; break;
      case 'Paintbrush': GameIcon = Paintbrush; break;
      case 'Beaker': GameIcon = Beaker; break;
      case 'Nail': GameIcon = Grid3x3; break;
      default: GameIcon = Gamepad2;
    }

    // מערך של צבעים לקטגוריות שונות של משחקים
    const gameColors = {
      'Game': 'from-blue-400 to-cyan-500',
      'TicTacToe': 'from-green-400 to-emerald-500',
      'Tetris': 'from-purple-400 to-indigo-500',
      'Multiplication': 'from-yellow-400 to-orange-500',
      'Fashion': 'from-pink-400 to-rose-500',
      'ConnectFour': 'from-red-400 to-pink-500',
      'Coloring': 'from-indigo-400 to-blue-500',
      'LiquidSort': 'from-cyan-400 to-blue-500',
      'BrickBreaker': 'from-orange-400 to-red-500',
      'Nails': 'from-pink-400 to-purple-500'
    };
    
    return (
      <Link to={createPageUrl(game.route)} className="block" key={game.route}>
        <Card className="overflow-hidden transform transition-all hover:scale-105 hover:shadow-lg cursor-pointer h-full">
          <div className={`h-20 sm:h-28 md:h-40 bg-gradient-to-br ${gameColors[game.route] || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
            <GameIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
          </div>
          <CardContent className="p-2 sm:p-3 md:p-4 text-center">
            <h2 className="text-sm sm:text-base md:text-lg font-bold mb-1">{gameName}</h2>
            <p className="text-xs text-gray-600 line-clamp-1">
              {gameDesc}
            </p>
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6" dir={user?.language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="mb-8 sm:mb-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2 sm:mb-4">
            {t('Pine Cones Games')}
          </h1>
          <p className="text-sm sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            {t('Here you can find various challenging games for memory, thinking and concentration. All games are completely free and without ads!')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          {games.map(renderGameCard)}
        </div>

        <div className="text-center space-y-4">
          <Link to={createPageUrl('Leaderboard')}>
            <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-base sm:text-xl px-6 sm:px-12 py-4 sm:py-6">
              {t('View Leaderboard')}
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6 mr-2" />
            </Button>
          </Link>

          {user?.role === 'admin' && (
            <div className="mt-4">
              <Link to={createPageUrl('AdminPanel')}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {t('Admin Panel')}
                </Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
