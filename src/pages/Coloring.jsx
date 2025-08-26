
import React, { useState, useEffect, useRef } from 'react';
import { Drawing } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import {
  Paintbrush,
  Eraser,
  Undo,
  RotateCcw,
  Download,
  Home,
  Save,
  Target,
  SunMedium,
  Moon,
  Palette,
  Settings,
  X,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Simple color picker component
const SimpleColorPicker = ({ color, onChange }) => {
  const colors = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
    "#ffff00", "#ff00ff", "#00ffff", "#ff9900", "#9900ff",
    "#009900", "#990000", "#999999", "#ff99cc", "#99ffcc",
    "#9999ff", "#663300", "#336699", "#339966", "#993366"
  ];

  return (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-5 gap-2">
        {colors.map(colorValue => (
          <div
            key={colorValue}
            className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
              color === colorValue ? 'ring-2 ring-blue-500 scale-110' : ''
            }`}
            style={{ backgroundColor: colorValue }}
            onClick={() => onChange(colorValue)}
          />
        ))}
      </div>
    </div>
  );
};

// Convert hex color to RGB
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Check if two colors are similar (with tolerance)
const colorsMatch = (color1, color2, tolerance = 30) => {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
};

export default function Coloring() {
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [color, setColor] = useState("#ff0000");
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoFill, setAutoFill] = useState(true);
  const [toolSettingsOpen, setToolSettingsOpen] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [language, setLanguage] = useState('he');

  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const svgRef = useRef(null);
  const historyRef = useRef([]);
  const currentStepRef = useRef(-1);
  const paintingRef = useRef(false); // Flag to prevent multiple simultaneous operations

  // Load drawings on component mount
  useEffect(() => {
    loadDrawings();
    
    // Add resize event listener
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Initialize canvas when drawing is selected
  useEffect(() => {
    if (selectedDrawing) {
      setupCanvas();
    }
  }, [selectedDrawing, darkMode]);

    // Add useEffect for loading user language
    useEffect(() => {
      const loadUserLanguage = async () => {
        try {
          const user = await User.me();
          if (user && user.language) {
            setLanguage(user.language);
          }
        } catch (err) {
          console.error("Error loading user language:", err);
        }
      };
      
      loadUserLanguage();
    }, []);

  // Handle window resize
  const handleWindowResize = () => {
    if (selectedDrawing) {
      setupCanvas();
    }
  };

  // Load drawings from database
  const loadDrawings = async () => {
    try {
      setLoading(true);
      const loadedDrawings = await Drawing.list();
      setDrawings(loadedDrawings.filter(d => d.isActive !== false));
      setLoading(false);
    } catch (err) {
      console.error("Error loading drawings:", err);
      setLoading(false);
    }
  };

  // Improve canvas setup for better scaling
  const setupCanvas = () => {
    if (!canvasRef.current || !selectedDrawing) return;
    
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = Math.min(window.innerHeight * 0.7, containerWidth);
    
    // Parse viewBox
    const viewBox = selectedDrawing.viewBox || "0 0 100 100";
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    
    // Calculate aspect ratio
    const svgRatio = vbWidth / vbHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // Set canvas dimensions based on aspect ratio
    let canvasWidth, canvasHeight;
    if (svgRatio > containerRatio) {
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / svgRatio;
    } else {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * svgRatio;
    }
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas with background color
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = darkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw SVG paths
    drawSvgPaths(ctx, canvas.width, canvas.height);
    
    // Save initial state
    saveToHistory();
    setCanvasReady(true);
  };

  // Draw SVG paths on canvas
  const drawSvgPaths = (ctx, width, height) => {
    if (!selectedDrawing?.paths || !selectedDrawing.paths.length) return;
    
    // Get SVG viewBox
    const viewBox = selectedDrawing.viewBox || "0 0 100 100";
    const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
    
    // Calculate scaling for paths
    const scaleX = width / vbWidth;
    const scaleY = height / vbHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate centering offset
    const offsetX = (width - vbWidth * scale) / 2;
    const offsetY = (height - vbHeight * scale) / 2;
    
    // Set up transformation
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Draw paths
    ctx.strokeStyle = darkMode ? '#ffffff' : '#000000';
    ctx.lineWidth = 1 / scale; // Adjust line width for scaling
    
    for (const pathData of selectedDrawing.paths) {
      const path = new Path2D(pathData);
      ctx.stroke(path);
    }
    
    ctx.restore();
  };

  // Save current canvas state to history
  const saveToHistory = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Cut history at current step if we're in the middle of history
    historyRef.current = historyRef.current.slice(0, currentStepRef.current + 1);
    
    // Add current state to history
    historyRef.current.push(imageData);
    currentStepRef.current = historyRef.current.length - 1;
    
    // Limit history size
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
      currentStepRef.current--;
    }
  };

  // Undo the last action
  const handleUndo = () => {
    if (currentStepRef.current <= 0 || !canvasRef.current) return;
    
    currentStepRef.current--;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(historyRef.current[currentStepRef.current], 0, 0);
  };

  // Redo an undone action
  const handleRedo = () => {
    if (currentStepRef.current >= historyRef.current.length - 1 || !canvasRef.current) return;
    
    currentStepRef.current++;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(historyRef.current[currentStepRef.current], 0, 0);
  };

  // Reset canvas to initial state
  const handleReset = () => {
    if (!canvasRef.current || !selectedDrawing) return;
    
    setupCanvas();
  };

  // Fix smooth erasing by using the same mechanism as brush
  const drawPoint = (point, isEraserStroke = false) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(point.x, point.y, (isEraserStroke ? brushSize * 1.5 : brushSize) / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraserStroke ? (darkMode ? '#1a1a1a' : '#ffffff') : color;
    ctx.fill();
  };

  const setupDrawingHandlers = () => {
    if (!canvasRef.current || !canvasReady) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const getCanvasPoint = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    };
    
    let lastPoint = null;
    let isMouseDown = false;
    
    const startDrawing = (e) => {
      e.preventDefault();
      isMouseDown = true;
      const point = getCanvasPoint(e.clientX, e.clientY);
      lastPoint = point;
      
      if (paintingRef.current) return;
      paintingRef.current = true;
      
      if (autoFill && !isEraser) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const startColor = {
          r: imageData.data[(Math.floor(point.y) * canvas.width + Math.floor(point.x)) * 4],
          g: imageData.data[(Math.floor(point.y) * canvas.width + Math.floor(point.x)) * 4 + 1],
          b: imageData.data[(Math.floor(point.y) * canvas.width + Math.floor(point.x)) * 4 + 2]
        };
        floodFill(ctx, Math.floor(point.x), Math.floor(point.y), startColor, hexToRgb(color));
        saveToHistory();
      } else {
        setIsDrawing(true);
        drawPoint(point, isEraser);
      }
      
      paintingRef.current = false;
    };
    
    const draw = (e) => {
      e.preventDefault();
      if (!isMouseDown || paintingRef.current) return;
      
      const point = getCanvasPoint(e.clientX, e.clientY);
      
      if (lastPoint) {
        // Draw a line between points for smooth drawing
        const dist = Math.sqrt(Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2));
        const angle = Math.atan2(point.y - lastPoint.y, point.x - lastPoint.x);
        
        for (let i = 0; i < dist; i += 5) {
          const x = lastPoint.x + (Math.cos(angle) * i);
          const y = lastPoint.y + (Math.sin(angle) * i);
          drawPoint({ x, y }, isEraser);
        }
      }
      
      drawPoint(point, isEraser);
      lastPoint = point;
    };
    
    const stopDrawing = () => {
      if (isMouseDown) {
        isMouseDown = false;
        setIsDrawing(false);
        lastPoint = null;
        saveToHistory();
      }
    };

    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startDrawing({
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
    
    canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      draw({
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
    
    canvas.addEventListener('touchend', stopDrawing);
    
    return () => {
      // Remove all event listeners
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  };

  // Flood fill algorithm (optimized for performance)
  const floodFill = (ctx, startX, startY, startColor, fillColor) => {
    if (!ctx || !fillColor) return;
    
    // Get image data
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Boundary check
    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
      return;
    }
    
    // Prepare fill color
    const fillR = fillColor.r;
    const fillG = fillColor.g;
    const fillB = fillColor.b;
    
    // Check if start color is already fill color
    const startPos = (startY * width + startX) * 4;
    if (
      Math.abs(data[startPos] - fillR) <= 5 &&
      Math.abs(data[startPos + 1] - fillG) <= 5 &&
      Math.abs(data[startPos + 2] - fillB) <= 5
    ) {
      return;
    }
    
    // Use a queue-based approach instead of recursion
    const queue = [];
    queue.push([startX, startY]);
    
    // Linear flood fill
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const pos = (y * width + x) * 4;
      
      // Skip if already processed or doesn't match start color
      if (
        x < 0 || y < 0 || x >= width || y >= height ||
        !colorsMatch(
          { r: data[pos], g: data[pos + 1], b: data[pos + 2] },
          startColor
        )
      ) {
        continue;
      }
      
      // Fill the pixel
      data[pos] = fillR;
      data[pos + 1] = fillG;
      data[pos + 2] = fillB;
      data[pos + 3] = 255;
      
      // Check surrounding pixels (4-way)
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
    
    // Apply changes
    ctx.putImageData(imageData, 0, 0);
  };

  // Download the colored drawing
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${selectedDrawing.name || 'drawing'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Toggle coloring tools
  const toggleTool = (tool) => {
    if (tool === 'eraser') {
      setIsEraser(!isEraser);
      if (!isEraser) {
        setAutoFill(false);
      }
    } else if (tool === 'fill') {
      setAutoFill(!autoFill);
      if (!autoFill) {
        setIsEraser(false);
      }
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

    // Translation function
    const t = (key) => {
      const translations = {
        "Coloring Game": { he: "משחק צביעה", en: "Coloring Game" },
        "Back to Home": { he: "חזור למסך הבית", en: "Back to Home" },
        "Choose color:": { he: "בחר צבע:", en: "Choose color:" },
        "Tools:": { he: "כלים:", en: "Tools:" },
        "Brush": { he: "מכחול", en: "Brush" },
        "Eraser": { he: "מחק", en: "Eraser" },
        "Fill": { he: "מילוי", en: "Fill" },
        "Undo": { he: "בטל", en: "Undo" },
        "Brush size:": { he: "גודל המכחול:", en: "Brush size:" },
        "Restart": { he: "התחל מחדש", en: "Restart" },
        "Save Image": { he: "שמור תמונה", en: "Save Image" },
        "Choose Another Drawing": { he: "בחר ציור אחר", en: "Choose Another Drawing" },
        "Are you sure you want to exit the drawing?": { 
          he: "האם אתה בטוח שברצונך לצאת מהציור? השינויים לא יישמרו",
          en: "Are you sure you want to exit the drawing? Changes will not be saved"
        },
        "Finish and Return": { he: "סיים וחזור", en: "Finish and Return" },
        "No preview": { he: "אין תצוגה מקדימה", en: "No preview" }
      };
      
      return language === 'en' ? translations[key]?.en || key : translations[key]?.he || key;
    };

  // Install event handlers when ready
  useEffect(() => {
    if (canvasReady) {
      const cleanup = setupDrawingHandlers();
      return cleanup;
    }
  }, [canvasReady, autoFill, isEraser, color, brushSize]);

  // Show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 to-blue-50'} p-6`} dir={language === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('Coloring Game')}</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className="w-10 h-10"
            >
              {darkMode ? <SunMedium size={18} /> : <Moon size={18} />}
            </Button>
            
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="flex items-center gap-2">
                <Home size={18} />
                {t('Back to Home')}
              </Button>
            </Link>
          </div>
        </div>

        {!selectedDrawing ? (
          // Drawing selection grid
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {drawings.map((drawing) => (
              <Card
                key={drawing.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDrawing(drawing)}
              >
                <div className="aspect-square flex items-center justify-center mb-4 p-2">
                  <svg
                    viewBox={drawing.viewBox || "0 0 100 100"}
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ stroke: darkMode ? 'white' : 'black', fill: 'none', strokeWidth: '1' }}
                  >
                    {drawing.paths.map((path, index) => (
                      <path
                        key={index}
                        d={path}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </svg>
                </div>
                <h3 className="font-medium text-center">{drawing.name}</h3>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedDrawing.name}</h2>
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm(t('Are you sure you want to exit the drawing?'))) {
                    setSelectedDrawing(null);
                  }
                }}
              >
                {t('Finish and Return')}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-9">
                <div 
                  ref={canvasContainerRef} 
                  className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                    darkMode ? 'border border-gray-700' : ''
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full touch-none"
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                <Card className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
                  <div className="space-y-6">
                    {/* Drawing title */}
                    <div className="text-center">
                      <h2 className="text-xl font-bold">{selectedDrawing.name}</h2>
                    </div>

                    {/* Color picker */}
                    <div>
                      <div className="mb-2 font-medium">{t('Choose color:')}</div>
                      <div className="relative">
                        <button
                          className="w-full h-12 rounded-lg border-2 flex items-center justify-center"
                          style={{ 
                            backgroundColor: color,
                            borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                            color: isColorDark(color) ? 'white' : 'black'
                          }}
                          onClick={() => setColorPickerOpen(!colorPickerOpen)}
                        >
                          {color}
                        </button>
                        
                        {colorPickerOpen && (
                          <div className="absolute z-10 mt-2 left-0 right-0">
                            <SimpleColorPicker
                              color={color}
                              onChange={(newColor) => {
                                setColor(newColor);
                                setColorPickerOpen(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tools buttons */}
                    <div>
                      <div className="mb-2 font-medium">{t('Tools:')}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-2">
                        <Button
                          variant={!isEraser && !autoFill ? "default" : "outline"}
                          className="flex items-center justify-center gap-1"
                          onClick={() => {
                            setIsEraser(false);
                            setAutoFill(false);
                          }}
                        >
                          <Paintbrush size={16} />
                          <span className="hidden md:inline lg:inline">{t('Brush')}</span>
                        </Button>
                        
                        <Button
                          variant={isEraser ? "default" : "outline"}
                          className="flex items-center justify-center gap-1"
                          onClick={() => toggleTool('eraser')}
                        >
                          <Eraser size={16} />
                          <span className="hidden md:inline lg:inline">{t('Eraser')}</span>
                        </Button>
                        
                        <Button
                          variant={autoFill ? "default" : "outline"}
                          className="flex items-center justify-center gap-1"
                          onClick={() => toggleTool('fill')}
                        >
                          <Target size={16} />
                          <span className="hidden md:inline lg:inline">{t('Fill')}</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="flex items-center justify-center gap-1"
                          onClick={handleUndo}
                        >
                          <Undo size={16} />
                          <span className="hidden md:inline lg:inline">{t('Undo')}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Brush size slider */}
                    <div>
                      <div className="mb-2 font-medium">{t('Brush size:')}</div>
                      <Slider
                        value={[brushSize]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(value) => setBrushSize(value[0])}
                      />
                      <div className="mt-1 text-sm text-right">{brushSize}px</div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={handleReset}
                      >
                        <RotateCcw size={16} className="mr-2" />
                        {t('Restart')}
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleDownload}
                      >
                        <Download size={16} className="mr-2" />
                        {t('Save Image')}
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => setSelectedDrawing(null)}
                      >
                        <X size={16} className="mr-2" />
                        {t('Choose Another Drawing')}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine if a color is dark
function isColorDark(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  // Calculate color luminance (perceived brightness)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.5;
}
