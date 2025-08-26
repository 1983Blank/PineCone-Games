import React, { useState, useEffect } from 'react';
import { Drawing } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Home, Plus, Edit2, Trash2, Upload, Save, XCircle, Paintbrush, Search, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/api/integrations";

export default function DrawingManager() {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [drawingToDelete, setDrawingToDelete] = useState(null);
  const [svgError, setSvgError] = useState('');
  const [previewPaths, setPreviewPaths] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [svgFileInput, setSvgFileInput] = useState(null);

  useEffect(() => {
    checkPermissions();
    loadDrawings();
  }, []);

  const checkPermissions = async () => {
    try {
      const currentUser = await User.me();
      const isAdminUser = currentUser?.email === 'orenblankmail@gmail.com';
      setIsAdmin(isAdminUser);
      
      if (!isAdminUser) {
        alert('אין לך הרשאות לגשת לדף זה');
        window.location.href = createPageUrl('Home');
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
      window.location.href = createPageUrl('Home');
    }
  };

  const loadDrawings = async () => {
    try {
      setLoading(true);
      const loadedDrawings = await Drawing.list();
      setDrawings(loadedDrawings);
      setLoading(false);
    } catch (err) {
      console.error("Error loading drawings:", err);
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSvgFileInput(file.name);

    try {
      setUploadingFile(true);
      const response = await UploadFile({ file });
      const fileUrl = response.file_url;
      
      // Fetch the SVG content
      const svgResponse = await fetch(fileUrl);
      const svgText = await svgResponse.text();
      
      // Parse SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Extract viewBox
      const svgElement = svgDoc.querySelector('svg');
      const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
      
      // Extract paths
      const pathElements = svgDoc.querySelectorAll('path');
      const paths = Array.from(pathElements).map(path => path.getAttribute('d'));

      if (paths.length === 0) {
        setSvgError('לא נמצאו נתיבי SVG בקובץ');
        setUploadingFile(false);
        return;
      }

      setPreviewPaths(paths);
      setCurrentDrawing(prev => ({
        ...prev,
        paths,
        viewBox
      }));
      setSvgError('');
      setUploadingFile(false);
    } catch (err) {
      console.error("Error processing SVG file:", err);
      setSvgError('שגיאה בעיבוד קובץ ה-SVG');
      setUploadingFile(false);
    }
  };

  const handleNewDrawing = () => {
    setCurrentDrawing({
      name: '',
      category: 'other',
      difficulty: 'medium',
      paths: [],
      isActive: true,
      tags: [],
      viewBox: '0 0 100 100'
    });
    setIsEditing(true);
    setPreviewPaths([]);
    setSvgError('');
    setTagInput('');
    setSvgFileInput(null);
  };

  const handleEditDrawing = (drawing) => {
    setCurrentDrawing({...drawing});
    setIsEditing(true);
    setPreviewPaths(drawing.paths || []);
    setSvgError('');
    setTagInput('');
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    setCurrentDrawing(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()]
    }));
    
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setCurrentDrawing(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveDrawing = async () => {
    try {
      if (!currentDrawing.name) {
        alert('יש למלא שם לציור');
        return;
      }
      
      if (!currentDrawing.paths || currentDrawing.paths.length === 0) {
        alert('יש להעלות קובץ SVG');
        return;
      }

      if (currentDrawing.id) {
        await Drawing.update(currentDrawing.id, currentDrawing);
      } else {
        await Drawing.create(currentDrawing);
      }

      setIsEditing(false);
      setCurrentDrawing(null);
      loadDrawings();
    } catch (err) {
      console.error("Error saving drawing:", err);
      alert('אירעה שגיאה בשמירת הציור');
    }
  };

  const handleDeleteClick = (drawing) => {
    setDrawingToDelete(drawing);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await Drawing.update(drawingToDelete.id, { isActive: false });
      setDeleteConfirmOpen(false);
      setDrawingToDelete(null);
      loadDrawings();
    } catch (err) {
      console.error("Error deleting drawing:", err);
      alert('אירעה שגיאה במחיקת הציור');
    }
  };

  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = drawing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drawing.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || drawing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">גישה נדחתה</h1>
            <p className="mb-4">אין לך הרשאות לגשת לדף זה.</p>
            <Link to={createPageUrl('Home')}>
              <Button>חזור לדף הבית</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            ניהול ציורים
          </h1>
          <div className="flex gap-2">
            <Link to={createPageUrl('Coloring')}>
              <Button variant="outline" className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5" />
                למשחק הצביעה
              </Button>
            </Link>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                חזור לדף הבית
              </Button>
            </Link>
          </div>
        </div>

        {isEditing ? (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {currentDrawing.id ? 'עריכת ציור' : 'ציור חדש'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">שם הציור</label>
                  <Input 
                    value={currentDrawing.name || ''} 
                    onChange={e => setCurrentDrawing({...currentDrawing, name: e.target.value})}
                    placeholder="שם הציור"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">קטגוריה</label>
                  <Select 
                    value={currentDrawing.category || 'other'}
                    onValueChange={value => setCurrentDrawing({...currentDrawing, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="animals">חיות</SelectItem>
                      <SelectItem value="nature">טבע</SelectItem>
                      <SelectItem value="vehicles">כלי רכב</SelectItem>
                      <SelectItem value="buildings">בניינים</SelectItem>
                      <SelectItem value="fantasy">פנטזיה</SelectItem>
                      <SelectItem value="space">חלל</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">רמת קושי</label>
                  <Select 
                    value={currentDrawing.difficulty || 'medium'}
                    onValueChange={value => setCurrentDrawing({...currentDrawing, difficulty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר רמת קושי" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">קל</SelectItem>
                      <SelectItem value="medium">בינוני</SelectItem>
                      <SelectItem value="hard">קשה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">תגיות</label>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      placeholder="הוסף תגית"
                      className="flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button type="button" onClick={handleAddTag}>הוסף</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentDrawing.tags?.map(tag => (
                      <Badge key={tag} className="flex gap-1 items-center px-3 py-1">
                        {tag}
                        <XCircle 
                          className="w-4 h-4 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">העלאת קובץ SVG</label>
                  <div className="flex gap-2 items-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('svg-file-upload').click()}
                    >
                      <Upload className="w-4 h-4" />
                      {!svgFileInput ? 'בחר קובץ SVG' : 'החלף קובץ'}
                    </Button>
                    {svgFileInput && (
                      <span className="text-sm">{svgFileInput}</span>
                    )}
                    <input
                      id="svg-file-upload"
                      type="file"
                      accept=".svg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {uploadingFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                      <span className="text-sm">מעלה קובץ...</span>
                    </div>
                  )}
                  {svgError && (
                    <div className="mt-2 text-red-500 text-sm">{svgError}</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">תצוגה מקדימה</label>
                <div className="border-2 border-gray-200 rounded-lg bg-white aspect-square flex items-center justify-center">
                  {previewPaths.length > 0 ? (
                    <svg 
                      viewBox={currentDrawing.viewBox || "0 0 100 100"} 
                      className="w-full h-full"
                    >
                      {previewPaths.map((path, index) => (
                        <path
                          key={index}
                          d={path}
                          fill="white"
                          stroke="black"
                          strokeWidth="1"
                        />
                      ))}
                    </svg>
                  ) : (
                    <div className="text-center p-8 text-gray-400">
                      <Paintbrush className="w-12 h-12 mx-auto mb-2" />
                      <p>העלה קובץ SVG לתצוגה מקדימה</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setCurrentDrawing(null);
                }}
              >
                ביטול
              </Button>
              <Button onClick={handleSaveDrawing} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                שמור ציור
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6 justify-between">
              <Button 
                onClick={handleNewDrawing}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                הוסף ציור חדש
              </Button>
              
              <div className="flex gap-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="חיפוש ציורים..."
                    className="pr-10"
                  />
                </div>
                
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="כל הקטגוריות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הקטגוריות</SelectItem>
                    <SelectItem value="animals">חיות</SelectItem>
                    <SelectItem value="nature">טבע</SelectItem>
                    <SelectItem value="vehicles">כלי רכב</SelectItem>
                    <SelectItem value="buildings">בניינים</SelectItem>
                    <SelectItem value="fantasy">פנטזיה</SelectItem>
                    <SelectItem value="space">חלל</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredDrawings.length > 0 ? (
                filteredDrawings.map(drawing => (
                  <Card key={drawing.id} className="overflow-hidden">
                    <div className="aspect-square p-4 bg-white border-b flex items-center justify-center">
                      <svg 
                        viewBox={drawing.viewBox || "0 0 100 100"} 
                        className="w-full h-full"
                      >
                        {drawing.paths?.map((path, index) => (
                          <path
                            key={index}
                            d={path}
                            fill="white"
                            stroke="black"
                            strokeWidth="1"
                          />
                        ))}
                      </svg>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{drawing.name}</h3>
                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {drawing.category === 'animals' ? 'חיות' :
                               drawing.category === 'nature' ? 'טבע' :
                               drawing.category === 'vehicles' ? 'כלי רכב' :
                               drawing.category === 'buildings' ? 'בניינים' :
                               drawing.category === 'fantasy' ? 'פנטזיה' :
                               drawing.category === 'space' ? 'חלל' : 'אחר'}
                            </Badge>
                            <Badge variant="outline">
                              {drawing.difficulty === 'easy' ? 'קל' :
                               drawing.difficulty === 'hard' ? 'קשה' : 'בינוני'}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={drawing.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {drawing.isActive ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {drawing.tags?.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditDrawing(drawing)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          ערוך
                        </Button>
                        <Button 
                          variant={drawing.isActive ? "destructive" : "outline"} 
                          size="sm" 
                          onClick={() => handleDeleteClick(drawing)}
                          className="flex items-center gap-1"
                        >
                          {drawing.isActive ? (
                            <>
                              <Trash2 className="w-4 h-4" />
                              הסר
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              שחזר
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Paintbrush className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">אין ציורים</h3>
                  <p className="text-gray-500 mb-4">לחץ על 'הוסף ציור חדש' כדי להתחיל</p>
                  <Button 
                    onClick={handleNewDrawing}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף ציור חדש
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {drawingToDelete?.isActive ? 'הסרת ציור' : 'שחזור ציור'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {drawingToDelete?.isActive 
                ? 'האם אתה בטוח שברצונך להסיר ציור זה? הציור לא יהיה זמין במשחק הצביעה.'
                : 'האם אתה בטוח שברצונך לשחזר ציור זה? הציור יהיה זמין במשחק הצביעה.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-end">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className={drawingToDelete?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {drawingToDelete?.isActive ? 'הסר' : 'שחזר'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}