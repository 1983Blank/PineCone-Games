import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

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

export default function NailHand({ 
    type,
    selectedTool,
    selectedColor,
    selectedEffect,
    selectedSticker,
    selectedShape,
    brushSize
}) {
    const [nails, setNails] = useState([]);
    const handRef = useRef(null);
    const [isPainting, setIsPainting] = useState(false);
    const [currentNail, setCurrentNail] = useState(null);

    useEffect(() => {
        // Initialize nails state
        setNails(NAIL_POSITIONS[type].map((pos, index) => ({
            id: index,
            color: null,
            segments: [],
            stickers: [],
            effect: null,
            shape: 'natural'
        })));
    }, [type]);

    const handleNailClick = (nailIndex, e) => {
        if (selectedTool === 'fill') {
            setNails(prev => prev.map((nail, i) => 
                i === nailIndex
                    ? { 
                        ...nail, 
                        color: selectedColor,
                        effect: selectedEffect,
                        shape: selectedShape,
                        segments: []
                    }
                    : nail
            ));
        } else if (selectedTool === 'brush') {
            setIsPainting(true);
            setCurrentNail(nailIndex);
            handleBrushPaint(nailIndex, e);
        } else if (selectedTool === 'sticker' && selectedSticker) {
            addSticker(nailIndex, e);
        }
    };

    const handleBrushPaint = (nailIndex, e) => {
        if (!isPainting || currentNail !== nailIndex) return;

        const nail = handRef.current.querySelector(`.nail-${nailIndex}`);
        const rect = nail.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setNails(prev => prev.map((nail, i) => 
            i === nailIndex
                ? {
                    ...nail,
                    segments: [...nail.segments, {
                        x,
                        y,
                        color: selectedColor,
                        size: brushSize
                    }]
                }
                : nail
        ));
    };

    const addSticker = (nailIndex, e) => {
        const nail = handRef.current.querySelector(`.nail-${nailIndex}`);
        const rect = nail.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setNails(prev => prev.map((nail, i) => 
            i === nailIndex
                ? {
                    ...nail,
                    stickers: [...nail.stickers, {
                        x,
                        y,
                        content: selectedSticker
                    }]
                }
                : nail
        ));
    };

    return (
        <div 
            className="relative w-[350px] h-[380px] mx-auto"
            ref={handRef}
            style={{
                backgroundImage: `url(${type === 'adult-female' 
                    ? 'https://images.unsplash.com/photo-1643321610692-767679160bed'
                    : 'https://images.unsplash.com/photo-1543701835-bcdee9ad5bbb'
                }?q=80&w=800&auto=format&fit=crop)`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            }}
        >
            {NAIL_POSITIONS[type].map((pos, index) => (
                <motion.div
                    key={index}
                    className={`absolute nail-${index} ${selectedShape} ${selectedEffect}`}
                    style={{
                        width: pos.width,
                        height: pos.height,
                        left: pos.left,
                        top: pos.top,
                        transform: `rotate(${pos.rotation}deg)`,
                        backgroundColor: nails[index]?.color || '#ffd6cc',
                        borderRadius: '15px 15px 5px 5px',
                        border: '2px solid #e6b8af',
                        cursor: 'pointer',
                        overflow: 'hidden'
                    }}
                    onClick={(e) => handleNailClick(index, e)}
                    onMouseMove={(e) => handleBrushPaint(index, e)}
                    onMouseUp={() => setIsPainting(false)}
                    onMouseLeave={() => setIsPainting(false)}
                >
                    {nails[index]?.segments.map((segment, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: segment.size === 'small' ? 6 : segment.size === 'medium' ? 10 : 14,
                                height: segment.size === 'small' ? 6 : segment.size === 'medium' ? 10 : 14,
                                left: segment.x,
                                top: segment.y,
                                backgroundColor: segment.color
                            }}
                        />
                    ))}
                    {nails[index]?.stickers.map((sticker, i) => (
                        <div
                            key={i}
                            className="absolute text-lg pointer-events-none"
                            style={{
                                left: sticker.x,
                                top: sticker.y
                            }}
                        >
                            {sticker.content}
                        </div>
                    ))}
                </motion.div>
            ))}
        </div>
    );
}