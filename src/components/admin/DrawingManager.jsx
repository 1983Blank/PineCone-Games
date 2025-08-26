import React, { useState, useEffect } from 'react';
import { Drawing } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Upload, Save, XCircle, Search, Check, FileText, RefreshCw } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";

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
  const [csvFileUrl, setCsvFileUrl] = useState(null);
  const [processingCsv, setProcessingCsv] = useState(false);
  const [csvDrawings, setCsvDrawings] = useState([]);
  const [currentCsvDrawingIndex, setCurrentCsvDrawingIndex] = useState(0);
  const [csvProcessingStatus, setCsvProcessingStatus] = useState({ total: 0, processed: 0 });
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  useEffect(() => {
    loadDrawings();
  }, []);

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

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setProcessingCsv(true);
      
      // Upload the CSV file
      const uploadResponse = await UploadFile({ file });
      const fileUrl = uploadResponse.file_url;
      setCsvFileUrl(fileUrl);
      
      // Define the schema for the CSV data
      const csvSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            svgPaths: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "string" }
          }
        }
      };
      
      // Extract data from the CSV
      const extractResponse = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: csvSchema
      });
      
      if (extractResponse.status === "success" && extractResponse.output) {
        // Clean and transform the data
        const processedDrawings = extractResponse.output.map(item => {
          let paths = [];
          try {
            paths = item.svgPaths ? JSON.parse(item.svgPaths) : [];
            if (!Array.isArray(paths)) {
              paths = [item.svgPaths];
            }
          } catch (err) {
            paths = [item.svgPaths];
          }
          
          return {
            name: item.name || "ציור חדש",
            category: item.category || "other",
            difficulty: item.difficulty || "medium",
            paths: paths,
            viewBox: "0 0 100 100",
            isActive: true,
            tags: []
          };
        }).filter(item => item.paths.length > 0);
        
        setCsvDrawings(processedDrawings);
        setCsvProcessingStatus({ total: processedDrawings.length, processed: 0 });
        setCurrentCsvDrawingIndex(0);
        setCsvDialogOpen(true);
      } else {
        console.error("Error extracting data:", extractResponse);
        alert("שגיאה בעיבוד קובץ ה-CSV");
      }
      
      setProcessingCsv(false);
    } catch (err) {
      console.error("Error processing CSV:", err);
      alert("שגיאה בעיבוד קובץ ה-CSV");
      setProcessingCsv(false);
    }
  };

  const handleSaveCsvDrawing = async () => {
    if (!csvDrawings.length || currentCsvDrawingIndex >= csvDrawings.length) {
      setCsvDialogOpen(false);
      return;
    }
    
    try {
      const currentDrawing = csvDrawings[currentCsvDrawingIndex];
      await Drawing.create(currentDrawing);
      
      const newStatus = {
        total: csvProcessingStatus.total,
        processed: csvProcessingStatus.processed + 1
      };
      setCsvProcessingStatus(newStatus);
      
      if (currentCsvDrawingIndex < csvDrawings.length - 1) {
        setCurrentCsvDrawingIndex(prev => prev + 1);
      } else {
        setCsvDialogOpen(false);
        loadDrawings();
      }
    } catch (err) {
      console.error("Error saving drawing:", err);
      alert("שגיאה בשמירת הציור");
    }
  };

  const handleSkipCsvDrawing = () => {
    if (currentCsvDrawingIndex < csvDrawings.length - 1) {
      setCurrentCsvDrawingIndex(prev => prev + 1);
    } else {
      setCsvDialogOpen(false);
      loadDrawings();
    }
  };

  const handleSaveAllCsvDrawings = async () => {
    try {
      for (let i = currentCsvDrawingIndex; i < csvDrawings.length; i++) {
        await Drawing.create(csvDrawings[i]);
      }
      setCsvProcessingStatus({
        total: csvProcessingStatus.total,
        processed: csvProcessingStatus.total
      });
      setCsvDialogOpen(false);
      loadDrawings();
    } catch (err) {
      console.error("Error saving drawings:", err);
      alert("שגיאה בשמירת הציורים");
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
    setPreviewPaths([]);
    setIsEditing(true);
    setSvgFileInput(null);
  };

  const handleEditDrawing = (drawing) => {
    setCurrentDrawing({...drawing});
    setPreviewPaths(drawing.paths || []);
    setIsEditing(true);
    setSvgFileInput(null);
  };

  const handleSaveDrawing = async () => {
    if (!currentDrawing.name) {
      alert('יש להזין שם לציור');
      return;
    }

    if (!currentDrawing.paths || currentDrawing.paths.length === 0) {
      alert('יש להעלות קובץ SVG');
      return;
    }

    try {
      if (currentDrawing.id) {
        await Drawing.update(currentDrawing.id, currentDrawing);
      } else {
        await Drawing.create(currentDrawing);
      }
      setIsEditing(false);
      loadDrawings();
    } catch (err) {
      console.error('Error saving drawing:', err);
      alert('שגיאה בשמירת הציור');
    }
  };

  const confirmDeleteDrawing = (drawing) => {
    setDrawingToDelete(drawing);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteDrawing = async () => {
    try {
      await Drawing.update(drawingToDelete.id, { isActive: false });
      setDeleteConfirmOpen(false);
      loadDrawings();
    } catch (err) {
      console.error('Error deleting drawing:', err);
      alert('שגיאה במחיקת הציור');
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    setCurrentDrawing(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()]
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setCurrentDrawing(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const filteredDrawings = drawings.filter(drawing => {
    let match = drawing.isActive !== false;
    
    if (searchTerm) {
      match = match && (
        drawing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (drawing.tags && drawing.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    if (selectedCategory !== 'all') {
      match = match && drawing.category === selectedCategory;
    }
    
    return match;
  });

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
            <span>{currentDrawing.id ? 'עריכת ציור' : 'יצירת ציור חדש'}</span>
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
                <label className="block text-sm font-medium mb-1">שם הציור</label>
                <Input
                  value={currentDrawing.name || ''}
                  onChange={(e) => setCurrentDrawing({...currentDrawing, name: e.target.value})}
                  placeholder="הזן שם לציור"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">קטגוריה</label>
                <Select
                  value={currentDrawing.category || 'other'}
                  onValueChange={(value) => setCurrentDrawing({...currentDrawing, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="animals">חיות</SelectItem>
                    <SelectItem value="nature">טבע</SelectItem>
                    <SelectItem value="vehicles">כלי תחבורה</SelectItem>
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
                  onValueChange={(value) => setCurrentDrawing({...currentDrawing, difficulty: value})}
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
                <label className="block text-sm font-medium mb-1">העלאת קובץ SVG</label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".svg"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  {uploadingFile && (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
                  )}
                </div>
                {svgFileInput && (
                  <div className="mt-1 text-sm text-green-600">
                    קובץ נבחר: {svgFileInput}
                  </div>
                )}
                {svgError && (
                  <div className="mt-1 text-sm text-red-600">
                    {svgError}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">תגיות</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="הכנס תגית"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(currentDrawing.tags || []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <XCircle
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">תצוגה מקדימה</label>
                <div className="border rounded-lg bg-gray-50 p-4 h-80 overflow-hidden">
                  {previewPaths.length > 0 ? (
                    <svg
                      viewBox={currentDrawing.viewBox || "0 0 100 100"}
                      className="w-full h-full"
                    >
                      {previewPaths.map((path, index) => (
                        <path
                          key={index}
                          d={path}
                          fill="none"
                          stroke="black"
                          strokeWidth="1"
                        />
                      ))}
                    </svg>
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
            <Button onClick={handleSaveDrawing}>
              <Save className="w-4 h-4 ml-2" />
              שמור ציור
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
          <span>ניהול ציורים למשחק הצביעה</span>
          <div className="flex gap-2">
            <Button onClick={handleNewDrawing}>
              <Plus className="w-4 h-4 ml-2" />
              ציור חדש
            </Button>
            <div className="relative">
              <Input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                id="csv-upload"
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('csv-upload').click()}
                disabled={processingCsv}
              >
                {processingCsv ? (
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 ml-2" />
                )}
                העלאת CSV
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="חיפוש ציורים..."
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
              <SelectItem value="nature">טבע</SelectItem>
              <SelectItem value="vehicles">כלי תחבורה</SelectItem>
              <SelectItem value="buildings">בניינים</SelectItem>
              <SelectItem value="fantasy">פנטזיה</SelectItem>
              <SelectItem value="space">חלל</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrawings.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              לא נמצאו ציורים
            </div>
          ) : (
            filteredDrawings.map((drawing) => (
              <Card key={drawing.id} className="overflow-hidden">
                <div className="p-4 border-b bg-gray-50 h-40 flex items-center justify-center">
                  <svg
                    viewBox={drawing.viewBox || "0 0 100 100"}
                    className="max-w-full max-h-full"
                    style={{ maxHeight: "120px" }}
                  >
                    {drawing.paths && drawing.paths.map((path, index) => (
                      <path
                        key={index}
                        d={path}
                        fill="none"
                        stroke="black"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-1">{drawing.name}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="outline">
                      {drawing.category === 'animals' && 'חיות'}
                      {drawing.category === 'nature' && 'טבע'}
                      {drawing.category === 'vehicles' && 'כלי תחבורה'}
                      {drawing.category === 'buildings' && 'בניינים'}
                      {drawing.category === 'fantasy' && 'פנטזיה'}
                      {drawing.category === 'space' && 'חלל'}
                      {drawing.category === 'other' && 'אחר'}
                    </Badge>
                    <Badge variant={drawing.difficulty === 'easy' ? 'success' : drawing.difficulty === 'medium' ? 'warning' : 'destructive'}>
                      {drawing.difficulty === 'easy' && 'קל'}
                      {drawing.difficulty === 'medium' && 'בינוני'}
                      {drawing.difficulty === 'hard' && 'קשה'}
                    </Badge>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEditDrawing(drawing)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => confirmDeleteDrawing(drawing)}>
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
              פעולה זו תסיר את הציור מהמערכת ולא ניתן יהיה לשחזר אותו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDrawing} className="bg-red-500 hover:bg-red-600">
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>יבוא ציורים מקובץ CSV</AlertDialogTitle>
            <AlertDialogDescription>
              נמצאו {csvDrawings.length} ציורים בקובץ. נא לאשר כל ציור או לדלג עליו.
              <div className="mt-2">
                מעובדים: {csvProcessingStatus.processed} מתוך {csvProcessingStatus.total}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {csvDrawings.length > 0 && currentCsvDrawingIndex < csvDrawings.length && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="font-bold mb-2">ציור {currentCsvDrawingIndex + 1} / {csvDrawings.length}</h3>
                <div className="mb-2">
                  <span className="font-medium">שם:</span> {csvDrawings[currentCsvDrawingIndex].name}
                </div>
                <div className="mb-2">
                  <span className="font-medium">קטגוריה:</span> {csvDrawings[currentCsvDrawingIndex].category}
                </div>
                <div className="mb-2">
                  <span className="font-medium">רמת קושי:</span> {csvDrawings[currentCsvDrawingIndex].difficulty}
                </div>
              </div>
              <div className="border rounded-lg bg-gray-50 p-4 h-80 overflow-hidden">
                <svg
                  viewBox={csvDrawings[currentCsvDrawingIndex].viewBox}
                  className="w-full h-full"
                >
                  {csvDrawings[currentCsvDrawingIndex].paths.map((path, index) => (
                    <path
                      key={index}
                      d={path}
                      fill="none"
                      stroke="black"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
              ביטול
            </Button>
            <Button variant="outline" onClick={handleSkipCsvDrawing}>
              דלג על ציור זה
            </Button>
            <Button onClick={handleSaveCsvDrawing}>
              שמור ציור
            </Button>
            <Button onClick={handleSaveAllCsvDrawings}>
              שמור את כל הציורים
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}