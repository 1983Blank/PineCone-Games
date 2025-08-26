import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import NailHand from './NailHand';
import ColorPalette from './ColorPalette';
import ToolsPanel from './ToolsPanel';
import EffectsPanel from './EffectsPanel';
import StickersPanel from './StickersPanel';

const COLORS = [
    '#ff0000', '#ff69b4', '#ff4500', '#ffd700', 
    '#9acd32', '#00ff00', '#00ffff', '#0000ff', 
    '#8a2be2', '#ff00ff', '#800080', '#000000',
    '#ffffff', '#c0c0c0', '#ffc0cb', '#f5deb3',
    '#8B4513', '#32CD32', '#4B0082', '#40E0D0',
    '#FF1493', '#FFD700', '#7B68EE', '#DC143C',
    '#00BFFF', '#FF8C00', '#6A5ACD', '#B22222'
];

export default function NailGame() {
    const [selectedColor, setSelectedColor] = useState('#ff69b4');
    const [selectedTool, setSelectedTool] = useState('brush');
    const [selectedEffect, setSelectedEffect] = useState('none');
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [brushSize, setBrushSize] = useState('medium');
    const [selectedShape, setSelectedShape] = useState('natural');
    const [handType, setHandType] = useState('adult-female');
    const [currentTab, setCurrentTab] = useState('tools');
    
    const handleColorSelect = (color) => {
        setSelectedColor(color);
    };

    const handleToolSelect = (tool) => {
        setSelectedTool(tool);
    };

    const handleEffectSelect = (effect) => {
        setSelectedEffect(effect);
    };

    const handleStickerSelect = (sticker) => {
        setSelectedSticker(sticker);
    };

    const handleShapeSelect = (shape) => {
        setSelectedShape(shape);
    };

    const handleHandTypeSelect = (type) => {
        setHandType(type);
    };

    return (
        <div className="min-h-screen bg-gradient-radial from-pink-100 to-purple-100">
            <div className="max-w-4xl mx-auto p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-xl p-6"
                >
                    <h1 className="text-3xl font-bold text-center text-pink-600 mb-8">
                        ✨ Fabulous Nail Polish Salon ✨
                    </h1>

                    <div className="tabs flex justify-center space-x-4 mb-6">
                        {['tools', 'effects', 'stickers'].map(tab => (
                            <button
                                key={tab}
                                className={`px-4 py-2 rounded-full transition-all ${
                                    currentTab === tab
                                        ? 'bg-pink-500 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                                onClick={() => setCurrentTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        {currentTab === 'tools' && (
                            <ToolsPanel
                                selectedTool={selectedTool}
                                onToolSelect={handleToolSelect}
                                selectedColor={selectedColor}
                                onColorSelect={handleColorSelect}
                                brushSize={brushSize}
                                onBrushSizeChange={setBrushSize}
                                colors={COLORS}
                            />
                        )}
                        {currentTab === 'effects' && (
                            <EffectsPanel
                                selectedEffect={selectedEffect}
                                onEffectSelect={handleEffectSelect}
                                selectedShape={selectedShape}
                                onShapeSelect={handleShapeSelect}
                            />
                        )}
                        {currentTab === 'stickers' && (
                            <StickersPanel
                                selectedSticker={selectedSticker}
                                onStickerSelect={handleStickerSelect}
                            />
                        )}
                    </div>

                    <div className="hand-selection flex justify-center space-x-4 mb-6">
                        <button
                            className={`px-4 py-2 rounded-full transition-all ${
                                handType === 'adult-female'
                                    ? 'bg-pink-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            onClick={() => handleHandTypeSelect('adult-female')}
                        >
                            Adult Hand
                        </button>
                        <button
                            className={`px-4 py-2 rounded-full transition-all ${
                                handType === 'child'
                                    ? 'bg-pink-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            onClick={() => handleHandTypeSelect('child')}
                        >
                            Child Hand
                        </button>
                    </div>

                    <NailHand
                        type={handType}
                        selectedTool={selectedTool}
                        selectedColor={selectedColor}
                        selectedEffect={selectedEffect}
                        selectedSticker={selectedSticker}
                        selectedShape={selectedShape}
                        brushSize={brushSize}
                    />
                </motion.div>
            </div>
        </div>
    );
}