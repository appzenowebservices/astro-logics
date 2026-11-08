"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  CalendarRange,
  ChevronRight,
  RefreshCcw,
  Zap,
} from "lucide-react";
import {
  Area,
  Bar,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "~/trpc/react";
import SarvatobhadraChakra from "./SarvatobhadraChakra";
import SarvatobhadraTimeSeries from "./SarvatobhadraTimeSeries";

const DAY = 86_400_000;
const MAX_DAYS = 366;

type TimelineRow = {
  ts: number;
  date: string;
  vedha: number | null;
  retro: number | null;
  projection: number | null;
  bandLow: number | null;
  bandHigh: number | null;
  triggers: string[];
};

type ProjectionResult = {
  points: TimelineRow[];
  slope: number;
  standardError: number;
  projected: number | null;
};

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const parseDay = (value: string) => new Date(`${value}T00:00:00.000Z`);
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY);

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function buildProjection(
  actual: Array<{ ts: number; vedha: number }>,
  horizon: number,
): ProjectionResult {
  if (horizon <= 0 || actual.length < 4) {
    return { points: [], slope: 0, standardError: 0, projected: null };
  }

  const origin = actual[0]!.ts;
  const xs = actual.map((point) => (point.ts - origin) / DAY);
  const ys = actual.map((point) => point.vedha);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const sxx = xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  const sxy = xs.reduce(
    (sum, value, index) => sum + (value - meanX) * (ys[index]! - meanY),
    0,
  );

  if (sxx === 0) {
    return { points: [], slope: 0, standardError: 0, projected: null };
  }

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const residuals = ys.map(
    (value, index) => value - (intercept + slope * xs[index]!),
  );
  const sse = residuals.reduce((sum, value) => sum + value ** 2, 0);
  const standardError = Math.sqrt(sse / Math.max(1, actual.length - 2));

  const last = actual[actual.length - 1]!;
  const lastX = xs[xs.length - 1]!;

  const points: TimelineRow[] = Array.from({ length: horizon }, (_, index) => {
    const x = lastX + index + 1;
    const projected = intercept + slope * x;
    const margin =
      1.96 *
      standardError *
      Math.sqrt(1 + 1 / actual.length + (x - meanX) ** 2 / sxx);
    const ts = last.ts + (index + 1) * DAY;

    return {
      ts,
      date: new Date(ts).toISOString(),
      vedha: null,
      retro: null,
      projection: Number(clampScore(projected).toFixed(2)),
      bandLow: Number(clampScore(projected - margin).toFixed(2)),
      bandHigh: Number(clampScore(projected + margin).toFixed(2)),
      triggers: [],
    };
  });

  return {
    points,
    slope,
    standardError,
    projected: points[0]?.projection ?? null,
  };
}

function trendLabel(slope: number) {
  if (slope > 0.05) return "Expanding";
  if (slope < -0.05) return "Contracting";
  return "Flat";
}

export default function NativityTimelineTab({
  nativityChartId,
}: {
  nativityChartId: string;
}) {
  const utils = api.useUtils();
  const [viewMode, setViewMode] = useState<"vedha" | "sarvatobhadra">("vedha");
  const [horizon, setHorizon] = useState(14);
  const [visible, setVisible] = useState({
    vedha: true,
    retro: true,
    projection: true,
    band: true,
    triggers: true,
  });

  const defaultRange = useMemo(() => {
    const now = new Date();
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    return {
      start: isoDay(addDays(end, -89)),
      end: isoDay(end),
    };
  }, []);

  const [draftRange, setDraftRange] = useState(defaultRange);
  const [range, setRange] = useState(defaultRange);

  const rangeDays =
    Math.round(
      (parseDay(range.end).getTime() - parseDay(range.start).getTime()) / DAY,
    ) + 1;
  const rangeValid = rangeDays > 0 && rangeDays <= MAX_DAYS;

  const { data, isLoading, isFetching, error } =
    api.nativity.getTimeline.useQuery(
      {
        nativityChartId,
        startDate: range.start,
        endDate: range.end,
      },
      {
        staleTime: 60_000,
        enabled: Boolean(nativityChartId) && rangeValid,
      },
    );

  const { data: sarvatobhadraData, isLoading: sarvatobhadraLoading } =
    api.nativity.getSarvatobhadraTimeline.useQuery(
      {
        nativityChartId,
        startDate: range.start,
        endDate: range.end,
      },
      {
        staleTime: 60_000,
        enabled:
          Boolean(nativityChartId) &&
          rangeValid &&
          viewMode === "sarvatobhadra",
      },
    );

  const actual = useMemo(() => {
    if (!data)
      return [] as Array<{
        ts: number;
        date: string;
        vedha: number;
        retro: number;
        triggers: string[];
      }>;

    return data.timeline.map((value, index) => ({
      ts: new Date(value).getTime(),
      date: value,
      vedha: clampScore(data.vedhaScores[index] ?? 0),
      retro: data.retroVolatility[index] ?? 0,
      triggers: data.aspectTriggers[index] ?? [],
    }));
  }, [data]);

  const projection = useMemo(
    () => buildProjection(actual, visible.projection ? horizon : 0),
    [actual, horizon, visible.projection],
  );

  const rows = useMemo<TimelineRow[]>(() => {
    const base: TimelineRow[] = actual.map((point) => ({
      ...point,
      projection: null,
      bandLow: null,
      bandHigh: null,
    }));

    if (!visible.projection || projection.points.length === 0) return base;

    const last = base[base.length - 1];
    if (!last) return base;

    const bridge: TimelineRow = {
      ...last,
      projection: last.vedha,
      bandLow: last.vedha,
      bandHigh: last.vedha,
    };

    return [...base.slice(0, -1), bridge, ...projection.points];
  }, [actual, projection.points, visible.projection]);

  const triggerRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.triggers.length > 0 && row.vedha !== null && row.ts <= Date.now(),
      ),
    [rows],
  );

  const stats = useMemo(() => {
    const scores = actual.map((point) => point.vedha);
    if (scores.length === 0) {
      return {
        peak: 0,
        average: 0,
        latest: 0,
        triggerCount: 0,
        maxRetro: 4,
      };
    }

    return {
      peak: Math.max(...scores),
      average: Math.round(
        scores.reduce((sum, value) => sum + value, 0) / scores.length,
      ),
      latest: scores[scores.length - 1] ?? 0,
      triggerCount: actual.reduce(
        (sum, point) => sum + point.triggers.length,
        0,
      ),
      maxRetro: Math.max(4, ...actual.map((point) => point.retro)),
    };
  }, [actual]);

  const todayTs = Date.now();
  const showToday =
    rows.length > 0 &&
    todayTs >= rows[0]!.ts &&
    todayTs <= rows[rows.length - 1]!.ts;

  const applyPreset = (days: number) => {
    const now = new Date();
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const next = {
      start: isoDay(addDays(end, -(days - 1))),
      end: isoDay(end),
    };
    setDraftRange(next);
    setRange(next);
  };

  const applyRange = () => {
    if (
      parseDay(draftRange.end).getTime() < parseDay(draftRange.start).getTime()
    ) {
      return;
    }
    setRange(draftRange);
  };

  const toggle = (key: keyof typeof visible) =>
    setVisible((current) => ({ ...current, [key]: !current[key] }));

  const projectedEnd =
    projection.points[projection.points.length - 1]?.projection ?? null;

  return (
    <div className="flex h-full min-h-[680px] flex-col gap-4 bg-[#080707] p-4 font-sans text-stone-300 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.28em] text-stone-600 uppercase">
            <Activity size={12} className="text-[#E29626]" />
            Timeline analysis
          </div>
          <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white uppercase">
            {viewMode === "vedha" ? "Vedha intensity" : "Sarvatobhadra chakra"}
          </h3>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-stone-500">
            {viewMode === "vedha"
              ? "Transit intensity against retrograde volatility, aspect triggers, and a statistical projection over the selected window."
              : "Daily chakra scoring, dominant vara and nakshatra, and auspiciousness across the selected window."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {[7, 30, 90, 180, 365].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => applyPreset(days)}
                className={`rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-black tracking-[0.12em] uppercase transition ${
                  rangeDays === days
                    ? "bg-[#E29626] text-white"
                    : "text-stone-500 hover:bg-white/5 hover:text-stone-200"
                }`}
              >
                {days === 365 ? "1Y" : `${days}D`}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              void utils.nativity.getTimeline.invalidate();
              void utils.nativity.getSarvatobhadraTimeline.invalidate();
            }}
            className="rounded-xl border border-white/10 p-2.5 text-stone-500 transition hover:bg-white/5 hover:text-[#E29626]"
            aria-label="Refresh timeline"
          >
            <RefreshCcw
              size={14}
              className={isFetching ? "animate-spin text-[#E29626]" : ""}
            />
          </button>
        </div>
      </div>

      {/* Range controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2">
        <CalendarRange size={14} className="text-[#E29626]" />
        <input
          type="date"
          value={draftRange.start}
          onChange={(event) =>
            setDraftRange((current) => ({
              ...current,
              start: event.target.value,
            }))
          }
          className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] font-bold text-stone-300 transition outline-none focus:border-[#E29626]/60"
        />
        <ChevronRight size={12} className="text-stone-700" />
        <input
          type="date"
          value={draftRange.end}
          onChange={(event) =>
            setDraftRange((current) => ({
              ...current,
              end: event.target.value,
            }))
          }
          className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 font-mono text-[11px] font-bold text-stone-300 transition outline-none focus:border-[#E29626]/60"
        />
        <button
          type="button"
          onClick={applyRange}
          className="rounded-lg bg-[#E29626] px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.12em] text-white uppercase transition hover:bg-[#f0a83a]"
        >
          Apply
        </button>
        <span
          className={`font-mono text-[10px] uppercase ${
            rangeValid ? "text-stone-600" : "text-red-400"
          }`}
        >
          {rangeValid
            ? `${rangeDays} days · max ${MAX_DAYS}`
            : `Invalid range · 1–${MAX_DAYS} days`}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {(["vedha", "sarvatobhadra"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.12em] uppercase transition ${
                viewMode === mode
                  ? "border-[#E29626] bg-[#E29626] text-white"
                  : "border-white/10 bg-white/5 text-stone-500 hover:border-white/20 hover:text-stone-200"
              }`}
            >
              {mode === "vedha" ? "Vedha" : "Sarvatobhadra"}
            </button>
          ))}
        </div>
      </div>

      {/* Vedha chart */}
      {viewMode === "vedha" && (
        <>
          {!rangeValid ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5">
              <p className="font-mono text-xs tracking-wider text-red-300 uppercase">
                Choose a valid window between 1 and {MAX_DAYS} days.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 text-center">
              <p className="font-mono text-xs tracking-wider text-red-300 uppercase">
                SIGNAL LOST: {error.message}
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/5 bg-[#100F0E]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E29626] border-t-transparent" />
                <p className="font-mono text-[10px] font-black tracking-[0.24em] text-stone-600 uppercase">
                  Compiling transit window…
                </p>
              </div>
            </div>
          ) : actual.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/5 bg-[#100F0E]">
              <p className="font-mono text-[10px] tracking-[0.24em] text-stone-600 uppercase">
                No timeline data for this window.
              </p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                <Metric label="Peak" value={stats.peak.toFixed(1)} />
                <Metric label="Average" value={stats.average} />
                <Metric label="Latest" value={stats.latest.toFixed(1)} />
                <Metric
                  label="Trend"
                  value={trendLabel(projection.slope)}
                  hint={`${projection.slope >= 0 ? "+" : ""}${projection.slope.toFixed(2)}/day`}
                />
                <Metric
                  label={`Projected +${horizon}D`}
                  value={projectedEnd !== null ? projectedEnd.toFixed(1) : "—"}
                  hint={`${stats.triggerCount} triggers`}
                />
                <Metric
                  label="Projection band"
                  value={
                    projection.standardError
                      ? `±${(projection.standardError * 1.96).toFixed(1)}`
                      : "—"
                  }
                  hint="95% confidence"
                />
              </div>

              {/* Chart panel */}
              <div className="flex min-h-[420px] flex-1 flex-col rounded-3xl border border-white/5 bg-[#100F0E] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#E29626]" />
                    <h4 className="font-mono text-[10px] font-black tracking-[0.2em] text-stone-500 uppercase">
                      Vedha intensity projection
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <LegendChip
                      label="Vedha"
                      color="#E29626"
                      active={visible.vedha}
                      onClick={() => toggle("vedha")}
                    />
                    <LegendChip
                      label="Retro volatility"
                      color="#64748b"
                      active={visible.retro}
                      onClick={() => toggle("retro")}
                    />
                    <LegendChip
                      label="Projection"
                      color="#8ab4f8"
                      dashed
                      active={visible.projection}
                      onClick={() => toggle("projection")}
                    />
                    <LegendChip
                      label="95% band"
                      color="#8ab4f8"
                      dashed
                      active={visible.band}
                      onClick={() => toggle("band")}
                    />
                    <LegendChip
                      label="Aspect triggers"
                      color="#f4c15d"
                      dot
                      active={visible.triggers}
                      onClick={() => toggle("triggers")}
                    />
                  </div>
                </div>

                <div className="h-[360px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={rows}
                      margin={{ top: 8, right: 10, bottom: 0, left: -8 }}
                    >
                      <defs>
                        <linearGradient
                          id="vedhaFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#E29626"
                            stopOpacity={0.34}
                          />
                          <stop
                            offset="100%"
                            stopColor="#E29626"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#ffffff0d"
                        vertical={false}
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="ts"
                        type="number"
                        scale="time"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value: number) =>
                          new Date(value).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        tick={{
                          fill: "#78716c",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={28}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[0, 100]}
                        tick={{
                          fill: "#78716c",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      {visible.retro && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, stats.maxRetro]}
                          tick={{
                            fill: "#57534e",
                            fontSize: 9,
                            fontFamily: "monospace",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={26}
                        />
                      )}
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{
                          stroke: "#ffffff22",
                          strokeDasharray: "4 4",
                        }}
                      />
                      <ReferenceLine
                        y={50}
                        yAxisId="left"
                        stroke="#ffffff0d"
                        strokeDasharray="3 3"
                      />
                      {showToday && (
                        <ReferenceLine
                          x={todayTs}
                          yAxisId="left"
                          stroke="#f4c15d66"
                          strokeDasharray="4 4"
                          label={{
                            value: "today",
                            position: "insideTopRight",
                            fill: "#f4c15d99",
                            fontSize: 9,
                            fontFamily: "monospace",
                          }}
                        />
                      )}

                      {visible.retro && (
                        <Bar
                          yAxisId="right"
                          dataKey="retro"
                          fill="#64748b"
                          opacity={0.22}
                          barSize={6}
                          radius={[2, 2, 0, 0]}
                          isAnimationActive={false}
                        />
                      )}

                      {visible.vedha && (
                        <>
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="vedha"
                            stroke="none"
                            fill="url(#vedhaFill)"
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="vedha"
                            stroke="#E29626"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                              r: 4,
                              fill: "#E29626",
                              stroke: "#080707",
                              strokeWidth: 2,
                            }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        </>
                      )}

                      {visible.projection && (
                        <>
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="projection"
                            stroke="#8ab4f8"
                            strokeWidth={1.6}
                            strokeDasharray="6 4"
                            dot={false}
                            connectNulls
                            isAnimationActive={false}
                          />
                          {visible.band && (
                            <>
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="bandHigh"
                                stroke="#8ab4f8"
                                strokeOpacity={0.32}
                                strokeWidth={1}
                                strokeDasharray="2 4"
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                              />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="bandLow"
                                stroke="#8ab4f8"
                                strokeOpacity={0.32}
                                strokeWidth={1}
                                strokeDasharray="2 4"
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                              />
                            </>
                          )}
                        </>
                      )}

                      {visible.triggers && triggerRows.length > 0 && (
                        <Scatter
                          yAxisId="left"
                          data={triggerRows}
                          dataKey="vedha"
                          fill="#f4c15d"
                          shape="circle"
                          isAnimationActive={false}
                        />
                      )}

                      {rows.length > 20 && (
                        <Brush
                          dataKey="ts"
                          height={22}
                          travellerWidth={6}
                          stroke="#E29626"
                          fill="#0b0a09"
                          tickFormatter={(value: number) =>
                            new Date(value).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                  <p className="max-w-xl font-mono text-[9px] leading-relaxed tracking-[0.04em] text-stone-600 uppercase">
                    Projection is a linear fit over the visible window; the
                    shaded bounds are a 95% statistical band, not astrological
                    certainty.
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="mr-1 font-mono text-[9px] tracking-[0.16em] text-stone-600 uppercase">
                      Horizon
                    </span>
                    {[7, 14, 30, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setHorizon(days)}
                        className={`rounded-md px-2 py-1 font-mono text-[9px] font-black tracking-[0.1em] uppercase transition ${
                          horizon === days
                            ? "bg-[#8ab4f8]/20 text-[#8ab4f8]"
                            : "text-stone-600 hover:bg-white/5 hover:text-stone-300"
                        }`}
                      >
                        {days}D
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Sarvatobhadra view */}
      {viewMode === "sarvatobhadra" && (
        <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto">
          {!rangeValid ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5">
              <p className="font-mono text-xs tracking-wider text-red-300 uppercase">
                Choose a valid window between 1 and {MAX_DAYS} days.
              </p>
            </div>
          ) : sarvatobhadraLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/5 bg-[#100F0E]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E29626] border-t-transparent" />
                <p className="font-mono text-[10px] font-black tracking-[0.24em] text-stone-600 uppercase">
                  Calculating Sarvatobhadra…
                </p>
              </div>
            </div>
          ) : sarvatobhadraData && sarvatobhadraData.length > 0 ? (
            <>
              <SarvatobhadraChakra
                data={sarvatobhadraData[0]}
                selectedDate={new Date(sarvatobhadraData[0]!.date)}
              />
              <SarvatobhadraTimeSeries
                data={sarvatobhadraData.map((entry) => ({
                  date: entry.date,
                  auspiciousness: entry.overallAuspiciousness,
                  vara: entry.dominantVara,
                  nakshatra: entry.dominantNakshatra,
                  avgCellScore: entry.cellsSummary.avgScore,
                }))}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/5 bg-[#100F0E]">
              <p className="font-mono text-[10px] tracking-[0.24em] text-stone-600 uppercase">
                No chakra data for this window.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.025] px-3 py-2.5">
      <p className="font-mono text-[9px] font-black tracking-[0.16em] text-stone-600 uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-black tracking-tight text-stone-100">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 font-mono text-[9px] tracking-[0.06em] text-stone-600 uppercase">
          {hint}
        </p>
      )}
    </div>
  );
}

function LegendChip({
  label,
  color,
  active,
  dashed,
  dot,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  dashed?: boolean;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border border-white/5 px-2 py-1 font-mono text-[9px] font-bold tracking-[0.08em] uppercase transition ${
        active
          ? "text-stone-300 opacity-100"
          : "text-stone-600 line-through opacity-40"
      }`}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : (
        <span
          className={`w-4 ${dashed ? "border-t border-dashed" : "h-0.5 rounded"}`}
          style={dashed ? { borderColor: color } : { backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TimelineRow | undefined;
  if (!row) return null;

  return (
    <div className="min-w-[220px] rounded-xl border border-white/10 bg-[#0b0a09]/95 p-3 shadow-2xl backdrop-blur">
      <p className="font-mono text-[9px] font-black tracking-[0.18em] text-stone-500 uppercase">
        {new Date(row.ts).toLocaleDateString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
      <div className="mt-2 space-y-1.5">
        <TooltipRow
          label="Vedha"
          color="#E29626"
          value={row.vedha !== null ? row.vedha.toFixed(1) : "—"}
        />
        <TooltipRow
          label="Retro volatility"
          color="#64748b"
          value={row.retro !== null ? String(row.retro) : "—"}
        />
        {row.projection !== null && (
          <TooltipRow
            label="Projection"
            color="#8ab4f8"
            value={row.projection.toFixed(1)}
          />
        )}
        {row.bandLow !== null && row.bandHigh !== null && (
          <TooltipRow
            label="95% band"
            color="#8ab4f8"
            value={`${row.bandLow.toFixed(1)} – ${row.bandHigh.toFixed(1)}`}
          />
        )}
      </div>
      {row.triggers.length > 0 && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="font-mono text-[9px] font-black tracking-[0.16em] text-stone-500 uppercase">
            Aspect triggers
          </p>
          <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-stone-400">
            {row.triggers.join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

function TooltipRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] text-stone-500 uppercase">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-mono text-[10px] font-bold text-stone-200">
        {value}
      </span>
    </div>
  );
}
