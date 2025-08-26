import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { Profile } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Trophy, Home, Timer, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import PlayerSelection from '../components/multiplication/PlayerSelection';
import confetti from 'canvas-confetti';

export default function Multiplication() {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState('practice'); // practice, challenge
  const [difficultyLevel, setDifficultyLevel] = useState('easy'); // easy, medium, hard
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCorrect, setIsCorrect] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [results, setResults] = useState({
    correctAnswers: 0,
    wrongAnswers: 0,
    score: 0,
    time: 0
  });
  const [language, setLanguage] = useState('he'); // Default to Hebrew

  useEffect(() => {
    // Load user language
    const loadUserLanguage = async () => {
      try {
        const user = await User.me();
        if (user && user.language) {
          setLanguage(user.language);
          console.log("User language set to:", user.language);
        }
      } catch (error) {
        console.error("Error loading user language:", error);
      }
    };
    
    loadUserLanguage();
  }, []);

  const t = (key) => {
    const translations = {
      "Multiplication": { he: "לוח הכפל", en: "Multiplication" },
      "Hello": { he: "שלום", en: "Hello" },
      "Select game mode and difficulty": { he: "בחר מצב משחק ורמת קושי", en: "Select game mode and difficulty" },
      "Game mode:": { he: "מצב משחק:", en: "Game mode:" },
      "Practice (10 questions)": { he: "אימון (10 שאלות)", en: "Practice (10 questions)" },
      "Time Challenge (60 seconds)": { he: "אתגר זמן (60 שניות)", en: "Time Challenge (60 seconds)" },
      "Difficulty:": { he: "רמת קושי:", en: "Difficulty:" },
      "Easy": { he: "קל", en: "Easy" },
      "Medium": { he: "בינוני", en: "Medium" },
      "Hard": { he: "קשה", en: "Hard" },
      "Start Game": { he: "התחל משחק", en: "Start Game" },
      "Player:": { he: "שחקן:", en: "Player:" },
      "Score:": { he: "ניקוד:", en: "Score:" },
      "Question": { he: "שאלה", en: "Question" },
      "out of": { he: "מתוך", en: "out of" },
      "Correct:": { he: "נכונות:", en: "Correct:" },
      "Time left:": { he: "זמן נותר:", en: "Time left:" },
      "seconds": { he: "שניות", en: "seconds" },
      "Enter your answer": { he: "הכנס את התשובה שלך", en: "Enter your answer" },
      "Correct answer!": { he: "תשובה נכונה!", en: "Correct answer!" },
      "The correct answer is": { he: "התשובה הנכונה היא", en: "The correct answer is" },
      "Check Answer": { he: "בדוק תשובה", en: "Check Answer" },
      "End Game": { he: "סיים משחק", en: "End Game" },
      "Game Over!": { he: "המשחק הסתיים!", en: "Game Over!" },
      "Score": { he: "ניקוד", en: "Score" },
      "Correct answers:": { he: "תשובות נכונות:", en: "Correct answers:" },
      "Wrong answers:": { he: "תשובות שגויות:", en: "Wrong answers:" },
      "Time:": { he: "זמן:", en: "Time:" },
      "Finish Game": { he: "סיים משחק", en: "Finish Game" },
      "New Game": { he: "משחק חדש", en: "New Game" },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Leaderboard": { he: "לוח שיאים", en: "Leaderboard" },
      "Are you sure you want to end the game?": { he: "האם אתה בטוח שברצונך לסיים את המשחק?", en: "Are you sure you want to end the game?" }
    };

    console.log("Translating key:", key, "Language:", language);
    return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
  };
  
  useEffect(() => {
    let timer;
    if (gameStarted && gameMode === 'challenge' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameMode, timeLeft]);

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

  const generateQuestions = () => {
    const newQuestions = [];
    const questionCount = gameMode === 'practice' ? 10 : 20;
    
    let range = { min: 1, max: 10 };
    
    if (difficultyLevel === 'medium') {
      range = { min: 2, max: 12 };
    } else if (difficultyLevel === 'hard') {
      range = { min: 2, max: 15 };
    }
    
    for (let i = 0; i < questionCount; i++) {
      const a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      const b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      
      newQuestions.push({
        a,
        b,
        answer: a * b,
        userAnswer: null,
        correct: null
      });
    }
    
    setQuestions(newQuestions);
  };

  const startGame = (mode, level) => {
    setGameMode(mode);
    setDifficultyLevel(level);
    setScore(0);
    setTimeLeft(60);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setIsCorrect(null);
    setGameOver(false);
    generateQuestions();
    setGameStarted(true);
  };

  const checkAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answer = parseInt(userAnswer, 10);
    
    if (isNaN(answer)) return;
    
    const correct = answer === currentQuestion.answer;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      correct
    };
    
    setQuestions(updatedQuestions);
    
    if (correct) {
      setScore(prevScore => {
        const difficultyMultiplier = difficultyLevel === 'easy' ? 1 : difficultyLevel === 'medium' ? 2 : 3;
        return prevScore + (10 * difficultyMultiplier);
      });
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
    
    setTimeout(() => {
      setIsCorrect(null);
      setUserAnswer('');
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        finishGame();
      }
    }, 1000);
  };

  const finishGame = async () => {
    setGameOver(true);
    
    const correctAnswers = questions.filter(q => q.correct).length;
    const wrongAnswers = questions.filter(q => q.userAnswer !== null && !q.correct).length;
    
    setResults({
      correctAnswers,
      wrongAnswers,
      score,
      time: 60 - timeLeft
    });
    
    triggerConfetti();
    
    if (currentPlayer) {
      try {
        const stats = currentPlayer.stats?.multiplication || {
          gamesPlayed: 0,
          highScore: 0,
          correctAnswers: 0,
          bestTime: null,
          lastPlayed: null
        };
        
        await GamePlayer.update(currentPlayer.id, {
          stats: {
            ...currentPlayer.stats,
            multiplication: {
              gamesPlayed: stats.gamesPlayed + 1,
              highScore: Math.max(stats.highScore || 0, score),
              correctAnswers: (stats.correctAnswers || 0) + correctAnswers,
              bestTime: gameMode === 'practice' && correctAnswers === questions.length 
                ? (!stats.bestTime || (60 - timeLeft) < stats.bestTime) ? (60 - timeLeft) : stats.bestTime 
                : stats.bestTime,
              lastPlayed: new Date().toISOString()
            }
          }
        });
        
        const user = await User.me();
        const userProfile = await Profile.filter({ email: user.email });
        if (userProfile?.length > 0) {
          await Profile.update(userProfile[0].id, {
            lastGames: {
              ...userProfile[0].lastGames,
              multiplication: {
                playerId: currentPlayer.id,
                mode: gameMode,
                level: difficultyLevel
              }
            }
          });
        }
        
      } catch (err) {
        console.error("Error updating player stats:", err);
      }
    }
    
    setResultDialogOpen(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setResultDialogOpen(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setQuestions([]);
  };

  const handlePlayerSelect = (player) => {
    setCurrentPlayer(player);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userAnswer && !isCorrect) {
      checkAnswer();
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Multiplication')}</h1>
            <div className="flex gap-2">
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  {t('Back to Home')}
                </Button>
              </Link>
            </div>
          </div>
          
          <PlayerSelection onPlayerSelect={handlePlayerSelect} gameType="multiplication" />
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Multiplication')}</h1>
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
          
          <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
            <CardContent className="space-y-6">
              <div className="text-center my-6">
                <h2 className="text-2xl font-bold">{t('Hello')} {currentPlayer.name}</h2>
                <p className="text-gray-600">{t('Select game mode and difficulty')}</p>
              </div>
              
              <div className="grid gap-4">
                <h3 className="text-lg font-medium text-green-700">{t('Game mode:')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={gameMode === 'practice' ? "default" : "outline"}
                    className={gameMode === 'practice' ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setGameMode('practice')}
                  >
                    {t('Practice (10 questions)')}
                  </Button>
                  <Button 
                    variant={gameMode === 'challenge' ? "default" : "outline"}
                    className={gameMode === 'challenge' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    onClick={() => setGameMode('challenge')}
                  >
                    {t('Time Challenge (60 seconds)')}
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                <h3 className="text-lg font-medium text-green-700">{t('Difficulty:')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant={difficultyLevel === 'easy' ? "default" : "outline"}
                    className={difficultyLevel === 'easy' ? "bg-green-500 hover:bg-green-600" : ""}
                    onClick={() => setDifficultyLevel('easy')}
                  >
                    {t('Easy')}
                  </Button>
                  <Button 
                    variant={difficultyLevel === 'medium' ? "default" : "outline"}
                    className={difficultyLevel === 'medium' ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    onClick={() => setDifficultyLevel('medium')}
                  >
                    {t('Medium')}
                  </Button>
                  <Button 
                    variant={difficultyLevel === 'hard' ? "default" : "outline"}
                    className={difficultyLevel === 'hard' ? "bg-red-500 hover:bg-red-600" : ""}
                    onClick={() => setDifficultyLevel('hard')}
                  >
                    {t('Hard')}
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6 mt-6"
                onClick={() => startGame(gameMode, difficultyLevel)}
              >
                {t('Start Game')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Multiplication')}</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                if (confirm(t('Are you sure you want to end the game?'))) {
                  resetGame();
                }
              }}
            >
              <RotateCcw className="w-5 h-5" />
              {t('End Game')}
            </Button>
          </div>
        </div>
        
        <Card className="p-6 bg-white/80 backdrop-blur shadow-lg">
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-medium">
                {t('Player:')} {currentPlayer.name}
              </div>
              <div className="text-lg font-medium text-green-700">
                {t('Score:')} {score}
              </div>
            </div>
            
            <div className="mb-6">
              {gameMode === 'practice' ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('Question')} {currentQuestionIndex + 1} {t('out of')} {questions.length}</span>
                  <span className="text-sm">
                    {t('Correct:')} {questions.filter(q => q.correct).length}/
                    {questions.filter(q => q.userAnswer !== null).length}
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{t('Time left:')}</span>
                    <span className="text-sm">{timeLeft} {t('seconds')}</span>
                  </div>
                  <Progress value={(timeLeft / 60) * 100} className="h-2" />
                </div>
              )}
            </div>
            
            <div className="my-8 text-center">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-4xl font-bold p-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl shadow-inner"
                dir="ltr"
              >
                {currentQuestion?.a} × {currentQuestion?.b} = ?
              </motion.div>
            </div>
            
            <div className="my-6">
              <div className="text-center my-6">
                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('Enter your answer')}
                  className="text-xl text-center py-6 border-2 border-green-200 focus:border-green-500"
                  dir="ltr"
                  disabled={isCorrect !== null}
                />
              </div>
            </div>
            
            {isCorrect === true && (
              <div className="my-4 flex items-center justify-center gap-2 p-2 bg-green-100 rounded-lg text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('Correct answer!')}</span>
              </div>
            )}
            
            {isCorrect === false && (
              <div className="my-4 flex items-center justify-center gap-2 p-2 bg-red-100 rounded-lg text-red-700">
                <XCircle className="w-5 h-5" />
                <span>{t('The correct answer is')} {currentQuestion.answer}</span>
              </div>
            )}
            
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer || isCorrect !== null}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6 mt-6"
            >
              {t('Check Answer')}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <AlertDialogContent className="text-center" dir={language === 'en' ? 'ltr' : 'rtl'}>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4 text-green-700">
              {t('Game Over!')} 🎉
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                <div className={language === 'en' ? "text-left" : "text-right"}>
                  <p className="text-gray-600">{t('Score:')}</p>
                  <p className="text-gray-600">{t('Correct answers:')}</p>
                  <p className="text-gray-600">{t('Wrong answers:')}</p>
                  {gameMode === 'practice' && <p className="text-gray-600">{t('Time:')}</p>}
                </div>
                <div className={language === 'en' ? "text-right" : "text-left"}>
                  <p className="text-green-700">{results.score}</p>
                  <p className="text-green-700">{results.correctAnswers}</p>
                  <p className="text-red-700">{results.wrongAnswers}</p>
                  {gameMode === 'practice' && <p className="text-green-700">{results.time} {t('seconds')}</p>}
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button onClick={() => {
                  setResultDialogOpen(false);
                  resetGame();
                }}>
                  {t('Finish Game')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setResultDialogOpen(false);
                  startGame(gameMode, difficultyLevel);
                }}>
                  {t('New Game')}
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}