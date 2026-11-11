"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  ArrowRight,
  Activity,
  BookOpen,
  Compass,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import Layout from "../components/Layout";
import CurrentStoryHero from "../components/dashboard/CurrentStoryHero";
import { useActiveProfile } from "../components/profile/ActiveProfileProvider";

export default function KaalvantaHomeScreen() {
  const router = useRouter();
  const { activeChartId, isLoading: profileLoading } = useActiveProfile();

  // --- tRPC API Queries ---
  // The signed-in member's newest story for the active nativity profile, with
  // its scenes ordered by intensity.
  const { data: story, isLoading: storyLoading } =
    api.nativity.getLatestStory.useQuery(
      { nativityChartId: activeChartId || undefined },
      { enabled: !profileLoading },
    );

  const scenes = story?.scenes ?? [];

  // A story document can be missing, or present without a narrative yet.
  // Never call .replace on undefined. Strip markdown bold markers when text exists.
  const narrative = (story?.mainNarrative ?? "").replace(/\*\*[^*]+\*\*/g, "");

  // --- State for tracking selected Architectural Driver ---
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>("");
  // Auto-select the first driver once data arrives
  useEffect(() => {
    if (scenes && scenes.length > 0) {
      setSelectedPlanetId(scenes[0]!.id);
    }
  }, [scenes]);

  if (storyLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-primary-light)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent-orange)] border-t-transparent" />
      </div>
    );
  }

  if (!story) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
          <Compass className="h-10 w-10 text-[var(--color-accent-orange)]" />
          <h1 className="mt-5 text-4xl font-black tracking-tighter uppercase">
            No active story
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed font-medium opacity-60">
            Your account has no transit story yet. Select a nativity chart to
            generate the first reading.
          </p>
          <button
            onClick={() => router.push("/profile-selection")}
            className="mt-7 rounded-full bg-[var(--color-primary-dark)] px-6 py-3 font-mono text-[10px] font-black tracking-[0.18em] text-[var(--color-primary-light)] uppercase transition-transform hover:-translate-y-0.5"
          >
            Choose a chart
          </button>
        </div>
      </Layout>
    );
  }

  // Find the complete scene payload match based on selected label ID
  const activeScene =
    scenes.find((s) => s.id === selectedPlanetId) || scenes[0];

  return (
    <Layout>
      <div className="mx-auto space-y-2 bg-[var(--color-primary-light)]">
        <CurrentStoryHero storyId={story.id} />

        {/* ================= 1. TOP NAV SECTION: LABELS SELECTOR ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-extrabold tracking-[0.18em] text-[var(--color-accent-orange)] uppercase">
              Active Architectural Drivers // Click to Inspect Target
            </p>
            <span className="font-sans text-[12px] font-bold opacity-60">
              {scenes.length} Forces Present
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {scenes.map((scene) => {
              const isSelected = scene.id === selectedPlanetId;
              return (
                <button
                  key={scene.id}
                  onClick={() => setSelectedPlanetId(scene.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 text-xs font-extrabold tracking-widest uppercase transition-all duration-200 ${
                    isSelected
                      ? "scale-[1.02] border-[var(--color-accent-orange)] bg-white text-[var(--color-primary-dark)] shadow-sm"
                      : "border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] hover:border-[var(--color-accent-orange)]"
                  }`}
                >
                  {/* Status Indicator Dot */}
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[var(--color-primary-dark)]/60" : "bg-[var(--color-accent-orange)]"}`}
                  />

                  {scene.planet}

                  {/* Micro System Function Tag */}
                  <span
                    className={`rounded px-1.5 py-0.5 font-sans text-[11px] font-bold tracking-normal lowercase ${
                      isSelected
                        ? "bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]/80"
                        : "bg-[var(--color-primary-light)]/10 text-[var(--color-accent-glow)]"
                    }`}
                  >
                    {scene.storyFunction}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= 2. BENTO CENTER MODULE ================= */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* HERO STORY CONTAINER (2 Columns Wide) */}
          <div className="relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] p-6 text-[var(--color-primary-light)] shadow-md md:p-10 xl:col-span-2">
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] px-3 py-1 text-xs font-extrabold tracking-wider text-white uppercase">
                  <Sparkles size={12} /> Live Narrative Theme:{" "}
                  {story?.themes?.[0] ?? "Unresolved"}
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic md:text-6xl">
                  {story?.nativityChart?.name ?? "Current Transit"}
                </h1>
                <p className="max-w-2xl text-base leading-relaxed font-medium text-[var(--color-primary-light)]/85 md:text-lg">
                  {narrative.length > 0
                    ? narrative
                    : "No narrative has been compiled for this transit window yet."}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <button
                onClick={() =>
                  router.push(`/dashboard/current-story/${story.id}`)
                }
                className="group/btn inline-flex items-center gap-2 text-xs font-extrabold tracking-widest text-[var(--color-accent-orange)] uppercase transition-colors hover:text-white"
              >
                View Full Story{" "}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover/btn:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* DYNAMIC SPOLIGHT CARD: READS SELECTOR STATE VALUES LIVE */}
          {activeScene && (
            <div className="flex min-h-[440px] flex-col justify-between rounded-2xl border border-[var(--color-accent-orange)] bg-white p-6 shadow-sm transition-all duration-300">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/30 pb-3">
                  <div>
                    <span className="block font-sans text-[11px] font-bold tracking-wider uppercase opacity-60">
                      Driver Spotlight
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
                      {activeScene.planet}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="block font-sans text-[11px] font-bold tracking-wider uppercase opacity-60">
                      Dynamic Function
                    </span>
                    <span className="font-sans text-xs font-extrabold tracking-wide text-[var(--color-accent-orange)] uppercase">
                      {activeScene.storyFunction}
                    </span>
                  </div>
                </div>

                {/* Operational Scripts Map */}
                <div className="space-y-4">
                  <div>
                    <span className="mb-1 block font-sans text-[11px] font-bold tracking-wider uppercase opacity-55">
                      Active Behavioral Script
                    </span>
                    <p className="text-sm leading-snug font-bold text-[var(--text-main)]">
                      {activeScene.behavioralPattern}
                    </p>
                  </div>

                  <div className="rounded-r-lg border-l-2 border-[var(--color-accent-orange)] bg-[var(--color-primary-light)]/30 p-3">
                    <span className="mb-0.5 block font-sans text-[11px] font-bold tracking-wider uppercase opacity-60">
                      Environmental Tension
                    </span>
                    <p className="text-xs leading-normal font-medium text-[var(--text-muted)] italic">
                      "{activeScene.dominantPressure}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Crash / Threshold Progress Ring Bar */}
              <div className="mt-6 space-y-3 border-t border-[var(--color-ring-bronze)]/30 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-sans text-[11px] font-bold tracking-wider uppercase opacity-55">
                      Systemic Failure Vector
                    </span>
                    <span className="font-sans text-sm font-black">
                      Collapse Risk: {activeScene.collapseRisk}%
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-2 ${(activeScene.collapseRisk ?? 0) >= 50 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                  >
                    <ShieldAlert size={18} />
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-primary-dark)]/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${(activeScene.collapseRisk ?? 0) >= 50 ? "bg-[var(--color-accent-orange)]" : "bg-emerald-500"}`}
                    style={{ width: `${activeScene.collapseRisk ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 3. LOWER SECTION METRICS MATRIX ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-ring-bronze)]/40 bg-white p-5 shadow-sm lg:col-span-1">
            <div>
              <span className="block font-sans text-[11px] font-bold uppercase opacity-60">
                Global Intensity
              </span>
              <span className="font-sans text-3xl font-black tracking-tight">
                {story?.overallIntensity ?? "—"}
              </span>
            </div>
            <div className="rounded bg-[var(--color-accent-orange)] px-2 py-1 text-right font-sans text-[11px] font-extrabold text-white">
              SCALE // LIVE
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--color-ring-bronze)]/40 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="rounded-xl border border-[var(--color-primary-dark)]/10 bg-[var(--color-primary-light)]/40 p-2.5 text-center">
              <span className="block text-[11px] font-bold uppercase opacity-60">
                Focus
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-0.5 font-sans text-xs font-extrabold text-emerald-700">
                ▲ HIGH
              </span>
            </div>
            <div className="rounded-xl border border-[var(--color-primary-dark)]/10 bg-[var(--color-primary-light)]/40 p-2.5 text-center">
              <span className="block text-[11px] font-bold uppercase opacity-60">
                Pressure
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-0.5 font-sans text-xs font-extrabold text-[var(--color-accent-orange)]">
                ▲ HIGH
              </span>
            </div>
            <div className="rounded-xl border border-[var(--color-primary-dark)]/10 bg-[var(--color-primary-light)]/40 p-2.5 text-center">
              <span className="block text-[11px] font-bold uppercase opacity-60">
                Adaptation
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-0.5 font-sans text-xs font-extrabold text-amber-700">
                ▼ LOW
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-ring-bronze)]/40 bg-white p-4 shadow-sm lg:col-span-1">
            <div className="shrink-0 rounded-lg bg-[var(--color-primary-dark)] p-2 text-[var(--color-primary-light)]">
              <BookOpen size={14} />
            </div>
            <p className="text-[12px] leading-tight font-semibold text-[var(--text-muted)]">
              Cosmic vectors map seamlessly to your behavioral scripts.
            </p>
          </div>
        </div>

        {/* TIMELINE INTERFACE LINK BANNER */}
        <div
          onClick={() => router.push("/dashboard/timeline")}
          className="flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-dashed border-[var(--color-ring-bronze)] bg-white p-4 transition-all duration-300 hover:border-[var(--color-accent-orange)] sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-[var(--color-accent-orange)]" />
            <span className="text-xs font-extrabold tracking-wider text-[var(--color-primary-dark)] uppercase">
              Historical Timeline Interface & Temporal Filtering
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1 font-sans text-xs font-bold opacity-60">
            Coming Soon <Compass size={14} />
          </span>
        </div>
      </div>
    </Layout>
  );
}
