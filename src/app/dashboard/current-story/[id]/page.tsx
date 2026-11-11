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
        <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/20 pb-4">
          <button
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-ring-bronze)]/25 bg-[#22365d] px-3 py-1.5 text-xs font-bold text-[var(--color-primary-light)]/65 transition-all hover:bg-[#2e466f] hover:text-[var(--color-primary-light)]"
          >
            <ChevronLeft size={14} /> Back to Deck
          </button>
          <span className="font-roboto text-[12px] tracking-widest text-[var(--color-primary-light)]/55 uppercase">
            Engine Instance ID // {storyId.slice(0, 8)}...
          </span>
        </div>

        {/* ================= THEATRICAL HERO SNAP ================= */}
        <div className="group relative grid w-full overflow-hidden rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="relative z-10 flex flex-col justify-center gap-5 p-6 text-left sm:p-10 lg:p-14">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-md bg-[var(--color-accent-orange)] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.16em] text-white uppercase">
                Live track
              </div>
              {story.intensity && (
                <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-ring-bronze)]/40 bg-[#22365d] px-2.5 py-1 font-sans text-[11px] font-bold text-[var(--color-primary-light)]">
                  <Flame
                    size={12}
                    className="text-[var(--color-accent-orange)]"
                  />
                  Intensity criteria //{" "}
                  <span className="font-extrabold text-[var(--color-accent-orange)]">
                    {story.intensity}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <span className="flex items-center gap-2 font-sans text-[11px] font-extrabold tracking-[0.26em] text-[var(--color-accent-orange)] uppercase">
                <Activity size={12} /> System systemic nativity run
              </span>
              <h1 className="text-4xl leading-[0.9] font-black tracking-tighter text-white uppercase italic sm:text-6xl md:text-7xl">
                {story.title || "Overcommitting"}
              </h1>
            </div>
          </div>

          <div className="relative order-first min-h-[280px] w-full overflow-hidden lg:order-last lg:min-h-[500px] lg:border-l lg:border-[var(--color-ring-bronze)]/20">
            <Image
              src={"/scene.jpg"}
              fill
              alt="Cast Member Action Close-up"
              className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.03] lg:object-top"
              priority
            />
          </div>
        </div>

        {/* ================= MAIN MATRIX SPLIT LAYOUT ================= */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Left 2 Columns: Narratives & Structural Controls */}
          <div className="space-y-8 lg:col-span-2">
            {/* Main Narrative Block */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-[12px] font-bold tracking-[0.25em] text-[var(--color-primary-light)]/60 uppercase">
                <Compass size={12} /> Logline Overview
              </h3>
              <p className="rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[#22365d] p-6 text-sm leading-relaxed font-medium tracking-wide text-[var(--color-primary-light)] shadow-sm sm:text-base">
                {cleanNarrativeText}
              </p>
            </div>

            {/* INVERTED MATRIX SUB-NAVIGATION PILLS ROW */}
            <div className="space-y-3">
              <h3 className="text-[12px] font-bold tracking-[0.25em] text-[var(--color-primary-light)]/60 uppercase">
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
                          ? "scale-[1.02] border-[var(--color-accent-orange)] bg-white text-[var(--color-primary-dark)] shadow-sm"
                          : "border border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] hover:border-[var(--color-accent-orange)] hover:bg-[#2e466f]"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[var(--color-primary-dark)]/60" : "bg-[var(--color-accent-orange)]"}`}
                      />
                      {scene.planet}
                      <span
                        className={`font-roboto rounded px-1.5 py-0.5 text-[12px] font-medium tracking-normal lowercase ${
                          isSelected
                            ? "bg-[var(--color-primary-dark)]/10 text-[var(--color-primary-dark)]/80"
                            : "bg-[#2e466f] text-[var(--color-accent-glow)]"
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
              <div className="animate-fadeIn space-y-4 rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[#22365d] p-6">
                <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/20 pb-3">
                  <span className="text-xs font-black tracking-widest text-[var(--color-accent-orange)] uppercase">
                    Blueprint Realtime Specs // {currentActiveScene.planet}
                  </span>
                  {currentActiveScene.collapseRisk && (
                    <span className="font-roboto flex items-center gap-1.5 text-[12px] text-[var(--color-primary-light)]/60">
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
                    <span className="block text-[11px] tracking-widest text-[var(--color-primary-light)]/55 uppercase">
                      Behavioral Blueprint Script
                    </span>
                    <p className="font-medium text-[var(--color-primary-light)]/85">
                      {currentActiveScene.behavioralPattern ||
                        "No behavioral overrides flagged."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[11px] tracking-widest text-[var(--color-primary-light)]/55 uppercase">
                      Structural Pressure Point
                    </span>
                    <p className="font-medium text-[var(--color-primary-light)]/85 italic">
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
            <div className="space-y-4 rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[#22365d] p-5 text-xs">
              <span className="block text-[11px] font-bold tracking-[0.25em] text-[var(--color-primary-light)]/55 uppercase">
                Temporal Tracking Metrics
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/20 py-1.5">
                  <span className="flex items-center gap-2 text-[var(--color-primary-light)]/60">
                    <Calendar size={13} /> Target Window
                  </span>
                  <span className="font-medium text-white">
                    {story.transitWindow || "May 28 - June 15"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--color-ring-bronze)]/20 py-1.5">
                  <span className="flex items-center gap-2 text-[var(--color-primary-light)]/60">
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
                <h3 className="text-[12px] font-bold tracking-[0.25em] text-[var(--color-primary-light)]/60 uppercase">
                  Core Alpha Themes Map
                </h3>
              </div>
              <div className="space-y-2.5">
                {activeThemes.map((themeName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[#22365d] p-4 transition-colors hover:border-[var(--color-ring-bronze)]/30"
                  >
                    <span className="text-sm font-bold tracking-wide text-white uppercase">
                      {themeName}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-primary-light)]/40">
                      0{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= COMPACT CAST GRAPH MODULARS ROW ================= */}
        <div className="border-t border-[var(--color-ring-bronze)]/20 pt-4">
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
