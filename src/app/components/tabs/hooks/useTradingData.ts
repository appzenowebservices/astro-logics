import { useEffect, useState, useCallback } from "react";
import { KLINES_LIMIT } from "../config/assets";
import {
  formatKlinesData,
  calculatePriceData,
  type PriceData,
  type FormattedCandle,
} from "../utils/formatData";

const CSV_SUPPORTED_TIMEFRAMES = new Set(["1d", "1w", "1M"]);

export const useTradingData = (asset: string, timeframe: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [candleData, setCandleData] = useState<FormattedCandle[]>([]);

  const reconcileRegistry = useCallback(async () => {
    // Prevent reconciliation if asset is missing
    if (!asset) return;

    setLoading(true);
    setError(null);

    try {
      const limit = KLINES_LIMIT[timeframe] || 150;
      const effectiveTimeframe = CSV_SUPPORTED_TIMEFRAMES.has(timeframe)
        ? timeframe
        : "1d";

      // Source candles from local GBPUSD CSV adapter.
      const response = await fetch(
        `/api/charts/gbpusd?timeframe=${effectiveTimeframe}&limit=${limit}`,
        { cache: "no-store" }, // Ensure we aren't pulling stale ledger data
      );

      if (!response.ok) {
        throw new Error(
          `CSV Oracle Error: GBPUSD data unavailable for timeframe [${effectiveTimeframe}].`,
        );
      }

      const payload = await response.json();
      const rawData = payload?.candles;

      if (!rawData || rawData.length === 0) {
        throw new Error("Ledger is currently empty for this timeframe.");
      }

      const formattedData = formatKlinesData(rawData);

      // Update local state with the new reconciled data
      setCandleData(formattedData);
      setPriceData(calculatePriceData(formattedData));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown Registry Error";
      setError(message);
      console.error("Reconciliation Failure:", err);
    } finally {
      // Small delay for the loader to prevent "flashing" on fast connections
      setTimeout(() => setLoading(false), 300);
    }
  }, [asset, timeframe]);

  useEffect(() => {
    // Debounce the fetch slightly to handle fast UI interactions
    const timer = setTimeout(() => {
      reconcileRegistry();
    }, 200);

    return () => clearTimeout(timer);
  }, [reconcileRegistry]);

  useEffect(() => {
    if (!asset) return;

    const pollMsByTimeframe: Record<string, number> = {
      "1m": 10_000,
      "5m": 30_000,
      "15m": 60_000,
      "1h": 120_000,
      "4h": 300_000,
      "1d": 600_000,
      "1w": 900_000,
      "1M": 1_800_000,
    };

    const interval = setInterval(() => {
      reconcileRegistry();
    }, pollMsByTimeframe[timeframe] ?? 60_000);

    return () => clearInterval(interval);
  }, [asset, timeframe, reconcileRegistry]);

  return {
    loading,
    error,
    priceData,
    candleData,
    refresh: reconcileRegistry, // Allow manual ledger refresh
  };
};
