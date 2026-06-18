"use client";

import React from "react";
import { 
  GripVertical, 
  Palette, 
  Pencil, 
  Menu, 
  Settings, 
  Trash2, 
  MoreHorizontal,
  Plus,
  Minus,
} from "lucide-react";

type DrawingStyle = {
  lineWidth?: number;
  lineStyle?: number[];
  showLabels?: boolean;
  levels?: number[];
  showPrices?: boolean;
  showPercentages?: boolean;
};

type DrawingStyleEditorProps = {
  selectedDrawingId: string | null;
  currentStyle?: DrawingStyle;
  onUpdateAllStyles: (style: DrawingStyle) => void;
  onDelete: (drawingId: string) => void;
  onClose: () => void;
};

function FibLevelsEditor({ style, onUpdate }: { style?: DrawingStyle; onUpdate: (style: DrawingStyle) => void }) {
  const levels = style?.levels || [0, 0.382, 0.5, 0.618, 1];
  
  const addLevel = () => {
    const newLevels = [...levels, 0.5];
    onUpdate({ ...style, levels: newLevels });
  };
  
  const removeLevel = (index: number) => {
    const newLevels = levels.filter((_, i) => i !== index);
    onUpdate({ ...style, levels: newLevels });
  };
  
  const updateLevel = (index: number, value: number) => {
    const newLevels = [...levels];
    newLevels[index] = Math.max(0, Math.min(1, value));
    onUpdate({ ...style, levels: newLevels });
  };
  
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-white/60">Fibonacci Levels</span>
        <button onClick={addLevel} className="text-green-400 hover:text-green-300">
          <Plus size={14} />
        </button>
      </div>
      {levels.map((level, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="number"
            value={level.toFixed(3)}
            onChange={(e) => updateLevel(i, parseFloat(e.target.value))}
            className="w-16 text-right bg-black/50 border border-white/10 rounded px-1"
            step="0.001"
            min="0"
            max="1"
          />
          <input
            type="range"
            value={level}
            onChange={(e) => updateLevel(i, parseFloat(e.target.value))}
            className="flex-1"
            step="0.001"
            min="0"
            max="1"
          />
          {levels.length > 2 && (
            <button onClick={() => removeLevel(i)} className="text-red-400 hover:text-red-300">
              <Minus size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DrawingStyleEditor({
  selectedDrawingId,
  currentStyle,
  onUpdateAllStyles,
  onDelete,
  onClose,
}: DrawingStyleEditorProps) {
  const isFibTool = currentStyle?.levels !== undefined;
  
  return (
    <div className="absolute right-10 bottom-10 z-[100] flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#1c1f26] p-1.5 shadow-xl text-white">
      
      {/* Drag Handle */}
      <div className="cursor-grab p-1 text-white/20">
        <GripVertical size={16} />
      </div>

      <div className="h-4 w-[1px] bg-white/[0.08] mx-1" />

      {/* Drawing Tools */}
      <div className="flex gap-0.5 text-white/60">
        <button className="p-1.5 hover:bg-white/10 rounded transition-colors"><Palette size={16} /></button>
        <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-blue-500"><Pencil size={16} /></button>
        <button className="p-1.5 hover:bg-white/10 rounded transition-colors"><Menu size={16} /></button>
        <button className="p-1.5 hover:bg-white/10 rounded transition-colors"><Settings size={16} /></button>
      </div>

      <div className="h-4 w-[1px] bg-white/[0.08] mx-1" />

      {isFibTool && (
        <>
          <FibLevelsEditor style={currentStyle} onUpdate={onUpdateAllStyles} />
          <div className="h-4 w-[1px] bg-white/[0.08] mx-1" />
        </>
      )}

      {/* Delete Action */}
      <button
        onClick={() => selectedDrawingId && onDelete(selectedDrawingId)}
        className="p-1.5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>

      {/* More Options */}
      <button 
        onClick={onClose} 
        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}