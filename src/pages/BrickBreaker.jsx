
import React, { useState, useEffect, useRef } from 'react';
import { GamePlayer } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Home, Play, Pause, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import PlayerSelection from '../components/brickbreaker/PlayerSelection';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from "framer-motion";

export default function BrickBreaker() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  const [showDeathScreen, setShowDeathScreen] = useState(false);
  
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [nextLevel, setNextLevel] = useState(1);
  
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  
  const canvasRef = useRef(null);
  const requestAnimationRef = useRef(null);
  const containerRef = useRef(null);
  
  const ballRef = useRef({
    x: 0,
    y: 0,
    radius: 8,
    dx: 2,
    dy: -2,
    baseSpeed: 2,
    maxSpeed: 7
  });
  
  const paddleRef = useRef({
    x: 0,
    y: 0,
    width: 100,
    height: 15,
    speed: 8
  });
  
  const bricksRef = useRef([]);
  const rightPressedRef = useRef(false);
  const leftPressedRef = useRef(false);
  
  const isUpdatingStats = useRef(false);
  const lastScoreUpdate = useRef(0);

  const [particles, setParticles] = useState([]);
  
  const createParticles = (x, y, color) => {
    const particleCount = 8;
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        dx: Math.cos(angle) * 2,
        dy: Math.sin(angle) * 2,
        size: 4,
        color,
        life: 1,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  const updateParticles = (ctx) => {
    setParticles(prev => 
      prev.filter(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life -= 0.02;
        
        if (particle.life > 0) {
          ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
          ctx.fill();
          return true;
        }
        return false;
      })
    );
  };
  
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

  const t = (key) => {
    const translations = {
      "Brick Breaker": { he: "שובר הלבנים", en: "Brick Breaker" },
      "Leaderboard": { he: "לוח שיאים", en: "Leaderboard" },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Start Game": { he: "התחל משחק", en: "Start Game" },
      "Current record:": { he: "שיא נוכחי:", en: "Current record:" },
      "Ball lost!": { he: "הכדור נפל!", en: "Ball lost!" },
      "Balls left:": { he: "נשארו כדורים:", en: "Balls left:" },
      "Tap to continue": { he: "לחץ על המסך להמשיך", en: "Tap to continue" },
      "Level completed!": { he: "השלב הושלם!", en: "Level completed!" },
      "Moving to level": { he: "עוברים לשלב", en: "Moving to level" },
      "Continue to next level": { he: "המשך לשלב הבא", en: "Continue to next level" },
      "Game Over": { he: "המשחק נגמר", en: "Game Over" },
      "Score:": { he: "ניקוד:", en: "Score:" },
      "Level:": { he: "שלב:", en: "Level:" },
      "New Game": { he: "משחק חדש", en: "New Game" },
      "Return to Home": { he: "חזור למסך הבית", en: "Return to Home" },
      "score:": { he: "ניקוד:", en: "score:" },
      "balls:": { he: "כדורים:", en: "balls:" },
      "level": { he: "שלב", en: "level" },
      "Press \"Start Game\" to begin": { he: 'לחץ על "התחל משחק" כדי להתחיל', en: 'Press "Start Game" to begin' },
      "Brick Breaker Game": { he: "משחק שובר הלבנים", en: "Brick Breaker Game" }
    };
    
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };

  useEffect(() => {
    if (!currentPlayer) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressedRef.current = true;
      } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressedRef.current = true;
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressedRef.current = false;
      } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressedRef.current = false;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    handleResize();
    drawWelcomeScreen();
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestAnimationRef.current);
    };
  }, [currentPlayer]);

  useEffect(() => {
    if (level > 1) {
      const newSpeed = Math.min(
        ballRef.current.baseSpeed + (level - 1) * 0.5,
        ballRef.current.maxSpeed
      );
      
      const currentAngle = Math.atan2(ballRef.current.dy, ballRef.current.dx);
      ballRef.current.dx = Math.cos(currentAngle) * newSpeed;
      ballRef.current.dy = Math.sin(currentAngle) * newSpeed;
    }
  }, [level]);
  
  useEffect(() => {
    if (!gameStarted || isPaused) return;
    
    const updateInterval = setInterval(() => {
      setScore(scoreRef.current);
      setLives(livesRef.current);
      setLevel(levelRef.current);
    }, 100);
    
    return () => clearInterval(updateInterval);
  }, [gameStarted, isPaused]);
  
  const handleResize = () => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = Math.min(window.innerHeight * 0.6, containerWidth * 0.6);
    
    canvasRef.current.width = containerWidth;
    canvasRef.current.height = containerHeight;
    
    resetGame(false);
  };
  
  const handleMouseMove = (e) => {
    if (!gameStarted || isPaused || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    
    if (relativeX > 0 && relativeX < canvas.width) {
      paddleRef.current.x = relativeX - paddleRef.current.width / 2;
      
      if (paddleRef.current.x < 0) {
        paddleRef.current.x = 0;
      } else if (paddleRef.current.x + paddleRef.current.width > canvas.width) {
        paddleRef.current.x = canvas.width - paddleRef.current.width;
      }
    }
  };
  
  const createBricks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const isMobile = window.innerWidth < 768;
    const level = levelRef.current;
    
    let columnCount = isMobile ? Math.floor(canvas.width / 45) : Math.floor(canvas.width / 80);
    let brickWidth = (canvas.width - (columnCount + 1) * (isMobile ? 4 : 10)) / columnCount;
    let brickHeight = isMobile ? 20 : 25;
    let topOffset = isMobile ? 30 : 50;
    let rowCount = 3;
    let bricks = [];
    
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF',
      '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
    ];
    
    switch(level) {
      case 1:
        rowCount = isMobile ? 4 : 3;
        break;
      case 2:
        rowCount = isMobile ? 5 : 4;
        break;
      case 3:
        rowCount = isMobile ? 6 : 5;
        columnCount = isMobile ? Math.floor(canvas.width / 40) : Math.floor(canvas.width / 70);
        brickWidth = (canvas.width - (columnCount + 1) * (isMobile ? 3 : 8)) / columnCount;
        break;
      case 4:
        rowCount = isMobile ? 7 : 6;
        columnCount = isMobile ? Math.floor(canvas.width / 35) : Math.floor(canvas.width / 65);
        brickWidth = (canvas.width - (columnCount + 1) * (isMobile ? 3 : 8)) / columnCount;
        break;
      case 5:
        rowCount = isMobile ? 8 : 7;
        columnCount = isMobile ? Math.floor(canvas.width / 30) : Math.floor(canvas.width / 60);
        brickWidth = (canvas.width - (columnCount + 1) * (isMobile ? 2 : 6)) / columnCount;
        brickHeight = isMobile ? 15 : 20;
        topOffset = isMobile ? 25 : 40;
        break;
      default:
        rowCount = isMobile ? (8 + Math.min(4, Math.floor((level - 5) / 2))) : (7 + Math.min(3, Math.floor((level - 5) / 2)));
        columnCount = isMobile ? Math.floor(canvas.width / 28) : Math.floor(canvas.width / 55);
        brickWidth = (canvas.width - (columnCount + 1) * (isMobile ? 2 : 5)) / columnCount;
        brickHeight = isMobile ? 15 : 18;
        topOffset = isMobile ? 20 : 35;
        break;
    }
    
    for (let c = 0; c < columnCount; c++) {
      for (let r = 0; r < rowCount; r++) {
        let colorIndex = level <= 5 ? r % colors.length : (r + c) % colors.length;
        
        const color = colors[(colorIndex + Math.floor(Math.random() * 2)) % colors.length];
        
        bricks.push({
          x: c * (brickWidth + (isMobile ? 4 : 10)) + (isMobile ? 4 : 10),
          y: r * (brickHeight + (isMobile ? 4 : 10)) + topOffset,
          width: brickWidth,
          height: brickHeight,
          color: color,
          active: true
        });
      }
    }
    
    if (level >= 3) {
      bricks = bricks.filter(() => Math.random() > (isMobile ? 0.05 : 0.1));
    }
    
    bricksRef.current = bricks;
  };
  
  const resetBall = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ballRef.current.x = canvas.width / 2;
    ballRef.current.y = canvas.height - paddleRef.current.height - ballRef.current.radius - 10;
    
    const currentSpeed = Math.min(
      ballRef.current.baseSpeed + (levelRef.current - 1) * 0.5,
      ballRef.current.maxSpeed
    );
    
    const randomDirection = Math.random() > 0.5 ? 1 : -1;
    ballRef.current.dx = (currentSpeed * 0.7) * randomDirection;
    ballRef.current.dy = -currentSpeed;
    
    paddleRef.current.x = (canvas.width - paddleRef.current.width) / 2;
  };
  
  const resetGame = (restartLevel = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (restartLevel) {
      scoreRef.current = 0;
      livesRef.current = 3;
      levelRef.current = 1;
      setScore(0);
      setLives(3);
      setLevel(1);
    }
    
    paddleRef.current = {
      width: Math.max(80, Math.min(canvas.width * 0.15, 120)),
      height: 15,
      x: (canvas.width - Math.max(80, Math.min(canvas.width * 0.15, 120))) / 2,
      y: canvas.height - 30,
      speed: 8
    };
    
    resetBall();
    createBricks();
    
    setGameOver(false);
    setGameWon(false);
    
    if (gameStarted) {
      draw();
    } else {
      drawWelcomeScreen();
    }
  };
  
  const drawWelcomeScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText(t('Brick Breaker Game'), canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '18px Arial';
    ctx.fillText(t('Press "Start Game" to begin'), canvas.width / 2, canvas.height / 2 + 20);
  };

  const checkBrickCollision = () => {
    const bricks = bricksRef.current;
    const ball = ballRef.current;
    let collided = false;
    
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i];
      if (!brick.active) continue;
      
      if (ball.x + ball.radius > brick.x && 
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height) {
        
        createParticles(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
          brick.color
        );
        
        const hitPos = (ball.x - (brick.x + brick.width / 2)) / (brick.width / 2);
        
        if (Math.abs(ball.y - brick.y) <= ball.radius || 
            Math.abs(ball.y - (brick.y + brick.height)) <= ball.radius) {
          ball.dy = -ball.dy;
          ball.dx += hitPos * 0.5;
        } else {
          ball.dx = -ball.dx;
        }
        
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed > ball.maxSpeed) {
          const scale = ball.maxSpeed / currentSpeed;
          ball.dx *= scale;
          ball.dy *= scale;
        }
        
        brick.active = false;
        scoreRef.current += 10;
        collided = true;
        
        const anActiveBrick = bricks.some(b => b.active);
        if (!anActiveBrick) {
          handleWin();
          return true;
        }
        
        break;
      }
    }
    
    return collided;
  };

  // מצב נוכחי של המשחק - מקור אמת אחד
  const gameStateRef = useRef({
    isPlaying: false,
    isPaused: false,
    isDeathScreen: false,
    isLevelTransition: false,
    isGameOver: false
  });

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!state.isPlaying) {
      drawWelcomeScreen(ctx);
      return;
    }

    if (state.isDeathScreen) {
      drawDeathScreen(ctx);
      return;
    }

    if (state.isLevelTransition) {
      drawLevelTransition(ctx);
      return;
    }

    if (state.isGameOver) {
      drawGameOver(ctx);
      return;
    }

    if (state.isPaused) {
      drawPausedScreen(ctx);
      return;
    }

    // Draw regular game state
    drawGameElements(ctx);
    
    if (!state.isPaused && state.isPlaying) {
      updateGameState();
    }

    requestAnimationRef.current = requestAnimationFrame(draw);
  };

  const drawGameElements = (ctx) => {
    const canvas = canvasRef.current;

    // Draw bricks
    bricksRef.current.forEach(brick => {
      if (brick.active) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 3);
      }
    });

    // Draw paddle
    const paddle = paddleRef.current;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height / 3);

    // Draw ball
    const ball = ballRef.current;
    const gradient = ctx.createRadialGradient(
      ball.x, ball.y, 0,
      ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#ccc');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw score and stats
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'right';
    ctx.fillText(`${t('score:')} ${scoreRef.current}`, canvas.width - 20, 30);
    ctx.textAlign = 'left';
    ctx.fillText(`${t('balls:')} ${livesRef.current}`, 20, 30);
    ctx.textAlign = 'center';
    ctx.fillText(`${t('level')} ${levelRef.current}`, canvas.width / 2, 30);

    updateParticles(ctx);
  };

  const drawDeathScreen = (ctx) => {
    const canvas = canvasRef.current;
    
    // Draw dimmed game state first
    drawGameElements(ctx);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FF5252';
    ctx.textAlign = 'center';
    ctx.fillText(t('Ball lost!'), canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${t('Balls left:')} ${livesRef.current}`, canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#AAA';
    ctx.fillText(t('Tap to continue'), canvas.width / 2, canvas.height / 2 + 50);
  };

  const drawLevelTransition = (ctx) => {
    const canvas = canvasRef.current;
    
    // Draw dimmed game state first
    drawGameElements(ctx);
    
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#4CAF50';
    ctx.textAlign = 'center';
    ctx.fillText(t('Level completed!'), canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${t('Moving to level')} ${nextLevel}`, canvas.width / 2, canvas.height / 2 + 10);
  };

  const drawPausedScreen = (ctx) => {
    const canvas = canvasRef.current;

    // Draw dimmed game state first
    drawGameElements(ctx);

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText('Tap to continue', canvas.width / 2, canvas.height / 2 + 20);
  };

  const drawGameOver = (ctx) => {
      const canvas = canvasRef.current;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#FF5252';
      ctx.textAlign = 'center';
      ctx.fillText(t('Game Over'), canvas.width / 2, canvas.height / 2 - 40);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFF';
      ctx.fillText(`${t('Score:')} ${scoreRef.current}`, canvas.width / 2, canvas.height / 2 + 10);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#AAA';
      ctx.fillText("Press 'New Game' to restart", canvas.width / 2, canvas.height / 2 + 50);
  };
  
  const updateGameState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ball = ballRef.current;
    const paddle = paddleRef.current;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }
    
    if (ball.y + ball.radius > canvas.height) {
      loseLife();
      return;
    }
    
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width &&
        ball.y < paddle.y + paddle.height) {
      
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      
      const baseAngle = hitPos * Math.PI / 3;
      
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = Math.sin(baseAngle) * speed;
      ball.dy = -Math.cos(baseAngle) * speed;
      
      if (rightPressedRef.current) {
        ball.dx += 0.5;
      } else if (leftPressedRef.current) {
        ball.dx -= 0.5;
      }
      
      if (Math.abs(ball.dy) < 2) {
        ball.dy = ball.dy > 0 ? 2 : -2;
      }
    }
    
    checkBrickCollision();
    
    if (rightPressedRef.current && paddle.x < canvas.width - paddle.width) {
      paddle.x += paddle.speed;
    } else if (leftPressedRef.current && paddle.x > 0) {
      paddle.x -= paddle.speed;
    }
  };

  const startGame = () => {
    // Reset game state
    gameStateRef.current = {
      isPlaying: true,
      isPaused: false,
      isDeathScreen: false,
      isLevelTransition: false,
      isGameOver: false
    };

    setGameStarted(true);
    setGameOver(false);
    setIsPaused(false);
    setShowDialog(false);
    setShowDeathScreen(false);
    setShowLevelTransition(false);
    
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    setScore(0);
    setLives(3);
    setLevel(1);
    
    resetBall();
    createBricks();
    
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
    }
    
    requestAnimationRef.current = requestAnimationFrame(draw);
  };

  const togglePause = () => {
    if (!gameStateRef.current.isPlaying || gameStateRef.current.isGameOver) return;
    
    gameStateRef.current.isPaused = !gameStateRef.current.isPaused;
    setIsPaused(gameStateRef.current.isPaused);
    
    if (!gameStateRef.current.isPaused) {
      requestAnimationRef.current = requestAnimationFrame(draw);
    }
  };

  const loseLife = () => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    
    if (livesRef.current <= 0) {
      handleGameOver();
    } else {
      gameStateRef.current.isDeathScreen = true;
      setShowDeathScreen(true);
    }
  };

  const handleContinue = () => {
    if (!gameStateRef.current.isDeathScreen) return;
    
    gameStateRef.current.isDeathScreen = false;
    setShowDeathScreen(false);
    resetBall();
    
    requestAnimationRef.current = requestAnimationFrame(draw);
  };

  const handleGameOver = async () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }

    gameStateRef.current.isGameOver = true;
    setGameOver(true);
    setShowDialog(true);
    setGameStarted(false);

    if (currentPlayer && !isUpdatingStats.current) {
      isUpdatingStats.current = true;
      try {
        const stats = currentPlayer.stats?.brickBreaker || {
          gamesPlayed: 0,
          highScore: 0,
          levelsCompleted: 0
        };
        
        await GamePlayer.update(currentPlayer.id, {
          stats: {
            ...currentPlayer.stats,
            brickBreaker: {
              gamesPlayed: stats.gamesPlayed + 1,
              highScore: Math.max(stats.highScore, scoreRef.current),
              levelsCompleted: stats.levelsCompleted + levelRef.current - 1,
              lastPlayed: new Date().toISOString()
            }
          }
        });
      } catch (error) {
        console.error('Error saving score:', error);
      } finally {
        isUpdatingStats.current = false;
      }
    }
  };
  
  const handleWin = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }

    livesRef.current = 3;
    setLives(3);
    
    const newLevel = levelRef.current + 1;
    setNextLevel(newLevel);
    levelRef.current = newLevel;
    setLevel(newLevel);
    
    gameStateRef.current.isLevelTransition = true;
    setShowLevelTransition(true);
    
    triggerConfetti();
    
    if (currentPlayer && !isUpdatingStats.current) {
      isUpdatingStats.current = true;
      try {
        const stats = currentPlayer.stats?.brickBreaker || {
          gamesPlayed: 0,
          highScore: 0,
          levelsCompleted: 0
        };
        
        GamePlayer.update(currentPlayer.id, {
          stats: {
            ...currentPlayer.stats,
            brickBreaker: {
              ...stats,
              highScore: Math.max(stats.highScore, scoreRef.current),
              levelsCompleted: stats.levelsCompleted + 1,
              lastPlayed: new Date().toISOString()
            }
          }
        }).catch(err => console.error('Error updating stats on win:', err));
      } finally {
        isUpdatingStats.current = false;
      }
    }
  };
  
  const startNextLevel = () => {
    gameStateRef.current.isLevelTransition = false;
    setShowLevelTransition(false);
    
    resetBall();
    createBricks();
    
    setTimeout(() => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
      requestAnimationRef.current = requestAnimationFrame(draw);
    }, 100);
  };
  
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e) => {
      if (!gameStarted || isPaused || gameOver) return;
      
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const relativeX = touch.clientX - rect.left;
      
      if (relativeX > 0 && relativeX < canvas.width) {
        paddleRef.current.x = relativeX - paddleRef.current.width / 2;
        
        if (paddleRef.current.x < 0) {
          paddleRef.current.x = 0;
        } else if (paddleRef.current.x + paddleRef.current.width > canvas.width) {
          paddleRef.current.x = canvas.width - paddleRef.current.width;
        }
      }
    };

    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => canvas.removeEventListener('touchmove', handleTouchMove);
  }, [gameStarted, isPaused, gameOver]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const isMobile = window.innerWidth < 768;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      
      if (isMobile) {
        const containerHeight = Math.min(window.innerHeight * 0.7, containerWidth * 1.6);
        canvasRef.current.width = containerWidth;
        canvasRef.current.height = containerHeight;
        
        paddleRef.current = {
          ...paddleRef.current,
          width: Math.max(70, Math.min(containerWidth * 0.2, 100)),
          y: containerHeight - 25
        };
        
        ballRef.current = {
          ...ballRef.current,
          radius: 7
        };
      } else {
        const containerHeight = Math.min(window.innerHeight * 0.6, containerWidth * 0.6);
        canvasRef.current.width = containerWidth;
        canvasRef.current.height = containerHeight;
        
        paddleRef.current = {
          ...paddleRef.current,
          width: Math.max(80, Math.min(containerWidth * 0.15, 120)),
          y: containerHeight - 30
        };
        
        ballRef.current = {
          ...ballRef.current,
          radius: 8
        };
      }
      
      resetBall();
      
      if (!gameStarted) {
        drawWelcomeScreen();
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [gameStarted]);
  
  if (!currentPlayer) {
    return <PlayerSelection onPlayerSelect={setCurrentPlayer} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-indigo-100 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-indigo-900">{t('Brick Breaker')}</h1>
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

        <Card className="bg-white/90 backdrop-blur shadow-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">{currentPlayer.name}</p>
              <p className="text-sm text-gray-600">
                {t('Current record:')} {currentPlayer.stats?.brickBreaker?.highScore || 0}
              </p>
            </div>
            
            <div className="flex gap-2">
              {!gameStarted ? (
                <Button 
                  onClick={startGame}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600"
                >
                  <Play className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('Start Game')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={togglePause}
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => resetGame(true)}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        <div 
          ref={containerRef} 
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-4 border-2 border-gray-700 relative h-[70vh] sm:h-auto"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none"
            onMouseMove={handleMouseMove}
            onClick={showDeathScreen ? handleContinue : undefined}
          />
          
          {showDeathScreen && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center"
              onClick={handleContinue}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-8 rounded-lg bg-black/50 backdrop-blur"
              >
                <h3 className="text-3xl font-bold text-red-500 mb-4">
                  {t('Ball lost!')}
                </h3>
                <p className="text-xl text-white mb-2">
                  {t('Balls left:')} {livesRef.current}
                </p>
                <p className="text-gray-300 text-sm mt-4">
                  {t('Tap to continue')}
                </p>
              </motion.div>
            </div>
          )}
          
          {showLevelTransition && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-8 rounded-lg bg-black/60 backdrop-blur"
              >
                <h3 className="text-3xl font-bold text-green-400 mb-4">
                  {t('Level completed!')}
                </h3>
                <p className="text-xl text-white mb-6">
                  {t('Moving to level')} {nextLevel}
                </p>
                <Button
                  onClick={startNextLevel}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  {t('Continue to next level')}
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent className="text-center" dir={language === 'en' ? 'ltr' : 'rtl'}>
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4 text-indigo-700">
                {t('Game Over')}
              </h3>
              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="font-medium text-lg">{t('Score:')} {scoreRef.current}</p>
                  <p className="text-sm">{t('Level:')} {levelRef.current}</p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => {
                      setShowDialog(false);
                      startGame();
                    }}
                  >
                    {t('New Game')}
                  </Button>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="outline">
                      {t('Return to Home')}
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
