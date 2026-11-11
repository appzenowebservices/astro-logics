"use client";

import React from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Activity, ChevronRight } from "lucide-react";

export default function CurrentStoryHero({ storyId }: { storyId?: string }) {
  const router = useRouter();

  // --- tRPC API Queries ---
  const { data: currentStory, isLoading: storyLoading } =
    api.nativity.getCurrentStory.useQuery(
      { storyId: storyId ?? "" },
      { enabled: Boolean(storyId) },
    );

  const story = currentStory;

  if (!storyId) return null;

  if (storyLoading) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] sm:h-[540px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent-orange)] border-t-transparent" />
      </div>
    );
  }

  if (!story) return null;

  // --- Regex String Extraction & Truncation ---
  const realityString = (() => {
    if (!story.mainNarrative) return "";
    const match = story.mainNarrative.match(
      /\*\*The Reality:\*\*\s *([\s\S]*)$/i,
    );
    const rawText =
      match?.[1] ?? story.mainNarrative.replace(/\*\*[^*]+\*\*/g, "");

    const cleanText = rawText.replace(/\s+/g, " ").trim();
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      return sentences.slice(0, 2).join(" ");
    }
    return cleanText;
  })();

  return (
    <div className="mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="group relative grid w-full overflow-hidden rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] shadow-md lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Image panel */}
        <div className="relative order-first aspect-[16/10] w-full overflow-hidden select-none lg:order-last lg:aspect-auto lg:min-h-[540px] lg:border-l lg:border-[var(--color-ring-bronze)]/20">
          <Image
            src={"/hero.png"}
            fill
            alt="Cast Member Action Close-up"
            className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02] lg:object-top"
            priority
          />
        </div>

        {/* Text panel */}
        <div className="relative z-10 flex flex-col justify-center gap-5 p-5 text-left sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-md bg-[var(--color-accent-orange)] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.16em] text-white uppercase">
              Live track
            </div>
            {story.overallIntensity && (
              <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-ring-bronze)]/40 bg-[#22365d] px-2.5 py-1 font-sans text-[11px] font-bold text-[var(--color-primary-light)] sm:text-[12px]">
                <Flame
                  size={10}
                  className="text-[var(--color-accent-orange)]"
                />
                Intensity criteria //{" "}
                <span className="font-extrabold text-[var(--color-accent-orange)]">
                  {story.overallIntensity}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <span className="flex items-center gap-1.5 font-sans text-[11px] font-extrabold tracking-[0.26em] text-[var(--color-accent-orange)] uppercase sm:text-[12px]">
              <Activity size={10} /> System systemic run
            </span>
            <h1 className="text-3xl leading-[0.95] font-black tracking-tighter text-white uppercase italic sm:text-5xl lg:text-6xl">
              {story.nativityChart?.name || "Current Transit"}
            </h1>
            <p className="max-w-xl text-[12px] leading-relaxed font-medium tracking-wide text-[var(--color-primary-light)]/80 sm:text-sm md:text-base">
              {realityString}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1 sm:pt-2">
            <button
              onClick={() =>
                router.push(`/dashboard/current-story/${story.id}`)
              }
              className="group/btn flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-[var(--color-primary-light)] px-4 py-2.5 text-[11px] font-extrabold tracking-[0.16em] text-[var(--color-primary-dark)] uppercase transition-colors duration-200 hover:bg-[var(--color-accent-orange)] hover:text-white active:scale-95 sm:w-auto sm:px-5"
            >
              Story details
              <ChevronRight
                size={12}
                className="transition-transform duration-300 group-hover/btn:translate-x-0.5"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
