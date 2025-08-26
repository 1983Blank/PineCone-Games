
import React, { useState, useEffect } from 'react';
import { GamePlayer } from '@/api/entities';
import { Profile } from '@/api/entities';
import { User } from '@/api/entities';
import { FashionItem } from '@/api/entities';
import { FashionCharacter } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shirt, 
  Footprints, 
  HardHat, 
  Gem, 
  Trophy,
  Heart,
  Undo,
  Save,
  Home,
  Shirt as ShirtIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import PlayerSelection from '../components/fashion/PlayerSelection';

export default function Fashion() {
  // Player state
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  // Game state
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [clothingItems, setClothingItems] = useState({
    tops: [],
    bottoms: [],
    shoes: [],
    hats: [],
    accessories: []
  });
  const [outfit, setOutfit] = useState({
    tops: [],
    bottoms: [],
    shoes: [],
    hats: [],
    accessories: []
  });
  const [outfitHistory, setOutfitHistory] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('tops');
  const [score, setScore] = useState(0);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [outfitComplete, setOutfitComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('he'); // Default language is Hebrew
  
  useEffect(() => {
    async function loadLanguage() {
      try {
        const currentUser = await User.me();
        setLanguage(currentUser?.language || 'he');
        console.log("Set language to:", currentUser?.language);
      } catch (err) {
        console.error("Error loading user language:", err);
      }
    }
    loadLanguage();
  }, []);

  useEffect(() => {
    if (currentPlayer) {
      loadGameData();
    }
  }, [currentPlayer]);

  useEffect(() => {
    // Check if outfit is complete (has at least one top and one bottom)
    const hasTop = outfit.tops.length > 0;
    const hasBottom = outfit.bottoms.length > 0;
    const hasShoes = outfit.shoes.length > 0;
    
    const isComplete = hasTop && hasBottom && hasShoes;
    setOutfitComplete(isComplete);
    
    // Calculate score based on outfit completion
    if (isComplete) {
      let newScore = 30; // Base score for complete outfit
      
      // Bonus for accessories
      newScore += outfit.hats.length * 5;
      newScore += outfit.accessories.length * 3;
      
      // Season matching bonus - check if the season matches with current season
      const currentSeason = new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? 'summer' : 'winter';
      const seasonMatching = [...outfit.tops, ...outfit.bottoms]
        .filter(item => item.season === 'all' || item.season === currentSeason).length;
      
      newScore += seasonMatching * 5;
      
      setScore(newScore);
    } else {
      setScore(0);
    }
  }, [outfit]);

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      
      console.log("Loading game data...");
      
      // Load characters
      const allCharacters = await FashionCharacter.filter({ isActive: true });
      console.log("Characters loaded:", allCharacters);
      setCharacters(allCharacters.sort((a, b) => a.order - b.order));
      
      // Load clothing items
      const allItems = await FashionItem.filter({ isActive: true });
      console.log("Clothing items loaded:", allItems);
      
      // Group items by category
      const groupedItems = {
        tops: [],
        bottoms: [],
        shoes: [],
        hats: [],
        accessories: []
      };
      
      allItems.forEach(item => {
        if (groupedItems[item.category]) {
          groupedItems[item.category].push(item);
        }
      });
      
      // Sort items by layer order
      Object.keys(groupedItems).forEach(category => {
        groupedItems[category].sort((a, b) => a.layerOrder - b.layerOrder);
      });
      
      setClothingItems(groupedItems);
      
      // Load saved outfits if available
      if (currentPlayer.stats?.fashion?.savedOutfits) {
        setSavedOutfits(currentPlayer.stats.fashion.savedOutfits);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading game data:", err);
      setIsLoading(false);
    }
  };

  const handlePlayerSelect = async (player) => {
    setCurrentPlayer(player);
    
    try {
      // Save the current player in profile
      const user = await User.me();
      const profile = await Profile.filter({ email: user.email });
      if (profile && profile[0]) {
        await Profile.update(profile[0].id, {
          lastGames: {
            ...profile[0].lastGames,
            fashion: {
              playerId: player.id
            }
          }
        });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const addToOutfit = (item, category) => {
    // Save current state to history
    setOutfitHistory([...outfitHistory, JSON.parse(JSON.stringify(outfit))]);
    
    if (category === 'accessories' || category === 'hats') {
      // Add to collection
      setOutfit({
        ...outfit,
        [category]: [...outfit[category], item]
      });
    } else if (category === 'tops' && item.layerOrder > 20) {
      // For outer tops (shirts over t-shirts)
      setOutfit({
        ...outfit,
        [category]: [...outfit[category], item].sort((a, b) => a.layerOrder - b.layerOrder)
      });
    } else {
      // Replace existing items for most categories
      setOutfit({
        ...outfit,
        [category]: [item]
      });
    }
  };

  const removeItem = (category, itemId) => {
    // Save current state to history
    setOutfitHistory([...outfitHistory, JSON.parse(JSON.stringify(outfit))]);
    
    if (category === 'accessories' || category === 'hats') {
      // Remove specific item
      setOutfit({
        ...outfit,
        [category]: outfit[category].filter(item => item.id !== itemId)
      });
    } else if (category === 'tops' && outfit.tops.length > 1) {
      // For tops, remove specific layer
      setOutfit({
        ...outfit,
        [category]: outfit[category].filter(item => item.id !== itemId)
      });
    } else {
      // For other categories, clear all
      setOutfit({
        ...outfit,
        [category]: []
      });
    }
  };

  const undoLastAction = () => {
    if (outfitHistory.length > 0) {
      const lastOutfit = outfitHistory[outfitHistory.length - 1];
      setOutfit(lastOutfit);
      setOutfitHistory(outfitHistory.slice(0, -1));
    }
  };

  const resetOutfit = () => {
    if (window.confirm(t('Are you sure you want to reset the outfit?'))) {
      setOutfitHistory([...outfitHistory, JSON.parse(JSON.stringify(outfit))]);
      setOutfit({
        tops: [],
        bottoms: [],
        shoes: [],
        hats: [],
        accessories: []
      });
    }
  };

  const saveOutfit = async () => {
    if (!outfitComplete) {
      alert(t('Please complete the outfit before saving (top, bottom and shoes)!'));
      return;
    }
    
    if (!currentPlayer) return;
    
    try {
      // Create outfit object
      const newOutfit = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        characterType: selectedCharacter.type,
        items: {...outfit},
        score: score
      };
      
      // Update saved outfits
      const updatedOutfits = [...savedOutfits, newOutfit].slice(-5);  // Keep only the last 5
      setSavedOutfits(updatedOutfits);
      
      // Update player stats
      const stats = currentPlayer.stats?.fashion || {
        gamesPlayed: 0,
        outfitsCreated: 0,
        highScore: 0,
        savedOutfits: [],
        lastPlayed: null
      };
      
      await GamePlayer.update(currentPlayer.id, {
        stats: {
          ...currentPlayer.stats,
          fashion: {
            gamesPlayed: stats.gamesPlayed + 1,
            outfitsCreated: (stats.outfitsCreated || 0) + 1,
            highScore: Math.max(stats.highScore || 0, score),
            savedOutfits: updatedOutfits,
            lastPlayed: new Date().toISOString()
          }
        }
      });
      
      // Show completion dialog
      setDialogOpen(true);
      
    } catch (err) {
      console.error("Error saving outfit:", err);
      alert(t('Error saving outfit'));
    }
  };

  const handleCharacterSelect = (character) => {
    // Reset outfit when changing character type
    setOutfit({
      tops: [],
      bottoms: [],
      shoes: [],
      hats: [],
      accessories: []
    });
    setOutfitHistory([]);
    setSelectedCharacter(character);
  };

  // Function to get the style for a clothing item based on its category
  const getItemPositionStyle = (category) => {
    const baseStyles = {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '100%',
      maxHeight: '100%',
      pointerEvents: 'none'
    };
    
    // Position adjustments for different categories
    switch(category) {
      case 'shoes':
        return { ...baseStyles, bottom: '0', maxHeight: '25%', zIndex: 2 };
      case 'bottoms':
        return { ...baseStyles, bottom: '15%', maxHeight: '60%', zIndex: 3 };
      case 'tops':
        return { ...baseStyles, bottom: '30%', maxHeight: '60%', zIndex: 4 };
      case 'hats':
        return { ...baseStyles, top: '5%', maxHeight: '30%', zIndex: 6 };
      case 'accessories':
        return { ...baseStyles, top: '25%', maxHeight: '50%', zIndex: 5 };
      default:
        return baseStyles;
    }
  };

  // Enhanced translations with full English support
  const t = (key) => {
    const translations = {
      // Navigation & Headers
      "Fashion Game": { he: "משחק הלבשה", en: "Fashion Game" },
      "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
      "Leaderboard": { he: "לוח שיאים", en: "Leaderboard" },
      "Loading game...": { he: "טוען את המשחק...", en: "Loading game..." },
      
      // Character Selection
      "Select Character": { he: "בחר דמות להלבשה", en: "Select Character" },
      "No characters available": { 
        he: "אין דמויות זמינות. יש להוסיף דמויות בפאנל הניהול.", 
        en: "No characters available. Please add characters in the admin panel." 
      },
      "Change Character": { he: "החלף דמות", en: "Change Character" },
      "boy": { he: "ילד", en: "boy" },
      "girl": { he: "ילדה", en: "girl" },

      // Clothing Categories
      "tops": { he: "בגדים עליונים", en: "Tops" },
      "bottoms": { he: "בגדים תחתונים", en: "Bottoms" },
      "shoes": { he: "נעליים", en: "Shoes" },
      "hats": { he: "כובעים", en: "Hats" },
      "accessories": { he: "אביזרים", en: "Accessories" },

      // Actions & Buttons
      "Undo": { he: "בטל", en: "Undo" },
      "Clear All": { he: "נקה הכל", en: "Clear All" },
      "Save Outfit": { he: "שמור תלבושת", en: "Save Outfit" },
      "New Outfit": { he: "תלבושת חדשה", en: "New Outfit" },
      "Continue Editing": { he: "המשך עריכה", en: "Continue Editing" },

      // Messages & Notifications
      "Can add multiple items": { he: "אפשר להוסיף כמה פריטים", en: "Can add multiple items" },
      "No items in this category": { he: "אין פריטים בקטגוריה זו", en: "No items in this category" },
      "Outfit Saved!": { he: "התלבושת נשמרה!", en: "Outfit Saved!" },
      "You received": { he: "קיבלת", en: "You received" },
      "points": { he: "נקודות", en: "points" },
      "An impressive outfit was created!": { he: "נוצרה תלבושת מרשימה!", en: "An impressive outfit was created!" },
      
      // Error Messages
      "Please complete the outfit before saving (top, bottom and shoes)!": { 
        he: "יש להשלים את התלבושת לפני השמירה (עליון, תחתון ונעליים)!", 
        en: "Please complete the outfit before saving (top, bottom and shoes)!" 
      },
      "Are you sure you want to reset the outfit?": { 
        he: "האם אתה בטוח שברצונך לאפס את התלבושת?", 
        en: "Are you sure you want to reset the outfit?" 
      },
      "Error saving outfit": { he: "אירעה שגיאה בשמירת התלבושת", en: "Error saving outfit" }
    };

    const translation = translations[key]?.[language] || key;
    console.log(`Translating: ${key} to ${language}, result: ${translation}`);
    return translation;
  };

  if (!currentPlayer) {
    return <PlayerSelection onPlayerSelect={handlePlayerSelect} gameType="fashion" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4">{t('Loading game...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 p-4 sm:p-6" dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Fashion Game')}</h1>
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
        
        {!selectedCharacter ? (
          <Card className="bg-white/80 backdrop-blur shadow-lg p-6">
            <CardContent>
              <h2 className="text-2xl font-bold mb-6 text-center">{t('Select Character')}</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {characters.length === 0 ? (
                  <div className="col-span-full text-center p-8">
                    <p>{t('No characters available')}</p>
                  </div>
                ) : (
                  characters.map(character => (
                    <motion.div
                      key={character.id}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white rounded-lg overflow-hidden shadow cursor-pointer"
                      onClick={() => handleCharacterSelect(character)}
                    >
                      <div className="aspect-square p-2 flex items-center justify-center bg-gray-50">
                        {character.baseImageUrl ? (
                          <img 
                            src={character.baseImageUrl}
                            alt={character.name}
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 rounded-lg">
                            <span className="text-6xl">
                              {character.type === 'boy' ? '👦' : '👧'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium">{character.name}</h3>
                        <p className="text-sm text-gray-500">
                          {character.type === 'boy' && t('boy')}
                          {character.type === 'girl' && t('girl')}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 h-[600px] bg-white/80 backdrop-blur shadow-lg">
              <CardContent className="p-6 h-full">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{currentPlayer.name}</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedCharacter(null)}
                      className="text-xs text-gray-500"
                    >
                      {t('Change Character')}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-lg font-bold">{score} {t('points')}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl h-[450px] relative p-4 overflow-hidden">
                  {/* Character and clothing layers */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Base character image */}
                    {selectedCharacter.baseImageUrl && (
                      <img 
                        src={selectedCharacter.baseImageUrl}
                        alt={selectedCharacter.name}
                        className="max-height-full object-contain z-1"
                        style={{ maxHeight: '90%', position: 'absolute', bottom: 0 }}
                      />
                    )}
                    
                    {/* Render outfit items */}
                    {Object.keys(outfit).map(category => 
                      outfit[category].map(item => (
                        <img 
                          key={`${category}-${item.id}`}
                          src={item.imageUrl}
                          alt={item.name}
                          style={getItemPositionStyle(category)}
                          onClick={() => removeItem(category, item.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={undoLastAction}
                      disabled={outfitHistory.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Undo className="w-4 h-4" />
                      {t('Undo')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetOutfit}
                      className="flex items-center gap-2"
                    >
                      {t('Clear All')}
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={saveOutfit}
                    disabled={!outfitComplete}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {t('Save Outfit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="h-[600px] bg-white/80 backdrop-blur shadow-lg overflow-hidden">
              <CardContent className="p-0 h-full">
                <Tabs defaultValue={currentCategory} value={currentCategory} onValueChange={setCurrentCategory} className="h-full flex flex-col">
                  <TabsList className="h-auto grid grid-rows-2 grid-cols-3 gap-1 p-2">
                    <TabsTrigger 
                      value="tops" 
                      className="px-3 py-2 text-sm text-center h-auto whitespace-normal"
                    >
                      {t('tops')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="bottoms"
                      className="px-3 py-2 text-sm text-center h-auto whitespace-normal"
                    >
                      {t('bottoms')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="shoes"
                      className="px-3 py-2 text-sm text-center h-auto whitespace-normal"
                    >
                      {t('shoes')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="hats"
                      className="px-3 py-2 text-sm text-center h-auto whitespace-normal"
                    >
                      {t('hats')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="accessories"
                      className="px-3 py-2 text-sm text-center h-auto whitespace-normal"
                    >
                      {t('accessories')}
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-3 flex-grow overflow-auto">
                    <div className="mb-2 flex justify-between items-center">
                      <div className="text-sm font-medium">
                        {t(currentCategory)}
                      </div>
                      
                      {['accessories', 'hats', 'tops'].includes(currentCategory) && outfit[currentCategory].length > 0 && (
                        <div className="text-xs text-gray-500">
                          {t('Can add multiple items')}
                        </div>
                      )}
                    </div>
                    
                    {(() => {
                      const filteredItems = clothingItems[currentCategory]?.filter(item => 
                        item.type === selectedCharacter?.type || item.type === 'unisex'
                      );

                      if (!filteredItems || filteredItems.length === 0) {
                        return (
                          <div className="col-span-2 text-center p-6 text-gray-400">
                            {t('No items in this category')}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 gap-4 w-full">
                          {filteredItems.map(item => (
                            <motion.button
                              key={item.id}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => addToOutfit(item, currentCategory)}
                              className="aspect-square w-full flex items-center justify-center bg-gray-100 rounded-lg cursor-pointer overflow-hidden p-2 hover:bg-gray-200 transition-colors"
                            >
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="max-h-full object-contain"
                                />
                              ) : (
                                <div className="text-gray-400 text-sm">{item.name}</div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="text-center">
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4 text-purple-700">
              {t('Outfit Saved!')} 🎉
            </h3>
            <div className="space-y-4">
              <p className="text-lg font-medium">{t('You received')} {score} {t('points')}</p>
              <p className="text-gray-600">{t('An impressive outfit was created!')}</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => {
                  setDialogOpen(false);
                  resetOutfit();
                }}>
                  {t('New Outfit')}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('Continue Editing')}
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
