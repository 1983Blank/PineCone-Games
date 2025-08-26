
import React, { useState, useEffect } from 'react';
import { LiquidGame } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// יש להחליף את שורת הייבוא של Textarea
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Save, XCircle, ArrowUpDown, Beaker, Languages } from "lucide-react";

export default function LiquidManager() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("levels");

  const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      setLoading(true);
      const loadedLevels = await LiquidGame.list();
      setLevels(loadedLevels.sort((a, b) => a.order - b.order));
      setLoading(false);
    } catch (err) {
      console.error("Error loading levels:", err);
      setLoading(false);
    }
  };

  const handleNewLevel = () => {
    setCurrentLevel({
      level: levels.length + 1,
      title: '',
      title_en: '',
      description: '',
      description_en: '',
      difficulty: 'medium',
      maxMoves: 10,
      tubes: [
        { id: 'tube1', capacity: 4, contents: [] },
        { id: 'tube2', capacity: 4, contents: [] },
        { id: 'tube3', capacity: 4, contents: [] }
      ],
      isActive: true,
      order: levels.length + 1
    });
    setIsEditing(true);
  };

  const handleEditLevel = (level) => {
    setCurrentLevel({...level});
    setIsEditing(true);
  };

  const handleSaveLevel = async () => {
    try {
      if (currentLevel.id) {
        await LiquidGame.update(currentLevel.id, currentLevel);
      } else {
        await LiquidGame.create(currentLevel);
      }
      setIsEditing(false);
      loadLevels();
    } catch (err) {
      console.error("Error saving level:", err);
      alert('שגיאה בשמירת השלב');
    }
  };

  const confirmDeleteLevel = (level) => {
    setLevelToDelete(level);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteLevel = async () => {
    try {
      await LiquidGame.update(levelToDelete.id, { isActive: false });
      setDeleteConfirmOpen(false);
      loadLevels();
    } catch (err) {
      console.error("Error deleting level:", err);
      alert('שגיאה במחיקת השלב');
    }
  };

  const addTube = () => {
    setCurrentLevel(prev => ({
      ...prev,
      tubes: [
        ...prev.tubes,
        {
          id: `tube${prev.tubes.length + 1}`,
          capacity: 4,
          contents: []
        }
      ]
    }));
  };

  const removeTube = (index) => {
    setCurrentLevel(prev => ({
      ...prev,
      tubes: prev.tubes.filter((_, i) => i !== index)
    }));
  };

  const updateTubeContent = (tubeIndex, colorIndex, color) => {
    const newTubes = [...currentLevel.tubes];
    const tube = {...newTubes[tubeIndex]};
    const contents = [...tube.contents];
    if (color === '') {
      contents.splice(colorIndex, 1);
    } else {
      contents[colorIndex] = color;
    }
    tube.contents = contents;
    newTubes[tubeIndex] = tube;
    setCurrentLevel({...currentLevel, tubes: newTubes});
  };

  const renderTubePreview = (tube) => {
    return (
      <div className="w-12 h-48 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden relative">
        {tube.contents.map((color, index) => (
          <div
            key={index}
            className="w-full"
            style={{
              backgroundColor: color,
              height: `${100 / tube.capacity}%`,
              position: 'absolute',
              bottom: `${(index * 100) / tube.capacity}%`,
              opacity: 0.8
            }}
          />
        ))}
      </div>
    );
  };

  const updateLevelTranslations = async (level) => {
    try {
      if (!level.id) return;
      await LiquidGame.update(level.id, {
        title_en: level.title_en,
        description_en: level.description_en
      });
      loadLevels();
      alert('התרגומים נשמרו בהצלחה');
    } catch (err) {
      console.error("Error updating translations:", err);
      alert('שגיאה בשמירת התרגומים');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>ניהול משחק הנוזלים</span>
          <div className="flex gap-2">
            {activeTab === "levels" && (
              <Button onClick={handleNewLevel}>
                <Plus className="w-4 h-4 ml-2" />
                שלב חדש
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="levels">שלבים</TabsTrigger>
            <TabsTrigger value="translations">תרגומים</TabsTrigger>
          </TabsList>

          <TabsContent value="levels">
            {isEditing ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {currentLevel.id ? 'עריכת שלב' : 'שלב חדש'}
                  </h3>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    <XCircle className="w-4 h-4 ml-2" />
                    ביטול
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">מספר שלב</label>
                      <Input
                        type="number"
                        value={currentLevel.level}
                        onChange={(e) => setCurrentLevel({...currentLevel, level: parseInt(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">כותרת (עברית)</label>
                      <Input
                        value={currentLevel.title}
                        onChange={(e) => setCurrentLevel({...currentLevel, title: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">כותרת (אנגלית)</label>
                      <Input
                        value={currentLevel.title_en || ''}
                        onChange={(e) => setCurrentLevel({...currentLevel, title_en: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">תיאור (עברית)</label>
                      <Input
                        value={currentLevel.description || ''}
                        onChange={(e) => setCurrentLevel({...currentLevel, description: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">תיאור (אנגלית)</label>
                      <Input
                        value={currentLevel.description_en || ''}
                        onChange={(e) => setCurrentLevel({...currentLevel, description_en: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">רמת קושי</label>
                      <Select
                        value={currentLevel.difficulty}
                        onValueChange={(value) => setCurrentLevel({...currentLevel, difficulty: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">קל</SelectItem>
                          <SelectItem value="medium">בינוני</SelectItem>
                          <SelectItem value="hard">קשה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">מהלכים מקסימליים</label>
                      <Input
                        type="number"
                        value={currentLevel.maxMoves}
                        onChange={(e) => setCurrentLevel({...currentLevel, maxMoves: parseInt(e.target.value)})}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">סדר הצגה</label>
                      <Input
                        type="number"
                        value={currentLevel.order}
                        onChange={(e) => setCurrentLevel({...currentLevel, order: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">מבחנות</label>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4">
                        {currentLevel.tubes.map((tube, tubeIndex) => (
                          <div key={tube.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">מבחנה {tubeIndex + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTube(tubeIndex)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                            {renderTubePreview(tube)}
                            <div className="space-y-1">
                              {Array.from({ length: tube.capacity }).map((_, colorIndex) => (
                                <Select
                                  key={colorIndex}
                                  value={tube.contents[colorIndex] || ''}
                                  onValueChange={(color) => updateTubeContent(tubeIndex, colorIndex, color)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={null}>ריק</SelectItem>
                                    {COLORS.map(color => (
                                      <SelectItem key={color} value={color}>
                                        <div className="flex items-center">
                                          <div 
                                            className="w-4 h-4 rounded-full mr-2"
                                            style={{ backgroundColor: color }}
                                          />
                                          {color}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" onClick={addTube}>
                        <Plus className="w-4 h-4 ml-2" />
                        הוסף מבחנה
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveLevel}>
                    <Save className="w-4 h-4 ml-2" />
                    שמור שלב
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {levels.length === 0 ? (
                  <div className="text-center py-8">
                    <Beaker className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">לא נמצאו שלבים. צור שלב חדש כדי להתחיל.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {levels.map((level) => (
                      <Card key={level.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">
                                  שלב {level.level}: {level.title}
                                </h3>
                                <Badge className={
                                  level.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                  level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {level.difficulty === 'easy' ? 'קל' :
                                   level.difficulty === 'medium' ? 'בינוני' : 'קשה'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">{level.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>מהלכים: {level.maxMoves}</span>
                                <span>מבחנות: {level.tubes.length}</span>
                                <span>סדר: {level.order}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLevel(level)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDeleteLevel(level)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="translations">
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4">ניהול תרגומים</h3>
              
              {levels.length === 0 ? (
                <div className="text-center py-8">
                  <Languages className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">לא נמצאו שלבים לתרגום.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {levels.map((level) => (
                    <Card key={level.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">
                              שלב {level.level}: {level.title}
                            </h3>
                            <Badge className={
                              level.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {level.difficulty === 'easy' ? 'קל' :
                               level.difficulty === 'medium' ? 'בינוני' : 'קשה'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium mb-1">תוכן בעברית:</h4>
                              <div className="p-3 bg-gray-50 rounded-md">
                                <p className="font-medium">{level.title}</p>
                                <p className="text-sm text-gray-500 mt-1">{level.description}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">כותרת באנגלית:</label>
                                <Input
                                  value={level.title_en || ''}
                                  onChange={(e) => {
                                    const updatedLevels = levels.map(l => {
                                      if (l.id === level.id) {
                                        return {...l, title_en: e.target.value};
                                      }
                                      return l;
                                    });
                                    setLevels(updatedLevels);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">תיאור באנגלית:</label>
                                <Textarea
                                  value={level.description_en || ''}
                                  onChange={(e) => {
                                    const updatedLevels = levels.map(l => {
                                      if (l.id === level.id) {
                                        return {...l, description_en: e.target.value};
                                      }
                                      return l;
                                    });
                                    setLevels(updatedLevels);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex justify-end">
                                <Button 
                                  size="sm"
                                  onClick={() => updateLevelTranslations(level)}
                                >
                                  <Save className="w-4 h-4 ml-2" />
                                  שמור תרגום
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת שלב</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את שלב {levelToDelete?.level}?
              פעולה זו תסתיר את השלב מהמשחק.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLevel} className="bg-red-500 hover:bg-red-600">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
