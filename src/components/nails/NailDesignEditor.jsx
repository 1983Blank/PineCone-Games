import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { NailDesign } from "@/api/entities";
import { GamePlayer } from "@/api/entities";

// Define nail positions based on the original HTML
const NAIL_POSITIONS = {
    'adult-female': [
        { width: 38, height: 32, left: 63, top: 30, rotation: -8 },
        { width: 40, height: 34, left: 115, top: 10, rotation: -3 },
        { width: 42, height: 36, left: 169, top: 8, rotation: 0 },
        { width: 38, height: 32, left: 223, top: 15, rotation: 5 },
        { width: 34, height: 28, left: 265, top: 38, rotation: 10 }
    ],
    'child': [
        { width: 30, height: 26, left: 75, top: 50, rotation: -8 },
        { width: 32, height: 28, left: 122, top: 30, rotation: -3 },
        { width: 35, height: 30, left: 172, top: 25, rotation: 0 },
        { width: 32, height: 28, left: 220, top: 35, rotation: 5 },
        { width: 28, height: 25, left: 260, top: 50, rotation: 10 }
    ]
};

// Define colors based on the original HTML
const COLORS = [
    '#ff0000', '#ff69b4', '#ff4500', '#ffd700', 
    '#9acd32', '#00ff00', '#00ffff', '#0000ff', 
    '#8a2be2', '#ff00ff', '#800080', '#000000',
    '#ffffff', '#c0c0c0', '#ffc0cb', '#f5deb3',
    '#8B4513', '#32CD32', '#4B0082', '#40E0D0',
    '#FF1493', '#FFD700', '#7B68EE', '#DC143C',
    '#00BFFF', '#FF8C00', '#6A5ACD', '#B22222'
];

// Define stickers
const STICKERS = [
    "❤️", "⭐", "🌸", "🦄", "🌈", "💎", "🌟", "🦋", 
    "🎀", "💖", "✨", "🌼", "🍭", "🧁", "🍓", "🍒"
];

// Define brush sizes
const BRUSH_SIZES = {
    small: 6,
    medium: 10,
    large: 14
};

// Define effects
const EFFECTS = [
    { id: "none", icon: "🔄" },
    { id: "glitter", icon: "✨" },
    { id: "matte", icon: "M" },
    { id: "gradient", icon: "🌈" },
    { id: "metallic", icon: "⚙️" },
    { id: "holographic", icon: "💿" },
    { id: "neon", icon: "🔆" }
];

// Define shapes
const SHAPES = ["natural", "square", "almond", "stiletto", "coffin"];

export default function NailDesignEditor({ player, language, onFinish }) {
    // State for the design tools
    const [selectedTab, setSelectedTab] = useState("tools");
    const [selectedTool, setSelectedTool] = useState("brush");
    const [selectedColor, setSelectedColor] = useState("#ff69b4");
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [selectedEffect, setSelectedEffect] = useState("none");
    const [selectedShape, setSelectedShape] = useState("natural");
    const [brushSize, setBrushSize] = useState("medium");
    const [handType, setHandType] = useState("adult-female");
    
    // State for the nail painting
    const [nails, setNails] = useState([
        { id: 0, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
        { id: 1, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
        { id: 2, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
        { id: 3, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
        { id: 4, color: null, effect: null, shape: "natural", segments: [], stickers: [] }
    ]);
    const [isPainting, setIsPainting] = useState(false);
    const [currentNailIndex, setCurrentNailIndex] = useState(null);
    const [showBottle, setShowBottle] = useState(true);
    const [bottlePosition, setBottlePosition] = useState({ x: 20, y: 20 });
    const [isDraggingBottle, setIsDraggingBottle] = useState(false);
    const [bottleRotation, setBottleRotation] = useState(0);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [designName, setDesignName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [particles, setParticles] = useState([]);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [score, setScore] = useState(0);
    
    // Refs
    const handRef = useRef(null);
    const bottleRef = useRef(null);
    const brushRef = useRef(null);

    useEffect(() => {
        // Automatically calculate score based on design complexity
        const calculateScore = () => {
            let totalScore = 0;
            let decoratedNails = 0;
            
            nails.forEach(nail => {
                if (nail.color || nail.segments.length > 0) {
                    decoratedNails++;
                    
                    // Points for base color
                    if (nail.color) totalScore += 10;
                    
                    // Points for segments (brush strokes)
                    totalScore += nail.segments.length;
                    
                    // Points for stickers
                    totalScore += nail.stickers.length * 5;
                    
                    // Points for effects
                    if (nail.effect && nail.effect !== "none") totalScore += 15;
                    
                    // Points for shape change
                    if (nail.shape && nail.shape !== "natural") totalScore += 10;
                }
            });
            
            // Bonus for completing all nails
            if (decoratedNails === 5) totalScore += 50;
            
            setScore(totalScore);
        };
        
        calculateScore();
    }, [nails]);
    
    const handleMouseMove = (e) => {
        // Move brush with mouse when painting
        if (brushRef.current && (selectedTool === "brush" || selectedTool === "sticker")) {
            brushRef.current.style.left = `${e.clientX - 10}px`;
            brushRef.current.style.top = `${e.clientY - 50}px`;
            brushRef.current.style.display = 'block';
        } else if (brushRef.current) {
            brushRef.current.style.display = 'none';
        }
        
        // Handle bottle dragging
        if (isDraggingBottle && bottleRef.current) {
            const handsContainer = handRef.current.getBoundingClientRect();
            const bottleRect = bottleRef.current.getBoundingClientRect();
            
            // Calculate position relative to the hands container
            const x = Math.max(0, Math.min(e.clientX - handsContainer.left - (bottleRect.width / 2), handsContainer.width - bottleRect.width));
            const y = Math.max(0, Math.min(e.clientY - handsContainer.top - (bottleRect.height / 2), handsContainer.height - bottleRect.height));
            
            setBottlePosition({ x, y });
        }
    };
    
    const handleMouseUp = () => {
        setIsPainting(false);
        setCurrentNailIndex(null);
        
        if (isDraggingBottle) {
            setIsDraggingBottle(false);
            setBottleRotation(0);
        }
    };
    
    const handleBottleMouseDown = (e) => {
        e.stopPropagation();
        setIsDraggingBottle(true);
        setBottleRotation(135); // Tilt the bottle
    };
    
    const handleNailMouseDown = (nailIndex, e) => {
        const nail = nails[nailIndex];
        
        if (selectedTool === "fill") {
            // Apply color fill
            setNails(prev => prev.map((n, i) => 
                i === nailIndex
                    ? { 
                        ...n, 
                        color: selectedColor,
                        effect: selectedEffect,
                        shape: selectedShape,
                        segments: []
                    }
                    : n
            ));
        } else if (selectedTool === "brush") {
            // Start brush painting
            setIsPainting(true);
            setCurrentNailIndex(nailIndex);
            handleBrushPaint(nailIndex, e);
        } else if (selectedTool === "sticker" && selectedSticker) {
            // Add sticker
            addSticker(nailIndex, e);
        } else if (selectedTool === "bottle" && isDraggingBottle) {
            // Apply color from bottle
            setNails(prev => prev.map((n, i) => 
                i === nailIndex
                    ? { 
                        ...n, 
                        color: selectedColor,
                        segments: []
                    }
                    : n
            ));
            
            // Create drip effect
            createDrip(e);
        }
    };
    
    const handleNailMouseMove = (nailIndex, e) => {
        if (isPainting && currentNailIndex === nailIndex && selectedTool === "brush") {
            handleBrushPaint(nailIndex, e);
        }
    };
    
    const handleBrushPaint = (nailIndex, e) => {
        const nail = handRef.current.querySelector(`.nail-${nailIndex}`);
        if (!nail) return;
        
        const rect = nail.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Ensure coordinates are within nail bounds
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
        
        // Add a new segment at the brush position
        setNails(prev => prev.map((n, i) => 
            i === nailIndex
                ? {
                    ...n,
                    segments: [...n.segments, {
                        x,
                        y,
                        color: selectedColor,
                        size: brushSize
                    }]
                }
                : n
        ));
    };
    
    const addSticker = (nailIndex, e) => {
        const nail = handRef.current.querySelector(`.nail-${nailIndex}`);
        if (!nail) return;
        
        const rect = nail.getBoundingClientRect();
        const x = e.clientX - rect.left - 10; // Center sticker on cursor
        const y = e.clientY - rect.top - 10;
        
        // Ensure coordinates are within nail bounds
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
        
        setNails(prev => prev.map((n, i) => 
            i === nailIndex
                ? {
                    ...n,
                    stickers: [...n.stickers, {
                        x,
                        y,
                        content: selectedSticker
                    }]
                }
                : n
        ));
    };
    
    const createDrip = (e) => {
        const handsContainer = handRef.current.getBoundingClientRect();
        const x = e.clientX - handsContainer.left;
        const y = e.clientY - handsContainer.top;
        
        // Add a new particle for the drip effect
        setParticles(prev => [...prev, {
            id: Date.now(),
            x,
            y,
            color: selectedColor
        }]);
        
        // Remove particle after animation
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== Date.now()));
        }, 1000);
    };
    
    const handleReset = () => {
        setResetConfirmOpen(true);
    };
    
    const confirmReset = () => {
        setNails([
            { id: 0, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
            { id: 1, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
            { id: 2, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
            { id: 3, color: null, effect: null, shape: "natural", segments: [], stickers: [] },
            { id: 4, color: null, effect: null, shape: "natural", segments: [], stickers: [] }
        ]);
        setResetConfirmOpen(false);
    };
    
    const handleCelebrate = () => {
        setShowConfetti(true);
        
        // Create confetti particles
        const newParticles = [];
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: `conf-${Date.now()}-${i}`,
                x: Math.random() * (handRef.current?.offsetWidth || 350),
                y: -20, // Start above the screen
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.random() * 10 + 5,
                speedX: Math.random() * 6 - 3, 
                speedY: Math.random() * 10 + 5
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
        
        // Remove confetti after animation
        setTimeout(() => {
            setShowConfetti(false);
            setParticles([]);
        }, 3000);
    };
    
    const handleSaveDesign = async () => {
        if (!designName.trim()) return;
        
        try {
            setIsSaving(true);
            setSaveError(null);
            
            // Create design data
            const designData = {
                name: designName,
                createdBy: player.name,
                handType,
                nailsData: nails,
                score
            };
            
            // Save to database
            await NailDesign.create(designData);
            
            // Update player stats if necessary
            try {
                const playerStats = player.stats?.nails || {
                    designsCreated: 0,
                    highScore: 0,
                    lastPlayed: new Date().toISOString()
                };
                
                await GamePlayer.update(player.id, {
                    stats: {
                        ...player.stats,
                        nails: {
                            designsCreated: playerStats.designsCreated + 1,
                            highScore: Math.max(playerStats.highScore, score),
                            lastPlayed: new Date().toISOString()
                        }
                    }
                });
            } catch (err) {
                console.error("Error updating player stats:", err);
            }
            
            // Close dialog and celebrate
            setShowSaveDialog(false);
            handleCelebrate();
            
            // Small delay before returning to menu
            setTimeout(() => {
                onFinish();
            }, 3000);
        } catch (err) {
            console.error("Error saving design:", err);
            setSaveError("Failed to save design. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // Translation helper
    const t = (key) => {
        const translations = {
            "Tools": { he: "כלים", en: "Tools" },
            "Designs": { he: "עיצובים", en: "Designs" },
            "Stickers": { he: "מדבקות", en: "Stickers" },
            "Brush": { he: "מברשת", en: "Brush" },
            "Fill": { he: "מילוי", en: "Fill" },
            "Polish Bottle": { he: "בקבוק לק", en: "Polish Bottle" },
            "Sticker": { he: "מדבקה", en: "Sticker" },
            "Brush Size": { he: "גודל מברשת", en: "Brush Size" },
            "Small": { he: "קטן", en: "Small" },
            "Medium": { he: "בינוני", en: "Medium" },
            "Large": { he: "גדול", en: "Large" },
            "Natural": { he: "טבעי", en: "Natural" },
            "Square": { he: "מרובע", en: "Square" },
            "Almond": { he: "שקד", en: "Almond" },
            "Stiletto": { he: "סטילטו", en: "Stiletto" },
            "Coffin": { he: "ארון", en: "Coffin" },
            "Adult Hand": { he: "יד בוגרת", en: "Adult Hand" },
            "Child Hand": { he: "יד ילד", en: "Child Hand" },
            "Reset All": { he: "איפוס", en: "Reset All" },
            "Celebrate!": { he: "חגיגה!", en: "Celebrate!" },
            "Save Design": { he: "שמור עיצוב", en: "Save Design" },
            "Enter design name": { he: "הזן שם לעיצוב", en: "Enter design name" },
            "Save": { he: "שמור", en: "Save" },
            "Cancel": { he: "ביטול", en: "Cancel" },
            "Score": { he: "ניקוד", en: "Score" },
            "Reset Design Confirmation": { he: "אישור איפוס העיצוב", en: "Reset Design Confirmation" },
            "Are you sure you want to reset all nails?": { he: "האם אתה בטוח שברצונך לאפס את כל הציפורניים?", en: "Are you sure you want to reset all nails?" },
            "This action cannot be undone.": { he: "פעולה זו אינה ניתנת לביטול.", en: "This action cannot be undone." },
            "No": { he: "לא", en: "No" },
            "Yes, Reset": { he: "כן, אפס", en: "Yes, Reset" },
        };
        
        return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
    };
    
    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-pink-600">✨ {t("Nail Polish Game")} ✨</h2>
                    <div className="flex items-center gap-2">
                        <div className="bg-pink-100 px-3 py-1 rounded-full font-bold">
                            {t("Score")}: {score}
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center space-x-2 mb-4">
                    <Button variant="outline" onClick={handleReset}>
                        {t("Reset All")}
                    </Button>
                    <Button variant="outline" onClick={handleCelebrate}>
                        {t("Celebrate!")}
                    </Button>
                    <Button onClick={() => setShowSaveDialog(true)}>
                        {t("Save Design")}
                    </Button>
                </div>
                
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="mb-4 mx-auto">
                        <TabsTrigger value="tools">{t("Tools")}</TabsTrigger>
                        <TabsTrigger value="designs">{t("Designs")}</TabsTrigger>
                        <TabsTrigger value="stickers">{t("Stickers")}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="tools">
                        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                                {["brush", "fill", "bottle", "sticker"].map(tool => (
                                    <Button
                                        key={tool}
                                        variant={selectedTool === tool ? "default" : "outline"}
                                        onClick={() => setSelectedTool(tool)}
                                        className="px-4"
                                    >
                                        {t(tool.charAt(0).toUpperCase() + tool.slice(1))}
                                    </Button>
                                ))}
                            </div>
                            
                            {selectedTool === "brush" && (
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <span>{t("Brush Size")}:</span>
                                    <div className="flex space-x-2">
                                        {["small", "medium", "large"].map(size => (
                                            <Button
                                                key={size}
                                                variant={brushSize === size ? "default" : "outline"}
                                                onClick={() => setBrushSize(size)}
                                                className="w-10 h-10 p-0 rounded-full"
                                            >
                                                <div 
                                                    className="rounded-full bg-current"
                                                    style={{ 
                                                        width: BRUSH_SIZES[size],
                                                        height: BRUSH_SIZES[size]
                                                    }}
                                                ></div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-10 h-10 rounded-full transition-transform ${
                                            selectedColor === color ? 'ring-2 ring-black scale-110' : ''
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="designs">
                        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                            <div className="mb-4">
                                <h3 className="font-medium mb-2">{t("Nail Shape")}</h3>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {SHAPES.map(shape => (
                                        <Button
                                            key={shape}
                                            variant={selectedShape === shape ? "default" : "outline"}
                                            onClick={() => setSelectedShape(shape)}
                                        >
                                            {t(shape.charAt(0).toUpperCase() + shape.slice(1))}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium mb-2">{t("Effects")}</h3>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {EFFECTS.map(effect => (
                                        <button
                                            key={effect.id}
                                            className={`w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-xl ${
                                                selectedEffect === effect.id ? 'ring-2 ring-pink-500 bg-pink-100' : ''
                                            }`}
                                            onClick={() => setSelectedEffect(effect.id)}
                                        >
                                            {effect.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="stickers">
                        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                            <div className="flex flex-wrap justify-center gap-3">
                                {STICKERS.map(sticker => (
                                    <button
                                        key={sticker}
                                        className={`w-12 h-12 flex items-center justify-center text-2xl rounded-full bg-gray-100 ${
                                            selectedSticker === sticker ? 'ring-2 ring-pink-500 bg-pink-100' : ''
                                        }`}
                                        onClick={() => setSelectedSticker(sticker)}
                                    >
                                        {sticker}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
                
                <div className="flex justify-center mb-4">
                    <div className="flex gap-4">
                        <button
                            className={`px-4 py-2 rounded-full ${
                                handType === 'adult-female' ? 'bg-pink-500 text-white' : 'bg-gray-100'
                            }`}
                            onClick={() => setHandType('adult-female')}
                        >
                            {t("Adult Hand")}
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full ${
                                handType === 'child' ? 'bg-pink-500 text-white' : 'bg-gray-100'
                            }`}
                            onClick={() => setHandType('child')}
                        >
                            {t("Child Hand")}
                        </button>
                    </div>
                </div>
                
                <div 
                    className="relative w-full max-w-[350px] h-[380px] mx-auto bg-white rounded-lg"
                    ref={handRef}
                >
                    <div 
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${
                                handType === 'adult-female' 
                                ? 'https://img.freepik.com/free-photo/female-hands-light-background-skin-care-spa-manicure_186202-7585.jpg'
                                : 'https://img.freepik.com/free-photo/children-s-hands-white-background-skincare-concept_185193-75162.jpg'
                            })`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    ></div>
                    
                    {/* Render nails */}
                    {NAIL_POSITIONS[handType].map((pos, index) => {
                        const nail = nails[index];
                        return (
                            <div
                                key={index}
                                className={`absolute nail-${index} ${nail.shape || selectedShape} ${nail.effect || ''}`}
                                style={{
                                    width: pos.width,
                                    height: pos.height,
                                    left: pos.left,
                                    top: pos.top,
                                    transform: `rotate(${pos.rotation}deg)`,
                                    backgroundColor: nail.color || '#ffd6cc',
                                    borderRadius: nail.shape === 'square' ? '5px 5px 2px 2px' :
                                                nail.shape === 'almond' ? '20px 20px 50% 50%' :
                                                nail.shape === 'stiletto' ? '40% 40% 50% 50%' :
                                                nail.shape === 'coffin' ? '5px 5px 0 0' :
                                                '15px 15px 5px 5px',
                                    border: '2px solid #e6b8af',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    clipPath: nail.shape === 'coffin' ? 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' : 'none'
                                }}
                                onMouseDown={(e) => handleNailMouseDown(index, e)}
                                onMouseMove={(e) => handleNailMouseMove(index, e)}
                            >
                                {/* Render segments (brush strokes) */}
                                {nail.segments.map((segment, i) => (
                                    <div
                                        key={i}
                                        className="absolute rounded-full"
                                        style={{
                                            width: segment.size === 'small' ? 6 : segment.size === 'medium' ? 10 : 14,
                                            height: segment.size === 'small' ? 6 : segment.size === 'medium' ? 10 : 14,
                                            left: segment.x - (segment.size === 'small' ? 3 : segment.size === 'medium' ? 5 : 7),
                                            top: segment.y - (segment.size === 'small' ? 3 : segment.size === 'medium' ? 5 : 7),
                                            backgroundColor: segment.color
                                        }}
                                    ></div>
                                ))}
                                
                                {/* Render stickers */}
                                {nail.stickers.map((sticker, i) => (
                                    <div
                                        key={i}
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: sticker.x,
                                            top: sticker.y,
                                            fontSize: '16px',
                                            zIndex: 5
                                        }}
                                    >
                                        {sticker.content}
                                    </div>
                                ))}
                                
                                {/* Apply effects */}
                                {nail.effect === 'glitter' && (
                                    <div className="absolute inset-0 flex items-center justify-center text-lg opacity-70">✨</div>
                                )}
                                {nail.effect === 'holographic' && (
                                    <div 
                                        className="absolute inset-0" 
                                        style={{
                                            backgroundImage: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)',
                                            backgroundSize: '400% 400%',
                                            animation: 'rainbow 3s ease infinite',
                                            mixBlendMode: 'overlay'
                                        }}
                                    ></div>
                                )}
                            </div>
                        );
                    })}
                    
                    {/* Polish bottle */}
                    {showBottle && (
                        <div
                            ref={bottleRef}
                            className={`absolute cursor-grab ${isDraggingBottle ? 'cursor-grabbing' : ''}`}
                            style={{
                                width: '40px',
                                height: '80px',
                                backgroundColor: selectedColor,
                                borderRadius: '5px 5px 20px 20px',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                                zIndex: 10,
                                left: bottlePosition.x,
                                top: bottlePosition.y,
                                transform: `rotate(${bottleRotation}deg)`,
                                transformOrigin: 'center bottom',
                                transition: 'transform 0.2s'
                            }}
                            onMouseDown={handleBottleMouseDown}
                        >
                            {/* Bottle cap */}
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '20px',
                                    height: '15px',
                                    backgroundColor: '#aaa',
                                    borderRadius: '5px 5px 0 0'
                                }}
                            ></div>
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: '-25px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#444',
                                    borderRadius: '50% 50% 0 0'
                                }}
                            ></div>
                        </div>
                    )}
                    
                    {/* Particles for effects */}
                    {particles.map((particle) => (
                        <div
                            key={particle.id}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                left: particle.x,
                                top: particle.y,
                                width: particle.size || 8,
                                height: particle.size || 8,
                                backgroundColor: particle.color,
                                animation: showConfetti ? 'fall 1s linear forwards' : 'drip 1s linear forwards'
                            }}
                        ></div>
                    ))}
                    
                    {/* Brush */}
                    <div
                        ref={brushRef}
                        className="absolute"
                        style={{
                            width: '25px',
                            height: '70px',
                            backgroundColor: '#ff69b4',
                            borderRadius: '5px 5px 0 0',
                            pointerEvents: 'none',
                            zIndex: 1000,
                            display: 'none',
                            filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))'
                        }}
                    >
                        <div 
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '10px',
                                width: '5px',
                                height: '20px',
                                backgroundColor: '#8b4513',
                                borderRadius: '2px'
                            }}
                        ></div>
                        <div 
                            style={{
                                position: 'absolute',
                                bottom: '-5px',
                                left: '5px',
                                width: '15px',
                                height: '8px',
                                backgroundColor: selectedColor,
                                borderRadius: '0 0 10px 10px'
                            }}
                        ></div>
                    </div>
                </div>
            </div>
            
            {/* Save Design Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("Save Design")}</DialogTitle>
                        <DialogDescription>
                            {language === 'he' 
                                ? "תן שם ליצירה שלך לפני השמירה." 
                                : "Give your creation a name before saving."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <Input
                            placeholder={t("Enter design name")}
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                        />
                        
                        {saveError && <p className="text-red-500 mt-2">{saveError}</p>}
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>{t("Cancel")}</Button>
                        <Button onClick={handleSaveDesign} disabled={!designName.trim() || isSaving}>
                            {isSaving ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white mr-2"></div>
                                    {t("Save")}
                                </div>
                            ) : t("Save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Reset Confirmation */}
            <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("Reset Design Confirmation")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("Are you sure you want to reset all nails?")}
                            <br />
                            {t("This action cannot be undone.")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("No")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReset} className="bg-red-500 hover:bg-red-600">
                            {t("Yes, Reset")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Animation keyframes */}
            <style jsx global>{`
                @keyframes drip {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                
                @keyframes fall {
                    to {
                        transform: translateY(100vh);
                        opacity: 0;
                    }
                }
                
                @keyframes rainbow {
                    0% {background-position: 0% 50%;}
                    50% {background-position: 100% 50%;}
                    100% {background-position: 0% 50%;}
                }
            `}</style>
        </div>
    );
}