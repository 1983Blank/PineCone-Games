
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Clock, MousePointer, Smile, Award, Cat, Leaf, Car, Users } from "lucide-react";
import { Game } from "@/api/entities";
import { Cards } from "@/api/entities";
import { Profile } from "@/api/entities";
import { GamePlayer } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = {
  animals: {
    label: 'חיות',
    icon: Cat
  },
  plants: {
    label: 'צמחים',
    icon: Leaf
  },
  vehicles: {
    label: 'כלי תחבורה',
    icon: Car
  },
  people: {
    label: 'אנשים',
    icon: Users
  }
};

const cardCounts = [6, 8, 10, 12, 14, 16, 20];

export default function GameBoard({ settings, players, onGameComplete, onStartGame, onExit, onBack }) {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('animals');
  const [cardsCount, setCardsCount] = useState(8);
  const [columns, setColumns] = useState(4);
  const [gamePlayers, setGamePlayers] = useState([]);

  useEffect(() => {
    let timer;
    if (!isGameComplete && !isLoading && settings) {
      timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGameComplete, isLoading, settings]);

  useEffect(() => {
    if (settings) {
      console.log("Initializing game with settings:", settings);
      initializeGame();
    }
  }, [settings]);

  const getCardsForGame = useCallback(async (category, count) => {
    try {
      console.log(`Fetching cards for category: ${category}, count: ${count}`);
      const allCategoryCards = await Cards.filter({ category });
      console.log(`Found ${allCategoryCards.length} cards for category ${category}`);

      if (!allCategoryCards || allCategoryCards.length === 0) {
        throw new Error('לא נמצאו קלפים. יש להכין קלפים תחילה בעמוד הניהול.');
      }

      const pairsNeeded = Math.floor(count / 2);
      console.log(`Need ${pairsNeeded} pairs for a total of ${count} cards`);

      const availablePairs = Math.min(pairsNeeded, allCategoryCards.length);
      console.log(`Using ${availablePairs} available pairs`);

      let selectedCards = [...allCategoryCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, availablePairs);

      const pairs = [];
      selectedCards.forEach(card => {
        pairs.push(
          {
            id: `${card.id}-1`,
            term: card.term,
            imageUrl: card.imageUrl,
            isFlipped: false,
            isMatched: false,
            matchedBy: null
          },
          {
            id: `${card.id}-2`,
            term: card.term,
            imageUrl: card.imageUrl,
            isFlipped: false,
            isMatched: false,
            matchedBy: null
          }
        );
      });

      const shuffledPairs = pairs.sort(() => Math.random() - 0.5);
      console.log(`Returning ${shuffledPairs.length} cards`);
      return shuffledPairs;
    } catch (error) {
      console.error("Error getting cards:", error);
      throw error;
    }
  }, []);

  const initializeGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let initialPlayers = [];
      if (players && Array.isArray(players)) {
        initialPlayers = players.map(player => ({
          ...player,
          score: 0
        }));
      } else if (settings && settings.players && Array.isArray(settings.players)) {
        initialPlayers = settings.players.map(player => ({
          ...player,
          score: 0
        }));
      }

      setGamePlayers(initialPlayers);
      console.log("Game players:", initialPlayers);

      let gridColumns = 4;
      let cardCount = settings ? settings.cardsCount : cardsCount;

      if (cardCount >= 16) {
        gridColumns = 4;
      } else if (cardCount >= 12) {
        gridColumns = 4;
      } else {
        gridColumns = 3;
      }

      setColumns(gridColumns);

      const gameCategory = settings ? settings.category : category;
      console.log(`Getting cards for category: ${gameCategory}, count: ${cardCount}`);

      const gameCards = await getCardsForGame(gameCategory, cardCount);
      console.log(`Retrieved ${gameCards.length} cards for the game`);
      setCards(gameCards);

      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing game:", err);
      setError(err.message || "אירעה שגיאה בהתחלת המשחק");
      setIsLoading(false);
    }
  }, [getCardsForGame, cardsCount, category, settings, players]);

  const handleCardClick = useCallback((index) => {
    if (isGameComplete || cards[index].isFlipped || cards[index].isMatched || flippedCards.length >= 2) {
      return;
    }

    const updatedCards = [...cards];
    updatedCards[index].isFlipped = true;
    setCards(updatedCards);

    setFlippedCards(prev => [...prev, index]);

    if (flippedCards.length === 1) {
      setMoves(prev => prev + 1);

      const firstIndex = flippedCards[0];
      const secondIndex = index;

      if (cards[firstIndex].term === cards[secondIndex].term) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          matchedCards[firstIndex].matchedBy = gamePlayers[currentPlayerIndex].name;
          matchedCards[secondIndex].matchedBy = gamePlayers[currentPlayerIndex].name;

          setCards(matchedCards);

          const updatedPlayers = [...gamePlayers];
          updatedPlayers[currentPlayerIndex].score += 1;
          setGamePlayers(updatedPlayers);

          const allMatched = matchedCards.every(card => card.isMatched);
          if (allMatched) {
            handleGameComplete();
          }

          setFlippedCards([]);
        }, 1000);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);

          setCurrentPlayerIndex(prev => (prev + 1) % gamePlayers.length);

          setFlippedCards([]);
        }, 1500);
      }
    }
  }, [cards, flippedCards, isGameComplete, currentPlayerIndex, gamePlayers]);

  const handleGameComplete = useCallback(() => {
    setIsGameComplete(true);
    triggerConfetti();
    
    if (onGameComplete) {
      onGameComplete({
        players: gamePlayers,
        time,
        moves
      });
    }
  }, [gamePlayers, time, moves, onGameComplete]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  if (!settings) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl rounded-2xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-800 mb-4">הגדרות משחק</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-xl font-medium mb-3 text-blue-800">קטגוריה</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 text-lg border-2 border-blue-200">
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([id, cat]) => (
                      <SelectItem key={id} value={id} className="text-lg">
                        <div className="flex items-center gap-2">
                          {React.createElement(cat.icon, { className: "w-6 h-6" })}
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xl font-medium mb-3 text-blue-800">מספר קלפים</label>
                <Select 
                  value={String(cardsCount)} 
                  onValueChange={(value) => setCardsCount(Number(value))}
                >
                  <SelectTrigger className="h-12 text-lg border-2 border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cardCounts.map((count) => (
                      <SelectItem key={count} value={String(count)} className="text-lg">
                        {count} קלפים
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="text-lg py-6"
            >
              חזור
            </Button>
            <Button
              onClick={() => onStartGame && onStartGame({ category, cardsCount, players: gamePlayers })}
              className="text-lg py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              התחל משחק
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4">טוען את המשחק...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg text-red-700">
        <p className="font-semibold">אירעה שגיאה:</p>
        <p>{error}</p>
        <Button 
          variant="secondary" 
          className="mt-4"
          onClick={initializeGame}
        >
          נסה שוב
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            {gamePlayers.map((player, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  currentPlayerIndex === index 
                    ? 'bg-green-100 ring-2 ring-green-400' 
                    : 'bg-gray-50'
                }`}
              >
                <Smile className={`w-6 h-6 ${
                  currentPlayerIndex === index ? 'text-green-500' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-sm">{player.name}</div>
                  <div className="text-xs text-gray-600">{player.score} נקודות</div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-gray-500"
          >
            חזור למסך הבית
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-mono text-lg">
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg">
              <MousePointer className="w-5 h-5 text-purple-500" />
              <span className="font-mono text-lg">{moves} מהלכים</span>
            </div>
          </div>

          <div className="bg-yellow-50 p-2 rounded-lg">
            <span className="text-sm font-medium text-yellow-700">
              {settings.cardsCount} קלפים | {settings.category === 'animals' ? 'חיות' : 
               settings.category === 'plants' ? 'צמחים' : 
               settings.category === 'vehicles' ? 'כלי תחבורה' : 'אנשים'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className={`grid gap-3 ${
            settings ? (
              settings.cardsCount <= 12 
                ? 'grid-cols-3 sm:grid-cols-4' 
                : 'grid-cols-4 sm:grid-cols-5'
            ) : 'grid-cols-1'
          }`}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              className="aspect-square"
            >
              <Card
                className={`w-full h-full cursor-pointer transition-transform duration-500 transform perspective-1000 ${
                  card.isFlipped ? 'rotate-y-180' : ''
                } relative ${card.isMatched ? 'opacity-80' : ''}`}
                onClick={() => handleCardClick(index)}
              >
                <div className="relative w-full h-full">
                  <div className={`absolute w-full h-full backface-hidden ${
                    card.isFlipped ? 'opacity-0' : 'opacity-100'
                  }`}>
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center p-4">
                      <div className="text-white text-5xl font-bold">?</div>
                    </div>
                  </div>

                  <div className={`absolute w-full h-full backface-hidden rotate-y-180 ${
                    card.isFlipped ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-3">
                      <div className="w-full h-full flex items-center justify-center">
                        <img 
                          src={card.imageUrl} 
                          alt={card.term}
                          className="max-w-full max-h-full object-contain rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/150?text=" + encodeURIComponent(card.term);
                          }}
                        />
                      </div>
                      <div className="mt-2 text-sm font-medium text-center">
                        {card.term}
                      </div>
                    </div>
                  </div>

                  {card.isMatched && card.matchedBy && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full z-10 shadow-sm">
                      {card.matchedBy}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <AlertDialog open={isGameComplete}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl mb-4 text-green-600">ניצחון! 🎉</AlertDialogTitle>
            <Award className="w-20 h-20 mx-auto text-yellow-500 animate-bounce" />
            <AlertDialogDescription className="space-y-4 text-lg mt-4">
              <p className="text-xl font-bold">
                {gamePlayers.length > 1 
                  ? `המנצח: ${gamePlayers.sort((a, b) => b.score - a.score)[0].name}!`
                  : 'כל הכבוד! השלמת את המשחק!'}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-800">
                    <Clock className="w-4 h-4" />
                    <span>זמן</span>
                  </div>
                  <p className="font-mono text-xl">
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-purple-800">
                    <MousePointer className="w-4 h-4" />
                    <span>מהלכים</span>
                  </div>
                  <p className="font-mono text-xl">{moves}</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center mt-4">
            <Button onClick={() => onGameComplete && onGameComplete({
              players: gamePlayers,
              time,
              moves
            })} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-2">
              סיים משחק
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
