

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gamepad2,
  Grid3x3,
  Layout as LayoutIcon,
  Target,
  Menu,
  Trophy,
  Home,
  Calculator,
  Shirt,
  Hash,
  Paintbrush,
  Settings,
  Beaker
} from "lucide-react";
import LanguageToggle from '@/components/common/LanguageToggle';
import { User } from '@/api/entities';
import { GameType } from '@/api/entities';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [games, setGames] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const translations = {
    backToHome: { he: 'חזור למסך הבית', en: 'Back to Home' },
    gamesCenter: { he: 'מרכז המשחקים', en: 'Games Center' },
    leaderboard: { he: 'לוח שיאים', en: 'Leaderboard' },
    viewRecords: { he: 'צפה בשיאים', en: 'View records' },
    management: { he: 'ניהול', en: 'Management' },
    adminPanel: { he: 'פאנל ניהול', en: 'Admin Panel' },
    manageGames: { he: 'ניהול משחקים ותוכן', en: 'Manage games and content' },
    settings: { he: 'הגדרות', en: 'Settings' }
  };

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user:', error);
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  // Menu translations
  const t = useCallback((key) => {
    if (!user) return translations[key]?.he || key;
    return user.language === 'en' ? translations[key]?.en : translations[key]?.he;
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGames();
    }
  }, [user]);

  const loadGames = async () => {
    try {
      setIsLoading(true);
      
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
              return user?.role === 'admin';
            }
            
            // המשחק זמין לכולם
            return true;
          });
          
          // מיין את המשחקים לפי סדר
          const sortedGames = filteredGames.sort((a, b) => {
            return (a.order || 999) - (b.order || 999);
          });
          
          setGames(sortedGames);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn("לא הצלחנו לטעון משחקים מהמסד נתונים:", error);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading games:", error);
      setIsLoading(false);
    }
  };

  const getGameIcon = (iconName) => {
    switch (iconName) {
      case 'Target':
        return <Target className="h-6 w-6" />;
      case 'Grid3x3':
        return <Grid3x3 className="h-6 w-6" />;
      case 'LayoutIcon':
        return <LayoutIcon className="h-6 w-6" />;
      case 'Calculator':
        return <Calculator className="h-6 w-6" />;
      case 'Shirt':
        return <Shirt className="h-6 w-6" />;
      case 'Hash':
        return <Hash className="h-6 w-6" />;
      case 'Paintbrush':
        return <Paintbrush className="h-6 w-6" />;
      case 'Beaker':
        return <Beaker className="h-6 w-6" />;
      default:
        return <Gamepad2 className="h-6 w-6" />;
    }
  };

  if (location.pathname === '/' || location.pathname === '') {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lang = user?.language || 'he';
  const isEnglish = lang === 'en';

  console.log('Current language in layout:', lang); // Debug log

  return (
    <div className="min-h-screen bg-gray-50" dir={isEnglish ? 'ltr' : 'rtl'}>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isEnglish ? "left" : "right"} className="overflow-y-auto">
                <nav className="mt-8 pb-8">
                  <ul className="space-y-2">
                    <li>
                      <Link
                        to={createPageUrl('Home')}
                        className={`flex items-center p-3 rounded-lg ${
                          location.pathname === createPageUrl('Home')
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Home className="h-6 w-6 mr-3 rtl:ml-3 rtl:mr-0" />
                        <span className="font-medium">{isEnglish ? 'Home' : 'דף הבית'}</span>
                      </Link>
                    </li>
                    
                    {games.map((game) => (
                      <li key={game.route}>
                        <Link
                          to={createPageUrl(game.route)}
                          className={`flex items-center p-3 rounded-lg ${
                            location.pathname === createPageUrl(game.route)
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {getGameIcon(game.icon)}
                          <span className="ml-3 rtl:mr-3 rtl:ml-0 font-medium">
                            {isEnglish ? game.name_en : game.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                    
                    <li>
                      <Link
                        to={createPageUrl('Leaderboard')}
                        className={`flex items-center p-3 rounded-lg ${
                          location.pathname === createPageUrl('Leaderboard')
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Trophy className="h-6 w-6 mr-3 rtl:ml-3 rtl:mr-0" />
                        <span className="font-medium">{isEnglish ? 'Leaderboard' : 'לוח שיאים'}</span>
                      </Link>
                    </li>

                    {user?.role === 'admin' && (
                      <li className="pt-4 mt-4 border-t">
                        <div className="px-3 mb-2">
                          <p className="text-sm font-medium text-gray-500">{isEnglish ? 'Management' : 'ניהול'}</p>
                        </div>
                        <Link
                          to={createPageUrl('AdminPanel')}
                          className={`flex items-center p-3 rounded-lg ${
                            location.pathname === createPageUrl('AdminPanel')
                              ? 'bg-purple-50 text-purple-700'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Settings className="h-6 w-6 mr-3 rtl:ml-3 rtl:mr-0" />
                          <span className="font-medium">{isEnglish ? 'Admin Panel' : 'פאנל ניהול'}</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link to={createPageUrl('Home')} className="text-2xl font-bold text-blue-600">
              Pine Cones Games
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageToggle user={user} />
            {user?.role === 'admin' && (
              <Link to={createPageUrl('AdminPanel')}>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{isEnglish ? 'Settings' : 'הגדרות'}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

