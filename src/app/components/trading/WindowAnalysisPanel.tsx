"use client";

import React, { useState } from "react";

type MarketEvent = {
  type: string;
  strength?: number;
  confidence?: number;
  narrative?: string;
  metadata?: Record<string, any>;
  time?: number;
};

type WindowAnalysisResult = {
  events: MarketEvent[];
  summary: Record<string, number>;
  snapshot?: any;
};

type WindowAnalysisPanelProps = {
  analysis: WindowAnalysisResult;
  onStitch: () => void;
  isAnalyzing?: boolean;
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  VOLATILITY_EXPANSION: "text-green-400",
  VOLATILITY_COLLAPSE: "text-red-400",
  HIGH_VOLATILITY_REGIME: "text-yellow-400",
  LOW_VOLATILITY_REGIME: "text-blue-400",
  LIQUIDITY_SWEEP: "text-purple-400",
  STRUCTURE_BREAK: "text-orange-400",
  COMPRESSION_RELEASE: "text-cyan-400",
  REGIME_SHIFT: "text-pink-400",
  MARKET_STATE_INITIALIZED: "text-gray-400",
};

export default function WindowAnalysisPanel({
  analysis,
  onStitch,
  isAnalyzing = false,
}: WindowAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [stitchHistory, setStitchHistory] = useState<WindowAnalysisResult[]>(
    [],
  );

  const handleStitch = () => {
    setStitchHistory((prev) => [...prev, analysis]);
    onStitch();
  };

  const clearStitchHistory = () => {
    setStitchHistory([]);
  };

  return (
    <div className="absolute bottom-2 left-2 z-[100] w-80 rounded-xl border border-white/[0.08] bg-[#0c0c0d]">
      {isAnalyzing && (
        <div className="absolute inset-0 rounded-xl bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            Analyzing...
          </div>
        </div>
      )}
      <div
        className="flex cursor-pointer items-center justify-between p-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide text-white/50 uppercase">
            Window Analysis
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
            {analysis.summary?.totalEvents ?? analysis.events?.length ?? 0}{" "}
            events
          </span>
        </div>
        <button
          className="text-xs text-white/40 hover:text-white/80"
          onClick={(e) => {
            e.stopPropagation();
            handleStitch();
          }}
        >
          Stitch
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="px-3 pb-2">
            {analysis.events && analysis.events.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {analysis.events.slice(0, 10).map((event, i) => (
                  <div
                    key={i}
                    className="border-b border-white/5 py-1 text-xs last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${EVENT_TYPE_COLORS[event.type] || "text-white/60"}`}
                      >
                        {event.type}
                      </span>
                      <span className="text-white/50">
                        {Math.round((event.confidence ?? 0.5) * 100)}%
                      </span>
                    </div>
                    {event.narrative && (
                      <p className="mt-1 text-[10px] leading-tight text-white/40">
                        {event.narrative}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-2 text-xs text-white/30">
                No events detected in this window.
              </p>
            )}
          </div>

          {stitchHistory.length > 0 && (
            <div className="border-t border-white/10 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  Stitched ({stitchHistory.length})
                </span>
                <button
                  onClick={clearStitchHistory}
                  className="text-xs text-red-400/60 hover:text-red-400"
                >
                  Clear
                </button>
              </div>
              <div className="text-[10px] text-white/40">
                {stitchHistory.map((_, i) => (
                  <div key={i}>
                    #{i + 1}: {Math.round((_.summary?.totalEvents ?? 0) * 100)}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
