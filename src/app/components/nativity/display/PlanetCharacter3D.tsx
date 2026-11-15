"use client";
import React, { Suspense } from "react";
import { ENTITY_CONFIG } from "./entityConfig";

// Use React.lazy for dynamic import with proper error handling
const PlanetScene = React.lazy(() =>
  import("./PlanetScene").catch((err) => {
    console.error("Failed to load planet scene:", err);
    throw err;
  }),
);

interface PlanetCharacterProps {
  planet: string;
  personality: {
    mood: string;
    traits: string[];
    color: string;
    energy: number;
  };
  isActive: boolean;
  height?: string;
}

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="text-xs text-stone-400">Loading 3D character...</div>
  </div>
);

export default function PlanetCharacter3D({
  planet,
  personality,
  isActive,
  height,
}: PlanetCharacterProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-[var(--color-ring-bronze)]/30 bg-[#0b1424]"
      style={{ height: height ?? ENTITY_CONFIG.CANVAS.height }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <PlanetScene
          planet={planet}
          personality={personality}
          isActive={isActive}
        />
      </Suspense>

      {/* Overlay info */}
      <div className="pointer-events-none absolute top-3 right-3 left-3 z-10 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold tracking-[0.18em] text-[var(--color-primary-light)]/55 uppercase">
            Active agent
          </div>
          <div className="mt-0.5 text-sm font-black tracking-[0.08em] text-white uppercase">
            {planet}
          </div>
        </div>
        <div className="rounded-full border border-[var(--color-ring-bronze)]/30 bg-[#0b1424]/80 px-2.5 py-1 text-[10px] font-bold text-[var(--color-accent-glow)] capitalize">
          {personality.mood}
        </div>
      </div>

      {/* Energy indicator */}
      <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-10">
        <div className="flex items-center justify-between text-[9px] font-extrabold tracking-[0.16em] text-[var(--color-primary-light)]/55 uppercase">
          <span>Energy</span>
          <span>{Math.round(personality.energy * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-primary-light)]/10">
          <div
            className="h-full rounded-full bg-[var(--color-accent-orange)] transition-all duration-500"
            style={{ width: `${personality.energy * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
