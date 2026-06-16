"use client";

import React, { useMemo } from "react";

interface ChakraCell {
  row: number;
  col: number;
  score: number;
  vara: string;
}

export default function SarvatobhadraChakra({
  data,
  selectedDate,
}: {
  data?: {
    overallAuspiciousness: number;
    dominantVara: string;
    dominantNakshatra: string;
    cellsSummary: {
      total: number;
      highScore: number;
      lowScore: number;
      avgScore: number;
    };
  };
  selectedDate?: Date;
}) {
  const cellSize = 50;
  const padding = 40;

  const chakraColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Green - Very auspicious
    if (score >= 60) return "#3b82f6"; // Blue - Auspicious
    if (score >= 40) return "#f59e0b"; // Amber - Neutral
    return "#ef4444"; // Red - Unfavorable
  };

  const chakraCells = useMemo(() => {
    const cells: ChakraCell[] = [];
    const varas = [
      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn",
    ];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        cells.push({
          row,
          col,
          score: Math.round(Math.random() * 100), // Placeholder - replace with actual data
          vara: varas[row % 7],
        });
      }
    }

    return cells;
  }, []);

  return (
    <div className="h-full w-full rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-white">
          Sarvatobhadra Chakra
        </h3>
        {selectedDate && (
          <p className="text-sm text-white/60">
            {selectedDate.toLocaleDateString()}
          </p>
        )}
      </div>

      {data && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Auspiciousness</p>
            <p className="text-xl font-bold text-white">
              {data.overallAuspiciousness}%
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Day Lord</p>
            <p className="text-xl font-bold text-white">{data.dominantVara}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Nakshatra</p>
            <p className="truncate text-sm font-bold text-white">
              {data.dominantNakshatra}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Avg Cell Score</p>
            <p className="text-xl font-bold text-white">
              {data.cellsSummary.avgScore}
            </p>
          </div>
        </div>
      )}

      {/* 8x8 Chakra Grid */}
      <div className="overflow-x-auto">
        <svg
          width={cellSize * 8 + padding * 2}
          height={cellSize * 8 + padding * 2}
          className="mx-auto"
        >
          {/* Grid background */}
          <rect
            width={cellSize * 8 + padding * 2}
            height={cellSize * 8 + padding * 2}
            fill="#1e293b"
          />

          {/* Title */}
          <text
            x={padding + (cellSize * 8) / 2}
            y={20}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            Traditional 8×8 Chakra Grid
          </text>

          {/* Row labels (Varas) */}
          {[
            "Sun",
            "Moon",
            "Mars",
            "Mercury",
            "Jupiter",
            "Venus",
            "Saturn",
            "Moon",
          ].map((vara, idx) => (
            <text
              key={`row-${idx}`}
              x={padding - 10}
              y={padding + cellSize * idx + cellSize / 2 + 5}
              textAnchor="end"
              fill="white"
              fontSize="10"
            >
              {vara.substring(0, 3)}
            </text>
          ))}

          {/* Column labels (Nakshatras) */}
          {["1", "2", "3", "4", "5", "6", "7", "8"].map((col, idx) => (
            <text
              key={`col-${idx}`}
              x={padding + cellSize * idx + cellSize / 2}
              y={padding - 5}
              textAnchor="middle"
              fill="white"
              fontSize="10"
            >
              {col}
            </text>
          ))}

          {/* Grid cells */}
          {chakraCells.map((cell) => (
            <g key={`cell-${cell.row}-${cell.col}`}>
              <rect
                x={padding + cell.col * cellSize}
                y={padding + cell.row * cellSize}
                width={cellSize}
                height={cellSize}
                fill={chakraColor(cell.score)}
                fillOpacity={0.3}
                stroke={chakraColor(cell.score)}
                strokeWidth="1"
              />
              <text
                x={padding + cell.col * cellSize + cellSize / 2}
                y={padding + cell.row * cellSize + cellSize / 2 + 5}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="bold"
              >
                {cell.score}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: "#10b981" }}
          ></div>
          <span className="text-white/70">80-100: Highly Auspicious</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: "#3b82f6" }}
          ></div>
          <span className="text-white/70">60-80: Auspicious</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: "#f59e0b" }}
          ></div>
          <span className="text-white/70">40-60: Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: "#ef4444" }}
          ></div>
          <span className="text-white/70">&lt;40: Unfavorable</span>
        </div>
      </div>
    </div>
  );
}
