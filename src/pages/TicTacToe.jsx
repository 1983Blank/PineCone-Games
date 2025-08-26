
import React, { useState, useEffect } from 'react';
import { TicTacToeGame } from '@/api/entities';
import { GamePlayer } from '@/api/entities';
import { Button } from "@/components/ui/button"; 
import { Card } from "@/components/ui/card"; 
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"; 
import { X, Circle, RotateCcw, Trophy, Home } from "lucide-react";
import { motion } from "framer-motion";
import PlayerSelection from '../components/tictactoe/PlayerSelection';
import { User } from '@/api/entities';
import { Profile } from '@/api/entities';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import confetti from 'canvas-confetti';

const WinPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], 
  [0, 3, 6], [1, 4, 7], [2, 5, 8], 
  [0, 4, 8], [2, 4, 6] 
];

export default function TicTacToe() {
  const [selectedPlayers, setSelectedPlayers] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('he');

  useEffect(() => {
    loadProfile();
  }, []);

  // Translations
  const t = (key) => {
    const translations = {
      "Tic Tac Toe": { he: "איקס עיגול", en: "Tic Tac Toe" },
      "Leaderboard": { he: "לוח תוצאות", en: "Leaderboard" },
      "Player X": { he: "שחקן X", en: "Player X" },
      "Player O": { he: "שחקן O", en: "Player O" },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Play Again": { he: "משחק נוסף", en: "Play Again" },
      "Restart": { he: "התחל מחדש", en: "Restart" },
      "New Players": { he: "שחקנים חדשים", en: "New Players" },
      "Congratulations!": { he: "כל הכבוד!", en: "Congratulations!" },
      "It's a tie!": { he: "תיקו!", en: "It's a tie!" },
      "The game ended in a tie!": { he: "המשחק הסתיים בתיקו!", en: "The game ended in a tie!" },
      "You won the game!": { he: "ניצחת את המשחק!", en: "You won the game!" },
      "New Game": { he: "משחק חדש", en: "New Game" },
      "Back to Home Screen": { he: "חזרה למסך הבית", en: "Back to Home Screen" },
      "won!": { he: "ניצח!", en: "won!" },
      "Are you sure you want to exit the game?": { he: "האם אתה בטוח שברצונך לצאת מהמשחק?", en: "Are you sure you want to exit the game?" }
    };
    
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };

  const loadProfile = async () => {
    try {
      const loadedUser = await User.me();
      setUser(loadedUser);
      setLanguage(loadedUser?.language || 'he');

      let profile = await Profile.filter({ email: loadedUser.email });
      
      if (!profile || profile.length === 0) {
        profile = await Profile.create({
          email: loadedUser.email,
          lastGames: {
            memory: null,
            tictactoe: null,
            tetris: null
          },
          achievements: {
            memory: {
              gamesPlayed: 0,
              totalWins: 0,
              perfectGames: 0,
              fastestGame: null
            },
            tictactoe: {
              gamesPlayed: 0,
              wins: 0,
              draws: 0
            },
            tetris: {
              gamesPlayed: 0,
              highScore: 0,
              totalLines: 0,
              maxLevel: 1
            }
          }
        });
      } else {
        profile = profile[0];
        
        if (!profile.achievements) {
          await Profile.update(profile.id, {
            achievements: {
              memory: {
                gamesPlayed: 0,
                totalWins: 0,
                perfectGames: 0,
                fastestGame: null
              },
              tictactoe: {
                gamesPlayed: 0,
                wins: 0,
                draws: 0
              },
              tetris: {
                gamesPlayed: 0,
                highScore: 0,
                totalLines: 0,
                maxLevel: 1
              }
            }
          });
          
          profile = (await Profile.filter({ email: loadedUser.email }))[0];
        }
        
        if (!profile.achievements.tictactoe) {
          const updatedAchievements = {
            ...profile.achievements,
            tictactoe: {
              gamesPlayed: 0,
              wins: 0,
              draws: 0
            }
          };
          
          await Profile.update(profile.id, { achievements: updatedAchievements });
          profile = (await Profile.filter({ email: loadedUser.email }))[0];
        }
      }

      if (profile.lastGames?.tictactoe?.playerX && profile.lastGames?.tictactoe?.playerO) {
        try {
          const lastX = await GamePlayer.get(profile.lastGames.tictactoe.playerX);
          const lastO = await GamePlayer.get(profile.lastGames.tictactoe.playerO);
          if (lastX && lastO) {
            setSelectedPlayers({ X: lastX, O: lastO });
            setStartTime(Date.now());
          }
        } catch (err) {
          console.error("Error loading last players:", err);
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const checkWinner = (squares) => {
    for (let pattern of WinPatterns) {
      const [a, b, c] = pattern;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }
    
    const interval = setInterval(function() {
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
  
  const handleMove = async (index) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setMoves(moves + 1);

    const newWinner = checkWinner(newBoard);
    if (newWinner) {
      handleWin(newWinner);
    } else if (newBoard.every(square => square)) {
      setWinner('tie');
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const handleWin = async (winner) => {
    setWinner(winner);
    triggerConfetti();
    
    const gameTime = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      const winningPlayer = winner === 'X' ? selectedPlayers.X : selectedPlayers.O;
      if (winningPlayer) {
        const currentStats = winningPlayer.stats?.tictactoe || {
          gamesPlayed: 0,
          gamesWon: 0,
          lastPlayed: null
        };
        
        const statsUpdate = {
          stats: {
            ...winningPlayer.stats,
            tictactoe: {
              gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
              gamesWon: (currentStats.gamesWon || 0) + 1,
              lastPlayed: new Date().toISOString()
            }
          }
        };
        
        await GamePlayer.update(winningPlayer.id, statsUpdate);
        
        const losingPlayer = winner === 'X' ? selectedPlayers.O : selectedPlayers.X;
        if (losingPlayer) {
          const loserCurrentStats = losingPlayer.stats?.tictactoe || {
            gamesPlayed: 0,
            gamesWon: 0,
            lastPlayed: null
          };
          
          const loserStatsUpdate = {
            stats: {
              ...losingPlayer.stats,
              tictactoe: {
                gamesPlayed: (loserCurrentStats.gamesPlayed || 0) + 1,
                gamesWon: loserCurrentStats.gamesWon || 0,
                lastPlayed: new Date().toISOString()
              }
            }
          };
          
          await GamePlayer.update(losingPlayer.id, loserStatsUpdate);
        }
      }

      const winnerName = winningPlayer?.name || (winner === 'X' ? t('Player X') : t('Player O'));
      setWinDialogOpen(true);

    } catch (err) {
      console.error("Error updating game stats:", err);
    }
  };

  const handlePlayersSelect = async (players) => {
    setSelectedPlayers(players);
    setStartTime(Date.now());

    try {
      const user = await User.me();
      let profile = await Profile.filter({ email: user.email });
      if (profile && profile[0]) {
        await Profile.update(profile[0].id, { 
          lastGames: {
            ...profile[0].lastGames,
            tictactoe: {
              playerX: players.X.id,
              playerO: players.O.id
            }
          }
        });
      }
    } catch (err) {
      console.error("Error saving players:", err);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setMoves(0);
    setStartTime(Date.now());
    setWinDialogOpen(false);
  };

  const startNewGame = () => {
    resetGame();
  };

  const handleExit = () => {
    if (winner || window.confirm(t('Are you sure you want to exit the game?'))) {
      setSelectedPlayers(null);
      setBoard(Array(9).fill(null));
      setCurrentPlayer('X');
      setWinner(null);
      setMoves(0);
    }
  };

  const renderWinningLine = () => {
    if (!winner || winner === 'tie') return null;

    const winningPattern = WinPatterns.find(pattern => {
      const [a, b, c] = pattern;
      return board[a] && board[a] === board[b] && board[a] === board[c];
    });

    if (!winningPattern) return null;

    // Check if user language is RTL
    const isRTL = user?.language !== 'en';
    
    // Get the winning pattern indexes
    let [a, c] = [winningPattern[0], winningPattern[2]];
    
    // Convert to row/col coordinates in 3x3 grid
    const row1 = Math.floor(a / 3);
    const col1 = a % 3;
    const row2 = Math.floor(c / 3);
    const col2 = c % 3;
    
    // Map coordinates based on language direction
    // For Hebrew (RTL) - keep as is (already fixed)
    // For English (LTR) - keep as is (already fixed)
    const mappedCol1 = isRTL ? 2 - col1 : 2 - col1;
    const mappedCol2 = isRTL ? 2 - col2 : 2 - col2;
    
    // Get actual visual positions as percentage of container
    const cellSize = 100 / 3; // Size of a cell in percentage
    
    // Calculate centers of cells
    const startX = mappedCol1 * cellSize + (cellSize / 2);
    const startY = row1 * cellSize + (cellSize / 2);
    const endX = mappedCol2 * cellSize + (cellSize / 2);
    const endY = row2 * cellSize + (cellSize / 2);

    return (
      <svg className="absolute inset-0 pointer-events-none z-10" width="100%" height="100%">
        <line
          x1={`${startX}%`}
          y1={`${startY}%`}
          x2={`${endX}%`}
          y2={`${endY}%`}
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="8"
          strokeLinecap="round"
          className="animate-draw"
        />
      </svg>
    );
  };

  if (!selectedPlayers) {
    return (
      <>
        <PlayerSelection onPlayersSelect={handlePlayersSelect} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-lg mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Tic Tac Toe')}</h1>
          <div className="flex gap-2">
            <Link to={createPageUrl('Leaderboard')}>
              <Button variant="outline" className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                {t('Leaderboard')}
              </Button>
            </Link>
          </div>
        </div>

        
        <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur shadow-xl">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur -mx-8 -mt-8 px-8 pt-8 pb-4 border-b">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {[selectedPlayers.X, selectedPlayers.O].map((player, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      currentPlayer === (index === 0 ? 'X' : 'O') 
                        ? 'bg-blue-100 ring-2 ring-blue-400' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-gray-600">{index === 0 ? 'X' : 'O'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to={createPageUrl('Home')}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  {t('Back to Home')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 mt-4 relative">
            {renderWinningLine()}
            {board.map((square, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: square ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMove(index)}
                className={`aspect-square rounded-xl text-4xl font-bold flex items-center justify-center
                  ${!square && !winner ? 'hover:bg-gray-100 hover:shadow-md' : ''}
                  ${square === 'X' ? 'bg-blue-100 text-blue-600' : ''}
                  ${square === 'O' ? 'bg-red-100 text-red-600' : ''}
                  border-2 border-gray-200 transition-all duration-150`}
                disabled={!!square || !!winner}
              >
                {square === 'X' && <X className="w-10 h-10 sm:w-12 sm:h-12" />}
                {square === 'O' && <Circle className="w-10 h-10 sm:w-12 sm:h-12" />}
              </motion.button>
            ))}
          </div>

          {winner ? (
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={startNewGame} className="text-lg py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all">
                {t('Play Again')}
              </Button>
              <Link to={createPageUrl('Home')} className="w-full">
                <Button 
                  variant="outline"
                  className="w-full text-lg py-6 text-gray-700"
                >
                  {t('Back to Home')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={resetGame}
                className="text-lg py-4 flex items-center justify-center gap-2"
                variant="outline"
              >
                <RotateCcw className="w-5 h-5" />
                {t('Restart')}
              </Button>
              <Button
                onClick={handleExit}
                className="text-lg py-4 flex items-center justify-center gap-2 text-gray-700"
                variant="outline"
              >
                {t('New Players')}
              </Button>
            </div>
          )}
        </Card>

        <AlertDialog open={winDialogOpen} onOpenChange={setWinDialogOpen}>
          <AlertDialogContent className="text-center">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">
                {winner === 'tie' ? t("It's a tie!") : `${selectedPlayers[winner]?.name || winner} ${t('won!')} 🎉`}
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {winner === 'tie' 
                    ? t('The game ended in a tie!')
                    : t('You won the game!')
                  }
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => {
                    setWinDialogOpen(false);
                    resetGame();
                  }}>
                    {t('New Game')}
                  </Button>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="outline">
                      {t('Back to Home Screen')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
