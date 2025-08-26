import React, { useState, useEffect, useRef } from 'react';
import { GamePlayer } from '@/api/entities';
import { Profile } from '@/api/entities';
import { User } from '@/api/entities';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, RotateCcw, Pause, Home, Trophy, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlayerSelection from '../components/tetris/PlayerSelection';
import confetti from 'canvas-confetti';

// Game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 800;
const SPEED_INCREASE = 0.9;
const LINES_PER_LEVEL = 10;

// Tetrominoes - using 0 for empty and 1 for filled, with color property
const TETROMINOES = [
  {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'bg-cyan-500'
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-blue-500'
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-orange-500'
  },
  {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-500'
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 'bg-green-500'
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-purple-500'
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-red-500'
  }
];

export default function Tetris() {
  const [player, setPlayer] = useState(null);
  const [board, setBoard] = useState(createEmptyBoard());
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [dropTime, setDropTime] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Add sound state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  
  // Current tetromino state
  const [currentTetromino, setCurrentTetromino] = useState(null);
  const [nextTetromino, setNextTetromino] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // UI state
  const [cellSize, setCellSize] = useState(20); // pixels per cell
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('he');
  
  // Add YouTube embed state
  const [showYouTubeAudio, setShowYouTubeAudio] = useState(false);
  const youtubeRef = useRef(null);
  
  // Load user language
  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        setLanguage(currentUser?.language || 'he');
      } catch (err) {
        console.error("Error loading user:", err);
      }
    }
    loadUser();
  }, []);

  // Translations
  const t = (key) => {
    const translations = {
      "Tetris": { he: "טטריס", en: "Tetris" },
      "Next Piece": { he: "החלק הבא", en: "Next Piece" },
      "Score": { he: "ניקוד", en: "Score" },
      "Level": { he: "רמה", en: "Level" },
      "Lines": { he: "שורות", en: "Lines" },
      "Controls": { he: "שליטה", en: "Controls" },
      "Rotate": { he: "סובב", en: "Rotate" },
      "Left": { he: "שמאלה", en: "Left" },
      "Right": { he: "ימינה", en: "Right" },
      "Down": { he: "למטה", en: "Down" },
      "Drop": { he: "הפלה מהירה", en: "Quick Drop" },
      "Pause": { he: "השהה", en: "Pause" },
      "Resume": { he: "המשך", en: "Resume" },
      "Game Over!": { he: "המשחק הסתיים!", en: "Game Over!" },
      "Points": { he: "נקודות", en: "Points" },
      "New Game": { he: "משחק חדש", en: "New Game" },
      "Game Paused": { he: "המשחק בהשהייה", en: "Game Paused" },
      "Home": { he: "בית", en: "Home" },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Records": { he: "שיאים", en: "Records" },
      "Statistics": { he: "סטטיסטיקות", en: "Statistics" },
      "High Score": { he: "שיא", en: "High Score" },
      "Games": { he: "משחקים", en: "Games" },
      "Total Lines": { he: "שורות", en: "Lines" },
      "Max Level": { he: "רמה מירבית", en: "Max Level" }
    };
    
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };
  
  // Generate a new empty board
  function createEmptyBoard() {
    return Array.from(
      { length: BOARD_HEIGHT }, 
      () => Array(BOARD_WIDTH).fill(0)
    );
  }
  
  // Initialize sound with the direct MP3 link
  useEffect(() => {
    // Using the direct link to the Tetris theme MP3
    audioRef.current = new Audio("https://audio.jukehost.co.uk/LKlm4dit3jvF1yCIyRw5mYyqmgIvzAe4");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    
    audioRef.current.addEventListener('error', (e) => {
      console.error("Audio loading error:", e.target.error);
    });
    
    audioRef.current.addEventListener('canplaythrough', () => {
      console.log("Audio loaded successfully");
    });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('error', () => {});
        audioRef.current.removeEventListener('canplaythrough', () => {});
        audioRef.current = null;
      }
    };
  }, []);

  // Improve sound toggle with better error handling
  const toggleSound = () => {
    if (!audioRef.current) return;
    
    if (soundEnabled) {
      audioRef.current.pause();
      setSoundEnabled(false);
    } else {
      audioRef.current.play().then(() => {
        setSoundEnabled(true);
      }).catch(e => {
        console.error("Audio play failed:", e);
        setSoundEnabled(false);
      });
    }
  };
  
  // Calculate cell size based on screen dimensions
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('tetris-container');
      if (container) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          setCellSize(294 / BOARD_WIDTH);
        } else {
          const containerWidth = container.clientWidth;
          const newCellSize = Math.floor(containerWidth / BOARD_WIDTH);
          setCellSize(newCellSize);
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Random tetromino generator
  const randomTetromino = () => {
    const randIndex = Math.floor(Math.random() * TETROMINOES.length);
    return TETROMINOES[randIndex];
  };
  
  // Update game start
  const startGame = () => {
    // Play audio if sound is enabled
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error("Audio play failed:", e);
      });
    }
    
    // Reset the board
    setBoard(createEmptyBoard());
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    
    // Generate first tetromino
    setCurrentTetromino(randomTetromino());
    setNextTetromino(randomTetromino());
    
    // Set initial position
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    
    // Start the game loop
    setDropTime(INITIAL_SPEED);
    setIsPaused(false);
  };

  // Collision detection
  const checkCollision = (tetromino, pos) => {
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        // Skip empty squares in the tetromino
        if (tetromino.shape[y][x] === 0) continue;
        
        // Calculate position on the board
        const boardX = pos.x + x;
        const boardY = pos.y + y;
        
        // Check boundaries
        if (
          boardX < 0 || boardX >= BOARD_WIDTH ||  // Out of horizontal bounds
          boardY >= BOARD_HEIGHT ||                // Below the board
          (boardY >= 0 && board[boardY][boardX])   // Cell is already occupied
        ) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Merge the tetromino with the board
  const mergeTetromino = () => {
    const newBoard = [...board];
    
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[y].length; x++) {
        if (currentTetromino.shape[y][x] !== 0) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          
          // Only merge if within board bounds
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentTetromino.color;
          }
        }
      }
    }
    
    return newBoard;
  };
  
  // Rotate a tetromino
  const rotateTetromino = (tetromino) => {
    // Create a new array with transposed dimensions
    const size = tetromino.shape.length;
    const rotated = Array.from({ length: size }, () => Array(size).fill(0));
    
    // Rotate 90 degrees clockwise
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        rotated[x][size - 1 - y] = tetromino.shape[y][x];
      }
    }
    
    return { ...tetromino, shape: rotated };
  };
  
  // Move the current tetromino left or right
  const moveTetromino = (dir) => {
    if (isPaused || gameOver) return;
    
    const newPosition = { ...position, x: position.x + dir };
    if (!checkCollision(currentTetromino, newPosition)) {
      setPosition(newPosition);
    }
  };
  
  // Rotate the current tetromino
  const rotate = () => {
    if (isPaused || gameOver) return;
    
    const rotated = rotateTetromino(currentTetromino);
    
    // Try rotation with wall kicks
    const kicks = [0, -1, 1, -2, 2]; // Try original position, then left, right, etc.
    
    for (const kick of kicks) {
      const newPos = { ...position, x: position.x + kick };
      if (!checkCollision(rotated, newPos)) {
        setCurrentTetromino(rotated);
        setPosition(newPos);
        return;
      }
    }
  };
  
  // Drop the tetromino one row
  const drop = () => {
    if (isPaused || gameOver) return;
    
    const newPosition = { ...position, y: position.y + 1 };
    
    if (!checkCollision(currentTetromino, newPosition)) {
      setPosition(newPosition);
    } else {
      // We've hit something, place the tetromino
      const newBoard = mergeTetromino();
      
      // Check for completed rows and clear them
      const { clearedBoard, linesCleared } = clearRows(newBoard);
      setBoard(clearedBoard);
      
      if (linesCleared > 0) {
        // Update score based on lines cleared
        const linePoints = [40, 100, 300, 1200]; // Points for 1, 2, 3, 4 lines
        setScore(prev => {
          const newScore = prev + linePoints[linesCleared - 1] * level;
          return newScore;
        });
        
        // Update lines and level
        setLines(prev => {
          const newLines = prev + linesCleared;
          const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
          
          if (newLevel > level) {
            setLevel(newLevel);
            setDropTime(INITIAL_SPEED * Math.pow(SPEED_INCREASE, newLevel - 1));
          }
          
          return newLines;
        });
      }
      
      // Get the next tetromino
      setCurrentTetromino(nextTetromino);
      setNextTetromino(randomTetromino());
      setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
      
      // Check if game over
      if (checkCollision(nextTetromino, { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 })) {
        handleGameOver();
      }
    }
  };
  
  // Clear completed rows
  const clearRows = (board) => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      // If every cell in the row is filled (not 0)
      const isRowFilled = row.every(cell => cell !== 0);
      if (isRowFilled) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    // Add new empty rows at the top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    return { clearedBoard: newBoard, linesCleared };
  };
  
  // Hard drop - move the tetromino all the way down
  const hardDrop = () => {
    if (isPaused || gameOver) return;
    
    let newY = position.y;
    let finalY = position.y;
    
    // Calculate final position
    while (!checkCollision(currentTetromino, { ...position, y: newY + 1 })) {
      newY++;
      finalY = newY;
    }
    
    // Move to final position
    setPosition({ ...position, y: finalY });
    
    // Force immediate drop and placement
    const newBoard = [...board];
    
    // Merge the tetromino at the final position
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[y].length; x++) {
        if (currentTetromino.shape[y][x] !== 0) {
          const boardY = finalY + y;
          const boardX = position.x + x;
          
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentTetromino.color;
          }
        }
      }
    }
    
    // Check for completed rows and clear them
    const { clearedBoard, linesCleared } = clearRows(newBoard);
    setBoard(clearedBoard);
    
    if (linesCleared > 0) {
      // Update score based on lines cleared
      const linePoints = [40, 100, 300, 1200]; // Points for 1, 2, 3, 4 lines
      setScore(prev => prev + linePoints[linesCleared - 1] * level);
      
      // Update lines and level
      setLines(prev => {
        const newLines = prev + linesCleared;
        const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
        
        if (newLevel > level) {
          setLevel(newLevel);
          setDropTime(INITIAL_SPEED * Math.pow(SPEED_INCREASE, newLevel - 1));
        }
        
        return newLines;
      });
    }
    
    // Set next tetromino immediately
    setCurrentTetromino(nextTetromino);
    setNextTetromino(randomTetromino());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    
    // Check if game over
    if (checkCollision(nextTetromino, { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 })) {
      handleGameOver();
    }
  };
  
  const handleGameOver = async () => {
    // Pause audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setGameOver(true);
    setDropTime(null);
    triggerConfetti();
    
    // Update player stats
    if (player && player.id) {  // Check if player exists and has an id
      try {
        // First get the latest player data
        const currentPlayer = await GamePlayer.get(player.id);
        if (!currentPlayer) {
          console.error("Player not found");
          return;
        }

        const playerStats = currentPlayer.stats?.tetris || {
          gamesPlayed: 0,
          highScore: 0,
          totalLines: 0,
          maxLevel: 1
        };
        
        const updatedStats = {
          gamesPlayed: (playerStats.gamesPlayed || 0) + 1,
          highScore: Math.max(playerStats.highScore || 0, score),
          totalLines: (playerStats.totalLines || 0) + lines,
          maxLevel: Math.max(playerStats.maxLevel || 1, level),
          lastPlayed: new Date().toISOString()
        };
        
        await GamePlayer.update(player.id, {
          stats: {
            ...currentPlayer.stats,
            tetris: updatedStats
          }
        });
        
        // Update user profile
        const user = await User.me();
        const profiles = await Profile.filter({ email: user.email });
        
        if (profiles && profiles.length > 0) {
          await Profile.update(profiles[0].id, {
            lastGames: {
              ...profiles[0].lastGames,
              tetris: {
                playerId: player.id
              }
            }
          });
        }
        
        // Refresh player data
        const updatedPlayer = await GamePlayer.get(player.id);
        if (updatedPlayer) {  // Only update if we got the player
          setPlayer(updatedPlayer);
        }
      } catch (err) {
        console.error("Error updating game stats:", err);
      }
    }
  };
  
  // Confetti effect for game over
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  // Toggle pause
  const togglePause = () => {
    setIsPaused(prev => !prev);
    
    // Pause/resume music
    if (audioRef.current) {
      if (!isPaused) {
        audioRef.current.pause();
      } else if (soundEnabled) {
        audioRef.current.play().catch(e => {
          console.error("Audio resume failed:", e);
        });
      }
    }
  };
  
  // Game loop with useEffect
  useEffect(() => {
    if (!isPaused && !gameOver && dropTime !== null) {
      const timer = setTimeout(drop, dropTime);
      return () => clearTimeout(timer);
    }
  }, [position, dropTime, isPaused, gameOver]);
  
  // Keyboard controls - fix directions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveTetromino(-1); // Fix to move left when left arrow pressed
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveTetromino(1); // Fix to move right when right arrow pressed
          break;
        case 'ArrowDown':
          e.preventDefault();
          drop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
          e.preventDefault();
          togglePause();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, currentTetromino, board, isPaused, gameOver]);
  
  // Handle player selection
  const handlePlayerSelect = (selectedPlayer) => {
    setPlayer(selectedPlayer);
    startGame();
  };

  // If no player is selected, show player selection
  if (!player) {
    return <PlayerSelection onPlayerSelect={handlePlayerSelect} />;
  }
  
  return (
    <div className="min-h-screen py-4 px-2 md:py-6 md:px-4" dir={language === 'en' ? 'ltr' : 'rtl'}>
      {/* Remove YouTube embed since we're using direct audio */}
      
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t("Tetris")}</h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  onClick={toggleSound}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Link to={createPageUrl("Home")}>
                  <Button variant="outline" size="sm" className="h-8">
                    <Home className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:mr-2">{t("Home")}</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("Leaderboard")}>
                  <Button variant="outline" size="sm" className="h-8">
                    <Trophy className="h-4 w-4" />
                    <span className="sr-only md:not-sr-only md:mr-2">{t("Records")}</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            <Card className="bg-gray-50 text-card-foreground border shadow-sm rounded-lg overflow-hidden relative">
              
              {/* Update game container with responsive sizes */}
              <div 
                id="tetris-container"
                className="relative mx-auto bg-gray-800/40 rounded-lg p-1"
                style={{ 
                  width: '100%',
                  maxWidth: window.innerWidth <= 768 ? '294px' : `${BOARD_WIDTH * cellSize * 1.4}px`, // 294 = 420 * 0.7
                  height: window.innerWidth <= 768 ? '448px' : `${BOARD_HEIGHT * cellSize * 1.4}px`   // 448 = 640 * 0.7
                }}
              >
                {/* Static board cells - adjust cell size */}
                <div className="absolute inset-0">
                  {board.map((row, y) => 
                    row.map((cell, x) => (
                      <div
                        key={`cell-${y}-${x}`}
                        className={`absolute border border-gray-700/50 ${cell || ''}`}
                        style={{
                          left: `${x * (window.innerWidth <= 768 ? 294/BOARD_WIDTH : cellSize * 1.4)}px`,
                          top: `${y * (window.innerWidth <= 768 ? 448/BOARD_HEIGHT : cellSize * 1.4)}px`,
                          width: `${window.innerWidth <= 768 ? 294/BOARD_WIDTH : cellSize * 1.4}px`,
                          height: `${window.innerWidth <= 768 ? 448/BOARD_HEIGHT : cellSize * 1.4}px`
                        }}
                      />
                    ))
                  )}
                </div>
                
                {/* Current tetromino - adjust cell size */}
                {currentTetromino && currentTetromino.shape.map((row, rowIndex) => 
                  row.map((cell, colIndex) => {
                    if (cell !== 0) {
                      const boardX = position.x + colIndex;
                      const boardY = position.y + rowIndex;
                      
                      if (boardY < 0) return null;
                      
                      return (
                        <div
                          key={`piece-${rowIndex}-${colIndex}`}
                          className={`${currentTetromino.color} border border-white/30 absolute`}
                          style={{
                            left: `${boardX * (window.innerWidth <= 768 ? 294/BOARD_WIDTH : cellSize * 1.4)}px`,
                            top: `${boardY * (window.innerWidth <= 768 ? 448/BOARD_HEIGHT : cellSize * 1.4)}px`,
                            width: `${window.innerWidth <= 768 ? 294/BOARD_WIDTH : cellSize * 1.4}px`,
                            height: `${window.innerWidth <= 768 ? 448/BOARD_HEIGHT : cellSize * 1.4}px`
                          }}
                        />
                      );
                    }
                    return null;
                  })
                )}
                
                {/* Pause overlay */}
                {isPaused && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <div className="text-white text-2xl font-bold">{t("Game Paused")}</div>
                  </div>
                )}
                
                {/* Game over overlay */}
                {gameOver && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                    <div className="text-center p-4">
                      <div className="text-white text-2xl font-bold mb-2">{t("Game Over!")}</div>
                      <div className="text-yellow-400 text-4xl font-bold mb-4">{score} {t("Points")}</div>
                      <Button onClick={startGame} className="bg-purple-600 hover:bg-purple-700">
                        <Play className="h-4 w-4 mr-2" />
                        {t("New Game")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Info Panel */}
          <div className="space-y-2 md:space-y-4">
            <Card className="p-3 md:p-4 bg-white shadow-md">
              <div className="space-y-3 md:space-y-4">
                <div className="text-center">
                  <div className="text-sm font-medium mb-2">{t("Next Piece")}</div>
                  {nextTetromino && (
                    <div
                      className="relative bg-gray-800 mx-auto mb-2"
                      style={{
                        width: `${nextTetromino.shape.length * Math.min(16, cellSize)}px`,
                        height: `${nextTetromino.shape.length * Math.min(16, cellSize)}px`
                      }}
                    >
                      {nextTetromino.shape.map((row, y) =>
                        row.map((cell, x) => {
                          if (cell !== 0) {
                            return (
                              <div
                                key={`next-${y}-${x}`}
                                className={`${nextTetromino.color} border border-white/30 absolute`}
                                style={{
                                  left: `${x * Math.min(16, cellSize)}px`,
                                  top: `${y * Math.min(16, cellSize)}px`,
                                  width: `${Math.min(16, cellSize)}px`,
                                  height: `${Math.min(16, cellSize)}px`
                                }}
                              />
                            );
                          }
                          return null;
                        })
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-purple-50 p-2 rounded-lg text-center">
                    <div className="text-xs text-gray-500">{t("Score")}</div>
                    <div className="text-lg md:text-2xl font-bold text-purple-700">{score}</div>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded-lg text-center">
                    <div className="text-xs text-gray-500">{t("Level")}</div>
                    <div className="text-lg md:text-2xl font-bold text-indigo-700">{level}</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <div className="text-xs text-gray-500">{t("Lines")}</div>
                  <div className="text-lg font-bold text-blue-700">{lines}</div>
                </div>
                
                {/* Game Controls */}
                <div className="pt-4">
                  <div className="hidden md:block mb-2 text-center text-sm text-gray-500">{t("Controls")}</div>
                  
                  {/* Mobile Controls - Updated Layout */}
                  <div className="md:hidden fixed bottom-4 left-0 right-0 z-50">
                    <div className="bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg mx-auto max-w-[280px]">
                      {/* Move buttons to center, larger size */}
                      <div className="grid grid-cols-3 gap-2">
                        <div></div>
                        <Button 
                          variant="ghost" 
                          onClick={rotate} 
                          className="h-16 w-16 p-0 border border-gray-200 mx-auto"
                        >
                          <ArrowUp className="h-8 w-8" />
                        </Button>
                        <div></div>

                        {/* במובייל: ימין ושמאל מתהפכים */}
                        <Button 
                          variant="ghost" 
                          onClick={() => moveTetromino(language === 'en' ? -1 : 1)} 
                          className="h-16 w-16 p-0 border border-gray-200 mx-auto"
                          >
                          <ArrowRight className="h-8 w-8" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={drop} 
                          className="h-16 w-16 p-0 border border-gray-200 mx-auto"
                          >
                          <ArrowDown className="h-8 w-8" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => moveTetromino(language === 'en' ? 1 : -1)} 
                          className="h-16 w-16 p-0 border border-gray-200 mx-auto"
                          >
                          <ArrowLeft className="h-8 w-8" />
                        </Button>

                        <Button 
                          variant={isPaused ? "default" : "ghost"}
                          onClick={togglePause}
                          className="h-16 w-16 p-0 border border-gray-200 mx-auto"
                          >
                          {isPaused ? 
                            <Play className="h-8 w-8" /> : 
                            <Pause className="h-8 w-8" />
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={hardDrop} 
                          className="h-16 w-16 p-0 border border-gray-200 mx-auto"
                        >
                          <div className="flex flex-col items-center">
                            <ArrowDown className="h-5 w-5" />
                            <ArrowDown className="h-5 w-5 -mt-2" />
                          </div>
                        </Button>
                        <div></div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Controls */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div></div>
                      <Button variant="outline" onClick={rotate} className="h-10">
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">{t("Rotate")}</span>
                      </Button>
                      <div></div>
                      <Button 
                        variant={isPaused ? "default" : "outline"}
                        onClick={togglePause} 
                        className="h-10"
                      >
                        {isPaused ? 
                          <Play className="h-4 w-4" /> : 
                          <Pause className="h-4 w-4" />
                        }
                        <span className="sr-only">{isPaused ? t("Resume") : t("Pause")}</span>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" onClick={() => moveTetromino(language === 'en' ? -1 : 1)} className="h-10">
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">{t("Right")}</span>
                      </Button>
                      <Button variant="outline" onClick={drop} className="h-10">
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">{t("Down")}</span>
                      </Button>
                      <Button variant="outline" onClick={() => moveTetromino(language === 'en' ? 1 : -1)} className="h-10">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">{t("Left")}</span>
                      </Button>
                      <Button variant="outline" onClick={hardDrop} className="h-10">
                        <div className="flex flex-col items-center">
                          <ArrowDown className="h-4 w-4" />
                          <ArrowDown className="h-4 w-4 -mt-2" />
                        </div>
                        <span className="sr-only">{t("Drop")}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Player Stats */}
            {player.stats?.tetris && (
              <Card className="p-4 bg-white shadow-md">
                <div className="space-y-3">
                  <h3 className="font-bold">{t("Statistics")}</h3>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>{t("High Score")}:</div>
                    <div className="font-medium text-right">{player.stats.tetris.highScore || 0}</div>
                    <div>{t("Games")}:</div>
                    <div className="font-medium text-right">{player.stats.tetris.gamesPlayed || 0}</div>
                    <div>{t("Total Lines")}:</div>
                    <div className="font-medium text-right">{player.stats.tetris.totalLines || 0}</div>
                    <div>{t("Max Level")}:</div>
                    <div className="font-medium text-right">{player.stats.tetris.maxLevel || 1}</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}