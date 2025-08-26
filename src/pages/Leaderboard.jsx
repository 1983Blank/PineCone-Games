import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Home,
  Search,
  Trophy,
  Target,
  Grid3x3,
  Calculator,
  Layout as LayoutIcon,
  Shirt,
  Hash,
  Paintbrush,
  Medal,
  ArrowUpDown,
  Beaker
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('memory');
  const [currentUser, setCurrentUser] = useState(null);
  const [language, setLanguage] = useState('he'); // Default to Hebrew

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      
      const user = await User.me();
      setCurrentUser(user);
      setLanguage(user?.language || 'he');
      
      const allPlayers = await GamePlayer.list();
      setPlayers(allPlayers);
      
      console.log("Loaded players:", allPlayers);
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading players:", error);
      setLoading(false);
    }
  };

  // Translations
  const t = (key) => {
    const translations = {
      "Leaderboard": { he: "לוח השיאים", en: "Leaderboard" },
      "Search players...": { he: "חפש שחקנים...", en: "Search players..." },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Memory Game": { he: "משחק הזיכרון", en: "Memory Game" },
      "Memory": { he: "זיכרון", en: "Memory" },
      "Tic Tac Toe": { he: "איקס עיגול", en: "Tic Tac Toe" },
      "Tetris": { he: "טטריס", en: "Tetris" },
      "Multiplication": { he: "לוח הכפל", en: "Multiplication" },
      "Fashion": { he: "הלבשה", en: "Fashion" },
      "Connect Four": { he: "ארבע בשורה", en: "Connect Four" },
      "Coloring": { he: "צביעה", en: "Coloring" },
      "Liquid Sort": { he: "משחק הנוזלים", en: "Liquid Sort" },
      "Brick Breaker": { he: "שובר הלבנים", en: "Brick Breaker" },
      "Records - Memory Game": { he: "שיאים - משחק הזיכרון", en: "Records - Memory Game" },
      "Records - Tic Tac Toe": { he: "שיאים - איקס עיגול", en: "Records - Tic Tac Toe" },
      "Records - Tetris": { he: "שיאים - טטריס", en: "Records - Tetris" },
      "Records - Multiplication": { he: "שיאים - לוח הכפל", en: "Records - Multiplication" },
      "Records - Fashion Game": { he: "שיאים - משחק הלבשה", en: "Records - Fashion Game" },
      "Records - Connect Four": { he: "שיאים - ארבע בשורה", en: "Records - Connect Four" },
      "Records - Coloring Game": { he: "שיאים - משחק צביעה", en: "Records - Coloring Game" },
      "Records - Liquid Sort": { he: "שיאים - משחק הנוזלים", en: "Records - Liquid Sort" },
      "Records - Brick Breaker": { he: "שיאים - שובר הלבנים", en: "Records - Brick Breaker" },
      "No data found for this game": { he: "לא נמצאו נתונים למשחק זה", en: "No data found for this game" },
      "points": { he: "נקודות", en: "points" },
      "wins out of": { he: "ניצחונות מתוך", en: "wins out of" },
      "games": { he: "משחקים", en: "games" },
      "points | level": { he: "נקודות | רמה", en: "points | level" },
      "points | correct answers": { he: "נקודות | תשובות נכונות", en: "points | correct answers" },
      "points | outfits": { he: "נקודות | תלבושות", en: "points | outfits" },
      "points | pictures": { he: "נקודות | תמונות", en: "points | pictures" },
      "points | levels": { he: "נקודות | שלבים", en: "points | levels" },
      "you": { he: "אתה", en: "you" },
      "Play": { he: "שחק", en: "Play" }
    };
    
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };

  const getFilteredPlayers = (gameType) => {
    if (!players || players.length === 0) return [];
    
    let filtered = players;
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    console.log(`Filtering for game type: ${gameType}`);
    
    switch (gameType) {
      case 'memory':
        return filtered
          .filter(p => p.stats?.memory?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.memory?.highScore || 0) - (a.stats?.memory?.highScore || 0));
      case 'tictactoe':
        return filtered
          .filter(p => p.stats?.tictactoe?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.tictactoe?.gamesWon || 0) - (a.stats?.tictactoe?.gamesWon || 0));
      case 'tetris':
        return filtered
          .filter(p => p.stats?.tetris?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.tetris?.highScore || 0) - (a.stats?.tetris?.highScore || 0));
      case 'multiplication':
        return filtered
          .filter(p => p.stats?.multiplication?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.multiplication?.highScore || 0) - (a.stats?.multiplication?.highScore || 0));
      case 'fashion':
        return filtered
          .filter(p => p.stats?.fashion?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.fashion?.highScore || 0) - (a.stats?.fashion?.highScore || 0));
      case 'connectFour':
        return filtered
          .filter(p => p.stats?.connectFour?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.connectFour?.gamesWon || 0) - (a.stats?.connectFour?.gamesWon || 0));
      case 'coloring':
        return filtered
          .filter(p => p.stats?.coloring?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.coloring?.highScore || 0) - (a.stats?.coloring?.highScore || 0));
      case 'liquidSort':
          return filtered
            .filter(p => p.stats?.liquidSort?.gamesPlayed > 0)
            .sort((a, b) => (b.stats?.liquidSort?.highScore || 0) - (a.stats?.liquidSort?.highScore || 0));
      case 'brickBreaker':
        return filtered
          .filter(p => p.stats?.brickBreaker?.gamesPlayed > 0)
          .sort((a, b) => (b.stats?.brickBreaker?.highScore || 0) - (a.stats?.brickBreaker?.highScore || 0));
      default:
        return [];
    }
  };

  const renderLeaderboard = (gameType) => {
    const filteredPlayers = getFilteredPlayers(gameType);
    
    console.log(`Filtered players for ${gameType}:`, filteredPlayers);
    
    if (filteredPlayers.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          {t('No data found for this game')}
        </div>
      );
    }

    return (
      <div className="space-y-4 p-1">
        {filteredPlayers.map((player, index) => {
          let statDisplay;
          let gameLink;
          
          switch (gameType) {
            case 'memory':
              statDisplay = `${player.stats?.memory?.highScore || 0} ${t('points')} | ${player.stats?.memory?.gamesWon || 0} ${t('wins out of')} ${player.stats?.memory?.gamesPlayed || 0} ${t('games')}`;
              gameLink = 'Game';
              break;
            case 'tictactoe':
              statDisplay = `${player.stats?.tictactoe?.gamesWon || 0} ${t('wins out of')} ${player.stats?.tictactoe?.gamesPlayed || 0} ${t('games')}`;
              gameLink = 'TicTacToe';
              break;
            case 'tetris':
              statDisplay = `${player.stats?.tetris?.highScore || 0} ${t('points')} | ${t('level')} ${player.stats?.tetris?.maxLevel || 1}`;
              gameLink = 'Tetris';
              break;
            case 'multiplication':
              statDisplay = `${player.stats?.multiplication?.highScore || 0} ${t('points')} | ${player.stats?.multiplication?.correctAnswers || 0} ${t('correct answers')}`;
              gameLink = 'Multiplication';
              break;
            case 'fashion':
              statDisplay = `${player.stats?.fashion?.highScore || 0} ${t('points')} | ${player.stats?.fashion?.outfitsCreated || 0} ${t('outfits')}`;
              gameLink = 'Fashion';
              break;
            case 'connectFour':
              statDisplay = `${player.stats?.connectFour?.gamesWon || 0} ${t('wins out of')} ${player.stats?.connectFour?.gamesPlayed || 0} ${t('games')}`;
              gameLink = 'ConnectFour';
              break;
            case 'coloring':
              statDisplay = `${player.stats?.coloring?.highScore || 0} ${t('points')} | ${player.stats?.coloring?.picturesCompleted || 0} ${t('pictures')}`;
              gameLink = 'Coloring';
              break;
            case 'liquidSort':
              statDisplay = `${player.stats?.liquidSort?.highScore || 0} ${t('points')} | ${t('levels')} ${player.stats?.liquidSort?.levelsCompleted || 0}`;
              gameLink = 'LiquidSort';
              break;
            case 'brickBreaker':
              statDisplay = `${player.stats?.brickBreaker?.highScore || 0} ${t('points')} | ${t('levels')} ${player.stats?.brickBreaker?.levelsCompleted || 0}`;
              gameLink = 'BrickBreaker';
              break;
            default:
              statDisplay = '';
              gameLink = '';
          }
          
          return (
            <div 
              key={player.id}
              className={`p-4 rounded-lg flex items-center ${
                index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
                index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
                index === 2 ? 'bg-amber-50 border-2 border-amber-200' :
                'bg-white border border-gray-200'
              }`}
            >

              <Avatar className="mr-4 h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${player.name}.png`} />
                <AvatarFallback>{player.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-grow">
                <div className="font-bold">
                  {player.name}
                  {player.userEmail === currentUser?.email && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2">
                      {t('you')}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{statDisplay}</div>
              </div>
              
              <Link to={createPageUrl(gameLink)}>
                <Button size="sm" variant="ghost">
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  {t('Play')}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    );
  };

  const getTabTitle = (gameType) => {
    switch (gameType) {
      case 'memory': 
        return { icon: <Target className="h-4 w-4" />, text: t('Memory') };
      case 'tictactoe': 
        return { icon: <Grid3x3 className="h-4 w-4" />, text: t('Tic Tac Toe') };
      case 'tetris': 
        return { icon: <LayoutIcon className="h-4 w-4" />, text: t('Tetris') };
      case 'multiplication': 
        return { icon: <Calculator className="h-4 w-4" />, text: t('Multiplication') };
      case 'fashion': 
        return { icon: <Shirt className="h-4 w-4" />, text: t('Fashion') };
      case 'connectFour': 
        return { icon: <Hash className="h-4 w-4" />, text: t('Connect Four') };
      case 'coloring': 
        return { icon: <Paintbrush className="h-4 w-4" />, text: t('Coloring') };
      case 'brickBreaker': 
        return { icon: <Grid3x3 className="h-4 w-4" />, text: t('Brick Breaker') };
      case 'liquidSort': 
        return { icon: <Beaker className="h-4 w-4" />, text: t('Liquid Sort') };
      default: 
        return { icon: <Trophy className="h-4 w-4" />, text: gameType };
    }
  };

  const getRecordsTitle = (gameType) => {
    switch (gameType) {
      case 'memory': return t('Records - Memory Game');
      case 'tictactoe': return t('Records - Tic Tac Toe');
      case 'tetris': return t('Records - Tetris');
      case 'multiplication': return t('Records - Multiplication');
      case 'fashion': return t('Records - Fashion Game');
      case 'connectFour': return t('Records - Connect Four');
      case 'coloring': return t('Records - Coloring Game');
      case 'liquidSort': return t('Records - Liquid Sort');
      case 'brickBreaker': return t('Records - Brick Breaker');
      default: return '';
    }
  };

  return (
    <div className="min-h-screen py-8" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600">
            {t('Leaderboard')}
          </h1>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {t('Back to Home')}
            </Button>
          </Link>
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className={`absolute ${language === 'en' ? 'left-3' : 'right-3'} top-3 h-4 w-4 text-gray-400`} />
              <Input
                placeholder={t('Search players...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${language === 'en' ? 'pr-3 pl-10' : 'pl-3 pr-10'}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="memory" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="flex overflow-x-auto space-x-2 p-1 mb-4 whitespace-nowrap md:grid md:grid-cols-8">
                {['memory', 'tictactoe', 'tetris', 'multiplication', 'fashion', 'connectFour', 'coloring', 'brickBreaker'].map(gameType => {
                  const { icon, text } = getTabTitle(gameType);
                  return (
                    <TabsTrigger key={gameType} value={gameType} className="flex items-center gap-1 py-2 px-3">
                      {icon}
                      <span className="text-xs">{text}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {['memory', 'tictactoe', 'tetris', 'multiplication', 'fashion', 'connectFour', 'coloring', 'liquidSort', 'brickBreaker'].map(gameType => (
                <TabsContent key={gameType} value={gameType} className="mt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-xl font-bold">{getRecordsTitle(gameType)}</h2>
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    renderLeaderboard(gameType)
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}