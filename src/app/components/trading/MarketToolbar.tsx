"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import LayerControls from "./LayerControls";
import TradingDesk from "./TradingDesk";

type Account = {
  login?: number;
  balance?: number;
  equity?: number;
  freeMargin?: number;
  currency?: string;
  tradeMode?: number;
};

function money(value: number | undefined, currency = "USD") {
  if (value === undefined || Number.isNaN(value)) return "—";
  const prefix = currency === "USD" ? "$" : "";
  return `${prefix}${value.toFixed(2)}${prefix ? "" : ` ${currency}`}`;
}

function formatPrice(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(5);
  return value.toFixed(6);
}

export default function MarketToolbar({
  symbol,
  price,
  status,
  brokerTime,
  assets,
  onSymbolChange,
  timeframes,
  timeframe,
  onTimeframeChange,
  layers,
  onToggleLayer,
}: {
  symbol: string;
  price?: number;
  status: string;
  brokerTime?: string;
  assets: ReadonlyArray<{ symbol: string; label: string }>;
  onSymbolChange: (symbol: string) => void;
  timeframes: ReadonlyArray<{ label: string; tfParam: string }>;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  layers: Record<string, boolean>;
  onToggleLayer: (key: string) => void;
}) {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const accountQuery = api.trading.mt5Account.useQuery(undefined, {
    refetchInterval: 5000,
    retry: 1,
  });
  const account = (accountQuery.data ?? {}) as Account;

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setTradeOpen(false);
        setLayersOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const activeLayers = Object.values(layers).filter(Boolean).length;
  const connected = !accountQuery.isError && account.balance !== undefined;
  const isReal = account.tradeMode === 2;
  const statusTone =
    status === "LIVE"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : status === "SYNC"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
        : "border-red-400/40 bg-red-400/10 text-red-300";

  return (
    <div
      ref={rootRef}
      className="relative z-40 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[var(--color-primary-dark)] px-2.5 py-2 text-white"
    >
      {/* symbol + price */}
      <select
        value={symbol}
        onChange={(event) => onSymbolChange(event.target.value)}
        aria-label="Symbol"
        className="rounded border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-[11px] font-black tracking-[0.08em] uppercase outline-none focus:border-[var(--color-accent-glow)]"
      >
        {assets.map((asset) => (
          <option key={asset.symbol} value={asset.symbol}>
            {asset.symbol}
          </option>
        ))}
      </select>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[15px] leading-none font-black tracking-tight">
          {formatPrice(price)}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-black tracking-[0.12em] uppercase ${statusTone}`}
        >
          {status}
        </span>
        {brokerTime && (
          <span className="hidden font-mono text-[10px] text-white/30 md:inline">
            {brokerTime}
          </span>
        )}
      </div>

      {/* timeframes */}
      <div className="flex items-center gap-1">
        {timeframes.map((tf) => (
          <button
            key={tf.tfParam}
            type="button"
            onClick={() => onTimeframeChange(tf.tfParam)}
            aria-pressed={timeframe === tf.tfParam}
            className={`rounded px-2 py-1 font-mono text-[10px] font-black tracking-[0.06em] uppercase transition-colors ${
              timeframe === tf.tfParam
                ? "bg-white/15 text-white"
                : "text-white/45 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* layers */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setLayersOpen((v) => !v);
              setTradeOpen(false);
            }}
            className="rounded border border-white/15 px-2 py-1 font-mono text-[9px] font-black tracking-[0.1em] text-white/55 uppercase transition-colors hover:text-white"
          >
            Layers {activeLayers}/{Object.keys(layers).length}
          </button>
          {layersOpen && (
            <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-xl border border-white/15 bg-[var(--color-primary-dark)] p-2 shadow-2xl">
              <LayerControls
                layers={layers}
                onToggleLayer={onToggleLayer}
                variant="docked"
              />
            </div>
          )}
        </div>

        {/* account */}
        <div className="hidden items-center gap-3 font-mono text-[9px] tracking-[0.08em] uppercase lg:flex">
          <span className="text-white/30">
            Bal <b className="text-white/80">{money(account.balance, account.currency)}</b>
          </span>
          <span className="text-white/30">
            Eq <b className="text-white/80">{money(account.equity, account.currency)}</b>
          </span>
          {connected && (
            <span
              className={`rounded-full px-2 py-0.5 text-[8px] font-black ${
                isReal
                  ? "bg-red-500/20 text-red-200"
                  : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              {isReal ? "LIVE" : "DEMO"} #{account.login ?? "—"}
            </span>
          )}
        </div>

        {/* execution */}
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setTradeOpen(true);
              setLayersOpen(false);
            }}
            className="rounded bg-emerald-600 px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.1em] text-white uppercase transition-colors hover:bg-emerald-500"
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => {
              setTradeOpen(true);
              setLayersOpen(false);
            }}
            className="rounded bg-red-600 px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.1em] text-white uppercase transition-colors hover:bg-red-500"
          >
            Sell
          </button>

          {tradeOpen && (
            <div className="absolute top-full right-0 z-50 mt-1 w-[320px]">
              <TradingDesk symbol={symbol} livePrice={price} embedded />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
