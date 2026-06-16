"use client";

import React from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Activity, ChevronRight } from "lucide-react";

export default function CurrentStoryHero() {
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

  const story = currentStory || {};

  if (storyLoading || scenesLoading) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-white/5 bg-slate-950 sm:h-[540px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent-orange,rgba(249,115,22,1))] border-t-transparent" />
      </div>
    );
  }

  // --- Regex String Extraction & Truncation ---
  const realityString = (() => {
    if (!story?.mainNarrative) return "";
    const match = story.mainNarrative.match(
      /\*\*The Reality:\*\*\s *([\s\S]*)$/i,
    );
    const rawText = match
      ? match[1]
      : story.mainNarrative.replace(/\*\*[^*]+\*\*/g, "");

    const cleanText = rawText.replace(/\s+/g, " ").trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      return sentences.slice(0, 2).join(" ");
    }
    return cleanText;
  })();

  return (
    <div className="mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* ================= MAIN HERO FRAME ================= */}
      {/* Changes layout flow to top-down on mobile, then snaps to layered relative absolute positioning on desktop */}
      <div className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-950 shadow-2xl md:block md:min-h-[500px] lg:min-h-[540px]">
        {/* --- CAST CHARACTER ACTION ZONE --- */}
        {/* On mobile, forces a dedicated aspect box so closeups are fully visible above text block */}
        <div className="pointer-events-none relative z-0 aspect-[16/10] w-full overflow-hidden select-none md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[55%] md:rounded-r-2xl">
          <Image
            src={"/hero.png"}
            fill
            alt="Cast Member Action Close-up"
            className="object-cover object-center opacity-95 transition-transform duration-1000 ease-out group-hover:scale-[1.02] md:object-top md:opacity-90"
            priority
          />

          {/* Subtle horizontal gradient mask for wide screens */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent md:block" />

          {/* Bottom bleed mask designed to drop off into the dark content panel on mobile layouts */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent md:hidden" />

          {/* Color flare accentuation backdrop frame */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.12)_0%,rgba(249,115,22,0.03)_40%,transparent_75%)] mix-blend-color-dodge" />
        </div>

        {/* --- TEXT READABILITY UNDERLAY PROTECTION --- */}
        {/* Desktop remains anchored left, Mobile fades bottom card text frame perfectly */}
        <div className="absolute inset-x-0 top-[30%] bottom-0 z-[1] bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent md:inset-0 md:bg-gradient-to-t md:from-black md:via-black/75 md:to-transparent" />
        <div className="absolute inset-y-0 left-0 z-[1] hidden w-[60%] bg-gradient-to-r from-slate-950 via-slate-950/95 to-transparent md:block" />

        {/* --- CONTENT TYPOGRAPHY OVERLAY INTERFACE --- */}
        <div className="relative z-10 flex h-full w-full flex-col justify-end space-y-4 p-5 text-left sm:space-y-5 sm:p-10 md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:max-w-xl md:p-16 lg:max-w-2xl">
          {/* Meta System Track Badge Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-sm border border-orange-500/10 bg-[var(--color-accent-orange,#f97316)] px-2 py-0.5 text-[8px] font-black tracking-widest text-white uppercase shadow-md sm:text-[9px]">
              LIVE TRACK
            </div>
            {story.intensity && (
              <div className="flex items-center gap-1.5 rounded border border-white/5 bg-slate-900/80 px-2 py-0.5 font-mono text-[9px] text-white/90 shadow-sm backdrop-blur-md sm:text-[10px]">
                <Flame
                  size={10}
                  className="animate-pulse text-[var(--color-accent-orange,#f97316)]"
                />
                INTENSITY CRITERIA //{" "}
                <span className="font-bold text-[var(--color-accent-orange,#f97316)]">
                  {story.intensity}
                </span>
              </div>
            )}
          </div>

          {/* Main Slate Identifiers */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 font-mono text-[9px] font-black tracking-[0.3em] text-[var(--color-accent-orange,#f97316)] uppercase drop-shadow-sm sm:text-[10px] sm:tracking-[0.35em]">
              <Activity size={10} className="animate-pulse text-sky-400" />{" "}
              SYSTEM SYSTEMIC RUN
            </span>

            {/* Dynamic sizing stops text overlap on tiny screen frameworks */}
            <h1 className="text-2xl leading-[0.9] font-black tracking-tighter text-white uppercase italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] sm:text-5xl md:text-6xl md:leading-[0.85] lg:text-7xl">
              {story.title || "Enlightenment at a Cost"}
            </h1>

            <p className="max-w-lg pt-0.5 text-[11px] leading-relaxed font-medium tracking-wide text-slate-300 opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-sm md:text-base">
              {realityString}
            </p>
          </div>

          {/* Actions Block */}
          <div className="flex items-center gap-3 pt-1 sm:pt-2">
            <button
              onClick={() =>
                router.push(`/dashboard/current-story/${story.id}`)
              }
              className="group/btn flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2.5 text-[10px] font-black tracking-widest text-slate-950 uppercase shadow-xl transition-all duration-300 hover:bg-[var(--color-accent-orange,#f97316)] hover:text-white active:scale-95 sm:w-auto sm:px-5"
            >
              Story Details
              <ChevronRight
                size={12}
                className="transition-transform duration-300 group-hover/btn:translate-x-0.5"
              />
            </button>
          </div>
        </div>

        {/* Framing Bottom Horizon Line Accent */}
        <div className="absolute inset-x-0 bottom-0 hidden h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent-orange,#f97316)]/30 to-transparent opacity-60 md:block" />
      </div>
    </div>
  );
}
