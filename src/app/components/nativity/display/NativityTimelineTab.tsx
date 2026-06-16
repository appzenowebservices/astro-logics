"use client";

import React, { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { RefreshCcw, Zap } from "lucide-react";
import SarvatobhadraChakra from "./SarvatobhadraChakra";
import SarvatobhadraTimeSeries from "./SarvatobhadraTimeSeries";

export default function NativityTimelineTab({
  nativityChartId,
}: {
  nativityChartId: string;
}) {
  const [viewMode, setViewMode] = useState<"vedha" | "sarvatobhadra">(
    "sarvatobhadra",
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const [range, setRange] = useState(() => {
    const start = new Date();
    const end = new Date();
    start.setMonth(end.getMonth() - 1);
    end.setMonth(end.getMonth() + 1);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  });

  const { data, isLoading, error } = api.nativity.getTimeline.useQuery(
    { nativityChartId, startDate: range.start, endDate: range.end },
    { staleTime: 60_000, enabled: !!nativityChartId && viewMode === "vedha" },
  );

  const { data: sarvatobhadraData, isLoading: sarvatobhadraLoading } =
    api.nativity.getSarvatobhadraTimeline.useQuery(
      { nativityChartId, startDate: range.start, endDate: range.end },
      {
        staleTime: 60_000,
        enabled: !!nativityChartId && viewMode === "sarvatobhadra",
      },
    );

  const utils = api.useUtils();

  const chart = useMemo(() => {
    if (!data) return null;
    return {
      timeline: data.timeline.map((d: string) => new Date(d)),
      vedha: data.vedhaScores,
      retro: data.retroVolatility,
      triggers: data.aspectTriggers,
      yMax: Math.max(...data.vedhaScores, 1),
    };
  }, [data]);

  if (isLoading && viewMode === "vedha") {
    return (
      <div className="animate-pulse p-12 font-mono tracking-tighter text-[#E29626] uppercase">
        Booting Partner OS...
      </div>
    );
  }
  if (sarvatobhadraLoading && viewMode === "sarvatobhadra") {
    return (
      <div className="animate-pulse p-12 font-mono tracking-tighter text-[#E29626] uppercase">
        Calculating Sarvatobhadra...
      </div>
    );
  }
  if (error && viewMode === "vedha") {
    return (
      <div className="p-12 font-mono text-xs text-red-500">
        SIGNAL LOST: {error.message}
      </div>
    );
  }
  if (!chart && viewMode === "vedha") {
    return null;
  }
  if (!sarvatobhadraData && viewMode === "sarvatobhadra") {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-4 bg-[#080707] p-6 font-sans text-stone-300">
      {/* HEADER */}
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.3em] text-stone-600 uppercase">
            Timeline Analysis
          </span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="date"
              value={range.start}
              onChange={(e) =>
                setRange((r) => ({ ...r, start: e.target.value }))
              }
              className="bg-transparent text-[11px] font-bold text-stone-400 focus:text-[#E29626] focus:outline-none"
            />
            <span className="text-stone-800">/</span>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className="bg-transparent text-[11px] font-bold text-stone-400 focus:text-[#E29626] focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => {
            utils.nativity.getTimeline.invalidate();
            utils.nativity.getSarvatobhadraTimeline.invalidate();
          }}
          className="group rounded-2xl border border-white/5 p-3 hover:bg-white/5"
        >
          <RefreshCcw
            size={16}
            className="text-stone-600 transition-colors group-hover:text-[#E29626]"
          />
        </button>
      </div>

      {/* VIEW TABS */}
      <div className="flex gap-2 px-2">
        <button
          onClick={() => setViewMode("vedha")}
          className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase transition-colors ${
            viewMode === "vedha"
              ? "border-[#E29626] bg-[#E29626] text-white"
              : "border-white/10 bg-white/5 text-stone-400 hover:border-white/20"
          }`}
        >
          Vedha Timeline
        </button>
        <button
          onClick={() => setViewMode("sarvatobhadra")}
          className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase transition-colors ${
            viewMode === "sarvatobhadra"
              ? "border-[#E29626] bg-[#E29626] text-white"
              : "border-white/10 bg-white/5 text-stone-400 hover:border-white/20"
          }`}
        >
          Sarvatobhadra Chakra
        </button>
      </div>

      {/* VEDHA VIEW */}
      {viewMode === "vedha" && chart && (
        <div className="rounded-[2.5rem] border border-white/5 bg-[#100F0E] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Zap size={14} className="text-[#E29626]" />
            <h4 className="text-[10px] font-black tracking-[0.2em] text-stone-500 uppercase">
              Vedha Intensity Projection
            </h4>
          </div>
          <div className="relative h-20">
            <svg
              viewBox="0 0 800 120"
              className="h-full w-full overflow-visible"
            >
              <path
                d={chart.vedha
                  .map(
                    (v, i) =>
                      `${i === 0 ? "M" : "L"} ${10 + (i / Math.max(1, chart.timeline.length - 1)) * 780} ${
                        100 - (v / chart.yMax) * 80
                      }`,
                  )
                  .join(" ")}
                fill="none"
                stroke="#E29626"
                strokeWidth={2}
              />
              {chart.timeline.map((_, i) => (
                <rect
                  key={i}
                  x={
                    10 + (i / Math.max(1, chart.timeline.length - 1)) * 780 - 5
                  }
                  y={0}
                  width={10}
                  height={120}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className="cursor-crosshair"
                />
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* SARVATOBHADRA VIEW */}
      {viewMode === "sarvatobhadra" && sarvatobhadraData && (
        <div className="flex flex-col gap-4 overflow-y-auto">
          <SarvatobhadraChakra
            data={sarvatobhadraData[0]}
            selectedDate={
              sarvatobhadraData[0]
                ? new Date(sarvatobhadraData[0].date)
                : undefined
            }
          />
          <SarvatobhadraTimeSeries
            data={sarvatobhadraData.map((d: any) => ({
              date: d.date,
              auspiciousness: d.overallAuspiciousness,
              vara: d.dominantVara,
              nakshatra: d.dominantNakshatra,
              avgCellScore: d.cellsSummary.avgScore,
            }))}
          />
        </div>
      )}
    </div>
  );
}

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-[11px] font-bold text-stone-400 focus:text-[#E29626] focus:outline-none"
    />
  );
}
