"use client";

import React, { useMemo } from "react";
import { Loader2, Network, Zap } from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../components/Layout";
import ChartPicker, {
  useNativitySelection,
} from "../components/nativity/ChartPicker";
import NativityAspectsTable from "../components/nativity/display/NativityAspectsTable";

const TENSE = new Set(["square", "opposition", "quincunx"]);

export default function TensionNetworkPage() {
  const { chartId, setChartId, charts } = useNativitySelection();
  const chartQuery = api.nativity.getChartById.useQuery(
    { id: chartId },
    { enabled: Boolean(chartId) },
  );

  const aspects = chartQuery.data?.aspects ?? [];

  const stats = useMemo(() => {
    const byType = aspects.reduce<Record<string, number>>((acc, aspect) => {
      const key = aspect.aspectType.toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const tense = aspects.filter((aspect) =>
      TENSE.has(aspect.aspectType.toLowerCase()),
    );
    const pressure =
      tense.length > 0
        ? tense.reduce((sum, aspect) => sum + aspect.exactnessScore, 0) /
          tense.length
        : 0;

    return {
      byType,
      tense: tense.length,
      pressure: Math.round(pressure * 100),
    };
  }, [aspects]);

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Natal engine // aspect field
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              Tension network
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Every active aspect in the chart, ranked by exactness, with the
              aggregate pressure that feeds the latent-state distortion field.
            </p>
          </div>
          <ChartPicker chartId={chartId} onChange={setChartId} />
        </header>

        {charts.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
            <Network className="h-9 w-9 text-[var(--color-accent-orange)]" />
            <h2 className="font-poster mt-3 text-2xl uppercase">
              No aspect network
            </h2>
            <p className="mt-1 max-w-sm text-sm opacity-55">
              Create a nativity chart to compute aspects and their tension
              field.
            </p>
          </div>
        ) : chartQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
            <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-50">
              Compiling aspect field…
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label="Aspects" value={aspects.length} />
              <Metric label="Tense aspects" value={stats.tense} />
              <Metric label="Tension index" value={`${stats.pressure}%`} />
              <Metric label="Exact squares" value={stats.byType.square ?? 0} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="min-h-[520px] overflow-hidden rounded-2xl border border-black/10 bg-white/70">
                <NativityAspectsTable aspects={aspects} />
              </div>

              <aside className="space-y-3 rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="font-mono text-[10px] font-black tracking-[0.2em] uppercase opacity-45">
                  Aspect distribution
                </p>
                {Object.entries(stats.byType).length === 0 && (
                  <p className="text-xs opacity-45">No active aspects.</p>
                )}
                {Object.entries(stats.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10px] font-black tracking-[0.1em] uppercase">
                        <span>{type}</span>
                        <span className="opacity-45">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent-orange)]"
                          style={{
                            width: `${aspects.length ? (count / aspects.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                <div className="!mt-6 rounded-xl border border-[var(--color-accent-orange)]/25 bg-[var(--color-accent-orange)]/5 p-3">
                  <p className="flex items-center gap-2 font-mono text-[10px] font-black tracking-[0.14em] text-[var(--color-accent-orange)] uppercase">
                    <Zap size={12} /> Distortion rule
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed opacity-60">
                    Squares cut coherence and raise reactivity; oppositions
                    deepen relational pressure; trines reinforce integration.
                  </p>
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
