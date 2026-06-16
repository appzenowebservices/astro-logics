"use client";

import React, { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import type { MarketInferenceOutput } from "~/server/services/marketInference";

const BIAS_COLORS: Record<string, string> = {
  BULLISH: "#22c55e",
  BEARISH: "#ef4444",
  NEUTRAL: "#94a3b8",
};

const ACTION_COLORS: Record<string, string> = {
  BUY: "#22c55e",
  SELL: "#ef4444",
  WAIT: "#f59e0b",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
};

export default function InferencePanel({
  engineData,
  symbol,
  timeframe,
}: {
  engineData: any;
  symbol: string;
  timeframe: string;
}) {
  const [inference, setInference] = useState<MarketInferenceOutput | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const inferMutation = api.trading.marketInfer.useMutation({
    onSuccess: (res) => {
      if (res.success && res.data) {
        setInference(res.data);
      }
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleInfer = useCallback(() => {
    if (!engineData) return;

    setIsLoading(true);

    inferMutation.mutate({
      symbol,
      timeframe,
      trend: engineData.trend.state,
      volatility: engineData.volatility.state,
      compression: engineData.compression.state,
      liquidity: engineData.liquidity.state,
      astro: engineData.astro,
      recentEvents: engineData.events.slice(-10).map((e: any) => ({
        type: e.type,
        strength: e.strength ?? 0.5,
        confidence: e.confidence ?? 0.5,
        narrative: e.narrative ?? "",
      })),
    });
  }, [engineData, symbol, timeframe, inferMutation]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0d] p-4 font-mono text-xs text-white/80">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide text-white/50 uppercase">
            LLM Inference
          </span>
          {isLoading && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-accent-orange)] border-t-transparent" />
          )}
        </div>

        <button
          onClick={handleInfer}
          disabled={isLoading || !engineData}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          {isLoading ? "Inferring..." : "Run Inference"}
        </button>
      </div>

      {inference ? (
        <div className="flex flex-col gap-3">
          {/* Bias + Confidence Row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 uppercase">Bias</span>
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: `${BIAS_COLORS[inference.marketBias]}20`,
                  color: BIAS_COLORS[inference.marketBias],
                }}
              >
                {inference.marketBias}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 uppercase">Conf</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${inference.confidence * 100}%`,
                      backgroundColor: BIAS_COLORS[inference.marketBias],
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold">
                  {Math.round(inference.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 uppercase">Risk</span>
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: `${RISK_COLORS[inference.riskLevel]}20`,
                  color: RISK_COLORS[inference.riskLevel],
                }}
              >
                {inference.riskLevel}
              </span>
            </div>
          </div>

          {/* Suggested Action */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 uppercase">Action</span>
            <span
              className="rounded-md px-3 py-1 text-[13px] font-bold tracking-wider"
              style={{
                backgroundColor: `${ACTION_COLORS[inference.suggestedAction]}20`,
                color: ACTION_COLORS[inference.suggestedAction],
              }}
            >
              {inference.suggestedAction}
            </span>
          </div>

          {/* Reasoning */}
          {inference.reasoning && (
            <div>
              <span className="text-[10px] text-white/40 uppercase">
                Reasoning
              </span>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                {inference.reasoning}
              </p>
            </div>
          )}

          {/* Key Factors */}
          {inference.keyFactors.length > 0 && (
            <div>
              <span className="text-[10px] text-white/40 uppercase">
                Key Factors
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {inference.keyFactors.map((factor, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-[10px] text-white/30">
          Click &quot;Run Inference&quot; to analyze the current market state.
        </div>
      )}
    </div>
  );
}
