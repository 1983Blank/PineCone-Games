
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { GamePlayer } from '@/api/entities';
import { Profile } from '@/api/entities';
import { LiquidGame } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Trophy, 
  RotateCcw, 
  Beaker,
  ArrowUpDown,
  Plus,
  ChevronRight,
  ChevronLeft,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlayerSelection from '../components/liquid/PlayerSelection';
import confetti from 'canvas-confetti';

const COLORS = {
  'red': '#ef4444',
  'blue': '#3b82f6',
  'green': '#22c55e',
  'yellow': '#eab308',
  'purple': '#a855f7',
  'orange': '#f97316',
  'pink': '#ec4899',
  'cyan': '#06b6d4'
};

export default function LiquidSort() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [tubes, setTubes] = useState([]);
  const [selectedTube, setSelectedTube] = useState(null);
  const [moves, setMoves] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [language, setLanguage] = useState('he');

  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const user = await User.me();
        if (user && user.language) {
          setLanguage(user.language);
        }
      } catch (err) {
        console.error("Error loading user language:", err);
      }
    };
    
    loadUserLanguage();
  }, []);

  // Translation function
  const t = (key) => {
    const translations = {
      "Liquid Sort": { he: "משחק הנוזלים", en: "Liquid Sort" },
      "Records": { he: "שיאים", en: "Records" },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Restart": { he: "התחל מחדש", en: "Restart" },
      "Level Selection": { he: "בחירת שלב", en: "Level Selection" },
      "moves": { he: "מהלכים", en: "moves" },
      "easy": { he: "קל", en: "easy" },
      "medium": { he: "בינוני", en: "medium" },
      "hard": { he: "קשה", en: "hard" },
      "Start Game": { he: "התחל משחק", en: "Start Game" },
      "Max moves:": { he: "מהלכים מקסימליים:", en: "Max moves:" },
      "Congratulations!": { he: "כל הכבוד!", en: "Congratulations!" },
      "You completed the level in": { he: "סיימת את השלב ב-", en: "You completed the level in" },
      "Choose New Level": { he: "בחר שלב חדש", en: "Choose New Level" },
      "Play Again": { he: "שחק שוב", en: "Play Again" },
      "Are you sure you want to exit the game?": { 
        he: "האם אתה בטוח שברצונך לצאת מהמשחק?",
        en: "Are you sure you want to exit the game?"
      }
    };
    
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };

  useEffect(() => {
    loadLevels();
  }, []);

  useEffect(() => {
    checkWinCondition();
  }, [tubes]);

  const loadLevels = async () => {
    try {
      setIsLoading(true);
      let fetchedLevels = await LiquidGame.list();
      
      // Filter out duplicates based on level number
      const seenLevels = new Set();
      fetchedLevels = fetchedLevels.filter(level => {
        if (seenLevels.has(level.level)) {
          return false; // Skip this duplicate
        }
        seenLevels.add(level.level);
        return level.isActive !== false;
      });
      
      // Sort levels by order
      fetchedLevels.sort((a, b) => a.order - b.order);
      
      setLevels(fetchedLevels);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading levels:", err);
      setIsLoading(false);
    }
  };

  const startLevel = (level) => {
    setCurrentLevel(level);
    setTubes(JSON.parse(JSON.stringify(level.tubes))); // Deep copy
    setMoves(0);
    setSelectedTube(null);
    setIsGameWon(false);
    setGameStarted(true);
  };

  const handleTubeClick = (tubeIndex) => {
    if (isGameWon) return;

    if (selectedTube === null) {
      // בחירת מבחנה ראשונה
      if (tubes[tubeIndex].contents.length > 0) {
        setSelectedTube(tubeIndex);
      }
    } else {
      // ניסיון להעביר נוזל
      if (tryPourLiquid(selectedTube, tubeIndex)) {
        setMoves(moves + 1);
      }
      setSelectedTube(null);
    }
  };

  const tryPourLiquid = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return false;

    const fromTube = tubes[fromIndex];
    const toTube = tubes[toIndex];

    // בדיקת מקום במבחנת היעד
    if (toTube.contents.length >= toTube.capacity) return false;

    // קבלת הצבע העליון במבחנת המקור
    const sourceColor = fromTube.contents[fromTube.contents.length - 1];
    
    // אם מבחנת היעד ריקה או שהצבע העליון זהה
    if (toTube.contents.length === 0 || 
        toTube.contents[toTube.contents.length - 1] === sourceColor) {
      
      // העברת הנוזל
      const newTubes = [...tubes];
      newTubes[toIndex].contents.push(sourceColor);
      newTubes[fromIndex].contents.pop();
      setTubes(newTubes);
      return true;
    }

    return false;
  };

  const checkWinCondition = () => {
    if (!tubes || tubes.length === 0) return;

    const isWon = tubes.every(tube => {
      // מבחנה ריקה נחשבת תקינה
      if (tube.contents.length === 0) return true;
      
      // מבחנה צריכה להיות מלאה בצבע אחד
      const firstColor = tube.contents[0];
      return tube.contents.length === tube.capacity && 
             tube.contents.every(color => color === firstColor);
    });

    if (isWon && !isGameWon) {
      setIsGameWon(true);
      setWinDialogOpen(true);
      triggerConfetti();
      updatePlayerStats();
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const updatePlayerStats = async () => {
    if (!currentPlayer) return;

    try {
      const currentStats = currentPlayer.stats?.liquidSort || {
        gamesPlayed: 0,
        levelsCompleted: 0,
        bestMoves: {},
        lastPlayed: null
      };

      const levelId = currentLevel.id;
      const newBestMoves = currentStats.bestMoves || {};
      
      if (!newBestMoves[levelId] || moves < newBestMoves[levelId]) {
        newBestMoves[levelId] = moves;
      }

      const updatedStats = {
        stats: {
          ...currentPlayer.stats,
          liquidSort: {
            gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
            levelsCompleted: (currentStats.levelsCompleted || 0) + 1,
            bestMoves: newBestMoves,
            lastPlayed: new Date().toISOString()
          }
        }
      };

      await GamePlayer.update(currentPlayer.id, updatedStats);

      // Update profile
      const user = await User.me();
      const profile = await Profile.filter({ email: user.email });
      if (profile && profile.length > 0) {
        await Profile.update(profile[0].id, {
          lastGames: {
            ...profile[0].lastGames,
            liquidSort: {
              playerId: currentPlayer.id,
              levelId: currentLevel.id
            }
          }
        });
      }
    } catch (err) {
      console.error("Error updating player stats:", err);
    }
  };

  const renderTube = (tube, index) => {
    const isSelected = selectedTube === index;
    const height = 150; // גובה המבחנה בפיקסלים
    const segmentHeight = height / tube.capacity;

    return (
      <motion.div
        key={index}
        className={`relative cursor-pointer ${isSelected ? 'scale-110' : ''}`}
        whileHover={{ scale: 1.05 }}
        onClick={() => handleTubeClick(index)}
      >
        {/* המבחנה עצמה */}
        <div 
          className="w-16 rounded-b-full bg-gray-100 relative overflow-hidden border-2 border-gray-300"
          style={{ height: `${height}px` }}
        >
          {/* הנוזלים */}
          {tube.contents.map((color, colorIndex) => (
            <motion.div
              key={`${index}-${colorIndex}`}
              className="absolute w-full"
              style={{
                backgroundColor: COLORS[color],
                height: `${segmentHeight}px`,
                bottom: `${colorIndex * segmentHeight}px`,
                opacity: 0.8
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
        
        {/* צוואר המבחנה */}
        <div className="w-8 h-4 bg-gray-100 mx-auto border-2 border-t-0 border-gray-300"></div>
        
        {isSelected && (
          <motion.div
            className="absolute -inset-2 border-2 border-blue-500 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layoutId="selector"
          />
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentPlayer) {
    return <PlayerSelection onPlayerSelect={setCurrentPlayer} />;
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-100 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Liquid Sort')}</h1>
            <div className="flex gap-2">
              <Link to={createPageUrl('Leaderboard')}>
                <Button variant="outline" size="sm">
                  <Trophy className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('Records')}
                </Button>
              </Link>
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('Back to Home')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {levels.map((level) => (
              <Card 
                key={level.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {language === 'en' ? level.title_en || level.title : level.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {language === 'en' ? level.description_en || level.description : level.description}
                      </p>
                    </div>
                    <Badge className={
                      level.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {t(level.difficulty)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {t('Max moves:')} {level.maxMoves}
                    </div>
                    <Button onClick={() => startLevel(level)}>
                      {t('Start Game')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-100 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold text-cyan-800">
            {language === 'en' ? currentLevel.title_en || currentLevel.title : currentLevel.title}
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (confirm(t('Are you sure you want to exit the game?'))) {
                  setGameStarted(false);
                }
              }}
            >
              <Home className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('Level Selection')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => startLevel(currentLevel)}
            >
              <RotateCcw className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('Restart')}
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg">
                  {t('moves')}: {moves}
                </Badge>
                {currentLevel.maxMoves && (
                  <Progress 
                    value={(moves / currentLevel.maxMoves) * 100} 
                    className="w-32"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-8 p-8">
              <AnimatePresence>
                {tubes.map((tube, index) => renderTube(tube, index))}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </div>

      <AlertDialog open={winDialogOpen} onOpenChange={setWinDialogOpen}>
        <AlertDialogContent>
          <div className="p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t('Congratulations!')}</h3>
              <p className="text-gray-600">
                {t('You completed the level in')} {moves} {t('moves')}
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={() => {
                setWinDialogOpen(false);
                setGameStarted(false);
              }}>
                <ChevronRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('Choose New Level')}
              </Button>
              <Button variant="outline" onClick={() => {
                setWinDialogOpen(false);
                startLevel(currentLevel);
              }}>
                <RotateCcw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('Play Again')}
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
