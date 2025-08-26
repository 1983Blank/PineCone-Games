import React, { useState, useEffect } from 'react';
import { FashionCharacter } from '@/api/entities';
import { FashionItem } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Upload, Shirt, UserRound, ImageIcon, Trash2 } from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function FashionManager() {
  const [activeTab, setActiveTab] = useState("instructions");
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="instructions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="instructions">הנחיות איורים</TabsTrigger>
          <TabsTrigger value="characters">דמויות בסיס</TabsTrigger>
          <TabsTrigger value="items">פריטי לבוש</TabsTrigger>
        </TabsList>
        
        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הנחיות לאיורים למשחק הלבשה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">מבנה המשחק</h3>
                <p>
                  משחק ההלבשה הוא משחק המאפשר לילדים להלביש דמויות מאוירות בפריטי לבוש שונים.
                  המשחק דורש סט של איורים מתואמים - דמויות בסיס ופריטי לבוש שניתן להרכיב עליהן.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold">דרישות טכניות</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>כל האיורים צריכים להיות בפורמט PNG שקוף</li>
                  <li>דמויות בסיס באותו גודל וקנה מידה</li>
                  <li>פריטי לבוש ממוקמים במיקום מדויק שיתאימו לדמויות הבסיס</li>
                  <li>רזולוציה מומלצת: לפחות 800x800 פיקסלים</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold">מקורות מומלצים לאיורים</h3>
                <p>
                  ישנם מספר מקורות לאיור וקטורי מתאים למשחקי הלבשה:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><a href="https://www.freepik.com/search?format=search&query=dress%20up%20game&type=vector" className="text-blue-600 hover:underline" target="_blank">Freepik - ערכות דמויות להלבשה</a></li>
                  <li><a href="https://www.vecteezy.com/free-vector/dress-up-game" className="text-blue-600 hover:underline" target="_blank">Vecteezy - משחקי הלבשה וקטוריים</a></li>
                  <li><a href="https://www.shutterstock.com/search/paper-doll" className="text-blue-600 hover:underline" target="_blank">Shutterstock - בובות נייר להלבשה</a></li>
                </ul>
                <p className="mt-4 text-sm text-amber-700">
                  הערה: יש לוודא שיש רישיון מתאים לשימוש בחומרים אלה לפני השימוש במשחק.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold">מבנה האיורים הדרושים</h3>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    <strong>דמויות בסיס:</strong> 
                    <ul className="list-disc list-inside pl-6 mt-1">
                      <li>ילד - ע"פ רוב בתחתונים ומגיע ללא בגדים</li>
                      <li>ילדה - ע"פ רוב בתחתונים ומגיעה ללא בגדים</li>
                    </ul>
                  </li>
                  <li>
                    <strong>פריטי לבוש לפי קטגוריות:</strong>
                    <ul className="list-disc list-inside pl-6 mt-1">
                      <li>עליונים: חולצות, סוודרים</li>
                      <li>תחתונים: מכנסיים, חצאיות, שמלות</li>
                      <li>נעליים</li>
                      <li>כובעים ואביזרי ראש</li>
                      <li>אביזרים: תיקים, צעיפים, משקפיים</li>
                    </ul>
                  </li>
                </ol>
              </div>
              
              <div className="mt-6">
                <Button onClick={() => setActiveTab("characters")} className="ml-2">
                  הוספת דמויות בסיס
                </Button>
                <Button onClick={() => setActiveTab("items")}>
                  הוספת פריטי לבוש
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="characters">
          <CharacterManager />
        </TabsContent>
        
        <TabsContent value="items">
          <ItemManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CharacterManager() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    loadCharacters();
  }, []);
  
  const loadCharacters = async () => {
    try {
      setLoading(true);
      const allCharacters = await FashionCharacter.list();
      setCharacters(allCharacters);
      setLoading(false);
    } catch (err) {
      console.error("Error loading characters:", err);
      setLoading(false);
    }
  };
  
  const handleAddCharacter = () => {
    setCurrentCharacter({
      name: '',
      type: 'boy',
      baseImageUrl: '',
      description: '',
      isActive: true,
      order: characters.length + 1
    });
    setIsEditing(true);
  };
  
  const handleEditCharacter = (character) => {
    setCurrentCharacter({...character});
    setIsEditing(true);
  };
  
  const handleSaveCharacter = async () => {
    if (!currentCharacter.name || !currentCharacter.baseImageUrl) {
      alert('יש להזין שם ולהעלות תמונת בסיס לדמות');
      return;
    }
    
    try {
      if (currentCharacter.id) {
        await FashionCharacter.update(currentCharacter.id, currentCharacter);
      } else {
        await FashionCharacter.create(currentCharacter);
      }
      setIsEditing(false);
      loadCharacters();
    } catch (err) {
      console.error('Error saving character:', err);
      alert('שגיאה בשמירת הדמות');
    }
  };
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const response = await UploadFile({ file });
      setCurrentCharacter(prev => ({
        ...prev,
        baseImageUrl: response.file_url
      }));
      setUploading(false);
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploading(false);
    }
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
          <CardTitle>{currentCharacter.id ? 'עריכת דמות' : 'הוספת דמות חדשה'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">שם הדמות</label>
              <Input
                value={currentCharacter.name}
                onChange={(e) => setCurrentCharacter({...currentCharacter, name: e.target.value})}
                placeholder="למשל: דני, מיכל"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">סוג דמות</label>
              <Select
                value={currentCharacter.type}
                onValueChange={(value) => setCurrentCharacter({...currentCharacter, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג דמות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boy">ילד</SelectItem>
                  <SelectItem value="girl">ילדה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">מיקום בסדר</label>
              <Input
                type="number"
                value={currentCharacter.order}
                onChange={(e) => setCurrentCharacter({...currentCharacter, order: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס</label>
              <Select
                value={currentCharacter.isActive.toString()}
                onValueChange={(value) => setCurrentCharacter({...currentCharacter, isActive: value === 'true'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">פעיל</SelectItem>
                  <SelectItem value="false">לא פעיל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">תיאור</label>
            <Textarea
              value={currentCharacter.description || ''}
              onChange={(e) => setCurrentCharacter({...currentCharacter, description: e.target.value})}
              placeholder="תיאור קצר של הדמות"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">תמונת בסיס</label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer" onClick={() => document.getElementById('characterImage').click()}>
                  <input
                    id="characterImage"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">לחץ להעלאת תמונת בסיס</p>
                  <p className="text-xs text-gray-400">PNG שקוף, מומלץ 800x800</p>
                </div>
                {uploading && <p className="text-center text-sm mt-2">מעלה תמונה...</p>}
              </div>
              
              {currentCharacter.baseImageUrl && (
                <div className="flex items-center justify-center border rounded-lg overflow-hidden bg-gray-50 aspect-square">
                  <img 
                    src={currentCharacter.baseImageUrl}
                    alt={currentCharacter.name || 'Character preview'}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveCharacter}>
              שמור
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">דמויות בסיס</h2>
        <Button onClick={handleAddCharacter}>
          הוסף דמות חדשה
        </Button>
      </div>
      
      {characters.length === 0 ? (
        <Card className="p-8 text-center">
          <UserRound className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">אין דמויות עדיין</h3>
          <p className="mt-1 text-gray-500">לחץ על "הוסף דמות חדשה" ליצירת דמות ראשונה.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map(character => (
            <Card key={character.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-50 p-4 flex items-center justify-center">
                {character.baseImageUrl ? (
                  <img 
                    src={character.baseImageUrl}
                    alt={character.name}
                    className="max-h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-md">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{character.name}</h3>
                    <p className="text-sm text-gray-500">
                      {character.type === 'boy' ? 'ילד' : 'ילדה'} • מיקום: {character.order}
                    </p>
                    {character.description && (
                      <p className="text-sm mt-2">{character.description}</p>
                    )}
                  </div>
                  <div>
                    {!character.isActive && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">לא פעיל</span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => handleEditCharacter(character)}
                >
                  ערוך
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(false);
  
  useEffect(() => {
    loadItems();
  }, []);
  
  const loadItems = async () => {
    try {
      setLoading(true);
      const allItems = await FashionItem.list();
      setItems(allItems);
      setLoading(false);
    } catch (err) {
      console.error("Error loading items:", err);
      setLoading(false);
    }
  };
  
  const handleAddItem = () => {
    setCurrentItem({
      name: '',
      category: 'tops',
      type: 'unisex',
      imageUrl: '',
      colorVariant: '',
      isActive: true,
      layerOrder: 10,
      season: 'all'
    });
    setIsEditing(true);
  };
  
  const handleEditItem = (item) => {
    setCurrentItem({...item});
    setIsEditing(true);
  };
  
  const handleSaveItem = async () => {
    if (!currentItem.name || !currentItem.imageUrl) {
      alert('יש להזין שם ולהעלות תמונה לפריט');
      return;
    }
    
    try {
      if (currentItem.id) {
        await FashionItem.update(currentItem.id, currentItem);
      } else {
        await FashionItem.create(currentItem);
      }
      setIsEditing(false);
      loadItems();
    } catch (err) {
      console.error('Error saving item:', err);
      alert('שגיאה בשמירת הפריט');
    }
  };
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const response = await UploadFile({ file });
      setCurrentItem(prev => ({
        ...prev,
        imageUrl: response.file_url
      }));
      setUploading(false);
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploading(false);
    }
  };
  
  const confirmDeleteAllItems = () => {
    setDeleteDialogOpen(true);
  };
  
  const deleteAllItems = async () => {
    try {
      setDeleteProgress(true);
      
      // Delete all items one by one
      for (const item of items) {
        await FashionItem.delete(item.id);
      }
      
      setDeleteProgress(false);
      setDeleteDialogOpen(false);
      loadItems();
    } catch (err) {
      console.error("Error deleting items:", err);
      setDeleteProgress(false);
      alert('אירעה שגיאה במחיקת הפריטים');
    }
  };
  
  const filteredItems = filteredCategory === 'all' 
    ? items 
    : items.filter(item => item.category === filteredCategory);
  
  const categoryNames = {
    tops: 'עליונים',
    bottoms: 'תחתונים',
    shoes: 'נעליים',
    hats: 'כובעים',
    accessories: 'אביזרים'
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
          <CardTitle>{currentItem.id ? 'עריכת פריט' : 'הוספת פריט חדש'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">שם הפריט</label>
              <Input
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                placeholder="למשל: חולצה אדומה, מכנסי ג'ינס"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">קטגוריה</label>
              <Select
                value={currentItem.category}
                onValueChange={(value) => setCurrentItem({...currentItem, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tops">עליונים</SelectItem>
                  <SelectItem value="bottoms">תחתונים</SelectItem>
                  <SelectItem value="shoes">נעליים</SelectItem>
                  <SelectItem value="hats">כובעים</SelectItem>
                  <SelectItem value="accessories">אביזרים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">סוג דמות מתאימה</label>
              <Select
                value={currentItem.type}
                onValueChange={(value) => setCurrentItem({...currentItem, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג דמות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boy">רק לילד</SelectItem>
                  <SelectItem value="girl">רק לילדה</SelectItem>
                  <SelectItem value="unisex">לשני המינים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">עונה מתאימה</label>
              <Select
                value={currentItem.season}
                onValueChange={(value) => setCurrentItem({...currentItem, season: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר עונה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל השנה</SelectItem>
                  <SelectItem value="summer">קיץ</SelectItem>
                  <SelectItem value="winter">חורף</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">סדר שכבות</label>
              <Input
                type="number"
                value={currentItem.layerOrder}
                onChange={(e) => setCurrentItem({...currentItem, layerOrder: parseInt(e.target.value)})}
                min="1"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                מספר נמוך יותר = הפריט יהיה מתחת (10=רגיל, 20=מעל)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">צבע עיקרי</label>
              <Input
                value={currentItem.colorVariant || ''}
                onChange={(e) => setCurrentItem({...currentItem, colorVariant: e.target.value})}
                placeholder="למשל: אדום, כחול, ירוק"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">סטטוס</label>
              <Select
                value={currentItem.isActive.toString()}
                onValueChange={(value) => setCurrentItem({...currentItem, isActive: value === 'true'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">פעיל</SelectItem>
                  <SelectItem value="false">לא פעיל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">תמונת פריט (PNG שקוף)</label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer" onClick={() => document.getElementById('itemImage').click()}>
                  <input
                    id="itemImage"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">לחץ להעלאת תמונת פריט</p>
                  <p className="text-xs text-gray-400">PNG שקוף, מומלץ 800x800</p>
                </div>
                {uploading && <p className="text-center text-sm mt-2">מעלה תמונה...</p>}
              </div>
              
              {currentItem.imageUrl && (
                <div className="flex items-center justify-center border rounded-lg overflow-hidden bg-gray-50 aspect-square">
                  <img 
                    src={currentItem.imageUrl}
                    alt={currentItem.name || 'Item preview'}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveItem}>
              שמור
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-xl font-bold">פריטי לבוש</h2>
        
        <div className="flex gap-2">
          <Select
            value={filteredCategory}
            onValueChange={setFilteredCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="סנן לפי קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              <SelectItem value="tops">עליונים</SelectItem>
              <SelectItem value="bottoms">תחתונים</SelectItem>
              <SelectItem value="shoes">נעליים</SelectItem>
              <SelectItem value="hats">כובעים</SelectItem>
              <SelectItem value="accessories">אביזרים</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleAddItem}>
            הוסף פריט חדש
          </Button>
          
          {items.length > 0 && (
            <Button variant="destructive" onClick={confirmDeleteAllItems} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              מחק הכל
            </Button>
          )}
        </div>
      </div>
      
      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Shirt className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">אין פריטי לבוש עדיין</h3>
          <p className="mt-1 text-gray-500">לחץ על "הוסף פריט חדש" ליצירת פריט ראשון.</p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="mt-4 text-lg font-medium">אין פריטים בקטגוריה זו</h3>
          <p className="mt-1 text-gray-500">נסה לסנן לפי קטגוריה אחרת או הוסף פריט חדש.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-50 p-4 flex items-center justify-center">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-md">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold truncate">{item.name}</h3>
                  {!item.isActive && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">לא פעיל</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs flex justify-between">
                    <span className="text-gray-500">קטגוריה:</span>
                    <span>{categoryNames[item.category]}</span>
                  </p>
                  <p className="text-xs flex justify-between">
                    <span className="text-gray-500">מתאים ל:</span>
                    <span>
                      {item.type === 'boy' ? 'ילד' : item.type === 'girl' ? 'ילדה' : 'ילד וילדה'}
                    </span>
                  </p>
                  <p className="text-xs flex justify-between">
                    <span className="text-gray-500">עונה:</span>
                    <span>
                      {item.season === 'all' ? 'כל השנה' : item.season === 'summer' ? 'קיץ' : 'חורף'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditItem(item)}
                  >
                    ערוך
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-none"
                    onClick={async () => {
                      if (confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
                        await FashionItem.delete(item.id);
                        loadItems();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את כל פריטי הלבוש?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את כל {items.length} פריטי הלבוש ואינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProgress}>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                deleteAllItems();
              }}
              disabled={deleteProgress}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProgress ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full mr-2"></span>
                  מוחק...
                </>
              ) : (
                "כן, מחק הכל"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}