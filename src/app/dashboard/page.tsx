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

export default function KaalvantaHomeScreen() {
  const router = useRouter();

  // --- tRPC API Queries ---
  const { data: currentStory, isLoading: storyLoading } =
    api.nativity.getCurrentStory.useQuery({
      storyId: "6a1a8ec1880574e3556fad8b",
    });
  const { data: planetaryScenes, isLoading: scenesLoading } =
    api.nativity.getPlanetaryScenes.useQuery({
      currentStoryId: "6a1a8ec1880574e3556fad8b",
    });

  // Fallbacks using your exact data schema shapes
  const story = currentStory ?? null;
  const scenes = planetaryScenes || [];

  // A story document can be missing, or present without a narrative yet.
  // Never call .replace on undefined. Strip markdown bold markers when text exists.
  const narrative = (story?.mainNarrative ?? "").replace(/\*\*[^*]+\*\*/g, "");

  // --- State for tracking selected Architectural Driver ---
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>("");
  console.log(selectedPlanetId);
  // Auto-select the first driver once data arrives
  useEffect(() => {
    if (scenes && scenes.length > 0) {
      setSelectedPlanetId(scenes[0]._id);
    }
  }, [scenes]);

  if (storyLoading || scenesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-primary-light)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent-orange)] border-t-transparent" />
      </div>
    );
  }

  // Find the complete scene payload match based on selected label ID
  const activeScene =
    scenes.find((s) => s._id === selectedPlanetId) || scenes[0];

  return (
    <Layout>
      <div className="mx-auto space-y-2 bg-[var(--color-primary-light)]">
        <CurrentStoryHero />

        {/* ================= 1. TOP NAV SECTION: LABELS SELECTOR ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--color-accent-orange)] uppercase">
              Active Architectural Drivers // Click to Inspect Target
            </p>
            <span className="font-mono text-[10px] opacity-50">
              {scenes.length} Forces Present
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {scenes.map((scene) => {
              const isSelected = scene._id === selectedPlanetId;
              return (
                <button
                  key={scene._id}
                  onClick={() => setSelectedPlanetId(scene._id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                    isSelected
                      ? "scale-[1.02] border-[var(--color-accent-orange)] bg-white/90 text-[var(--color-primary-dark)] shadow-md"
                      : "border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] hover:border-[var(--color-accent-orange)] hover:bg-white/5"
                  }`}
                >
                  {/* Status Indicator Dot */}
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[var(--color-primary-dark)]/60" : "bg-[var(--color-accent-orange)]"}`}
                  />

                  {scene.planet}

                  {/* Micro System Function Tag */}
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-normal lowercase ${
                      isSelected
                        ? "bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]/80"
                        : "bg-white/10 text-[var(--color-accent-glow)]"
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
          <div className="relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] p-6 text-[var(--color-primary-light)] shadow-xl md:p-10 xl:col-span-2">
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-[var(--color-accent-glow)] opacity-10 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/10 px-3 py-1 text-xs font-bold tracking-wider text-[var(--color-accent-orange)] uppercase">
                  <Sparkles size={12} /> Live Narrative Theme:{" "}
                  {story?.theme ?? "Unresolved"}
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic md:text-6xl">
                  {story?.title ?? "No Active Session"}
                </h1>
                <p className="max-w-2xl text-base leading-relaxed font-normal text-[var(--color-primary-light)]/80 md:text-lg">
                  {narrative.length > 0
                    ? narrative
                    : "No narrative has been compiled for this transit window yet."}
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <button
                onClick={() => router.push("/dashboard/story")}
                className="group/btn inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[var(--color-accent-orange)] uppercase transition-colors hover:text-white"
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
            <div className="flex min-h-[440px] flex-col justify-between rounded-2xl border border-[var(--color-accent-orange)] bg-white/90 p-6 shadow-md backdrop-blur-md transition-all duration-300">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/20 pb-3">
                  <div>
                    <span className="block font-mono text-[9px] tracking-wider uppercase opacity-50">
                      Driver Spotlight
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-[var(--color-primary-dark)]">
                      {activeScene.planet}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-[9px] tracking-wider uppercase opacity-50">
                      Dynamic Function
                    </span>
                    <span className="font-mono text-xs font-bold tracking-wide text-[var(--color-accent-orange)] uppercase">
                      {activeScene.storyFunction}
                    </span>
                  </div>
                </div>

                {/* Operational Scripts Map */}
                <div className="space-y-4">
                  <div>
                    <span className="mb-1 block font-mono text-[9px] tracking-wider uppercase opacity-40">
                      Active Behavioral Script
                    </span>
                    <p className="text-sm leading-snug font-bold text-[var(--text-main)]">
                      {activeScene.behavioralPattern}
                    </p>
                  </div>

                  <div className="rounded-r-lg border-l-2 border-[var(--color-accent-orange)] bg-[var(--color-primary-light)]/30 p-3">
                    <span className="mb-0.5 block font-mono text-[9px] tracking-wider uppercase opacity-50">
                      Environmental Tension
                    </span>
                    <p className="text-xs leading-normal font-medium text-[var(--text-muted)] italic">
                      "{activeScene.dominantPressure}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Crash / Threshold Progress Ring Bar */}
              <div className="mt-6 space-y-3 border-t border-[var(--color-ring-bronze)]/20 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-mono text-[9px] tracking-wider uppercase opacity-40">
                      Systemic Failure Vector
                    </span>
                    <span className="font-mono text-sm font-black">
                      Collapse Risk: {activeScene.collapseRisk}%
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-2 ${activeScene.collapseRisk >= 50 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                  >
                    <ShieldAlert size={18} />
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-primary-dark)]/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${activeScene.collapseRisk >= 50 ? "bg-[var(--color-accent-orange)]" : "bg-emerald-500"}`}
                    style={{ width: `${activeScene.collapseRisk}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 3. LOWER SECTION METRICS MATRIX ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-white/50 p-5 backdrop-blur-sm lg:col-span-1">
            <div>
              <span className="block font-mono text-[9px] uppercase opacity-40">
                Global Intensity
              </span>
              <span className="font-mono text-3xl font-black tracking-tight">
                {story?.intensity ?? "—"}
              </span>
            </div>
            <div className="rounded bg-[var(--color-accent-orange)]/10 px-2 py-1 text-right font-mono text-xs font-bold text-[var(--color-accent-orange)]">
              SCALE // LIVE
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-white/50 p-4 backdrop-blur-sm lg:col-span-2">
            <div className="rounded-xl border border-black/5 bg-white/60 p-2.5 text-center">
              <span className="block text-[9px] font-bold uppercase opacity-50">
                Focus
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-0.5 font-mono text-xs font-bold text-emerald-600">
                ▲ HIGH
              </span>
            </div>
            <div className="rounded-xl border border-black/5 bg-white/60 p-2.5 text-center">
              <span className="block text-[9px] font-bold uppercase opacity-50">
                Pressure
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-0.5 font-mono text-xs font-bold text-[var(--color-accent-orange)]">
                ▲ HIGH
              </span>
            </div>
            <div className="rounded-xl border border-black/5 bg-white/60 p-2.5 text-center">
              <span className="block text-[9px] font-bold uppercase opacity-50">
                Adaptation
              </span>
              <span className="mt-0.5 flex items-center justify-center gap-0.5 font-mono text-xs font-bold text-amber-600">
                ▼ LOW
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-white/50 p-4 backdrop-blur-sm lg:col-span-1">
            <div className="shrink-0 rounded-lg bg-[var(--color-primary-dark)] p-2 text-[var(--color-primary-light)]">
              <BookOpen size={14} />
            </div>
            <p className="text-[11px] leading-tight text-[var(--text-muted)]">
              Cosmic vectors map seamlessly to your behavioral scripts.
            </p>
          </div>
        </div>

        {/* TIMELINE INTERFACE LINK BANNER */}
        <div
          onClick={() => router.push("/dashboard/timeline")}
          className="flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-dashed border-[var(--color-ring-bronze)] bg-white/30 p-4 transition-all duration-300 hover:border-[var(--color-accent-orange)] sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-[var(--color-accent-orange)]" />
            <span className="text-xs font-bold tracking-wider text-[var(--color-primary-dark)] uppercase">
              Historical Timeline Interface & Temporal Filtering
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1 font-mono text-xs opacity-50">
            Coming Soon <Compass size={14} />
          </span>
        </div>
      </div>
    </Layout>
  );
}
