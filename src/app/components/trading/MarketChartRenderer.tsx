import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { AreaSeries, LineSeries } from "lightweight-charts";
import type {
  IChartApi,
  IPriceLine,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import { toEventMarker, type ChartEvent } from "./EventMarkerStyles";

type SwingPoint = {
  time: number;
  price: number;
};

type TrendLabel = {
  time: number;
  text: "HH" | "HL" | "LH" | "LL";
};

type LiquiditySweep = {
  time: number;
  type: "BUY_SIDE_SWEEP" | "SELL_SIDE_SWEEP";
};

type LiquidityPool = {
  price: number;
  strength: number;
  type: "BUY_SIDE" | "SELL_SIDE";
};

type VolatilityZone = {
  time: number;
};

type VolatilityEnvelopePoint = {
  time: number;
  upper: number;
};

type TrendLine = {
  fromTime: number;
  fromPrice: number;
  toTime: number;
  toPrice: number;
};

export type MarketVisualizationData = {
  trend: {
    state: any;
    visualization: {
      swingHighs: SwingPoint[];
      swingLows: SwingPoint[];
      labels: TrendLabel[];
      trendLines: TrendLine[];
    };
  };
  liquidity: {
    state: any;
    visualization: {
      sweeps: LiquiditySweep[];
      pools: LiquidityPool[];
    };
  };
  volatility?: {
    state?: any;
    visualization?: {
      expansionZones: VolatilityZone[];
    };
  };
  compression?: {
    state?: any;
    visualization?: {
      volatilityEnvelope: VolatilityEnvelopePoint[];
    };
  };
  events: ChartEvent[];
};

type SeriesMarkersApi = {
  setMarkers: (markers: unknown[]) => void;
};

type MarketChartRendererProps = {
  chartRef: RefObject<IChartApi | null>;
  seriesRef: RefObject<ISeriesApi<"Candlestick"> | null>;
  markersRef: RefObject<SeriesMarkersApi | null>;
  data: MarketVisualizationData | null;
  layers: Record<string, boolean>;
};

export default function MarketChartRenderer({
  chartRef,
  seriesRef,
  markersRef,
  data,
  layers,
}: MarketChartRendererProps) {
  const trendLineSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const liquidityLinesRef = useRef<IPriceLine[]>([]);
  const volEnvelopeSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const markersApi = markersRef.current;

    if (!data || !chart || !series || !markersApi) return;

    const { trend, liquidity, volatility, compression, events } = data;

    const markers = [
      ...(layers.swingHighs
        ? trend.visualization.swingHighs.map((swing) => ({
            time: swing.time as UTCTimestamp,
            position: "aboveBar" as const,
            color: "#ef4444",
            shape: "arrowDown" as const,
            text: "SH",
          }))
        : []),

      ...(layers.swingLows
        ? trend.visualization.swingLows.map((swing) => ({
            time: swing.time as UTCTimestamp,
            position: "belowBar" as const,
            color: "#22c55e",
            shape: "arrowUp" as const,
            text: "SL",
          }))
        : []),

      ...(layers.labels
        ? trend.visualization.labels.map((label) => ({
            time: label.time as UTCTimestamp,
            position:
              label.text === "HH" || label.text === "LH"
                ? ("aboveBar" as const)
                : ("belowBar" as const),
            color: "#f59e0b",
            shape: "circle" as const,
            text: label.text,
          }))
        : []),

      ...(layers.liquiditySweeps
        ? liquidity.visualization.sweeps.map((sweep) => ({
            time: sweep.time as UTCTimestamp,
            position:
              sweep.type === "BUY_SIDE_SWEEP"
                ? ("aboveBar" as const)
                : ("belowBar" as const),
            color: sweep.type === "BUY_SIDE_SWEEP" ? "#ef4444" : "#22c55e",
            shape: "square" as const,
            text: "SWEEP",
          }))
        : []),

      ...(layers.volatilityZones && volatility?.visualization?.expansionZones
        ? volatility.visualization.expansionZones.map((zone) => ({
            time: zone.time as UTCTimestamp,
            position: "belowBar" as const,
            color: "#8b5cf6",
            shape: "circle" as const,
            text: "VOL",
          }))
        : []),

      ...(layers.events ? events.map(toEventMarker) : []),
    ];

    markersApi.setMarkers(markers);

    liquidityLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch {}
    });

    liquidityLinesRef.current = [];

    if (layers.liquidityPools) {
      liquidity.visualization.pools.forEach((pool) => {
        const line = series.createPriceLine({
          price: pool.price,
          color: pool.type === "BUY_SIDE" ? "#ef4444" : "#22c55e",
          lineWidth: Math.max(1, Math.min(4, Math.round(pool.strength / 3))) as
            | 1
            | 2
            | 3
            | 4,
          lineStyle: 2,
          axisLabelVisible: true,
          title:
            pool.type === "BUY_SIDE"
              ? `BSL ${pool.strength}`
              : `SSL ${pool.strength}`,
        });

        liquidityLinesRef.current.push(line);
      });
    }

    if (volEnvelopeSeriesRef.current) {
      try {
        chart.removeSeries(volEnvelopeSeriesRef.current);
      } catch {}

      volEnvelopeSeriesRef.current = null;
    }

    if (
      layers.compressionZones &&
      compression?.visualization?.volatilityEnvelope?.length
    ) {
      const area = chart.addSeries(AreaSeries, {
        topColor: "rgba(59,130,246,0.10)",
        bottomColor: "rgba(59,130,246,0.03)",
        lineColor: "rgba(59,130,246,0.20)",
        lineWidth: 1,
      });

      area.setData(
        compression.visualization.volatilityEnvelope.map((point) => ({
          time: point.time as UTCTimestamp,
          value: point.upper,
        })),
      );

      volEnvelopeSeriesRef.current = area;
    }

    trendLineSeriesRef.current.forEach((lineSeries) => {
      try {
        chart.removeSeries(lineSeries);
      } catch {}
    });

    trendLineSeriesRef.current = [];

    if (layers.trendLines) {
      trend.visualization.trendLines.forEach((line) => {
        const lineSeries = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          lastValueVisible: false,
          priceLineVisible: false,
        });

        lineSeries.setData([
          {
            time: line.fromTime as UTCTimestamp,
            value: line.fromPrice,
          },
          {
            time: line.toTime as UTCTimestamp,
            value: line.toPrice,
          },
        ]);

        trendLineSeriesRef.current.push(lineSeries);
      });
    }
  }, [chartRef, data, layers, markersRef, seriesRef]);

  return null;
}
