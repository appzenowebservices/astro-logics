"use client";

import React, { useState, useEffect } from "react";
import { api } from "~/trpc/react";

type MarketEvent = {
  type: string;
  strength?: number;
  confidence?: number;
  narrative?: string;
  metadata?: Record<string, any>;
  time?: number;
};

type AstroState = {
  planetaryPressure?: number;
  aspectTension?: number;
  ingressProximity?: number;
  retrogradeInfluence?: number;
  speedDispersion?: number;
  elementalImbalance?: number;
  lunarPhase?: number;
  confidence?: number;
  dominantTransitPlanets?: string[];
  dominantLatentAxes?: Array<{ axis: string; value: number }>;
  narrative?: string;
};

type AstroSummary = {
  planetaryPressure?: number;
  aspectTension?: number;
  confidence?: number;
  dominantTransitPlanets?: string[];
};

type WindowAnalysisResult = {
  events: MarketEvent[];
  summary: Record<string, number>;
  snapshot?: any;
  astroEvolution?: AstroState[];
};

type MarketNarrative = {
  digitalTwinVoice: string;
  marketPersonality: string;
  transitInfluences: string[];
  behavioralReading: string;
  tradingImplication: string;
  confidence: number;
  timestamp: number;
};

type WindowAnalysisPanelProps = {
  analysis: WindowAnalysisResult;
  symbol: string;
  timeframe: string;
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
  symbol,
  timeframe,
  onStitch,
  isAnalyzing = false,
}: WindowAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [stitchHistory, setStitchHistory] = useState<WindowAnalysisResult[]>(
    [],
  );
  const [narrative, setNarrative] = useState<MarketNarrative | null>(null);

  const generateNarrativeMutation = api.trading.generateMarketNarrative.useMutation();

  useEffect(() => {
    if (symbol && timeframe && (analysis.events?.length ?? 0) > 0 && !narrative) {
      const fetchNarrative = async () => {
        try {
          const astroState = analysis.astroEvolution?.[0];
          const result = await generateNarrativeMutation.mutateAsync({
            symbol,
            timeframe,
            events: analysis.events || [],
            astroSummary: astroState ? {
              planetaryPressure: astroState.planetaryPressure ?? undefined,
              aspectTension: astroState.aspectTension ?? undefined,
              confidence: astroState.confidence ?? undefined,
              dominantTransitPlanets: astroState.dominantTransitPlanets,
            } : undefined,
          });
          setNarrative(result.data);
        } catch (error) {
          console.error("Failed to generate narrative:", error);
        }
      };
      fetchNarrative();
    }
  }, [symbol, timeframe, analysis.events?.length, narrative]);

  const handleStitch = () => {
    setStitchHistory((prev) => [...prev, analysis]);
    onStitch();
  };

  const clearStitchHistory = () => {
    setStitchHistory([]);
  };

  const getAstroSummary = () => {
    const astro = analysis.astroEvolution?.[0];
    if (!astro) return null;
    return {
      pressure: astro.planetaryPressure != null ? astro.planetaryPressure.toFixed(2) : "0.50",
      tension: astro.aspectTension != null ? astro.aspectTension.toFixed(2) : "0.30",
      dominant: astro.dominantTransitPlanets?.slice(0, 3).join(", ") || "None",
    };
  };

  const astroSummary = getAstroSummary();

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
          {narrative && (
            <div className="border-b border-white/10 p-3">
              <div className="mb-1 text-xs font-semibold text-purple-400">
                Digital Twin Voice
              </div>
              <p className="text-xs italic text-white/70">
                {narrative.digitalTwinVoice}
              </p>
              {astroSummary && (
                <div className="mt-2 text-[10px] text-white/40">
                  Pressure: {astroSummary.pressure} | Tension: {astroSummary.tension}
                </div>
              )}
            </div>
          )}

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
