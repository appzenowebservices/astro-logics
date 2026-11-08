"use client";

import React, { useState } from "react";
import { ChevronDown, Loader2, PanelRightClose, Play } from "lucide-react";
import { api } from "~/trpc/react";

type SectionId = "market" | "layers" | "draw" | "analysis" | "forecast";

/** What the chart needs to draw the forecast overlay. */
export type ForecastView = {
  horizon: number;
  median: number[][];
  bands: Record<string, number[][]>;
};

export type PanelAnalysis = {
  events?: unknown[];
  summary?: Record<string, number>;
};

function formatPrice(price: number | undefined): string {
  if (price === undefined || !Number.isFinite(price)) return "—";
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(5);
  return price.toFixed(6);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1">
      <span className="text-white/35">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

/** Quantile fan: 5–95%, 25–75%, median. */
function FanChart({
  median,
  bands,
}: {
  median: number[];
  bands: Record<string, number[][]>;
}) {
  const pick = (level: string) => bands[level]?.[0] ?? [];
  const low = pick("0.05");
  const high = pick("0.95");
  const innerLow = pick("0.25");
  const innerHigh = pick("0.75");

  const values = [median, low, high, innerLow, innerHigh]
    .flat()
    .filter((value) => Number.isFinite(value));

  if (values.length === 0 || median.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const reach = max - min;
  const span = reach > 0 ? reach : 1;
  const W = 300;
  const H = 92;
  const PAD = 6;

  const x = (index: number) =>
    PAD + (index / (median.length - 1)) * (W - PAD * 2);
  const y = (value: number) => H - PAD - ((value - min) / span) * (H - PAD * 2);

  const line = (points: number[]) =>
    points
      .map(
        (value, index) =>
          `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`,
      )
      .join(" ");

  const area = (lower: number[], upper: number[]) => {
    if (lower.length < 2 || upper.length < 2) return "";
    const top = upper
      .map((value, index) => `L${x(index).toFixed(1)},${y(value).toFixed(1)}`)
      .join(" ");
    const bottom = [...lower]
      .reverse()
      .map(
        (value, index) =>
          `L${x(lower.length - 1 - index).toFixed(1)},${y(value).toFixed(1)}`,
      )
      .join(" ");
    return `M${x(0).toFixed(1)},${y(upper[0] ?? 0).toFixed(1)} ${top} ${bottom} Z`;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-[92px] w-full"
      role="img"
      aria-label="Forecast quantile fan"
    >
      <path d={area(low, high)} fill="rgba(164,196,217,0.18)" />
      <path d={area(innerLow, innerHigh)} fill="rgba(209,122,56,0.22)" />
      <path
        d={line(median)}
        fill="none"
        stroke="var(--color-accent-orange)"
        strokeWidth={1.6}
      />
    </svg>
  );
}

function Section({
  title,
  meta,
  open,
  onToggle,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.03]"
      >
        <span className="font-mono text-[11px] font-black tracking-[0.22em] text-white/50 uppercase">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {meta}
          <ChevronDown
            className={`h-3.5 w-3.5 text-white/40 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

export default function ControlPanel({
  open,
  onClose,
  symbol,
  price,
  status,
  brokerTime,
  drawingsCount,
  assets,
  onSymbolChange,
  timeframes,
  timeframe,
  onTimeframeChange,
  layers,
  onToggleLayer,
  activeTool,
  onToolSelect,
  hasTimeRangeSelection,
  onProcessRange,
  isProcessing,
  analysis,
  onForecast,
}: {
  open: boolean;
  onClose: () => void;
  symbol: string;
  price?: number;
  status: string;
  brokerTime?: string;
  drawingsCount: number;
  assets: ReadonlyArray<{ symbol: string; label: string }>;
  onSymbolChange: (symbol: string) => void;
  timeframes: ReadonlyArray<{ label: string; tfParam: string }>;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  layers: Record<string, boolean>;
  onToggleLayer: (key: string) => void;
  activeTool: string | null;
  onToolSelect: (tool: string | null) => void;
  hasTimeRangeSelection: boolean;
  onProcessRange: () => void;
  isProcessing: boolean;
  analysis?: PanelAnalysis | null;
  onForecast?: (result: ForecastView | null) => void;
}) {
  const [sections, setSections] = useState<Record<SectionId, boolean>>({
    market: true,
    layers: true,
    draw: false,
    analysis: true,
    forecast: true,
  });

  const [horizon, setHorizon] = useState(96);
  const health = api.trading.forecastHealth.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const runForecast = api.trading.forecast.useMutation({
    onSuccess: (data) =>
      onForecast?.({
        horizon: data.horizon,
        median: data.median,
        bands: data.bands,
      }),
    onError: () => onForecast?.(null),
  });

  const toggle = (id: SectionId) =>
    setSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const statusTone =
    status === "LIVE"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
      : status === "SYNC"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
        : "border-red-400/40 bg-red-400/10 text-red-300";

  const activeLayers = Object.values(layers).filter(Boolean).length;
  const eventCount = analysis?.events?.length ?? 0;

  // Flatten `summary.byType` into compact chips; skip the redundant total.
  const summaryRows = analysis
    ? Object.entries(analysis.summary ?? {})
        .flatMap(([key, value]) =>
          value && typeof value === "object"
            ? Object.entries(value as Record<string, number>).map(
                ([innerKey, innerValue]) =>
                  [innerKey, innerValue] as [string, unknown],
              )
            : [[key, value] as [string, unknown]],
        )
        .slice(0, 6)
    : [];

  return (
    <aside
      className={`${
        open ? "flex" : "hidden"
      } fixed inset-y-0 right-0 z-[120] h-full w-[88%] max-w-[350px] flex-col border-l border-white/10 bg-[var(--color-primary-dark)] text-white shadow-2xl lg:static lg:z-auto lg:h-full lg:w-[350px] lg:max-w-none lg:shrink-0 lg:shadow-none`}
      aria-label="Trading control panel"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase">
            Control panel
          </p>
          <p className="mt-1 truncate text-lg font-black tracking-tight">
            {symbol}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close control panel"
          className="rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:border-white/25 hover:text-white"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* price + status */}
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-end justify-between gap-2">
          <p className="font-mono text-2xl leading-none font-black tracking-tight">
            {formatPrice(price)}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-black tracking-[0.14em] uppercase ${statusTone}`}
          >
            {status}
          </span>
        </div>
        <p className="mt-1.5 flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-white/30 uppercase">
          <span>{brokerTime?.length ? brokerTime : "—"}</span>
          <span>{drawingsCount} drawings</span>
        </p>
      </div>

      {/* sections */}
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        <Section
          title="Analysis"
          meta={
            eventCount > 0 ? (
              <span className="font-mono text-[11px] text-white/30">
                {eventCount}
              </span>
            ) : undefined
          }
          open={sections.analysis}
          onToggle={() => toggle("analysis")}
        >
          {analysis ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {summaryRows.map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] tracking-[0.05em] text-white/50 uppercase"
                  >
                    <span className="max-w-[120px] truncate">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <b className="rounded bg-white/10 px-1 text-[9px] font-black text-white/85">
                      {String(value)}
                    </b>
                  </span>
                ))}
              </div>
              <p className="font-mono text-[9px] tracking-[0.1em] text-white/25 uppercase">
                {eventCount} events · drag a new range to refresh
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-white/40">
                Pick <b className="text-white/70">Range</b> in Draw, drag across
                the chart, then hit{" "}
                <b className="text-white/70">Analyse range</b>.
              </p>
            </div>
          )}
        </Section>

        <Section
          title="Forecast"
          meta={
            <span
              className={`font-mono text-[10px] font-black tracking-[0.12em] uppercase ${
                health.data?.available ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {health.data?.available
                ? "ready"
                : health.data?.reachable
                  ? "no model"
                  : "offline"}
            </span>
          }
          open={sections.forecast}
          onToggle={() => toggle("forecast")}
        >
          <div className="space-y-2.5">
            <div
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                health.data?.available
                  ? "border-emerald-400/25 bg-emerald-400/5"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  health.data?.available ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              <span className="font-mono text-[10px] font-black tracking-[0.1em] text-white/70 uppercase">
                {health.data?.model ?? "Timestral"}
              </span>
              <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-white/30 uppercase">
                {health.data?.device ?? "cpu"}
              </span>
            </div>

            {!health.data?.available && (
              <p className="font-mono text-[9px] leading-relaxed tracking-[0.05em] text-white/30 uppercase">
                {health.data?.reachable
                  ? "Service up · model not loaded"
                  : "Service offline · npm run forecast in trading/"}
              </p>
            )}

            <div className="grid grid-cols-4 gap-1">
              {[24, 48, 96, 168].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHorizon(value)}
                  aria-pressed={horizon === value}
                  className={`rounded border py-1 font-mono text-[10px] font-black uppercase transition-colors ${
                    horizon === value
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                runForecast.mutate({
                  symbol,
                  timeframe,
                  predictionLength: horizon,
                })
              }
              disabled={runForecast.isPending || !health.data?.available}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-accent-orange)]/40 bg-[var(--color-accent-orange)]/15 px-2.5 py-2 font-mono text-[10px] font-black tracking-[0.14em] text-[var(--color-accent-orange)] uppercase transition-colors hover:bg-[var(--color-accent-orange)]/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {runForecast.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Run forecast
            </button>

            {runForecast.error && (
              <p className="rounded bg-red-500/10 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-red-200">
                {runForecast.error.message}
              </p>
            )}

            {runForecast.data && (
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
                <FanChart
                  median={runForecast.data.median[0] ?? []}
                  bands={runForecast.data.bands}
                />

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.06em] uppercase">
                  <Stat
                    label="Horizon"
                    value={`${runForecast.data.horizon} bars`}
                  />
                  <Stat
                    label="Infer"
                    value={`${Math.round(runForecast.data.elapsed_ms)} ms`}
                  />
                  <Stat
                    label="Round trip"
                    value={`${runForecast.data.roundTripMs} ms`}
                  />
                  <Stat
                    label="Levels"
                    value={String(runForecast.data.quantile_levels.length)}
                  />
                </div>

                <p className="font-mono text-[9px] tracking-[0.08em] text-white/25 uppercase">
                  Bands 5–95 / 25–75 · risk, not an order
                </p>
              </div>
            )}
          </div>
        </Section>
      </div>

      <div className="border-t border-white/10 px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-white/25 uppercase">
        Esc deselect · Enter analyse
      </div>
    </aside>
  );
}
