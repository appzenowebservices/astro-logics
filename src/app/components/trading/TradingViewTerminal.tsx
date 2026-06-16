"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import type { UTCTimestamp } from "lightweight-charts";
import TradingChart from "./TradingChart";
import WatchlistSidebar from "./WatchlistSidebar";

export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

type Timeframe = {
  label: string;
  value: number;
  tfParam: string;
  sourceTfParam: string;
};

const TIMEFRAMES = [
  { label: "1m", value: 60, tfParam: "M1", sourceTfParam: "M1" },
  { label: "5m", value: 300, tfParam: "M5", sourceTfParam: "M5" },
  { label: "15m", value: 900, tfParam: "M15", sourceTfParam: "M15" },
  { label: "30m", value: 1800, tfParam: "M30", sourceTfParam: "M30" },
  { label: "1h", value: 3600, tfParam: "H1", sourceTfParam: "H1" },
  { label: "4h", value: 14400, tfParam: "H4", sourceTfParam: "H4" },
  { label: "1d", value: 86400, tfParam: "D1", sourceTfParam: "D1" },
] as const satisfies Timeframe[];

const AVAILABLE_ASSETS = [
  { symbol: "GBPUSD", label: "GBP / USD", category: "Forex", exchange: "ICE" },
  { symbol: "EURUSD", label: "EUR / USD", category: "Forex", exchange: "ICE" },
  {
    symbol: "BTCUSD",
    label: "BTC / USD",
    category: "Crypto",
    exchange: "COINBASE",
  },
] as const;

const HISTORY_COUNT = 250;

function toUtcTimestamp(seconds: number): UTCTimestamp {
  return seconds as UTCTimestamp;
}

function interpolatePrice(
  open: number,
  close: number,
  progress: number,
): number {
  return open + (close - open) * progress;
}

function normalizeHistory(data: unknown): CandlestickData[] {
  if (!Array.isArray(data)) return [];

  return data.flatMap((candle) => {
    if (!candle || typeof candle !== "object") return [];

    const item = candle as Partial<CandlestickData>;
    const time = typeof item.time === "number" ? item.time : Number(item.time);
    const open = Number(item.open);
    const high = Number(item.high);
    const low = Number(item.low);
    const close = Number(item.close);
    const values = [time, open, high, low, close];

    if (values.some((value) => !Number.isFinite(value))) return [];

    return [
      {
        time: toUtcTimestamp(time),
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
      },
    ];
  });
}

function expandM1Bars(
  history: CandlestickData[],
  timeframeSeconds: 5 | 15,
): CandlestickData[] {
  const subBarsPerMinute = 60 / timeframeSeconds;
  const highIndex = Math.floor(subBarsPerMinute / 2);
  const lowIndex = Math.min(subBarsPerMinute - 1, highIndex + 1);

  return history.flatMap((bar) => {
    const minuteStart = Math.floor(Number(bar.time) / 60) * 60;
    const candles: CandlestickData[] = [];

    for (let index = 0; index < subBarsPerMinute; index += 1) {
      const startProgress = index / subBarsPerMinute;
      const endProgress = (index + 1) / subBarsPerMinute;
      const open = interpolatePrice(bar.open, bar.close, startProgress);
      const close = interpolatePrice(bar.open, bar.close, endProgress);
      const high =
        index === highIndex
          ? Math.max(bar.high, open, close)
          : Math.max(open, close);
      const low =
        index === lowIndex
          ? Math.min(bar.low, open, close)
          : Math.min(open, close);

      candles.push({
        time: toUtcTimestamp(minuteStart + index * timeframeSeconds),
        open,
        high,
        low,
        close,
      });
    }

    return candles;
  });
}

function isSubMinuteTimeframe(timeframe: Timeframe): boolean {
  return timeframe.value < 60;
}

function formatPrice(price: number | undefined): string {
  if (price === undefined || !Number.isFinite(price)) return "—";
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(5);
  return price.toFixed(6);
}

function formatBrokerTime(brokerTime: string | undefined): string {
  const timestamp = Number(brokerTime);
  if (!Number.isFinite(timestamp)) return "";

  return new Date(timestamp * 1000).toLocaleTimeString("en-GB", {
    hour12: false,
  });
}

export default function TradingViewTerminal() {
  const [selectedAsset, setSelectedAsset] = useState<
    (typeof AVAILABLE_ASSETS)[number]
  >(AVAILABLE_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[0]);
  const [history, setHistory] = useState<CandlestickData[]>([]);

  const lastProcessedTimeRef = useRef<number | null>(null);

  const historyQuery = api.trading.getHistory.useQuery(
    {
      symbol: selectedAsset?.symbol,
      timeframe: timeframe?.tfParam,
      count: HISTORY_COUNT,
    },
    { refetchOnWindowFocus: false },
  );

  const liveTickQuery = api.trading.getPrice.useQuery(
    { symbol: selectedAsset?.symbol },
    { refetchInterval: 1000, enabled: !historyQuery.isFetching },
  );

  const astroChartQuery = api.mundane.calculateChart.useQuery(
    { dateTime: new Date(), latitude: 51.5, longitude: -0.12, timezone: "UTC" },
    { refetchInterval: 300000 },
  );

  const assetAstroQuery = api.trading.getAssetAstroState.useQuery(
    { symbol: selectedAsset?.symbol },
    { refetchInterval: 300000, enabled: !!selectedAsset?.symbol },
  );

  useEffect(() => {
    if (historyQuery.data?.data === undefined) return;

    const rawHistory = normalizeHistory(historyQuery.data.data);
    const nextHistory = isSubMinuteTimeframe(timeframe)
      ? expandM1Bars(rawHistory, timeframe.value as 5 | 15)
      : rawHistory;

    setHistory(nextHistory);
    lastProcessedTimeRef.current = null;
  }, [
    historyQuery.data?.data,
    selectedAsset?.symbol,
    timeframe.tfParam,
    timeframe.value,
  ]);

  useEffect(() => {
    const liveData = liveTickQuery.data?.data;
    const currentPrice =
      typeof liveData?.bid === "number" ? liveData.bid : liveData?.ask;

    if (currentPrice === undefined || !Number.isFinite(currentPrice)) return;

    const tickTimeRaw = liveData?.brokerTime
      ? Number(liveData.brokerTime) * 1000
      : Date.now();
    const tickTimeMs = Number.isFinite(tickTimeRaw) ? tickTimeRaw : Date.now();

    if (lastProcessedTimeRef.current === tickTimeMs) return;
    lastProcessedTimeRef.current = tickTimeMs;

    const tickTimeSeconds = Math.floor(tickTimeMs / 1000);
    const candleTime = (Math.floor(tickTimeSeconds / timeframe.value) *
      timeframe.value) as UTCTimestamp;

    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;

      const updatedHistory = [...prevHistory];
      const lastCandle = updatedHistory[updatedHistory.length - 1];

      if (lastCandle.time === candleTime) {
        updatedHistory[updatedHistory.length - 1] = {
          ...lastCandle,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          close: currentPrice,
        };

        return updatedHistory;
      }

      if (candleTime > lastCandle.time) {
        updatedHistory.push({
          time: candleTime,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        });
      }

      return updatedHistory;
    });
  }, [liveTickQuery.data, timeframe.value]);

  const latestCandle = history[history.length - 1];
  const livePrice =
    typeof liveTickQuery.data?.data?.bid === "number"
      ? liveTickQuery.data.data.bid
      : liveTickQuery.data?.data?.ask;
  const displayedPrice = livePrice ?? latestCandle?.close;
  const brokerTime = formatBrokerTime(liveTickQuery.data?.data?.brokerTime);
  const liveStatus = historyQuery.isFetching
    ? "SYNC"
    : liveTickQuery.isError
      ? "ERR"
      : liveTickQuery.isLoading
        ? "WAIT"
        : "LIVE";

  return (
    <div className="flex h-[calc(100vh-140px)] w-full rounded-2xl border border-white/[0.05] bg-[#060607] shadow-2xl">
      <div className="relative flex-1 border-r border-white/[0.03]">
        <div className="absolute top-4 left-1/2 z-[60] flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 px-2">
          <div className="rounded-full border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-[11px] text-white/80 backdrop-blur">
            <span className="font-bold text-white">{selectedAsset.symbol}</span>
            <span className="mx-2 text-white/30">|</span>
            <span
              className={
                livePrice
                  ? "text-[var(--color-accent-orange)]"
                  : "text-white/50"
              }
            >
              {formatPrice(displayedPrice)}
            </span>
            <span className="mx-2 text-white/30">|</span>
            <span
              className={
                liveStatus === "LIVE"
                  ? "text-emerald-400"
                  : liveStatus === "SYNC"
                    ? "text-amber-400"
                    : "text-red-400"
              }
            >
              {liveStatus}
            </span>
            {brokerTime ? (
              <>
                <span className="mx-2 text-white/30">|</span>
                <span>{brokerTime}</span>
              </>
            ) : null}
          </div>

          <select
            value={selectedAsset.symbol}
            onChange={(event) => {
              const nextAsset = AVAILABLE_ASSETS.find(
                (asset) => asset.symbol === event.target.value,
              );
              if (nextAsset) setSelectedAsset(nextAsset);
            }}
            className="h-8 rounded-full border border-white/10 bg-black/70 px-3 pr-8 text-[11px] font-bold text-white uppercase backdrop-blur outline-none"
          >
            {AVAILABLE_ASSETS.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.label}
              </option>
            ))}
          </select>
        </div>

        {historyQuery.isFetching ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#060607] font-mono text-[10px] text-white/30">
            <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-orange)] border-t-transparent" />
            SYNCHRONIZING ENGINE...
          </div>
        ) : (
          <TradingChart
            history={history}
            symbol={selectedAsset.symbol}
            timeframe={timeframe.tfParam}
            astroChart={astroChartQuery.data ?? null}
            assetAstroState={assetAstroQuery.data?.data ?? null}
            onTimeframeChange={(tf) => {
              const nextTf = TIMEFRAMES.find((t) => t.tfParam === tf);
              if (nextTf) setTimeframe(nextTf);
            }}
          />
        )}
      </div>
    </div>
  );
}
