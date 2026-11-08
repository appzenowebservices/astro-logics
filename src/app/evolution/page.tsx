"use client";

import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CalendarRange, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../components/Layout";
import ChartPicker, {
  useNativitySelection,
} from "../components/nativity/ChartPicker";

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export default function StateEvolutionPage() {
  const { chartId, setChartId, charts } = useNativitySelection();
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start: isoDay(start), end: isoDay(end) };
  });

  const statesQuery = api.nativity.getDailyPlanetaryStates.useQuery(
    {
      nativityChartId: chartId,
      startDate: range.start,
      endDate: range.end,
    },
    { enabled: Boolean(chartId) },
  );

  const daily = statesQuery.data?.dailyStates ?? [];

  const series = useMemo(() => {
    const buckets = new Map<
      string,
      { total: number; count: number; tense: number }
    >();

    for (const state of daily) {
      const key = state.date.slice(0, 10);
      const bucket = buckets.get(key) ?? { total: 0, count: 0, tense: 0 };
      bucket.total += state.intensity;
      bucket.count += 1;
      bucket.tense += state.aspectCount;
      buckets.set(key, bucket);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        intensity: Number((bucket.total / bucket.count).toFixed(1)),
        aspects: Number((bucket.tense / bucket.count).toFixed(1)),
      }));
  }, [daily]);

  const latestAxes = useMemo(() => {
    if (!daily.length) return [];
    const latestDate = daily[daily.length - 1]?.date.slice(0, 10);
    const latest = daily.filter(
      (state) => state.date.slice(0, 10) === latestDate,
    );
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const state of latest) {
      for (const [axis, value] of Object.entries(state.vectorState ?? {})) {
        if (axis === "latentVector" || typeof value !== "number") continue;
        const entry = totals[axis] ?? { sum: 0, count: 0 };
        entry.sum += value;
        entry.count += 1;
        totals[axis] = entry;
      }
    }
    return Object.entries(totals)
      .map(([axis, entry]) => ({
        axis,
        value: Number((entry.sum / entry.count).toFixed(4)),
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 12);
  }, [daily]);

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Natal engine // latent trajectory
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              State evolution
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Daily transit states projected through the 54-axis ontology and
              averaged across all eleven bodies.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <ChartPicker chartId={chartId} onChange={setChartId} />
            <label className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-45">
                From
              </span>
              <input
                type="date"
                value={range.start}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
                className="rounded-xl border border-black/10 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:border-[var(--color-accent-orange)]"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-45">
                To
              </span>
              <input
                type="date"
                value={range.end}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
                className="rounded-xl border border-black/10 bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:border-[var(--color-accent-orange)]"
              />
            </label>
          </div>
        </header>

        {charts.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
            <CalendarRange className="h-9 w-9 text-[var(--color-accent-orange)]" />
            <h2 className="font-poster mt-3 text-2xl uppercase">
              No trajectory yet
            </h2>
            <p className="mt-1 max-w-sm text-sm opacity-55">
              Create a nativity chart, then the engine can evolve its transits
              day by day.
            </p>
          </div>
        ) : statesQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
            <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-50">
              Evolving state vectors…
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label="Days" value={series.length} />
              <Metric label="Planet-days" value={daily.length} />
              <Metric
                label="Peak intensity"
                value={
                  series.length
                    ? Math.max(...series.map((point) => point.intensity))
                    : "—"
                }
              />
              <Metric
                label="Avg intensity"
                value={
                  series.length
                    ? Math.round(
                        series.reduce(
                          (sum, point) => sum + point.intensity,
                          0,
                        ) / series.length,
                      )
                    : "—"
                }
              />
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Activity
                  size={14}
                  className="text-[var(--color-accent-orange)]"
                />
                <p className="font-mono text-[10px] font-black tracking-[0.18em] uppercase opacity-50">
                  Aggregate intensity
                </p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient
                        id="intensity"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#d17a38"
                          stopOpacity={0.45}
                        />
                        <stop
                          offset="100%"
                          stopColor="#d17a38"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "monospace" }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.08)",
                        fontSize: 11,
                        fontFamily: "monospace",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke="#d17a38"
                      strokeWidth={2}
                      fill="url(#intensity)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <section className="overflow-hidden rounded-2xl border border-black/10 bg-white/75">
                <div className="border-b border-black/8 px-4 py-3">
                  <h2 className="font-poster text-lg uppercase">
                    Planetary state ledger
                  </h2>
                </div>
                <div className="custom-scrollbar max-h-[360px] divide-y divide-black/5 overflow-y-auto">
                  {daily.slice(-30).map((state) => (
                    <div
                      key={state.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-2.5"
                    >
                      <span className="min-w-16 font-mono text-[11px] font-black">
                        {state.planet}
                      </span>
                      <span className="font-mono text-[10px] opacity-45">
                        {state.date.slice(0, 10)} · {state.sign} · house{" "}
                        {state.house}
                      </span>
                      <span className="ml-auto font-mono text-[10px] font-bold">
                        {Math.round(state.intensity)} intensity ·{" "}
                        {state.aspectCount} aspects
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="rounded-2xl border border-black/10 bg-white/75 p-4">
                <p className="font-mono text-[10px] font-black tracking-[0.18em] uppercase opacity-45">
                  Latest dominant axes
                </p>
                <div className="mt-3 space-y-2">
                  {latestAxes.map((axis) => (
                    <div key={axis.axis}>
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase">
                        <span className="truncate">{axis.axis}</span>
                        <span className="opacity-45">
                          {axis.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className={`h-full rounded-full ${
                            axis.value >= 0
                              ? "bg-[var(--color-accent-orange)]"
                              : "bg-slate-500"
                          }`}
                          style={{
                            width: `${Math.min(100, Math.abs(axis.value) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
      <p className="font-poster text-3xl leading-none">{value}</p>
      <p className="mt-1.5 font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-45">
        {label}
      </p>
    </div>
  );
}
