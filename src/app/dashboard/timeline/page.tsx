"use client";

import React from "react";
import { CalendarDays, LineChart } from "lucide-react";
import Layout from "../../components/Layout";
import ChartPicker, {
  useNativitySelection,
} from "../../components/nativity/ChartPicker";
import NativityTimelineTab from "../../components/nativity/display/NativityTimelineTab";

export default function TimelineMatrixPage() {
  const { chartId, setChartId, charts } = useNativitySelection();

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Natal engine // temporal filter
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              Timeline matrix
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Vedha intensity, retrograde volatility, aspect triggers, and the
              Sarvatobhadra chakra across a rolling window.
            </p>
          </div>
          <ChartPicker chartId={chartId} onChange={setChartId} />
        </header>

        {charts.length === 0 ? (
          <EmptyState />
        ) : chartId ? (
          <div className="custom-scrollbar h-[calc(100vh-11rem)] min-h-[720px] overflow-y-auto rounded-2xl border border-black/10 bg-white/70">
            <NativityTimelineTab nativityChartId={chartId} />
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
      <LineChart className="h-9 w-9 text-[var(--color-accent-orange)]" />
      <h2 className="font-poster mt-3 text-2xl uppercase">No chart to index</h2>
      <p className="mt-1 max-w-sm text-sm opacity-55">
        Create a nativity chart first, then the timeline engine can compile
        transit windows against it.
      </p>
      <a
        href="/nativity"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-5 py-2.5 font-mono text-[10px] font-black tracking-[0.16em] text-white uppercase"
      >
        <CalendarDays size={13} /> Open nativity archive
      </a>
    </div>
  );
}
