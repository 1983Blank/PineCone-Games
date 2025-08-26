import React, { useState, useEffect } from 'react';
import { GameType } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Gamepad2, Plus, Save, Trash2, RefreshCw } from "lucide-react";

export default function GameManager() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentGame, setCurrentGame] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [gameToDelete, setGameToDelete] = useState(null);
    const [loadingRestoreDefaults, setLoadingRestoreDefaults] = useState(false);

    // רשימת משחקים לדוגמה עם כל השדות הדרושים
    const sampleGames = [
        {
            name: "משחק הזיכרון",
            name_en: "Memory Game",
            route: "Game",
            icon: "Target",
            description: "משחק זיכרון קלאסי עם קלפים",
            description_en: "Classic memory card game",
            isActive: true,
            adminOnly: false,
            order: 1
        },
        {
            name: "איקס עיגול",
            name_en: "Tic Tac Toe",
            route: "TicTacToe",
            icon: "Grid3x3",
            description: "משחק איקס עיגול קלאסי",
            description_en: "Classic tic tac toe game",
            isActive: true,
            adminOnly: false,
            order: 2
        },
        {
            name: "טטריס",
            name_en: "Tetris",
            route: "Tetris",
            icon: "LayoutIcon",
            description: "משחק טטריס קלאסי",
            description_en: "Classic tetris game",
            isActive: true,
            adminOnly: false,
            order: 3
        },
        {
            name: "לוח הכפל",
            name_en: "Multiplication Table",
            route: "Multiplication",
            icon: "Calculator",
            description: "תרגול לוח הכפל",
            description_en: "Practice multiplication",
            isActive: true,
            adminOnly: false,
            order: 4
        },
        {
            name: "משחק הלבשה",
            name_en: "Fashion Game",
            route: "Fashion",
            icon: "Shirt",
            description: "משחק הלבשה ואופנה",
            description_en: "Fashion and dress up game",
            isActive: false,
            adminOnly: true,
            order: 5
        },
        {
            name: "ארבע בשורה",
            name_en: "Connect Four",
            route: "ConnectFour",
            icon: "Hash",
            description: "משחק ארבע בשורה קלאסי",
            description_en: "Classic connect four game",
            isActive: true,
            adminOnly: false,
            order: 7
        },
        {
            name: "משחק צביעה",
            name_en: "Coloring Game",
            route: "Coloring",
            icon: "Paintbrush",
            description: "משחק צביעה והשלמת תמונות",
            description_en: "Coloring and completing pictures",
            isActive: true,
            adminOnly: false,
            order: 8
        },
        {
            name: "משחק הנוזלים",
            name_en: "Liquid Sort",
            route: "LiquidSort",
            icon: "Beaker",
            description: "משחק מיון נוזלים צבעוניים",
            description_en: "Sort colorful liquids",
            isActive: true,
            adminOnly: false,
            order: 9
        },
        {
            name: "שובר הלבנים",
            name_en: "Brick Breaker",
            route: "BrickBreaker",
            icon: "Grid3x3",
            description: "נפץ את הלבנים וצבור נקודות",
            description_en: "Break bricks and score points",
            isActive: true,
            adminOnly: false,
            order: 10
        },
        {
            name: "עיצוב ציפורניים",
            name_en: "Nail Design",
            route: "Nails",
            icon: "Target",
            description: "משחק עיצוב ציפורניים",
            description_en: "Nail design game",
            isActive: false,
            adminOnly: true,
            order: 11
        }
    ];

    // שחזור משחקים חסרים ותיקון שדות חסרים במשחקים קיימים
    const handleRestoreDefaultGames = async () => {
        if (!confirm('האם אתה בטוח שברצונך לשחזר את רשימת המשחקים? פעולה זו תעדכן את המשחקים הקיימים ותוסיף משחקים חסרים.')) {
            return;
        }
        
        try {
            setLoadingRestoreDefaults(true);
            // קבל את כל המשחקים שקיימים במסד הנתונים
            const existingGames = await GameType.list();
            
            // נקה כפילויות אם קיימות
            // צור מפתח ייחודי לכל משחק
            const existingRoutes = {};
            const gamesToDelete = [];
            
            existingGames.forEach(game => {
                // אם המסלול כבר קיים, זה כפילות
                if (existingRoutes[game.route]) {
                    gamesToDelete.push(game.id);
                } else {
                    existingRoutes[game.route] = game;
                }
            });
            
            // מחק כפילויות
            for (const gameId of gamesToDelete) {
                console.log(`Deleting duplicate game with ID: ${gameId}`);
                await GameType.delete(gameId);
            }
            
            // עדכן משחקים קיימים ויצירת משחקים חדשים
            for (const sampleGame of sampleGames) {
                const existingGame = existingRoutes[sampleGame.route];
                
                if (existingGame) {
                    // וודא שכל השדות הדרושים קיימים
                    const updatedGame = {
                        ...existingGame,
                        name_en: existingGame.name_en || sampleGame.name_en,
                        description_en: existingGame.description_en || sampleGame.description_en
                    };
                    
                    console.log(`Updating existing game: ${updatedGame.name}`);
                    await GameType.update(existingGame.id, updatedGame);
                } else {
                    // צור משחק חדש
                    console.log(`Creating new game: ${sampleGame.name}`);
                    await GameType.create(sampleGame);
                }
            }
            
            alert('רשימת המשחקים עודכנה בהצלחה!');
            loadGames();
        } catch (err) {
            console.error("Error restoring default games:", err);
            alert('אירעה שגיאה בשחזור רשימת המשחקים: ' + err.message);
        } finally {
            setLoadingRestoreDefaults(false);
        }
    };
    
    useEffect(() => {
        loadGames();
    }, []);

    // עדכון פונקציית טעינת המשחקים למניעת כפילויות
    const loadGames = async () => {
        try {
            setLoading(true);
            const loadedGames = await GameType.list();
            
            // מניעת כפילויות - השאר רק משחק אחד לכל נתיב
            const uniqueGames = {};
            loadedGames.forEach(game => {
                // אם יש כבר משחק עם אותו route, שמור רק את זה עם ה-id
                if (!uniqueGames[game.route] || game.id) {
                    uniqueGames[game.route] = game;
                }
            });
            
            // המר את האובייקט חזרה למערך
            const filteredGames = Object.values(uniqueGames);
            
            // בדוק אם יש משחקים עם שדות חסרים
            const gamesWithMissingFields = filteredGames.filter(
                game => !game.name_en || !game.description_en
            );
            
            if (gamesWithMissingFields.length > 0) {
                console.warn("נמצאו משחקים עם שדות חסרים:", gamesWithMissingFields);
            }
            
            setGames(filteredGames.sort((a, b) => (a.order || 999) - (b.order || 999)));
            setLoading(false);
        } catch (err) {
            console.error("Error loading games:", err);
            setLoading(false);
        }
    };

    const icons = [
        { value: "Target", label: "Target" },
        { value: "Grid3x3", label: "Grid" },
        { value: "LayoutIcon", label: "Layout" },
        { value: "Calculator", label: "Calculator" },
        { value: "Shirt", label: "Fashion" },
        { value: "Hash", label: "Hash" },
        { value: "Paintbrush", label: "Paint" },
        { value: "Beaker", label: "Beaker" },
        { value: "Nail", label: "Nail" }
    ];

    const handleNewGame = () => {
        setCurrentGame({
            name: '',
            name_en: '',
            route: '',
            icon: 'Gamepad2',
            description: '',
            description_en: '',
            isActive: false,
            adminOnly: false,
            order: games.length + 1
        });
        setIsEditing(true);
    };

    const handleEditGame = (game) => {
        setCurrentGame({...game});
        setIsEditing(true);
    };

    const handleSaveGame = async () => {
        try {
            // Validate required fields
            if (!currentGame.name || !currentGame.name_en || !currentGame.route || !currentGame.icon) {
                alert('יש למלא את כל השדות החובה: שם בעברית, שם באנגלית, נתיב ואייקון');
                return;
            }

            // Make sure we have all required fields
            const gameData = {
                ...currentGame,
                name: currentGame.name || '',
                name_en: currentGame.name_en || '',
                route: currentGame.route || '',
                icon: currentGame.icon || 'Gamepad2',
                description: currentGame.description || '',
                description_en: currentGame.description_en || '',
                isActive: Boolean(currentGame.isActive),
                adminOnly: Boolean(currentGame.adminOnly),
                order: currentGame.order || (games.length + 1)
            };

            if (currentGame.id) {
                await GameType.update(currentGame.id, gameData);
            } else {
                await GameType.create(gameData);
            }
            setIsEditing(false);
            loadGames();
        } catch (err) {
            console.error("Error saving game:", err);
            alert('שגיאה בשמירת המשחק: ' + (err.response?.data?.message || err.message));
        }
    };

    const confirmDeleteGame = (game) => {
        setGameToDelete(game);
        setDeleteDialogOpen(true);
    };

    const handleDeleteGame = async () => {
        try {
            await GameType.delete(gameToDelete.id);
            setDeleteDialogOpen(false);
            loadGames();
        } catch (err) {
            console.error("Error deleting game:", err);
            alert('שגיאה במחיקת המשחק');
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
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label>שם המשחק (עברית) <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentGame.name}
                                onChange={(e) => setCurrentGame({...currentGame, name: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div>
                            <Label>שם המשחק (אנגלית) <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentGame.name_en}
                                onChange={(e) => setCurrentGame({...currentGame, name_en: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label>נתיב המשחק <span className="text-red-500">*</span></Label>
                            <Input
                                value={currentGame.route}
                                onChange={(e) => setCurrentGame({...currentGame, route: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <Label>אייקון <span className="text-red-500">*</span></Label>
                            <Select
                                value={currentGame.icon}
                                onValueChange={(value) => setCurrentGame({...currentGame, icon: value})}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {icons.map(icon => (
                                        <SelectItem key={icon.value} value={icon.value}>
                                            {icon.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>תיאור (עברית)</Label>
                            <Input
                                value={currentGame.description || ''}
                                onChange={(e) => setCurrentGame({...currentGame, description: e.target.value})}
                            />
                        </div>

                        <div>
                            <Label>תיאור (אנגלית)</Label>
                            <Input
                                value={currentGame.description_en || ''}
                                onChange={(e) => setCurrentGame({...currentGame, description_en: e.target.value})}
                            />
                        </div>

                        <div>
                            <Label>סדר הצגה</Label>
                            <Input
                                type="number"
                                value={currentGame.order || ''}
                                onChange={(e) => setCurrentGame({...currentGame, order: parseInt(e.target.value) || games.length + 1})}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Switch
                                checked={currentGame.isActive}
                                onCheckedChange={(checked) => setCurrentGame({...currentGame, isActive: checked})}
                            />
                            <Label>פעיל</Label>
                        </div>

                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <Switch
                                checked={currentGame.adminOnly}
                                onCheckedChange={(checked) => setCurrentGame({...currentGame, adminOnly: checked})}
                            />
                            <Label>למנהלים בלבד</Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                            ביטול
                        </Button>
                        <Button onClick={handleSaveGame}>
                            <Save className="w-4 h-4 mr-2" />
                            שמור
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">ניהול משחקים</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRestoreDefaultGames} disabled={loadingRestoreDefaults}>
                        {loadingRestoreDefaults ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        נקה כפילויות ועדכן משחקים
                    </Button>
                    <Button onClick={handleNewGame}>
                        <Plus className="w-4 h-4 mr-2" />
                        הוסף משחק
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => (
                    <Card key={game.id || game.route}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold">{game.name}</h3>
                                    <p className="text-sm text-gray-500">{game.name_en}</p>
                                </div>
                                <div className="space-x-1 rtl:space-x-reverse">
                                    {game.adminOnly && (
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">מנהלים</span>
                                    )}
                                    {game.isActive ? (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">פעיל</span>
                                    ) : (
                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">לא פעיל</span>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm mb-2">{game.description}</p>
                            <p className="text-sm text-gray-500 mb-4">{game.description_en}</p>

                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleEditGame(game)}
                                >
                                    ערוך
                                </Button>
                                <Button 
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => confirmDeleteGame(game)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את המשחק?</AlertDialogTitle>
                        <AlertDialogDescription>
                            פעולה זו תמחק את המשחק לצמיתות.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteGame}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}