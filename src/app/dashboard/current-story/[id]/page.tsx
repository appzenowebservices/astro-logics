"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
  Activity,
  Clock,
  Calendar,
  Layers,
  ChevronLeft,
  Flame,
  Compass,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import CastCards from "../../../components/dashboard/CastCards"; // Adjust paths based on your architecture structure
import Layout from "../../../components/Layout";
import { Loader } from "../../../components/Loader";

export default function CurrentStoryDetailsPage() {
  const params = useParams();
  const router = useRouter();

  // Extract strict story runtime ID parameter string safely
  const storyId =
    typeof params?.id === "string" ? params.id : "6a1a8ec1880574e3556fad8b";

  // --- Core Engine tRPC API Queries ---
  const { data: currentStory, isLoading: storyLoading } =
    api.nativity.getCurrentStory.useQuery({ storyId }, { enabled: !!storyId });

  const { data: planetaryScenes, isLoading: scenesLoading } =
    api.nativity.getPlanetaryScenes.useQuery(
      { currentStoryId: storyId },
      { enabled: !!storyId },
    );

  // --- Shared Navigation State Controls ---
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>("");

  const story = currentStory || {};
  const scenes = planetaryScenes || [];

  // Automate primary actor tracking selection selection array on hydrate
  useEffect(() => {
    if (scenes && scenes.length > 0) {
      setSelectedPlanetId(scenes[0]._id);
    }
  }, [scenes]);

  if (storyLoading || scenesLoading) {
    return <Loader />;
  }

  // --- Text Serialization Cleaners ---
  const cleanNarrativeText = story?.mainNarrative
    ? story.mainNarrative.replace(/\*\*[^*]+\*\*/g, "").trim()
    : "No active architectural narrative records fetched for this configuration state.";

  const activeThemes = story.themes || [
    "Deadline Pressure",
    "Responsibility Expansion",
    "Resource Fragmentation",
  ];
  const currentActiveScene = scenes.find((s) => s._id === selectedPlanetId);

  return (
    <Layout>
      <div className="font-roboto min-h-screen w-full space-y-8 overflow-y-auto bg-[var(--color-primary-dark)] p-4 text-white sm:p-6 lg:p-8">
        {/* ================= HEADER CONTROL BAR ================= */}
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
          <button
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/5 bg-white/[0.01] px-3 py-1.5 text-xs font-bold text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft size={14} /> Back to Deck
          </button>
          <span className="font-roboto text-[10px] tracking-widest text-white/30 uppercase">
            Engine Instance ID // {storyId.slice(0, 8)}...
          </span>
        </div>

        {/* ================= THEATRICAL HERO SNAP ================= */}
        <div className="group relative flex min-h-[460px] w-full flex-col justify-end overflow-hidden rounded-2xl border border-white/5 bg-slate-950 p-6 shadow-2xl sm:min-h-[420px] sm:p-10 md:p-14">
          {/* --- CAST CHARACTER ACTION ZONE --- */}
          {/* Widescreen locks the character frame to the right half; mobile opens it up full-screen */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full overflow-hidden rounded-r-2xl select-none md:w-[55%]">
            {/* Action Shot Image Layer */}
            <Image
              src={"/scene.jpg"}
              fill
              alt="Cast Member Action Close-up"
              /* object-top preserves facial features; group-hover adds a subtle dramatic camera-zoom effect */
              className="object-cover object-center opacity-90 transition-transform duration-1000 ease-out group-hover:scale-[1.03] md:object-top"
              priority
            />

            {/* Edge-Feathering Mask: Seamlessly melts the left edge of the character image into the dark UI text block */}
            <div className="absolute inset-0 hidden bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent md:block" />

            {/* Bottom Vignette Mask: Prevents the lower half of the action shot from fighting with mobile text layouts */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent md:hidden" />

            {/* Cybernetic Edge Glow Rim (Highlights the character's side profile) */}
            <div className="absolute inset-y-0 left-0 hidden w-[80px] bg-gradient-to-r from-slate-950 to-transparent md:block" />

            {/* Color Dodge Backlight Flare (Simulates dramatic studio lighting behind the character headshot) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(56,189,248,0.15)_0%,transparent_60%)] mix-blend-color-dodge" />
          </div>

          {/* --- CINEMATIC TEXT READABILITY UNDERLAYS --- */}
          {/* Solid foundational shadow depth to guarantee the typography passes absolute accessibility checks */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent md:via-black/20" />
          <div className="absolute inset-y-0 left-0 z-[1] hidden w-full bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent md:block md:w-[60%]" />

          {/* --- UI INTERFACE STACK OVERLAY --- */}
          <div className="relative z-10 max-w-xl space-y-4 text-left lg:max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-sm border border-orange-500/20 bg-[var(--color-accent-orange)] px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase shadow-lg">
                LIVE TRACK
              </div>
              {story.intensity && (
                <div className="flex items-center gap-1.5 rounded border border-white/10 bg-slate-900/60 px-2.5 py-0.5 font-mono text-[10px] text-white/90 shadow-md backdrop-blur-md">
                  <Flame
                    size={12}
                    className="animate-pulse text-[var(--color-accent-orange)]"
                  />
                  INTENSITY CRITERIA //{" "}
                  <span className="font-bold text-[var(--color-accent-orange)]">
                    {story.intensity}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="flex items-center gap-2 font-mono text-[10px] font-black tracking-[0.35em] text-[var(--color-accent-orange)] uppercase drop-shadow-sm">
                <Activity size={12} className="animate-pulse text-sky-400" />{" "}
                SYSTEM SYSTEMIC NATIVITY RUN
              </span>
              {/* Tight tracking and custom line-height mirror professional film title cards */}
              <h1 className="text-4xl leading-[0.85] font-black tracking-tighter text-white uppercase italic drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] sm:text-6xl md:text-7xl">
                {story.title || "Overcommitting"}
              </h1>
            </div>
          </div>

          {/* Bottom Cinematic Accent Bar */}
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent-orange)]/40 to-transparent opacity-70" />
        </div>

        {/* ================= MAIN MATRIX SPLIT LAYOUT ================= */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Left 2 Columns: Narratives & Structural Controls */}
          <div className="space-y-8 lg:col-span-2">
            {/* Main Narrative Block */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase">
                <Compass size={12} /> Logline Overview
              </h3>
              <p className="rounded-xl border border-white/5 bg-white/[0.01] p-6 text-sm leading-relaxed font-medium tracking-wide text-white/90 shadow-2xl sm:text-base">
                {cleanNarrativeText}
              </p>
            </div>

            {/* INVERTED MATRIX SUB-NAVIGATION PILLS ROW */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase">
                Active Environment Node Selector
              </h3>
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
                          : "border border-white/10 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] hover:border-[var(--color-accent-orange)] hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[var(--color-primary-dark)]/60" : "bg-[var(--color-accent-orange)]"}`}
                      />
                      {scene.planet}
                      <span
                        className={`font-roboto rounded px-1.5 py-0.5 text-[10px] font-medium tracking-normal lowercase ${
                          isSelected
                            ? "bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]/80"
                            : "bg-white/10 text-[var(--color-accent-glow)]"
                        }`}
                      >
                        {scene.storyFunction || "driver"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Inspect Data Panel Module */}
            {currentActiveScene && (
              <div className="animate-fadeIn space-y-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6">
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                  <span className="text-xs font-black tracking-widest text-[var(--color-accent-orange)] uppercase">
                    Blueprint Realtime Specs // {currentActiveScene.planet}
                  </span>
                  {currentActiveScene.collapseRisk && (
                    <span className="font-roboto flex items-center gap-1.5 text-[10px] text-white/40">
                      <AlertTriangle size={11} className="text-amber-500" />
                      RISK VALUE:{" "}
                      <span className="font-bold text-white">
                        {currentActiveScene.collapseRisk}%
                      </span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 text-xs leading-relaxed md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="block text-[9px] tracking-widest text-white/30 uppercase">
                      Behavioral Blueprint Script
                    </span>
                    <p className="font-medium text-white/80">
                      {currentActiveScene.behavioralPattern ||
                        "No behavioral overrides flagged."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[9px] tracking-widest text-white/30 uppercase">
                      Structural Pressure Point
                    </span>
                    <p className="font-medium text-white/80 italic">
                      "
                      {currentActiveScene.dominantPressure ||
                        "Load balanced normally."}
                      "
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Temporal Tracking Metadata & Alpha Themes Layout */}
          <div className="space-y-6">
            {/* Temporal Alignment Block */}
            <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-xs">
              <span className="block text-[9px] font-bold tracking-[0.25em] text-white/30 uppercase">
                Temporal Tracking Metrics
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/[0.05] py-1.5">
                  <span className="flex items-center gap-2 text-white/40">
                    <Calendar size={13} /> Target Window
                  </span>
                  <span className="font-medium text-white">
                    {story.transitWindow || "May 28 - June 15"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/[0.05] py-1.5">
                  <span className="flex items-center gap-2 text-white/40">
                    <Clock size={13} /> TTL Threshold
                  </span>
                  <span className="font-bold text-amber-500">
                    {story.timeRemaining || "12 Days Remaining"}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Experience Alpha Themes Cards Stack */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers
                  size={13}
                  className="text-[var(--color-accent-orange)]"
                />
                <h3 className="text-[10px] font-bold tracking-[0.25em] text-white/40 uppercase">
                  Core Alpha Themes Map
                </h3>
              </div>
              <div className="space-y-2.5">
                {activeThemes.map((themeName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent p-4 transition-colors hover:border-white/10"
                  >
                    <span className="text-sm font-bold tracking-wide text-white uppercase">
                      {themeName}
                    </span>
                    <span className="text-[9px] font-bold text-white/20">
                      0{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= COMPACT CAST GRAPH MODULARS ROW ================= */}
        <div className="border-t border-white/[0.04] pt-4">
          <CastCards
            currentStoryId={storyId}
            selectedPlanetId={selectedPlanetId}
            onSelectPlanet={setSelectedPlanetId}
          />
        </div>
      </div>
    </Layout>
  );
}
