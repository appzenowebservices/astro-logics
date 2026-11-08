import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import type { ISeriesApi, IChartApi } from "lightweight-charts";

import { createSeriesMarkers } from "lightweight-charts";

export const useTradingChart = (
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#f7f3ea" },
        textColor: "#5c6782",
        fontSize: 12,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      },
      grid: {
        vertLines: { color: "rgba(42,65,112,0.06)" },
        horzLines: { color: "rgba(42,65,112,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(42,65,112,0.10)", autoScale: true },
      timeScale: {
        borderColor: "rgba(42,65,112,0.10)",
        timeVisible: true,
        secondsVisible: true,
        shiftVisibleRangeOnNewBar: true,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#d9cba8",
      borderUpColor: "#cbb88f",
      wickUpColor: "#eaddbd",
      downColor: "#4b6193",
      borderDownColor: "#2a4170",
      wickDownColor: "#2a4170",
      priceFormat: { type: "price", precision: 5, minMove: 0.00001 },
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    markersRef.current = createSeriesMarkers(candlestickSeries, []);

    let disposed = false;

    const handleResize = () => {
      // A ResizeObserver callback can be delivered after teardown (or during
      // HMR); applying options to a removed chart throws "Object is disposed".
      if (disposed || !containerRef.current) return;
      try {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      } catch {
        /* chart torn down between frames */
      }
    };

    window.addEventListener("resize", handleResize);

    // The chart's parent changes width when the control panel opens/closes,
    // which does not fire a window resize. Keep the canvas in sync.
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      chart.remove();
    };
  }, []);

  return { chartRef, seriesRef, markersRef };
};
