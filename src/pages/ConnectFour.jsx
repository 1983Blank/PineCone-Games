
import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import PlayerSelection from '../components/connectfour/PlayerSelection';
import confetti from 'canvas-confetti';
import { User } from '@/api/entities';

const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const PLAYER1 = 'red';
const PLAYER2 = 'yellow';

export default function ConnectFour() {
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER1);
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [lastMove, setLastMove] = useState(null);
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
      "Connect Four": { he: "ארבע בשורה", en: "Connect Four" },
      "Records": { he: "שיאים", en: "Records" },
      "Home": { he: "בית", en: "Home" },
      "New Game": { he: "משחק חדש", en: "New Game" },
      "won!": { he: "ניצח!", en: "won!" },
      "It's a tie!": { he: "תיקו!", en: "It's a tie!" },
      "Back to Home": { he: "חזרה לדף הבית", en: "Back to Home" }
    };
    
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };

  const checkWinner = (boardState, row, col) => {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal down-right
      [1, -1], // diagonal down-left
    ];

    const player = boardState[row][col];
    if (!player) return false;

    for (let [dy, dx] of directions) {
      let count = 1;
      
      // Check in positive direction
      for (let i = 1; i <= 3; i++) {
        const newRow = row + (dy * i);
        const newCol = col + (dx * i);
        
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          boardState[newRow][newCol] === player
        ) {
          count++;
        } else {
          break;
        }
      }
      
      // Check in negative direction
      for (let i = 1; i <= 3; i++) {
        const newRow = row - (dy * i);
        const newCol = col - (dx * i);
        
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          boardState[newRow][newCol] === player
        ) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 4) return true;
    }
    
    return false;
  };

  const handleDrop = (col) => {
    if (winner || isDraw) return;

    const newBoard = board.map(row => [...row]);
    
    // Find the lowest empty cell in the column
    let row = ROWS - 1;
    while (row >= 0 && newBoard[row][col] !== EMPTY) {
      row--;
    }
    
    // If column is full, return
    if (row < 0) return;
    
    // Drop the piece
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setLastMove({ row, col });
    
    // Check for winner
    if (checkWinner(newBoard, row, col)) {
      handleWin(currentPlayer);
      return;
    }
    
    // Check for draw
    if (newBoard.every(row => row.every(cell => cell !== EMPTY))) {
      setIsDraw(true);
      return;
    }
    
    // Switch players
    setCurrentPlayer(currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1);
  };

  const handleWin = async (winner) => {
    setWinner(winner);
    triggerConfetti();
    
    if (players) {
      try {
        const winningPlayer = winner === PLAYER1 ? players.player1 : players.player2;
        const losingPlayer = winner === PLAYER1 ? players.player2 : players.player1;
        
        // Update winner stats
        const winnerStats = winningPlayer.stats?.connectFour || { gamesPlayed: 0, gamesWon: 0 };
        await GamePlayer.update(winningPlayer.id, {
          stats: {
            ...winningPlayer.stats,
            connectFour: {
              gamesPlayed: (winnerStats.gamesPlayed || 0) + 1,
              gamesWon: (winnerStats.gamesWon || 0) + 1,
              lastPlayed: new Date().toISOString()
            }
          }
        });
        
        // Update loser stats
        const loserStats = losingPlayer.stats?.connectFour || { gamesPlayed: 0, gamesWon: 0 };
        await GamePlayer.update(losingPlayer.id, {
          stats: {
            ...losingPlayer.stats,
            connectFour: {
              gamesPlayed: (loserStats.gamesPlayed || 0) + 1,
              gamesWon: loserStats.gamesWon || 0,
              lastPlayed: new Date().toISOString()
            }
          }
        });
      } catch (err) {
        console.error("Error updating game stats:", err);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER1);
    setWinner(null);
    setIsDraw(false);
    setLastMove(null);
  };

  const handlePlayersSelect = (selectedPlayers) => {
    setPlayers(selectedPlayers);
    setGameStarted(true);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (!gameStarted) {
    return <PlayerSelection onPlayersSelect={handlePlayersSelect} />;
  }

  return (
    <div className="min-h-screen py-8 px-4" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Connect Four')}</h1>
          <div className="flex gap-2">
            <Link to={createPageUrl("Leaderboard")}>
              <Button variant="outline" size="sm">
                <Trophy className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('Records')}
              </Button>
            </Link>
            <Link to={createPageUrl("Home")}>
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('Home')}
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6 bg-white shadow-lg">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                currentPlayer === PLAYER1 ? 'bg-red-100 ring-2 ring-red-400' : 'bg-gray-50'
              }`}>
                <div className="text-sm font-medium">{players.player1.name}</div>
                <div className="w-4 h-4 rounded-full bg-red-500 mt-1" />
              </div>
              <div className={`p-3 rounded-lg ${
                currentPlayer === PLAYER2 ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-gray-50'
              }`}>
                <div className="text-sm font-medium">{players.player2.name}</div>
                <div className="w-4 h-4 rounded-full bg-yellow-500 mt-1" />
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="text-gray-500"
            >
              <RotateCcw className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('New Game')}
            </Button>
          </div>

          <div className="bg-cyan-500 p-4 relative rounded-lg shadow-inner">
            <div 
              className="grid grid-cols-7 gap-2 bg-blue-700 p-2 rounded-lg"
              style={{ aspectRatio: '7/6' }}
            >
              {board.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    className="relative bg-blue-800 rounded-full overflow-hidden"
                    onClick={() => handleDrop(colIndex)}
                    whileHover={!winner && !isDraw ? { opacity: 0.8 } : {}}
                  >
                    <div className="bg-teal-100 absolute inset-0">
                      {cell && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`absolute inset-1 rounded-full ${
                            cell === PLAYER1 ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                        />
                      )}
                    </div>
                    <div style={{ paddingBottom: '100%' }} /> {/* Maintain aspect ratio */}
                  </motion.div>
                ))
              ))}
            </div>

            {(winner || isDraw) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                  <h3 className="text-2xl font-bold mb-4">
                    {isDraw ? t('It\'s a tie!') : `${winner === PLAYER1 ? players.player1.name : players.player2.name} ${t('won!')}`}
                  </h3>
                  <div className="flex gap-4">
                    <Button onClick={resetGame}>{t('New Game')}</Button>
                    <Link to={createPageUrl('Home')}>
                      <Button variant="outline">{t('Back to Home')}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
