
import React, { useState, useEffect } from 'react';
import { Cards } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Upload, Save, XCircle, Search, Check, Eye, FolderX } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function CardManager() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCard, setCurrentCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCards, setPreviewCards] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [brokenImageCards, setBrokenImageCards] = useState([]);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const loadedCards = await Cards.list();
      setCards(loadedCards);
      
      // Check for broken image URLs
      const cardsWithBrokenImages = loadedCards.filter(card => 
        !card.imageUrl || 
        card.imageUrl.includes('undefined') || 
        card.imageUrl.includes('null') ||
        card.imageUrl.trim() === ''
      );
      setBrokenImageCards(cardsWithBrokenImages);
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading cards:", err);
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const response = await UploadFile({ file });
      setCurrentCard(prev => ({
        ...prev,
        imageUrl: response.file_url
      }));
      setUploadingImage(false);
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploadingImage(false);
    }
  };

  const handleNewCard = () => {
    setCurrentCard({
      term: '',
      term_he: '', // נוסף שדה חובה
      category: 'animals',
      imageUrl: ''
    });
    setIsEditing(true);
  };

  const handleEditCard = (card) => {
    // וודא שלקלף יש את כל השדות הנדרשים
    const editedCard = {
      ...card,
      term_he: card.term_he || card.term // אם term_he חסר, השתמש ב-term כברירת מחדל
    };
    setCurrentCard(editedCard);
    setIsEditing(true);
  };

  const handleSaveCard = async () => {
    if (!currentCard.term) {
      alert('יש להזין שם לקלף');
      return;
    }

    if (!currentCard.term_he) {
      alert('יש להזין את השם בעברית');
      return;
    }

    if (!currentCard.imageUrl) {
      alert('יש להעלות תמונה לקלף');
      return;
    }

    try {
      if (currentCard.id) {
        await Cards.update(currentCard.id, currentCard);
      } else {
        await Cards.create(currentCard);
      }
      setIsEditing(false);
      loadCards();
    } catch (err) {
      console.error('Error saving card:', err);
      alert('שגיאה בשמירת הקלף: ' + (err.response?.data?.message || err.message));
    }
  };

  const confirmDeleteCard = (card) => {
    setCardToDelete(card);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCard = async () => {
    try {
      await Cards.delete(cardToDelete.id);
      setDeleteConfirmOpen(false);
      loadCards();
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('שגיאה במחיקת הקלף');
    }
  };

  const handlePreviewCategory = (category) => {
    const filteredCards = cards.filter(card => card.category === category);
    setPreviewCards(filteredCards);
    setPreviewOpen(true);
  };

  const handleBulkDeleteBrokenImageCards = async () => {
    try {
      for (const card of brokenImageCards) {
        await Cards.delete(card.id);
      }
      setBulkDeleteConfirmOpen(false);
      loadCards();
    } catch (err) {
      console.error('Error deleting cards with broken images:', err);
      alert('שגיאה במחיקת הקלפים');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategoryToDelete) return;
    
    try {
      // Get all cards in the category
      const categoryCards = cards.filter(card => card.category === selectedCategoryToDelete);
      
      // Delete all cards in the category
      for (const card of categoryCards) {
        await Cards.delete(card.id);
      }
      
      setDeleteCategoryDialogOpen(false);
      setSelectedCategoryToDelete(null);
      loadCards();
      
      // Reset category filter if we just deleted the currently selected category
      if (selectedCategory === selectedCategoryToDelete) {
        setSelectedCategory('all');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('שגיאה במחיקת הקטגוריה');
    }
  };

  const filteredCards = cards.filter(card => {
    let match = true;
    
    if (searchTerm) {
      match = match && (
        (card.term && card.term.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (card.term_he && card.term_he.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      match = match && card.category === selectedCategory;
    }
    
    return match;
  });

  // התאם שמות קטגוריות בעברית ואנגלית
  const categoryNames = {
    'animals': 'חיות / Animals',
    'fruits': 'פירות / Fruits',
    'vehicles': 'כלי רכב / Vehicles',
    'people': 'אנשים / People',
    'objects': 'חפצים / Objects',
    'colors': 'צבעים / Colors',
    'numbers': 'מספרים / Numbers',
    'shapes': 'צורות / Shapes',
    'food': 'אוכל / Food',
    'sports': 'ספורט / Sports',
    'nature': 'טבע / Nature'
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{currentCard.id ? 'עריכת קלף' : 'יצירת קלף חדש'}</span>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <XCircle className="w-4 h-4 ml-2" />
              ביטול
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">שם הקלף (אנגלית)</label>
                <Input
                  value={currentCard.term || ''}
                  onChange={(e) => setCurrentCard({...currentCard, term: e.target.value})}
                  placeholder="הזן שם לקלף באנגלית (Dog, Cat, etc.)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">שם הקלף (עברית) <span className="text-red-500">*</span></label>
                <Input
                  value={currentCard.term_he || ''}
                  onChange={(e) => setCurrentCard({...currentCard, term_he: e.target.value})}
                  placeholder="הזן שם לקלף בעברית (כלב, חתול, וכו')"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">קטגוריה</label>
                <Select
                  value={currentCard.category || 'animals'}
                  onValueChange={(value) => setCurrentCard({...currentCard, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="animals">חיות</SelectItem>
                    <SelectItem value="plants">צמחים</SelectItem>
                    <SelectItem value="vehicles">כלי רכב</SelectItem>
                    <SelectItem value="people">אנשים</SelectItem>
                    <SelectItem value="fruits">פירות</SelectItem>
                    <SelectItem value="objects">חפצים</SelectItem>
                    <SelectItem value="colors">צבעים</SelectItem>
                    <SelectItem value="numbers">מספרים</SelectItem>
                    <SelectItem value="shapes">צורות</SelectItem>
                    <SelectItem value="food">אוכל</SelectItem>
                    <SelectItem value="sports">ספורט</SelectItem>
                    <SelectItem value="nature">טבע</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">העלאת תמונה</label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
                  )}
                </div>
                {currentCard.imageUrl && (
                  <div className="mt-2 text-sm text-green-600">
                    תמונה נבחרה
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">תצוגה מקדימה</label>
                <div className="border rounded-lg bg-gray-50 p-4 h-80 flex items-center justify-center">
                  {currentCard.imageUrl ? (
                    <img 
                      src={currentCard.imageUrl} 
                      alt={currentCard.term}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      אין תצוגה מקדימה
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveCard}>
              <Save className="w-4 h-4 ml-2" />
              שמור קלף
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>ניהול קלפים למשחק הזיכרון</span>
          <div className="flex gap-2">
            {brokenImageCards.length > 0 && (
              <Button variant="destructive" onClick={() => setBulkDeleteConfirmOpen(true)}>
                <Trash2 className="w-4 h-4 ml-2" />
                מחק {brokenImageCards.length} קלפים שבורים
              </Button>
            )}
            <Button onClick={handleNewCard}>
              <Plus className="w-4 h-4 ml-2" />
              קלף חדש
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש קלפים..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              <SelectItem value="animals">חיות</SelectItem>
              <SelectItem value="plants">צמחים</SelectItem>
              <SelectItem value="vehicles">כלי רכב</SelectItem>
              <SelectItem value="people">אנשים</SelectItem>
              <SelectItem value="fruits">פירות</SelectItem>
              <SelectItem value="objects">חפצים</SelectItem>
              <SelectItem value="colors">צבעים</SelectItem>
              <SelectItem value="numbers">מספרים</SelectItem>
              <SelectItem value="shapes">צורות</SelectItem>
              <SelectItem value="food">אוכל</SelectItem>
              <SelectItem value="sports">ספורט</SelectItem>
              <SelectItem value="nature">טבע</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <div className="text-sm font-medium mb-2">סיכום לפי קטגוריות</div>
          <div className="flex flex-wrap gap-2">
            {['animals', 'plants', 'vehicles', 'people', 'fruits', 'objects', 'colors', 'numbers', 'shapes', 'food', 'sports', 'nature'].map(category => {
              const count = cards.filter(card => card.category === category).length;
              const displayName = categoryNames[category] || category;
              
              if (count === 0) return null; // Don't show empty categories
              
              return (
                <div key={category} className="group relative">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer group-hover:pr-8"
                    onClick={() => handlePreviewCategory(category)}
                  >
                    {displayName}: {count} קלפים
                    <Eye className="w-3 h-3 ml-1 inline-block" />
                    
                    {/* Delete category button */}
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-500 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryToDelete(category);
                        setDeleteCategoryDialogOpen(true);
                      }}
                    >
                      <FolderX className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCards.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              לא נמצאו קלפים
            </div>
          ) : (
            filteredCards.map((card) => (
              <Card key={card.id} className="overflow-hidden">
                <div className="p-4 border-b bg-gray-50 h-40 flex items-center justify-center">
                  {card.imageUrl ? (
                    <img 
                      src={card.imageUrl} 
                      alt={card.term_he || card.term}
                      className="max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400">אין תמונה</div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-1">{card.term_he || card.term}</h3>
                  {card.term !== card.term_he && card.term && (
                    <p className="text-sm text-gray-500 mb-1">{card.term}</p>
                  )}
                  <div className="text-sm text-gray-600 mb-2">
                    {categoryNames[card.category] || card.category}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEditCard(card)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => confirmDeleteCard(card)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הקלף לחלוטין ואינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} className="bg-red-500 hover:bg-red-600">
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את כל הקלפים עם תמונות שבורות?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק {brokenImageCards.length} קלפים עם קישורי תמונות שבורים. פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteBrokenImageCards} className="bg-red-500 hover:bg-red-600">
              מחק את כל הקלפים השבורים
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את הקטגוריה?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את כל הקלפים בקטגוריה {categoryNames[selectedCategoryToDelete] || selectedCategoryToDelete}.
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Warning: This action cannot be undone and will delete {cards.filter(card => card.category === selectedCategoryToDelete).length} cards.
                  </p>
                </div>
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory} 
              className="bg-red-500 hover:bg-red-600"
            >
              מחק קטגוריה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {previewCards.length > 0 && (categoryNames[previewCards[0].category] || previewCards[0].category)} - תצוגה מקדימה
            </AlertDialogTitle>
            <AlertDialogDescription>
              {previewCards.length} קלפים בקטגוריה זו
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-4">
            {previewCards.map(card => (
              <div key={card.id} className="border rounded-lg overflow-hidden">
                <div className="h-32 bg-white flex items-center justify-center p-2">
                  <img src={card.imageUrl} alt={card.term_he || card.term} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="p-2 text-center text-sm font-medium bg-gray-50">
                  {card.term_he || card.term}
                </div>
              </div>
            ))}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>סגור</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
