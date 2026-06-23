"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { DrawingManager, getToolRegistry } from "lightweight-charts-drawing";

import { MarketStateEngine } from "../../../../trade_engine/lib/MarketStateEngine";
import {
  normalizeCandlestickData,
  type CandlestickData,
} from "./chart-helpers";
import { useTradingChart } from "../../hooks/useTradingChart";
import { api } from "~/trpc/react";
import { registerCustomFibTool } from "./CustomFibRetracement";

import MarketChartRenderer, {
  type MarketVisualizationData,
} from "./MarketChartRenderer";
import DrawingToolbar from "./DrawingToolbar";
import WindowAnalysisPanel from "./WindowAnalysisPanel";
import DrawingStyleEditor from "./DrawingStyleEditor";

type LayerState = Record<string, boolean>;

type TimeRangeSelection = {
  start: UTCTimestamp;
  end: UTCTimestamp;
  priceLow?: number;
  priceHigh?: number;
};

type WindowAnalysisResult = {
  events: any[];
  summary: Record<string, number>;
  snapshot?: any;
};

type EngineSnapshotData = MarketVisualizationData & {
  timestamp: number;
  astro: any;
};

export default function TradingChart({
  history,
  symbol,
  astroChart,
  timeframe,
  assetAstroState,
  onTimeframeChange,
}: {
  history: CandlestickData[];
  symbol: string;
  astroChart?: any;
  timeframe: string;
  assetAstroState?: any;
  onTimeframeChange?: (tf: string) => void;
}) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const drawingManagerRef = useRef<DrawingManager | null>(null);

  const { chartRef, seriesRef, markersRef } =
    useTradingChart(chartContainerRef);

  const saveChartDrawingMutation = api.trading.saveChartDrawing.useMutation();
  const scanWindowMutation = api.trading.scanWindow.useMutation();
  const deleteChartDrawingMutation =
    api.trading.deleteChartDrawing.useMutation();

  const initializedKeyRef = useRef<string | null>(null);
  const lastRenderedTimeRef = useRef<UTCTimestamp | null>(null);
  const engineRef = useRef<MarketStateEngine | null>(null);

  const [timeRangeSelection, setTimeRangeSelection] =
    useState<TimeRangeSelection>(null);
  const [boxSelection, setBoxSelection] = useState<TimeRangeSelection>(null);
  const [windowAnalysis, setWindowAnalysis] =
    useState<WindowAnalysisResult>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null,
  );
  const [selectedDrawingStyle, setSelectedDrawingStyle] = useState<any>(null);
  const [isChartInitialized, setIsChartInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
const [layers, setLayers] = useState<LayerState>({
    swingHighs: false,
    swingLows: false,
    labels: false,
    trendLines: false,
    liquidityPools: false,
    liquiditySweeps: false,
    volatilityZones: false,
    compressionZones: true,
    events: true,
  });

  const { data: savedDrawings, refetch: refetchDrawings } = api.trading.getChartDrawings.useQuery(
    { symbol, timeframe },
    { enabled: !!symbol && isChartInitialized },
  );

  const handleSaveDrawing = async (drawing: any, customId?: string) => {
    if (!drawing || !drawing.type || !drawing.anchors) return;

    const drawingId = customId || `${drawing.type}-${Date.now()}`;
    const fibOpts = drawing.fibOptions || drawing.options || {};
    const options = drawing.type === "custom-fib-retracement"
      ? fibOpts
      : drawing.options;

    await saveChartDrawingMutation.mutateAsync({
      symbol,
      timeframe,
      drawingType: drawing.type,
      drawingId,
      anchors: drawing.anchors,
      style: drawing.style || {},
      options,
    });
  };

  const handleSaveDateRangeSelection = async () => {
    if (!timeRangeSelection) return;

    const drawingId = `date-range-${Date.now()}`;
    const anchors = [
      { time: timeRangeSelection.start, price: normalizedHistory[0]?.open ?? 0 },
      { time: timeRangeSelection.end, price: normalizedHistory[normalizedHistory.length - 1]?.open ?? 0 },
    ];

    await saveChartDrawingMutation.mutateAsync({
      symbol,
      timeframe,
      drawingType: "date-range",
      drawingId,
      anchors,
      style: {},
      options: { timeRangeSelection: true },
    });

    setTimeRangeSelection(null);
  };

  const handleAnalyzeWindow = async () => {
    if (!timeRangeSelection || !normalizedHistory.length) return;

    setIsAnalyzing(true);

    const candles = normalizedHistory.filter(
      (c) => c.time >= timeRangeSelection.start && c.time <= timeRangeSelection.end,
    );

    if (candles.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    try {
      const result = await scanWindowMutation.mutateAsync({
        symbol,
        history: candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
        timeframe,
        windowStart: new Date(timeRangeSelection.start * 1000).toISOString(),
        windowEnd: new Date(timeRangeSelection.end * 1000).toISOString(),
      });
      if (result.success && result.data) {
        setWindowAnalysis(result.data);
        createAutoDrawings(result.data);
      }
    } catch (error) {
      console.error("Window analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createAutoDrawings = (analysis: WindowAnalysisResult) => {
    if (!drawingManagerRef.current || !normalizedHistory.length) return;

    const manager = drawingManagerRef.current;
    const registry = getToolRegistry();

    const inRange = (time: number | undefined) =>
      time !== undefined && time >= timeRangeSelection!.start && time <= timeRangeSelection!.end;

    const events = analysis.events || [];
    const volatilitySweeps = events.filter((e) => (e.type === "BSL_SWEEP" || e.type === "SSL_SWEEP") && inRange(e.time));
    const structureBreaks = events.filter((e) => (e.type === "BULLISH_STRUCTURE_BREAK" || e.type === "BEARISH_STRUCTURE_BREAK" || e.type === "REGIME_SHIFT") && inRange(e.time));
    const compressionEvents = events.filter((e) => (e.type === "VOLATILITY_COLLAPSE" || e.type === "COMPRESSION_RELEASE") && inRange(e.time));

    const candlesInRange = normalizedHistory.filter(
      (c) => c.time >= timeRangeSelection!.start && c.time <= timeRangeSelection!.end
    );

    if (candlesInRange.length > 0) {
      const highPrices = candlesInRange.map((c) => c.high);
      const lowPrices = candlesInRange.map((c) => c.low);
      const highestHigh = Math.max(...highPrices);
      const lowestLow = Math.min(...lowPrices);
      const firstCandle = candlesInRange[0];

      const hhDrawing = registry.createDrawing(
        "trend-line",
        `hh-${highestHigh}-${Date.now()}`,
        [
          { time: firstCandle.time as UTCTimestamp, price: highestHigh },
          { time: Math.floor(Date.now() / 1000) + 86400 * 30, price: highestHigh },
        ],
        { lineWidth: 2, lineColor: "#10b981" },
      );
      if (hhDrawing) {
        manager.addDrawing(hhDrawing);
        handleSaveDrawing(hhDrawing, `hh-${highestHigh}-${Date.now()}`);
      }

      const llDrawing = registry.createDrawing(
        "trend-line",
        `ll-${lowestLow}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        [
          { time: firstCandle.time as UTCTimestamp, price: lowestLow },
          { time: Math.floor(Date.now() / 1000) + 86400 * 30, price: lowestLow },
        ],
        { lineWidth: 2, lineColor: "#ef4444" },
      );
      if (llDrawing) {
        manager.addDrawing(llDrawing);
        handleSaveDrawing(llDrawing, `ll-${lowestLow}-${Date.now()}`);
      }

      const fibDrawing = registry.createDrawing(
        "custom-fib-retracement",
        `auto-fib-${Date.now()}`,
        [
          { time: candlesInRange[0].time as UTCTimestamp, price: highestHigh },
          { time: candlesInRange[candlesInRange.length - 1].time as UTCTimestamp, price: lowestLow },
        ],
        { lineWidth: 1 },
        { levels: [0, 0.214, 0.295, 0.705, 0.786, 1], showPrices: true }
      );
      console.log("Fib drawing created:", fibDrawing);
      if (fibDrawing) {
        manager.addDrawing(fibDrawing);
        handleSaveDrawing(fibDrawing);
      }
    }
  };

  const handleDeleteDrawing = async (drawingId: string) => {
    if (!drawingManagerRef.current) return;

    drawingManagerRef.current.removeDrawing(drawingId);
    setSelectedDrawingId(null);
    setSelectedDrawingStyle(null);

    try {
      await deleteChartDrawingMutation.mutateAsync({
        symbol,
        timeframe,
        drawingId,
      });
      await refetchDrawings();
    } catch (error) {
      console.error("Failed to delete drawing:", error);
    }
  };

  const handleUpdateAllStyles = async (style: any) => {
    if (!drawingManagerRef.current) return;

    const allDrawings = drawingManagerRef.current.getAllDrawings();
    for (const drawing of allDrawings) {
      if (drawing.type === "custom-fib-retracement" && drawing.setFibOptions && style.levels) {
        drawing.setFibOptions({ levels: style.levels, showPrices: style.showPrices, showPercentages: style.showPercentages });
      } else {
        drawing.updateStyle(style);
      }
      try {
        const fibOpts = drawing.fibOptions || drawing.options;
        await saveChartDrawingMutation.mutateAsync({
          symbol,
          timeframe,
          drawingType: drawing.type,
          drawingId: drawing.id,
          anchors: drawing.anchors,
          style: drawing.style,
          options: drawing.type === "custom-fib-retracement" ? fibOpts : drawing.options,
        });
      } catch (error) {
        console.error("Failed to update drawing:", error);
      }
    }
    await refetchDrawings();
  };

  engineRef.current ??= new MarketStateEngine();

  const normalizedHistory = useMemo(() => {
    const result = normalizeCandlestickData(history);
    return result;
  }, [history]);

  const data = useMemo<EngineSnapshotData | null>(() => {
    if (!normalizedHistory.length) return null;
    return engineRef.current!.extract(
      normalizedHistory,
      assetAstroState ?? astroChart,
    );
  }, [assetAstroState, astroChart, normalizedHistory]);

  useEffect(() => {
    if (engineRef.current) {
      (engineRef.current as any).previousState = null;
    }
    initializedKeyRef.current = null;
  }, [symbol, timeframe]);

  const chartKey = `${symbol}:${timeframe}`;

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !normalizedHistory.length) return;

    const lastCandle = normalizedHistory[normalizedHistory.length - 1];
    if (!lastCandle) return;

    if (initializedKeyRef.current !== chartKey) {
      series.setData(normalizedHistory);
      chartRef.current?.timeScale().fitContent();
      initializedKeyRef.current = chartKey;
      lastRenderedTimeRef.current = lastCandle.time;
      setIsChartInitialized(true);
      return;
    }

    if (
      lastRenderedTimeRef.current !== null &&
      lastCandle.time < lastRenderedTimeRef.current
    ) {
      series.setData(normalizedHistory);
      chartRef.current?.timeScale().fitContent();
      lastRenderedTimeRef.current = lastCandle.time;
      return;
    }

    series.update(lastCandle);
    lastRenderedTimeRef.current = lastCandle.time;
  }, [chartKey, chartRef, normalizedHistory, seriesRef]);

  // Sync activeTool changes to the drawing manager
  useEffect(() => {
    if (drawingManagerRef.current && isChartInitialized) {
      drawingManagerRef.current.setActiveTool(activeTool);
    }
  }, [activeTool, isChartInitialized]);

  useEffect(() => {
    const manager = drawingManagerRef.current;
    if (!manager || !savedDrawings?.data) return;

    const registry = getToolRegistry();
    savedDrawings.data.forEach((saved: any) => {
      let drawing: any;
      if (saved.drawingType === "custom-fib-retracement") {
        drawing = registry.createDrawing(
          saved.drawingType,
          saved.drawingId,
          saved.anchors,
          saved.style || {},
          saved.options || { levels: [0, 0.214, 0.295, 0.705, 0.786, 1], showPrices: true },
        );
      } else {
        drawing = registry.createDrawing(
          saved.drawingType,
          saved.drawingId,
          saved.anchors,
          saved.style || {},
        );
      }
      if (drawing) {
        manager.addDrawing(drawing);
      } else {
        console.log("Failed to create drawing:", saved.drawingType, saved.drawingId);
      }
    });
  }, [savedDrawings]);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = chartContainerRef.current;
    if (!chart || !series || !isChartInitialized || !container) return;

    registerCustomFibTool();

    const manager = new DrawingManager();
    manager.attach(chart, series, container);
    drawingManagerRef.current = manager;

    const registry = getToolRegistry();

    let isMouseDown = false;
    let startPoint: { time: UTCTimestamp; price: number } | null = null;
    let previewId: string | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      if (!activeTool) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (time !== null && price !== null) {
        startPoint = { time: time as UTCTimestamp, price };
        isMouseDown = true;

        previewId = `preview-${Date.now()}`;
        const drawing = registry.createDrawing(activeTool, previewId, [
          startPoint,
        ]);

        if (drawing) {
          manager.addDrawing(drawing);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || !startPoint || !previewId || !activeTool) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (time !== null && price !== null) {
        const drawing = manager.getDrawing(previewId);
        if (drawing) {
          drawing.setAnchors([
            { time: startPoint.time, price: startPoint.price },
            { time: time, price },
          ] as any);
        }
      }
    };

    const handleMouseUp = () => {
if (isMouseDown && previewId && startPoint && activeTool) {
        const drawing = manager.getDrawing(previewId);
        if (drawing && drawing.isValid()) {
          // Save the completed drawing to DB
          handleSaveDrawing(drawing);

          if (activeTool === "date-range") {
            const anchors = drawing.anchors;
            if (anchors && anchors.length >= 2) {
              setTimeRangeSelection({
                start: anchors[0].time as UTCTimestamp,
                end: anchors[1].time as UTCTimestamp,
              });
              setActiveTool(null);
            }
          }

          if (activeTool === "rectangle") {
            const anchors = drawing.anchors;
            if (anchors && anchors.length >= 2) {
              const times = anchors.map((a: any) => a.time as UTCTimestamp);
              const prices = anchors.map((a: any) => a.price as number);
              setBoxSelection({
                start: Math.min(...times),
                end: Math.max(...times),
                priceLow: Math.min(...prices),
                priceHigh: Math.max(...prices),
              });
              setActiveTool(null);
            }
          }
        } else if (previewId) {
          manager.removeDrawing(previewId);
        }

        isMouseDown = false;
        startPoint = null;
        previewId = null;
      };

      isMouseDown = false;
      startPoint = null;
      previewId = null;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);

if (activeTool) {
      chart.applyOptions({
        handleScroll: false,
        handleScale: false,
      });
    }

const unsubscribe = manager.on("drawing:added", (event) => {
      const drawing = event.drawing;
      if (drawing && "type" in drawing) {
        if (drawing.type === "date-range") {
          const anchors = drawing.anchors;
          if (anchors && anchors.length >= 2) {
            setTimeRangeSelection({
              start: anchors[0].time as UTCTimestamp,
              end: anchors[anchors.length - 1].time as UTCTimestamp,
            });
            setActiveTool(null);
            handleSaveDateRangeSelection();
          }
        }
        if (drawing.type === "rectangle") {
           const anchors = drawing.anchors;
           if (anchors && anchors.length >= 2) {
             const times = anchors.map((a: any) => a.time as UTCTimestamp);
             const prices = anchors.map((a: any) => a.price as number);
             setBoxSelection({
               start: Math.min(...times),
               end: Math.max(...times),
               priceLow: Math.min(...prices),
               priceHigh: Math.max(...prices),
             });
             setActiveTool(null);
           }
         }
      }
    });

    const handleDrawingSelected = (event: any) => {
      const drawing = event.drawing || drawingManagerRef.current?.getDrawing(event.drawingId);
      if (drawing) {
        setSelectedDrawingId(event.drawingId);
        const baseStyle = {
          lineWidth: drawing.style?.lineWidth,
          lineStyle: drawing.style?.lineDash,
        };
        const fibOpts = drawing.fibOptions || drawing.options;
        if (drawing.type === "custom-fib-retracement" && fibOpts?.levels) {
          setSelectedDrawingStyle({
            ...baseStyle,
            levels: fibOpts.levels,
            showPrices: fibOpts.showPrices,
            showPercentages: fibOpts.showPercentages,
          });
        } else {
          setSelectedDrawingStyle(baseStyle);
        }
      }
    };
    
    const handleDrawingDeselected = () => {
      setSelectedDrawingId(null);
      setSelectedDrawingStyle(null);
    };

    const unsubscribeSelected = manager.on("drawing:selected", handleDrawingSelected);
    const unsubscribeDeselected = manager.on("drawing:deselected", handleDrawingDeselected);

    return () => {
      unsubscribe();
      unsubscribeSelected();
      unsubscribeDeselected();
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      manager.detach();
    };
  }, [chartRef, seriesRef, isChartInitialized, activeTool, savedDrawings]);

  return (
    <div className="relative h-full min-h-[500px] w-full rounded-2xl border border-white/[0.05] bg-[var(--color-primary-dark)]">
      <DrawingToolbar 
        activeTool={activeTool} 
        onToolSelect={setActiveTool}
        hasTimeRangeSelection={!!timeRangeSelection}
        onProcessRange={handleAnalyzeWindow}
        isProcessing={isAnalyzing}
      />

      <div className="absolute top-2 right-2 z-[100] flex items-center gap-2">
        <div className="flex gap-1 rounded border border-white/20 bg-black/70 p-1 backdrop-blur-sm">
          <span className="px-2 py-1 text-xs text-white/60">TF:</span>
          <select
            value={timeframe}
            onChange={(e) => {
              const newTimeframe = e.target.value;
              onTimeframeChange?.(newTimeframe);
            }}
            className="rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-white focus:outline-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="M1" className="bg-black">
              1m
            </option>
            <option value="M5" className="bg-black">
              5m
            </option>
            <option value="M15" className="bg-black">
              15m
            </option>
            <option value="M30" className="bg-black">
              30m
            </option>
            <option value="H1" className="bg-black">
              1h
            </option>
            <option value="H4" className="bg-black">
              4h
            </option>
            <option value="D1" selected className="bg-black">
              1d
            </option>
          </select>
        </div>
      </div>

      <MarketChartRenderer
        chartRef={chartRef}
        seriesRef={seriesRef}
        markersRef={markersRef}
        data={data}
        layers={layers}
      />

      {windowAnalysis && (
        <WindowAnalysisPanel
          analysis={windowAnalysis}
          symbol={symbol}
          timeframe={timeframe}
          onStitch={() => {
            console.log("Stitch triggered for:", windowAnalysis);
          }}
          isAnalyzing={isAnalyzing}
        />
      )}

      {selectedDrawingId && (
        <DrawingStyleEditor
          selectedDrawingId={selectedDrawingId}
          currentStyle={selectedDrawingStyle}
          onUpdateAllStyles={handleUpdateAllStyles}
          onDelete={handleDeleteDrawing}
          onClose={() => {
            setSelectedDrawingId(null);
            setSelectedDrawingStyle(null);
          }}
        />

      )}

      <div ref={chartContainerRef} className="h-full w-full" />
    </div>
  );
}
