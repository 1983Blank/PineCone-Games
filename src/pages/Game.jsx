
import React, { useState, useEffect } from 'react';
import { Game } from '@/api/entities';
import { Cards } from '@/api/entities';
import { Profile } from '@/api/entities';
import { User } from '@/api/entities';
import { GamePlayer } from '@/api/entities';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, PlusCircle } from "lucide-react";

export default function GamePage() {
  // Game state
  const [gamePhase, setGamePhase] = useState("setup"); // setup, playing, gameOver
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [category, setCategory] = useState("Animals");
  const [cardsCount, setCardsCount] = useState(12);  // default to 12 cards
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [gameTime, setGameTime] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [user, setUser] = useState(null);
  
  const AVATARS = [
    { id: 'bear', label: 'דובי', emoji: '🐻' },
    { id: 'rabbit', label: 'ארנב', emoji: '🐰' },
    { id: 'cat', label: 'חתול', emoji: '🐱' },
    { id: 'dog', label: 'כלב', emoji: '🐶' },
    { id: 'fox', label: 'שועל', emoji: '🦊' },
    { id: 'tiger', label: 'נמר', emoji: '🐯' },
    { id: 'monkey', label: 'קוף', emoji: '🐵' },
    { id: 'panda', label: 'פנדה', emoji: '🐼' }
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);

  // Enhanced translation function
  const t = (key) => {
    if (!user) return key;
    
    if (user.language === 'en') {
      const enTranslations = {
        "Memory Game": "Memory Game",
        "Loading game...": "Loading game...",
        "An error occurred:": "An error occurred:",
        "Try Again": "Try Again",
        "Back to Home": "Back to Home",
        "Select Players": "Select Players",
        "Add New Player": "Add New Player",
        "Player Name": "Player Name",
        "Add Player": "Add Player",
        "Start Game": "Start Game",
        "Game Setup": "Game Setup",
        "Configure the game settings before starting.": "Configure the game settings before starting.",
        "Number of Players (2-4)": "Number of Players (2-4)",
        "Category": "Category",
        "Number of Cards": "Number of Cards",
        "Selected:": "Selected:",
        "Current Turn:": "Current Turn:",
        "Score:": "Score:",
        "Moves:": "Moves:",
        "Time:": "Time:",
        "Game Over!": "Game Over!",
        "Winner:": "Winner:",
        "Play Again": "Play Again",
        "games": "games",
        "No players selected": "No players selected",
        "cards": "cards",
        // Category translations
        "Animals": "Animals",
        "Fruits": "Fruits",
        "Vehicles": "Vehicles",
        "Objects": "Objects",
        "Colors": "Colors",
        "Numbers": "Numbers",
        "Shapes": "Shapes",
        "Food": "Food",
        "Sports": "Sports",
        "Nature": "Nature",
        "Match found!": "Match found!",
        "Your turn again!": "Your turn again!",
        "Found:": "Found:",
        "Select category": "Select category",
        "Cards:": "Cards:"
      };
      return enTranslations[key] || key;
    }
    
    const heTranslations = {
      "Memory Game": "משחק הזיכרון",
      "Loading game...": "טוען את המשחק...",
      "An error occurred:": "אירעה שגיאה:",
      "Try Again": "נסה שוב",
      "Back to Home": "חזור למסך הבית",
      "Select Players": "בחירת שחקנים",
      "Add New Player": "הוסף שחקן חדש",
      "Player Name": "שם השחקן",
      "Add Player": "הוסף שחקן",
      "Start Game": "התחל משחק",
      "Game Setup": "הגדרות משחק",
      "Configure the game settings before starting.": "הגדר את הגדרות המשחק לפני שמתחילים",
      "Number of Players (2-4)": "מספר שחקנים (2-4)",
      "Category": "קטגוריה",
      "Number of Cards": "מספר קלפים",
      "Selected:": "נבחרו:",
      "Current Turn:": "תור נוכחי:",
      "Score:": "ניקוד:",
      "Moves:": "מהלכים:",
      "Time:": "זמן:",
      "Game Over!": "המשחק נגמר!",
      "Winner:": "מנצח:",
      "Play Again": "שחק שוב",
      "games": "משחקים",
      "No players selected": "לא נבחרו שחקנים",
      "cards": "קלפים",
      // Category translations - מתורגמים לעברית
      "Animals": "חיות",
      "Fruits": "פירות",
      "Vehicles": "כלי רכב",
      "Objects": "חפצים",
      "Colors": "צבעים",
      "Numbers": "מספרים",
      "Shapes": "צורות",
      "Food": "אוכל",
      "Sports": "ספורט",
      "Nature": "טבע",
      "Match found!": "זוג נמצא!",
      "Your turn again!": "תור נוסף!",
      "Found:": "נמצא:",
      "Select category": "בחר קטגוריה",
      "Cards:": "קלפים:"
    };
    return heTranslations[key] || key;
  };

  // Initialize
  useEffect(() => {
    loadUser();
    loadCategories();
  }, []);

  // Load user and set language
  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      loadPlayers(currentUser);
      loadProfile(currentUser);
    } catch (err) {
      console.error("Error loading user:", err);
      setLoading(false);
    }
  };

  // Load players
  const loadPlayers = async (currentUser) => {
    try {
      setLoadingPlayers(true);
      const loadedPlayers = await GamePlayer.filter({ 
        userEmail: currentUser.email,
        isActive: true
      });
      
      setPlayers(loadedPlayers.sort((a, b) => 
        (b.stats?.memory?.highScore || 0) - (a.stats?.memory?.highScore || 0)
      ));
      
      setLoadingPlayers(false);
    } catch (error) {
      console.error('Error loading players:', error);
      setLoadingPlayers(false);
    }
  };

  // Load player profile
  const loadProfile = async (currentUser) => {
    try {
      let profile = await Profile.filter({ email: currentUser.email });
      
      if (!profile || profile.length === 0) {
        await Profile.create({
          email: currentUser.email,
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
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setLoading(false);
    }
  };

  // Load card categories
  const loadCategories = async () => {
    try {
      const allCards = await Cards.list();
      // Get categories with cards and sort them
      const categoriesWithCards = [...new Set(allCards.map(card => card.category))];
      setCategories(categoriesWithCards);
      
      // If current category has no cards, reset to first available category
      if (!categoriesWithCards.includes(category)) {
        setCategory(categoriesWithCards[0] || 'animals');
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(['animals']);
    }
  };

  // Toggle player selection
  const togglePlayerSelection = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  // Create new player
  const createNewPlayer = async () => {
    if (!newPlayerName.trim()) return;
    
    try {
      const player = await GamePlayer.create({
        name: newPlayerName,
        userEmail: user.email,
        isActive: true,
        avatar: selectedAvatar,
        stats: {
          memory: {
            gamesPlayed: 0,
            gamesWon: 0,
            highScore: 0,
            perfectGames: 0,
            bestTime: null,
            lastPlayed: new Date().toISOString()
          }
        }
      });
      
      await loadPlayers(user);
      setSelectedPlayers([...selectedPlayers, player]);
      setNewPlayerName('');
      setSelectedAvatar(AVATARS[0].id);
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  // Handle game start
  const startGame = () => {
    if (selectedPlayers.length === 0) return;
    
    // Initialize game
    setGamePhase("playing");
    setStartTime(Date.now());
    setMoves(0);
    setCurrentPlayer(0);
    setFlippedCards([]);
    setMatchedCards([]);
    
    // Reset player scores
    const resetPlayers = selectedPlayers.map(player => ({
      ...player,
      score: 0,
      moves: 0
    }));
    setSelectedPlayers(resetPlayers);
    
    // Load cards
    loadCards();
  };

  // Handle game end and save stats
  const endGame = async () => {
    const gameTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    setGameTime(gameTimeInSeconds);
    setGamePhase("gameOver");
    
    try {
      const maxScore = Math.max(...selectedPlayers.map(p => p.score));
      const winners = selectedPlayers.filter(p => p.score === maxScore);

      // Update player stats
      for (const player of selectedPlayers) {
        if (!player || !player.id) continue;
        
        const gamePlayer = await GamePlayer.get(player.id);
        if (!gamePlayer) continue;

        const currentStats = gamePlayer.stats?.memory || {
          gamesPlayed: 0,
          gamesWon: 0,
          highScore: 0,
          perfectGames: 0,
          bestTime: null,
          lastPlayed: null
        };

        const updatedStats = {
          gamesPlayed: currentStats.gamesPlayed + 1,
          gamesWon: winners.some(w => w.id === player.id) ? currentStats.gamesWon + 1 : currentStats.gamesWon,
          highScore: Math.max(currentStats.highScore || 0, player.score),
          perfectGames: currentStats.perfectGames,
          bestTime: (!currentStats.bestTime || gameTimeInSeconds < currentStats.bestTime) ? gameTimeInSeconds : currentStats.bestTime,
          lastPlayed: new Date().toISOString()
        };

        await GamePlayer.update(player.id, {
          stats: {
            ...gamePlayer.stats,
            memory: updatedStats
          }
        });
      }

      // Save game record
      await Game.create({
        category: category,
        cards_count: cardsCount,
        players: selectedPlayers.map(player => ({
          id: player.id,
          name: player.name,
          score: player.score
        })),
        total_time: gameTimeInSeconds,
        total_moves: moves,
        winner: winners[0].name,
        final_score: maxScore
      });
    } catch (err) {
      console.error("Error saving game stats:", err);
    }
  };

  // Reset game
  const resetGame = () => {
    setGamePhase("setup");
    setSelectedPlayers([]);
    setCards([]);
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
  };

  // Handle card click
  const handleCardClick = (cardId) => {
    // Ignore clicks if already two cards are flipped or card is already matched
    if (flippedCards.length === 2) return;
    
    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard || matchedCards.includes(cardId) || flippedCards.includes(cardId)) return;
    
    // Add card to flipped cards
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // If two cards are flipped, check for match
    if (newFlippedCards.length === 2) {
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);
      
      setMoves(moves + 1);
      
      // Update current player's moves
      const updatedPlayers = [...selectedPlayers];
      updatedPlayers[currentPlayer].moves = (updatedPlayers[currentPlayer].moves || 0) + 1;
      setSelectedPlayers(updatedPlayers);
      
      // Check for match (only exact matches - same base ID)
      const isMatch = firstCard.id.split('-')[0] === secondCard.id.split('-')[0];
      
      if (isMatch) {
        // Match found
        const newMatchedCards = [...matchedCards, firstCardId, secondCardId];
        setMatchedCards(newMatchedCards);
        
        // Update current player's score
        updatedPlayers[currentPlayer].score = (updatedPlayers[currentPlayer].score || 0) + 1;
        setSelectedPlayers(updatedPlayers);
        
        // Show match notification
        const matchNotification = document.getElementById('match-notification');
        if (matchNotification) {
          matchNotification.classList.remove('opacity-0');
          matchNotification.classList.add('opacity-100');
          
          setTimeout(() => {
            matchNotification.classList.remove('opacity-100');
            matchNotification.classList.add('opacity-0');
          }, 1500);
        }
        
        // Reset flipped cards for next turn (keep same player's turn)
        setTimeout(() => {
          setFlippedCards([]);
          
          // Check if game is over
          if (newMatchedCards.length === cards.length) {
            endGame();
          }
        }, 1000);
      } else {
        // No match, move to next player
        setTimeout(() => {
          setFlippedCards([]);
          setCurrentPlayer((currentPlayer + 1) % selectedPlayers.length);
        }, 1000);
      }
    }
  };

  // Load cards for the game
  const loadCards = async () => {
    try {
      // Translate category for filtering
      let filterCategory = category.toLowerCase();
      if (user?.language === 'he') {
        // Convert Hebrew category name back to English for filtering
        const heToEnCategories = {
          'חיות': 'animals',
          'פירות': 'fruits',
          'כלי רכב': 'vehicles',
          'חפצים': 'objects',
          'צבעים': 'colors',
          'מספרים': 'numbers',
          'צורות': 'shapes',
          'אוכל': 'food',
          'ספורט': 'sports',
          'טבע': 'nature'
        };
        
        if (heToEnCategories[category]) {
          filterCategory = heToEnCategories[category];
        }
      }
      
      console.log("Filtering cards by category:", filterCategory);
      let allCards = await Cards.filter({ category: filterCategory });
      console.log("Found cards:", allCards);
      
      // Filter out cards with broken image URLs
      allCards = allCards.filter(card => {
        return card.imageUrl && 
               !card.imageUrl.includes('undefined') && 
               !card.imageUrl.includes('null') &&
               card.imageUrl.trim() !== '';
      });
      
      // Ensure every card has term_he property
      allCards = allCards.map(card => {
        if (!card.term_he) {
          return {
            ...card,
            term_he: card.term
          };
        }
        return card;
      });
      
      if (allCards.length < cardsCount / 2) {
        // Not enough cards in database, create some default ones
        console.log("Not enough valid cards in selected category, using defaults");
        let defaultCards = generateDefaultCards(filterCategory, cardsCount / 2);
        let cardPairs = [...defaultCards, ...defaultCards].map((card, index) => ({
          ...card,
          id: `${card.id}-${index}`,
          isFlipped: false,
          isMatched: false
        }));
        
        // Shuffle the deck
        cardPairs.sort(() => 0.5 - Math.random());
        setCards(cardPairs);
        return;
      }
      
      let gameCards = allCards.sort(() => 0.5 - Math.random()).slice(0, cardsCount / 2);
      
      // Create pairs
      let cardPairs = [...gameCards, ...gameCards].map((card, index) => ({
        ...card,
        id: `${card.id}-${index}`,
        isFlipped: false,
        isMatched: false
      }));
      
      // Shuffle the deck
      cardPairs.sort(() => 0.5 - Math.random());
      setCards(cardPairs);
    } catch (error) {
      console.error("Error loading cards:", error);
      // Fallback to default cards
      let defaultCards = generateDefaultCards(category, cardsCount / 2);
      let cardPairs = [...defaultCards, ...defaultCards].map((card, index) => ({
        ...card,
        id: `${card.id}-${index}`,
        isFlipped: false,
        isMatched: false
      }));
      
      // Shuffle the deck
      cardPairs.sort(() => 0.5 - Math.random());
      setCards(cardPairs);
    }
  };
  
  // Generate default cards if database is empty
  const generateDefaultCards = (category, count) => {
    let cards = [];
    const defaultCards = {
      'animals': [
        { id: 'animal1', term: 'Dog', description: 'A friendly domestic animal', imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop' },
        { id: 'animal2', term: 'Cat', description: 'A common house pet', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop' },
        { id: 'animal3', term: 'Elephant', description: 'The largest land mammal', imageUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=400&fit=crop' },
        { id: 'animal4', term: 'Lion', description: 'King of the jungle', imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop' },
        { id: 'animal5', term: 'Giraffe', description: 'Tallest living animal', imageUrl: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=400&h=400&fit=crop' },
        { id: 'animal6', term: 'Monkey', description: 'Clever primate', imageUrl: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&h=400&fit=crop' },
        { id: 'animal7', term: 'Penguin', description: 'Flightless bird from Antarctica', imageUrl: 'https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=400&h=400&fit=crop' },
        { id: 'animal8', term: 'Zebra', description: 'Animal with black and white stripes', imageUrl: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?w=400&h=400&fit=crop' },
        { id: 'animal9', term: 'Kangaroo', description: 'Australian jumping animal', imageUrl: 'https://images.unsplash.com/photo-1578263867420-9f3e4f31d97d?w=400&h=400&fit=crop' },
        { id: 'animal10', term: 'Panda', description: 'Black and white bear from China', imageUrl: 'https://images.unsplash.com/photo-1590251024359-a935c439c31e?w=400&h=400&fit=crop' },
        { id: 'animal11', term: 'Tiger', description: 'Large cat with stripes', imageUrl: 'https://images.unsplash.com/photo-1551972251-12070d63502a?w=400&h=400&fit=crop' },
        { id: 'animal12', term: 'Owl', description: 'Nocturnal bird of prey', imageUrl: 'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=400&h=400&fit=crop' }
      ],
      'fruits': [
        { id: 'fruit1', term: 'Apple', description: 'Common red or green fruit', imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop' },
        { id: 'fruit2', term: 'Banana', description: 'Yellow curved fruit', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop' },
        { id: 'fruit3', term: 'Orange', description: 'Citrus fruit with orange color', imageUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=400&fit=crop' },
        { id: 'fruit4', term: 'Strawberry', description: 'Red berry with seeds on outside', imageUrl: 'https://images.unsplash.com/photo-1543528176-61b239494933?w=400&h=400&fit=crop' },
        { id: 'fruit5', term: 'Watermelon', description: 'Large green fruit with red inside', imageUrl: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&h=400&fit=crop' },
        { id: 'fruit6', term: 'Grapes', description: 'Small round fruits in clusters', imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=400&fit=crop' },
        { id: 'fruit7', term: 'Pineapple', description: 'Tropical fruit with spiky exterior', imageUrl: 'https://images.unsplash.com/photo-1548805973-e8b0751bd0f4?w=400&h=400&fit=crop' },
        { id: 'fruit8', term: 'Cherry', description: 'Small red fruit with a stem', imageUrl: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&h=400&fit=crop' }
      ],
      'vehicles': [
        { id: 'vehicle1', term: 'Car', description: 'Four-wheeled passenger vehicle', imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=400&fit=crop' },
        { id: 'vehicle2', term: 'Bus', description: 'Large passenger vehicle', imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=400&fit=crop' },
        { id: 'vehicle3', term: 'Airplane', description: 'Flying vehicle with wings', imageUrl: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=400&h=400&fit=crop' },
        { id: 'vehicle4', term: 'Train', description: 'Rail transport vehicle', imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=400&fit=crop' },
        { id: 'vehicle5', term: 'Bicycle', description: 'Two-wheeled vehicle', imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=400&fit=crop' },
        { id: 'vehicle6', term: 'Helicopter', description: 'Aircraft with rotating blades', imageUrl: 'https://images.unsplash.com/photo-1513204342921-e8e534222288?w=400&h=400&fit=crop' }
      ],
      'objects': [
        { id: 'object1', term: 'Chair', description: 'Furniture for sitting', imageUrl: 'https://images.unsplash.com/photo-1518051870910-a46e30d9db16?w=400&h=400&fit=crop' },
        { id: 'object2', term: 'Table', description: 'Furniture with flat top surface', imageUrl: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?w=400&h=400&fit=crop' },
        { id: 'object3', term: 'Lamp', description: 'Device that provides light', imageUrl: 'https://images.unsplash.com/photo-1543198126-b97de9b2cb13?w=400&h=400&fit=crop' },
        { id: 'object4', term: 'Book', description: 'Printed pages bound together', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
        { id: 'object5', term: 'Clock', description: 'Device showing the time', imageUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=400&h=400&fit=crop' },
        { id: 'object6', term: 'Ball', description: 'Round object used in games', imageUrl: 'https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=400&h=400&fit=crop' }
      ],
      'colors': [
        { id: 'color1', term: 'Red', description: 'Color of blood and fire', imageUrl: 'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=400&h=400&fit=crop' },
        { id: 'color2', term: 'Blue', description: 'Color of the sky and sea', imageUrl: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400&h=400&fit=crop' },
        { id: 'color3', term: 'Green', description: 'Color of grass and leaves', imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=400&fit=crop' },
        { id: 'color4', term: 'Yellow', description: 'Color of the sun', imageUrl: 'https://images.unsplash.com/photo-1498940757830-82f7813bf178?w=400&h=400&fit=crop' },
        { id: 'color5', term: 'Purple', description: 'Mix of red and blue', imageUrl: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop' },
        { id: 'color6', term: 'Orange', description: 'Mix of red and yellow', imageUrl: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=400&h=400&fit=crop' }
      ],
      'numbers': [
        { id: 'number1', term: 'One', description: 'The number 1', imageUrl: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop' },
        { id: 'number2', term: 'Two', description: 'The number 2', imageUrl: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop' },
        { id: 'number3', term: 'Three', description: 'The number 3', imageUrl: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop' },
        { id: 'number4', term: 'Four', description: 'The number 4', imageUrl: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop' },
        { id: 'number5', term: 'Five', description: 'The number 5', imageUrl: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop' },
        { id: 'number6', term: 'Six', description: 'The number 6', imageUrl: 'https://images.unsplash.com/photo-1516383607781-913a19294fd1?w=400&h=400&fit=crop' }
      ],
      'shapes': [
        { id: 'shape1', term: 'Circle', description: 'Round shape', imageUrl: 'https://images.unsplash.com/photo-1591591414705-d08fa68b6849?w=400&h=400&fit=crop' },
        { id: 'shape2', term: 'Square', description: 'Four equal sides', imageUrl: 'https://images.unsplash.com/photo-1577374757327-719fc20742cf?w=400&h=400&fit=crop' },
        { id: 'shape3', term: 'Triangle', description: 'Three-sided shape', imageUrl: 'https://images.unsplash.com/photo-1586075319970-8df4e4b59633?w=400&h=400&fit=crop' },
        { id: 'shape4', term: 'Rectangle', description: 'Four-sided shape with opposite sides equal', imageUrl: 'https://images.unsplash.com/photo-1586075319970-8df4e4b59633?w=400&h=400&fit=crop' },
        { id: 'shape5', term: 'Star', description: 'Pointed shape', imageUrl: 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=400&h=400&fit=crop' },
        { id: 'shape6', term: 'Heart', description: 'Love symbol', imageUrl: 'https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?w=400&h=400&fit=crop' }
      ],
      'food': [
        { id: 'food1', term: 'Pizza', description: 'Italian dish with dough and toppings', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop' },
        { id: 'food2', term: 'Burger', description: 'Sandwich with patty and bun', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
        { id: 'food3', term: 'Ice Cream', description: 'Frozen dessert', imageUrl: 'https://images.unsplash.com/photo-1566454419290-57a0589c9b17?w=400&h=400&fit=crop' },
        { id: 'food4', term: 'Pasta', description: 'Italian noodle dish', imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=400&fit=crop' },
        { id: 'food5', term: 'Cake', description: 'Sweet baked dessert', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop' },
        { id: 'food6', term: 'Salad', description: 'Dish of mixed vegetables', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' }
      ],
      'sports': [
        { id: 'sport1', term: 'Soccer', description: 'Football worldwide', imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=400&fit=crop' },
        { id: 'sport2', term: 'Basketball', description: 'Game with hoops', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109acd27d?w=400&h=400&fit=crop' },
        { id: 'sport3', term: 'Tennis', description: 'Racquet sport', imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&h=400&fit=crop' },
        { id: 'sport4', term: 'Swimming', description: 'Water sport', imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=400&fit=crop' },
        { id: 'sport5', term: 'Baseball', description: 'Bat and ball game', imageUrl: 'https://images.unsplash.com/photo-1508344928928-7165b0c40ae6?w=400&h=400&fit=crop' },
        { id: 'sport6', term: 'Golf', description: 'Club and ball sport', imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=400&fit=crop' }
      ],
      'nature': [
        { id: 'nature1', term: 'Mountain', description: 'Large natural elevation', imageUrl: 'https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?w=400&h=400&fit=crop' },
        { id: 'nature2', term: 'Ocean', description: 'Large body of water', imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=400&fit=crop' },
        { id: 'nature3', term: 'Forest', description: 'Area with many trees', imageUrl: 'https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=400&h=400&fit=crop' },
        { id: 'nature4', term: 'Desert', description: 'Dry land with sand', imageUrl: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400&h=400&fit=crop' },
        { id: 'nature5', term: 'River', description: 'Flowing body of water', imageUrl: 'https://images.unsplash.com/photo-1558299340-4fc432d874be?w=400&h=400&fit=crop' },
        { id: 'nature6', term: 'Flower', description: 'Reproductive part of a plant', imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop' }
      ]
    };
    
    if (defaultCards[category]) {
      cards = defaultCards[category].slice(0, count);
    } else {
      // If category not found, use Animals as default
      cards = defaultCards['animals'].slice(0, count);
    }
    
    return cards;
  };
  
  // Game board
  const renderGameBoard = () => {
    // Calculate optimal columns based on screen size and card count
    const getColumnsClass = () => {
      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
      
      if (isMobile) {
        if (cardsCount <= 12) return "grid-cols-3";
        return "grid-cols-4";
      } else if (isTablet) {
        if (cardsCount <= 12) return "grid-cols-4";
        if (cardsCount <= 24) return "grid-cols-5";
        return "grid-cols-6";
      } else {
        if (cardsCount <= 12) return "grid-cols-4";
        if (cardsCount <= 24) return "grid-cols-6";
        return "grid-cols-8";
      }
    };
    
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="font-medium">{t('Current Turn:')} {selectedPlayers[currentPlayer]?.name}</p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span>{t('Score:')} {selectedPlayers[currentPlayer]?.score || 0}</span>
                <span>{t('Moves:')} {moves}</span>
                <span>{t('Time:')} {Math.floor((Date.now() - startTime) / 1000)}s</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => {
              if (window.confirm("Are you sure you want to quit the game?")) {
                resetGame();
              }
            }}>
              {t('Back to Home')}
            </Button>
          </div>
        </Card>
        
        <div className="relative">
          {/* Match notification */}
          <div 
            id="match-notification" 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-100 border-2 border-green-400 text-green-700 px-8 py-4 rounded-lg z-10 opacity-0 transition-opacity duration-300 text-center"
          >
            <p className="text-xl font-bold">{t('Match found!')}</p>
            <p>{t('Your turn again!')}</p>
          </div>
          
          {/* Game grid - responsive layout */}
          <div className={`grid ${getColumnsClass()} gap-2 sm:gap-4`}>
            {cards.map((card) => {
              const term = user?.language === 'he' ? (card.term_he || card.term) : card.term;
              const playerName = selectedPlayers.find(p => p.score && p.score > 0 && matchedCards.includes(card.id))?.name || '';
              
              return (
                <div
                  key={card.id}
                  className={`aspect-square cursor-pointer rounded-lg overflow-hidden transition-all duration-300 shadow-md relative
                    ${flippedCards.includes(card.id) || matchedCards.includes(card.id) ? 'flip-card' : ''}
                    ${matchedCards.includes(card.id) ? 'opacity-70' : ''}
                  `}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className="relative w-full h-full transition-transform duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold
                      ${flippedCards.includes(card.id) || matchedCards.includes(card.id) ? 'opacity-0' : 'opacity-100'}
                      text-lg sm:text-xl md:text-2xl lg:text-3xl
                    `}>
                      ?
                    </div>
                    <div className={`absolute inset-0 bg-white
                      ${flippedCards.includes(card.id) || matchedCards.includes(card.id) ? 'opacity-100' : 'opacity-0'}
                    `}>
                      <div className="relative h-full w-full">
                        <img 
                          src={card.imageUrl} 
                          alt={term}
                          className="w-full h-full object-contain p-2"
                        />
                        
                        {/* תווית לקלפים תואמים בשפת המשחק - תיקון כיוון הטקסט */}
                        {matchedCards.includes(card.id) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-green-600 bg-opacity-80 text-white text-xs sm:text-sm py-1 px-2" dir={user?.language === 'en' ? 'ltr' : 'rtl'}>
                            <div className="text-center truncate whitespace-normal text-xs sm:text-sm">
                              {term}
                            </div>
                            {playerName && (
                              <div className="text-center truncate whitespace-normal text-[10px] sm:text-xs">
                                {t('Found:')} {playerName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // תרגום שמות הקלפים לעברית
  const translateCardTerm = (term) => {
    if (!user || user.language !== 'he') return term;
    
    const termTranslations = {
      // Animals
      "Dog": "כלב",
      "Cat": "חתול",
      "Elephant": "פיל",
      "Lion": "אריה",
      "Giraffe": "ג'ירפה",
      "Monkey": "קוף",
      "Penguin": "פינגווין",
      "Zebra": "זברה",
      "Kangaroo": "קנגורו",
      "Panda": "פנדה",
      "Tiger": "נמר",
      "Owl": "ינשוף",
      
      // Fruits
      "Apple": "תפוח",
      "Banana": "בננה",
      "Orange": "תפוז",
      "Strawberry": "תות",
      "Watermelon": "אבטיח",
      "Grapes": "ענבים",
      "Pineapple": "אננס",
      "Cherry": "דובדבן",
      
      // Vehicles
      "Car": "מכונית",
      "Bus": "אוטובוס",
      "Airplane": "מטוס",
      "Train": "רכבת",
      "Bicycle": "אופניים",
      "Helicopter": "מסוק",
      
      // Objects
      "Chair": "כיסא",
      "Table": "שולחן",
      "Lamp": "מנורה",
      "Book": "ספר",
      "Clock": "שעון",
      "Ball": "כדור",
      
      // Colors
      "Red": "אדום",
      "Blue": "כחול",
      "Green": "ירוק",
      "Yellow": "צהוב",
      "Purple": "סגול",
      "Orange": "כתום",
      
      // Numbers
      "One": "אחד",
      "Two": "שתיים",
      "Three": "שלוש",
      "Four": "ארבע",
      "Five": "חמש",
      "Six": "שש",
      
      // Shapes
      "Circle": "עיגול",
      "Square": "ריבוע",
      "Triangle": "משולש",
      "Rectangle": "מלבן",
      "Star": "כוכב",
      "Heart": "לב",
      
      // Food
      "Pizza": "פיצה",
      "Burger": "המבורגר",
      "Ice Cream": "גלידה",
      "Pasta": "פסטה",
      "Cake": "עוגה",
      "Salad": "סלט",
      
      // Sports
      "Soccer": "כדורגל",
      "Basketball": "כדורסל",
      "Tennis": "טניס",
      "Swimming": "שחייה",
      "Baseball": "בייסבול",
      "Golf": "גולף",
      
      // Nature
      "Mountain": "הר",
      "Ocean": "אוקיינוס",
      "Forest": "יער",
      "Desert": "מדבר",
      "River": "נהר",
      "Flower": "פרח"
    };
    
    return termTranslations[term] || term;
  };

  // Game over screen
  const renderGameOver = () => {
    const maxScore = Math.max(...selectedPlayers.map(p => p.score));
    const winners = selectedPlayers.filter(p => p.score === maxScore);
    
    return (
      <Card className="p-8 bg-white/90 backdrop-blur shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-3xl">{t('Game Over!')}</CardTitle>
          <CardDescription className="text-xl">
            {winners.length === 1 
              ? `${t('Winner:')} ${winners[0].name}` 
              : 'The game ended in a tie!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {selectedPlayers.map((player, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  player.score === maxScore ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {AVATARS.find(a => a.id === player.avatar)?.emoji || '👤'}
                  </span>
                  <div className="text-left">
                    <p className="font-medium">{player.name}</p>
                    <div className="flex gap-4 text-sm">
                      <span>{t('Score:')} {player.score}</span>
                      <span>{t('Moves:')} {player.moves}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t">
            <p className="mb-4 text-gray-600">
              Game completed in {gameTime} seconds with {moves} total moves.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={startGame}>
                {t('Play Again')}
              </Button>
              <Button variant="outline" onClick={resetGame}>
                {t('Back to Home')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4">{t('Loading game...')}</p>
        </div>
      </div>
    );
  }

  const renderPlayerSelection = () => {
    return (
      <Card className="p-6 bg-white/90 backdrop-blur shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl">{t('Game Setup')}</CardTitle>
          <CardDescription className="text-lg">
            {t('Configure the game settings before starting.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="players">{t('Select Players')}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {loadingPlayers ? (
                    <div className="col-span-2 py-8 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                      <p className="mt-2 text-sm text-gray-500">{t('Loading players...')}</p>
                    </div>
                  ) : players.length === 0 ? (
                    <div className="col-span-2 py-8 text-center">
                      <p className="text-gray-500">{t('No players found. Create a new player to start.')}</p>
                    </div>
                  ) : (
                    players.map(player => (
                      <div
                        key={player.id}
                        onClick={() => togglePlayerSelection(player)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200
                          ${selectedPlayers.find(p => p.id === player.id) 
                            ? 'bg-blue-100 border-blue-300 border-2' 
                            : 'bg-gray-50 border-gray-200 border hover:bg-gray-100'}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {AVATARS.find(a => a.id === player.avatar)?.emoji || '👤'}
                          </span>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-gray-500">
                              {player.stats?.memory?.gamesPlayed || 0} {t('games')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="category">{t('Category')}</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {t(cat.charAt(0).toUpperCase() + cat.slice(1))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="cards">{t('Number of Cards')}</Label>
                  <span className="text-sm text-gray-500">{cardsCount}</span>
                </div>
                <Slider
                  id="cards"
                  min={8}
                  max={24}
                  step={4}
                  value={[cardsCount]}
                  onValueChange={([value]) => setCardsCount(value)}
                  className="mt-2"
                />
              </div>
              
              <div className="mt-8">
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="font-medium">{t('Selected:')}</p>
                    <p className="text-sm text-gray-500">
                      {selectedPlayers.length === 0 
                        ? t('No players selected') 
                        : selectedPlayers.map(p => p.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{t('Cards:')}</p>
                    <p className="text-sm text-gray-500">{cardsCount} {t('cards')}</p>
                  </div>
                </div>
                
                <Button
                  onClick={startGame}
                  disabled={selectedPlayers.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {t('Start Game')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-6" dir={user?.language === 'en' ? 'ltr' : 'rtl'}>
      <title>
        תיקון בחירת שחקן יחיד ותצוגת טקסט בקלפים
      </title>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Memory Game')}</h1>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {t('Back to Home')}
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          {gamePhase === "setup" && renderPlayerSelection()}
          {gamePhase === "playing" && renderGameBoard()}
          {gamePhase === "gameOver" && renderGameOver()}
        </div>
      </div>
      
      <style jsx global>{`
        .flip-card {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
