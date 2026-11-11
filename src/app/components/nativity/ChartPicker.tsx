"use client";

import React from "react";
import { Orbit } from "lucide-react";
import { api } from "~/trpc/react";
import { useActiveProfile } from "../profile/ActiveProfileProvider";

export function useNativitySelection() {
  const { charts, activeChartId, setActiveChartId, isLoading } =
    useActiveProfile();

  return {
    chartId: activeChartId,
    setChartId: setActiveChartId,
    charts,
    isLoading,
  };
}

export default function ChartPicker({
  chartId,
  onChange,
  disabled,
}: {
  chartId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { data: charts, isLoading } = api.nativity.getCharts.useQuery();

  return (
    <label className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-45">
        <Orbit size={12} />
        Chart
      </span>
      <select
        value={chartId}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || isLoading}
        className="min-w-[220px] rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[var(--color-accent-orange)]"
      >
        <option value="">
          {isLoading ? "Loading charts…" : "Select a nativity chart"}
        </option>
        {(charts ?? []).map((chart) => (
          <option key={chart.id} value={chart.id}>
            {chart.name} · {new Date(chart.birthDateTime).toLocaleDateString()}
          </option>
        ))}
      </select>
    </label>
  );
}
