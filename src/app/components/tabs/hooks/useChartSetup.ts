import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { CHART_CONFIG, CANDLESTICK_CONFIG } from "../config/chartConfig";

export const useChartSetup = (
  containerRef: React.RefObject<HTMLDivElement | null>,
) => {
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    // Create chart with config from theme
    chartRef.current = createChart(containerRef.current, {
      ...CHART_CONFIG,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    // Add candlestick series
    seriesRef.current = chartRef.current.addSeries(
      CandlestickSeries,
      CANDLESTICK_CONFIG,
    );

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [containerRef]);

  return { chartRef, seriesRef };
};
