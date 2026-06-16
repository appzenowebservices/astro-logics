"use client";

import React from "react";
import { 
  Palette, 
  Menu, 
  MoreHorizontal,
} from "lucide-react";

type DrawingStyle = {
  lineWidth?: number;
  lineDash?: number[];
  lineColor?: string;
  fillColor?: string;
  fillOpacity?: number;
  showLabels?: boolean;
  labelFont?: string;
  labelColor?: string;
};

type DrawingStyleEditorProps = {
  selectedDrawingId: string | null;
  drawingType: string | null;
  currentStyle?: DrawingStyle;
  onUpdateStyle: (style: DrawingStyle) => void;
  onDelete: (drawingId: string) => void;
  onClose: () => void;
};

const LINE_STYLES = [
  { label: "Solid", value: [] },
  { label: "Dashed", value: [5, 5] },
  { label: "Dotted", value: [1, 4] },
  { label: "Dash Dot", value: [5, 2, 1, 2] },
];

const COLORS = ["#29B6F6", "#4CAF50", "#FF9800", "#FF5722", "#9C27B0", "#E91E63", "#00BCD4", "#009688"];

export default function DrawingStyleEditor({
  selectedDrawingId,
  drawingType,
  currentStyle,
  onUpdateStyle,
  onDelete,
  onClose,
}: DrawingStyleEditorProps) {
  const [showLineStyle, setShowLineStyle] = React.useState(false);
  const [showColor, setShowColor] = React.useState(false);

  const style: DrawingStyle = {
    lineWidth: currentStyle?.lineWidth ?? 2,
    lineDash: currentStyle?.lineDash ?? [],
    lineColor: currentStyle?.lineColor ?? "#29B6F6",
    fillColor: currentStyle?.fillColor,
    fillOpacity: currentStyle?.fillOpacity,
    showLabels: currentStyle?.showLabels,
    labelFont: currentStyle?.labelFont,
    labelColor: currentStyle?.labelColor,
  };

  const handleStyleChange = (newStyle: DrawingStyle) => {
    onUpdateStyle({ ...style, ...newStyle });
  };

  const hasFillColor = drawingType && !["trend-line", "horizontal-line", "vertical-line", "ray", "extended-line", "arrow", "info-line", "date-range", "cross-line", "fib-retracement", "parallel-channel", "fib-channel", "fib-speed-fan", "fib-wedge", "fib-arcs", "fib-circles", "fib-time-zone", "fib-time-extension", "andrews-pitchfork", "inside-pitchfork", "modified-schiff-pitchfork", "pitchfan", "gann-fan", "gann-square", "gann-box"].includes(drawingType);

  const hasFill = hasFillColor || ["rectangle", "ellipse", "arc", "circle", "path", "highlighter", "channel", "disjoint-channel", "flat-top-bottom", "forecast", "long-position", "note", "callout", "anchored-text", "flag-mark", "pin", "comment", "date-price-range"].includes(drawingType);

  const hasShowLabels = ["fib-retracement", "fib-channel", "fib-speed-fan", "fib-wedge", "fib-arcs", "fib-circles", "fib-time-zone", "fib-time-extension", "date-price-range", "info-line", "gann-fan", "gann-box"].includes(drawingType);

  if (!selectedDrawingId) return null;

  return (
    <div className="absolute right-10 bottom-10 z-[100] w-64 rounded-lg border border-white/[0.08] bg-[#1c1f26] p-3 shadow-xl text-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Drawing Style: {drawingType}</span>
        <button 
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded"
          title="Close"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-white/60 mb-1 block">Line Width: {style.lineWidth}px</label>
          <input
            type="range"
            min="1"
            max="10"
            value={style.lineWidth}
            onChange={(e) => handleStyleChange({ lineWidth: parseInt(e.target.value) })}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs text-white/60 mb-1 block">Line Style</label>
          <div className="relative">
            <button
              onClick={() => setShowLineStyle(!showLineStyle)}
              className="w-full flex items-center justify-between px-2 py-1 bg-black/30 rounded text-xs"
            >
              <span>{LINE_STYLES.find(l => JSON.stringify(l.value) === JSON.stringify(style.lineDash))?.label ?? "Solid"}</span>
              <Menu size={14} />
            </button>
            {showLineStyle && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1f26] border border-white/10 rounded overflow-hidden">
                {LINE_STYLES.map((ls) => (
                  <button
                    key={ls.label}
                    onClick={() => {
                      handleStyleChange({ lineDash: ls.value });
                      setShowLineStyle(false);
                    }}
                    className="w-full px-3 py-1 text-xs text-left hover:bg-white/10 first:rounded-t last:rounded-b"
                  >
                    {ls.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/60 mb-1 block">Line Color</label>
          <div className="relative">
            <button
              onClick={() => setShowColor(!showColor)}
              className="w-full flex items-center justify-between px-2 py-1 bg-black/30 rounded text-xs"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-white/20"
                  style={{ backgroundColor: style.lineColor }}
                />
                <span>{style.lineColor}</span>
              </div>
              <Palette size={14} />
            </button>
            {showColor && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1f26] border border-white/10 rounded p-2 grid grid-cols-4 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      handleStyleChange({ lineColor: color });
                      setShowColor(false);
                    }}
                    className="w-6 h-6 rounded border-2 border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {hasFill && (
          <div>
            <label className="text-xs text-white/60 mb-1 block">Fill Color</label>
            <input
              type="color"
              value={style.fillColor ?? "#000000"}
              onChange={(e) => handleStyleChange({ fillColor: e.target.value })}
              className="w-full h-8 bg-black/30 border border-white/10 rounded cursor-pointer"
            />
          </div>
        )}

        {hasShowLabels && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showLabels"
              checked={style.showLabels ?? true}
              onChange={(e) => handleStyleChange({ showLabels: e.target.checked })}
              className="w-4 h-4 rounded border border-white/20 bg-black/30"
            />
            <label htmlFor="showLabels" className="text-xs text-white/60">Show Labels</label>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
        <button
          onClick={() => selectedDrawingId && onDelete(selectedDrawingId)}
          className="flex-1 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
        >
          Delete
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-2 py-1 text-xs text-white/60 hover:bg-white/10 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}