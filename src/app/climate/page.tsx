"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CloudSun,
  MapPin,
  Orbit,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import Layout from "../components/Layout";
import NativityChartForm from "../components/nativity/NativityChartForm";
import ScreenplayDocument from "../components/currentStory/ScreenplayDocument";
import { api } from "~/trpc/react";

type ClimateView = "overview" | "signals" | "script";

const CLIMATE_VIEWS: {
  id: ClimateView;
  label: string;
  icon: typeof CloudSun;
}[] = [
  { id: "overview", label: "Overview", icon: CloudSun },
  { id: "signals", label: "Planetary signals", icon: Activity },
  { id: "script", label: "Current narrative", icon: BookOpen },
];

export default function CosmicClimatePage() {
  const [selectedChartId, setSelectedChartId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeView, setActiveView] = useState<ClimateView>("overview");

  const chartsQuery = api.nativity.getCharts.useQuery();
  const createMutation = api.nativity.createChart.useMutation({
    onSuccess: async (chart) => {
      await chartsQuery.refetch();
      setSelectedChartId(chart.id);
      setActiveView("overview");
      setIsFormOpen(false);
    },
  });

  useEffect(() => {
    if (!selectedChartId && chartsQuery.data?.[0]) {
      setSelectedChartId(chartsQuery.data[0].id);
    }
  }, [chartsQuery.data, selectedChartId]);

  const selectedChart = chartsQuery.data?.find(
    (chart) => chart.id === selectedChartId,
  );
  const storiesQuery = api.nativity.getCurrentStories.useQuery(
    { nativityChartId: selectedChartId },
    { enabled: Boolean(selectedChartId) },
  );
  const currentStory = storiesQuery.data?.[0];
  const scenes = [...(currentStory?.scenes ?? [])].sort(
    (a, b) => b.intensity - a.intensity,
  );

  const handleCreateChart = async (
    data: Parameters<typeof createMutation.mutateAsync>[0],
  ) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <Layout>
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-3">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-dark)] text-white sm:flex">
              <CloudSun size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--color-accent-orange)] uppercase">
                Transit overview
              </p>
              <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                Cosmic Climate
                {selectedChart && (
                  <span className="ml-2 font-medium text-slate-400">
                    / {selectedChart.name}
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Orbit
                aria-hidden="true"
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              />
              <select
                aria-label="Select a nativity chart"
                value={selectedChartId}
                onChange={(event) => setSelectedChartId(event.target.value)}
                disabled={
                  chartsQuery.isLoading ? true : !chartsQuery.data?.length
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm font-semibold text-slate-800 shadow-sm transition outline-none focus:border-[var(--color-accent-orange)] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {chartsQuery.isLoading ? "Loading charts…" : "Select chart"}
                </option>
                {(chartsQuery.data ?? []).map((chart) => (
                  <option key={chart.id} value={chart.id}>
                    {chart.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-dark)] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-orange)] sm:px-4"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New chart</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        <nav
          aria-label="Climate views"
          role="tablist"
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-900/10"
        >
          {CLIMATE_VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeView === id}
              onClick={() => setActiveView(id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeView === id
                  ? "border-[var(--color-accent-orange)] text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={15} />
              {label}
              {id === "signals" && currentStory && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {scenes.length}
                </span>
              )}
            </button>
          ))}
          {currentStory && (
            <span className="ml-auto hidden shrink-0 items-center gap-1.5 pb-2 font-mono text-[10px] text-slate-400 sm:inline-flex">
              <CalendarDays size={12} />
              {new Date(currentStory.transitDate).toLocaleDateString()}
            </span>
          )}
        </nav>

        <main
          className="relative min-h-0 flex-1 overflow-hidden"
          aria-live="polite"
        >
          {chartsQuery.isLoading ? (
            <div
              aria-label="Loading charts"
              className="grid h-full min-h-0 gap-3 sm:grid-cols-2"
            >
              <div className="animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="hidden animate-pulse rounded-2xl bg-slate-200/70 sm:block" />
            </div>
          ) : chartsQuery.isError ? (
            <StatusCard
              title="Charts could not be loaded"
              message={chartsQuery.error.message}
              action={() => void chartsQuery.refetch()}
            />
          ) : !chartsQuery.data?.length ? (
            <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[var(--color-accent-orange)]">
                <Orbit size={24} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Start with a nativity chart
              </h2>
              <p className="mt-2 max-w-sm text-sm text-slate-600">
                Create a chart to see its latest transit story and planetary
                influences here.
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-dark)] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Create your first chart
              </button>
            </div>
          ) : !selectedChart ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Select a chart to view its climate.
            </div>
          ) : storiesQuery.isLoading ? (
            <div
              aria-label="Loading climate snapshot"
              className="grid h-full min-h-0 gap-3 lg:grid-cols-[1.4fr_0.8fr]"
            >
              <div className="animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="hidden animate-pulse rounded-2xl bg-slate-200/70 lg:block" />
            </div>
          ) : storiesQuery.isError ? (
            <StatusCard
              title="Climate snapshot unavailable"
              message={storiesQuery.error.message}
              action={() => void storiesQuery.refetch()}
            />
          ) : !currentStory ? (
            <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[var(--color-primary-dark)]">
                <CloudSun size={24} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No climate snapshot yet
              </h2>
              <p className="mt-2 max-w-sm text-sm text-slate-600">
                Create a transit story for this chart to see its current
                planetary climate.
              </p>
              <Link
                href="/nativity"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-dark)] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Open Nativity Archive
                <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : activeView === "overview" ? (
            <section className="grid h-full min-h-0 gap-3 lg:grid-cols-[1.35fr_0.9fr]">
              <article className="relative isolate flex min-h-0 flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] p-5 text-white shadow-lg sm:p-7">
                <div className="pointer-events-none absolute -top-20 -right-16 -z-10 h-64 w-64 rounded-full bg-[var(--color-accent-glow)]/20 blur-3xl" />
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/90">
                    <Sparkles size={14} className="text-orange-300" />
                    Latest snapshot
                  </span>
                  <span className="text-right text-xs text-white/60">
                    {new Date(currentStory.transitDate).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                </div>

                <div className="my-4 grid min-h-0 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold tracking-[0.16em] text-blue-200 uppercase">
                      Current theme
                    </p>
                    <h2 className="mt-2 line-clamp-3 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                      {currentStory.themes?.[0] ??
                        "Your current planetary climate"}
                    </h2>
                    {currentStory.mainNarrative && (
                      <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-6 text-white/70">
                        {currentStory.mainNarrative}
                      </p>
                    )}
                  </div>
                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border border-white/20 bg-white/10 sm:h-28 sm:w-28">
                    <Activity size={17} className="mb-1 text-orange-200" />
                    <span className="text-2xl font-extrabold tracking-tight">
                      {Math.round(currentStory.overallIntensity)}%
                    </span>
                    <span className="mt-1 text-[10px] font-bold tracking-wider text-white/60 uppercase">
                      Intensity
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {currentStory.themes?.slice(1, 3).map((theme) => (
                      <span
                        key={theme}
                        className="max-w-52 truncate rounded-full bg-white/10 px-3 py-1 text-xs text-white/75"
                      >
                        {theme}
                      </span>
                    ))}
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                      {scenes.length} influences
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView("script")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 transition hover:text-white"
                  >
                    Read narrative <ArrowUpRight size={14} />
                  </button>
                </div>
              </article>

              <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex">
                <div className="flex shrink-0 items-end justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[var(--color-accent-orange)] uppercase">
                      Strongest influences
                    </p>
                    <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                      At a glance
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView("signals")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    All signals <ArrowUpRight size={13} className="inline" />
                  </button>
                </div>

                <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto">
                  {scenes.slice(0, 4).map((scene) => {
                    const intensity = Math.min(
                      100,
                      Math.max(0, scene.intensity),
                    );
                    return (
                      <article
                        key={scene.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            {scene.planet}
                          </h3>
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {Math.round(scene.intensity)}%
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {scene.storyFunction ??
                            scene.dominantPressure ??
                            "Transit influence"}
                        </p>
                        <div
                          className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200"
                          role="meter"
                          aria-label={`${scene.planet} intensity`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={intensity}
                        >
                          <div
                            className="h-full rounded-full bg-[var(--color-accent-orange)]"
                            style={{ width: `${intensity}%` }}
                          />
                        </div>
                      </article>
                    );
                  })}
                  {!scenes.length && (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No planetary signals in this snapshot.
                    </p>
                  )}
                </div>

                <div className="mt-3 flex shrink-0 items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    Born{" "}
                    {new Date(selectedChart.birthDateTime).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {selectedChart.locationName && (
                      <>
                        <MapPin size={13} />
                        <span className="max-w-28 truncate">
                          {selectedChart.locationName}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </aside>
            </section>
          ) : activeView === "signals" ? (
            <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex shrink-0 items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[var(--color-accent-orange)] uppercase">
                    Ranked by intensity
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    Planetary signals
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {scenes.length} {scenes.length === 1 ? "signal" : "signals"}
                </span>
              </div>
              {scenes.length ? (
                <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 overflow-auto lg:grid-cols-3">
                  {scenes.map((scene) => {
                    const intensity = Math.min(
                      100,
                      Math.max(0, scene.intensity),
                    );
                    return (
                      <article
                        key={scene.id}
                        className="flex min-h-16 flex-col justify-center rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 sm:px-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-slate-900">
                            {scene.planet}
                          </h3>
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {Math.round(scene.intensity)}%
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {scene.storyFunction ??
                            scene.dominantPressure ??
                            "Transit influence"}
                        </p>
                        <div
                          className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200"
                          role="meter"
                          aria-label={`${scene.planet} intensity`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={intensity}
                        >
                          <div
                            className="h-full rounded-full bg-[var(--color-accent-orange)]"
                            style={{ width: `${intensity}%` }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No planetary signals in this snapshot.
                </p>
              )}
            </section>
          ) : (
            <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[var(--color-accent-orange)] uppercase">
                    Screenplay
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    Current narrative
                  </h2>
                </div>
                {currentStory.mainNarrative?.trim() && (
                  <Link
                    href="/terminal/narrative"
                    className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Open narrative engine{" "}
                    <ArrowUpRight size={13} className="inline" />
                  </Link>
                )}
              </div>
              {currentStory.mainNarrative?.trim() ? (
                <div className="min-h-0 flex-1 overflow-auto">
                  <ScreenplayDocument content={currentStory.mainNarrative} />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl bg-slate-50 p-5 text-center">
                  <BookOpen size={24} className="text-slate-400" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    No script has been written for this snapshot yet.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Generate a narrative from the Nativity Archive to see it
                    here.
                  </p>
                  <Link
                    href="/nativity"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary-dark)] px-3 py-2 text-xs font-bold text-white"
                  >
                    Open Nativity Archive
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close new chart form"
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-chart-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-8">
                <div>
                  <p className="font-mono text-xs font-bold tracking-[0.14em] text-[var(--color-accent-orange)] uppercase">
                    Nativity archive
                  </p>
                  <h2
                    id="new-chart-title"
                    className="mt-1 text-xl font-bold text-slate-900"
                  >
                    Create a chart
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              {createMutation.isError && (
                <div
                  role="alert"
                  className="mx-5 mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:mx-8"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{createMutation.error.message}</span>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">
                <NativityChartForm
                  isLoading={createMutation.isPending}
                  isError={false}
                  error={null}
                  onSubmit={handleCreateChart}
                />
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function StatusCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
      <div className="max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <h2 className="font-bold">{title}</h2>
            <p className="mt-1 text-sm text-red-800">{message}</p>
            <button
              type="button"
              onClick={action}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
