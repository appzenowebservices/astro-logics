"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { type UTCTimestamp } from "lightweight-charts";
import { ChevronDown, Search, Plus, Check } from "lucide-react";
import TradingChart from "./TradingChart";
import TopToolbar from "./TopToolbar";

// --- TYPE DEFINITIONS ---
export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

// --- SUB-COMPONENT: TOP TOOLBAR ---
export default function TopToolbar({
  selectedAsset,
  onAssetSelect,
  currentTimeframe,
  onTimeframeChange,
  currentPrice,
  isLoading,
}: {
  selectedAsset: (typeof AVAILABLE_ASSETS)[number];
  onAssetSelect: (asset: (typeof AVAILABLE_ASSETS)[number]) => void;
  currentTimeframe: (typeof TIMEFRAMES)[number];
  onTimeframeChange: (tf: (typeof TIMEFRAMES)[number]) => void;
  currentPrice: number;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isForex = selectedAsset.category === "Forex";

  return (
    <div className="z-30 flex h-12 items-center justify-between border-b border-zinc-800 bg-[#1c1c1e] px-3">
      <div className="flex h-full items-center gap-1">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-semibold tracking-wide text-zinc-100 transition hover:bg-zinc-800"
          >
            <span className="text-emerald-400">{selectedAsset.symbol}</span>
            <span className="text-xs font-normal text-zinc-500">
              {selectedAsset.label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute top-9 left-0 z-50 w-64 rounded-lg border border-zinc-800 bg-[#1e1e21] py-1 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search symbol..."
                    className="w-full bg-transparent text-xs text-zinc-200 outline-none"
                    disabled
                  />
                </div>
                {AVAILABLE_ASSETS.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => {
                      onAssetSelect(asset);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-zinc-800"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200">
                        {asset.symbol}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {asset.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-1 text-[9px] text-zinc-400 uppercase">
                        {asset.category}
                      </span>
                      {selectedAsset.symbol === asset.symbol && (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mx-2 h-5 w-[1px] bg-zinc-800" />

        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => onTimeframeChange(tf)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                currentTimeframe.value === tf.value
                  ? "bg-sky-500/10 font-bold text-sky-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 font-mono text-xs">
        <div className="text-right">
          <span className="mb-0.5 block text-[10px] leading-none text-zinc-500 uppercase">
            MT5 Live Bid
          </span>
          <span
            className={`font-bold transition-all duration-200 ${isLoading ? "text-zinc-500" : "text-emerald-400"}`}
          >
            {isLoading && currentPrice === 0
              ? "LOADING..."
              : currentPrice.toFixed(isForex ? 5 : 2)}
          </span>
        </div>
      </div>
    </div>
  );
}
