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

  const saveChartSelectionMutation =
    api.trading.saveChartSelection.useMutation();
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
  const isAnalyzingRef = useRef(false);
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

  const { refetch: refetchSelections } =
    api.trading.getChartSelections.useQuery(
      { symbol, timeframe },
      { enabled: !!symbol },
    );

  const { data: savedDrawings, refetch: refetchDrawings } = api.trading.getChartDrawings.useQuery(
    { symbol, timeframe },
    { enabled: !!symbol && isChartInitialized },
  );

  const handleSaveComplete = async () => {
    await refetchSelections();
  };

  const handleSaveSelection = async () => {
    if (!timeRangeSelection) return;
    const candles = normalizedHistory.filter(
      (c) =>
        c.time >= timeRangeSelection.start && c.time <= timeRangeSelection.end,
    );
    if (candles.length === 0) return;

    const priceLow = Math.min(...candles.map((c) => c.low));
    const priceHigh = Math.max(...candles.map((c) => c.high));

    await saveChartSelectionMutation.mutateAsync({
      symbol,
      timeframe,
      timeStart: timeRangeSelection.start,
      timeEnd: timeRangeSelection.end,
      priceLow,
      priceHigh,
    });
    await handleSaveComplete();
  };

  const handleSaveDrawing = async (drawing: any) => {
    if (!drawing || !drawing.type || !drawing.anchors) return;

    const drawingId = `${drawing.type}-${Date.now()}`;
    const options = drawing.type === "custom-fib-retracement"
      ? drawing.fibOptions || drawing.options
      : drawing.options;

    await saveChartDrawingMutation.mutateAsync({
      symbol,
      timeframe,
      drawingType: drawing.type,
      drawingId,
      anchors: drawing.anchors,
      style: drawing.style,
      options,
    });
  };

  const handleAnalyzeWindow = async () => {
    if (!boxSelection || !normalizedHistory.length) return;

    setIsAnalyzing(true);

    const candles = normalizedHistory.filter(
      (c) => c.time >= boxSelection.start && c.time <= boxSelection.end,
    );

    if (candles.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    try {
      const result = await scanWindowMutation.mutateAsync({
        history: candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
        timeframe,
        windowStart: new Date(boxSelection.start * 1000).toISOString(),
        windowEnd: new Date(boxSelection.end * 1000).toISOString(),
      });

      if (result.success && result.data) {
        setWindowAnalysis(result.data);
      }
    } catch (error) {
      console.error("Window analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
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
        await saveChartDrawingMutation.mutateAsync({
          symbol,
          timeframe,
          drawingType: drawing.type,
          drawingId: drawing.id,
          anchors: drawing.anchors,
          style: drawing.style,
          options: drawing.options,
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

  useEffect(() => {
    if (!boxSelection || isAnalyzingRef.current) return;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    void (async () => {
      await handleAnalyzeWindow();
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    })();
  }, [boxSelection]);

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

    // Load saved drawings
    if (savedDrawings?.data) {
      savedDrawings.data.forEach((saved: any) => {
        let drawing: any;
        if (saved.drawingType === "custom-fib-retracement") {
          drawing = registry.createDrawing(
            saved.drawingType,
            saved.drawingId,
            saved.anchors,
            saved.style,
            saved.options,
          );
        } else {
          drawing = registry.createDrawing(
            saved.drawingType,
            saved.drawingId,
            saved.anchors,
            saved.style,
          );
        }
        if (drawing) {
          manager.addDrawing(drawing);
        }
      });
    }

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
            }
          }
        } else if (previewId) {
          manager.removeDrawing(previewId);
        }
      }

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
          }
        }
      }
    });

    const handleCanvasClick = (e: MouseEvent) => {
      console.log('=========== hua kucj ???')
      if (activeTool) return;

      const rect = container.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      const drawing = manager.hitTest(point);

      if (drawing) {
        manager.selectDrawing(drawing.id);
      } else {
        manager.deselectAll();
      }
    };

    container.addEventListener("click", handleCanvasClick);

    const handleDrawingSelected = (event: any) => {
      if (event.drawingId) {
        const drawing = drawingManagerRef.current?.getDrawing(event.drawingId);
        if (drawing) {
          setSelectedDrawingId(event.drawingId);
          const baseStyle = {
            lineWidth: drawing.style?.lineWidth,
            lineStyle: drawing.style?.lineDash,
          };
          if (drawing.type === "custom-fib-retracement" && drawing.fibOptions) {
            setSelectedDrawingStyle({
              ...baseStyle,
              levels: drawing.fibOptions.levels,
              showPrices: drawing.fibOptions.showPrices,
              showPercentages: drawing.fibOptions.showPercentages,
            });
          } else {
            setSelectedDrawingStyle(baseStyle);
          }
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
      container.removeEventListener("click", handleCanvasClick);
      manager.detach();
    };
  }, [chartRef, seriesRef, isChartInitialized, activeTool, savedDrawings]);

  return (
    <div className="relative h-full min-h-[500px] w-full rounded-2xl border border-white/[0.05] bg-[var(--color-primary-dark)]">
      <DrawingToolbar activeTool={activeTool} onToolSelect={setActiveTool} />

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
            <option value="D1" className="bg-black">
              1d
            </option>
          </select>
        </div>

        {timeRangeSelection && (
          <button
            onClick={handleSaveSelection}
            disabled={saveChartSelectionMutation.isPending}
            className="rounded border border-green-500 bg-green-500/20 px-2 py-1 text-xs text-green-400 transition-colors hover:bg-green-500/30 disabled:opacity-50"
          >
            {saveChartSelectionMutation.isPending
              ? "Saving..."
              : "Save Selection"}
          </button>
        )}

        {boxSelection && (
          <button
            onClick={handleAnalyzeWindow}
            disabled={isAnalyzing}
            className="rounded border border-purple-500 bg-purple-500/20 px-2 py-1 text-xs text-purple-400 transition-colors hover:bg-purple-500/30 disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
          </button>
        )}
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
