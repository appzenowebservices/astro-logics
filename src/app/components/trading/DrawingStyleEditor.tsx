"use client";

import React from "react";
import { 
  GripVertical, 
  Palette, 
  Pencil, 
  Menu, 
  Settings, 
  Trash2, 
  MoreHorizontal 
} from "lucide-react";

type DrawingStyle = {
  lineWidth?: number;
  lineStyle?: number[];
  showLabels?: boolean;
};

type DrawingStyleEditorProps = {
  selectedDrawingId: string | null;
  currentStyle?: DrawingStyle;
  onUpdateAllStyles: (style: DrawingStyle) => void;
  onDelete: (drawingId: string) => void;
  onClose: () => void;
};

export default function DrawingStyleEditor({
  selectedDrawingId,
  currentStyle,
  onUpdateAllStyles,
  onDelete,
  onClose,
}: DrawingStyleEditorProps) {
  
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