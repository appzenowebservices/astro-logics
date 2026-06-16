"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import Layout from "../components/Layout";
import NativityChartForm from "../components/nativity/NativityChartForm";
import NativityCurrentStoryTab from "../components/nativity/currentStory/NativityCurrentStoryTab";
import { Sparkles, ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

const VITALS_DATA = [
  {
    id: "coherence",
    label: "Coherence",
    value: 78,
    change: "+6",
    trend: "up",
    points: [70, 72, 71, 75, 74, 76, 78],
  },
  {
    id: "agency",
    label: "Agency",
    value: 64,
    change: "+4",
    trend: "up",
    points: [60, 61, 59, 62, 63, 62, 64],
  },
  {
    id: "volatility",
    label: "Volatility",
    value: 31,
    change: "-8",
    trend: "down",
    points: [45, 42, 39, 38, 35, 33, 31],
  },
  {
    id: "adaptability",
    label: "Adaptability",
    value: 42,
    change: "-3",
    trend: "down",
    points: [48, 46, 47, 44, 45, 43, 42],
  },
];

const WEATHER_DRIVERS = [
  {
    name: "Saturn",
    status: "Rising",
    value: "+0.72",
    isPositive: true,
    symbol: "♄",
  },
  {
    name: "Mars",
    status: "Rising",
    value: "+0.51",
    isPositive: true,
    symbol: "♂",
  },
  {
    name: "Moon",
    status: "Falling",
    value: "-0.44",
    isPositive: false,
    symbol: "☽",
  },
  {
    name: "Neptune",
    status: "Falling",
    value: "-0.38",
    isPositive: false,
    symbol: "♆",
  },
];

const PARLIAMENT_PREVIEW = [
  {
    name: "Saturn",
    role: "Constraint & Consolidation",
    value: "0.72",
    color: "bg-zinc-900",
    img: "🪐",
  },
  {
    name: "Mars",
    role: "Structural Execution",
    value: "0.51",
    color: "bg-amber-950",
    img: "🔴",
  },
  {
    name: "Moon",
    role: "Relational Synchronization",
    value: "-0.44",
    color: "bg-slate-900",
    img: "🌑",
  },
  {
    name: "Venus",
    role: "Value Harmonization",
    value: "0.28",
    color: "bg-orange-950",
    img: "🟡",
  },
  {
    name: "Neptune",
    role: "Vision & Transcendence",
    value: "-0.38",
    color: "bg-cyan-950",
    img: "🔵",
  },
];

export default function CosmicClimatePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedChart, setSelectedChart] = useState<SelectedChart | null>(
    null,
  );

  const chartsQuery = api.nativity.getCharts.useQuery();
  const createMutation = api.nativity.createChart.useMutation({
    onSuccess: (newChart) => {
      chartsQuery.refetch();
      setSelectedChart({ id: newChart.id, name: newChart.name });
      setViewMode("view");
    },
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateChart = async (data: any) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setIsFormOpen(false);
  };

  return (
    <Layout>
      {/* Main Dashboard Content Goes Here */}
      {/* Header Metadata Bar with Trigger */}
      <div className="flex flex-col items-start justify-between gap-2 border-b border-black/[0.05] pb-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-roboto text-2xl font-bold tracking-tight text-slate-900 uppercase">
            Cosmic Climate
          </h2>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--color-accent-orange)] hover:underline"
          >
            <Plus size={14} /> New Nativity Chart
          </button>
        </div>
      </div>

      {/* <NativityChartList
        charts={chartsQuery.data || []}
        isLoading={chartsQuery.isLoading}
        isError={chartsQuery.isError}
   
      /> */}

      <NativityCurrentStoryTab nativityChartId="6a1a8da3880574e3556fad36" />

      <div className="space-y-6 text-[var(--color-primary-dark)]">
        {/* 2. Top Engine Split: Hero Regime vs Weather Drivers */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left/Center: Huge Hero Metric Card */}
          <div className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-[#1e325c] to-[#12203f] p-6 text-[var(--color-primary-light)] shadow-xl lg:col-span-2">
            {/* Subtle cosmic vector backdrop grid */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

            <div className="relative z-10 mx-auto space-y-1 text-center">
              <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase">
                Current Regime
              </span>
              <h3 className="font-roboto-mono py-2 text-3xl font-black tracking-[0.12em] text-white uppercase drop-shadow-sm filter md:text-4xl">
                Structured Expansion
              </h3>
            </div>

            {/* Dial Graphic Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center py-2">
              <div className="absolute -bottom-1 h-22 w-44 rounded-t-full border-t-2 border-dashed border-[var(--color-ring-bronze)]/30" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Confidence
              </span>
              <span className="mt-1 text-4xl font-extrabold tracking-tight text-white">
                71%
              </span>
            </div>

            <div className="z-10 border-t border-white/[0.06] pt-3 text-center">
              <p className="font-mono text-[11px] tracking-widest text-slate-400 uppercase">
                System Mechanics Validated Matrix
              </p>
            </div>
          </div>

          {/* Right Area: Weather Drivers Attribution */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Weather Drivers
                </h3>
                <HelpCircle size={14} className="text-slate-400" />
              </div>

              <div className="space-y-2.5">
                {WEATHER_DRIVERS.map((driver) => (
                  <div
                    key={driver.name}
                    className="flex items-center justify-between rounded-xl border border-black/[0.02] bg-black/[0.02] p-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary-dark)] font-mono text-sm font-bold text-white shadow-inner">
                        {driver.symbol}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          {driver.name}
                        </h4>
                        <p
                          className={`flex items-center gap-0.5 font-mono text-[10px] font-bold ${driver.isPositive ? "text-emerald-600" : "text-[var(--color-accent-orange)]"}`}
                        >
                          {driver.isPositive ? "↑" : "↓"} {driver.status}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold ${driver.isPositive ? "text-emerald-600" : "text-[var(--color-accent-orange)]"}`}
                    >
                      {driver.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/[0.05] bg-black/[0.03] py-2 text-[11px] font-bold tracking-wider uppercase transition-all hover:bg-black/[0.05]">
              View All Forces <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* 3. Mid Grid Module: State Vitals vs Regime Narrative */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* State Vitals Group Matrix (4 Horizontal Grid Loops) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-2">
            {VITALS_DATA.map((vital) => {
              const isUp = vital.trend === "up";
              return (
                <div
                  key={vital.id}
                  className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div>
                    <span className="mb-1 block font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {vital.label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {vital.value}
                      </span>
                      <span
                        className={`flex items-center font-mono text-xs font-bold ${isUp ? "text-emerald-600" : "text-[var(--color-accent-orange)]"}`}
                      >
                        {isUp ? "↑" : "↓"} {vital.change}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400">
                      vs yesterday
                    </span>
                  </div>

                  {/* Simple Sparkline Area Mock Generator */}
                  <div className="mt-3 flex h-8 w-full items-end gap-[3px]">
                    {vital.points.map((pt, i) => {
                      const heightPercent = ((pt - 20) / 60) * 100;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-sm transition-all duration-500 ${isUp ? "bg-emerald-500/20 group-hover:bg-emerald-500/40" : "bg-[var(--color-accent-orange)]/20"}`}
                          style={{
                            height: `${Math.max(15, Math.min(100, heightPercent))}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Narrative Box Overlay */}
          <div className="relative rounded-2xl border border-white/70 bg-white/50 p-5 shadow-sm">
            <div className="absolute top-4 right-4 text-[var(--color-ring-bronze)]">
              <Sparkles size={14} className="animate-pulse" />
            </div>
            <h3 className="mb-2 font-mono text-xs font-bold tracking-wider text-slate-400 uppercase">
              Regime Narrative
            </h3>
            <p className="space-y-2 font-sans text-xs leading-relaxed font-medium text-slate-700">
              The system currently favors{" "}
              <span className="font-bold text-slate-900">
                structured growth
              </span>{" "}
              over exploration. Coordination remains high while volatility
              remains contained. Decision quality improves when operating
              through existing structures.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] pt-3 font-mono text-[9px] text-slate-400">
              <span>ENGINE: LLM PARSE VECTOR</span>
              <span>3-4 LINES MAX</span>
            </div>
          </div>
        </div>

        {/* 4. State Evolution Mini Graph Strip Container */}
        <div className="rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
              State Evolution{" "}
              <span className="ml-1 font-normal text-slate-400">
                • Last 7 Days
              </span>
            </h3>
            <span className="font-mono text-[10px] text-slate-400">
              Trajectory Timeline
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 py-2 md:grid-cols-4">
            {VITALS_DATA.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between border-r border-black/[0.04] pr-4 last:border-0"
              >
                <span className="font-mono text-xs font-medium text-slate-600">
                  {v.label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-16 items-center justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className={`w-2 rounded-full ${v.trend === "up" ? "bg-emerald-500" : "bg-[var(--color-accent-orange)]"}`}
                        style={{
                          height: `${20 + idx * 12}%`,
                          opacity: 0.3 + idx * 0.15,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-bold ${v.trend === "up" ? "text-emerald-600" : "text-[var(--color-accent-orange)]"}`}
                  >
                    {v.trend === "up" ? "↑" : "↓"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Bottom Segment: Planetary Parliament Preview Anchor Deck */}
        <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-500 uppercase">
              Planetary Parliament Preview
            </h3>
            <span className="font-mono text-[10px] text-slate-400">
              Operator Metrics Matrix
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PARLIAMENT_PREVIEW.map((p) => (
              <div
                key={p.name}
                className="group relative flex h-28 flex-col justify-between rounded-xl border border-white/[0.04] bg-[var(--color-primary-dark)] p-3 text-white shadow-md transition-all duration-300 hover:border-[var(--color-ring-bronze)]/40"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xl">{p.img}</span>
                    <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--color-ring-bronze)]">
                      {p.value}
                    </span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold tracking-wide text-[var(--color-primary-light)]">
                    {p.name}
                  </h4>
                  <p className="mt-0.5 truncate text-[9px] leading-tight font-medium text-slate-400">
                    {p.role}
                  </p>
                </div>
                <div className="mt-2 font-mono text-[8px] font-bold tracking-widest text-[var(--color-accent-glow)]/40 uppercase transition-colors group-hover:text-[var(--color-accent-orange)]">
                  INFLUENCE STATE
                </div>
              </div>
            ))}
          </div>

          {/* Link Routing out to Screen 2 Deck */}
          <div className="mt-4 border-t border-black/[0.04] pt-3 text-center">
            <Link
              href="/parliament"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-[var(--color-primary-dark)] uppercase transition-colors hover:text-[var(--color-accent-orange)]"
            >
              Go to Planetary Parliament <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-[400px] border-l border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-dark)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/20 p-6">
                <h3 className="font-bold tracking-widest text-[var(--color-primary-light)] uppercase">
                  New Chart
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-[var(--color-primary-light)]"
                >
                  <X size={20} />
                </button>
              </div>
              <NativityChartForm
                isLoading={isLoading}
                isError={false}
                error={null}
                onSubmit={handleCreateChart}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}
